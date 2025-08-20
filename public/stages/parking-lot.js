import * as THREE from 'three';
import { TextureGenerator } from './texture-generator.js';

export class ParkingLot {
    constructor() {
        this.textureGenerator = new TextureGenerator();
        
        return this.createParkingLot();
    }

    createParkingLot() {
        const group = new THREE.Group();

        const floorTexture = this.textureGenerator.generateTexture("asphalt");
        floorTexture.repeat.set( 250, 250 );

        const groundWidth = 1000;
        const groundDepth = 1000;

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
            // Mark parking lines as non-collidable (too small)
            line.userData.noCollision = true;
            line.userData.reason = "parking_line";
            group.add(line);
            for (let i = 0; i < groundWidth; i+=9) {
                const lineGeometry = new THREE.PlaneGeometry(36, 0.2);
                const lineMaterial = new THREE.MeshBasicMaterial({ map: offpaintTexture });
                const line = new THREE.Mesh(lineGeometry, lineMaterial);
                line.rotation.x = -Math.PI / 2;
                line.rotation.z = -Math.PI / 2;
                line.position.set(i-(groundWidth/2), 0.01, j-(groundDepth/2));
                // Mark parking lines as non-collidable (too small)
                line.userData.noCollision = true;
                line.userData.reason = "parking_line";
                group.add(line);
            }
        }

        const ground = new THREE.Mesh(groundGeometry, groundMaterial);

        ground.rotation.x = -Math.PI / 2; // Rotate to horizontal
        // Mark ground as non-collidable (too large)
        ground.userData.noCollision = true;
        ground.userData.reason = "ground_plane";
        group.add(ground);

        // Add invisible collision walls to create 500x500 boundary box around spawn
        const boundarySize = 500;
        const wallHeight = 50; // Height of invisible walls
        const wallThickness = 1; // Thickness of collision walls
        
        // Create invisible material for collision walls
        const wallMaterial = new THREE.MeshBasicMaterial({ 
            transparent: true, 
            opacity: 0,
            visible: false // Make completely invisible
        });

        // North wall (positive Z)
        const northWallGeometry = new THREE.BoxGeometry(boundarySize, wallHeight, wallThickness);
        const northWall = new THREE.Mesh(northWallGeometry, wallMaterial);
        northWall.position.set(0, wallHeight/2, boundarySize/2);
        northWall.userData.collisionType = "boundary_wall";
        northWall.userData.reason = "north_boundary";
        group.add(northWall);

        // South wall (negative Z)
        const southWallGeometry = new THREE.BoxGeometry(boundarySize, wallHeight, wallThickness);
        const southWall = new THREE.Mesh(southWallGeometry, wallMaterial);
        southWall.position.set(0, wallHeight/2, -boundarySize/2);
        southWall.userData.collisionType = "boundary_wall";
        southWall.userData.reason = "south_boundary";
        group.add(southWall);

        // East wall (positive X)
        const eastWallGeometry = new THREE.BoxGeometry(wallThickness, wallHeight, boundarySize);
        const eastWall = new THREE.Mesh(eastWallGeometry, wallMaterial);
        eastWall.position.set(boundarySize/2, wallHeight/2, 0);
        eastWall.userData.collisionType = "boundary_wall";
        eastWall.userData.reason = "east_boundary";
        group.add(eastWall);

        // West wall (negative X)
        const westWallGeometry = new THREE.BoxGeometry(wallThickness, wallHeight, boundarySize);
        const westWall = new THREE.Mesh(westWallGeometry, wallMaterial);
        westWall.position.set(-boundarySize/2, wallHeight/2, 0);
        westWall.userData.collisionType = "boundary_wall";
        westWall.userData.reason = "west_boundary";
        group.add(westWall);

        return group;
    }
}