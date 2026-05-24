import { LevelConfig } from "../level-manager";

export const objects: LevelConfig["decorations"] = [
  // ### Right 1 ###
  // Final Object

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
  //left 2: waifu billow
  // Ladder: [-110, 42.3, -100.3] → [-109.6, 77.1, -111.0]
  // Midpoint: [-110, 59.7, -105.7] | Height: ~36.4 | Z-lean: ~17°
  {
    type: "model",
    modelPath: "object/ladder_1.usdz",
    position: [-110, 40, -100],
    targetSizeX: 1.0,
    rotation: [-Math.PI / 8, Math.PI / 2, 0],
    solid: true,
  },
  {
    type: "model",
    modelPath: "object/box_1.usdz",
    position: [-115, 55, -105],
    targetSizeY: 2,
    rotation: [0, 0, 0],
    solid: true,
  },
  {
    type: "model",
    modelPath: "object/box_1.usdz",
    position: [-120, 57.5, -105],
    targetSizeY: 2,
    rotation: [0, 0, 0],
    solid: true,
  },
  {
    type: "model",
    modelPath: "object/box_1.usdz",
    position: [-115, 60, -105],
    targetSizeY: 2,
    rotation: [0, 0, 0],
    solid: true,
  },
  {
    type: "model",
    modelPath: "object/wood_platform.usdz",
    position: [-120, 62.5, -105],
    targetSize: [1.5, 0.3, 1.5],
    rotation: [0, 0, 0],
    solid: true,
  },
  {
    type: "model",
    modelPath: "object/wood_platform.usdz",
    position: [-115, 65, -105.5],
    targetSize: [1.5, 0.3, 1.5],
    rotation: [0, 0, 0],
    solid: true,
  },
  {
    type: "model",
    modelPath: "object/wood_platform.usdz",
    position: [-110, 67.5, -105.5],
    targetSize: [1.5, 0.3, 1.5],
    rotation: [0, 0, 0],
    solid: true,
  },
  {
    type: "model",
    modelPath: "object/wood_platform.usdz",
    position: [-115, 70, -105.5],
    targetSize: [1.5, 0.3, 1.5],
    rotation: [0, 0, 0],
    solid: true,
  },
  {
    type: "model",
    modelPath: "object/wood_platform.usdz",
    position: [-110, 72.5, -105.5],
    targetSize: [1.5, 0.3, 1.5],
    rotation: [0, 0, 0],
    solid: true,
  },
  {
    type: "model",
    modelPath: "object/wood_platform.usdz",
    position: [-115, 75, -105.5],
    targetSize: [1.5, 0.3, 1.5],
    rotation: [0, 0, 0],
    solid: true,
  },
  // Radio
  // ### Spring Bounce Pad ###
  // Starting point: [-8.6, 0.3, -234.7] 
  {
    type: "cylinder",// 1st
    position: [-8.6, 0.3, -234.7],
    targetSize: [1.2, 0.15, 1.2],
    color: 0x00ff88,
    emissive: 0x00ff88,
  },

  // ### Moving Box Target ###
  {
    type: "model",
    modelPath: "object/box_1.usdz",
    position: [-15, 15, -230],
    targetSizeY: 2,
    rotation: [0, 0, 0],
    solid: true,
    animate: {
      move: { z: 5 },
      moveSpeed: 1.5,
    },
  },
  //1st group
  {
    type: "model",
    modelPath: "object/wood_platform.usdz",
    position: [-51, 20.7, -215],
    targetSize: [1.5, 0.3, 1.5],
    rotation: [0, 0, 0],
    solid: true,
  animate: {
      move: { y: 5 },
      moveSpeed: 1.5,
    },
  },
  {
    type: "model",
    modelPath: "object/wood_platform.usdz",
    position: [-50, 27.9, -215],
    targetSize: [1.5, 0.3, 1.5],
    rotation: [0, 0, 0],
    solid: true,
  },
  {
    type: "model",
    modelPath: "object/wood_platform.usdz",
    position: [-50, 30.4, -220],
    targetSize: [1.5, 0.3, 1.5],
    rotation: [0, 0, 0],
    solid: true,
  },
  {
    type: "model",
    modelPath: "object/wood_platform.usdz",
    position: [-50, 32.9, -225],
    targetSize: [1.5, 0.3, 1.5],
    rotation: [0, 0, 0],
    solid: true,
  },
  {
    type: "cylinder", // 2nd
    position: [-50, 35, -230],
    targetSize: [1.2, 0.15, 1.2],
    color: 0x00ff88,
    emissive: 0x00ff88,
  },
  {
    type: "model",
    modelPath: "object/box_1.usdz",
    position: [-50, 37.5, -235],
    targetSizeY: 2,
    rotation: [0, 0, 0],
    solid: true,
    animate: {
      move: { y: 5 },
      moveSpeed: 1.5,
    },
  },
  //2nd group
  {
    type: "model",
    modelPath: "object/wood_platform.usdz",
    position: [-73.7, 42.3, -210.0],
    targetSize: [1.5, 0.3, 1.5],
    rotation: [0, 0, 0],
    solid: true,
    animate: {
      move: { z: 4 },
      moveSpeed: 1.5,
    },
  },
  //3rd group
  {
    type: "model",
    modelPath: "object/box_1.usdz",
    position: [-86, 35.1, -193.6],
    targetSizeY: 2,
    rotation: [0, 0, 0],
    solid: true,
  },
  {
    type: "model",
    modelPath: "object/box_1.usdz",
    position: [-90, 37.6, -195.6],
    targetSizeY: 2,
    rotation: [0, 0, 0],
    solid: true,
  },
  {
    type: "model",
    modelPath: "object/wood_platform.usdz",
    position: [-90, 41, -199],
    targetSize: [1.5, 0.3, 1.5],
    rotation: [0, 0, 0],
    solid: true,
    animate: {
      rotate: { x: 1 },
    },
  },
  {
    type: "model",
    modelPath: "object/box_1.usdz",
    position: [-90, 42.5, -202],
    targetSizeY: 2,
    rotation: [0, 0, 0],
    solid: true,
  },
  {
    type: "model",
    modelPath: "object/wood_platform.usdz",
    position: [-95, 43, -205],
    targetSize: [1.5, 0.3, 1.5],
    rotation: [0, 0, 0],
    solid: true,
  },
  {
    type: "model",
    modelPath: "object/wood_platform.usdz",
    position: [-93, 45, -207],
    targetSize: [1.5, 0.3, 1.5],
    rotation: [0, 0, 0],
    solid: true,
  },
  {
    type: "model",
    modelPath: "object/wood_platform.usdz",
    position: [-93, 47, -204],
    targetSize: [1.5, 0.3, 1.5],
    rotation: [0, 0, 0],
    solid: true,
  },
  //4th group
  {
    type: "model",
    modelPath: "object/box_1.usdz",
    position: [-111.7, 48, -215.5],
    targetSizeY: 2,
    rotation: [0, 0, 0],
    solid: true,
  },
  {
    type: "model",
    modelPath: "object/wood_platform.usdz",
    position: [-113.5, 52, -217],
    targetSize: [1.5, 0.3, 1.5],
    rotation: [0, 0, 0],
    solid: true,
  },

  // ### Cylinder Bounce Y+10 ###
  {
    type: "cylinder",
    position: [-115, 54, -215],
    targetSize: [1.2, 0.15, 1.2],
    color: 0x00ff88,
    emissive: 0x00ff88,
  },
  {
    type: "model",
    modelPath: "object/wood_platform.usdz",
    position: [-115.5, 60, -214],
    targetSize: [1.5, 0.3, 1.5],
    rotation: [0, 0, 0],
    solid: true,
    animate: {
      move: { x: 4 },
      moveSpeed: 1.5,
    },
  },
  {
    type: "model",
    modelPath: "object/wood_platform.usdz",
    position: [-117, 62, -214],
    targetSize: [1.5, 0.3, 1.5],
    rotation: [0, 0, 0],
    solid: true,
    animate: {
      move: { x: 4 },
      moveSpeed: 1.5,
    },
  },
  {
    type: "model",
    modelPath: "object/wood_platform.usdz",
    position: [-119, 64, -214],
    targetSize: [1.5, 0.3, 1.5],
    rotation: [0, 0, 0],
    solid: true,
    animate: {
      move: { x: 4 },
      moveSpeed: 1.5,
    },
  },
  {
    type: "model",
    modelPath: "object/wood_platform.usdz",
    position: [-117, 66, -214],
    targetSize: [1.5, 0.3, 1.5],
    rotation: [0, 0, 0],
    solid: true,
    animate: {
      move: { x: 4 },
      moveSpeed: 1.5,
    },
  },
  {
    type: "model",
    modelPath: "object/wood_platform.usdz",
    position: [-119, 68, -214],
    targetSize: [1.5, 0.3, 1.5],
    rotation: [0, 0, 0],
    solid: true,
    animate: {
      move: { x: 4 },
      moveSpeed: 1.5,
    },
  },
  {
    type: "model",
    modelPath: "object/wood_platform.usdz",
    position: [-121.5, 70, -214],
    targetSize: [1.5, 0.3, 1.5],
    rotation: [0, 0, 0],
    solid: true,
    animate: {
      move: { x: 4 },
      moveSpeed: 1.5,
    },
  },
  {
    type: "model",
    modelPath: "object/wood_platform.usdz",
    position: [-119, 72, -214],
    targetSize: [1.5, 0.3, 1.5],
    rotation: [0, 0, 0],
    solid: true,
    animate: {
      move: { x: 2 },
      moveSpeed: 1.5,
    },
  },
  {
    type: "model",
    modelPath: "object/wood_platform.usdz",
    position: [-119, 74, -214],
    targetSize: [1.5, 0.3, 1.5],
    rotation: [0, 0, 0],
    solid: true,
    animate: {
      move: { x: 2 },
      moveSpeed: 1.5,
    },
  },
  {
    type: "model",
    modelPath: "object/wood_platform.usdz",
    position: [-119, 76, -214],
    targetSize: [1.5, 0.3, 1.5],
    rotation: [0, 0, 0],
    solid: true,
    animate: {
      move: { x: 2 },
      moveSpeed: 1.5,
    },
  },
  {
    type: "model",
    modelPath: "object/wood_platform.usdz",
    position: [-119, 78, -214],
    targetSize: [1.5, 0.3, 1.5],
    rotation: [0, 0, 0],
    solid: true,
    animate: {
      move: { x: 2 },
      moveSpeed: 1.5,
    },
  },
  {
    type: "model",
    modelPath: "object/wood_platform.usdz",
    position: [-119, 80, -214],
    targetSize: [1.5, 0.3, 1.5],
    rotation: [0, 0, 0],
    solid: true,
    animate: {
      move: { x: 2 },
      moveSpeed: 1.5,
    },
  },
  {
    type: "model",
    modelPath: "object/wood_platform.usdz",
    position: [-119, 82, -214],
    targetSize: [1.5, 0.3, 1.5],
    rotation: [0, 0, 0],
    solid: true,
    animate: {
      move: { x: 2 },
      moveSpeed: 1.5,
    },
  },
];

