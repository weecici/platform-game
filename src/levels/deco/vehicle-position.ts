import { LevelConfig } from "../level-manager";

export const vehicles: LevelConfig["decorations"] = [
  {
    type: "model",
    modelPath: "vehicle/truck.usdz",
    position: [0, 0, 0],
    scale: [0.01, 0.01, 0.01],
    animate: {
      orbitRadius: 30,
      orbitSpeed: 0.2,
      orbitRotationOffset: -Math.PI / 2,
    },
  },
  {
    type: "model",
    modelPath: "vehicle/sbd_3.usdz",
    position: [10, 45, -60],
    scale: [0.025, 0.025, 0.025],
    animate: {
      orbitRadius: 60,
      orbitSpeed: 0.2,
      bobSpeed: 0.3,
      bobHeight: 1.5,
      orbitRotationOffset: -Math.PI / 2,
    },
  },
  {
    type: "model",
    modelPath: "vehicle/blue_plane.usdz",
    position: [10, 55, -60],
    scale: [0.025, 0.025, 0.025],
    animate: {
      orbitRadius: 60,
      orbitSpeed: 0.2,
      bobSpeed: 0.25,
      bobHeight: 2.0,
      orbitRotationOffset: 0,
    },
  },
  {
    type: "model",
    modelPath: "vehicle/fly_plane.usdz",
    position: [10, 35, -60],
    scale: [0.025, 0.025, 0.025],
    animate: {
      orbitRadius: 60,
      orbitSpeed: 0.2,
      bobSpeed: 0.35,
      bobHeight: 1.2,
      orbitRotationOffset: 0,
    },
  },
];
