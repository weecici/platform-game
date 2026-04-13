# Parkour Game

## 1. Group Information

| Student ID | Name             | Github                                        |
| ---------- | ---------------- | --------------------------------------------- |
| 23520199   | Nguyễn Chí Cường | [weecici](https://github.com/weecici)         |
| 23520623   | Ngô Minh Huy     | [MinhHuy1507](https://github.com/MinhHuy1507) |
| 23520713   | Vũ Gia Khang     |                                               |
| 23521734   | Dương Thông Tuệ  | [tueduong05](https://github.com/tueduong05)   |

## 2. Project Overview

A 3D parkour and platforming adventure built using web technologies. It features dynamic momentum-based physics, a collectible block inventory system, dynamic character selection, and an interactive placement mechanic that allows players to shape their environment using primitive geometries to traverse the map.

The game is built entirely in TypeScript, utilizing Three.js for 3D rendering and Cannon-es for rigid-body physics.

## 3. Project Structure

The project is organized into modular directories to separate core engine logic from gameplay systems:

- `src/core/`: Foundation logic, including the Three.js Engine initialization, Input Management, and Cannon.js Physics wrapper.
- `src/entities/`: Gameplay entities, primarily the `PlayerController` handling movement logic, momentum, and animation.
- `src/levels/`: Level configuration, spawn points, and collectible item placement.
- `src/systems/`: Game mechanics and features, such as the block inventory, primitive placement logic, textures, and lighting.
- `src/ui/`: User Interface elements and the interactive Debug GUI.

## 4. Setup

Follow these instructions to run the game locally on your machine.

**Prerequisites**

- Node.js installed
- `pnpm` package manager installed (`npm install -g pnpm`)

**Installation Steps**

1. Clone this repository to your local machine.
2. Open a terminal in the project's root directory.
3. Install the dependencies by running:
   ```bash
   pnpm install
   ```
4. Start the local development server by running:
   ```bash
   pnpm dev
   ```
5. Open your web browser and navigate to the local URL provided in the terminal (typically `http://localhost:3000`).
