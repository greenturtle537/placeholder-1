import * as THREE from 'three';
import { TextureGenerator } from '/texture-generator.js';
import { floor } from 'three/tsl';

export class ParkingLot {
    constructor() {
        this.textureGenerator = new TextureGenerator();
        
        return this.createParkingLot();
    }

    createParkingLot() {
        const group = new THREE.Group();

        const floorTexture = this.textureGenerator.generateTexture("asphalt");
        floorTexture.repeat.set( 250, 250 );

        const groundWidth = 500;
        const groundDepth = 500;

        // Create the ground plane
        const groundGeometry = new THREE.PlaneGeometry(groundWidth, groundDepth);
        groundGeometry.setAttribute('uv2', new THREE.BufferAttribute(groundGeometry.attributes.uv.array, 2));

        const groundMaterial = new THREE.MeshStandardMaterial({
            roughness: 0.5,
            metalness: 0.1,
            map: floorTexture,
        });

        for (let j = 0; j < groundDepth; j+=50) {
            // Draw a white line
            const offpaintTexture = this.textureGenerator.generateTexture("offpaint");
            const lineGeometry = new THREE.PlaneGeometry(groundWidth, 0.2);
            const lineMaterial = new THREE.MeshBasicMaterial({ map: offpaintTexture });
            const line = new THREE.Mesh(lineGeometry, lineMaterial);
            line.rotation.x = -Math.PI / 2;
            line.position.set(0, 0.01, j-(groundDepth/2));
            group.add(line);
            for (let i = 0; i < groundWidth; i+=9) {
                const lineGeometry = new THREE.PlaneGeometry(36, 0.2);
                const lineMaterial = new THREE.MeshBasicMaterial({ map: offpaintTexture });
                const line = new THREE.Mesh(lineGeometry, lineMaterial);
                line.rotation.x = -Math.PI / 2;
                line.rotation.z = -Math.PI / 2;
                line.position.set(i-(groundWidth/2), 0.01, j-(groundDepth/2));
                group.add(line);
            }
        }

        const ground = new THREE.Mesh(groundGeometry, groundMaterial);
        ground.rotation.x = -Math.PI / 2; // Rotate to horizontal
        group.add(ground);
        
        return group;
    }
}