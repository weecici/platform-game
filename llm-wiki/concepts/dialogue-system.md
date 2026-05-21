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
