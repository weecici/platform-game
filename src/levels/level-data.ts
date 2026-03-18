import type { LevelConfig } from './level-manager';

/**
 * Parkour level definitions
 * Each level is a collection of platforms forming a parkour course
 */

export const LEVEL_PARKOUR_CITY: LevelConfig = {
  name: 'Urban Parkour',
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
      texture: 'stone',
      textureRepeat: [6, 6],
    },
    // Railing walls for spawn
    {
      position: [-6, 1.5, 0],
      size: [0.3, 2, 12],
      color: 0x445566,
    },
    {
      position: [6, 1.5, 0],
      size: [0.3, 2, 12],
      color: 0x445566,
    },

    // === FIRST JUMP SEQUENCE - Stepping stones ===
    {
      position: [0, 0, -9],
      size: [3, 1, 3],
      color: 0x667788,
      texture: 'stone',
    },
    {
      position: [3, 0.5, -14],
      size: [2.5, 1, 2.5],
      color: 0x778899,
      texture: 'stone',
    },
    {
      position: [-1, 1, -19],
      size: [2.5, 1, 2.5],
      color: 0x889900,
      texture: 'stone',
    },
    {
      position: [3, 1.5, -24],
      size: [2, 1, 2],
      color: 0x778899,
      texture: 'stone',
    },

    // === MOVING PLATFORM SECTION ===
    {
      position: [0, 2, -30],
      size: [3, 0.5, 3],
      color: 0xcc8844,
      texture: 'metal',
      type: 'moving',
      moveAxis: 'x',
      moveRange: 4,
      moveSpeed: 1.2,
    },
    // Rest platform
    {
      position: [0, 2, -37],
      size: [4, 1, 4],
      color: 0x667788,
      texture: 'stone',
    },

    // === ASCENDING STAIRCASE ===
    {
      position: [4, 2.8, -42],
      size: [3, 0.6, 2.5],
      color: 0x888899,
      texture: 'brick',
    },
    {
      position: [4, 3.6, -46],
      size: [3, 0.6, 2.5],
      color: 0x888899,
      texture: 'brick',
    },
    {
      position: [4, 4.4, -50],
      size: [3, 0.6, 2.5],
      color: 0x888899,
      texture: 'brick',
    },
    {
      position: [0, 5.2, -54],
      size: [3, 0.6, 2.5],
      color: 0x888899,
      texture: 'brick',
    },

    // === HIGH PLATFORM WITH NARROW BRIDGES ===
    {
      position: [0, 6, -60],
      size: [6, 1, 6],
      color: 0x556677,
      texture: 'stone',
      textureRepeat: [3, 3],
    },
    // Narrow bridge
    {
      position: [0, 6, -68],
      size: [1.5, 0.5, 10],
      color: 0x995533,
      texture: 'wood',
    },
    // Platform after bridge
    {
      position: [0, 6, -76],
      size: [5, 1, 5],
      color: 0x556677,
      texture: 'stone',
    },

    // === VERTICAL MOVING PLATFORMS ===
    {
      position: [5, 6, -82],
      size: [2.5, 0.5, 2.5],
      color: 0xcc8844,
      texture: 'metal',
      type: 'moving',
      moveAxis: 'y',
      moveRange: 3,
      moveSpeed: 0.8,
    },
    {
      position: [10, 9, -82],
      size: [2.5, 0.5, 2.5],
      color: 0xcc8844,
      texture: 'metal',
      type: 'moving',
      moveAxis: 'y',
      moveRange: 2,
      moveSpeed: 1.0,
    },

    // === ROTATING PLATFORM SECTION ===
    {
      position: [15, 10, -82],
      size: [5, 1, 5],
      color: 0x556677,
      texture: 'stone',
    },
    {
      position: [15, 10, -92],
      size: [6, 0.5, 6],
      color: 0x8888cc,
      type: 'rotating',
      rotateAxis: 'y',
      rotateSpeed: 0.5,
    },
    {
      position: [15, 10, -102],
      size: [5, 1, 5],
      color: 0x556677,
      texture: 'stone',
    },

    // === ZIGZAG PLATFORMS ===
    {
      position: [10, 10.5, -108],
      size: [2, 0.6, 2],
      color: 0x77aa88,
      texture: 'stone',
    },
    {
      position: [18, 11, -112],
      size: [2, 0.6, 2],
      color: 0x77aa88,
      texture: 'stone',
    },
    {
      position: [12, 11.5, -116],
      size: [2, 0.6, 2],
      color: 0x77aa88,
      texture: 'stone',
    },
    {
      position: [18, 12, -120],
      size: [2, 0.6, 2],
      color: 0x77aa88,
      texture: 'stone',
    },

    // === FINAL APPROACH ===
    // Moving bridge
    {
      position: [15, 12.5, -128],
      size: [3, 0.5, 4],
      color: 0xcc8844,
      texture: 'metal',
      type: 'moving',
      moveAxis: 'x',
      moveRange: 5,
      moveSpeed: 0.7,
    },

    // === FINISH PLATFORM ===
    {
      position: [15, 13, -136],
      size: [10, 1.5, 10],
      color: 0xddaa44,
      texture: 'metal',
      textureRepeat: [5, 5],
    },

    // === GROUND PLANE (death plane visual) ===
    {
      position: [10, -5, -60],
      size: [200, 0.5, 300],
      color: 0x1a1a2e,
      solid: false,
    },
  ],

  decorations: [
    // Floating collectibles / visual markers along the path
    {
      type: 'torusknot',
      position: [0, 3, -9],
      scale: [0.5, 0.5, 0.5],
      color: 0xffdd00,
      emissive: 0xffaa00,
      animate: { rotateY: 2, bobSpeed: 2, bobHeight: 0.3 },
    },
    {
      type: 'torus',
      position: [3, 3.5, -14],
      scale: [0.4, 0.4, 0.4],
      color: 0xffdd00,
      emissive: 0xffaa00,
      animate: { rotateY: 2, bobSpeed: 2.5, bobHeight: 0.3 },
    },
    {
      type: 'sphere',
      position: [-1, 4, -19],
      scale: [0.5, 0.5, 0.5],
      color: 0xff4444,
      emissive: 0xff2222,
      animate: { rotateY: 1, bobSpeed: 1.5, bobHeight: 0.4 },
    },
    {
      type: 'torusknot',
      position: [0, 5, -30],
      scale: [0.5, 0.5, 0.5],
      color: 0x44ddff,
      emissive: 0x22aadd,
      animate: { rotateY: 3, bobSpeed: 2, bobHeight: 0.4 },
    },
    {
      type: 'sphere',
      position: [0, 9, -68],
      scale: [0.4, 0.4, 0.4],
      color: 0xff44ff,
      emissive: 0xdd22dd,
      animate: { rotateY: 1.5, bobSpeed: 2, bobHeight: 0.5 },
    },
    // Victory decoration on final platform
    {
      type: 'torusknot',
      position: [15, 16, -136],
      scale: [1.2, 1.2, 1.2],
      color: 0xffdd00,
      emissive: 0xffaa00,
      animate: { rotateY: 1, bobSpeed: 1, bobHeight: 0.5 },
    },
    {
      type: 'torus',
      position: [15, 17.5, -136],
      scale: [0.8, 0.8, 0.8],
      color: 0x44ffaa,
      emissive: 0x22dd88,
      animate: { rotateY: -1.5, bobSpeed: 1.5, bobHeight: 0.3 },
    },
    // Pillars along the narrow bridge
    {
      type: 'cylinder',
      position: [-1.5, 8, -64],
      scale: [0.3, 3, 0.3],
      color: 0x888899,
    },
    {
      type: 'cylinder',
      position: [1.5, 8, -64],
      scale: [0.3, 3, 0.3],
      color: 0x888899,
    },
    {
      type: 'cylinder',
      position: [-1.5, 8, -72],
      scale: [0.3, 3, 0.3],
      color: 0x888899,
    },
    {
      type: 'cylinder',
      position: [1.5, 8, -72],
      scale: [0.3, 3, 0.3],
      color: 0x888899,
    },
    // Cones as warning markers near edges
    {
      type: 'cone',
      position: [5.5, 1.2, -5.5],
      scale: [0.3, 0.6, 0.3],
      color: 0xff6600,
      emissive: 0xff3300,
    },
    {
      type: 'cone',
      position: [5.5, 1.2, 5.5],
      scale: [0.3, 0.6, 0.3],
      color: 0xff6600,
      emissive: 0xff3300,
    },
  ],
};
