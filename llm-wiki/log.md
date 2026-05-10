# Wiki Log

Append-only chronological log of operations on the wiki.

## [2026-04-29] ingest | Initial codebase scan and wiki instantiation

- Scanned entire `src/` directory.
- Created `AGENTS.md` schema to formalize LLM Wiki pattern.
- Replaced flat markdown files with a structured entity/concept graph.
- Wrote pages detailing `PlayerController` momentum, `LevelManager` operations, `Game` orchestration, and rendering toolchain.

## [2026-05-06] ingest | Added Exact Mesh Collision (Trimesh) for Scene Models

- Updated `LevelManager` to generate `CANNON.Trimesh` bodies for `DecorationDef` models with `solid: true`.
- Created `llm-wiki/concepts/mesh-collision.md` detailing the Trimesh mechanism and its limitation of only colliding with Spheres.
- Updated `llm-wiki/entities/level-manager.md` and `llm-wiki/index.md`.

## [2026-05-09] ingest | Map Expansion and Spectator Mode

- Scanned recent commits mapping large environmental set-pieces (barns, animals, mountains, planes, floating islands) via `.usdz` models in `src/levels/level-data.ts`.
- Documented the new `SpectatorController` free-fly noclip camera (toggle with 'O') added to `src/core/engine.ts`.
- Updated `llm-wiki/concepts/data-driven-levels.md`, `llm-wiki/entities/game-orchestrator.md`, and `llm-wiki/infrastructure/asset-pipeline.md`.

## [2026-05-09] update | Optimized Death Restart

- Replaced `levelManager.clearLevel()` & `loadLevel()` with `resetLevel()` to avoid destructive reloading of heavy `.usdz` models and their expensive Trimesh generation.
- State tracks `initialTime`, `initialScale`, and `initialRotation` to perfectly soft-reset animations and pickups.

## [2026-05-09] update | Lazy Loading & Culling

- Improved `LevelManager.update()` to dynamically lazy-load heavy `.usdz` models only when the player is within `LAZY_LOAD_DISTANCE`.
- Implemented distance-based visibility culling (`mesh.visible = false`) for objects beyond `RENDER_DISTANCE` to heavily optimize FPS.

## [2026-05-09] update | Aggressive State Culling

- Tightened `LAZY_LOAD_DISTANCE` to 100 and `RENDER_DISTANCE` to 75.
- Implemented strict chunk-based Physics culling: `CANNON.Body` elements are now actively detached and reattached based on distance.
- Hard-disabled `castShadow` on extremely dense `.usdz` models (mountains, trees, barns) to protect WebGL draw times.

## [2026-05-09] update | Restored Environment Shadows

- Removed the hard `castShadow = false` override for trees, barns, and mountains. Since they are actively distance-culled out of the rendering pipeline beyond 75 units, allowing nearby models to cast shadows provides better visual quality without penalizing overall FPS.
