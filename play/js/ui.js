// DogeMiner: Community Edition - UI Management
class UIManager {
    constructor(game) {
        this.game = game;
        this.activePanel = 'shop-tab'; // Shop tab is active by default
        this.currentShopTab = 'helpers';
        
        this.setupUI();
        this.initializePlanetTabs(); // Initialize planet tabs based on saved state
    }
    
    setupUI() {
        this.setupPanels();
        this.setupShop();
        this.setupStats();
        this.setupLoading();
    }
    
    setupPanels() {
        // Main tab switching functionality
        window.switchMainTab = (tabName) => {
            // Check if this tab is already active
            const currentTab = this.activePanel.replace('-tab', '');
            const isTabAlreadyActive = currentTab === tabName;
            
            if (isTabAlreadyActive) return;
            
            // Define tab order for swipe direction
            const tabOrder = ['shop', 'upgrades', 'achievements', 'settings'];
            const currentIndex = tabOrder.indexOf(currentTab);
            const targetIndex = tabOrder.indexOf(tabName);
            const isMovingRight = targetIndex > currentIndex;
            
            // Get current and target tab elements
            const currentTabElement = document.getElementById(currentTab + '-tab');
            const targetTabElement = document.getElementById(tabName + '-tab');
            
            if (!currentTabElement || !targetTabElement) return;
            
            // Update tab buttons
            document.querySelectorAll('.tab-btn').forEach(btn => {
                btn.classList.remove('active');
            });
            event.target.classList.add('active');
            
            // Add slide-out animation to current tab
            if (isMovingRight) {
                currentTabElement.classList.add('slide-out-left');
            } else {
                currentTabElement.classList.add('slide-out-right');
            }
            
            // After animation, switch tabs
            setTimeout(() => {
                // Remove all active classes and animation classes
            document.querySelectorAll('.tab-content').forEach(content => {
                    content.classList.remove('active', 'slide-out-left', 'slide-out-right', 'slide-in-left', 'slide-in-right');
            });
                
                // Add new active tab with slide-in animation
                targetTabElement.classList.add('active');
                if (isMovingRight) {
                    targetTabElement.classList.add('slide-in-right');
                } else {
                    targetTabElement.classList.add('slide-in-left');
                }
                
                // Remove animation classes after animation completes
                setTimeout(() => {
                    targetTabElement.classList.remove('slide-in-right', 'slide-in-left');
                }, 300);
            }, 50); // Small delay to let slide-out start
            
            // Set active panel
            this.activePanel = tabName + '-tab';
            
            // Play sound
            if (window.audioManager) {
                audioManager.playSound('swipe');
            }
            
            // Update shop content if switching to shop
            if (tabName === 'shop') {
                this.updateShopContent();
            }
        };
        
        // Planet tab switching with loading transition
        window.switchPlanet = (planetName) => {
            // Don't allow switching if already on this planet or if transition is in progress
            if (this.game.currentLevel === planetName || this.game.isTransitioning) return;
            
            // Check if Moon is locked (no Space Rockets owned)
            if (planetName === 'moon') {
                const spaceRocketCount = this.game.helpers.filter(h => h.type === 'spaceRocket').length;
                
                if (spaceRocketCount === 0) {
                    // Play locked sound
                    if (window.audioManager) {
                        audioManager.playSound('uhoh');
                    }
                    
                    // Show locked overlay
                    this.showMoonLocked();
                    return; // Don't switch planets
                }
            }
            
            // Update planet tab buttons
            document.querySelectorAll('.planet-tab').forEach(btn => {
                btn.classList.remove('active');
            });
            event.target.closest('.planet-tab').classList.add('active');
            
            // Set transitioning flag
            this.game.isTransitioning = true;
            
            // Show loading screen with appropriate message
            const loadingInfo = document.getElementById('loading-info');
            if (loadingInfo) {
                loadingInfo.textContent = planetName === 'earth' ? 'Returning to Earth...' : 'Launching to Moon...';
            }
            
            // Show loading screen
            window.showLoadingScreen();
            
            // Use timeout to ensure loading screen is visible before processing
            setTimeout(() => {
                // First save the current state
                if (this.game.currentLevel === 'earth') {
                    // Save earth placed helpers
                    this.game.earthPlacedHelpers = [...this.game.placedHelpers];
                } else if (this.game.currentLevel === 'moon') {
                    // Save moon placed helpers
                    this.game.moonPlacedHelpers = [...this.game.placedHelpers];
                }
                
                // Clear the current helpers from the screen
                this.game.clearAllHelperSprites();
                
                // Update game state to reflect planet change
                this.game.currentLevel = planetName;
                
                // Load the appropriate placed helpers
                if (planetName === 'earth') {
                    this.game.placedHelpers = [...this.game.earthPlacedHelpers];
                } else if (planetName === 'moon') {
                    this.game.placedHelpers = [...this.game.moonPlacedHelpers];
                }
                
                // Update the character sprite
                if (planetName === 'earth') {
                    // Earth character
                    this.updateCharacter('standard');
                } else if (planetName === 'moon') {
                    // Moon character with spacesuit
                    this.updateCharacter('spacehelmet');
                }
                
                // Update the rock image
                if (planetName === 'earth') {
                    document.getElementById('main-rock').src = 'assets/general/rocks/earth.png';
                    const platform = document.getElementById('platform');
                    if (platform) {
                        platform.src = '../assets/quickUI/dogeplatform.png';
                    }
                    document.body.classList.remove('moon-theme');
                    if (window.audioManager) {
                        audioManager.playBackgroundMusic();
                    }
                } else if (planetName === 'moon') {
                    document.getElementById('main-rock').src = 'assets/general/rocks/moon.png';
                    const platform = document.getElementById('platform');
                    if (platform) {
                        platform.src = '../assets/quickUI/dogeplatformmoon.png';
                    }
                    document.body.classList.add('moon-theme');
                    if (window.audioManager) {
                        audioManager.playBackgroundMusic();
                    }
                }
                
                // Update backgrounds with the correct pool
                if (planetName === 'earth') {
                    // Earth backgrounds
                    this.game.backgrounds = [
                        'backgrounds/bg1.jpg',
                        'backgrounds/bg3.jpg',
                        'backgrounds/bg4.jpg',
                        'backgrounds/bg5.jpg',
                        'backgrounds/bg6.jpg',
                        'backgrounds/bg7.jpg',
                        'backgrounds/bg9.jpg',
                        'backgrounds/bg-new.jpg'
                    ];
                } else if (planetName === 'moon') {
                    // Moon backgrounds (same as earth since DOM only has 8 background elements)
                    this.game.backgrounds = [
                        'backgrounds/bg1.jpg',
                        'backgrounds/bg3.jpg',
                        'backgrounds/bg4.jpg',
                        'backgrounds/bg5.jpg',
                        'backgrounds/bg6.jpg',
                        'backgrounds/bg7.jpg',
                        'backgrounds/bg9.jpg',
                        'backgrounds/bg-new.jpg'
                    ];
                }
                
                // Force background update
                this.game.rotateBackground();
                
                // Update the shop to show the appropriate helpers
                this.updateShopContent();
                
                // Delay a bit to simulate loading
                setTimeout(() => {
                    // Recreate helper sprites for the current planet
                    this.game.recreateHelperSprites();
                    
                    // Hide loading screen
                    window.hideLoadingScreen();
                    
                    // Reset transitioning flag
                    this.game.isTransitioning = false;
                    
                        // For moon transitions, hide character until fall animation
                    if (planetName === 'moon') {
                        // Hide character container until we trigger the fall
                        const characterContainer = document.getElementById('character-container');
                        if (characterContainer) {
                            characterContainer.style.visibility = 'hidden';
                        }
                        
                        setTimeout(() => {
                            // Show character and play fall animation
                            if (characterContainer) {
                                characterContainer.style.visibility = 'visible';
                            }
                            this.game.playDogeIntro();
                        }, 300);
                    }
                }, 1000); // 1 second delay
            }, 500); // Short delay to ensure loading screen appears
            
            console.log(`Switched to ${planetName}`);
        };
        
        // Scroll wheel functionality for tab switching (shop and upgrade only)
        this.setupScrollWheelTabs();
        
        // Shop sub-tab switching
        window.switchShopTab = (tabName) => {
            this.currentShopTab = tabName;
            
            // Update sub-tab buttons in shop
            document.querySelectorAll('.shop-tabs .sub-tab-btn').forEach(btn => {
                btn.classList.remove('active');
            });
            event.target.classList.add('active');
            
            // Update shop content
            this.updateShopContent();
        };
        
        // Achievements sub-tab switching
        window.switchAchievementsTab = (tabName) => {
            // Update sub-tab buttons in achievements
            document.querySelectorAll('.achievements-tabs .sub-tab-btn').forEach(btn => {
                btn.classList.remove('active');
            });
            event.target.classList.add('active');
            
            // Update achievements content
            document.querySelectorAll('.achievements-sub-content').forEach(content => {
                content.classList.remove('active');
            });
            
            if (tabName === 'achievements') {
                document.getElementById('achievements-content').classList.add('active');
            } else if (tabName === 'stats') {
                document.getElementById('stats-content').classList.add('active');
            }
        };
        
    }
    
