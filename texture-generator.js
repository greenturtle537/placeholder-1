import * as THREE from 'three';
import { ResourceManager } from './resource-manager.js';

export class TextureGenerator {
    // Static texture cache that stores only canvas elements
    static #canvasCache = {};
    
    constructor() {
        // Texture dimensions (reduced for better performance)
        this.textureSize = Window.TEXTURECACHESIZE || 256;
        
        // Get the resource manager instance
        this.resourceManager = new ResourceManager();
        
        this.presetTextures = {
            "wall": {
                "styles": ['stripes'],
                "colors": {
                    "primary": '#f7f6f2',
                    "secondary": '#c8c6c3'
                }
            },
            "ceiling": {
                "styles": ['tiles'],
                "colors": {
                    "primary": '#f2f1ed',
                    "secondary": '#a8a8a6',
                    "accent": '#393939',
                    "accent2": '#000000'
                }
            },
            "floor": {
                "styles": ['carpet'],
                "colors": {
                    "primary": '#1a3c2a',
                    "secondary": '#15331f',
                    "accent": '#1d4432',
                    "accent2": '#132920'
                }
            },
            "asphalt": {
                "styles": ['noise'],
                "colors": {
                    "primary": '#000000ff',
                    "secondary": '#1a1a1a',
                    "accent": '#1a1a1aff',
                    "accent2": '#5c4d4dff'
                },
                "noiseIntensity": 50 // Default intensity for asphalt grainyness
            },
            "cloudy": {
                "styles": ['noise'],
                "colors": {
                    "primary": '#9a9a9a',
                    "secondary": '#ffffff',
                    "accent": '#f0f8ff',
                    "accent2": 'rgba(94, 94, 94, 1)'
                },
                "noiseIntensity": 30 // Default intensity for cloud texture
            },
            "offpaint": {
                "styles": ['noise'],
                "colors": {
                    "primary": '#bebebeff'
                },
                "noiseIntensity": 25 // Default intensity for off-paint texture
            },
            "backdrop": {
                "styles": ['backdrop'],
                "colors": {
                    "primary": '#87CEEB', // Sky blue background
                    "secondary": '#ffffff'
                },
                "depth": 3 // Default depth level
            }
        };
    }

    generateTexture(name, styles, colors, options = {}) {
        // If only name is passed, try to get preset data
        if (typeof name === 'string' && !styles && !colors) {
            const preset = this.presetTextures[name];
            if (preset) {
                styles = preset.styles;
                colors = preset.colors;
                name = [name]; // Convert to array for consistency
                // Merge preset options with passed options
                options = { ...preset, ...options };
                
                // Handle backdrop specially since it requires async processing
                if (styles.includes('backdrop')) {
                    return this.generateBackdropTexture(colors, options.depth || 3);
                }
            } else {
                console.warn(`No preset found for: ${name}`);
                name = [name];
                styles = ['noise']; // Default style
                colors = { primary: '#ffffff' }; // Default color
            }
        }
        
        // Ensure name is an array
        if (!Array.isArray(name)) {
            name = [name];
        }
        
        // Only include options in cache key if they contain meaningful data
        let textureKey = `${name.join('_')}_${JSON.stringify(colors)}_${styles}`;
        if (options && Object.keys(options).length > 0) {
            textureKey += `_${JSON.stringify(options)}`;
        }
        
        console.log(`Requesting texture: ${textureKey}`);

        // Get or create the canvas
        let canvas;
        if (TextureGenerator.#canvasCache[textureKey]) {
            console.log(`Using cached texture canvas: ${textureKey}`);
            canvas = TextureGenerator.#canvasCache[textureKey];
        } else {
            console.log(`Generating new texture canvas: ${textureKey}`);
            canvas = this.createTextureCanvas(styles, colors, options);
            // Store only the canvas in the cache
            TextureGenerator.#canvasCache[textureKey] = canvas;
        }
        
        // Create a new texture from the canvas (so settings aren't shared)
        const texture = new THREE.CanvasTexture(canvas);
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        texture.repeat.set(2, 2); // Repeat the texture
        texture.generateMipmaps = true;
        texture.minFilter = THREE.LinearMipMapLinearFilter;
        texture.needsUpdate = true;
        
        return texture;
    }

