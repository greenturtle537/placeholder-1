import * as THREE from 'three';
import { TextureGenerator } from '../../texture-generator.js';

export class Skybox {
    constructor() {
        this.textureGenerator = new TextureGenerator();
        
        return this.createSkybox();
    }

    async createSkybox() {
        const group = new THREE.Group();

        const skyTexture = await this.textureGenerator.generateTexture("cloudy");
        skyTexture.repeat.set( 2, 2 );
        
        const geometry = new THREE.BoxGeometry( 1200, 600, 1200 );
        const material = new THREE.MeshBasicMaterial( { map: skyTexture, side: THREE.BackSide } );

        const skybox = new THREE.Mesh( geometry, material );
        skybox.name = "skybox";
        group.add( skybox );

        return group;
    }
}