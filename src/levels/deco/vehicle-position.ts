import { LevelConfig } from "../level-manager";

// heavy_vehicles.usdz
// Ambulance: 1
// Police: 7
// Van: 2, 4, 8
// Truck: 13, 15, 18

// cars.usdz
// 4-seat car: 0, 1
// 7-seat car: 2, 3, 4
// Pickup truck: 5

export const vehicles: LevelConfig["decorations"] = [
  // {
  //   type: "model",
  //   modelPath: "vehicle/heavy_vehicles.usdz",
  //   position: [0, 0.3, -15],
  //   targetSizeY: 4,
  //   rotation: [0, 0, 0],
  //   childIndex: 0,
  //   solid: true,
  //   doubleSided: true,
  // },
  {
    type: "model",
    modelPath: "vehicle/cars.usdz",
    position: [0, 0.3, -15],
    targetSizeY: 2.5,
    rotation: [0, 0, 0],
    childIndex: 2,
    solid: true,
    doubleSided: true,
  },
];
