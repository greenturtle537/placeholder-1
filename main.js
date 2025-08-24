import * as THREE from 'three';
import WebGL from 'three/addons/capabilities/WebGL.js';
import Stats from 'three/stats';
import { LevelGenerator } from './level-generator.js';
import { CollisionSystem } from './collision-system.js';
import { ResourceManager } from './resource-manager.js';
import { Tree } from './public/objects/tree.js';
import { FirstPersonCamera } from './first-person-camera.js';
import { KEYS } from './input-controller.js';
import { DebugSystem } from './debug-system.js';
import { GameEngine } from './game-engine.js';
import { LoadingScreen } from './loading-screen.js';

/* GLOBAL VARIABLES */

// Performance variables
window.USETEXTURECACHE = false;
Window.TEXTURECACHESIZE = 256; //Do not go past 2048.

// Debug flags
window.DEBUG_POSITION_TRACKER = true;  // Show position tracker UI
window.DEBUG_COLLISION_MESHES = false;  // Show green collision boxes
window.DEBUG_PLAYER_MESH = false;       // Show red player collision cylinder
window.DEBUG_PRESERVE_POSITION = false;  // Preserve player position when toggling Q debug mode
window.DEBUG_LOG = true;  // Control console log output for status and debug messages

class threejsdemo {
        constructor() {
                // Debug flag
                this.debug = true;
                
                // Level loading state
                this.levelLoaded = false;
                this.levelLoading = false;
                
                // Initialize game engine (handles renderer, scene, camera, stats)
                this.gameEngine = new GameEngine();
                
                // Get references from game engine
                this.scene = this.gameEngine.scene;
                this.camera = this.gameEngine.camera;
                this.renderer = this.gameEngine.renderer;
                this.stats = this.gameEngine.stats;
                this.clock = this.gameEngine.clock;
                this.previousRAF = this.gameEngine.previousRAF;
                this.fixedTimeStep = this.gameEngine.fixedTimeStep;
                this.timeAccumulator = this.gameEngine.timeAccumulator;
                
                // Create level generator instance
                this.levelGenerator = new LevelGenerator();
                
                // Create collision system with debug flags
                this.collisionSystem = new CollisionSystem(this.scene);
                
                // Set up custom FPS controls with head bobbing
                this.setupControls();
                
                // Resource manager for cleanup
                this.resourceManager = new ResourceManager();
                
                // Debug mode variables
                this.debugModeActive = false;
                this.qKeyPressed = false;
                
                // Camera initialization sequence state
                this.cameraInitializing = false;
                this.cameraInitComplete = false;
                this.initRotationAngle = 0;
                this.initStartTime = 0;
                this.initPauseTime = 10; // 10 milliseconds pause between rotations
                this.initRotationStep = 45; // 45 degrees per step
                this.initTotalRotations = 360 / this.initRotationStep; // 8 steps total
                this.initCurrentStep = 0;
                this.initCameraStartPosition = null;
                
                // Initialize debug system
                this.debugSystem = new DebugSystem();
                
                // Initialize loading screen
                this.loadingScreen = new LoadingScreen();
                this.loadingScreen.setProgress(0, "Initializing engine...");
                
                // Start loading level asynchronously
                this.initializeLevel();
        }
        
        async initializeLevel() {
                try {
                        this.levelLoading = true;
                        this.loadingScreen.setProgress(10, "Loading level assets...");
                        if (window.DEBUG_LOG) console.log("Loading level...");
                        
                        // Load and generate the level
                        await this.loadLevel('./public/levels/level1.json');
                        
                        this.loadingScreen.setProgress(60, "Compiling shaders and materials...");
                        if (window.DEBUG_LOG) console.log("Level loaded, compiling shaders and assets...");
                        
                        // Pre-compile all shaders and materials for smooth rendering
                        await this.compileScene();
                        
                        // Start camera initialization sequence
                        this.loadingScreen.setProgress(80, "Initializing camera system...");
                        if (window.DEBUG_LOG) console.log("Starting camera initialization sequence...");
                        this.startCameraInitialization();
                        
                        this.levelLoaded = true;
                        this.levelLoading = false;
                        if (window.DEBUG_LOG) console.log("Level loaded successfully, shaders compiled, controls enabled");
                        
                        // Start animation loop now that level is loaded
                        if (this.previousRAF === null) {
                                this.animate();
                        }
                } catch (error) {
                        console.error("Failed to initialize level:", error);
                        this.loadingScreen.setProgress(0, "Error loading level - Check console");
                        this.levelLoading = false;
                }
        }
        
