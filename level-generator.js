import * as THREE from 'three';
import { TextureGenerator } from './texture-generator_old.js';
import { ResourceManager } from './resource-manager.js';
import { ParkingLot } from '/public/stages/parking-lot.js';
import { TexturePalette } from '/public/objects/texture-palette.js';
import { Skybox } from '/public/objects/skybox.js';
import { RenderFog } from './public/objects/render-fog.js';


export class LevelGenerator {
    constructor() {
        // Get resource manager instance
        this.resourceManager = new ResourceManager();
        
        // Create texture generator
        this.textureGenerator = new TextureGenerator();
        
        // Generate shared textures for 90s office aesthetic
        const wallTexture = this.textureGenerator.generateWallTexture('stripes', 'nineties');
        const floorTexture = this.textureGenerator.generateFloorTexture();
        const ceilingTexture = this.textureGenerator.generateCeilingTexture();
        
    }
    
    
    async loadLevel(levelFile) {
        try {
            const response = await fetch(levelFile);
            if (!response.ok) {
                throw new Error(`Failed to load level: ${response.status} ${response.statusText}`);
            }
            const levelData = await response.json();
            return this.generateLevel(levelData);
        } catch (error) {
            console.error("Error loading level:", error);
            throw error;
        }
    }

    generateLevel(levelData) {
        const texturePalette = new TexturePalette(
            'floor',
            'cloudy',
            'ceiling',
            'asphalt'
        );
        
        const levelGroup = new ParkingLot();
        const skybox = new Skybox();

        // Add skybox to the level group
        levelGroup.add(skybox);
        
        texturePalette.position.set(0, 5, 0);

        // Add the texture palette to the level group
        levelGroup.add(texturePalette);
        
        levelGroup.position.set(0, 0, 0);

        return levelGroup;
    }

    addLighting(levelGroup, levelData) {
        // Use a lightweight ambient light only
        const ambient = new THREE.AmbientLight(0xb0b0b0);
        levelGroup.add(ambient);
    }
}
