import * as THREE from 'three';
import WebGL from 'three/addons/capabilities/WebGL.js';
import Stats from 'three/stats';

export class GameEngine {
    constructor() {
        this.initializeRenderer();
        this.initializeScene();
        this.initializeStats();
        this.initializeTimeTracking();
        this.setupEventListeners();
    }

    initializeRenderer() {
        // Create renderer using best available option
        if (WebGL.isWebGL2Available()) {
            this.renderer = new THREE.WebGLRenderer({ 
                antialias: true,
                powerPreference: 'high-performance' 
            });
            if (window.DEBUG_LOG) console.log("Using WebGL2 renderer");
        } else {
            this.renderer = new THREE.WebGLRenderer({ antialias: true });
            if (window.DEBUG_LOG) console.log("Using WebGL1 renderer");
        }
        
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.shadowMap.enabled = true;
        document.body.appendChild(this.renderer.domElement);
    }

    initializeScene() {
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        
        // Add basic lighting
        const ambient = new THREE.AmbientLight(0xffffff, 0.5);
        this.scene.add(ambient);
        
        // Add basic fog
        this.scene.fog = new THREE.Fog(0xcccccc, 100, 800);
    }

    initializeStats() {
        this.stats = new Stats();
        this.stats.dom.style.position = 'absolute';
        document.body.appendChild(this.stats.dom);
        
        // For performance tracking
        this.stats.addPanel(new Stats.Panel('FPS', '#0ff', '#002'));
        this.stats.showPanel(0);
    }

    initializeTimeTracking() {
        this.clock = new THREE.Clock();
        this.previousRAF = null;
        this.fixedTimeStep = 1/60; // 60 FPS physics
        this.timeAccumulator = 0;
    }

    setupEventListeners() {
        window.addEventListener('resize', () => this.onWindowResize());
    }

    onWindowResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }

    async compileScene() {
        return new Promise((resolve) => {
            if (window.DEBUG_LOG) console.log("Pre-compiling shaders and materials...");
            
            // Use WebGLRenderer.compile to pre-compile all shaders and materials
            // This eliminates stutters during gameplay when new materials are first rendered
            this.renderer.compile(this.scene, this.camera);
            
            // Also force a single render pass to ensure everything is compiled
            this.renderer.render(this.scene, this.camera);
            
            if (window.DEBUG_LOG) console.log("Shader compilation complete");
            
            // Use requestAnimationFrame to ensure compilation is fully complete
            requestAnimationFrame(() => {
                resolve();
            });
        });
    }

    render() {
        this.renderer.render(this.scene, this.camera);
    }

    dispose() {
        // Clean up event listeners
        window.removeEventListener('resize', this.onWindowResize);
        
        // Dispose renderer
        if (this.renderer) {
            this.renderer.dispose();
        }
        
        // Clear scene
        if (this.scene) {
            this.scene.traverse(object => {
                if (object.isMesh) {
                    if (object.geometry) object.geometry.dispose();
                    if (object.material) object.material.dispose();
                }
            });
        }
    }
}