        async compileScene() {
                return this.gameEngine.compileScene();
        }
        
        async loadLevel(levelFile) {
                try {
                        // Clear any existing level
                        if (this.currentLevel) {
                                this.scene.remove(this.currentLevel);
                                
                                // Clean up resources
                                this.collisionSystem.clear();
                        }
                
                        // Generate level from JSON
                        const level = await this.levelGenerator.loadLevel(levelFile);

                        this.scene.add(level);
                        this.currentLevel = level;
                        
                        // Set player at starting position
                        if (level.userData.startPosition) {
                                this.camera.position.copy(level.userData.startPosition);
                                this.fpsCamera.translation_.copy(level.userData.startPosition);
                                
                                // Store starting position for debug mode respawn
                                this.startPosition = level.userData.startPosition.clone();
                                
                                // Create player collider
                                this.collisionSystem.createPlayerCollider(level.userData.startPosition);
                        }
                        
                        // Create colliders from level
                        this.setupColliders(level);
                        
                        // Log collision statistics
                        this.collisionSystem.logCollisionStats();
                        
                        if (window.DEBUG_LOG) console.log("Level setup complete");
                } catch (error) {
                        console.error("Failed to load level:", error);
                }
        }
        
        setupColliders(levelGroup) {
                levelGroup.traverse((object) => {
                        // Add colliders for mesh objects, but skip those marked as non-collidable
                        if (object.isMesh && !object.userData.noCollision) {
                                this.collisionSystem.addCollider(object);
                        } else if (object.isMesh && object.userData.noCollision) {
                                // Log skipped objects for debugging
                                if (window.DEBUG_LOG) console.log(`Skipping collision for ${object.userData.reason || 'unmarked'} object`);
                        }
                });
        }
        
        setupControls() {
                // Create the custom FPS camera controller with collision system and level loading check
                this.fpsCamera = new FirstPersonCamera(
                    this.camera, 
                    null, 
                    this.collisionSystem,
                    () => this.levelLoaded // Callback to check if level is loaded
                );
                
                // Add basic lighting if no level is loaded yet
                const ambient = new THREE.AmbientLight(0xffffff, 0.5);
                this.scene.add(ambient);
                
                // Add basic fog
                this.scene.fog = new THREE.Fog( 0xcccccc, 100, 800 );

        }
        
        setupDebugPositionTracker() {
                // Get debug elements
                this.debugPositionElement = document.getElementById('debug-position');
                this.posXElement = document.getElementById('pos-x');
                this.posYElement = document.getElementById('pos-y');
                this.posZElement = document.getElementById('pos-z');
                this.cameraModeElement = document.getElementById('camera-mode');
                this.preservePositionElement = document.getElementById('preserve-position');
                this.collisionCountElement = document.getElementById('collision-count');
                this.activeCollidersElement = document.getElementById('active-colliders');
                
                // Show/hide based on debug flag
                if (window.DEBUG_POSITION_TRACKER) {
                        this.debugPositionElement.style.display = 'block';
                }
        }
        
        updateDebugPositionTracker() {
                this.debugSystem.updateDebugPositionTracker(
                    this.camera,
                    this.levelLoading,
                    this.levelLoaded,
                    this.debugModeActive,
                    this.collisionSystem,
                    this.cameraInitializing
                );
        }
        
        updateTreeBillboards() {
                if (!this.currentLevel) return;
                
                // Find all tree objects in the scene and update their billboard behavior
                this.currentLevel.traverse((object) => {
                        if (object.name && (object.name.includes('tree') || object.name === 'tree')) {
                                Tree.updateBillboard(object, this.camera);
                        }
                });
        }
        
        startCameraInitialization() {
                this.cameraInitializing = true;
                this.cameraInitComplete = false;
                this.initCurrentStep = 0;
                this.initRotationAngle = 0;
                this.initStartTime = Date.now();
                
                // Pause player input during initialization
                if (this.fpsCamera) {
                        this.fpsCamera.pauseInput(true);
                }
                
                // Store the starting position for restoration later
                this.initCameraStartPosition = this.camera.position.clone();
                
                // Set camera to look directly along horizon (0 pitch)
                this.camera.rotation.set(0, 0, 0);
                
                if (window.DEBUG_LOG) console.log("Camera initialization: Starting 360° horizon scan...");
        }
        
