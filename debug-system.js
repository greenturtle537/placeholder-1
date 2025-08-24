export class DebugSystem {
    constructor() {
        this.setupDebugPositionTracker();
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
        if (window.DEBUG_POSITION_TRACKER && this.debugPositionElement) {
            this.debugPositionElement.style.display = 'block';
        }
    }

    updateDebugPositionTracker(camera, levelLoading, levelLoaded, debugModeActive, collisionSystem, cameraInitializing = false) {
        if (!window.DEBUG_POSITION_TRACKER || !this.debugPositionElement) return;
        
        // Show loading status
        if (levelLoading && !levelLoaded) {
            this.posXElement.textContent = "Loading...";
            this.posYElement.textContent = "Loading...";
            this.posZElement.textContent = "Loading...";
            this.cameraModeElement.textContent = "Loading";
            return;
        }
        
        if (!levelLoaded) {
            this.posXElement.textContent = "Waiting...";
            this.posYElement.textContent = "Waiting...";
            this.posZElement.textContent = "Waiting...";
            this.cameraModeElement.textContent = "Waiting";
            return;
        }

        // Show camera initialization status
        if (cameraInitializing) {
            this.posXElement.textContent = camera.position.x.toFixed(2);
            this.posYElement.textContent = camera.position.y.toFixed(2);
            this.posZElement.textContent = camera.position.z.toFixed(2);
            this.cameraModeElement.textContent = "Initializing...";
            return;
        }
        
        // Update position display
        const pos = camera.position;
        this.posXElement.textContent = pos.x.toFixed(2);
        this.posYElement.textContent = pos.y.toFixed(2);
        this.posZElement.textContent = pos.z.toFixed(2);
        
        // Update camera mode
        this.cameraModeElement.textContent = debugModeActive ? 'Freefly' : 'FPS';
        
        // Update preserve position flag status
        this.preservePositionElement.textContent = window.DEBUG_PRESERVE_POSITION ? 'ON' : 'OFF';
        
        // Update collision info
        if (collisionSystem) {
            this.collisionCountElement.textContent = collisionSystem.lastFrameCollisionChecks.toString();
            this.activeCollidersElement.textContent = collisionSystem.colliders.length.toString();
        }
    }
}