    setupShop() {
        this.updateShopContent();
    }
    
    updateShopContent() {
        if (!this.game) {
            console.warn('updateShopContent called before game was ready');
            return;
        }

        const shopContent = document.getElementById('shop-content');
        if (!shopContent) {
            console.error('shop-content element not found!');
            return;
        }
        
        // Log the current planet to help debug shop issues
        console.log(`Updating shop content for planet: ${this.game.currentLevel}`);
        
        // Clear existing content
        shopContent.innerHTML = '';
        
        // Render the correct helpers based on current planet
        this.renderHelperShop(shopContent);
        
        // Update shop prices to reflect current planet's helpers
        this.game.updateShopPrices();
    }
    
    renderHelperShop(container) {
        container.innerHTML = ''; // Clear container completely
        
        if (!this.game) {
            console.warn('renderHelperShop called before game was ready');
            return;
        }

        // Choose which helpers to display based on current planet
        const helperCategory = this.game.currentLevel === 'earth' ? 'helpers' : 'moonHelpers';
        console.log(`Rendering shop with helper category: ${helperCategory} for planet: ${this.game.currentLevel}`);
        
        if (!window.shopManager.shopData[helperCategory]) {
            console.error(`Shop data for ${helperCategory} is missing!`);
            return;
        }
        
        const helperEntries = Object.entries(window.shopManager.shopData[helperCategory]);
        
        // Create 6 helper items (2x3 grid)
        for (let i = 0; i < 6; i++) {
            const item = document.createElement('div');
            item.className = 'shop-grid-item';
            
            if (i < helperEntries.length) {
                const [type, helper] = helperEntries[i];
                // Choose the correct helper array based on current planet
                const helperArray = this.game.currentLevel === 'earth' ? this.game.helpers : this.game.moonHelpers;
                const owned = helperArray.filter(h => h.type === type).length;
                const cost = Math.floor(helper.baseCost * Math.pow(1.15, owned));
                const canAfford = this.game.dogecoins >= cost;
                
                
                // Calculate button width based on price length
                const priceText = this.game.formatNumber(cost);
                const priceLength = priceText.length;
                let buttonWidth = '45%'; // Default width
                
                // Scale button width based on price length
                if (priceLength >= 12) {
                    buttonWidth = '90%'; // Extremely long prices (trillions+)
                } else if (priceLength >= 10) {
                    buttonWidth = '85%'; // Very long prices (billions)
                } else if (priceLength >= 8) {
                    buttonWidth = '75%'; // Long prices (millions)
                } else if (priceLength >= 6) {
                    buttonWidth = '65%'; // Medium-long prices (hundreds of thousands)
                } else if (priceLength >= 4) {
                    buttonWidth = '55%'; // Medium prices (thousands)
                } else {
                    buttonWidth = '45%'; // Short prices (hundreds)
                }
                
                item.innerHTML = `
                    <div class="shop-item-quantity">#${owned}</div>
                    <div class="shop-item-title">${helper.name}</div>
                    <div class="shop-item-dps">${helper.baseDps} ĐPS</div>
                    <div class="shop-item-sprite">
                        <img src="${helper.icon}" alt="${helper.name}">
                    </div>
                    <div class="shop-item-description">${helper.description}</div>
                    <button class="shop-buy-btn" data-helper-type="${type}" 
                            ${!canAfford ? 'disabled' : ''} style="width: ${buttonWidth};">
                        <img src="assets/general/dogecoin_70x70.png" alt="DogeCoin" class="buy-btn-icon">
                        <span class="buy-btn-price">${priceText}</span>
                    </button>
                `;
            } else {
                // Empty slot
                item.innerHTML = `
                    <div class="shop-item-empty">
                        <div class="empty-text">Coming Soon!</div>
                    </div>
                `;
            }
            
            container.appendChild(item);
        }
        
        // Add event listeners to all buy buttons
        this.setupShopButtonListeners();
    }
    
