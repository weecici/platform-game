import { LevelConfig } from "../level-manager";

export const importantObjects: LevelConfig["decorations"] = [
  {
    type: "model",
    modelPath: "important-obj/ufo.usdz",
    position: [-13, 47, 209],
    targetSizeY: 10,
    rotation: [0, 0, 0],
    solid: true,
    doubleSided: true,
  },
  {
    type: "model",
    modelPath: "important-obj/jeans.usdz",
    position: [75, 299, -92.5],
    targetSizeY: 2,
    rotation: [0, 0, 0],
    solid: true,
    collectible: "jeans",
  },
  {
    type: "model",
    modelPath: "important-obj/waifu_pillow.usdz",
    position: [-110, 82, -126],
    targetSizeY: 3,
    rotation: [0, 0, 0],
    childIndex: 2,
    solid: true,
    animate: {
      move: { y: 0.25 },
      moveSpeed: 2,
    },
    collectible: "waifu_pillow",
  },
  {
    type: "model",
    modelPath: "important-obj/radio.usdz",
    position: [-110, 84, -233],
    targetSizeY: 2,
    rotation: [0, 0, 0],
    solid: true,
    animate: {
      move: { y: 0.25 },
      moveSpeed: 2,
    },
    collectible: "radio",
  },
  {
    type: "model",
    modelPath: "important-obj/books.usdz",
    position: [121, 87, -265],
    targetSizeY: 1.5,
    rotation: [0, 0, 0],
    solid: true,
    animate: {
      move: { y: 0.25 },
      moveSpeed: 2,
    },
    collectible: "books",
  },
];
