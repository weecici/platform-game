import { LevelConfig } from "../level-manager";

export const scene: LevelConfig["decorations"] = [
  {
    type: "model",
    modelPath: "scene/mountain.usdz",
    position: [-200, -4.5, -60],
    scale: [0.35, 0.5, 0.5],
    rotation: [0, Math.PI, 0],
    solid: true,
    noCull: true,
  },
  {
    type: "model",
    modelPath: "scene/road.usdz",
    position: [-5, 0, -2],
    targetSizeX: 30.0,
    rotation: [0, Math.PI / 3, 0],
    childIndex: 1,
    solid: true,
  },
];
