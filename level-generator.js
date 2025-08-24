import * as THREE from 'three';
import { TextureGenerator } from './texture-generator_old.js';
import { ResourceManager } from './resource-manager.js';
import { ParkingLot } from './public/stages/parking-lot.js';
import { TexturePalette } from './public/objects/texture-palette.js';
import { Skybox } from './public/objects/skybox.js';
import { Tree } from './public/objects/tree.js';

export class LevelGenerator {
    constructor() {
        // Get resource manager instance
        this.resourceManager = new ResourceManager();
        
        // Create texture generator
        this.textureGenerator = new TextureGenerator();
        
    }
    
    
    async loadLevel(levelFile) {
        try {
            const response = await fetch(levelFile);
            if (!response.ok) {
                throw new Error(`Failed to load level: ${response.status} ${response.statusText}`);
            }
            const levelData = await response.json();
            return await this.generateLevel(levelData);
        } catch (error) {
            console.error("Error loading level:", error);
            throw error;
        }
    }

    async generateLevel(levelData) {
        const texturePalette = await new TexturePalette(
            'floor',
            'backdrop',
            'ceiling',
            'asphalt'
        );

        const levelGroup = new THREE.Group();
        const parkingLot = new ParkingLot();
        levelGroup.add(parkingLot);
        const skybox = await new Skybox();

        // Add skybox to the level group
        levelGroup.add(skybox);
        
        // Create a ring of trees around the edge of the parking lot to simulate a forest
        await this.addForestRing(levelGroup);
        
        texturePalette.position.set(0, 5, 0);

        // Add the texture palette to the level group
        levelGroup.add(texturePalette);
        
        levelGroup.userData.startPosition = new THREE.Vector3(0, 5, 0);

        return levelGroup;
    }

    async addForestRing(levelGroup) {
        // Forest ring parameters
        const baseRadius = 500; // Minimum distance from center where trees start spawning
        const maxRadiusVariation = 250; // Maximum additional distance beyond the minimum radius
        const numTrees = 1000; // Increased number of trees for denser forest
        const minScale = 3; // Minimum tree scale
        const maxScale = 18; // Increased maximum tree scale for more dramatic depth effect
        
        for (let i = 0; i < numTrees; i++) {
            // Calculate angle around the circle with some variation for clustering
            const baseAngle = (i / numTrees) * Math.PI * 2;
            const angleVariation = (Math.random() - 0.5) * 0.3; // Add some angle clustering
            const angle = baseAngle + angleVariation;
            
            // Add random variation to radius - trees spawn from baseRadius outward
            const radiusVariation = Math.random() * maxRadiusVariation; // 0 to maxRadiusVariation
            const radius = baseRadius + radiusVariation; // baseRadius is now minimum, variation extends outward
            
            // Calculate position
            const x = Math.cos(angle) * radius;
            const z = Math.sin(angle) * radius;
            
            // Calculate distance from center for scale effect
            const distanceFromCenter = Math.sqrt(x * x + z * z);
            
            // Create tree
            const tree = await new Tree();
            
            // Enhanced distance-based scaling for depth illusion
            const distanceScale = Math.min(distanceFromCenter / 600, 1); // 0 to 1 based on distance
            const scaleBonus = distanceScale * 3;
            const randomScale = minScale + Math.random() * (maxScale - minScale);
            const scale = randomScale + scaleBonus;
            tree.scale.set(scale, scale, scale);
            
            // Position tree at ground level - no slope effect, just scale variation
            const groundY = 0; // Ground level at parking lot
            const treeHeight = 5 * scale; // Base tree height * scale
            tree.position.set(x, groundY + (treeHeight / 2) -5, z);
            
            // Name for billboard system
            tree.name = `forest_tree_${i}`;
            
            levelGroup.add(tree);
        }
        
        if (window.DEBUG_LOG) console.log(`Created forest ring with ${numTrees} trees`);
    }

    addLighting(levelGroup, levelData) {
        // Use a lightweight ambient light only
        const ambient = new THREE.AmbientLight(0xb0b0b0);
        levelGroup.add(ambient);
    }
}