    setupShopButtonListeners() {
        // Add event listeners to all buy buttons
        const buyButtons = document.querySelectorAll('.shop-buy-btn[data-helper-type]');
        buyButtons.forEach((button) => {
            // Remove any existing listeners to prevent duplicates
            button.removeEventListener('click', this.handleBuyButtonClick);
            // Add new listener
            button.addEventListener('click', this.handleBuyButtonClick.bind(this));
        });
    }
    
    handleBuyButtonClick(event) {
        const button = event.currentTarget;
        const helperType = button.getAttribute('data-helper-type');
        
        if (helperType && window.game) {
            // Buy the helper based on the current planet
            const success = window.game.buyHelper(helperType);
            
            if (success) {
                // Trigger chromatic aberration effect on successful purchase
                window.game.createChromaticAberrationEffect(button);
                
                // Update shop display immediately
                this.updateShopDisplay();
                
                // Special handling for Earth helpers
                if (window.game.currentLevel === 'earth') {
                    // If this is the first Space Rocket purchase, unlock the Moon
                    if (helperType === 'spaceRocket') {
                        const spaceRocketCount = window.game.helpers.filter(h => h.type === 'spaceRocket').length;
                        if (spaceRocketCount === 1) {
                            // This is the first Space Rocket purchase
                            this.hideMoonLocked();
                            
                            // Show notification that Moon is unlocked
                            window.game.showNotification('Moon unlocked! You can now travel to the Moon!');
                        }
                    }
                }
            } else {
                console.log('Failed to buy helper - insufficient funds');
            }
        } else {
            console.error('Helper type or game not found:', helperType, !!window.game);
        }
    }
    
