import * as THREE from 'three';
import { TextureGenerator } from '/texture-generator.js';

export class Skybox {
    constructor() {
        this.textureGenerator = new TextureGenerator();
        
        return this.createSkybox();
    }

    createSkybox() {
        const group = new THREE.Group();

        const skyTexture = this.textureGenerator.generateTexture("cloudy");
        skyTexture.repeat.set( 4, 4 );
        
        const geometry = new THREE.BoxGeometry( 1000, 1000, 1000 );
        const material = new THREE.MeshBasicMaterial( { map: skyTexture, side: THREE.BackSide } );

        const skybox = new THREE.Mesh( geometry, material );
        skybox.name = "skybox";
        group.add( skybox );


        return group;
    }
}