        updateCameraInitialization() {
                if (!this.cameraInitializing || this.cameraInitComplete) return;
                
                const currentTime = Date.now();
                const timeSinceLastRotation = currentTime - this.initStartTime;
                
                // Check if enough time has passed for the next rotation
                if (timeSinceLastRotation >= this.initPauseTime) {
                        // Perform the next rotation step
                        this.initRotationAngle = (this.initCurrentStep * this.initRotationStep) * (Math.PI / 180);
                        this.camera.rotation.y = this.initRotationAngle;
                        
                        // Force a render to compile shaders for this view angle
                        this.gameEngine.render();
                        
                        // Update loading screen progress (80% + 20% for camera init)
                        const cameraProgress = (this.initCurrentStep / this.initTotalRotations) * 20;
                        const totalProgress = 80 + cameraProgress;
                        const degrees = (this.initRotationAngle * 180 / Math.PI).toFixed(0);
                        this.loadingScreen.setProgress(totalProgress, `Scanning environment... ${degrees}°`);
                        
                        this.initCurrentStep++;
                        this.initStartTime = currentTime;
                        
                        if (window.DEBUG_LOG) {
                                console.log(`Camera initialization: Rotation step ${this.initCurrentStep}/${this.initTotalRotations} (${degrees}°)`);
                        }
                        
                        // Check if we've completed the full rotation
                        if (this.initCurrentStep >= this.initTotalRotations) {
                                this.completeCameraInitialization();
                        }
                }
        }
        
        completeCameraInitialization() {
                this.cameraInitializing = false;
                this.cameraInitComplete = true;
                
                // Complete loading screen and show click to start
                this.loadingScreen.setProgress(100, "Loading Complete!");
                this.loadingScreen.showClickToStart(() => {
                        this.startGame();
                });
                
                if (window.DEBUG_LOG) console.log("Camera initialization complete - waiting for user to start");
        }

        startGame() {
                // Hide loading screen
                this.loadingScreen.hide();
                
                // Re-enable player input
                if (this.fpsCamera) {
                        this.fpsCamera.pauseInput(false);
                }
                
                // Reset camera rotation to face forward (0 degrees)
                this.camera.rotation.set(0, 0, 0);
                
                // Restore the FPS camera's internal state to match
                if (this.fpsCamera) {
                        this.fpsCamera.phi_ = 0;
                        this.fpsCamera.theta_ = 0;
                        this.fpsCamera.rotation_.set(0, 0, 0, 1); // Reset quaternion
                        this.fpsCamera.translation_.copy(this.initCameraStartPosition);
                }
                
                if (window.DEBUG_LOG) console.log("Game started - player controls enabled");
        }
        
        checkGoalReached() {
                if (!this.goalPosition) return false;
                
                const distance = this.camera.position.distanceTo(this.goalPosition);
                if (distance < 1.5) {
                        if (window.DEBUG_LOG) console.log("Goal reached!");
                        return true;
                }
                return false;
        }
        
        // Handle debug mode toggle
        checkDebugModeToggle() {
                if (!this.debug) return;
                
                const qKeyCurrentlyPressed = this.fpsCamera.input_.key(KEYS.q);
                
                // Toggle only on key press (not hold)
                if (qKeyCurrentlyPressed && !this.qKeyPressed) {
                        // Toggle debug mode
                        this.debugModeActive = !this.debugModeActive;
                        
                        // Update camera mode
                        this.fpsCamera.toggleFreeflyMode(this.debugModeActive);
                        
                        if (this.debugModeActive) {
                                if (window.DEBUG_LOG) console.log("Debug: Freefly mode activated");
                        } else {
                                if (window.DEBUG_LOG) console.log("Debug: FPS mode restored");
                                // Only reset to start position if DEBUG_PRESERVE_POSITION is false
                                if (!window.DEBUG_PRESERVE_POSITION) {
                                        this.fpsCamera.translation_.copy(this.startPosition);
                                        if (window.DEBUG_LOG) console.log("Debug: Player position reset to spawn");
                                } else {
                                        if (window.DEBUG_LOG) console.log("Debug: Player position preserved");
                                }
                        }
                }
                
                // Update key state
                this.qKeyPressed = qKeyCurrentlyPressed;
        }
        
