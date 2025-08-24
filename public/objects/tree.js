import * as THREE from 'three';

export class Tree {
    // Static cache for tree images - shared across all instances
    static treeImages = [];
    static imagesLoaded = false;
    static loadingPromise = null;
    
    constructor() {
        return this.createTree();
    }

    async createTree() {
        // Ensure tree images are loaded (only loads once)
        await Tree.ensureImagesLoaded();
        
        if (Tree.treeImages.length === 0) {
            console.warn('No tree images could be loaded, creating default tree');
            return this.createDefaultTree();
        }
        
        // Select a random tree image from the static cache
        const randomTreeImage = Tree.treeImages[Math.floor(Math.random() * Tree.treeImages.length)];
        
        // Create texture from the selected tree image
        const texture = new THREE.Texture(randomTreeImage);
        texture.needsUpdate = true;
        texture.wrapS = THREE.ClampToEdgeWrapping;
        texture.wrapT = THREE.ClampToEdgeWrapping;
        
        // Set pixel-perfect filtering for pixel art - no anti-aliasing
        texture.magFilter = THREE.NearestFilter; // No interpolation when scaling up
        texture.minFilter = THREE.NearestFilter; // No interpolation when scaling down
        texture.generateMipmaps = false; // Disable mipmaps to maintain pixel sharpness
        
        // Create billboard material (always faces camera)
        const material = new THREE.MeshBasicMaterial({
            map: texture,
            transparent: true,
            alphaTest: 0.1, // Cutoff for transparency
            side: THREE.FrontSide
        });
        
        // Note: Texture filtering set to NearestFilter above to preserve pixel art appearance
        // This prevents anti-aliasing/blurring when trees are scaled up or down
        
        // Add subtle color variation to each tree
        const colorVariation = 0.2; // 20% color variation
        const hue = 0.3 + (Math.random() - 0.5) * colorVariation; // Green hue with variation
        const saturation = 0.6 + (Math.random() - 0.5) * 0.3; // Saturation variation
        const lightness = 0.7 + (Math.random() - 0.5) * 0.3; // Lightness variation
        
        const color = new THREE.Color();
        color.setHSL(hue, saturation, lightness);
        material.color = color;
        
        // Create 5x5 unit plane geometry with some random variation
        const baseSize = 5;
        const sizeVariation = 1 + (Math.random() - 0.5) * 0.4; // 20% size variation
        const width = baseSize * sizeVariation;
        const height = baseSize * (0.8 + Math.random() * 0.4); // Aspect ratio variation
        
        const geometry = new THREE.PlaneGeometry(width, height);
        
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
    
    // Static method to ensure images are loaded only once
    static async ensureImagesLoaded() {
        // If already loaded, return immediately
        if (Tree.imagesLoaded) {
            return;
        }
        
        // If currently loading, wait for the existing promise
        if (Tree.loadingPromise) {
            return Tree.loadingPromise;
        }
        
        // Start loading images
        Tree.loadingPromise = Tree.loadTreeImages();
        await Tree.loadingPromise;
        Tree.imagesLoaded = true;
        Tree.loadingPromise = null;
    }
    
    // Static method to load tree images (called only once)
    static async loadTreeImages() {
        const imagePromises = [];
        
        // Load all tree images (tree1.png through tree13.png)
        for (let i = 1; i <= 10; i++) {
            const img = new Image();
            const promise = new Promise((resolve, reject) => {
                img.onload = () => resolve(img);
                img.onerror = () => {
                    console.warn(`Failed to load tree${i}.png`);
                    resolve(null); // Resolve with null instead of rejecting
                };
            });
            img.src = `public/backdrop/tree${i}.png`;
            imagePromises.push(promise);
        }
        
        const results = await Promise.all(imagePromises);
        Tree.treeImages = results.filter(img => img !== null);
        
        if (Tree.treeImages.length > 0) {
            if (window.DEBUG_LOG) console.log(`Loaded ${Tree.treeImages.length} tree images to static cache`);
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
        
        if (window.DEBUG_LOG) console.log('Created default tree fallback');
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
