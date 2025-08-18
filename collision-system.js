import * as THREE from 'three';

/* == Warning: This file is AI generated because I am lazy. == */

export class CollisionSystem {
    constructor(scene) {
        this.scene = scene;
        this.colliders = [];
        this.playerCollider = null;
        this.playerRadius = 0.5; // Player collision radius
        this.playerHeight = 1.8; // Player height (approx 6 feet)
        
        // Collision optimization settings - removed spatial grid for global detection
        
        // For debugging - check window flags
        this.debug = true; // Enable debug mode to visualize collision boxes
        this.collisionHelpers = new THREE.Group();
        this.collisionHelpers.name = "CollisionHelpers";
        
        // Always add helpers group, but visibility will be controlled by flags
        this.scene.add(this.collisionHelpers);
        
        // Performance metrics
        this.lastFrameCollisionChecks = 0;
        this.totalCollisionChecks = 0;
        
        // Statistics
        this.stats = {
            totalMeshesProcessed: 0,
            collidersAdded: 0,
            skippedUserData: 0,
            skippedTooSmall: 0,
            skippedTooLarge: 0
        };
    }
    
    /**
     * Create a player collider at the given position
     * @param {THREE.Vector3} position - Initial player position
     */
    createPlayerCollider(position) {
        this.playerCollider = {
            position: position.clone(),
            radius: this.playerRadius,
            height: this.playerHeight
        };
        
        // Add visual debug helper for player collider - check window flag
        if (this.debug && window.DEBUG_PLAYER_MESH) {
            const geometry = new THREE.CylinderGeometry(
                this.playerRadius, 
                this.playerRadius, 
                this.playerHeight, 
                16
            );
            const material = new THREE.MeshBasicMaterial({
                color: 0xff0000, 
                wireframe: true
            });
            
            this.playerHelper = new THREE.Mesh(geometry, material);
            this.playerHelper.position.copy(position);
            this.collisionHelpers.add(this.playerHelper);
        }
    }
    
    /**
     * Add a collider from a mesh object
     * @param {THREE.Mesh} mesh - Mesh to add as collider
     */
    addCollider(mesh) {
        this.stats.totalMeshesProcessed++;
        
        // Check userData for explicit collision exclusion
        if (mesh.userData.noCollision) {
            this.stats.skippedUserData++;
            console.log(`Skipping collision for mesh: ${mesh.userData.reason || 'userData.noCollision = true'}`);
            return;
        }
        
        // Get the bounding box in world coordinates
        const box = new THREE.Box3().setFromObject(mesh);
        const size = new THREE.Vector3();
        const center = new THREE.Vector3();
        box.getSize(size);
        box.getCenter(center);
        
        // Filter out objects based on size
        const minSize = 0.1; // Objects smaller than 10cm on any axis
        const maxSize = 500;  // Objects larger than 500 units on any axis
        
        if (size.x < minSize || size.y < minSize || size.z < minSize) {
            this.stats.skippedTooSmall++;
            console.log(`Skipping collision for too small object (${size.x.toFixed(2)} x ${size.y.toFixed(2)} x ${size.z.toFixed(2)})`);
            return;
        }
        
        if (size.x > maxSize || size.y > maxSize || size.z > maxSize) {
            this.stats.skippedTooLarge++;
            console.log(`Skipping collision for too large object (${size.x.toFixed(2)} x ${size.y.toFixed(2)} x ${size.z.toFixed(2)})`);
            return;
        }
        
        const collider = {
            position: center, // Use world center position
            size: size,
            mesh: mesh // Store reference to the mesh
        };
        
        this.colliders.push(collider);
        this.stats.collidersAdded++;
        
        // Add visual debug helper for collider - check window flag
        if (this.debug && window.DEBUG_COLLISION_MESHES) {
            const helper = new THREE.Box3Helper(box, 0x00ff00);
            this.collisionHelpers.add(helper);
        }
    }
    
