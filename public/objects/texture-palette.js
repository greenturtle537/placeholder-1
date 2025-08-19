import { TextureGenerator } from '/texture-generator.js';

export class TexturePalette {
    constructor(texture1, texture2, texture3, texture4) {
        this.textureGenerator = new TextureGenerator();
        this.texture1 = texture1;
        this.texture2 = texture2;
        this.texture3 = texture3;
        this.texture4 = texture4;

        return this.createTexturePalette();
    }

    createTexturePalette() {
        const group = new THREE.Group();

        // Generate textures using the TextureGenerator
        const quad1 = this.textureGenerator.generateTexture(this.texture1);
        const quad2 = this.textureGenerator.generateTexture(this.texture2);
        const quad3 = this.textureGenerator.generateTexture(this.texture3);
        const quad4 = this.textureGenerator.generateTexture(this.texture4);

        // Create quads for each texture
        const quadGeometry = new THREE.PlaneGeometry(1, 1);
        const quadMaterial1 = new THREE.MeshBasicMaterial({ map: quad1, side: THREE.DoubleSide });
        const quadMaterial2 = new THREE.MeshBasicMaterial({ map: quad2, side: THREE.DoubleSide });
        const quadMaterial3 = new THREE.MeshBasicMaterial({ map: quad3, side: THREE.DoubleSide });
        const quadMaterial4 = new THREE.MeshBasicMaterial({ map: quad4, side: THREE.DoubleSide });

        const mesh1 = new THREE.Mesh(quadGeometry, quadMaterial1);
        const mesh2 = new THREE.Mesh(quadGeometry, quadMaterial2);
        const mesh3 = new THREE.Mesh(quadGeometry, quadMaterial3);
        const mesh4 = new THREE.Mesh(quadGeometry, quadMaterial4);

        // Position the quads in a grid layout
        mesh1.position.set(-1.5, 0, 0);
        mesh2.position.set(0, 0, 0);
        mesh3.position.set(1.5, 0, 0);
        mesh4.position.set(3, 0, 0);

        // Add the meshes to the group
        group.add(mesh1, mesh2, mesh3, mesh4);
        
        return group;
    }
}