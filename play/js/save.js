import gameManager from "./game.js";
import audioManager from "./audio.js";
import shopManager from "./shop.js";
import uiManager from "./ui.js";
import cloudSaveManager from "./cloudSave.js";

// DogeMiner: Community Edition - Save/Load System
class SaveManager {
    constructor() {}

    init() {
        this.saveKey = 'dogeminer_ce_save';
        this.backupKey = 'dogeminer_ce_backup';
        this.autoSaveInterval = 30000; // 30 seconds
        this.lastSave = Date.now();
        
        this.setupAutoSave();
        this.setupSaveFunctions();
        this.setupSettingsListeners();
    }
    
    setupAutoSave() {
        setInterval(() => {
            this.autoSave();
        }, this.autoSaveInterval);
        
        // Save before page unload
        window.addEventListener('beforeunload', () => {
            this.saveGame();
        });
    }
    
    setupSaveFunctions() {
        window.saveGame = () => {
            this.saveGame();
        };
        
        window.loadGame = () => {
            this.loadGame();
        };
        
        window.exportSave = () => {
            this.exportSave();
        };
        
        window.importSave = () => {
            this.importSave();
        };
        
        window.resetGame = () => {
            this.resetGame();
        };
    }
    
    setupSettingsListeners() {
        // Listen for notifications setting changes
        const notificationsCheckbox = document.getElementById('notifications-enabled');
        if (notificationsCheckbox) {
            notificationsCheckbox.addEventListener('change', (e) => {
                gameManager.notificationsEnabled = e.target.checked;

                audioManager.playSound('check');
                
                // Trigger auto-save to save settings (don't show notification)
                this.saveGame(false);
            });
        }
        
        // Listen for auto-save setting changes
        const autoSaveCheckbox = document.getElementById('auto-save-enabled');
        if (autoSaveCheckbox) {
            autoSaveCheckbox.addEventListener('change', (e) => {
                gameManager.autoSaveEnabled = e.target.checked;
                // Play check sound
                audioManager.playSound('check');
                // Trigger auto-save to save settings (don't show notification)
                this.saveGame(false);
            });
        }
    }
    
    saveGame(showNotification = true) {
        try {
            const saveData = this.createSaveData();
            const saveString = JSON.stringify(saveData);
            
            // Save to localStorage
            localStorage.setItem(this.saveKey, saveString);
            
            // Create backup
            localStorage.setItem(this.backupKey, saveString);
            
            this.lastSave = Date.now();
            
            // Only show notification if requested and notifications are enabled
            if (showNotification && gameManager.notificationsEnabled) {
                gameManager.showNotification('Game saved successfully!');
            }
            
            console.log('Game saved:', saveData);
            return true;
        } catch (error) {
            console.error('Error saving game:', error);
            if (gameManager.notificationsEnabled) {
                gameManager.showNotification('Error saving game!');
            }
            return false;
        }
    }
    
    loadGame() {
        try {
            const saveString = localStorage.getItem(this.saveKey);
            if (!saveString) {
                gameManager.showNotification('No save data found!');
                return false;
            }
            
            const saveData = JSON.parse(saveString);
            this.applySaveData(saveData);
            
            // Notification handled by main.js
            console.log('Game loaded:', saveData);
            return true;
        } catch (error) {
            console.error('Error loading game:', error);
            
            // Try to load backup
            if (this.loadBackup()) {
                gameManager.showNotification('Loaded from backup save!');
                return true;
            }
            
            gameManager.showNotification('Error loading game!');
            return false;
        }
    }
    
    loadBackup() {
        try {
            const backupString = localStorage.getItem(this.backupKey);
            if (!backupString) return false;
            
            const saveData = JSON.parse(backupString);
            this.applySaveData(saveData);
            
            console.log('Loaded from backup:', saveData);
            return true;
        } catch (error) {
            console.error('Error loading backup:', error);
            return false;
        }
    }
    
