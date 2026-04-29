---
tags: [infrastructure, loading, models]
source_files: ["src/entities/model-loader.ts", "src/systems/texture-manager.ts"]
last_updated: 2026-04-29
---

# Asset Pipeline

Responsible for converting all raw 3D models and textures into Three.js primitives.

## TextureManager

A sophisticated class that handles two types of textures:

- **Procedural Canvas Textures:** It creates checkerboard, brick, metal, grass, stone, and wood textures via HTML5 `<canvas>` if external files are missing.
- **PBR Material Sets:** It exposes `loadTextureSet` to download `baseColor`, `normal`, `roughness`, `ao`, and `metallic` maps from `/assets/textures/` to apply highly realistic surfaces to a [Level Manager](../entities/level-manager.md) platform.

## ModelLoader

An abstraction over Three.js' built-in `GLTFLoader`, `OBJLoader`, `FBXLoader`, and `USDZLoader`.

- **Auto-detection:** It analyzes the extension `.gltf`/`.usdz` and runs the correct loader.
- **Pre-loading:** Used by the `Game` to instantiate the Character Selection preview scene.

## ShapeFactory

The `ShapeFactory` wraps standard Three.js primitives (Box, Sphere, Cone, Cylinder, Torus, TorusKnot) but uniquely constructs a lathe-based Teapot using a mathematical curve to approximate a belly, neck, spout, and handle.
