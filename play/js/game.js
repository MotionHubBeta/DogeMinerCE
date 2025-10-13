// DogeMiner: Community Edition - Main Game Logic
class DogeMinerGame {
    constructor() {
        this.dogecoins = 0;
        this.totalMined = 0;
        this.totalClicks = 0;
        this.dps = 0;
        this.highestDps = 0;
        this.currentLevel = 'earth';
        this.helpers = [];
        
     
        
        // Game state
        this.isPlaying = false;
        this.lastSave = Date.now();
        this.autoSaveInterval = 30000; // 30 seconds
        this.startTime = Date.now();
        this.totalPlayTime = 0;
        
        
        // Input state tracking
        this.isMouseDown = false;
        this.isSpaceDown = false;
        this.swingTimeout = null;
        
        // Click rate limiting (max 15 CPS like original DogeMiner 2)
        this.maxCPS = 15;
        this.clickTimes = [];
        this.lastClickTime = 0;
        
        // Animation and effects with limits
        this.clickEffects = [];
        this.particles = [];
        this.maxEffects = 20; // Limit concurrent effects
        this.maxParticles = 50; // Limit concurrent particles
        
        // Helper placement system
        this.helperBeingPlaced = null;
        this.helperSpriteBeingPlaced = null;
        this.placedHelpers = []; // Array of placed helper objects with positions
        
        // Background rotation
        this.backgrounds = [
            'backgrounds/bg1.jpg',
            'backgrounds/bg3.jpg',
            'backgrounds/bg4.jpg',
            'backgrounds/bg5.jpg',
            'backgrounds/bg6.jpg',
            'backgrounds/bg7.jpg',
            'backgrounds/bg9.jpg',
            'backgrounds/bg-new.jpg'
        ];
        this.currentBackgroundIndex = 0;
        this.backgroundRotationInterval = null;
        
        // Blinking animation
        this.blinkInterval = null;
        
        // Rick Doge system
        this.rickInterval = null;
        this.rickVisible = false;
        
        // DPS interval for performance
        this.dpsInterval = null;
        this.rickSprites = [
            'assets/general/rm/r1.png',
            'assets/general/rm/r2.png',
            'assets/general/rm/r3.png',
            'assets/general/rm/r4.png'
        ];
        this.currentRickSprite = 0;
        this.rickAnimationDirection = 1; // 1 for forward, -1 for backward
        this.rickAnimationComplete = false;
        
        // Initialize game data
        this.initializeGameData();
        this.setupEventListeners();
        this.startGameLoop();
        this.startBackgroundRotation();
        this.startBlinking();
        this.startRickSpawn();
    }
    
    initializeGameData() {
        // Helper definitions will be loaded from shop.js
        // Pickaxe and level systems will be implemented later
    }
    
    setupEventListeners() {
        // Rock clicking
        const rockContainer = document.getElementById('rock-container');
        const clickOverlay = document.getElementById('click-overlay');
        
        // Mouse events with click rate limiting
        clickOverlay.addEventListener('mousedown', (e) => {
            this.isMouseDown = true;
            this.processClick(e);
        });
        
        document.addEventListener('mouseup', () => {
            this.isMouseDown = false;
            this.endSwing();
        });
        
        // Keyboard events with click rate limiting
        document.addEventListener('keydown', (e) => {
            if (e.code === 'Space' && !e.repeat) {
                e.preventDefault();
                this.isSpaceDown = true;
                this.processClick();
            }
        });
        
        document.addEventListener('keyup', (e) => {
            if (e.code === 'Space') {
                e.preventDefault();
                this.isSpaceDown = false;
                this.endSwing();
            }
        });
        
        // Auto-save is now handled by SaveManager
    }
    
    handleRockClick(event = null) {
        if (!this.isPlaying) return;
        
        this.totalClicks++;
        
        // Pickaxe swing animation
        this.swingPickaxe();
        
        // Doge bounce animation
        this.bounceDoge();
        
        // Award dogecoins for each hit
        const coinsPerHit = this.getClickPower();
        this.dogecoins += coinsPerHit;
        this.totalMined += coinsPerHit;
        
        // Create floating coin effect (limited)
        if (this.clickEffects.length < this.maxEffects) {
            this.createFloatingCoin(coinsPerHit, event);
        }
        
        // Visual effects for hitting rock (limited)
        if (this.clickEffects.length < this.maxEffects) {
            this.createClickEffect(event);
        }
        if (this.particles.length < this.maxParticles) {
            this.createParticleEffect(event);
        }
        
        this.updateUI();
        
        // Sound effect (if available)
        this.playSound('pick1.wav');
        
    }
    
