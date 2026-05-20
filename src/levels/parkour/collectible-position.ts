import { LevelConfig } from "../level-manager";

export const collectibles: LevelConfig["decorations"] = [
  {
    type: "sphere",
    position: [-42, 63.0, -136],
    color: 4513279,
    emissive: 4513279,
    animate: { rotateY: 2, bobSpeed: 2, bobHeight: 0.25 },
    collectible: "sphere",
  },
  {
    type: "sphere",
    position: [-45, 63.0, -136],
    color: 4513279,
    emissive: 4513279,
    animate: { rotateY: 2, bobSpeed: 2, bobHeight: 0.25 },
    collectible: "box",
  },
  {
    type: "sphere",
    position: [-42, 63.0, -138],
    color: 4513279,
    emissive: 4513279,
    animate: { rotateY: 2, bobSpeed: 2, bobHeight: 0.25 },
    collectible: "sphere",
  },
  {
    type: "sphere",
    position: [-45, 63.0, -138],
    color: 4513279,
    emissive: 4513279,
    animate: { rotateY: 2, bobSpeed: 2, bobHeight: 0.25 },
    collectible: "box",
  },
  {
    type: "sphere",
    position: [-45, 63.0, -140],
    color: 4513279,
    emissive: 4513279,
    animate: { rotateY: 2, bobSpeed: 2, bobHeight: 0.25 },
    collectible: "cylinder",
  },
  {
    type: "sphere",
    position: [-42, 63.0, -140],
    color: 4513279,
    emissive: 4513279,
    animate: { rotateY: 2, bobSpeed: 2, bobHeight: 0.25 },
    collectible: "box",
  },
];
