import * as THREE from 'three';

export class Tree {
    constructor() {
        this.treeImages = [];
        
        return this.createTree();
    }

    async createTree() {
        // Load all available tree images
        await this.loadTreeImages();
        
        if (this.treeImages.length === 0) {
            console.warn('No tree images could be loaded, creating default tree');
            return this.createDefaultTree();
        }
        
        // Select a random tree image
        const randomTreeImage = this.treeImages[Math.floor(Math.random() * this.treeImages.length)];
        
        // Create texture from the selected tree image
        const texture = new THREE.Texture(randomTreeImage);
        texture.needsUpdate = true;
        texture.wrapS = THREE.ClampToEdgeWrapping;
        texture.wrapT = THREE.ClampToEdgeWrapping;
        
        // Create billboard material (always faces camera)
        const material = new THREE.MeshBasicMaterial({
            map: texture,
            transparent: true,
            alphaTest: 0.1, // Cutoff for transparency
            side: THREE.FrontSide
        });
        
        // Create 5x5 unit plane geometry
        const geometry = new THREE.PlaneGeometry(5, 5);
        
        // Create the mesh
        const treeMesh = new THREE.Mesh(geometry, material);
        treeMesh.name = "tree_billboard";
        
        // Set userData to exclude from collision detection
        treeMesh.userData.noCollision = true;
        treeMesh.userData.reason = "billboard_tree";
        
        // Create a group to hold the tree
        const treeGroup = new THREE.Group();
        treeGroup.add(treeMesh);
        treeGroup.name = "tree";
        
        // Store reference to mesh for billboard behavior
        treeGroup.userData.billboardMesh = treeMesh;
        
        return treeGroup;
    }
    
    async loadTreeImages() {
        const imagePromises = [];
        
        // Load all tree images (tree_1.png through tree_10.png)
        for (let i = 1; i <= 10; i++) {
            const img = new Image();
            const promise = new Promise((resolve, reject) => {
                img.onload = () => resolve(img);
                img.onerror = () => {
                    console.warn(`Failed to load tree_${i}.png`);
                    resolve(null); // Resolve with null instead of rejecting
                };
            });
            img.src = `public/backdrop/tree_${i}.png`;
            imagePromises.push(promise);
        }
        
        const results = await Promise.all(imagePromises);
        this.treeImages = results.filter(img => img !== null);
        
        if (this.treeImages.length > 0) {
            console.log(`Loaded ${this.treeImages.length} tree images`);
        }
    }
    
    createDefaultTree() {
        // Fallback: create a simple green rectangular tree if no images load
        const geometry = new THREE.PlaneGeometry(5, 5);
        const material = new THREE.MeshBasicMaterial({
            color: 0x228B22, // Forest green
            transparent: true,
            side: THREE.FrontSide
        });
        
        const treeMesh = new THREE.Mesh(geometry, material);
        treeMesh.name = "tree_default";
        treeMesh.userData.noCollision = true;
        treeMesh.userData.reason = "billboard_tree";
        
        const treeGroup = new THREE.Group();
        treeGroup.add(treeMesh);
        treeGroup.name = "tree_default";
        treeGroup.userData.billboardMesh = treeMesh;
        
        console.log('Created default tree fallback');
        return treeGroup;
    }
    
    // Static method to update billboard behavior - call this from main loop
    static updateBillboard(treeGroup, camera) {
        if (treeGroup.userData.billboardMesh) {
            // Calculate direction to camera on XZ plane only (ignore Y difference)
            const treePosition = treeGroup.position;
            const cameraPosition = camera.position.clone();
            
            // Set camera Y position to same as tree to calculate horizontal direction only
            cameraPosition.y = treePosition.y;
            
            // Calculate direction vector on XZ plane
            const direction = new THREE.Vector3();
            direction.subVectors(cameraPosition, treePosition);
            direction.normalize();
            
            // Calculate rotation angle around Y axis only
            const angle = Math.atan2(direction.x, direction.z);
            
            // Apply only Y axis rotation to keep tree upright
            treeGroup.userData.billboardMesh.rotation.set(0, angle, 0);
        }
    }
}
