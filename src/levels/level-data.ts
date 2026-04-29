import type { LevelConfig } from "./level-manager";

/**
 * Parkour level definitions
 * Each level is a collection of platforms forming a parkour course
 */

export const LEVEL_PARKOUR_CITY: LevelConfig = {
  name: "Urban Parkour",
  spawnPosition: [0, 3, 0],
  skyColor: 0x87ceeb,
  fogColor: 0xc8ddf0,
  fogNear: 40,
  fogFar: 180,
  platforms: [
    // === STARTING AREA ===
    // Large spawn platform
    {
      position: [0, 0, 0],
      size: [12, 1, 12],
      color: 0x556677,
      texture: "concrete-moss",
      textureRepeat: [6, 6],
    },
    // Railing walls for spawn
    {
      position: [-6.2, 1.7, 0],
      size: [0.55, 2.4, 12.6],
      color: 0x3d5269,
      texture: "metal-plate",
      textureRepeat: [8, 2],
    },
    {
      position: [6.2, 1.7, 0],
      size: [0.55, 2.4, 12.6],
      color: 0x3d5269,
      texture: "metal-plate",
      textureRepeat: [8, 2],
    },
    {
      position: [-6.2, 2.95, 0],
      size: [0.62, 0.3, 12.6],
      color: 0x71839d,
      texture: "stone",
      textureRepeat: [6, 1],
    },
    {
      position: [6.2, 2.95, 0],
      size: [0.62, 0.3, 12.6],
      color: 0x71839d,
      texture: "stone",
      textureRepeat: [6, 1],
    },
    {
      position: [-6.2, 2.1, -5.9],
      size: [0.95, 3.2, 0.9],
      color: 0x536577,
      texture: "brick",
      textureRepeat: [1, 2],
    },
    {
      position: [-6.2, 2.1, 5.9],
      size: [0.95, 3.2, 0.9],
      color: 0x536577,
      texture: "brick",
      textureRepeat: [1, 2],
    },
    {
      position: [6.2, 2.1, -5.9],
      size: [0.95, 3.2, 0.9],
      color: 0x536577,
      texture: "brick",
      textureRepeat: [1, 2],
    },
    {
      position: [6.2, 2.1, 5.9],
      size: [0.95, 3.2, 0.9],
      color: 0x536577,
      texture: "brick",
      textureRepeat: [1, 2],
    },

    // === FIRST JUMP SEQUENCE - Stepping stones ===
    // NOTE: Gaps at z≈-14 and z≈-24 are intentionally missing – players must
    //       place a block (key 1-5, then left-click) to cross these spans.
    {
      position: [0, 0, -9],
      size: [3, 1, 3],
      color: 0x667788,
      texture: "grass-rock",
    },
    // GAP here (~5 units) – requires a placed block to cross
    {
      position: [-1, 1, -19],
      size: [2.5, 1, 2.5],
      color: 0x889900,
      texture: "grass-rock",
    },
    // GAP here (~5 units) – requires a placed block to cross
    {
      position: [3, 1.5, -27],
      size: [2, 1, 2],
      color: 0x778899,
      texture: "grass-rock",
    },

    // === MOVING PLATFORM SECTION ===
    {
      position: [0, 2, -30],
      size: [3, 0.5, 3],
      color: 0xcc8844,
      texture: "metal",
      type: "moving",
      moveAxis: "x",
      moveRange: 4,
      moveSpeed: 1.2,
    },
    // Rest platform
    {
      position: [0, 2, -37],
      size: [4, 1, 4],
      color: 0x667788,
      texture: "concrete-moss",
    },

    // === ASCENDING STAIRCASE ===
    {
      position: [4, 2.8, -42],
      size: [3, 0.6, 2.5],
      color: 0x888899,
      texture: "brick",
    },
    {
      position: [4, 3.6, -46],
      size: [3, 0.6, 2.5],
      color: 0x888899,
      texture: "brick",
    },
    {
      position: [4, 4.4, -50],
      size: [3, 0.6, 2.5],
      color: 0x888899,
      texture: "brick",
    },
    {
      position: [0, 5.2, -54],
      size: [3, 0.6, 2.5],
      color: 0x888899,
      texture: "brick",
    },

    // === HIGH PLATFORM WITH NARROW BRIDGES ===
    {
      position: [0, 6, -60],
      size: [6, 1, 6],
      color: 0x556677,
      texture: "concrete-moss",
      textureRepeat: [3, 3],
    },
    // Narrow bridge
    {
      position: [0, 6, -68],
      size: [1.5, 0.5, 10],
      color: 0x995533,
      texture: "wood",
    },
    // Platform after bridge
    {
      position: [0, 6, -76],
      size: [5, 1, 5],
      color: 0x556677,
      texture: "stone",
    },

    // === VERTICAL MOVING PLATFORMS ===
    {
      position: [5, 6, -82],
      size: [2.5, 0.5, 2.5],
      color: 0xcc8844,
      texture: "metal",
      type: "moving",
      moveAxis: "y",
      moveRange: 3,
      moveSpeed: 0.8,
    },
    {
      position: [10, 9, -82],
      size: [2.5, 0.5, 2.5],
      color: 0xcc8844,
      texture: "metal",
      type: "moving",
      moveAxis: "y",
      moveRange: 2,
      moveSpeed: 1.0,
    },

    // === ROTATING PLATFORM SECTION ===
    {
      position: [15, 10, -82],
      size: [5, 1, 5],
      color: 0x556677,
      texture: "stone",
    },
    {
      position: [15, 10, -92],
      size: [6, 0.5, 6],
      color: 0x8888cc,
      texture: "metal-plate",
      type: "rotating",
      rotateAxis: "y",
      rotateSpeed: 0.5,
    },
    {
      position: [15, 10, -102],
      size: [5, 1, 5],
      color: 0x556677,
      texture: "stone",
    },

    // === ZIGZAG PLATFORMS ===
    {
      position: [10, 10.5, -108],
      size: [2, 0.6, 2],
      color: 0x77aa88,
      texture: "grass-rock",
    },
    {
      position: [18, 11, -112],
      size: [2, 0.6, 2],
      color: 0x77aa88,
      texture: "grass-rock",
    },
    {
      position: [12, 11.5, -116],
      size: [2, 0.6, 2],
      color: 0x77aa88,
      texture: "grass-rock",
    },
    {
      position: [18, 12, -120],
      size: [2, 0.6, 2],
      color: 0x77aa88,
      texture: "grass-rock",
    },

    // === FINAL APPROACH ===
    // Moving bridge
    {
      position: [15, 12.5, -128],
      size: [3, 0.5, 4],
      color: 0xcc8844,
      texture: "metal",
      type: "moving",
      moveAxis: "x",
      moveRange: 5,
      moveSpeed: 0.7,
    },

    // === FINISH PLATFORM ===
    {
      position: [15, 13, -136],
      size: [10, 1.5, 10],
      color: 0xddaa44,
      texture: "metal-plate",
      textureRepeat: [5, 5],
    },

    // === GROUND PLANE (death plane visual) ===
    {
      position: [10, -5, -60],
      size: [200, 0.5, 300],
      color: 0x1a1a2e,
      texture: "asphalt",
      textureRepeat: [24, 36],
      solid: true,
    },
  ],

  decorations: [
    // === MODEL DECORATIONS ===
    // Spawn focal props
    {
      type: "model",
      modelPath: "/assets/models/uia_cat.usdz",
      position: [4.5, 0.5, 2.9],
      scale: [0.03, 0.03, 0.03],
      animate: { rotateY: -0.4, bobSpeed: 1.3, bobHeight: 0.05 },
    },

    // Trees around spawn area
    {
      type: "model",
      modelPath: "/assets/models/tree.usdz",
      position: [-4.2, 0.5, -3.9],
      scale: [0.0108, 0.0108, 0.0108],
      rotation: [0, 0.2, 0],
    },
    {
      type: "model",
      modelPath: "/assets/models/grass.usdz",
      position: [-4.2, 0.5, -3.9],
      scale: [0.005, 0.005, 0.005],
      rotation: [0, 0.2, 0],
    },
    {
      type: "model",
      modelPath: "/assets/models/pubg-house.usdz",
      position: [-20.2, -5, -30.9],
      scale: [0.03, 0.03, 0.03],
      rotation: [0, 0.2, 0],
    },
    {
      type: "model",
      modelPath: "/assets/models/tree.usdz",
      position: [4.2, 0.5, -3.8],
      scale: [0.0106, 0.0106, 0.0106],
      rotation: [0, -0.35, 0],
    },
    {
      type: "model",
      modelPath: "/assets/models/tree.usdz",
      position: [-4.7, 0.5, 0.8],
      scale: [0.0109, 0.0109, 0.0109],
      rotation: [0, 1.2, 0],
    },
    {
      type: "model",
      modelPath: "/assets/models/tree.usdz",
      position: [4.0, 0.5, 3.5],
      scale: [0.0109, 0.0109, 0.0109],
      rotation: [0, -0.9, 0],
    },
    {
      type: "model",
      modelPath: "/assets/models/tree.usdz",
      position: [0.8, 0.5, 4.1],
      scale: [0.0105, 0.0105, 0.0105],
      rotation: [0, 0.5, 0],
    },

    {
      type: "model",
      modelPath: "/assets/models/uia_cat.usdz",
      position: [20, -4.75, -38],
      scale: [0.115, 0.115, 0.115],
      rotation: [0, -1.15, 0],
      animate: { rotateY: 0.32 },
    },
    {
      type: "model",
      modelPath: "/assets/models/uia_cat.usdz",
      position: [23, -4.75, -92],
      scale: [0.12, 0.12, 0.12],
      rotation: [0, -1.2, 0],
      animate: { rotateY: -0.28 },
    },

    // Sky clouds
    {
      type: "model",
      modelPath: "/assets/models/clouds.usdz",
      position: [-28, 38, 10],
      scale: [0.018, 0.018, 0.018],
      animate: { rotateY: 0.03, bobSpeed: 0.12, bobHeight: 0.35 },
    },
    {
      type: "model",
      modelPath: "/assets/models/clouds.usdz",
      position: [-10, 42, -6],
      scale: [0.02, 0.02, 0.02],
      animate: { rotateY: -0.025, bobSpeed: 0.11, bobHeight: 0.4 },
    },
    {
      type: "model",
      modelPath: "/assets/models/clouds.usdz",
      position: [14, 36, 8],
      scale: [0.017, 0.017, 0.017],
      animate: { rotateY: 0.02, bobSpeed: 0.1, bobHeight: 0.3 },
    },
    {
      type: "model",
      modelPath: "/assets/models/clouds.usdz",
      position: [30, 45, -20],
      scale: [0.024, 0.024, 0.024],
      animate: { rotateY: 0.018, bobSpeed: 0.09, bobHeight: 0.45 },
    },
    {
      type: "model",
      modelPath: "/assets/models/clouds.usdz",
      position: [-31, 49, -34],
      scale: [0.022, 0.022, 0.022],
      animate: { rotateY: -0.02, bobSpeed: 0.1, bobHeight: 0.42 },
    },
    {
      type: "model",
      modelPath: "/assets/models/clouds.usdz",
      position: [6, 40, -48],
      scale: [0.019, 0.019, 0.019],
      animate: { rotateY: 0.03, bobSpeed: 0.11, bobHeight: 0.38 },
    },
    {
      type: "model",
      modelPath: "/assets/models/clouds.usdz",
      position: [27, 34, -64],
      scale: [0.016, 0.016, 0.016],
      animate: { rotateY: -0.022, bobSpeed: 0.09, bobHeight: 0.28 },
    },
    {
      type: "model",
      modelPath: "/assets/models/clouds.usdz",
      position: [-24, 46, -82],
      scale: [0.021, 0.021, 0.021],
      animate: { rotateY: 0.02, bobSpeed: 0.1, bobHeight: 0.35 },
    },
    {
      type: "model",
      modelPath: "/assets/models/clouds.usdz",
      position: [10, 38, -98],
      scale: [0.018, 0.018, 0.018],
      animate: { rotateY: -0.018, bobSpeed: 0.12, bobHeight: 0.34 },
    },
    {
      type: "model",
      modelPath: "/assets/models/clouds.usdz",
      position: [31, 44, -114],
      scale: [0.023, 0.023, 0.023],
      animate: { rotateY: 0.015, bobSpeed: 0.09, bobHeight: 0.42 },
    },
    {
      type: "model",
      modelPath: "/assets/models/clouds.usdz",
      position: [-29, 47, -132],
      scale: [0.022, 0.022, 0.022],
      animate: { rotateY: -0.017, bobSpeed: 0.1, bobHeight: 0.4 },
    },
    {
      type: "model",
      modelPath: "/assets/models/clouds.usdz",
      position: [3, 41, -148],
      scale: [0.019, 0.019, 0.019],
      animate: { rotateY: 0.02, bobSpeed: 0.11, bobHeight: 0.36 },
    },
    {
      type: "model",
      modelPath: "/assets/models/clouds.usdz",
      position: [22, 36, -166],
      scale: [0.017, 0.017, 0.017],
      animate: { rotateY: -0.02, bobSpeed: 0.1, bobHeight: 0.3 },
    },
    {
      type: "model",
      modelPath: "/assets/models/clouds.usdz",
      position: [-12, 43, -176],
      scale: [0.02, 0.02, 0.02],
      animate: { rotateY: 0.018, bobSpeed: 0.09, bobHeight: 0.34 },
    },

    // === COLLECTIBLE BLOCK PICKUPS ===
    // Spread across the course so the player has to collect them to bridge gaps.
    // Each collectible grants one unit of the named block type.

    // --- Starting area ---
    {
      type: "torusknot",
      position: [-1.5, 2, -2.7],
      scale: [0.35, 0.35, 0.35],
      color: 0xffdd00,
      emissive: 0xffaa00,
      animate: { rotateY: 2, bobSpeed: 2, bobHeight: 0.25 },
      collectible: "box",
    },
    {
      type: "torusknot",
      position: [0, 2.1, -3.3],
      scale: [0.35, 0.35, 0.35],
      color: 0x44ddff,
      emissive: 0x22aadd,
      animate: { rotateY: 2, bobSpeed: 2.5, bobHeight: 0.25 },
      collectible: "cylinder",
    },
    {
      type: "torusknot",
      position: [1.5, 2, -2.7],
      scale: [0.35, 0.35, 0.35],
      color: 0xff44ff,
      emissive: 0xdd22dd,
      animate: { rotateY: 1.5, bobSpeed: 2, bobHeight: 0.25 },
      collectible: "box",
    },

    // --- First jump sequence ---
    {
      type: "sphere",
      position: [0, 3, -9],
      scale: [0.4, 0.4, 0.4],
      color: 0xffdd00,
      emissive: 0xffaa00,
      animate: { rotateY: 2, bobSpeed: 2, bobHeight: 0.3 },
      collectible: "box",
    },
    {
      type: "torus",
      position: [-1, 4, -19],
      scale: [0.35, 0.35, 0.35],
      color: 0x44ddff,
      emissive: 0x22aadd,
      animate: { rotateY: 2, bobSpeed: 2.5, bobHeight: 0.3 },
      collectible: "sphere",
    },
    {
      type: "sphere",
      position: [3, 4.5, -27],
      scale: [0.4, 0.4, 0.4],
      color: 0xff4444,
      emissive: 0xff2222,
      animate: { rotateY: 1, bobSpeed: 1.5, bobHeight: 0.4 },
      collectible: "cone",
    },

    // --- Moving platform section ---
    {
      type: "torusknot",
      position: [0, 5, -30],
      scale: [0.35, 0.35, 0.35],
      color: 0x44ddff,
      emissive: 0x22aadd,
      animate: { rotateY: 3, bobSpeed: 2, bobHeight: 0.4 },
      collectible: "box",
    },
    {
      type: "torus",
      position: [0, 4.5, -37],
      scale: [0.35, 0.35, 0.35],
      color: 0xffdd00,
      emissive: 0xffaa00,
      animate: { rotateY: 2, bobSpeed: 2, bobHeight: 0.3 },
      collectible: "wheel",
    },

    // --- Ascending staircase ---
    {
      type: "sphere",
      position: [4, 5.5, -42],
      scale: [0.35, 0.35, 0.35],
      color: 0xff44ff,
      emissive: 0xdd22dd,
      animate: { rotateY: 2, bobSpeed: 2, bobHeight: 0.25 },
      collectible: "cylinder",
    },
    {
      type: "torusknot",
      position: [4, 7, -50],
      scale: [0.35, 0.35, 0.35],
      color: 0xffdd00,
      emissive: 0xffaa00,
      animate: { rotateY: 1.5, bobSpeed: 2, bobHeight: 0.3 },
      collectible: "box",
    },
    {
      type: "torus",
      position: [0, 8, -54],
      scale: [0.35, 0.35, 0.35],
      color: 0x44ffaa,
      emissive: 0x22dd88,
      animate: { rotateY: 2, bobSpeed: 2, bobHeight: 0.3 },
      collectible: "teapot",
    },

    // --- High platform & narrow bridge ---
    {
      type: "sphere",
      position: [0, 9, -60],
      scale: [0.4, 0.4, 0.4],
      color: 0xff4444,
      emissive: 0xff2222,
      animate: { rotateY: 1, bobSpeed: 1.5, bobHeight: 0.4 },
      collectible: "box",
    },
    {
      type: "torusknot",
      position: [0, 9, -68],
      scale: [0.35, 0.35, 0.35],
      color: 0xff44ff,
      emissive: 0xdd22dd,
      animate: { rotateY: 1.5, bobSpeed: 2, bobHeight: 0.5 },
      collectible: "sphere",
    },
    {
      type: "torus",
      position: [0, 9, -76],
      scale: [0.35, 0.35, 0.35],
      color: 0x44ddff,
      emissive: 0x22aadd,
      animate: { rotateY: 2, bobSpeed: 2, bobHeight: 0.3 },
      collectible: "cone",
    },

    // --- Vertical moving platforms ---
    {
      type: "sphere",
      position: [7, 10, -82],
      scale: [0.35, 0.35, 0.35],
      color: 0xffdd00,
      emissive: 0xffaa00,
      animate: { rotateY: 2, bobSpeed: 2, bobHeight: 0.3 },
      collectible: "cylinder",
    },

    // --- Rotating platform section ---
    {
      type: "torusknot",
      position: [15, 13, -92],
      scale: [0.35, 0.35, 0.35],
      color: 0xff44ff,
      emissive: 0xdd22dd,
      animate: { rotateY: 1.5, bobSpeed: 2, bobHeight: 0.3 },
      collectible: "wheel",
    },
    {
      type: "torus",
      position: [15, 13, -102],
      scale: [0.35, 0.35, 0.35],
      color: 0x44ffaa,
      emissive: 0x22dd88,
      animate: { rotateY: 2, bobSpeed: 2, bobHeight: 0.3 },
      collectible: "box",
    },

    // --- Zigzag platforms ---
    {
      type: "sphere",
      position: [10, 13.5, -108],
      scale: [0.35, 0.35, 0.35],
      color: 0xffdd00,
      emissive: 0xffaa00,
      animate: { rotateY: 2, bobSpeed: 2, bobHeight: 0.3 },
      collectible: "teapot",
    },
    {
      type: "torusknot",
      position: [18, 14, -120],
      scale: [0.35, 0.35, 0.35],
      color: 0x44ddff,
      emissive: 0x22aadd,
      animate: { rotateY: 2, bobSpeed: 2, bobHeight: 0.3 },
      collectible: "box",
    },

    // --- Final approach ---
    {
      type: "torus",
      position: [15, 16, -128],
      scale: [0.4, 0.4, 0.4],
      color: 0xff4444,
      emissive: 0xff2222,
      animate: { rotateY: 2, bobSpeed: 2, bobHeight: 0.3 },
      collectible: "sphere",
    },

    // === VICTORY DECORATION (not collectible) ===
    {
      type: "torusknot",
      position: [15, 16, -136],
      scale: [1.2, 1.2, 1.2],
      color: 0xffdd00,
      emissive: 0xffaa00,
      animate: { rotateY: 1, bobSpeed: 1, bobHeight: 0.5 },
    },
    {
      type: "torus",
      position: [15, 17.5, -136],
      scale: [0.8, 0.8, 0.8],
      color: 0x44ffaa,
      emissive: 0x22dd88,
      animate: { rotateY: -1.5, bobSpeed: 1.5, bobHeight: 0.3 },
    },

    // === STATIC DECORATIONS (not collectible) ===
    // Pillars along the narrow bridge
    {
      type: "cylinder",
      position: [-1.5, 8, -64],
      scale: [0.3, 3, 0.3],
      color: 0x888899,
    },
    {
      type: "cylinder",
      position: [1.5, 8, -64],
      scale: [0.3, 3, 0.3],
      color: 0x888899,
    },
    {
      type: "cylinder",
      position: [-1.5, 8, -72],
      scale: [0.3, 3, 0.3],
      color: 0x888899,
    },
    {
      type: "cylinder",
      position: [1.5, 8, -72],
      scale: [0.3, 3, 0.3],
      color: 0x888899,
    },
    // Cones as warning markers near edges
    {
      type: "cone",
      position: [5.5, 1.2, -5.5],
      scale: [0.3, 0.6, 0.3],
      color: 0xff6600,
      emissive: 0xff3300,
    },
    {
      type: "cone",
      position: [5.5, 1.2, 5.5],
      scale: [0.3, 0.6, 0.3],
      color: 0xff6600,
      emissive: 0xff3300,
    },
  ],
};
