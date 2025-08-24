export class LoadingScreen {
    constructor() {
        this.loadingScreen = document.getElementById('loading-screen');
        this.loadingStatus = document.getElementById('loading-status');
        this.loadingProgress = document.getElementById('loading-progress');
        this.loadingBar = document.querySelector('.loading-bar');
        this.loadingSpinner = document.querySelector('.loading-spinner');
        this.clickToStart = document.getElementById('click-to-start');
        this.currentProgress = 0;
        this.isVisible = true;
        this.waitingForClick = false;
        this.onStartCallback = null;

        // Set up click event listener
        if (this.clickToStart) {
            this.clickToStart.addEventListener('click', () => {
                if (this.waitingForClick && this.onStartCallback) {
                    this.onStartCallback();
                }
            });
        }
    }

    updateStatus(message) {
        if (this.loadingStatus) {
            this.loadingStatus.textContent = message;
            if (window.DEBUG_LOG) console.log(`Loading: ${message}`);
        }
    }

    updateProgress(percentage) {
        this.currentProgress = Math.max(0, Math.min(100, percentage));
        if (this.loadingProgress) {
            this.loadingProgress.style.width = `${this.currentProgress}%`;
        }
    }

    setProgress(percentage, message) {
        this.updateProgress(percentage);
        if (message) {
            this.updateStatus(message);
        }
    }

    hide() {
        if (this.loadingScreen && this.isVisible) {
            this.loadingScreen.classList.add('hidden');
            this.isVisible = false;
            this.waitingForClick = false;
            if (window.DEBUG_LOG) console.log("Loading screen hidden");
        }
    }

    show() {
        if (this.loadingScreen && !this.isVisible) {
            this.loadingScreen.classList.remove('hidden');
            this.isVisible = true;
            this.waitingForClick = false;
            if (window.DEBUG_LOG) console.log("Loading screen shown");
        }
    }

    showClickToStart(callback) {
        this.waitingForClick = true;
        this.onStartCallback = callback;
        
        // Hide loading elements
        if (this.loadingSpinner) {
            this.loadingSpinner.classList.add('hidden');
        }
        if (this.loadingBar) {
            this.loadingBar.classList.add('hidden');
        }
        
        // Show start button
        if (this.clickToStart) {
            this.clickToStart.classList.add('visible');
        }
        
        if (window.DEBUG_LOG) console.log("Waiting for user to click start...");
    }

    hideClickToStart() {
        this.waitingForClick = false;
        this.onStartCallback = null;
        
        // Show loading elements
        if (this.loadingSpinner) {
            this.loadingSpinner.classList.remove('hidden');
        }
        if (this.loadingBar) {
            this.loadingBar.classList.remove('hidden');
        }
        
        // Hide start button
        if (this.clickToStart) {
            this.clickToStart.classList.remove('visible');
        }
    }

    isHidden() {
        return !this.isVisible;
    }

    isWaitingForClick() {
        return this.waitingForClick;
    }
}
