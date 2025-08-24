# Refactored Three.js FPS Engine

## Refactoring Summary

The main.js file has been successfully refactored into a modular architecture. The following components have been extracted into separate files:

### New Modules

1. **`input-controller.js`**
   - Handles all input events (keyboard, mouse)
   - Manages pointer lock functionality
   - Exports KEYS constant for key mappings
   - Exports InputController class

2. **`first-person-camera.js`**
   - Complete FPS camera system with head bobbing
   - Supports both FPS and freefly debug modes
   - Handles collision detection integration
   - Speed control for freefly mode
   - Exports FirstPersonCamera class

3. **`debug-system.js`**
   - Manages debug UI elements
   - Position tracking and camera mode display
   - Collision statistics display
   - Exports DebugSystem class

4. **`game-engine.js`**
   - Core Three.js setup (renderer, scene, camera)
   - Stats initialization and management
   - Window resize handling
   - Scene compilation for smooth rendering
   - Time tracking for animation loops
   - Exports GameEngine class

5. **`utils.js`**
   - Shared utility functions (clamp, lerp, deg/rad conversions)
   - Common mathematical helpers

### Updated Files

- **`main.js`**: Now contains only the main game logic and orchestration
  - Cleaner constructor using modular components
  - Level loading and management
  - Game loop and animation
  - Debug mode toggle handling
  - Tree billboard updates

## Benefits of Refactoring

1. **Separation of Concerns**: Each module has a single, well-defined responsibility
2. **Reusability**: Components can be easily reused in other projects
3. **Maintainability**: Easier to locate and modify specific functionality
4. **Testing**: Individual modules can be tested in isolation
5. **Readability**: Main game logic is no longer cluttered with implementation details

## Module Dependencies

```
main.js
├── game-engine.js
├── first-person-camera.js
│   ├── input-controller.js
│   └── utils.js
├── debug-system.js
├── level-generator.js
├── collision-system.js
├── resource-manager.js
└── public/objects/tree.js
```

## Usage

The refactored code maintains the same public API and functionality as before. Simply load `index.html` and the modular system will work seamlessly.

All existing features remain intact:
- FPS camera with head bobbing
- Q key debug mode toggle (FPS ↔ freefly)
- +/- speed control in freefly mode
- Collision detection
- Debug position tracking
- Level loading system
- Performance monitoring
