import type { LevelConfig } from "./level-manager";
import { platforms } from "./parkour/platform-position";
import { collectibles } from "./parkour/collectible-position";
import { houses } from "./deco/house-position";
import { trees } from "./deco/tree-position";
import { vehicles } from "./deco/vehicle-position";
import { scene } from "./deco/scene-position";

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
  decorations: [...scene, ...houses, ...trees, ...vehicles, ...collectibles],
};
