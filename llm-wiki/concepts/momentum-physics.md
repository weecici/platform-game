---
tags: [concept, physics, gameplay]
source_files: ["src/entities/player-controller.ts"]
last_updated: 2026-04-29
---

# Momentum Physics

Rather than using Cannon-es' standard `applyForce` or `applyImpulse` for movement, the [Player Controller](../entities/player.md) enforces percentage-based momentum variables.

## Rationale

Raw forces applied per frame can easily compound into infinite speeds or unresponsive "floaty" controls if friction materials aren't perfectly tuned across all objects. This codebase handles platformer physics manually:

## Configuration Options

- **`groundAccel` (e.g. 0.99):** 99% of max move speed is reached in 1 second of holding forward.
- **`groundDecel` (e.g. 0.95):** 95% of current speed is naturally scrubbed in 1 second when letting go of the keys, simulating reliable, tight friction regardless of the ground material.
- **`airControl` (e.g. 1.0):** A multiplier on ground acceleration allowed while mid-air.
- **`airDrag` (e.g. 0.92):** Simulates air resistance by dropping speed over time `pow(airDrag, time)`.

These variables run through a custom velocity vector `direction` applied via `body.velocity.set(dirX, Y, dirZ)` every frame.