    createSaveData() {
        const serializePlacedHelper = (helper) => {
            if (!helper) return null;
            const saveHelper = {
                type: helper.type,
                x: helper.x ?? 0,
                y: helper.y ?? 0,
                id: helper.id ?? (Date.now() + Math.random()),
                isMining: !!helper.isMining
            };

            if (helper.name) {
                saveHelper.name = helper.name;
            }

            return saveHelper;
        };

        const currentPlaced = Array.isArray(gameManager.placedHelpers) ? gameManager.placedHelpers : [];

        if (gameManager.currentLevel === 'earth') {
            gameManager.earthPlacedHelpers = [...currentPlaced];
        } else if (gameManager.currentLevel === 'moon') {
            gameManager.moonPlacedHelpers = [...currentPlaced];
        } else if (gameManager.currentLevel === 'mars') {
            gameManager.marsPlacedHelpers = [...currentPlaced];
        } else if (gameManager.currentLevel === 'jupiter') {
            gameManager.jupiterPlacedHelpers = [...currentPlaced];
        } else if (gameManager.currentLevel === 'titan') {
            // Save titan placed helpers when creating save data from Titan planet
            gameManager.titanPlacedHelpers = [...currentPlaced];
        }

        const earthPlacedHelpers = Array.isArray(gameManager.earthPlacedHelpers)
            ? gameManager.earthPlacedHelpers.map(serializePlacedHelper).filter(Boolean)
            : [];

        const moonPlacedHelpers = Array.isArray(gameManager.moonPlacedHelpers)
            ? gameManager.moonPlacedHelpers.map(serializePlacedHelper).filter(Boolean)
            : [];

        const marsPlacedHelpers = Array.isArray(gameManager.marsPlacedHelpers)
            ? gameManager.marsPlacedHelpers.map(serializePlacedHelper).filter(Boolean)
            : [];

        const jupiterPlacedHelpers = Array.isArray(gameManager.jupiterPlacedHelpers)
            ? gameManager.jupiterPlacedHelpers.map(serializePlacedHelper).filter(Boolean)
            : [];

        const titanPlacedHelpers = Array.isArray(gameManager.titanPlacedHelpers)
            ? gameManager.titanPlacedHelpers.map(serializePlacedHelper).filter(Boolean)
            : [];

        const helperData = currentPlaced.map(serializePlacedHelper).filter(Boolean);

        return {
            version: '1.0.0',
            timestamp: Date.now(),
            dogecoins: gameManager.dogecoins,
            totalMined: gameManager.totalMined,
            totalClicks: gameManager.totalClicks,
            dps: gameManager.dps,
            highestDps: gameManager.highestDps,
            currentLevel: gameManager.currentLevel,
            helpers: gameManager.helpers,
            moonHelpers: gameManager.moonHelpers,
            marsHelpers: gameManager.marsHelpers,
            jupiterHelpers: gameManager.jupiterHelpers, // Keep Jupiter helper ownership synced across reloads.
            titanHelpers: gameManager.titanHelpers, // Keep Titan helper ownership synced across reloads.
            pickaxes: gameManager.pickaxes,
            currentPickaxe: gameManager.currentPickaxe,
            upgrades: gameManager.upgrades || {},
            placedHelpers: helperData,
            earthPlacedHelpers,
            moonPlacedHelpers,
            marsPlacedHelpers,
            jupiterPlacedHelpers,
            titanPlacedHelpers,
            statistics: {
                totalPlayTime: gameManager.totalPlayTime || 0,
                highestDps: gameManager.highestDps || 0,
                helpersBought: gameManager.helpersBought || 0,
                pickaxesBought: gameManager.pickaxesBought || 0,
                achievements: gameManager.achievements || [],
                startTime: gameManager.startTime || Date.now()
            },
            settings: {
                soundEnabled: gameManager.soundEnabled !== false,
                musicEnabled: gameManager.musicEnabled !== false,
                notificationsEnabled: gameManager.notificationsEnabled !== false,
                autoSaveEnabled: gameManager.autoSaveEnabled !== false
            },
            cutscenes: {
                moonLaunch: !!gameManager.hasPlayedMoonLaunch
            }
        };
    }

