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
        
        const levelGroup = new ParkingLot();
        const skybox = await new Skybox();

        // Add skybox to the level group
        levelGroup.add(skybox);
        
        // Add a tree 5 units away from player spawn (0, 5, 0)
        const tree = await new Tree();
        tree.position.set(0, 2.5, -5); // Position on ground, 5 units south of spawn
        levelGroup.add(tree);
        
        texturePalette.position.set(0, 5, 0);

        // Add the texture palette to the level group
        levelGroup.add(texturePalette);
        
        levelGroup.userData.startPosition = new THREE.Vector3(0, 5, 0);

        return levelGroup;
    }

    addLighting(levelGroup, levelData) {
        // Use a lightweight ambient light only
        const ambient = new THREE.AmbientLight(0xb0b0b0);
        levelGroup.add(ambient);
    }
}
