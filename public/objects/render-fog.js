import * as THREE from 'three';

export class RenderFog {
    constructor(scene, renderer) {
        this.scene = scene;
        this.renderer = renderer;
        this.time = 0;
        
        return this.createStormyFog();
    }

    createStormyFog() {
        const group = new THREE.Group();

        // Main atmospheric fog
        this.setupAtmosphericFog();
        
        // Volumetric fog layers
        this.createVolumeFogLayers(group);
        
        // Rain/mist particles
        this.createStormParticles(group);
        
        // Dynamic lighting effects
        this.setupStormLighting();

        return group;
    }

    setupAtmosphericFog() {
        // Base fog for distance culling and atmosphere
        const fogColor = new THREE.Color(0x666666); // Dark gray for stormy weather
        this.scene.fog = new THREE.FogExp2(fogColor, 0.003); // Exponential fog for more realistic falloff
        
        // Set renderer clear color to match fog
        this.renderer.setClearColor(fogColor, 1.0);
    }

    createVolumeFogLayers(group) {
        // Create multiple fog layers for depth and realism
        const fogLayers = [
            { height: 50, density: 0.8, color: 0x888888, speed: 0.5 },  // Low heavy fog
            { height: 100, density: 0.6, color: 0x999999, speed: 0.3 }, // Mid-level mist
            { height: 200, density: 0.4, color: 0xaaaaaa, speed: 0.2 }  // High wispy clouds
        ];

        fogLayers.forEach((layer, index) => {
            const fogMesh = this.createFogLayer(layer, index);
            group.add(fogMesh);
        });
    }

    createFogLayer(layer, index) {
        // Create fog geometry - large planes that move around the player
        const geometry = new THREE.PlaneGeometry(2000, 2000, 32, 32);
        
        // Create fog material with transparency and movement
        const material = new THREE.ShaderMaterial({
            transparent: true,
            depthWrite: false,
            side: THREE.DoubleSide,
            uniforms: {
                time: { value: 0.0 },
                opacity: { value: layer.density },
                color: { value: new THREE.Color(layer.color) },
                speed: { value: layer.speed },
                layerOffset: { value: index * 100 }
            },
            vertexShader: `
                varying vec2 vUv;
                varying vec3 vPosition;
                uniform float time;
                uniform float speed;
                uniform float layerOffset;
                
                void main() {
                    vUv = uv;
                    vPosition = position;
                    
                    // Add some wave motion to the fog
                    vec3 pos = position;
                    pos.z += sin(pos.x * 0.01 + time * speed) * 10.0;
                    pos.z += cos(pos.y * 0.01 + time * speed * 0.7) * 8.0;
                    
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
                }
            `,
            fragmentShader: `
                varying vec2 vUv;
                varying vec3 vPosition;
                uniform float time;
                uniform float opacity;
                uniform vec3 color;
                uniform float speed;
                uniform float layerOffset;
                
                // Simple noise function
                float noise(vec2 st) {
                    return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123);
                }
                
                // Fractal noise for cloud-like patterns
                float fractalNoise(vec2 st) {
                    float value = 0.0;
                    float amplitude = 0.5;
                    float frequency = 1.0;
                    
                    for (int i = 0; i < 4; i++) {
                        value += amplitude * noise(st * frequency);
                        frequency *= 2.0;
                        amplitude *= 0.5;
                    }
                    
                    return value;
                }
                
                void main() {
                    vec2 st = vUv * 4.0;
                    
                    // Animate the noise pattern
                    st.x += time * speed * 0.1;
                    st.y += time * speed * 0.05;
                    
                    // Create cloud-like patterns
                    float fogPattern = fractalNoise(st);
                    fogPattern = smoothstep(0.3, 0.8, fogPattern);
                    
                    // Add some turbulence for storm effect
                    float turbulence = fractalNoise(st * 2.0 + time * speed * 0.2);
                    fogPattern *= (0.7 + turbulence * 0.3);
                    
                    // Fade at edges
                    float edgeFade = smoothstep(0.0, 0.2, vUv.x) * smoothstep(1.0, 0.8, vUv.x) *
                                    smoothstep(0.0, 0.2, vUv.y) * smoothstep(1.0, 0.8, vUv.y);
                    
                    float alpha = fogPattern * opacity * edgeFade;
                    
                    gl_FragColor = vec4(color, alpha);
                }
            `
        });

        const fogMesh = new THREE.Mesh(geometry, material);
        fogMesh.position.y = layer.height;
        fogMesh.rotation.x = -Math.PI / 2; // Lay flat
        fogMesh.name = `fogLayer_${index}`;
        
        // Store reference to material for animation
        fogMesh.userData = { material, layer };
        
        return fogMesh;
    }

