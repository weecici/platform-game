import type { LevelConfig } from "./level-manager";
import { platforms } from "./parkour/platform_position";
import { collectibles } from "./parkour/collectible_position";
import { houses } from "./deco/house_position";
import { trees } from "./deco/tree_position";
import { planes } from "./deco/plane_position";
import { clouds } from "./deco/cloud_position";

/**
 * Parkour level definitions
 * Each level is a collection of platforms forming a parkour course
 */

export const LEVEL_PARKOUR_CITY: LevelConfig = {
  name: "Urban Parkour",
  spawnPosition: [0, -4, 0],
  skyColor: 0x87ceeb,
  fogColor: 0xc8ddf0,
  fogNear: 40,
  fogFar: 180,
  platforms: platforms as LevelConfig["platforms"],
  decorations: [
    // ===MODEL DECORATIONS ===
    // Low poly mountain — left border, stretched along map length
    {
      type: "model",
      modelPath: "/assets/models/low_poly_mountain.usdz",
      position: [-75, -4.5, -60],
      scale: [0.06, 0.5, 0.5],
      rotation: [0, Math.PI, 0],
    },
    // Low poly mountain — right border, stretched along map length
    {
      type: "model",
      modelPath: "/assets/models/low_poly_mountain.usdz",
      position: [95, -4.5, -60],
      scale: [0.06, 0.5, 0.5],
      rotation: [0, Math.PI, 0],
    },
    // ...clouds,
    ...planes,
    ...houses,
    ...trees,
    ...collectibles,
  ],
};