    applySaveData(saveData) {
        if (!this.validateSaveData(saveData)) {
            throw new Error('Invalid save data');
        }

        gameManager.dogecoins = saveData.dogecoins || 0;
        gameManager.totalMined = saveData.totalMined || 0;
        gameManager.totalClicks = saveData.totalClicks || 0;
        gameManager.dps = saveData.dps || 0;
        gameManager.highestDps = saveData.highestDps || 0;
        gameManager.currentLevel = saveData.currentLevel || 'earth';
        gameManager.isTransitioning = false;

        gameManager.helpers = Array.isArray(saveData.helpers)
            ? saveData.helpers.map(helper => ({ ...helper }))
            : [];
        gameManager.moonHelpers = Array.isArray(saveData.moonHelpers)
            ? saveData.moonHelpers.map(helper => ({ ...helper }))
            : [];
        gameManager.marsHelpers = Array.isArray(saveData.marsHelpers)
            ? saveData.marsHelpers.map(helper => ({ ...helper }))
            : [];
        gameManager.jupiterHelpers = Array.isArray(saveData.jupiterHelpers)
            ? saveData.jupiterHelpers.map(helper => ({ ...helper }))
            : []; // Preserve Jupiter helper ownership for reloads.
        gameManager.titanHelpers = Array.isArray(saveData.titanHelpers)
            ? saveData.titanHelpers.map(helper => ({ ...helper }))
            : []; // Preserve Titan helper ownership for reloads.
        gameManager.pickaxes = saveData.pickaxes || ['standard'];
        gameManager.currentPickaxe = saveData.currentPickaxe || 'standard';
        gameManager.upgrades = saveData.upgrades || {};

        const rebuildPlacedHelpers = (helpersArray = [], planet = 'earth') => {
            if (!Array.isArray(helpersArray)) return [];

            const shopCategory = shopManager.shopData.helpers[planet];

            return helpersArray
                .map(savedHelper => {
                    if (!savedHelper) return null;

                    // Only use helpers that exist in the current planet's shop category
                    const shopHelperData = shopCategory[savedHelper.type];
                    if (!shopHelperData) {
                        // Helper type doesn't exist on this planet, skip it
                        console.warn(`Skipping helper type '${savedHelper.type}' on ${planet} - not found in shop category`);
                        return null;
                    }

                    const helper = {
                        type: savedHelper.type,
                        x: savedHelper.x ?? 0,
                        y: savedHelper.y ?? 0,
                        id: savedHelper.id ?? (Date.now() + Math.random()),
                        isMining: !!savedHelper.isMining,
                        helper: shopHelperData,
                        dps: shopHelperData?.baseDps || 0
                    };

                    const rawName = savedHelper.name;
                    if (rawName && rawName !== savedHelper.type) {
                        helper.name = rawName;
                    } else if (shopHelperData?.name) {
                        helper.name = shopHelperData.name;
                    }

                    return helper;
                })
                .filter(Boolean);
        };

        let rawEarth = Array.isArray(saveData.earthPlacedHelpers) ? saveData.earthPlacedHelpers : [];
        let rawMoon = Array.isArray(saveData.moonPlacedHelpers) ? saveData.moonPlacedHelpers : [];
        let rawMars = Array.isArray(saveData.marsPlacedHelpers) ? saveData.marsPlacedHelpers : [];
        let rawJupiter = Array.isArray(saveData.jupiterPlacedHelpers) ? saveData.jupiterPlacedHelpers : [];
        let rawTitan = Array.isArray(saveData.titanPlacedHelpers) ? saveData.titanPlacedHelpers : [];

        if (!rawEarth.length && !rawMoon.length && !rawMars.length && !rawJupiter.length && !rawTitan.length && Array.isArray(saveData.placedHelpers)) {
            const savedLevel = saveData.currentLevel || 'earth';
            if (savedLevel === 'moon') {
                rawMoon = saveData.placedHelpers;
            } else if (savedLevel === 'mars') {
                rawMars = saveData.placedHelpers;
            } else if (savedLevel === 'jupiter') {
                rawJupiter = saveData.placedHelpers;
            } else if (savedLevel === 'titan') {
                rawTitan = saveData.placedHelpers;
            } else {
                rawEarth = saveData.placedHelpers;
            }
        }

        gameManager.earthPlacedHelpers = rebuildPlacedHelpers(rawEarth, 'earth');
        gameManager.moonPlacedHelpers = rebuildPlacedHelpers(rawMoon, 'moon');
        gameManager.marsPlacedHelpers = rebuildPlacedHelpers(rawMars, 'mars');
        gameManager.jupiterPlacedHelpers = rebuildPlacedHelpers(rawJupiter, 'jupiter');
        gameManager.titanPlacedHelpers = rebuildPlacedHelpers(rawTitan, 'titan');

        const helperListsForUnlock = [
            gameManager.helpers,
            gameManager.moonHelpers,
            gameManager.marsHelpers,
            gameManager.jupiterHelpers,
            gameManager.titanHelpers,
            gameManager.earthPlacedHelpers,
            gameManager.moonPlacedHelpers,
            gameManager.marsPlacedHelpers,
            gameManager.jupiterPlacedHelpers,
            gameManager.titanPlacedHelpers
        ]; // Include all planet helpers when checking unlock prerequisites.

        const hasMarsRocket = helperListsForUnlock.some(list =>
            Array.isArray(list) && list.some(helper => helper && helper.type === 'marsRocket')
        );

        if (hasMarsRocket) {
            gameManager.hasPlayedMoonLaunch = true;
        }

        // Add missing helpers (owned but not placed) - spawn them in a clump for manual placement
        const spawnMissingHelpers = (ownedHelpers, placedHelpers, planet) => {
            if (!Array.isArray(ownedHelpers) || !Array.isArray(placedHelpers)) return placedHelpers;

            // Count how many of each type are already placed
            const placedCounts = {};
            placedHelpers.forEach(helper => {
                placedCounts[helper.type] = (placedCounts[helper.type] || 0) + 1;
            });

            // Count how many of each type are owned
            const ownedCounts = {};
            ownedHelpers.forEach(helper => {
                ownedCounts[helper.type] = (ownedCounts[helper.type] || 0) + 1;
            });

            // Get shop category for this planet
            const shopCategory = shopManager.shopData.helpers[planet];

            // Spawn missing helpers in a clump (bottom-left of panel, away from rock)
            const baseX = 120; // Far left side of panel
            const baseY = 520; // Bottom area, below the rock
            let spawnIndex = 0;

            for (const [type, ownedCount] of Object.entries(ownedCounts)) {
                const placedCount = placedCounts[type] || 0;
                const missingCount = ownedCount - placedCount;

                if (missingCount > 0) {
                    const helperData = shopCategory?.[type];
                    if (helperData) {
                        for (let i = 0; i < missingCount; i++) {
                            // Create clump pattern with small random offsets
                            const offsetX = (Math.random() - 0.5) * 80;
                            const offsetY = (Math.random() - 0.5) * 80;
                            
                            placedHelpers.push({
                                type: type,
                                x: baseX + offsetX,
                                y: baseY + offsetY,
                                id: Date.now() + Math.random(),
                                isMining: false,
                                helper: helperData,
                                dps: helperData.baseDps
                            });
                            spawnIndex++;
                        }
                    }
                }
            }

            return placedHelpers;
        };

        gameManager.earthPlacedHelpers = spawnMissingHelpers(gameManager.helpers, gameManager.earthPlacedHelpers, 'earth');
        gameManager.moonPlacedHelpers = spawnMissingHelpers(gameManager.moonHelpers, gameManager.moonPlacedHelpers, 'moon');
        gameManager.marsPlacedHelpers = spawnMissingHelpers(gameManager.marsHelpers, gameManager.marsPlacedHelpers, 'mars');
        gameManager.jupiterPlacedHelpers = spawnMissingHelpers(gameManager.jupiterHelpers, gameManager.jupiterPlacedHelpers, 'jupiter');
        gameManager.titanPlacedHelpers = spawnMissingHelpers(gameManager.titanHelpers, gameManager.titanPlacedHelpers, 'titan');

        if (gameManager.currentLevel === 'moon') {
            gameManager.placedHelpers = [...gameManager.moonPlacedHelpers];
        } else if (gameManager.currentLevel === 'mars') {
            gameManager.placedHelpers = [...gameManager.marsPlacedHelpers];
        } else if (gameManager.currentLevel === 'jupiter') {
            gameManager.placedHelpers = [...gameManager.jupiterPlacedHelpers];
        } else if (gameManager.currentLevel === 'titan') {
            // Load Titan placed helpers when on Titan to prevent Earth helpers from appearing
            gameManager.placedHelpers = [...gameManager.titanPlacedHelpers];
        } else {
            gameManager.placedHelpers = [...gameManager.earthPlacedHelpers];
        }

        const body = document.body;
        if (body) {
            const level = gameManager.currentLevel;
            document.body.classList.toggle('moon-theme', level === 'moon');
            document.body.classList.toggle('planet-mars', level === 'mars');
            document.body.classList.toggle('planet-jupiter', level === 'jupiter');
            document.body.classList.toggle('planet-titan', level === 'titan');
        }

        gameManager.recreateHelperSprites();
        gameManager.updateShopPrices();

        gameManager.totalPlayTime = saveData.statistics?.totalPlayTime || 0;
        gameManager.helpersBought = saveData.statistics?.helpersBought || 0;
        gameManager.pickaxesBought = saveData.statistics?.pickaxesBought || 0;
        gameManager.achievements = saveData.statistics?.achievements || [];
        gameManager.startTime = saveData.statistics?.startTime || Date.now();

        gameManager.soundEnabled = saveData.settings?.soundEnabled !== false;
        gameManager.musicEnabled = saveData.settings?.musicEnabled !== false;
        gameManager.notificationsEnabled = saveData.settings?.notificationsEnabled !== false;
        gameManager.autoSaveEnabled = saveData.settings?.autoSaveEnabled !== false;
        gameManager.hasPlayedMoonLaunch = saveData.cutscenes?.moonLaunch || false;

        audioManager.soundEnabled = gameManager.soundEnabled;
        audioManager.musicEnabled = gameManager.musicEnabled;

        const soundCheckbox = document.getElementById('sound-enabled');
        const musicCheckbox = document.getElementById('music-enabled');
        const notificationsCheckbox = document.getElementById('notifications-enabled');
        const autoSaveCheckbox = document.getElementById('auto-save-enabled');

        if (soundCheckbox) soundCheckbox.checked = gameManager.soundEnabled;
        if (musicCheckbox) musicCheckbox.checked = gameManager.musicEnabled;
        if (notificationsCheckbox) notificationsCheckbox.checked = gameManager.notificationsEnabled;
        if (autoSaveCheckbox) autoSaveCheckbox.checked = gameManager.autoSaveEnabled;

        gameManager.updateDPS();
        gameManager.updateUI();

        if (gameManager.currentLevel === 'moon') {
            document.body.classList.add('moon-theme');
            document.body.classList.remove('planet-mars');
            document.body.classList.remove('planet-jupiter');
        } else if (gameManager.currentLevel === 'mars') {
            document.body.classList.add('planet-mars');
            document.body.classList.remove('moon-theme');
            document.body.classList.remove('planet-jupiter');
        } else if (gameManager.currentLevel === 'jupiter') {
            document.body.classList.add('planet-jupiter');
            document.body.classList.remove('moon-theme');
            document.body.classList.remove('planet-mars');
        } else {
            document.body.classList.remove('moon-theme');
            document.body.classList.remove('planet-mars');
            document.body.classList.remove('planet-jupiter');
        }

        uiManager.updateBackground(gameManager.currentLevel);
        if (gameManager.marsHelpers.length && !gameManager.moonHelpers.some(helper => helper.type === 'marsRocket')) {
            const hasMarsRocketInMarsHelpers = gameManager.marsHelpers.some(helper => helper.type === 'marsRocket');
            if (hasMarsRocketInMarsHelpers) {
                gameManager.hasPlayedMoonLaunch = true;
                gameManager.moonHelpers.push(...gameManager.marsHelpers.filter(helper => helper.type === 'marsRocket'));
            }
        }

        uiManager.initializePlanetTabs?.();
        uiManager.updatePlanetTabVisibility?.();

        if (gameManager.hasPlayedMoonLaunch) {
            uiManager.hideMoonLocked?.();
        }

        uiManager.updateShopContent?.();
    }

