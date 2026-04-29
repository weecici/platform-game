# Game Mechanics & Systems

## Primitive Placement & Block Inventory

Players can place geometry blocks in the world to navigate the parkour map.

- **`BlockInventory` (`src/systems/block-system.ts`):** Manages the player's available blocks. Players start with 0 blocks and must collect pickups in the level.
- **`PrimitivePlacementSystem` (`src/systems/primitive-placement.ts`):** Handles the logic of raycasting from the camera to determine placement position, and instantiating both the Three.js mesh and Cannon-es body for the new block.

## Player Physics & Momentum

The `PlayerController` does not use raw forces for movement. Instead, it relies on momentum configurations to simulate realistic physics:

- **Inertia:** Uses percentage-based metrics per second (`groundAccel: 0.99` reaching 99% speed in 1s).
- **Friction:** `groundDecel: 0.95` drops 95% of current speed in 1s when no input is applied.
- **Air Control:** Adjustable `airControl` and `airDrag` values manage momentum while mid-air.
- **Coyote Time:** Implements 150ms of "coyote time," allowing players to jump shortly after walking off a ledge.

## Input & Camera

A centralized `InputManager` handles all DOM event bindings and canvas pointer locks.

- **Camera View Modes:** Players can toggle between first-person and third-person view modes by pressing `v`. They can toggle the third-person angle between front and back using `b`.

## Death & Respawn Sequence

- Falling below a `deathY` threshold or failing a condition flags the player as dead.
- A `deathSequenceTimer` runs for `1.2s` before showing the Game Over screen (`finalizeDeathScreen()`).
- Triggering a restart (`restartGame()`) explicitly calls the `LevelManager` to reload the map so that all collectible floating objects reappear.
