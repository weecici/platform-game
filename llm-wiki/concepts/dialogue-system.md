---
tags: [concept, ui, dialogue, interaction]
source_files: ["src/ui/npc-dialog.ts", "src/main.ts"]
last_updated: 2026-05-20
---

# Interactive Dialogue System

The `NPCDialog` system manages the narrative and conversational UI of the game. It provides a highly premium, cinematic two-way interface for players to talk with NPCs, receive quests, and trigger branching endings.

## UI & Styling Aesthetics

The dialogue box uses ultra-premium modern web design standards:
- **Glassmorphism:** A semi-transparent dark panel styled with `backdrop-filter: blur(16px) saturate(180%);` and high-contrast glowing accents.
- **Dynamic Speaker Themes:** The panel border and title change colors in real-time depending on who is talking:
  - **Player ("You"):** Cyan borders and glowing neon text shadows.
  - **NPC ("Building Owner"):** Rich gold/orange color grading.
  - **Narrator:** Soft purple accents.

## Dynamic Text Presentation

- **Typewriter Effect:** Text is revealed character-by-character every 15 milliseconds, mimicking classic RPG narratives.
- **Animation Skipping:** Pressing the interaction key (`F`) or clicking the panel while text is typing instantly skips the typewriter sequence and reveals the complete sentence.
- **Pulsing Indicator:** A realistic 3D-styled keycap icon `[F]` pulses at the bottom-right of the screen once a line is fully revealed to invite the next interaction.

## Gameplay Orchestration Integration

When dialogue is shown:
1. Controls are frozen (`input.setGameplayActive(false)`), stopping player WASD movement and block building.
2. Pointer lock is exited, allowing mouse clicking.
3. Steps are processed in sequence. 
4. Upon dialogue completion, the camera locks back to the game canvas and gameplay controls are restored seamlessly (`input.setGameplayActive(true)` and `input.requestPointerLock()`).

## Data-Driven Quest & Dialogue Registry Engine

Rather than hardcoding specific narrative paths, the story, dialogue trees, coordinates, and interactive items are orchestrated by a unified, infinitely scalable **Quest & Dialogue Registry Engine**:

- **`src/data/story-data.ts` Registry**: Houses the array of interactive NPC configurations (`STORY_CONFIG.npcs`). Each NPC configures its unique:
  - **Spawning Details**: GLTF model path, 3D position coordinates, and spatial interaction radius.
  - **Quest Requirements**: A list of `requiredItems` that must be gathered before completing their quest.
  - **Dialogue script generator**: A dynamic callback `getDialogue(state)` returning specific branching sentences based on the player's conversation and pickup records.
  - **Completion Hooks**: An `onComplete(state)` callback enabling the character to trigger teleports, grant inventories, or custom ending overlays.

- **Dynamic Spawning & Orienting**: The main loop parses the registry on canvas startup, dynamically spawning each NPC and updating their flat head/body rotations each render frame.

- **Dynamic Interaction Proximity Router**: When the player hits `F`, the engine scans all configured NPCs and triggers the dialogue engine for the closest one in range, compiling a dynamic `GameQuestState` on-the-fly containing reward handles and level metadata queries.

- **Key Item Interception**: Pickup interception automatically scans the active NPC quest requirements in the registry. If a collectible is required by *any* registered NPC, it is dynamically intercepted, custom notification overlays are rendered, and key inventory checks are satisfied without writing block-specific gameplay code.


