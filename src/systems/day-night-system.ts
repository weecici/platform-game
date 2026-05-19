import * as THREE from "three";
import type { Engine } from "../core/engine";
import type { LightingSystem, LightingConfig } from "./lighting-system";

export const PHASES = [
  "skybox-1-dawn",
  "skybox-2-early-morning",
  "skybox-3-morning",
  "skybox-4-lunch",
  "skybox-5-afternoon",
  "skybox-6-evening",
  "skybox-7-dusk",
  "skybox-8-night",
];

const BASE_DURATION = 10;
const CROSSFADE_DURATION = 0.2;

// A massive box to render our custom skybox shader
// Use a large size, but within camera far plane
const SKYBOX_SIZE = 2000;

const skyboxVertexShader = `
  varying vec3 vWorldPosition;
  void main() {
    vec4 worldPosition = modelMatrix * vec4( position, 1.0 );
    vWorldPosition = worldPosition.xyz;
    // We want the skybox to be infinitely far away, but practically we just center it on camera.
    // However, if it's parented to the scene, we'll manually snap it to camera position in update()
    gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
  }
`;

const skyboxFragmentShader = `
  uniform samplerCube tCube1;
  uniform samplerCube tCube2;
  uniform float mixRatio;
  uniform float skyboxBrightness;
  varying vec3 vWorldPosition;
  void main() {
    vec3 viewDirection = normalize(vWorldPosition);
    vec4 color1 = textureCube(tCube1, viewDirection);
    vec4 color2 = textureCube(tCube2, viewDirection);
    gl_FragColor = mix(color1, color2, mixRatio);
    
    // Apply adjustable brightness (bypassing global ACESFilmic tone mapping to avoid blowout)
    gl_FragColor.rgb *= skyboxBrightness;

    #include <colorspace_fragment>
  }
`;

export class DayNightSystem {
  private engine: Engine;
  private lighting: LightingSystem;

  private timeElapsed: number = 0;
  private currentPhaseIndex: number = 0;
  public isTimeStopped: boolean = false;

  private skyboxMesh: THREE.Mesh;
  private skyboxMaterial: THREE.ShaderMaterial;

  private cubeLoader = new THREE.CubeTextureLoader();
  private loadedTextures: Map<string, THREE.CubeTexture> = new Map();
  private isPreloadingNext: boolean = false;

  constructor(engine: Engine, lighting: LightingSystem) {
    this.engine = engine;
    this.lighting = lighting;

    // Build custom skybox material
    this.skyboxMaterial = new THREE.ShaderMaterial({
      vertexShader: skyboxVertexShader,
      fragmentShader: skyboxFragmentShader,
      uniforms: {
        tCube1: { value: null },
        tCube2: { value: null },
        mixRatio: { value: 0.0 },
        skyboxBrightness: { value: 1.2 }, // Easily adjustable! (1.0 = original image)
      },
      side: THREE.BackSide,
      depthWrite: false, // Ensure it's rendered in background
    });

    const geometry = new THREE.BoxGeometry(
      SKYBOX_SIZE,
      SKYBOX_SIZE,
      SKYBOX_SIZE,
    );
    this.skyboxMesh = new THREE.Mesh(geometry, this.skyboxMaterial);

    // We render it first or just disable depth writing so it stays in back
    this.skyboxMesh.renderOrder = -1;
    this.engine.scene.add(this.skyboxMesh);

    // Initial load
    this.loadPhase(this.currentPhaseIndex).then((tex) => {
      this.skyboxMaterial.uniforms.tCube1.value = tex;
    });
  }

  private getPhaseName(index: number): string {
    return PHASES[index % PHASES.length];
  }

  private getPhaseDuration(index: number): number {
    // Night phase lasts twice as long
    return index === 7 ? BASE_DURATION * 2 : BASE_DURATION;
  }

  private async loadPhase(index: number): Promise<THREE.CubeTexture> {
    const name = this.getPhaseName(index);
    if (this.loadedTextures.has(name)) {
      return this.loadedTextures.get(name)!;
    }

    const basePath = `/assets/textures/skybox/${name}/`;
    const texturePaths = [
      basePath + "px.png",
      basePath + "nx.png",
      basePath + "py.png",
      basePath + "ny.png",
      basePath + "pz.png",
      basePath + "nz.png",
    ];

    return new Promise((resolve) => {
      this.cubeLoader.load(texturePaths, (texture) => {
        texture.colorSpace = THREE.SRGBColorSpace; // Assuming sRGB output
        this.loadedTextures.set(name, texture);
        resolve(texture);
      });
    });
  }