    processClick(event = null) {
        const now = Date.now();
        
        // Remove clicks older than 1 second from tracking
        this.clickTimes = this.clickTimes.filter(time => now - time < 1000);
        
        // Check if we're at the 15 CPS limit
        if (this.clickTimes.length >= this.maxCPS) {
            // Discard this click - we've already hit the limit
            return;
        }
        
        // Check minimum interval between clicks (66ms = ~15 CPS)
        if (now - this.lastClickTime < 66) {
            // Too soon since last click, discard this one
            return;
        }
        
        // Process this click
        this.clickTimes.push(now);
        this.lastClickTime = now;
        
        this.handleRockClick(event);
        this.startSwing();
    }
    
    getClickPower() {
        const basePower = 1; // 1% per hit like DogeMiner 2
        return basePower;
    }
    
    swingPickaxe() {
        // Pickaxe state is now managed by updatePickaxeState()
        // This method is kept for compatibility but doesn't do the timeout anymore
    }
    
    bounceDoge() {
        const doge = document.getElementById('main-character');
        if (!doge) return;
        
        // Add bounce class
        doge.classList.add('bounce');
        
        // Remove bounce class after animation completes
        setTimeout(() => {
            doge.classList.remove('bounce');
        }, 200);
    }
    
    startSwing() {
        const pickaxe = document.getElementById('pickaxe');
        if (!pickaxe) return;
        
        // Always start the swing immediately
        pickaxe.classList.add('swinging');
        
        // Clear any existing timeout since we're starting a new swing
        if (this.swingTimeout) {
            clearTimeout(this.swingTimeout);
            this.swingTimeout = null;
        }
    }
    
    endSwing() {
        const pickaxe = document.getElementById('pickaxe');
        if (!pickaxe) return;
        
        // Only end swing if neither input is currently held
        if (!this.isMouseDown && !this.isSpaceDown) {
            // Clear any existing timeout first
            if (this.swingTimeout) {
                clearTimeout(this.swingTimeout);
                this.swingTimeout = null;
            }
            
            // Small delay to ensure swing is visible on quick taps
            this.swingTimeout = setTimeout(() => {
                // Double-check that inputs are still not held when timeout fires
                if (!this.isMouseDown && !this.isSpaceDown) {
                    pickaxe.classList.remove('swinging');
                }
                this.swingTimeout = null;
            }, 30); // Just 30ms - enough to see the swing but fast enough for rapid clicks
        }
    }
    
    // Rock health system removed - simplified mining
    
    createParticleEffect(event) {
        const container = document.getElementById('particle-container');
        if (!container) return;
        
        // Get rock position for particle origin
        const rock = document.getElementById('main-rock');
        const rockRect = rock.getBoundingClientRect();
        const containerRect = container.getBoundingClientRect();
        
        // Calculate position relative to particle container
        const x = rockRect.left + rockRect.width / 2 - containerRect.left;
        const y = rockRect.top + rockRect.height / 2 - containerRect.top;
        
        // Create 5-8 particles (random amount)
        const particleCount = 5 + Math.floor(Math.random() * 4); // 5-8 particles
        
        for (let i = 0; i < particleCount; i++) {
            const particle = document.createElement('img');
            particle.src = 'assets/general/rocks/earth_particle.png';
            particle.className = 'earth-particle';
            particle.style.left = x + 'px';
            particle.style.top = y + 'px';
            
            // Random direction and distance for more realistic effect
            const angle = Math.random() * Math.PI * 2; // Random angle
            const distance = 40 + Math.random() * 30; // 40-70px distance
            const dx = Math.cos(angle) * distance;
            const dy = Math.sin(angle) * distance;
            
            particle.style.setProperty('--dx', dx + 'px');
            particle.style.setProperty('--dy', dy + 'px');
            
            container.appendChild(particle);
            
            // Remove particle after animation
            setTimeout(() => {
                if (particle.parentNode) {
                    particle.parentNode.removeChild(particle);
                }
            }, 600); // Slightly faster animation
        }
    }
    
