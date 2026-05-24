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

## [2026-05-20] ingest | Simplified decoration animation

- Replaced model decoration bobbing/orbit animation with common axis-based rotation and linear movement fields.
- Updated `LevelManager` to apply the same decoration motion model to both primitive decorations and loaded models.
- Migrated the parkour collectible and model decoration data to the new animation fields.

## [2026-05-09] update | The Vertical Tower Overhaul

- Lowered the death plane from `-4.5` to `-50.0` to enable ground-level exploration.
- Wiped the linear horizontal parkour map.
- Injected a massive spiral array of vertical platforms (Static -> Moving -> Rotating -> Tiny).
- Relocated the Victory condition to require the player to reach `y = 105`.
- Scattered 60 hidden Block Pickups across the ground level to force players to scavenge resources before using the placement system to creatively scale the vertical tower.

## [2026-05-09] update | World Expansion & Culling Fix

- Re-expanded `RENDER_DISTANCE` to 150 and `LAZY_LOAD_DISTANCE` to 200.
- Pushed atmospheric fog back to `fogFar: 400` and Camera clipping plane to `3000`.
- Expanded the main ground width to `1000` units.
- Introduced a `noCull: true` flag to prevent massive objects (like the 10,000-unit-long ground) from deleting their physics when the player steps away from their exact center.

## [2024-05-19] ingest | Command Console & Day/Night Cycle

- Added command console documentation (`llm-wiki/concepts/command-console.md`) for `/tp`, `/speed`, `/jump`, `/give`, `/kill`.
- Added Day & Night cycle documentation (`llm-wiki/systems/day-night-cycle.md`), detailing custom shader crossfading, sun/moon arcs, and 8-phase skybox transitions.

## [2024-05-19] update | Solid Submodels, Affine Right-Click & Physics

- Fixed CANNON.Trimesh generation to correctly extract only position data via `vertex.fromBufferAttribute()` for interleaved geometries.
- Removed artificial Y=105 win height threshold.
- Fixed placed blocks incorrectly disappearing when entering Spectator mode (switched `clear()` to `deselectBlock()`).
- Fixed "floaty" rotated physics boxes by temporarily zeroing visual rotation before applying physical bounds.
- Removed arbitrary `0.6` minimum thickness clamp for physics boxes.
- Added `/timestop` cheat command to `DayNightSystem`.

## [2026-05-23] ingest | Three Parkour Zones for Quest Items

- Added parkour routes for the two remaining key items (Radio and Books) in `src/levels/parkour/object-position.ts`.
- **Zone 2 (Left 2 - Radio):** Parkour path from Worker NPC (`[-135, 0.5, -235]`) eastward to radio building (`[-110, 84, -233]`). 12 objects: 2 boxes → 5 wood platforms → 2 moving → 1 rotating → 1 tire + platform.
- **Zone 3 (Right 2 - Books):** Parkour path from Businessman NPC (`[165, 0.5, -265]`) westward to books building (`[121, 86, -265]`). 12 objects: 2 boxes → 5 wood platforms → 2 moving → 1 rotating → 1 tire + platform.
- Both zones match the style of the existing Zone 1 (Left 1 - Waifu Pillow): easy-medium difficulty, single path from street up to mid-building height (~y=45), requiring placed blocks for the final ascent.

## [2026-05-23] update | Extended Zone 2 & Zone 3 Parkour to Key Item Destinations

- **Zone 2 (Radio — Deep Western Cliffs):** Extended from y=45 up to y=84 using Groups 6–10 in `object-position.ts`.
  - Group 6: Inclined ladder off first adjacent building rooftop (~y=46).
  - Group 7: 3 wood platforms zigzag upward (y=52→60), one moving on Z-axis.
  - Group 8: 1 rotating platform (y=63) + 1 tiny static (y=67) + 1 tiny moving-X (y=71).
  - Group 9: Spinning tire obstacle at y=74.
  - Group 10: Inclined ladder (y=78) + wide landing platform at y=82, adjacent to Radio at y=84.
- **Zone 3 (Books — Eastern Spire):** Mirrored structure from x=124 westward to x=121, extending from y=45 to y=86.
  - Group 6–10 identical in pattern to Zone 2 but mirrored east-to-west.
  - Final landing platform at y=83, directly below Books at y=86.
- Both zones now have a **complete unbroken path from street (y=0) to key item** without needing placed blocks.
- Difficulty curve: Boxes (easy) → Zigzag platforms (easy-medium) → Moving/rotating (medium) → Tire (medium) → Final ladders (easy).

## [2026-05-20] ingest | NPC Quest, Glassmorphism Dialogue Box & Multiple Endings

- Created new Entity documentation for [NPC](./entities/npc.md) detailing GLTF skeletal loading, Idle fallback animations, flat look-at tracking, and spatial bounds.
- Created new Concept documentation for [Interactive Dialogue System](./concepts/dialogue-system.md) outlining typewriter animations, click-skipping, dynamic speaker classes, and quantum teleporter integration.
- Refactored `imp-obj-position.ts` to map the Swords, Radio, and Books as key quest items, leaving the UFO as the game exit trigger.
- Rewrote the main interaction loop in `main.ts` to seamlessly handle multi-turn dialog branching, control freezing, and Ending overlays.

## [2026-05-21] update | Dynamic Quest & Dialogue Registry Engine

- Created an infinitely scalable Quest & Dialogue Registry schema inside `src/data/story-data.ts`.
- Encapsulated spawning coordinates, interaction range, required items list, custom complete hooks (e.g. dynamic teleports or item rewards), and dialogue script generators under a unified `STORY_CONFIG.npcs` registry list.
- Refactored `src/main.ts` to dynamically spawn, tick, head-track, and route interaction handlers based on whichever characters are configured in the registry.
- Implemented a unified F-keypress proximity router that dynamically calculates nearest interactive entities, builds runtime `GameQuestState` wrappers, and launches dialog interfaces.
- Decoupled key-item pickup interception in `gameLoop()`, dynamically checking if an item is required by any active quest in the registry.
- Registered the original Building Owner quest and a new **Space Philosopher** NPC near spawn who grants 5 Dirt blocks and meta-game dialogue on first talk to verify infinite extensibility.
