---
tags: [environment, lighting, rendering, time]
source_files: ["src/systems/day-night-system.ts", "src/systems/lighting-system.ts"]
last_updated: "2024-05-19"
---
# Day & Night Cycle

Manages dynamic time progression, sun/moon trajectory, and skybox blending.

## Phases
There are 8 phases (120 seconds each):
1. Dawn (skybox-1-dawn)
2. Early Morning (skybox-2-early-morning)
3. Morning (skybox-3-morning)
4. Lunch (skybox-4-lunch)
5. Afternoon (skybox-5-afternoon)
6. Evening (skybox-6-evening)
7. Dusk (skybox-7-dusk)
8. Night (skybox-8-night)

## Skybox Blending
Because Three.js `scene.background` cannot crossfade, a custom `THREE.ShaderMaterial` applied to a large `THREE.BoxGeometry` is used. Skyboxes are lazy-loaded. 
Crossfading occurs rapidly over the final 10 seconds of a phase to prevent visual artifacts like "two suns" appearing simultaneously.

## Sun & Moon Trajectory
The sun rises roughly near `(50, y, -30)` and sets near `(-50, y, 30)`. During the night phase, the directional light flips to act as the moon (lower intensity, bluish tint).