    // Coin explosion removed - simplified mining
    
    createClickEffect(event) {
        const rock = document.getElementById('main-rock');
        rock.classList.add('shake');
        setTimeout(() => {
            rock.classList.remove('shake');
        }, 300);
        
    }
    
    
    createFloatingCoin(amount, event = null) {
        // Get the floating coins container
        const container = document.getElementById('floating-coins');
        if (!container) return;
        
        let startX, startY;
        
        if (event && event.clientX !== undefined) {
            // Use mouse position for mouse clicks
            const containerRect = container.getBoundingClientRect();
            startX = event.clientX - containerRect.left;
            startY = event.clientY - containerRect.top;
        } else {
            // Fall back to rock position for keyboard clicks
            const rock = document.getElementById('main-rock');
            const rockRect = rock.getBoundingClientRect();
            const containerRect = container.getBoundingClientRect();
            
            startX = rockRect.left + rockRect.width / 2 - containerRect.left;
            startY = rockRect.top + rockRect.height / 2 - containerRect.top;
        }
        
        // Create DogeCoin image
        const coin = document.createElement('img');
        coin.src = 'assets/general/dogecoin_70x70.png';
        coin.className = 'dogecoin-effect';
        coin.style.position = 'absolute';
        coin.style.left = startX + 'px';
        coin.style.top = startY + 'px';
        coin.style.width = '35px';
        coin.style.height = '35px';
        coin.style.transform = 'translate(-50%, -50%)';
        coin.style.zIndex = '20';
        
        // Create +amount text
        const text = document.createElement('div');
        text.className = 'dogecoin-text';
        text.textContent = '+' + amount;
        text.style.position = 'absolute';
        text.style.left = (startX + 40) + 'px';
        text.style.top = startY + 'px';
        text.style.color = 'rgb(180, 155, 60)';
        text.style.fontWeight = '900';
        text.style.fontSize = '20px';
        text.style.fontFamily = 'DogeSans, sans-serif';
        text.style.textShadow = '2px 2px 0px #ffffff, -2px -2px 0px #ffffff, 2px -2px 0px #ffffff, -2px 2px 0px #ffffff';
        text.style.transform = 'translate(-50%, -50%)';
        text.style.zIndex = '21';
        
        // Add to container
        container.appendChild(coin);
        container.appendChild(text);
        
        // Animate coin
        coin.animate([
            { transform: 'translate(-50%, -50%) scale(1.2)', opacity: 1 },
            { transform: 'translate(-50%, -150px) scale(0.4)', opacity: 0 }
        ], {
            duration: 1500,
            easing: 'ease-out',
            fill: 'forwards'
        });
        
        // Animate text
        text.animate([
            { transform: 'translate(-50%, -50%)', opacity: 1 },
            { transform: 'translate(-50%, -150px)', opacity: 0 }
        ], {
            duration: 1500,
            easing: 'ease-out',
            fill: 'forwards'
        });
        
        // Remove after animation
        setTimeout(() => {
            if (coin.parentNode) coin.parentNode.removeChild(coin);
            if (text.parentNode) text.parentNode.removeChild(text);
        }, 1500);
    }
    
    buyHelper(helperType) {
        console.log('buyHelper called for:', helperType);
        // Get helper data from shop system
        const helper = window.shopManager.shopData.helpers[helperType];
        if (!helper) {
            console.error('Helper type not found:', helperType);
            return false;
        }
        
        const owned = this.helpers.filter(h => h.type === helperType).length;
        const cost = Math.floor(helper.baseCost * Math.pow(1.2, owned));
        
        if (this.dogecoins >= cost) {
            this.dogecoins -= cost;
            
            // Start helper placement process
            this.startHelperPlacement(helperType, helper);
            
            this.updateUI();
            this.updateShopPrices();
            this.playSound('check.wav');
            
            return true;
        }
        return false;
    }
    