    async generateBackdropTexture(colors, depth = 3) {
        const textureKey = `backdrop_${JSON.stringify(colors)}_${depth}`;
        
        console.log(`Requesting backdrop texture: ${textureKey}`);

        // Get or create the canvas
        let canvas;
        if (TextureGenerator.#canvasCache[textureKey]) {
            console.log(`Using cached backdrop texture canvas: ${textureKey}`);
            canvas = TextureGenerator.#canvasCache[textureKey];
        } else {
            console.log(`Generating new backdrop texture canvas: ${textureKey}`);
            canvas = await this.createBackdropCanvas(colors, depth);
            // Store only the canvas in the cache
            TextureGenerator.#canvasCache[textureKey] = canvas;
        }
        
        // Create a new texture from the canvas (so settings aren't shared)
        const texture = new THREE.CanvasTexture(canvas);
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        texture.repeat.set(2, 2); // Repeat the texture
        texture.generateMipmaps = true;
        texture.minFilter = THREE.LinearMipMapLinearFilter;
        texture.needsUpdate = true;
        
        return texture;
    }

    async createBackdropCanvas(colors, depth = 3) {
        const canvas = document.createElement('canvas');
        canvas.width = this.textureSize;
        canvas.height = this.textureSize;
        
        const ctx = canvas.getContext('2d');
        
        // Generate backdrop
        await this.generateBackdrop(ctx, colors, depth);
        
        // Add subtle noise overlay to all textures for realism
        this.addNoiseOverlay(ctx, 0.0001);
        
        return canvas;
    }

    createTextureCanvas(styles, colors, options = {}) {
        const canvas = document.createElement('canvas');
        canvas.width = this.textureSize;
        canvas.height = this.textureSize;
        
        const ctx = canvas.getContext('2d');
        
        // Fill with base color (primary color)
        ctx.fillStyle = colors.primary || colors;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Apply styles
        for (const style of styles) {
            switch (style) {
                case 'stripes':
                    this.generateStripes(ctx, colors);
                    break;
                case 'geometric':
                    this.generateGeometric(ctx, colors);
                    break;
                case 'noise':
                    this.generateNoise(ctx, colors, options.noiseIntensity);
                    break;
                case 'tiles':
                    this.generateTiles(ctx, colors);
                    break;
                case 'carpet':
                    this.generateCarpet(ctx, colors);
                    break;
                case 'clouds':
                    this.generateClouds(ctx, colors, options.noiseIntensity);
                    break;
                default:
                    console.warn(`Unknown style: ${style}`);
            }
        }
        
        // Add subtle noise overlay to all textures for realism
        this.addNoiseOverlay(ctx, 0.0001);
        
        return canvas;
    }

    generateStripes(ctx, colors) {
        const primaryColor = colors.primary || colors;
        const secondaryColor = colors.secondary || primaryColor;
        
        ctx.fillStyle = primaryColor;
        ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
        
        // Use secondary color with hardcoded transparency for stripes
        ctx.strokeStyle = secondaryColor + '4D'; // Add transparency (30% opacity)
        ctx.lineWidth = 2 * (this.textureSize / 256);
        const stripeSpacing = 20 * (this.textureSize / 256);
        for (let i = 0; i < ctx.canvas.width; i += stripeSpacing) {
            ctx.beginPath();
            ctx.moveTo(i, 0);
            ctx.lineTo(i, ctx.canvas.height);
            ctx.stroke();
        }
    }

    generateGeometric(ctx, colors) {
        const primaryColor = colors.primary || colors;
        const secondaryColor = colors.secondary || primaryColor;
        
        // Example geometric pattern
        ctx.fillStyle = primaryColor;
        ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
        
        ctx.fillStyle = secondaryColor;
        const patternSize = 20 * (this.textureSize / 256);
        for (let i = 0; i < ctx.canvas.width; i += patternSize) {
            for (let j = 0; j < ctx.canvas.height; j += patternSize) {
                if ((i + j) % (patternSize * 2) === 0) {
                    ctx.fillRect(i, j, patternSize, patternSize);
                }
            }
        }
    }

