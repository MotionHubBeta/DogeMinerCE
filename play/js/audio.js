// DogeMiner: Community Edition - Audio Manager using Howler.js
class AudioManager {
    constructor() {
        this.musicEnabled = true;
        this.soundEnabled = true;
        this.currentTrack = null;
        this.introSound = null;
        this.loopSound = null;
        this.soundEffects = {};
    }

    init() {
        // Load background music
        this.loadLevel1Music();
        
        // Load sound effects
        this.loadSoundEffects();
        
        // Listen for settings changes
        this.setupSettingsListeners();
    }

    loadSoundEffects() {
        // Load swipe sound for tab switching
        this.soundEffects.swipe = new Howl({
            src: ['../assets/SoundsSrc/main/swipe3.wav'],
            volume: 0.5
        });
        
        // Load ching sound for purchasing
        this.soundEffects.ching = new Howl({
            src: ['../assets/SoundsSrc/main/ching.wav'],
            volume: 0.5
        });
        
        // Load uhoh sound for locked content
        this.soundEffects.uhoh = new Howl({
            src: ['../assets/SoundsSrc/main/uhoh.wav'],
            volume: 0.5
        });
        
        // Load pick sounds for rock hitting
        this.soundEffects.pick = [];
        for (let i = 1; i <= 6; i++) {
            this.soundEffects.pick.push(new Howl({
                src: [`../assets/SoundsSrc/main/pick${i}.wav`],
                volume: 0.375  // 75% of 0.5
            }));
        }
    }

    setupSettingsListeners() {
        // Listen for music setting changes
        const musicCheckbox = document.getElementById('music-enabled');
        if (musicCheckbox) {
            musicCheckbox.addEventListener('change', (e) => {
                this.musicEnabled = e.target.checked;
                // Sync with game settings
                if (window.game) {
                    window.game.musicEnabled = e.target.checked;
                }
                if (!this.musicEnabled) {
                    this.stopMusic();
                } else {
                    this.playBackgroundMusic();
                }
                // Trigger auto-save to save settings (don't show notification)
                if (window.saveManager) {
                    window.saveManager.saveGame(false);
                }
            });
        }

        // Listen for sound setting changes
        const soundCheckbox = document.getElementById('sound-enabled');
        if (soundCheckbox) {
            soundCheckbox.addEventListener('change', (e) => {
                this.soundEnabled = e.target.checked;
                // Sync with game settings
                if (window.game) {
                    window.game.soundEnabled = e.target.checked;
                }
                // Trigger auto-save to save settings (don't show notification)
                if (window.saveManager) {
                    window.saveManager.saveGame(false);
                }
            });
        }
    }

    loadLevel1Music() {
        // Create intro sound
        this.introSound = new Howl({
            src: ['../assets/SoundsSrc/musiclevel1/music_intro.mp3'],
            loop: false,
            autoplay: false,
            volume: 0.5,
            onend: () => {
                // When intro ends, play the loop
                if (this.musicEnabled) {
                    this.loopSound.play();
                }
            }
        });

        // Create loop sound
        this.loopSound = new Howl({
            src: ['../assets/SoundsSrc/musiclevel1/music.mp3'],
            loop: true,
            autoplay: false,
            volume: 0.5
        });
    }

    playBackgroundMusic() {
        if (!this.musicEnabled) return;
        
        // Stop any currently playing music
        this.stopMusic();
        
        // Play intro first, then loop
        if (this.introSound) {
            this.introSound.play();
        }
    }

    stopMusic() {
        if (this.introSound) {
            this.introSound.stop();
        }
        if (this.loopSound) {
            this.loopSound.stop();
        }
    }

    setMusicVolume(volume) {
        const clampedVolume = Math.max(0, Math.min(1, volume));
        if (this.introSound) {
            this.introSound.volume(clampedVolume);
        }
        if (this.loopSound) {
            this.loopSound.volume(clampedVolume);
        }
    }

    setSoundVolume(volume) {
        // Store volume for future sound effects
        this.soundVolume = Math.max(0, Math.min(1, volume));
    }

    // Play a sound effect
    playSound(soundName, options = {}) {
        if (!this.soundEnabled) return;

        const sound = this.soundEffects[soundName];
        if (sound) {
            // If it's an array (like pick sounds), pick a random one
            if (Array.isArray(sound)) {
                const randomIndex = Math.floor(Math.random() * sound.length);
                sound[randomIndex].play();
            } else {
                sound.play();
            }
        }
    }
}

// Global audio manager instance
let audioManager;
