import * as THREE from 'three';
import { InputController, KEYS } from './input-controller.js';
import { clamp } from './utils.js';

export class FirstPersonCamera {
    constructor(camera, objects, collisionSystem, levelLoadedCallback) {
        this.camera_ = camera;
        this.input_ = new InputController();
        this.rotation_ = new THREE.Quaternion();
        this.translation_ = new THREE.Vector3(0, 0, 0);
        this.phi_ = 0;
        this.phiSpeed_ = 8;
        this.theta_ = 0;
        this.thetaSpeed_ = 5;
        this.headBobActive_ = false;
        this.headBobTimer_ = 0;
        this.objects_ = objects || [];
        this.forwardSpeed_ = 2;
        this.strafeSpeed_ = 2;
        this.verticalSpeed_ = 2; // Added for freefly mode
        this.bobIntensity_ = 0.1;
        this.collisionSystem_ = collisionSystem; // Collision detection system
        this.freeflyMode_ = false; // Track camera mode
        this.levelLoadedCallback_ = levelLoadedCallback; // Function to check if level is loaded
        this.inputPaused_ = false; // Flag to pause input processing
        
        // Speed control for freefly mode
        this.freeflySpeedMultiplier_ = 1.0;
        this.minSpeedMultiplier_ = 0.1;
        this.maxSpeedMultiplier_ = 1000.0;
        this.speedIncrement_ = 1;
        this.plusKeyPressed_ = false;
        this.minusKeyPressed_ = false;
    }

    // Toggle between FPS and freefly mode
    toggleFreeflyMode(enabled) {
        this.freeflyMode_ = enabled;
        // Reset speed multiplier when entering freefly mode
        if (enabled) {
            this.freeflySpeedMultiplier_ = 10.0;
            if (window.DEBUG_LOG) console.log("Freefly speed: 1.0x (use +/- keys to adjust)");
        }
    }

    // Pause/unpause input processing
    pauseInput(paused) {
        this.inputPaused_ = paused;
    }

    // Handle speed control in freefly mode
    updateFreeflySpeedControl_() {
        if (!this.freeflyMode_) return;

        const plusPressed = this.input_.key(KEYS.plus) || this.input_.key(KEYS.numpadPlus);
        const minusPressed = this.input_.key(KEYS.minus) || this.input_.key(KEYS.numpadMinus);

        // Increase speed on + key press (not hold)
        if (plusPressed && !this.plusKeyPressed_) {
            this.freeflySpeedMultiplier_ = Math.min(
                this.freeflySpeedMultiplier_ + this.speedIncrement_,
                this.maxSpeedMultiplier_
            );
            if (window.DEBUG_LOG) console.log(`Freefly speed: ${this.freeflySpeedMultiplier_.toFixed(1)}x`);
        }

        // Decrease speed on - key press (not hold)
        if (minusPressed && !this.minusKeyPressed_) {
            this.freeflySpeedMultiplier_ = Math.max(
                this.freeflySpeedMultiplier_ - this.speedIncrement_,
                this.minSpeedMultiplier_
            );
            if (window.DEBUG_LOG) console.log(`Freefly speed: ${this.freeflySpeedMultiplier_.toFixed(1)}x`);
        }

        // Update key states
        this.plusKeyPressed_ = plusPressed;
        this.minusKeyPressed_ = minusPressed;
    }

    update(timeElapsedS) {
        // Don't update if level is not loaded yet, pointer is not locked, or input is paused
        if (!document.pointerLockElement || 
            (this.levelLoadedCallback_ && !this.levelLoadedCallback_()) ||
            this.inputPaused_) {
            return;
        }
        
        // Update speed control for freefly mode
        this.updateFreeflySpeedControl_();
        
        this.updateRotation_(timeElapsedS);
        this.updateTranslation_(timeElapsedS);

        // Only apply head bob in FPS mode
        if (!this.freeflyMode_) {
            this.updateHeadBob_(timeElapsedS);
        }

        this.updateCamera_(timeElapsedS);
        this.input_.update(timeElapsedS);
    }

    updateCamera_(_) {
        this.camera_.quaternion.copy(this.rotation_);
        this.camera_.position.copy(this.translation_);

        // Only apply head bob in FPS mode
        if (!this.freeflyMode_) {
            this.camera_.position.y += Math.sin(this.headBobTimer_ * 10) * this.bobIntensity_;
        }

        // Update collision system with new player position, only in FPS mode
        if (this.collisionSystem_ && !this.freeflyMode_) {
            this.collisionSystem_.updatePlayerPosition(this.camera_.position, this.freeflyMode_);
        }
    }