    generateNoise(ctx, colors, noiseIntensity = 50) {
        const primaryColor = colors.primary || colors;
        
        // Fill with base color first
        ctx.fillStyle = primaryColor;
        ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
        
        // Calculate noise density based on texture resolution to maintain consistent graininess
        // Higher resolution textures need proportionally more noise pixels to maintain the same visual graininess
        const resolutionScale = this.textureSize / 256; // Base scale at 256x256
        const noisePixelCount = Math.floor(ctx.canvas.width * ctx.canvas.height * resolutionScale * 0.8);
        
        // Generate noise by placing individual noisy pixels rather than modifying all pixels
        // This maintains consistent graininess regardless of resolution
        const imageData = ctx.getImageData(0, 0, ctx.canvas.width, ctx.canvas.height);
        const data = imageData.data;
        
        for (let i = 0; i < noisePixelCount; i++) {
            // Pick random pixel location
            const x = Math.floor(Math.random() * ctx.canvas.width);
            const y = Math.floor(Math.random() * ctx.canvas.height);
            const pixelIndex = (y * ctx.canvas.width + x) * 4;
            
            // Apply noise with specified intensity
            const noise = (Math.random() - 0.5) * noiseIntensity;
            data[pixelIndex] = Math.max(0, Math.min(255, data[pixelIndex] + noise));     // Red
            data[pixelIndex + 1] = Math.max(0, Math.min(255, data[pixelIndex + 1] + noise)); // Green
            data[pixelIndex + 2] = Math.max(0, Math.min(255, data[pixelIndex + 2] + noise)); // Blue
            // Alpha channel remains unchanged
        }
        
        ctx.putImageData(imageData, 0, 0);
    }

    generateClouds(ctx, colors, noiseIntensity = 30) {
        // Cloud generation is essentially sophisticated noise with multiple layers
        const primaryColor = colors.primary || '#9a9a9a';
        const secondaryColor = colors.secondary || '#ffffff';
        
        // Fill with base color first  
        ctx.fillStyle = primaryColor;
        ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
        
        // Create cloud-like patterns using layered noise
        // Layer 1: Base cloud shapes
        this.generateNoise(ctx, { primary: primaryColor }, noiseIntensity * 0.8);
        
        // Layer 2: Lighter cloud highlights
        const imageData = ctx.getImageData(0, 0, ctx.canvas.width, ctx.canvas.height);
        const data = imageData.data;
        
        // Add lighter patches for cloud highlights
        const resolutionScale = this.textureSize / 256;
        const highlightCount = Math.floor(ctx.canvas.width * ctx.canvas.height * resolutionScale * 0.3);
        
        for (let i = 0; i < highlightCount; i++) {
            const x = Math.floor(Math.random() * ctx.canvas.width);
            const y = Math.floor(Math.random() * ctx.canvas.height);
            const pixelIndex = (y * ctx.canvas.width + x) * 4;
            
            // Add white highlights for cloud effect
            const highlight = Math.random() * noiseIntensity * 1.5;
            data[pixelIndex] = Math.min(255, data[pixelIndex] + highlight);     // Red
            data[pixelIndex + 1] = Math.min(255, data[pixelIndex + 1] + highlight); // Green  
            data[pixelIndex + 2] = Math.min(255, data[pixelIndex + 2] + highlight); // Blue
        }
        
        ctx.putImageData(imageData, 0, 0);
    }

