import type { LevelConfig } from "./level-manager";
import { platforms } from "./parkour/platform-position";
import { collectibles } from "./parkour/collectible-position";
import { houses } from "./deco/house-position";
import { trees } from "./deco/tree-position";
import { vehicles } from "./deco/vehicle-position";
import { clouds } from "./deco/cloud-position";

/**
 * Parkour level definitions
 * Each level is a collection of platforms forming a parkour course
 */

export const LEVEL_PARKOUR_CITY: LevelConfig = {
  name: "Urban Parkour",
  spawnPosition: [0, 5, 0],
  skyColor: 0x87ceeb,
  fogColor: 0xc8ddf0,
  fogNear: 100,
  fogFar: 400,
  platforms: platforms as LevelConfig["platforms"],
  decorations: [
    // ===MODEL DECORATIONS ===
    // Low poly mountain — left border, stretched along map length
    {
      type: "model",
      modelPath: "/assets/models/scene/low_poly_mountain.usdz",
      position: [-200, -4.5, -60],
      scale: [0.35, 0.5, 0.5],
      rotation: [0, Math.PI, 0],
      solid: true,
      noCull: true,
    },
    // {
    //   type: "model",
    //   modelPath: "/assets/models/scene/test.usdz",
    //   position: [-5, 0, -2],
    //   scale: [0.1, 0.1, 0.1],
    //   rotation: [0, 0.3, 0],
    //   // childIndex: 1,
    // },
    // ...clouds,
    ...vehicles,
    ...houses,
    ...trees,
    ...collectibles,
  ],
};