    startHelperPlacement(helperType, helper) {
        // Create helper sprite that follows mouse
        const helperSprite = document.createElement('img');
        helperSprite.src = helper.icon; // Use icon as idle sprite
        helperSprite.className = 'helper-sprite attached-to-mouse';
        helperSprite.style.opacity = '0.7';
        
        // Add special classes for different helper types (same as in createHelperSprite)
        if (helperType === 'spaceRocket') {
            helperSprite.classList.add('rocket');
        } else if (helperType === 'miningShibe') {
            helperSprite.classList.add('shibe');
        }
        
        document.getElementById('helper-container').appendChild(helperSprite);
        
        this.helperBeingPlaced = {
            type: helperType,
            helper: helper,
            dps: helper.baseDps
        };
        this.helperSpriteBeingPlaced = helperSprite;
        
        // Add mouse move and click listeners for placement
        this.addHelperPlacementListeners();
    }
    
    addHelperPlacementListeners() {
        const handleMouseMove = (e) => {
            if (this.helperSpriteBeingPlaced) {
                const leftPanel = document.getElementById('left-panel');
                const rect = leftPanel.getBoundingClientRect();
                
                // Get helper size based on type
                const helperSize = this.helperSpriteBeingPlaced.classList.contains('shibe') ? 30 : 60;
                const offset = helperSize / 2; // Center the sprite
                
                // Position relative to left panel, centered on cursor
                const x = e.clientX - rect.left - offset;
                const y = e.clientY - rect.top - offset;
                
                this.helperSpriteBeingPlaced.style.left = x + 'px';
                this.helperSpriteBeingPlaced.style.top = y + 'px';
            }
        };
        
        const handleClick = (e) => {
            if (this.helperSpriteBeingPlaced) {
                const leftPanel = document.getElementById('left-panel');
                const rect = leftPanel.getBoundingClientRect();
                
                // Get helper size based on type
                const helperSize = this.helperSpriteBeingPlaced.classList.contains('shibe') ? 30 : 60;
                const offset = helperSize / 2; // Center the sprite
                
                // Use the same positioning logic as mouse move
                const x = e.clientX - rect.left - offset;
                const y = e.clientY - rect.top - offset;
                
                // Check if position is valid (not overlapping with existing helpers or mining area)
                if (this.isValidHelperPosition(x, y, helperSize)) {
                    this.placeHelper(x, y);
                }
            }
        };
        
        const handleRightClick = (e) => {
            e.preventDefault();
            this.cancelHelperPlacement();
        };
        
        // Add listeners
        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('click', handleClick);
        document.addEventListener('contextmenu', handleRightClick);
        
        // Store references for cleanup
        this.placementListeners = {
            mousemove: handleMouseMove,
            click: handleClick,
            contextmenu: handleRightClick
        };
    }
    
    isValidHelperPosition(x, y, helperSize = 60) {
        const margin = 10;
        
        // Check bounds of left panel
        const leftPanel = document.getElementById('left-panel');
        if (x < margin || y < margin || 
            x + helperSize > leftPanel.offsetWidth - margin || 
            y + helperSize > leftPanel.offsetHeight - margin) {
            return false;
        }
        
        // Check if overlapping with mining area (character and rock)
        const miningArea = document.getElementById('mining-area');
        const miningRect = miningArea.getBoundingClientRect();
        const leftPanelRect = leftPanel.getBoundingClientRect();
        
        const miningX = miningRect.left - leftPanelRect.left;
        const miningY = miningRect.top - leftPanelRect.top;
        
        if (x + helperSize > miningX && x < miningX + miningRect.width &&
            y + helperSize > miningY && y < miningY + miningRect.height) {
            return false;
        }
        
        // Check if overlapping with existing helpers
        for (const placedHelper of this.placedHelpers) {
            const distance = Math.sqrt(
                Math.pow(x - placedHelper.x, 2) + Math.pow(y - placedHelper.y, 2)
            );
            if (distance < helperSize + margin) {
                return false;
            }
        }
        
        return true;
    }
    