    generateTiles(ctx, colors) {
        const primaryColor = colors.primary || colors;
        const secondaryColor = colors.secondary || '#e6e4df';
        const accentColor = colors.accent || '#dcd6d7';
        const accent2Color = colors.accent2 || '#262626ff';

        
        // Base ceiling color
        ctx.fillStyle = primaryColor;
        ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
        
        // Draw ceiling tile pattern - common in 90s offices
        const tileSize = Math.floor(this.textureSize / 2); // Larger tiles (2×2 grid)
        const numTiles = Math.floor(this.textureSize / tileSize);
        
        // Ceiling grid lines
        ctx.strokeStyle = secondaryColor;
        ctx.lineWidth = 5 * (this.textureSize / 256); // Slightly thicker for 90s drop ceiling tile look
        
        // Draw the primary grid lines (standard office ceiling tile layout)
        for (let x = 0; x <= numTiles; x++) {
            ctx.beginPath();
            ctx.moveTo(x * tileSize, 0);
            ctx.lineTo(x * tileSize, this.textureSize);
            ctx.stroke();
        }
        
        for (let y = 0; y <= numTiles; y++) {
            ctx.beginPath();
            ctx.moveTo(0, y * tileSize);
            ctx.lineTo(this.textureSize, y * tileSize);
            ctx.stroke();
        }

        const speckleCount = 200;
        for (let i = 0; i < speckleCount; i++) { 
            const x = Math.random() * ctx.canvas.width;
            const y = Math.random() * ctx.canvas.height;
            const size = (0.5 + Math.random() * 1.5) * (this.textureSize / 256);
            
            // Randomly vary between the provided colors
            const colorVariation = Math.random();
            if (colorVariation < 0.7) {
                ctx.fillStyle = secondaryColor; // Main speckle color
            } else if (colorVariation < 0.9) {
                ctx.fillStyle = accentColor; // Slightly lighter accent
            } else {
                ctx.fillStyle = accent2Color + "4D"; // Slightly darker accent
            }
            
            ctx.beginPath();
            ctx.arc(x, y, size, 0, Math.PI * 2);
            ctx.fill();
        }
        
        // Add subtle noise for ceiling
        this.addNoiseOverlay(ctx, 0.05);
    }

    generateCarpet(ctx, colors) {
        const primaryColor = colors.primary || colors;
        const secondaryColor = colors.secondary || '#15331f';
        const accentColor = colors.accent || '#1d4432';
        const accent2Color = colors.accent2 || '#132920';
        
        // Fill with base carpet color
        ctx.fillStyle = primaryColor;
        ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
        
        // Create carpet texture with small speckles
        const speckleCount = 5000;
        for (let i = 0; i < speckleCount; i++) { // More speckles for textured carpet feel
            const x = Math.random() * ctx.canvas.width;
            const y = Math.random() * ctx.canvas.height;
            const size = (0.5 + Math.random() * 1.5) * (this.textureSize / 256); // Small dots for carpet texture
            
            // Randomly vary between the provided colors
            const colorVariation = Math.random();
            if (colorVariation < 0.7) {
                ctx.fillStyle = secondaryColor; // Main speckle color
            } else if (colorVariation < 0.9) {
                ctx.fillStyle = accentColor; // Slightly lighter accent
            } else {
                ctx.fillStyle = accent2Color; // Slightly darker accent
            }
            
            ctx.beginPath();
            ctx.arc(x, y, size, 0, Math.PI * 2);
            ctx.fill();
        }
        
        const fiberCount = 40;
        // Add subtle vertical and horizontal "fibers" for a carpet look
        // Create a semi-transparent version of the secondary color for fibers
        const fiberColor = secondaryColor + '33'; // Add transparency
        ctx.strokeStyle = fiberColor;
        ctx.lineWidth = 0.5 * (this.textureSize / 256);
        
        // Add some subtle fabric-like texture lines
        for (let i = 0; i < fiberCount; i++) {
            // Horizontal fibers
            const y = Math.random() * ctx.canvas.height;
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(ctx.canvas.width, y);
            ctx.stroke();
            
            // Vertical fibers
            const x = Math.random() * ctx.canvas.width;
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, ctx.canvas.height);
            ctx.stroke();
        }
        