    updateHeadBob_(timeElapsedS) {
        if (this.headBobActive_) {
            const wavelength = Math.PI;
            const nextStep = 1 + Math.floor(((this.headBobTimer_ + 0.000001) * 10) / wavelength);
            const nextStepTime = (nextStep * wavelength) / 10;
            this.headBobTimer_ = Math.min(
                this.headBobTimer_ + timeElapsedS,
                nextStepTime,
            );

            if (this.headBobTimer_ == nextStepTime) {
                this.headBobActive_ = false;
            }
        }
    }

    updateTranslation_(timeElapsedS) {
        const forwardVelocity =
            (this.input_.key(KEYS.w) ? 1 : 0) + (this.input_.key(KEYS.s) ? -1 : 0);
        const strafeVelocity =
            (this.input_.key(KEYS.a) ? 1 : 0) + (this.input_.key(KEYS.d) ? -1 : 0);

        // Vertical movement in freefly mode
        const verticalVelocity = this.freeflyMode_ ?
            (this.input_.key(KEYS.space) ? 1 : 0) + (this.input_.key(KEYS.shift) ? -1 : 0) : 0;

        const qx = new THREE.Quaternion();
        qx.setFromAxisAngle(new THREE.Vector3(0, 1, 0), this.phi_);

        // Apply speed multiplier in freefly mode
        const currentForwardSpeed = this.freeflyMode_ ? 
            this.forwardSpeed_ * this.freeflySpeedMultiplier_ : this.forwardSpeed_;
        const currentStrafeSpeed = this.freeflyMode_ ? 
            this.strafeSpeed_ * this.freeflySpeedMultiplier_ : this.strafeSpeed_;
        const currentVerticalSpeed = this.freeflyMode_ ? 
            this.verticalSpeed_ * this.freeflySpeedMultiplier_ : this.verticalSpeed_;

        const forward = new THREE.Vector3(0, 0, -1);
        forward.applyQuaternion(qx);
        forward.multiplyScalar(forwardVelocity * timeElapsedS * currentForwardSpeed);

        const left = new THREE.Vector3(-1, 0, 0);
        left.applyQuaternion(qx);
        left.multiplyScalar(strafeVelocity * timeElapsedS * currentStrafeSpeed);

        // Add vertical movement for freefly mode
        const up = new THREE.Vector3(0, 1, 0);
        up.multiplyScalar(verticalVelocity * timeElapsedS * currentVerticalSpeed);

        // Store current position for collision check
        const currentPosition = this.translation_.clone();
        
        // Calculate proposed new position
        const proposedPosition = currentPosition.clone();
        proposedPosition.add(forward);
        proposedPosition.add(left);

        if (this.freeflyMode_) {
            // In freefly mode, just apply movement with no collisions
            proposedPosition.add(up);
            this.translation_.copy(proposedPosition);
        } else {
            // In FPS mode, check collisions
            if (this.collisionSystem_) {
                const adjustedPosition = this.collisionSystem_.checkCollisions(
                    currentPosition,
                    proposedPosition
                );

                // Update with collision-adjusted position
                this.translation_.copy(adjustedPosition);
            } else {
                // No collision system, just update normally
                this.translation_.add(forward);
                this.translation_.add(left);
            }
        }

        if ((forwardVelocity != 0 || strafeVelocity != 0) && !this.freeflyMode_) {
            this.headBobActive_ = true;
        }

    }

    updateRotation_(timeElapsedS) {
        const xh = this.input_.current_.mouseXDelta / window.innerWidth;
        const yh = this.input_.current_.mouseYDelta / window.innerHeight;

        this.phi_ += -xh * this.phiSpeed_;
        this.theta_ = clamp(
            this.theta_ + -yh * this.thetaSpeed_,
            -Math.PI / 3,
            Math.PI / 3,
        );

        const qx = new THREE.Quaternion();
        qx.setFromAxisAngle(new THREE.Vector3(0, 1, 0), this.phi_);
        const qz = new THREE.Quaternion();
        qz.setFromAxisAngle(new THREE.Vector3(1, 0, 0), this.theta_);

        const q = new THREE.Quaternion();
        q.multiply(qx);
        q.multiply(qz);

        this.rotation_.copy(q);
    }
}