    createStormParticles(group) {
        // Create rain/mist particle system
        const particleCount = 5000;
        const geometry = new THREE.BufferGeometry();
        
        const positions = new Float32Array(particleCount * 3);
        const velocities = new Float32Array(particleCount * 3);
        const sizes = new Float32Array(particleCount);
        
        // Initialize particles
        for (let i = 0; i < particleCount; i++) {
            const i3 = i * 3;
            
            // Random positions in a large area around origin
            positions[i3] = (Math.random() - 0.5) * 2000;     // x
            positions[i3 + 1] = Math.random() * 500 + 50;     // y (height)
            positions[i3 + 2] = (Math.random() - 0.5) * 2000; // z
            
            // Downward velocity with some horizontal drift
            velocities[i3] = (Math.random() - 0.5) * 2;       // x drift
            velocities[i3 + 1] = -5 - Math.random() * 10;     // y (falling)
            velocities[i3 + 2] = (Math.random() - 0.5) * 2;   // z drift
            
            // Random sizes
            sizes[i] = 0.5 + Math.random() * 1.5;
        }
        
        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute('velocity', new THREE.BufferAttribute(velocities, 3));
        geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
        
        // Particle material
        const particleMaterial = new THREE.ShaderMaterial({
            transparent: true,
            depthWrite: false,
            blending: THREE.AdditiveBlending,
            uniforms: {
                time: { value: 0.0 },
                opacity: { value: 0.6 }
            },
            vertexShader: `
                attribute float size;
                attribute vec3 velocity;
                varying float vOpacity;
                uniform float time;
                
                void main() {
                    vec3 pos = position;
                    
                    // Animate particles
                    pos += velocity * time;
                    
                    // Reset particles that fall too low
                    if (pos.y < 0.0) {
                        pos.y = 500.0 + mod(pos.y, 500.0);
                    }
                    
                    // Fade particles based on height
                    vOpacity = smoothstep(0.0, 100.0, pos.y) * smoothstep(500.0, 400.0, pos.y);
                    
                    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
                    gl_PointSize = size * (300.0 / -mvPosition.z);
                    gl_Position = projectionMatrix * mvPosition;
                }
            `,
            fragmentShader: `
                varying float vOpacity;
                uniform float opacity;
                
                void main() {
                    float distanceToCenter = distance(gl_PointCoord, vec2(0.5));
                    float alpha = 1.0 - smoothstep(0.0, 0.5, distanceToCenter);
                    alpha *= vOpacity * opacity;
                    
                    gl_FragColor = vec4(0.8, 0.9, 1.0, alpha);
                }
            `
        });
        
        const particles = new THREE.Points(geometry, particleMaterial);
        particles.name = "stormParticles";
        particles.userData = { material: particleMaterial, geometry };
        
        group.add(particles);
    }

    setupStormLighting() {
        // Create subtle ambient lighting for stormy atmosphere
        const ambientLight = new THREE.AmbientLight(0x404060, 0.3); // Dim blue-gray light
        this.scene.add(ambientLight);
        
        // Directional light for overcast sky
        const directionalLight = new THREE.DirectionalLight(0x707080, 0.5);
        directionalLight.position.set(0, 200, 100);
        directionalLight.castShadow = true;
        this.scene.add(directionalLight);
    }

    // Animation method to be called in the render loop
    update(deltaTime) {
        this.time += deltaTime;
        
        // Update fog layers
        this.scene.traverse((object) => {
            if (object.name && object.name.startsWith('fogLayer_') && object.userData.material) {
                object.userData.material.uniforms.time.value = this.time;
            }
            
            if (object.name === 'stormParticles' && object.userData.material) {
                object.userData.material.uniforms.time.value = this.time;
            }
        });
        
        // Animate fog intensity for dynamic storm effects
        if (this.scene.fog) {
            const baseIntensity = 0.003;
            const variation = Math.sin(this.time * 0.1) * 0.001;
            this.scene.fog.density = baseIntensity + variation;
        }
    }
}