    updateShopDisplay() {
        // Update shop prices and refresh display with fade-in effect
        const shopContainer = document.getElementById('shop-container');
        if (shopContainer) {
            // Add fade-out effect
            gsap.to(shopContainer, {
                opacity: 0,
                duration: 0.15,
                ease: "power2.out"
            });
            
            // Update shop content
            setTimeout(() => {
                this.renderShop();
                
                // Add smooth fade-in effect
                gsap.to(shopContainer, {
                    opacity: 1,
                    duration: 0.3,
                    ease: "power2.out"
                });
            }, 150);
        }
    }
    
    renderPickaxeShop(container) {
        Object.entries(this.game.pickaxeTypes).forEach(([type, pickaxe]) => {
            const owned = this.game.pickaxes.includes(type);
            const canBuy = !owned && this.game.dogecoins >= pickaxe.cost;
            
            const item = document.createElement('div');
            item.className = 'shop-item';
            
            item.innerHTML = `
                <div class="shop-item-header">
                    <div class="shop-item-title">${pickaxe.name}</div>
                    <div class="shop-item-price">${owned ? 'Owned' : 'D ' + this.game.formatNumber(pickaxe.cost)}</div>
                </div>
                <div class="shop-item-content">
                    <div class="shop-item-icon">
                        <img src="${pickaxe.icon}" alt="${pickaxe.name}">
                    </div>
                    <div class="shop-item-details">
                        <p>${pickaxe.description}</p>
                        <div class="shop-item-stats">Multiplier: ${pickaxe.multiplier}x ${owned ? '| ✓ Owned' : ''}</div>
                    </div>
                </div>
                <div class="shop-item-footer">
                    <button class="buy-btn" onclick="game.buyPickaxe('${type}')" 
                            ${!canBuy ? 'disabled' : ''}>
                        ${owned ? 'Owned' : 'Buy!'}
                    </button>
                </div>
            `;
            
            container.appendChild(item);
        });
    }
    