        // Add subtle noise for carpet texture
        this.addNoiseOverlay(ctx, 0.005);
    }

    async generateBackdrop(ctx, colors, depth = 3) {
        const primaryColor = colors.primary || '#87CEEB'; // Sky blue
        
        // Fill with background color (sky)
        ctx.fillStyle = primaryColor;
        ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
        
        // Load all tree images
        const treeImages = await this.loadTreeImages();
        if (treeImages.length === 0) {
            console.warn('No tree images could be loaded');
            return;
        }
        
        // Calculate tree size based on depth (higher depth = smaller trees)
        const treeScale = Math.max(0.2, 1.0 - (depth - 1) * 0.15); // Scale from 1.0 down to 0.2
        const baseTreeWidth = Math.floor(this.textureSize * 0.15 * treeScale);
        const baseTreeHeight = Math.floor(this.textureSize * 0.23 * treeScale);
        
        // Calculate loose grid dimensions with spacing variations
        const spacingVariation = 0.4; // 40% spacing variation
        const overlapFactor = 0.3; // Allow 30% overlap
        
        const avgSpacingX = baseTreeWidth * (1 - overlapFactor);
        const avgSpacingY = baseTreeHeight * (1 - overlapFactor);
        
        const cols = Math.floor(ctx.canvas.width / avgSpacingX);
        const rows = Math.floor(ctx.canvas.height / avgSpacingY);
        
        // Place trees with varied spacing and limited overlap
        for (let row = 0; row < rows; row++) {
            for (let col = 0; col < cols; col++) {
                // Base grid position
                const baseX = col * avgSpacingX;
                const baseY = row * avgSpacingY;
                
                // Add random spacing variation
                const xVariation = (Math.random() - 0.5) * avgSpacingX * spacingVariation;
                const yVariation = (Math.random() - 0.5) * avgSpacingY * spacingVariation;
                
                const x = Math.max(0, Math.min(baseX + xVariation, ctx.canvas.width - baseTreeWidth));
                const y = Math.max(0, Math.min(baseY + yVariation, ctx.canvas.height - baseTreeHeight));
                
                // Vary individual tree size slightly for more natural look
                const sizeVariation = 0.8 + (Math.random() * 0.4); // 80% to 120% of base size
                const treeWidth = Math.floor(baseTreeWidth * sizeVariation);
                const treeHeight = Math.floor(baseTreeHeight * sizeVariation);
                
                // Select random tree image
                const treeImage = treeImages[Math.floor(Math.random() * treeImages.length)];
                
                // Draw the tree
                this.drawTree(ctx, treeImage, x, y, treeWidth, treeHeight);
            }
        }
    }
    
    async loadTreeImages() {
        const treeImages = [];
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
        return results.filter(img => img !== null);
    }
    
    drawTree(ctx, treeImage, x, y, maxWidth, maxHeight) {
        // Calculate scaling to fit within bounds while preserving aspect ratio
        const imageAspect = treeImage.width / treeImage.height;
        const boundsAspect = maxWidth / maxHeight;
        
        let drawWidth, drawHeight;
        if (imageAspect > boundsAspect) {
            // Image is wider relative to bounds
            drawWidth = maxWidth;
            drawHeight = maxWidth / imageAspect;
        } else {
            // Image is taller relative to bounds
            drawHeight = maxHeight;
            drawWidth = maxHeight * imageAspect;
        }
        
        // Center the tree within the bounds
        const drawX = x + (maxWidth - drawWidth) / 2;
        const drawY = y + (maxHeight - drawHeight) / 2;
        
        ctx.drawImage(treeImage, drawX, drawY, drawWidth, drawHeight);
    }

    addNoiseOverlay(ctx, intensity) {
        const imageData = ctx.getImageData(0, 0, ctx.canvas.width, ctx.canvas.height);
        const data = imageData.data;
        for (let i = 0; i < data.length; i += 4) {
            const noise = (Math.random() - 0.5) * intensity * 255; // Adjust noise intensity
            data[i] += noise;     // Red
            data[i + 1] += noise; // Green
            data[i + 2] += noise; // Blue
        }
        ctx.putImageData(imageData, 0, 0);
    }
}
