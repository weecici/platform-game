import { LevelConfig } from "../level-manager";

export const objects: LevelConfig["decorations"] = [
  // ### Left 1 ###

  // Group 1
  {
    type: "model",
    modelPath: "object/box_1.usdz",
    position: [-56.6, 17.3, -62.4],
    targetSizeY: 2,
    rotation: [0, 0, 0],
    solid: true,
  },
  {
    type: "model",
    modelPath: "object/box_1.usdz",
    position: [-61, 19.5, -66.2],
    targetSizeY: 2,
    rotation: [0, 0, 0],
    solid: true,
  },

  // Group 2
  {
    type: "model",
    modelPath: "object/wood_platform.usdz",
    position: [-69.2, 26.5, -64.5],
    targetSize: [1.5, 0.2, 1.2],
    rotation: [0, 0, 0],
    solid: true,
  },
  {
    type: "model",
    modelPath: "object/wood_platform.usdz",
    position: [-75.2, 28.5, -64.5],
    targetSize: [1.5, 0.2, 1.2],
    rotation: [0, 0, 0],
    solid: true,
  },
  {
    type: "model",
    modelPath: "object/wood_platform.usdz",
    position: [-81.2, 30.5, -64.5],
    targetSize: [1.5, 0.2, 1.2],
    rotation: [0, 0, 0],
    solid: true,
  },
  {
    type: "model",
    modelPath: "object/wood_platform.usdz",
    position: [-87.2, 32.5, -64.5],
    targetSize: [1.5, 0.2, 1.5],
    rotation: [0, 0, 0],
    solid: true,
  },
  {
    type: "model",
    modelPath: "object/wood_platform.usdz",
    position: [-93.2, 34.5, -64.5],
    targetSize: [1.5, 0.2, 1.2],
    rotation: [0, 0, 0],
    solid: true,
  },
  {
    type: "model",
    modelPath: "object/wood_platform.usdz",
    position: [-86.2, 36.5, -64.5],
    targetSize: [1.5, 0.2, 1.5],
    rotation: [0, 0, 0],
    solid: true,
  },
  {
    type: "model",
    modelPath: "object/wood_platform.usdz",
    position: [-80.2, 38.5, -65.5],
    targetSize: [1.5, 0.3, 1.5],
    rotation: [0, 0, 0],
    solid: true,
  },

  // Group 3
  {
    type: "model",
    modelPath: "object/tire.usdz",
    position: [-59, 43, -74],
    targetSizeX: 3,
    rotation: [Math.PI / 2, Math.PI / 2, 0],
    solid: true,
    animate: {
      rotate: { y: 1, z: 2, x: 2 },
      move: { y: 0.5 },
      moveSpeed: 2,
    },
  },
  {
    type: "model",
    modelPath: "object/tire.usdz",
    position: [-52, 38, -83],
    targetSizeX: 3,
    rotation: [Math.PI / 2, Math.PI / 2, 0],
    solid: true,
    animate: {
      rotate: { y: 1, z: 2, x: 2 },
      move: { y: 0.5 },
      moveSpeed: 2,
    },
  },

  // Group 3
  {
    type: "model",
    modelPath: "object/ladder_1.usdz",
    position: [-40, 32, -108],
    targetSizeX: 1.0,
    rotation: [-Math.PI / 8, Math.PI / 2, 0],
    solid: true,
  },

  // Group 4
];