    setupStats() {
        // Stats are updated in the main game loop
    }
    
    setupLoading() {
        // Loading screen management
        window.hideLoadingScreen = () => {
            const loadingScreen = document.getElementById('loading-screen');
            loadingScreen.classList.add('hidden');
            setTimeout(() => {
                loadingScreen.style.display = 'none';
            }, 500);
        };
        
        window.showLoadingScreen = () => {
            const loadingScreen = document.getElementById('loading-screen');
            loadingScreen.style.display = 'flex';
            loadingScreen.classList.remove('hidden');
        };
        
        window.updateLoadingProgress = (progress) => {
            const progressBar = document.getElementById('loading-progress');
            progressBar.style.width = progress + '%';
        };
    }
    
    updateShop() {
        if (this.activePanel === 'shop-panel') {
            this.updateShopContent();
        }
    }
    
    
    showLevelUpNotification(levelName) {
        const notification = document.createElement('div');
        notification.className = 'level-up-notification';
        notification.innerHTML = `
            <div class="level-up-content">
                <h3>🚀 Level Up!</h3>
                <p>Welcome to ${levelName}!</p>
            </div>
        `;
        
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            left: 50%;
            transform: translateX(-50%);
            background: linear-gradient(45deg, #ff6b6b, #ff8e8e);
            color: white;
            padding: 15px 30px;
            border-radius: 10px;
            box-shadow: 0 0 20px rgba(255, 107, 107, 0.5);
            z-index: 10000;
            text-align: center;
            animation: levelUpSlide 4s ease-in-out forwards;
        `;
        
        // Add animation keyframes if not already added
        if (!document.getElementById('levelup-animation')) {
            const style = document.createElement('style');
            style.id = 'levelup-animation';
            style.textContent = `
                @keyframes levelUpSlide {
                    0% { transform: translateX(-50%) translateY(-100px); opacity: 0; }
                    20% { transform: translateX(-50%) translateY(0); opacity: 1; }
                    80% { transform: translateX(-50%) translateY(0); opacity: 1; }
                    100% { transform: translateX(-50%) translateY(-100px); opacity: 0; }
                }
            `;
            document.head.appendChild(style);
        }
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.remove();
        }, 4000);
    }
    
    showAchievement(title, description) {
        const achievement = document.createElement('div');
        achievement.className = 'achievement-notification';
        achievement.innerHTML = `
            <div class="achievement-content">
                <h4>🏆 ${title}</h4>
                <p>${description}</p>
            </div>
        `;
        
        // Style the achievement notification
        achievement.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: linear-gradient(45deg, #ffd700, #ffed4e);
            color: #000;
            padding: 20px;
            border-radius: 15px;
            box-shadow: 0 0 30px rgba(255, 215, 0, 0.5);
            z-index: 10000;
            text-align: center;
            animation: achievementPop 3s ease-in-out forwards;
        `;
        
        // Add animation keyframes if not already added
        if (!document.getElementById('achievement-animation')) {
            const style = document.createElement('style');
            style.id = 'achievement-animation';
            style.textContent = `
                @keyframes achievementPop {
                    0% { transform: translate(-50%, -50%) scale(0); opacity: 0; }
                    20% { transform: translate(-50%, -50%) scale(1.1); opacity: 1; }
                    30% { transform: translate(-50%, -50%) scale(1); opacity: 1; }
                    80% { transform: translate(-50%, -50%) scale(1); opacity: 1; }
                    100% { transform: translate(-50%, -50%) scale(0); opacity: 0; }
                }
            `;
            document.head.appendChild(style);
        }
        
        document.body.appendChild(achievement);
        
        setTimeout(() => {
            achievement.remove();
        }, 3000);
    }
    
    updateBackground(levelName) {
        const rockImage = document.getElementById('main-rock');
        if (!rockImage) return;

        const level = this.game.levels[levelName];
        if (!level) return;

        const targetSrc = level.rock;
        const currentAttr = rockImage.getAttribute('src') || '';

        // If the rock is already displaying this image, skip any fade to avoid flicker
        if (currentAttr === targetSrc || rockImage.src.endsWith(targetSrc)) {
            rockImage.style.opacity = '1';
            return;
        }

        rockImage.src = targetSrc;
        rockImage.style.opacity = '1';
    }
    
    updateCharacter(characterType = 'standard') {
        const characterImage = document.getElementById('main-character');
        if (!characterImage) return;
        
        // Check if the current character is already correct to avoid unnecessary updates
        const currentSrc = characterImage.src;
        const targetSrc = `assets/general/character/${characterType}.png`;
        
        // Only update if the source has changed (avoid unnecessary reloading)
        if (!currentSrc.endsWith(targetSrc)) {
            console.log(`Updating character sprite to: ${characterType}`);
            
            // Create a new image to preload
            const preloadImage = new Image();
            preloadImage.onload = () => {
                // Once loaded, update the main character
                characterImage.src = targetSrc;
            };
            preloadImage.onerror = () => {
                console.error(`Failed to load character sprite: ${targetSrc}`);
            };
            preloadImage.src = targetSrc;
        }
    }
    
    showComboEffect(comboCount) {
        const comboElement = document.createElement('div');
        comboElement.className = 'combo-effect';
        comboElement.textContent = `${comboCount}x COMBO!`;
        
        comboElement.style.cssText = `
            position: fixed;
            top: 30%;
            left: 50%;
            transform: translateX(-50%);
            color: #ffd700;
            font-size: 48px;
            font-weight: bold;
            text-shadow: 0 0 20px rgba(255, 215, 0, 0.8);
            z-index: 10000;
            pointer-events: none;
            animation: comboPop 2s ease-out forwards;
        `;
        
        // Add animation keyframes if not already added
        if (!document.getElementById('combo-animation')) {
            const style = document.createElement('style');
            style.id = 'combo-animation';
            style.textContent = `
                @keyframes comboPop {
                    0% { transform: translateX(-50%) scale(0); opacity: 0; }
                    50% { transform: translateX(-50%) scale(1.2); opacity: 1; }
                    100% { transform: translateX(-50%) scale(1); opacity: 0; }
                }
            `;
            document.head.appendChild(style);
        }
        
        document.body.appendChild(comboElement);
        
        setTimeout(() => {
            comboElement.remove();
        }, 2000);
    }
    
    setupScrollWheelTabs() {
        // Define the scrollable tabs (shop and upgrades only)
        this.scrollableTabs = ['shop', 'upgrades'];
        
        // Add wheel event listener to the right panel
        const rightPanel = document.getElementById('right-panel');
        if (rightPanel) {
            rightPanel.addEventListener('wheel', (e) => {
                // Only handle scroll if we're on a scrollable tab
                const currentTab = this.activePanel.replace('-tab', '');
                if (this.scrollableTabs.includes(currentTab)) {
                    e.preventDefault(); // Prevent default scrolling
                    
                    // Get current tab index
                    const currentTabIndex = this.scrollableTabs.indexOf(currentTab);
                    
                    // Determine scroll direction
                    const scrollUp = e.deltaY < 0;
                    
                    let newTabIndex;
                    if (scrollUp) {
                        // Scroll up - go to previous tab
                        newTabIndex = Math.max(0, currentTabIndex - 1);
                    } else {
                        // Scroll down - go to next tab
                        newTabIndex = Math.min(this.scrollableTabs.length - 1, currentTabIndex + 1);
                    }
                    
                    // Switch to the new tab
                    const newTab = this.scrollableTabs[newTabIndex];
                    this.switchToTab(newTab);
                }
            });
        }
    }
    
    switchToTab(tabName) {
        // Check if this tab is already active
        const currentTab = this.activePanel.replace('-tab', '');
        const isTabAlreadyActive = currentTab === tabName;
        
        // Update tab buttons - find the correct button by data attribute or onclick
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.remove('active');
            // Check if this button corresponds to the tab we want
            if (btn.getAttribute('onclick') && btn.getAttribute('onclick').includes(tabName)) {
                btn.classList.add('active');
            }
        });
        