    placeHelper(x, y) {
        // Create the placed helper object
        const placedHelper = {
            ...this.helperBeingPlaced,
            x: x,
            y: y,
            id: Date.now() + Math.random(), // Unique ID
            isMining: false
        };
        
        // Add to placed helpers array
        this.placedHelpers.push(placedHelper);
        
        // Add to helpers array for DPS calculation
        this.helpers.push({
            type: this.helperBeingPlaced.type,
            dps: this.helperBeingPlaced.dps,
            owned: this.helpers.filter(h => h.type === this.helperBeingPlaced.type).length
        });
        
        // Create the actual helper sprite
        this.createHelperSprite(placedHelper);
        
        // Clean up placement
        this.finishHelperPlacement();
        
        // Update DPS and UI
        this.updateDPS();
        this.updateUI();
    }
    
    createHelperSprite(placedHelper) {
        const helperSprite = document.createElement('img');
        helperSprite.src = placedHelper.helper.icon; // Use icon as idle sprite
        helperSprite.className = 'helper-sprite';
        helperSprite.style.left = placedHelper.x + 'px';
        helperSprite.style.top = placedHelper.y + 'px';
        helperSprite.dataset.helperId = placedHelper.id;
        
        // Add special classes for different helper types
        if (placedHelper.type === 'spaceRocket') {
            helperSprite.classList.add('rocket');
        } else if (placedHelper.type === 'miningShibe') {
            helperSprite.classList.add('shibe');
        }
        
        document.getElementById('helper-container').appendChild(helperSprite);
        
        // Start mining animation after a short delay
        setTimeout(() => {
            this.startHelperMining(placedHelper);
        }, 1000);
    }
    
    startHelperMining(placedHelper) {
        const helperSprite = document.querySelector(`[data-helper-id="${placedHelper.id}"]`);
        if (helperSprite) {
            // Start 3fps animation between idle and mining sprites
            this.startHelperAnimation(placedHelper, helperSprite);
            placedHelper.isMining = true;
        }
    }
    
    startHelperAnimation(placedHelper, helperSprite) {
        let isIdle = true;
        const animationInterval = setInterval(() => {
            if (isIdle) {
                helperSprite.src = placedHelper.helper.miningSprite || placedHelper.helper.icon;
            } else {
                helperSprite.src = placedHelper.helper.icon;
            }
            isIdle = !isIdle;
        }, 333); // 3fps = 333ms per frame
        
        // Store interval ID for cleanup
        helperSprite.dataset.animationInterval = animationInterval;
    }
    
    stopHelperAnimation(helperSprite) {
        const intervalId = helperSprite.dataset.animationInterval;
        if (intervalId) {
            clearInterval(parseInt(intervalId));
            helperSprite.dataset.animationInterval = '';
        }
    }
    
    finishHelperPlacement() {
        // Remove placement sprite
        if (this.helperSpriteBeingPlaced) {
            this.helperSpriteBeingPlaced.remove();
            this.helperSpriteBeingPlaced = null;
        }
        
        // Remove event listeners
        if (this.placementListeners) {
            document.removeEventListener('mousemove', this.placementListeners.mousemove);
            document.removeEventListener('click', this.placementListeners.click);
            document.removeEventListener('contextmenu', this.placementListeners.contextmenu);
            this.placementListeners = null;
        }
        
        // Clear placement state
        this.helperBeingPlaced = null;
    }
    
    cancelHelperPlacement() {
        // Refund the cost
        if (this.helperBeingPlaced) {
            const helper = window.shopManager.shopData.helpers[this.helperBeingPlaced.type];
            const owned = this.helpers.filter(h => h.type === this.helperBeingPlaced.type).length;
            const cost = Math.floor(helper.baseCost * Math.pow(1.2, owned - 1));
            this.dogecoins += cost;
        }
        
        this.finishHelperPlacement();
        this.updateUI();
        this.updateShopPrices();
    }
    
    // Pickaxe system will be implemented later
    
    updateDPS() {
        this.dps = this.helpers.reduce((total, helper) => {
            return total + helper.dps;
        }, 0);
        
        // Update highest DPS
        if (this.dps > this.highestDps) {
            this.highestDps = this.dps;
        }
    }
    