    /**
     * Update player collider position
     * @param {THREE.Vector3} position - New player position
     * @param {boolean} isFreeflyMode - Whether the player is in freefly debug mode
     */
    updatePlayerPosition(position, isFreeflyMode = false) {
        if (!this.playerCollider) return;

        this.playerCollider.position.copy(position);

        
        // Update debug helper if it exists, but only in FPS mode (not freefly) and if flag is enabled
        if (this.debug && this.playerHelper && !isFreeflyMode && window.DEBUG_PLAYER_MESH) {
            this.playerHelper.position.copy(position);
        }
    }
    
    
    /**
     * Check for collisions and adjust player position
     * @param {THREE.Vector3} playerPosition - Current player position
     * @param {THREE.Vector3} proposedPosition - Proposed new position after movement
     * @returns {THREE.Vector3} Adjusted position after collision resolution
     */
    checkCollisions(playerPosition, proposedPosition) {
        if (!this.playerCollider) return proposedPosition;
        
        // Create a temporary vector to hold our adjusted position
        const adjustedPosition = proposedPosition.clone();
        
        // Reset collision check count for this frame
        this.lastFrameCollisionChecks = 0;
        
        // Check all colliders globally
        for (const collider of this.colliders) {
            this.lastFrameCollisionChecks++;
            this.totalCollisionChecks++;
            
            // Simple cylinder vs box collision check 
            // (we only need horizontal collision, not vertical)
            
            // Get box extents
            const halfSize = collider.size.clone().multiplyScalar(0.5);
            const boxMin = collider.position.clone().sub(halfSize);
            const boxMax = collider.position.clone().add(halfSize);
            
            // Create a 2D point for closest point test (ignoring Y axis)
            const point2D = new THREE.Vector2(
                adjustedPosition.x, 
                adjustedPosition.z
            );
            
            // Get box bounds in 2D (ignoring Y axis)
            const boxMin2D = new THREE.Vector2(boxMin.x, boxMin.z);
            const boxMax2D = new THREE.Vector2(boxMax.x, boxMax.z);
            
            // Find closest point on box to cylinder center
            const closestPoint = new THREE.Vector2(
                Math.max(boxMin2D.x, Math.min(point2D.x, boxMax2D.x)),
                Math.max(boxMin2D.y, Math.min(point2D.y, boxMax2D.y))
            );
            
            // Calculate distance from closestPoint to cylinder center
            const distance = point2D.distanceTo(closestPoint);
            
            // If distance is less than cylinder radius, we have a collision
            if (distance < this.playerRadius) {
                // Calculate penetration depth
                const penetration = this.playerRadius - distance;
                
                // If we're colliding
                if (penetration > 0 && distance > 0) {
                    // Direction from closest point to cylinder center
                    const direction = new THREE.Vector2(
                        point2D.x - closestPoint.x,
                        point2D.y - closestPoint.y
                    ).normalize();
                    
                    // Adjust position by penetration along collision normal
                    adjustedPosition.x += direction.x * penetration;
                    adjustedPosition.z += direction.y * penetration;
                } 
                // Special case for when we're directly inside the box
                else if (distance === 0) {
                    // Find the shallowest penetration axis to push out
                    const dists = [
                        adjustedPosition.x - boxMin.x, // distance to left edge
                        boxMax.x - adjustedPosition.x, // distance to right edge
                        adjustedPosition.z - boxMin.z, // distance to bottom edge
                        boxMax.z - adjustedPosition.z  // distance to top edge
                    ];
                    
                    // Find minimum penetration distance and axis
                    let minDist = dists[0];
                    let minAxis = 0;
                    
                    for (let i = 1; i < 4; i++) {
                        if (dists[i] < minDist) {
                            minDist = dists[i];
                            minAxis = i;
                        }
                    }
                    
                    // Push out along minimum penetration axis
                    switch (minAxis) {
                        case 0: adjustedPosition.x = boxMin.x - this.playerRadius; break;
                        case 1: adjustedPosition.x = boxMax.x + this.playerRadius; break;
                        case 2: adjustedPosition.z = boxMin.z - this.playerRadius; break;
                        case 3: adjustedPosition.z = boxMax.z + this.playerRadius; break;
                    }
                }
            }
        }
        
        // Keep original Y position
        adjustedPosition.y = playerPosition.y;
        
        return adjustedPosition;
    }
    
    /**
     * Extract colliders from a level group
     * @param {THREE.Group} levelGroup - Group containing level meshes
     */
    extractCollidersFromLevel(levelGroup) {
        levelGroup.traverse((object) => {
            // Add colliders for all mesh objects
            if (object.isMesh) {
                this.addCollider(object);
            }
        });
    }
    
    /**
     * Clear all colliders and reset the system
     */
    clear() {
        this.colliders = [];
        this.playerCollider = null;
        
        if (this.debug) {
            this.collisionHelpers.clear();
        }
        
        // Reset statistics
        this.stats = {
            totalMeshesProcessed: 0,
            collidersAdded: 0,
            skippedUserData: 0,
            skippedTooSmall: 0,
            skippedTooLarge: 0
        };
    }
    
    /**
     * Log collision system statistics
     */
    logCollisionStats() {
        console.log('=== Collision System Statistics ===');
        console.log(`Total meshes processed: ${this.stats.totalMeshesProcessed}`);
        console.log(`Colliders added: ${this.stats.collidersAdded}`);
        console.log(`Skipped (userData): ${this.stats.skippedUserData}`);
        console.log(`Skipped (too small): ${this.stats.skippedTooSmall}`);
        console.log(`Skipped (too large): ${this.stats.skippedTooLarge}`);
        console.log('=====================================');
    }
    
    /**
     * Update debug mesh visibility based on window flags
     */
    updateDebugVisibility() {
        if (!this.collisionHelpers) return;
        
        // Update collision mesh visibility
        this.collisionHelpers.children.forEach(child => {
            if (child instanceof THREE.Box3Helper) {
                child.visible = window.DEBUG_COLLISION_MESHES;
            } else if (child === this.playerHelper) {
                child.visible = window.DEBUG_PLAYER_MESH;
            }
        });
    }
    
    /**
     * Get debug statistics for display
     */
    getDebugStats() {
        return {
            colliders: this.colliders.length,
            lastFrameChecks: this.lastFrameCollisionChecks,
            totalChecks: this.totalCollisionChecks,
            playerPosition: this.playerCollider ? this.playerCollider.position : null
        };
    }
}