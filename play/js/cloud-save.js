// TODO - remove all usage of window here (except for firebase), and instead import each respective class when needed

import notificationManager from './notification.js';
import gameManager from './game.js';
import uiManager from './ui.js';

// Cloud Save Manager for DogeMiner CE
class CloudSaveManager {
    constructor() {
        this.currentUser = null;
        this.isInitialized = false;
    }

    async init() {
        // Wait for Firebase to be available
        if (typeof window.firebase === 'undefined') {
            console.log('Waiting for Firebase to initialize...');
            setTimeout(() => this.init(), 100);
            return;
        }

        // Listen for authentication state changes
        window.firebase.onAuthStateChanged(window.firebase.auth, (user) => {
            this.currentUser = user;
            this.updateUI();
            
            // Automatically load from cloud when user signs in
            if (user) {
                this.loadFromCloudSilent();
            }
        });

        this.isInitialized = true;
        console.log('Cloud Save Manager initialized');
    }

    updateUI() {
        const userInfo = document.getElementById('user-info');
        const signInSection = document.getElementById('sign-in-section');
        const userName = document.getElementById('user-name');
        const localSection = document.getElementById('local-save-section');
        const localButtons = document.getElementById('local-save-buttons');
        const cloudLocalActions = document.getElementById('cloud-local-actions');

        if (this.currentUser) {
            // User is signed in
            userInfo.style.display = 'block';
            signInSection.style.display = 'none';
            userName.textContent = `Signed in as: ${this.currentUser.displayName || this.currentUser.email}`;

            if (cloudLocalActions && localButtons && localButtons.parentElement !== cloudLocalActions) {
                cloudLocalActions.appendChild(localButtons);
            }

            if (localSection) {
                localSection.style.display = 'none';
            }
        } else {
            // User is not signed in
            userInfo.style.display = 'none';
            signInSection.style.display = 'block';

            if (localSection && localButtons && localButtons.parentElement !== localSection) {
                localSection.appendChild(localButtons);
            }

            if (localSection) {
                localSection.style.display = '';
            }
        }
    }

    async signInWithGoogle() {
        try {
            if (!this.isInitialized) {
                notificationManager.showWarning('Firebase is still initializing. Please wait a moment.');
                return;
            }

            notificationManager.showInfo('Signing in with Google...');
            
            const result = await window.firebase.signInWithPopup(
                window.firebase.auth, 
                window.firebase.provider
            );
            
            this.currentUser = result.user;
            notificationManager.showSuccess(`Welcome, ${this.currentUser.displayName}!`);
            
            // Refresh the page to ensure correct planet UI state
            window.location.reload();
            
        } catch (error) {
            console.error('Sign in error:', error);
            notificationManager.showError('Failed to sign in. Please try again.');
        }
    }

    async signOutUser() {
        try {
            await window.firebase.signOut(window.firebase.auth);
            this.currentUser = null;
            notificationManager.showInfo('Signed out successfully');
        } catch (error) {
            console.error('Sign out error:', error);
            notificationManager.showError('Failed to sign out');
        }
    }

    async saveToCloud() {
        if (!this.currentUser) {
            notificationManager.showWarning('Please sign in first');
            return;
        }

        try {
            notificationManager.showInfo('Saving to cloud...');
            
            // Get current game state
            const gameData = this.getGameState();
            console.log('Manual save - gameData:', gameData);
            
            if (gameData === null) {
                notificationManager.showError('Cannot save: Game not initialized');
                return;
            }
            
            // Save to Firestore
            const userDocRef = window.firebase.doc(window.firebase.db, 'users', this.currentUser.uid);
            await window.firebase.setDoc(userDocRef, {
                gameData: gameData,
                lastSaved: new Date().toISOString(),
                version: '1.0.0'
            }, { merge: true });

            notificationManager.showSuccess('Game saved to cloud successfully!');
            
        } catch (error) {
            console.error('Cloud save error:', error);
            notificationManager.showError('Failed to save to cloud. Please try again.');
        }
    }

    async saveToCloudSilent() {
        if (!this.currentUser) {
            return;
        }

        try {
            // Get current game state
            const gameData = this.getGameState();
            console.log('Silent save - gameData:', gameData);
            
            if (gameData === null) {
                console.error('Cannot save to cloud: gameData is null');
                return;
            }
            
            // Save to Firestore silently
            const userDocRef = window.firebase.doc(window.firebase.db, 'users', this.currentUser.uid);
            await window.firebase.setDoc(userDocRef, {
                gameData: gameData,
                lastSaved: new Date().toISOString(),
                version: '1.0.0'
            }, { merge: true });

            console.log('Game auto-saved to cloud');
            
        } catch (error) {
            console.error('Silent cloud save error:', error);
        }
    }

    async deleteCloudSave() {
        if (!this.currentUser) {
            console.log('No user signed in, skipping cloud save deletion');
            return;
        }

        try {
            // Delete the user's save data from Firestore
            const userDocRef = window.firebase.doc(window.firebase.db, 'users', this.currentUser.uid);
            await window.firebase.deleteDoc(userDocRef);
            console.log('Cloud save deleted successfully');
            
        } catch (error) {
            console.error('Failed to delete cloud save:', error);
        }
    }

