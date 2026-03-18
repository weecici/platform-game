import * as THREE from 'three';
import type { Engine } from '../core/engine';

/**
 * LightingSystem - Manages all lighting including:
 * - Ambient light (anh sang moi truong)
 * - Point light (anh sang diem)
 * - Directional light with shadow mapping (anh sang dinh huong + bong do)
 */
export interface LightingConfig {
  ambientColor: number;
  ambientIntensity: number;
  directionalColor: number;
  directionalIntensity: number;
  directionalPosition: { x: number; y: number; z: number };
  pointColor: number;
  pointIntensity: number;
  pointPosition: { x: number; y: number; z: number };
  pointDistance: number;
  shadowMapSize: number;
  shadowBias: number;
}

export class LightingSystem {
  public ambientLight: THREE.AmbientLight;
  public directionalLight: THREE.DirectionalLight;
  public pointLight: THREE.PointLight;
  public hemisphereLight: THREE.HemisphereLight;
  public config: LightingConfig;

  private engine: Engine;

  constructor(engine: Engine) {
    this.engine = engine;

    this.config = {
      ambientColor: 0x404060,
      ambientIntensity: 0.4,
      directionalColor: 0xfff4e6,
      directionalIntensity: 1.5,
      directionalPosition: { x: 50, y: 80, z: 30 },
      pointColor: 0xff8844,
      pointIntensity: 4.0,
      pointPosition: { x: 0, y: 10, z: 0 },
      pointDistance: 50,
      shadowMapSize: 2048,
      shadowBias: -0.0005,
    };

    // Ambient light - general scene illumination
    this.ambientLight = new THREE.AmbientLight(
      this.config.ambientColor,
      this.config.ambientIntensity,
    );
    engine.scene.add(this.ambientLight);

    // Hemisphere light for subtle sky/ground coloring
    this.hemisphereLight = new THREE.HemisphereLight(0x87ceeb, 0x362907, 0.3);
    engine.scene.add(this.hemisphereLight);

    // Directional light - sun-like, with shadow mapping
    this.directionalLight = new THREE.DirectionalLight(
      this.config.directionalColor,
      this.config.directionalIntensity,
    );
    this.directionalLight.position.set(
      this.config.directionalPosition.x,
      this.config.directionalPosition.y,
      this.config.directionalPosition.z,
    );
    this.directionalLight.castShadow = true;

    // Shadow mapping configuration
    this.directionalLight.shadow.mapSize.width = this.config.shadowMapSize;
    this.directionalLight.shadow.mapSize.height = this.config.shadowMapSize;
    this.directionalLight.shadow.camera.near = 0.5;
    this.directionalLight.shadow.camera.far = 200;
    this.directionalLight.shadow.camera.left = -60;
    this.directionalLight.shadow.camera.right = 60;
    this.directionalLight.shadow.camera.top = 60;
    this.directionalLight.shadow.camera.bottom = -60;
    this.directionalLight.shadow.bias = this.config.shadowBias;
    this.directionalLight.shadow.normalBias = 0.02;

    engine.scene.add(this.directionalLight);

    // Point light - localized light source
    this.pointLight = new THREE.PointLight(
      this.config.pointColor,
      this.config.pointIntensity,
      this.config.pointDistance,
    );
    this.pointLight.position.set(
      this.config.pointPosition.x,
      this.config.pointPosition.y,
      this.config.pointPosition.z,
    );
    this.pointLight.castShadow = true;
    this.pointLight.shadow.mapSize.width = 1024;
    this.pointLight.shadow.mapSize.height = 1024;
    engine.scene.add(this.pointLight);
  }

  /**
   * Update the directional light to follow the player (for consistent shadows)
   */
  updateSunPosition(targetX: number, targetZ: number): void {
    this.directionalLight.position.set(
      targetX + this.config.directionalPosition.x,
      this.config.directionalPosition.y,
      targetZ + this.config.directionalPosition.z,
    );
    this.directionalLight.target.position.set(targetX, 0, targetZ);
    this.directionalLight.target.updateMatrixWorld();
  }

  /**
   * Update lighting configuration
   */
  updateConfig(config: Partial<LightingConfig>): void {
    Object.assign(this.config, config);

    this.ambientLight.color.setHex(this.config.ambientColor);
    this.ambientLight.intensity = this.config.ambientIntensity;

    this.directionalLight.color.setHex(this.config.directionalColor);
    this.directionalLight.intensity = this.config.directionalIntensity;

    this.pointLight.color.setHex(this.config.pointColor);
    this.pointLight.intensity = this.config.pointIntensity;
    this.pointLight.distance = this.config.pointDistance;
  }
}
