---
tags: [ui, commands, cheats, debug]
source_files: ["src/main.ts", "src/core/input-manager.ts"]
last_updated: "2024-05-19"
---
# Command Console

The command console allows players to input specific commands to manipulate gameplay state, typically used for debugging or cheating in parkour.

## Mechanics
- Accessed by pressing `/` which is whitelisted in `gameplayKeys`.
- Pauses gameplay inputs via `input.setGameplayActive(false)` to prevent accidental movement.
- Releases pointer lock so the user can interact with the HTML input.

## Available Commands
- `/tp <x> <y> <z>`: Teleports the player and zeroes out their velocity.
- `/speed <number>`: Modifies player move speed.
- `/jump <number>`: Modifies player jump force.
- `/give <block_name> <amount>`: Grants primitive blocks to the `BlockInventory`.
- `/kill` or `/reset`: Triggers `playerDied()` for a soft reset.