        // Update tab content
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.remove('active');
        });
        
        const targetTab = document.getElementById(tabName + '-tab');
        if (targetTab) {
            targetTab.classList.add('active');
        }
        
        // Set active panel
        this.activePanel = tabName + '-tab';
        
        // Only play sound if switching to a different tab
        if (!isTabAlreadyActive && window.audioManager) {
            audioManager.playSound('swipe');
        }
        
        // Update shop content if switching to shop
        if (tabName === 'shop') {
            this.updateShopContent();
        }
        
        // Update upgrade content if switching to upgrade
        if (tabName === 'upgrades') {
            this.updateUpgradeContent();
        }
    }
    
    updateUpgradeContent() {
        // This will be populated later with actual upgrade content
        // For now, just ensure the sections are visible
        const upgradeSections = document.querySelectorAll('.upgrade-section');
        upgradeSections.forEach(section => {
            const grid = section.querySelector('.upgrades-grid');
            if (grid && grid.children.length === 0) {
                // Add placeholder content if empty
                grid.innerHTML = '<div class="upgrade-placeholder">Upgrade content coming soon!</div>';
            }
        });
    }
    
    showMoonLocked() {
        // Find the moon tab button
        const moonTab = document.querySelector('.planet-tab[onclick*="moon"]');
        if (!moonTab) return;
        
        // Check if locked overlay already exists
        let lockedOverlay = moonTab.querySelector('.planet-tab-locked');
        if (!lockedOverlay) {
            // Create locked overlay
            lockedOverlay = document.createElement('div');
            lockedOverlay.className = 'planet-tab-locked';
            lockedOverlay.textContent = 'LOCKED';
            moonTab.appendChild(lockedOverlay);
        }
        
        // Show the overlay
        lockedOverlay.style.display = 'block';
        
        // Auto-hide after 2 seconds
        setTimeout(() => {
            this.hideMoonLocked();
        }, 2000);
    }
    
    hideMoonLocked() {
        const lockedOverlay = document.querySelector('.planet-tab-locked');
        if (lockedOverlay) {
            lockedOverlay.style.display = 'none';
        }
    }
    
    // Initialize planet tabs based on saved state
    initializePlanetTabs() {
        if (this.game && this.game.currentLevel) {
            // Update planet tab buttons to match current level
            document.querySelectorAll('.planet-tab').forEach(btn => {
                btn.classList.remove('active');
                
                // Check if this tab is for the current planet
                const tabPlanet = btn.querySelector('img')?.alt?.toLowerCase() || '';
                if (tabPlanet.toLowerCase() === this.game.currentLevel) {
                    btn.classList.add('active');
                }
            });
            
            // If moon is unlocked, make sure the locked overlay is hidden
            if (this.game.hasPlayedMoonLaunch) {
                this.hideMoonLocked();
            }

            const shopPanel = document.getElementById('shop-panel');

            // Ensure the shop content matches the current planet
            if (shopPanel && (this.activePanel === 'shop-panel' || shopPanel.style.display === 'block')) {
                console.log(`Updating shop content to match current planet: ${this.game.currentLevel}`);
                this.updateShopContent();
            }
            
            console.log(`Planet tabs initialized to: ${this.game.currentLevel}`);
        }
    }
}

// Global UI manager instance
let uiManager;