    async loadFromCloud() {
        if (!this.currentUser) {
            notificationManager.showWarning('Please sign in first');
            return;
        }

        try {
            notificationManager.showInfo('Loading from cloud...');
            
            // Get data from Firestore
            const userDocRef = window.firebase.doc(window.firebase.db, 'users', this.currentUser.uid);
            const docSnap = await window.firebase.getDoc(userDocRef);

            if (docSnap.exists()) {
                const data = docSnap.data();
                if (data.gameData) {
                    this.loadGameState(data.gameData);
                    notificationManager.showSuccess('Game loaded from cloud successfully!');
                } else {
                    notificationManager.showWarning('No save data found in cloud');
                }
            } else {
                notificationManager.showWarning('No save data found in cloud');
            }
            
        } catch (error) {
            console.error('Cloud load error:', error);
            notificationManager.showError('Failed to load from cloud. Please try again.');
        }
    }

    async loadFromCloudSilent() {
        if (!this.currentUser) {
            return;
        }

        try {
            // Get data from Firestore
            const userDocRef = window.firebase.doc(window.firebase.db, 'users', this.currentUser.uid);
            const docSnap = await window.firebase.getDoc(userDocRef);

            if (docSnap.exists()) {
                const data = docSnap.data();
                if (data.gameData) {
                    this.loadGameState(data.gameData);
                    console.log('Game auto-loaded from cloud');
                }
            }
            
        } catch (error) {
            console.error('Silent cloud load error:', error);
        }
    }

    /* TODO - cloudSave should use shared functions with save, perhaps a localSave.js class would be appropriate
     (or merge cloudSave into save, although we may want to keep them separate) 
     In any case, there's lots of shared logic between cloudSave and save */
    getGameState() {
        // Get the current game instance
        console.log('Getting game state...');
        
        const gameData = {
            dogecoins: gameManager.dogecoins || 0,
            dps: gameManager.dps || 0,
            helpers: gameManager.helpers || {},
            upgrades: gameManager.upgrades || {},
            totalMined: gameManager.totalMined || 0,
            totalClicks: gameManager.totalClicks || 0,
            currentLevel: gameManager.currentLevel || 'earth',
            currentPickaxe: gameManager.currentPickaxe || 'standard',
            playTime: gameManager.playTime || 0,
            highestDps: gameManager.highestDps || 0,
            achievements: gameManager.achievements || {},
            settings: {
                soundEnabled: gameManager.soundEnabled !== false,
                musicEnabled: gameManager.musicEnabled !== false,
                notificationsEnabled: gameManager.notificationsEnabled !== false,
                autoSaveEnabled: gameManager.autoSaveEnabled !== false
            }
        };
        console.log('Game data to save:', gameData);
        return gameData;
    }

    loadGameState(gameData) {
        // Load the game state into the current game instance
        if (typeof gameManager !== 'undefined' && gameData) {
            gameManager.dogecoins = gameData.dogecoins || 0;
            gameManager.dps = gameData.dps || 0;
            gameManager.helpers = gameData.helpers || {};
            gameManager.upgrades = gameData.upgrades || {};
            gameManager.totalMined = gameData.totalMined || 0;
            gameManager.totalClicks = gameData.totalClicks || 0;
            gameManager.currentLevel = gameData.currentLevel || 'earth';
            gameManager.currentPickaxe = gameData.currentPickaxe || 'standard';
            gameManager.playTime = gameData.playTime || 0;
            gameManager.highestDps = gameData.highestDps || 0;
            gameManager.achievements = gameData.achievements || {};
            
            // Load settings
            if (gameData.settings) {
                gameManager.soundEnabled = gameData.settings.soundEnabled !== undefined ? gameData.settings.soundEnabled : true;
                gameManager.musicEnabled = gameData.settings.musicEnabled !== undefined ? gameData.settings.musicEnabled : true;
                gameManager.notificationsEnabled = gameData.settings.notificationsEnabled !== undefined ? gameData.settings.notificationsEnabled : true;
                gameManager.autoSaveEnabled = gameData.settings.autoSaveEnabled !== undefined ? gameData.settings.autoSaveEnabled : true;
            }

            // Apply planet-specific visuals
            const body = document.body;
            if (body) {
                if (gameManager.currentLevel === 'moon') {
                    body.classList.add('moon-theme');
                } else {
                    body.classList.remove('moon-theme');
                }
            }

            const mainCharacter = document.getElementById('main-character');
            const mainRock = document.getElementById('main-rock');
            const platform = document.getElementById('platform');

            if (mainCharacter && mainRock) {
                if (gameManager.currentLevel === 'moon') {
                    mainCharacter.src = 'assets/general/character/spacehelmet.png';
                    mainRock.src = 'assets/general/rocks/moon.png';
                    if (platform) {
                        platform.src = '../assets/quickUI/dogeplatformmoon.png';
                    }
                } else {
                    mainCharacter.src = 'assets/general/character/standard.png';
                    mainRock.src = 'assets/general/rocks/earth.png';
                    if (platform) {
                        platform.src = '../assets/quickUI/dogeplatform.png';
                    }
                }
            }

            // Update UI
            gameManager.updateUI();
            gameManager.updateDPS();

            // Update settings checkboxes
            document.getElementById('sound-enabled').checked = gameManager.soundEnabled;
            document.getElementById('music-enabled').checked = gameManager.musicEnabled;
            document.getElementById('notifications-enabled').checked = gameManager.notificationsEnabled;
            document.getElementById('auto-save-enabled').checked = gameManager.autoSaveEnabled;

            uiManager.updateBackground(gameManager.currentLevel);
            uiManager.initializePlanetTabs?.();
            if (gameManager.currentLevel === 'moon') {
                uiManager.hideMoonLocked?.();
                uiManager.updateShopContent?.();
            }
        }
    }
}

const instance = new CloudSaveManager();
export default instance;