  update(deltaTime: number, playerPos: THREE.Vector3): void {
    if (!this.isTimeStopped) {
      this.timeElapsed += deltaTime;
    }

    // Snap skybox to camera/player
    this.skyboxMesh.position.copy(playerPos);

    const currentDuration = this.getPhaseDuration(this.currentPhaseIndex);

    if (this.timeElapsed >= currentDuration) {
      this.timeElapsed -= currentDuration;
      this.currentPhaseIndex = (this.currentPhaseIndex + 1) % PHASES.length;

      // Shift textures
      const currentTex = this.loadedTextures.get(
        this.getPhaseName(this.currentPhaseIndex),
      );
      if (currentTex) {
        this.skyboxMaterial.uniforms.tCube1.value = currentTex;
      }
      this.skyboxMaterial.uniforms.mixRatio.value = 0.0;
      this.isPreloadingNext = false;
    }

    // Lazy load next phase halfway through
    if (this.timeElapsed > currentDuration / 2 && !this.isPreloadingNext) {
      this.isPreloadingNext = true;
      this.loadPhase(this.currentPhaseIndex + 1).then((tex) => {
        this.skyboxMaterial.uniforms.tCube2.value = tex;
      });
    }

    // Crossfading
    if (this.timeElapsed > currentDuration - CROSSFADE_DURATION) {
      const crossfadeProgress =
        (this.timeElapsed - (currentDuration - CROSSFADE_DURATION)) /
        CROSSFADE_DURATION;
      this.skyboxMaterial.uniforms.mixRatio.value = Math.min(
        1.0,
        Math.max(0.0, crossfadeProgress),
      );
    } else {
      this.skyboxMaterial.uniforms.mixRatio.value = 0.0;
    }

    this.updateLightingArcs(playerPos);
  }

  private updateLightingArcs(playerPos: THREE.Vector3): void {
    let angle = 0;

    if (this.currentPhaseIndex < 7) {
      // Daytime: 7 phases stretch across the first 180 degrees (Math.PI)
      const totalDayTime = 7 * BASE_DURATION;
      const currentDayTime =
        this.currentPhaseIndex * BASE_DURATION + this.timeElapsed;
      angle = (currentDayTime / totalDayTime) * Math.PI;
    } else {
      // Nighttime: 1 phase stretches across the bottom 180 degrees
      const totalNightTime = this.getPhaseDuration(7);
      angle = Math.PI + (this.timeElapsed / totalNightTime) * Math.PI;
    }

    const x = -Math.cos(angle) * 120;
    const y = Math.max(0, Math.sin(angle) * 70);
    const z = -Math.cos(angle) * 30;

    // Sun or Moon?
    // If y is 0 (or less), it's below horizon. We can flip it to opposite side for the moon!
    let lightX = x;
    let lightY = y;
    let lightZ = z;

    let color = 0xfff4e6;
    let intensity = 1.5;
    let ambientColor = 0xe0e0ff;
    let ambientIntensity = 0.9;

    if (Math.sin(angle) < 0) {
      // Night time (moon)
      lightX = -x;
      lightY = -Math.sin(angle) * 80; // Moon arc
      lightZ = -z;

      color = 0x8899cc; // Blueish moon
      intensity = 0.4;
      ambientColor = 0x111122; // Dark ambient
      ambientIntensity = 0.2;
    } else {
      // Day time, color shift towards orange at dawn/dusk
      const heightFactor = Math.sin(angle); // 0 at dawn/dusk, 1 at peak
      // Interpolate from orange (0xffaa55) to bright white (0xffdddd)
      const r = Math.floor(0xff * heightFactor + 0xff * (1 - heightFactor));
      const g = Math.floor(0xdd * heightFactor + 0xaa * (1 - heightFactor));
      const b = Math.floor(0xdd * heightFactor + 0x55 * (1 - heightFactor));
      color = (r << 16) | (g << 8) | b;

      intensity = 0.5 + heightFactor * 0.3;
      console.log(
        `Height factor: ${heightFactor.toFixed(2)}, Sun intensity: ${intensity.toFixed(2)}`,
      );

      const ambR = Math.floor(0xff * heightFactor + 0x66 * (1 - heightFactor));
      const ambG = Math.floor(0xff * heightFactor + 0x66 * (1 - heightFactor));
      const ambB = Math.floor(0xff * heightFactor + 0x88 * (1 - heightFactor));
      ambientColor = (ambR << 16) | (ambG << 8) | ambB;
      ambientIntensity = 0.3 + heightFactor * 0.6;
    }

    this.lighting.updateConfig({
      directionalColor: color,
      directionalIntensity: intensity,
      directionalPosition: { x: lightX, y: Math.max(10, lightY), z: lightZ },
      ambientColor: ambientColor,
      ambientIntensity: ambientIntensity,
    });

    this.lighting.updateSunPosition(playerPos.x, playerPos.y, playerPos.z);
  }
}
