// Key mappings
export const KEYS = {
    a: 65,
    s: 83,
    w: 87,
    d: 68,
    q: 81,  // Q key for debug mode toggle (freefly/FPS mode)
    space: 32,
    shift: 16,
    left: 37,
    up: 38,
    right: 39,
    down: 40,
    ctrl: 17,
    plus: 187,      // + key for speed increase
    minus: 189,     // - key for speed decrease
    numpadPlus: 107,    // Numpad + key
    numpadMinus: 109,   // Numpad - key
};

export class InputController {
    constructor(target) {
        this.target_ = target || document;
        this.initialize_();
    }

    initialize_() {
        this.current_ = {
            leftButton: false,
            rightButton: false,
            mouseXDelta: 0,
            mouseYDelta: 0,
            mouseX: 0,
            mouseY: 0,
        };
        this.previous_ = null;
        this.keys_ = {};
        this.previousKeys_ = {};
        this.target_.addEventListener("click", (e) => this.onClick_(e), false);
        this.target_.addEventListener("mousedown", (e) => this.onMouseDown_(e), false);
        this.target_.addEventListener("mousemove", (e) => this.onMouseMove_(e), false);
        this.target_.addEventListener("mouseup", (e) => this.onMouseUp_(e), false);
        this.target_.addEventListener("keydown", (e) => this.onKeyDown_(e), false);
        this.target_.addEventListener("keyup", (e) => this.onKeyUp_(e), false);
    }

    onClick_(e) {
        const canvas = document.querySelector("canvas");
        const promise = canvas.requestPointerLock({
            unadjustedMovement: true,
        });

        if (!promise) {
            if (window.DEBUG_LOG) console.log("disabling mouse acceleration is not supported");
            return;
        }

        return promise
            .then(() => {
                if (window.DEBUG_LOG) console.log("pointer is locked");
            })
            .catch((error) => {
                if (error.name === "NotSupportedError") {
                    // Some platforms may not support unadjusted movement.
                    // You can request again a regular pointer lock.
                    return canvas.requestPointerLock();
                }
            });
    }

    onMouseMove_(e) {
        this.current_.mouseX = e.screenX;
        this.current_.mouseY = e.screenY;

        if (this.previous_ === null) {
            this.previous_ = { ...this.current_ };
        }
        this.current_.mouseXDelta = e.movementX;
        this.current_.mouseYDelta = e.movementY;
    }

    onMouseDown_(e) {
        this.onMouseMove_(e);

        switch (e.button) {
            case 0: {
                this.current_.leftButton = true;
                break;
            }
            case 2: {
                this.current_.rightButton = true;
                break;
            }
        }
    }

    onMouseUp_(e) {
        this.onMouseMove_(e);

        switch (e.button) {
            case 0: {
                this.current_.leftButton = false;
                break;
            }
            case 2: {
                this.current_.rightButton = false;
                break;
            }
        }
    }

    onKeyDown_(e) {
        this.keys_[e.keyCode] = true;
    }

    onKeyUp_(e) {
        this.keys_[e.keyCode] = false;
    }

    key(keyCode) {
        return !!this.keys_[keyCode];
    }

    isReady() {
        return this.previous_ !== null;
    }

    update(_) {
        if (this.previous_ !== null) {
            this.current_.mouseXDelta = this.current_.mouseX - this.previous_.mouseX;
            this.current_.mouseYDelta = this.current_.mouseY - this.previous_.mouseY;
            this.previous_ = { ...this.current_ };
        }
    }
}
