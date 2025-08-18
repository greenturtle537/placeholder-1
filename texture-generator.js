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
                }
            },
            "cloudy": {
                "styles": ['noise'],
                "colors": {
                    "primary": '#9a9a9a',
                    "secondary": '#ffffff',
                    "accent": '#f0f8ff',
                    "accent2": 'rgba(94, 94, 94, 1)'
                }
            },
            "offpaint": {
                "styles": ['noise'],
                "colors": {
                    "primary": '#bebebeff'
                }
            }
        };
    }

    generateTexture(name, styles, colors) {
        // If only name is passed, try to get preset data
        if (typeof name === 'string' && !styles && !colors) {
            const preset = this.presetTextures[name];
            if (preset) {
                styles = preset.styles;
                colors = preset.colors;
                name = [name]; // Convert to array for consistency
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
        
        const textureKey = `${name.join('_')}_${JSON.stringify(colors)}_${styles}`;
        
        console.log(`Requesting texture: ${textureKey}`);

        // Get or create the canvas
        let canvas;
        if (TextureGenerator.#canvasCache[textureKey]) {
            console.log(`Using cached texture canvas: ${textureKey}`);
            canvas = TextureGenerator.#canvasCache[textureKey];
        } else {
            console.log(`Generating new texture canvas: ${textureKey}`);
            canvas = this.createTextureCanvas(styles, colors);
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

    createTextureCanvas(styles, colors) {
        const canvas = document.createElement('canvas');
        canvas.width = this.textureSize;
        canvas.height = this.textureSize;
        
        const ctx = canvas.getContext('2d');
        
        // Fill with base color (primary color)
        ctx.fillStyle = colors.primary || colors;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Apply styles
        styles.forEach(style => {
            switch (style) {
                case 'stripes':
                    this.generateStripes(ctx, colors);
                    break;
                case 'geometric':
                    this.generateGeometric(ctx, colors);
                    break;
                case 'noise':
                    this.generateNoise(ctx, colors);
                    break;
                case 'tiles':
                    this.generateTiles(ctx, colors);
                    break;
                case 'carpet':
                    this.generateCarpet(ctx, colors);
                    break;
                case 'clouds':
                    this.generateClouds(ctx, colors);
                    break;
                default:
                    console.warn(`Unknown style: ${style}`);
            }
        });
        
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

    generateNoise(ctx, colors) {
        const primaryColor = colors.primary || colors;
        
        // Fill with base color first
        ctx.fillStyle = primaryColor;
        ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
        
        // Simple noise generation
        const imageData = ctx.getImageData(0, 0, ctx.canvas.width, ctx.canvas.height);
        const data = imageData.data;
        for (let i = 0; i < data.length; i += 4) {
            const noise = Math.random() * 50; // Adjust noise intensity
            data[i] += noise;     // Red
            data[i + 1] += noise; // Green
            data[i + 2] += noise; // Blue
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