    validateSaveData(saveData) {
        if (!saveData || typeof saveData !== 'object') {
            return false;
        }

        const requiredFields = ['version', 'timestamp', 'dogecoins'];
        for (const field of requiredFields) {
            if (!(field in saveData)) {
                return false;
            }
        }

        if (typeof saveData.dogecoins !== 'number' || saveData.dogecoins < 0) {
            return false;
        }

        if (typeof saveData.totalMined !== 'number' || saveData.totalMined < 0) {
            return false;
        }

        if (typeof saveData.totalClicks !== 'number' || saveData.totalClicks < 0) {
            return false;
        }

        return true;
    }

    autoSave() {
        if (gameManager.autoSaveEnabled !== false) {
            this.saveGame();

            if (cloudSaveManager.currentUser) {
                cloudSaveManager.saveToCloudSilent();
            }
        }
    }

    exportSave() {
        try {
            const saveData = this.createSaveData();
            const saveString = JSON.stringify(saveData, null, 2);

            const blob = new Blob([saveString], { type: 'application/json' });
            const url = URL.createObjectURL(blob);

            const a = document.createElement('a');
            a.href = url;
            a.download = `dogeminer_ce_save_${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);

            URL.revokeObjectURL(url);

            gameManager.showNotification('Save exported successfully!');
            return true;
        } catch (error) {
            console.error('Error exporting save:', error);
            gameManager.showNotification('Error exporting save!');
            return false;
        }
    }

    importSave() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';

        input.onchange = (event) => {
            const file = event.target.files[0];
            if (!file) return;
            
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const saveData = JSON.parse(e.target.result);
                    
                    if (this.validateSaveData(saveData)) {
                        if (confirm('This will overwrite your current save. Continue?')) {
                            this.applySaveData(saveData);
                            this.saveGame();
                            gameManager.showNotification('Save imported successfully!');
                        }
                    } else {
                        gameManager.showNotification('Invalid save file!');
                    }
                } catch (error) {
                    console.error('Error importing save:', error);
                    gameManager.showNotification('Error importing save!');
                }
            };
            
            reader.readAsText(file);
        };
        
        input.click();
    }
    
    async resetGame() {
        if (confirm('Are you sure you want to reset your game? This cannot be undone!')) {
            if (confirm('This will permanently delete all your progress. Are you absolutely sure?')) {
                // Clear all possible save data
                localStorage.removeItem(this.saveKey);
                localStorage.removeItem(this.backupKey);
                localStorage.removeItem('dogeminer_save'); // Remove old save key
                
                // Clear any other dogeminer-related keys
                for (let i = 0; i < localStorage.length; i++) {
                    const key = localStorage.key(i);
                    if (key && key.toLowerCase().includes('dogeminer')) {
                        localStorage.removeItem(key);
                    }
                }
                
                // Delete cloud save if user is signed in to prevent restore on reload
                if (cloudSaveManager.currentUser) {
                    await cloudSaveManager.deleteCloudSave();
                }
                
                // Reset game state directly
                gameManager.dogecoins = 0;
                gameManager.totalMined = 0;
                gameManager.totalClicks = 0;
                gameManager.dps = 0;
                gameManager.helpers = [];
                gameManager.moonHelpers = [];
                gameManager.marsHelpers = [];
                gameManager.jupiterHelpers = [];
                gameManager.titanHelpers = [];
                gameManager.earthPlacedHelpers = [];
                gameManager.moonPlacedHelpers = [];
                gameManager.marsPlacedHelpers = [];
                gameManager.jupiterPlacedHelpers = [];
                gameManager.titanPlacedHelpers = [];
                gameManager.placedHelpers = [];
                gameManager.helpersOnCursor = [];
                gameManager.placementQueue = [];
                gameManager.isPlacingHelpers = false;
                gameManager.upgrades = [];
                gameManager.pickaxes = [];
                gameManager.currentPickaxe = 'standard';
                gameManager.currentLevel = 'earth';
                gameManager.hasPlayedMoonLaunch = false;
                gameManager.isCutscenePlaying = false;
                
                // Clear all helper sprites from the DOM
                gameManager.clearAllHelperSprites();
                
                // Update UI immediately
                gameManager.updateUI();
                gameManager.updateDPS();
                
                // Show notification
                gameManager.showNotification('Game reset successfully!');
                
                // Reload after a short delay to ensure UI updates
                setTimeout(() => {
                    location.reload();
                }, 1000);
            }
        }
    }
    
    getSaveInfo() {
        const saveString = localStorage.getItem(this.saveKey);
        if (!saveString) return null;
        
        try {
            const saveData = JSON.parse(saveString);
            return {
                version: saveData.version,
                timestamp: saveData.timestamp,
                dogecoins: saveData.dogecoins,
                totalMined: saveData.totalMined,
                totalClicks: saveData.totalClicks,
                helpers: saveData.helpers?.length || 0,
                pickaxes: saveData.pickaxes?.length || 0
            };
        } catch (error) {
            console.error('Error reading save info:', error);
            return null;
        }
    }
    
    // Cloud save functionality (placeholder for future implementation)
    async saveToCloud() {
        // This would integrate with a cloud service
        console.log('Cloud save not implemented yet');
        return false;
    }
    
    async loadFromCloud() {
        // This would integrate with a cloud service
        console.log('Cloud load not implemented yet');
        return false;
    }
    
    // Save validation and repair
    repairSave() {
        try {
            const saveString = localStorage.getItem(this.saveKey);
            if (!saveString) return false;
            
            const saveData = JSON.parse(saveString);
            
            // Repair common issues
            if (!saveData.helpers) saveData.helpers = [];
            if (!saveData.pickaxes) saveData.pickaxes = ['standard'];
            if (!saveData.upgrades) saveData.upgrades = {};
            if (!saveData.statistics) saveData.statistics = {};
            if (!saveData.settings) saveData.settings = {};
            
            // Ensure minimum values
            saveData.dogecoins = Math.max(0, saveData.dogecoins || 0);
            saveData.totalMined = Math.max(0, saveData.totalMined || 0);
            saveData.totalClicks = Math.max(0, saveData.totalClicks || 0);
            
            // Save repaired data
            localStorage.setItem(this.saveKey, JSON.stringify(saveData));
            
            gameManager.showNotification('Save data repaired!');
            return true;
        } catch (error) {
            console.error('Error repairing save:', error);
            return false;
        }
    }
}

const instance = new SaveManager();
export default instance;