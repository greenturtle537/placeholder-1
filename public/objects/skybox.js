import * as THREE from 'three';
import { TextureGenerator } from './texture-generator.js';

export class Skybox {
    constructor() {
        this.textureGenerator = new TextureGenerator();
        
        return this.createSkybox();
    }

    async createSkybox() {
        const group = new THREE.Group();

        const skyTexture = await this.textureGenerator.generateTexture("cloudy");
        skyTexture.repeat.set( 2, 2 );
        
        const geometry = new THREE.BoxGeometry( 1000, 1000, 1000 );
        const material = new THREE.MeshBasicMaterial( { map: skyTexture, side: THREE.BackSide } );

        const skybox = new THREE.Mesh( geometry, material );
        skybox.name = "skybox";
        group.add( skybox );

        // TEMPORARILY COMMENTED OUT - Tree backdrop code (unrealistic trees)
        /*
        // Add backdrop element around the sides only, 200 units high
        const backdropTexture = await this.textureGenerator.generateTexture("backdrop");
        backdropTexture.repeat.set(5, 1);
        
        const backdropMaterial = new THREE.MeshBasicMaterial({ 
            map: backdropTexture, 
            transparent: true,
            alphaTest: 0.1,
            side: THREE.FrontSide 
        });
        
        // Create backdrop walls on all four sides
        const backdropHeight = 200;
        const backdropDistance = 499; // 1 unit closer than skybox for proper rendering
        const backdropWidth = 1000; // Match skybox width
        
        const backdropGeometry = new THREE.PlaneGeometry(backdropWidth, backdropHeight);
        
        // North wall
        const northBackdrop = new THREE.Mesh(backdropGeometry, backdropMaterial.clone());
        northBackdrop.position.set(0, backdropHeight/2, -backdropDistance);
        northBackdrop.rotation.y = 0;
        northBackdrop.name = "backdrop_north";
        group.add(northBackdrop);
        
        // South wall  
        const southBackdrop = new THREE.Mesh(backdropGeometry, backdropMaterial.clone());
        southBackdrop.position.set(0, backdropHeight/2, backdropDistance);
        southBackdrop.rotation.y = Math.PI;
        southBackdrop.name = "backdrop_south";
        group.add(southBackdrop);
        
        // East wall
        const eastBackdrop = new THREE.Mesh(backdropGeometry, backdropMaterial.clone());
        eastBackdrop.position.set(backdropDistance, backdropHeight/2, 0);
        eastBackdrop.rotation.y = -Math.PI/2;
        eastBackdrop.name = "backdrop_east";
        group.add(eastBackdrop);
        
        // West wall
        const westBackdrop = new THREE.Mesh(backdropGeometry, backdropMaterial.clone());
        westBackdrop.position.set(-backdropDistance, backdropHeight/2, 0);
        westBackdrop.rotation.y = Math.PI/2;
        westBackdrop.name = "backdrop_west";
        group.add(westBackdrop);
        */

        return group;
    }
}