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
