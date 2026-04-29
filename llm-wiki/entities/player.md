---
tags: [entity, physics, mechanics]
source_files: ["src/entities/player-controller.ts"]
last_updated: 2026-04-29
---

# Player Controller

The `PlayerController` entity handles all core character physics, bindings, and logic.

## Composition

It maintains both a Three.js `Mesh`/`Group` (for visuals via the `GLTFLoader`) and a Cannon-es `Body` (for physics). During the update loop, the visual mesh's position and quaternion are synchronized with the physics body.

## Momentum Configuration

Unlike standard Cannon-es controllers that apply raw impulse forces, this controller uses a custom [Momentum Physics](../concepts/momentum-physics.md) model based on percentages per second (e.g. `groundAccel`, `groundDecel`, `airDrag`).

## Coyote Time

To make jumping more forgiving, the controller implements a `coyoteTime` of 150ms. If the player walks off a ledge, they have a brief window to still execute a jump.

## Input & Camera

The controller listens to the `InputManager`. Players toggle between first-person and third-person views using `v`, and switch third-person shoulder sides using `b`. Camera offset parameters (`cameraOffset = new THREE.Vector3(0, 1.5, 4)`) are dynamically interpolated based on this state.
