import type { LevelConfig } from "./level-manager";
import { platforms } from "./parkour/platform-position";
import { collectibles } from "./parkour/collectible-position";
import { objects } from "./parkour/object-position";
import { buildings } from "./deco/building-position";
import { trees } from "./deco/tree-position";
import { vehicles } from "./deco/vehicle-position";
import { scene } from "./deco/scene-position";

/**
 * Parkour level definitions
 * Each level is a collection of platforms forming a parkour course
 */

export const LEVEL_PARKOUR_CITY: LevelConfig = {
  name: "Urban Parkour",
  spawnPosition: [-68, 55, -63],
  skyColor: 0x87ceeb,
  fogColor: 0xc8ddf0,
  fogNear: 100,
  fogFar: 400,
  platforms: [
    // === GROUND PLANE ===
    {
      position: [0, -5, 0],
      size: [1000, 10, 1000],
      color: 0x1a1a2e,
      texture: "grass",
      textureRepeat: [240, 360],
      solid: true,
      noCull: true,
    },
    {
      position: [-75, -5, -90],
      size: [120, 10.2, 120],
      color: 0x1a1a2e,
      texture: "ground-tiles-14",
      textureRepeat: [120, 120],
      solid: true,
      noCull: true,
    },
    {
      position: [75, -5, -90],
      size: [120, 10.2, 120],
      color: 0x1a1a2e,
      texture: "ground-tiles-14",
      textureRepeat: [120, 120],
      solid: true,
      noCull: true,
    },
    {
      position: [-75, -5, -240],
      size: [120, 10.2, 120],
      color: 0x1a1a2e,
      texture: "ground-tiles-14",
      textureRepeat: [120, 120],
      solid: true,
      noCull: true,
    },
    {
      position: [75, -5, -240],
      size: [120, 10.2, 120],
      color: 0x1a1a2e,
      texture: "ground-tiles-14",
      textureRepeat: [120, 120],
      solid: true,
      noCull: true,
    },
    // ...platforms,
  ],
  decorations: [
    ...scene,
    ...buildings,
    ...trees,
    ...vehicles,
    ...objects,
    ...collectibles,
  ],
};