    updateShopPrices() {
        // Update shop prices and quantities without rebuilding the entire shop
        const shopItems = document.querySelectorAll('.shop-grid-item');
        shopItems.forEach((item, index) => {
            const quantityElement = item.querySelector('.shop-item-quantity');
            const priceElement = item.querySelector('.buy-btn-price');
            const buyButton = item.querySelector('.shop-buy-btn[data-helper-type]');
            
            if (quantityElement && priceElement && buyButton) {
                // Get helper type from the button's data attribute
                const helperType = buyButton.getAttribute('data-helper-type');
                if (helperType) {
                    const helper = window.shopManager.shopData.helpers[helperType];
                    if (helper) {
                        const owned = this.helpers.filter(h => h.type === helperType).length;
                        const cost = Math.floor(helper.baseCost * Math.pow(1.2, owned));
                        const canAfford = this.dogecoins >= cost;
                        
                        // Update quantity
                        quantityElement.textContent = `#${owned}`;
                        
                        // Update price
                        priceElement.textContent = this.formatNumber(cost);
                        
                        // Update button state
                        if (canAfford) {
                            buyButton.disabled = false;
                            buyButton.style.opacity = '1';
                        } else {
                            buyButton.disabled = true;
                            buyButton.style.opacity = '0.7';
                        }
                    }
                }
            }
        });
    }
    
    startGameLoop() {
        this.isPlaying = true;
        
        // DPS updates every second for better performance
        this.dpsInterval = setInterval(() => {
            if (this.isPlaying && this.dps > 0) {
                this.dogecoins += this.dps;
                this.totalMined += this.dps;
                this.updateUI();
            }
        }, 1000);
        
        const gameLoop = () => {
            if (this.isPlaying) {
                this.updateHelpers();
            }
            
            requestAnimationFrame(gameLoop);
        };
        
        gameLoop();
    }
    
    startBackgroundRotation() {
        // Start background rotation every 15 seconds
        this.backgroundRotationInterval = setInterval(() => {
            this.rotateBackground();
        }, 15000);
    }
    
    rotateBackground() {
        // Remove active class from current background
        const currentImage = document.getElementById(`background-image-${this.currentBackgroundIndex + 1}`);
        if (currentImage) {
            currentImage.classList.remove('active');
        }
        
        // Move to next background
        this.currentBackgroundIndex = (this.currentBackgroundIndex + 1) % this.backgrounds.length;
        
        // Add active class to new background
        const nextImage = document.getElementById(`background-image-${this.currentBackgroundIndex + 1}`);
        if (nextImage) {
            nextImage.classList.add('active');
        }
        
        console.log(`Background rotated to: ${this.backgrounds[this.currentBackgroundIndex]}`);
    }
    
    startBlinking() {
        // Start blinking every 10 seconds
        this.blinkInterval = setInterval(() => {
            this.blinkDoge();
        }, 10000);
    }
    
    blinkDoge() {
        const doge = document.getElementById('main-character');
        if (!doge) return;
        
        // Store original src
        const originalSrc = doge.src;
        
        // Change to closed eyes
        doge.src = 'assets/general/character/closed_eyes.png';
        
        // Blink for 200ms
        setTimeout(() => {
            doge.src = originalSrc;
        }, 200);
    }
    
    startRickSpawn() {
        // Rick spawns every 3-5 minutes (180-300 seconds)
        const spawnTime = 180000 + Math.random() * 120000; // 3-5 minutes
        this.rickInterval = setTimeout(() => {
            this.spawnRick();
        }, spawnTime);
    }
    
    spawnRick() {
        if (this.rickVisible) return; // Don't spawn if already visible
        
        this.rickVisible = true;
        this.currentRickSprite = 0;
        this.rickAnimationDirection = 1;
        this.rickAnimationComplete = false;
        
        // Create portal background
        const portal = document.createElement('img');
        portal.id = 'rick-portal';
        portal.src = 'assets/general/rm/portal.png';
        portal.style.position = 'absolute';
        portal.style.bottom = '170px'; // Moved up 150px
        portal.style.right = '10px'; // Moved to the right
        portal.style.width = '80px';
        portal.style.height = '80px';
        portal.style.zIndex = '24';
        portal.style.opacity = '0';
        portal.style.transition = 'opacity 0.5s ease';
        
        // Create Rick element
        const rick = document.createElement('img');
        rick.id = 'rick-doge';
        rick.src = this.rickSprites[0];
        rick.className = 'rick-doge';
        rick.style.position = 'absolute';
        rick.style.bottom = '170px'; // Moved up 150px
        rick.style.right = '20px';
        rick.style.width = '80px';
        rick.style.height = '80px';
        rick.style.zIndex = '25';
        rick.style.cursor = 'default'; // Remove pointer cursor
        rick.style.transition = 'opacity 0.3s ease';
        rick.style.objectFit = 'contain'; // Fix stretching
        
        document.getElementById('left-panel').appendChild(portal);
        document.getElementById('left-panel').appendChild(rick);
        
        // Fade in portal
        setTimeout(() => {
            portal.style.opacity = '1';
        }, 100);
        
        // Animate through sprites
        this.animateRick();
        
        // Auto-hide after 8 seconds (faster fade out)
        setTimeout(() => {
            this.hideRick();
        }, 8000);
    }
    
