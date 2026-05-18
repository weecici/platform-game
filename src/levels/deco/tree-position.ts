import { LevelConfig } from "../level-manager";

function createTree(
  childIndex: number,
  position: [number, number, number],
  targetSizeY: number,
  rotation: [number, number, number],
): LevelConfig["decorations"] {
  let modifiedPosition = [...position] as [number, number, number];
  if (childIndex == 6 || childIndex == 9) {
    modifiedPosition[2] += targetSizeY * 0.12 * Math.cos(rotation[1]);
    if (childIndex == 9) {
      modifiedPosition[0] -= targetSizeY * 0.03 * Math.cos(rotation[1]);
    }
  }
  return [
    {
      type: "model",
      modelPath: "scene/trees.usdz",
      position: modifiedPosition,
      targetSizeY: targetSizeY,
      rotation: rotation,
      childIndex: childIndex,
      solid: true,
    },
    {
      type: "model",
      modelPath: "scene/tree_grate.usdz",
      position: [position[0], 0, position[2]],
      targetSizeY: 0.2,
      solid: true,
    },
  ];
}

export const trees: LevelConfig["decorations"] = [
  // Chosen indices: 4, 5, 6, 7. 9

  // ### Right 1 ###

  // ### Left 1  ###
  ...createTree(4, [-20, 0, -58], 15, [0, 0, 0]),
  ...createTree(4, [-20, 0, -43], 15, [0, 0, 0]),
  ...createTree(4, [-20, 0, -35], 15, [0, 0, 0]),

  ...createTree(5, [-23, 0, -117], 15, [0, 0, 0]),

  ...createTree(7, [-85, -1, -141], 15, [0, Math.PI, 0]),

  ...createTree(4, [-128, 0, -66], 14, [0, 0, 0]),
  ...createTree(5, [-128, 0, -56], 12, [0, 0, 0]),
  ...createTree(5, [-128, 0, -45], 12, [0, 0, 0]),
  ...createTree(4, [-128, 0, -33], 16, [0, 0, 0]),

  // ### Right 2 ###
  ...createTree(6, [86, -1, -182.5], 10, [0, 0, 0]),

  ...createTree(9, [108, -1, -220], 20, [0, 0, 0]),
  ...createTree(5, [108, 0, -244], 17, [0, 0, 0]),

  ...createTree(5, [114, 0, -289], 17, [0, 0, 0]),
  ...createTree(4, [106, 0, -275], 15, [0, 0, 0]),

  // ### Left 2 ###
  ...createTree(6, [-40, -1.0, -258], 15, [0, 0, 0]),
  ...createTree(9, [-52, -1.0, -258], 15, [0, Math.PI, 0]),
  ...createTree(6, [-64, -1.0, -258], 15, [0, 0, 0]),
  ...createTree(9, [-76, -1.0, -258], 15, [0, 0, 0]),
  ...createTree(9, [-88, -1.0, -258], 15, [0, Math.PI, 0]),
  ...createTree(9, [-100, -1.0, -258], 15, [0, 0, 0]),

  ...createTree(4, [-47, 0, -184], 12, [0, 0, 0]),
];
