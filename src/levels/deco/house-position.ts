import { LevelConfig } from "../level-manager";

export const houses: LevelConfig["decorations"] = [
  {
    type: "model",
    modelPath: "/assets/models/house/house_1.usdz",
    position: [50, 0, 25],
    scale: [0.05, 0.05, 0.05],
    rotation: [0, -0.9, 0],
    solid: true,
  },
  {
    type: "model",
    modelPath: "/assets/models/house/house_2.usdz",
    position: [-50, 0, 25],
    scale: [0.05, 0.05, 0.05],
    rotation: [0, -0.9, 0],
    solid: true,
  },
  {
    type: "model",
    modelPath: "/assets/models/house/house_3.usdz",
    position: [0, 0, 25],
    scale: [0.05, 0.05, 0.05],
    rotation: [0, -0.9, 0],
    solid: true,
  },
  {
    type: "model",
    modelPath: "/assets/models/house/house_4.usdz",
    position: [0, 0, -25],
    scale: [0.05, 0.05, 0.05],
    rotation: [0, -0.9, 0],
    solid: true,
  },
  {
    type: "model",
    modelPath: "/assets/models/house/house_5.usdz",
    position: [0, -1, -50],
    scale: [0.05, 0.05, 0.05],
    rotation: [0, -0.9, 0],
    solid: true,
  },
  {
    type: "model",
    modelPath: "/assets/models/house/barn_3.usdz",
    position: [-50, 0, -82],
    scale: [0.1, 0.1, 0.1],
    rotation: [0, -0.3, 0],
    solid: true,
  },
];