    animateRick() {
        if (!this.rickVisible || this.rickAnimationComplete) return;
        
        const rick = document.getElementById('rick-doge');
        if (!rick) return;
        
        // Check if we've completed the full sequence (back to R1)
        if (this.currentRickSprite === 0 && this.rickAnimationDirection === -1) {
            this.rickAnimationComplete = true;
            // Fade out immediately when animation completes
            setTimeout(() => {
                this.hideRick();
            }, 500); // Small delay to show final frame
            return; // Stop animation immediately
        }
        
        // Move to next sprite based on direction
        this.currentRickSprite += this.rickAnimationDirection;
        
        // Check if we've reached R4 (index 3)
        if (this.currentRickSprite === 3) {
            // Pause at R4 for 2 seconds
            rick.src = this.rickSprites[this.currentRickSprite];
            this.rickAnimationDirection = -1; // Start going backward
            setTimeout(() => {
                this.animateRick();
            }, 2000); // 2 second pause
            return;
        }
        
        rick.src = this.rickSprites[this.currentRickSprite];
        
        // Continue animation every 500ms
        setTimeout(() => {
            this.animateRick();
        }, 500);
    }
    
    // Rick click functionality removed - no longer gives coins
    
    hideRick() {
        const rick = document.getElementById('rick-doge');
        const portal = document.getElementById('rick-portal');
        
        if (rick) {
            rick.style.opacity = '0';
            setTimeout(() => {
                if (rick.parentNode) {
                    rick.parentNode.removeChild(rick);
                }
            }, 300);
        }
        
        // Portal stays visible for 0.4 seconds after Rick fades
        if (portal) {
            setTimeout(() => {
                portal.style.opacity = '0';
                setTimeout(() => {
                    if (portal.parentNode) {
                        portal.parentNode.removeChild(portal);
                    }
                }, 400); // 0.4 seconds
            }, 300); // Wait for Rick to fade first
        }
        
        this.rickVisible = false;
    }
    
    scheduleNextRick() {
        // Schedule next Rick spawn
        const spawnTime = 180000 + Math.random() * 120000; // 3-5 minutes
        this.rickInterval = setTimeout(() => {
            this.spawnRick();
        }, spawnTime);
    }
    
    // Debug method to force Rick spawn
    forceRickSpawn() {
        this.hideRick(); // Hide current Rick if visible
        this.spawnRick();
    }
    
    stopBackgroundRotation() {
        if (this.backgroundRotationInterval) {
            clearInterval(this.backgroundRotationInterval);
            this.backgroundRotationInterval = null;
        }
    }
    
    stopGame() {
        this.isPlaying = false;
        
        // Clear all intervals
        if (this.dpsInterval) {
            clearInterval(this.dpsInterval);
            this.dpsInterval = null;
        }
        if (this.backgroundRotationInterval) {
            clearInterval(this.backgroundRotationInterval);
            this.backgroundRotationInterval = null;
        }
        if (this.blinkInterval) {
            clearInterval(this.blinkInterval);
            this.blinkInterval = null;
        }
        if (this.rickInterval) {
            clearInterval(this.rickInterval);
            this.rickInterval = null;
        }
    }
    
    updateHelpers() {
        // Animate helpers
        this.helpers.forEach(helper => {
            // Helper animation logic would go here
        });
    }
    
