---
tags: [entity, core, main]
source_files: ["src/main.ts"]
last_updated: 2026-04-29
---

# Game Orchestrator

The central class (`Game`) in `src/main.ts` orchestrates the initialization and execution of the core loop.

## The Game Loop

Uses `requestAnimationFrame` to step the [Physics World](../infrastructure/rendering-and-lighting.md) (Cannon-es), update the [Player Controller](./player.md), process the [Level Manager](./level-manager.md), and render the frame.

### Spectator Mode

The underlying `Engine` (`src/core/engine.ts`) implements a `SpectatorController` allowing for a free-fly noclip camera.
- **Toggle:** Pressing `O` detaches the camera from the player.
- **Controls:** WASD for lateral movement, `Space/Shift` for altitude adjustment, and the scroll wheel to dynamically alter the camera's flying speed. The player's physical body remains frozen or falls based on momentum while the camera explores.

## State Machine

Maintains state flags (`isRunning`, `isPaused`, `isDead`, `isFinished`) to manage UI screens:

- **Death Sequence:** If the player hits `deathY = -4.5`, `playerDied()` flags the state. The loop waits for `deathSequenceDuration` (1.2s) before showing the death screen.
- **Restarting:** Triggers `restartGame()` which re-fetches the spawn point, clears the [Primitive Placement](./primitive-placement.md), and tells the Level Manager to reload all floating [Block Inventory](./block-inventory.md) collectibles.

## Character Selection Preview

The start screen sets up an independent `previewScene` and `previewRenderer` to display `.gltf` models in a selection list. The selected model path is passed into the Player Controller upon start.
