import { LevelConfig } from "../level-manager";

export const collectibles: LevelConfig["decorations"] = [
  {
    type: "sphere",
    position: [-42, 63.0, -136],
    color: 4513279,
    emissive: 4513279,
    animate: {
      rotate: { y: 2 },
      move: { y: 0.25 },
      moveSpeed: 2,
    },
    collectible: "sphere",
  },
  {
    type: "sphere",
    position: [-45, 63.0, -136],
    color: 4513279,
    emissive: 4513279,
    animate: {
      rotate: { y: 2 },
      move: { y: 0.25 },
      moveSpeed: 2,
    },
    collectible: "box",
  },
  {
    type: "sphere",
    position: [-42, 63.0, -138],
    color: 4513279,
    emissive: 4513279,
    animate: {
      rotate: { y: 2 },
      move: { y: 0.25 },
      moveSpeed: 2,
    },
    collectible: "sphere",
  },
  {
    type: "sphere",
    position: [-45, 63.0, -138],
    color: 4513279,
    emissive: 4513279,
    animate: {
      rotate: { y: 2 },
      move: { y: 0.25 },
      moveSpeed: 2,
    },
    collectible: "box",
  },
  {
    type: "sphere",
    position: [-45, 63.0, -140],
    color: 4513279,
    emissive: 4513279,
    animate: {
      rotate: { y: 2 },
      move: { y: 0.25 },
      moveSpeed: 2,
    },
    collectible: "cylinder",
  },
];
