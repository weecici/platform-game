---
tags: [entity, npc, interaction]
source_files: ["src/entities/npc.ts"]
last_updated: 2026-05-20
---

# NPC Entity

The `NPC` class encapsulates a 3D interactive character spawned within the parkour map. It manages 3D model loading, skeletal animation playback, proximity checking, and real-time head/body orientation updates.

## Model & Animation System

NPC models are loaded asynchronously using standard `GLTFLoader` instances to preserve hierarchical structure, material mappings, and animations:

- **Animation Mixer:** Extracts embedded timeline keyframes into a `THREE.AnimationMixer` and maps them in a clip lookup table.
- **Default/Idle Animation:** Looks for a clip explicitly named `"Idle"`. If missing, it falls back to the first available animation in the track list (e.g. standard idle or breathing clips inside `building_owner.gltf`).

## Spatial Orientation & Interaction

To make the character feel alive and interactive, the NPC performs structural real-time behavior inside the render loop:

- **Player Look-At Facing:** The `update(playerPos)` method extracts the flat XZ coordinates of the player. It computes a rotation matrix mapping the NPC's forward vector to look directly at the player on the horizontal plane, preventing jarring vertical head tilt.
- **Proximity Bounds:** Defines an `interactionRadius` boundary (default: 4.0 units). The spatial method `isPlayerNearby(playerPos)` computes the Euclidean distance between the NPC and the player to determine if key prompts (e.g., F interactions) should be displayed or executed.
