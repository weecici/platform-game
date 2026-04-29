# Architecture & Data Flow

The game uses **Three.js** for rendering and **Cannon-es** for physics.

- **Orchestration (`src/main.ts`):** The `Game` class manages the initialization sequence and the `requestAnimationFrame` loop. It steps the physics world and then updates the rendering scene.
- **Core Wrappers (`src/core/`):**
  - `Engine`: Manages the WebGL renderer, scene, and camera.
  - `PhysicsWorld`: Wraps Cannon.js, managing rigid bodies and gravity.
- **Entities (`src/entities/`):** Objects like `PlayerController` maintain both a Three.js `Mesh` (for visuals) and a Cannon-es `Body` (for physics). During the update loop, the Mesh position/quaternion is synchronized with the Body.
- **Data-Driven Levels (`src/levels/`):** Levels are fully data-driven via `LevelConfig` arrays in `level-data.ts`. The `LevelManager` orchestrates the lifecycle of `PlatformRuntime` and `DecorationRuntime` entities.
- **Platform Types:** Platforms can have complex behaviors like `moving` (configured with `moveAxis`, `moveRange`, `moveSpeed`) or `rotating`.
- **Decorations vs. Collectibles:** The engine maps basic Three.js primitives (like torusknot, sphere) as floating collectibles in the level data. When collected, they translate into usable items in the `BlockInventory`.