    updateUI() {
        console.log('updateUI called');
        // Update dogecoin display
        document.getElementById('dogecoin-amount').textContent = this.formatNumber(Math.floor(this.dogecoins));
        document.getElementById('dps-amount').textContent = this.formatNumber(this.dps);
        
        // Dynamic DPS logo positioning based on text length
        const dpsIcon = document.querySelector('.stat-item:nth-child(2) .stat-icon');
        const dpsText = document.getElementById('dps-amount');
        if (dpsIcon && dpsText) {
            const textLength = dpsText.textContent.length;
            // Adjust logo position based on text length
            if (textLength >= 4) {
                dpsIcon.style.transform = 'translateX(-15px)'; // Move further left for longer text
            } else if (textLength >= 3) {
                dpsIcon.style.transform = 'translateX(-10px)'; // Move left for medium text
            } else {
                dpsIcon.style.transform = 'translateX(0px)'; // Default position for short text
            }
        }
        
        // Update shop prices and quantities without rebuilding the entire shop
        this.updateShopPrices();
        
        document.getElementById('total-mined').textContent = this.formatNumber(Math.floor(this.totalMined));
        document.getElementById('total-clicks').textContent = this.formatNumber(this.totalClicks);
        document.getElementById('helpers-owned').textContent = this.helpers.length;
        document.getElementById('current-level').textContent = 'Earth'; // Default level name
        
        // Update play time
        const currentPlayTime = Math.floor((Date.now() - this.startTime) / 1000) + this.totalPlayTime;
        document.getElementById('play-time').textContent = this.formatTime(currentPlayTime);
        document.getElementById('highest-dps').textContent = this.formatNumber(this.highestDps);
        
        // Rock health system removed - simplified mining
    }
    
    formatTime(seconds) {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;
        
        if (hours > 0) {
            return `${hours}h ${minutes}m ${secs}s`;
        } else if (minutes > 0) {
            return `${minutes}m ${secs}s`;
        } else {
            return `${secs}s`;
        }
    }
    
    formatNumber(num) {
        if (num >= 1e12) return (num / 1e12).toFixed(2) + 'T';
        if (num >= 1e9) return (num / 1e9).toFixed(2) + 'B';
        if (num >= 1e6) return (num / 1e6).toFixed(2) + 'M';
        if (num >= 1e3) return (num / 1e3).toFixed(2) + 'K';
        return Math.floor(num).toString();
    }
    
    showNotification(message) {
        const notification = document.createElement('div');
        notification.className = 'notification';
        notification.textContent = message;
        
        document.getElementById('notifications').appendChild(notification);
        
        setTimeout(() => {
            notification.remove();
        }, 3000);
    }
    
    playSound(soundFile) {
        // Sound implementation would go here
        // For now, we'll just log the sound
        console.log('Playing sound:', soundFile);
    }
    
    checkAchievements() {
        // Achievement system - empty for now, ready for custom achievements
    }
    
    
    saveGame() {
        const saveData = {
            dogecoins: this.dogecoins,
            totalMined: this.totalMined,
            totalClicks: this.totalClicks,
            dps: this.dps,
            currentLevel: this.currentLevel,
            helpers: this.helpers,
            timestamp: Date.now()
        };
        
        localStorage.setItem('dogeminer_save', JSON.stringify(saveData));
        this.lastSave = Date.now();
    }
    
    loadGame() {
        const saveData = localStorage.getItem('dogeminer_save');
        if (saveData) {
            try {
                const data = JSON.parse(saveData);
                this.dogecoins = data.dogecoins || 0;
                this.totalMined = data.totalMined || 0;
                this.totalClicks = data.totalClicks || 0;
                this.dps = data.dps || 0;
                this.currentLevel = data.currentLevel || 'earth';
                this.helpers = data.helpers || [];
                
                this.updateDPS();
                this.updateUI();
                // Notification handled by main.js
                return true;
            } catch (e) {
                console.error('Error loading save data:', e);
                this.showNotification('Error loading save data!');
                return false;
            }
        }
        return false;
    }
    
    resetGame() {
        if (confirm('Are you sure you want to reset your game? This cannot be undone!')) {
            localStorage.removeItem('dogeminer_save');
            location.reload();
        }
    }
}

// Global game instance
let game;
