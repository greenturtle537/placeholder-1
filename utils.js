// Shared utility functions for the FPS engine

export function clamp(x, a, b) {
    return Math.min(Math.max(x, a), b);
}

// Add other utility functions as needed
export function lerp(a, b, t) {
    return a + (b - a) * t;
}

export function degToRad(degrees) {
    return degrees * (Math.PI / 180);
}

export function radToDeg(radians) {
    return radians * (180 / Math.PI);
}