        onWindowResize() {
                this.gameEngine.onWindowResize();
        }
        
        animate() {
                requestAnimationFrame((t) => {
                        if (this.previousRAF === null) {
                                this.previousRAF = t;
                        }
                        
                        // Get elapsed time in seconds (with max to avoid spiral of death on tab switch)
                        const timeElapsedS = Math.min((t - this.previousRAF) * 0.001, 0.1);
                        
                        // Fixed timestep for physics/collision updates
                        this.timeAccumulator += timeElapsedS;
                        
                        // Update at fixed intervals for consistent physics
                        while (this.timeAccumulator >= this.fixedTimeStep) {
                                // Only update game logic if level is loaded
                                if (this.levelLoaded) {
                                        // Handle camera initialization sequence (prevents player input)
                                        if (this.cameraInitializing) {
                                                this.updateCameraInitialization();
                                        } else if (this.cameraInitComplete) {
                                                // Normal game logic only after camera initialization is complete
                                                // Check for debug mode toggle
                                                this.checkDebugModeToggle();
                                                
                                                // Update camera with head bobbing
                                                this.fpsCamera.update(this.fixedTimeStep);
                                                
                                                // Update tree billboards to face camera
                                                this.updateTreeBillboards();
                                                
                                                // Check if goal reached
                                                this.checkGoalReached();
                                        }
                                }
                                
                                this.timeAccumulator -= this.fixedTimeStep;
                        }
                        
                        // Update stats
                        this.stats.update();
                        
                        // Update debug position tracker
                        this.updateDebugPositionTracker();
                        
                        // Render the scene
                        this.gameEngine.render();
                        
                        this.previousRAF = t;
                        this.animate();
                });
        }
        
        // Clean up resources when changing levels or closing
        dispose() {
                // Dispose resources
                this.resourceManager.dispose();
                
                // Dispose game engine
                this.gameEngine.dispose();
        }
}

let _APP = null;

// Check for WebGL2 compatibility first, then fall back to WebGL1
if (WebGL.isWebGL2Available()) {
    // WebGL2 is available - best performance
    window.addEventListener("DOMContentLoaded", () => {
        _APP = new threejsdemo();
    });
} else if (WebGL.isWebGLAvailable()) {
    // WebGL1 is available as fallback - limited functionality
    if (window.DEBUG_LOG) console.log("WebGL2 not available, falling back to WebGL1");
    
    // Create warning but wait until after DOM content loaded to add it
    window.addEventListener("DOMContentLoaded", () => {
        // Create and show a warning about using WebGL1
        const webglVersionWarning = document.createElement("div");
        webglVersionWarning.style.position = "absolute";
        webglVersionWarning.style.top = "10px";
        webglVersionWarning.style.left = "10px";
        webglVersionWarning.style.backgroundColor = "rgba(255, 255, 0, 0.7)";
        webglVersionWarning.style.padding = "5px";
        webglVersionWarning.style.borderRadius = "5px";
        webglVersionWarning.style.color = "black";
        webglVersionWarning.style.zIndex = "10"; // Lower than container but still visible
        webglVersionWarning.innerHTML = "⚠️ Using WebGL1 - Some features may be limited";
        document.body.appendChild(webglVersionWarning);
        
        // Initialize the application
        _APP = new threejsdemo();
    });
} else {
    // Neither WebGL2 nor WebGL1 is available
    const container = document.getElementById("container");
    
    // Make container visible for error messages
    container.style.display = "flex";
    
    // Use official Three.js error message
    const webglError = WebGL.getWebGLErrorMessage();
    container.appendChild(webglError);
    
    // Add a more detailed explanation
    const detailedError = document.createElement("div");
    detailedError.style.maxWidth = "500px";
    detailedError.style.textAlign = "center";
    detailedError.style.margin = "20px";
    detailedError.innerHTML = `
        <h2>WebGL Not Available</h2>
        <p>This application requires WebGL support to run. Your browser or device does not appear to support WebGL.</p>
        <p>You can try the following:</p>
        <ul style="text-align: left">
            <li>Make sure your graphics drivers are up to date</li>
            <li>Try using a different, more modern browser</li>
            <li>Check if hardware acceleration is enabled in your browser settings</li>
            <li>If using a mobile device, try a desktop computer</li>
        </ul>
    `;
    container.appendChild(detailedError);
}