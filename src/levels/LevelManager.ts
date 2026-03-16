import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import type { Engine } from '../core/Engine';
import type { PhysicsWorld } from '../core/PhysicsWorld';
import type { TextureManager } from '../systems/TextureManager';

/**
 * Platform definition for level building
 */
export interface PlatformDef {
  position: [number, number, number];
  size: [number, number, number];
  color?: number;
  texture?: string;
  textureRepeat?: [number, number];
  type?: 'static' | 'moving' | 'rotating' | 'crumbling';
  // For moving platforms
  moveAxis?: 'x' | 'y' | 'z';
  moveRange?: number;
  moveSpeed?: number;
  // For rotating
  rotateAxis?: 'x' | 'y' | 'z';
  rotateSpeed?: number;
}

export interface LevelConfig {
  name: string;
  spawnPosition: [number, number, number];
  platforms: PlatformDef[];
  decorations?: DecorationDef[];
  skyColor?: number;
  fogColor?: number;
  fogNear?: number;
  fogFar?: number;
}

export interface DecorationDef {
  type: 'sphere' | 'cone' | 'cylinder' | 'torus' | 'torusknot';
  position: [number, number, number];
  scale?: [number, number, number];
  color?: number;
  emissive?: number;
  animate?: {
    rotateY?: number;
    bobSpeed?: number;
    bobHeight?: number;
  };
}

interface PlatformRuntime {
  mesh: THREE.Mesh;
  body: CANNON.Body;
  def: PlatformDef;
  initialPosition: THREE.Vector3;
  time: number;
}

interface DecorationRuntime {
  mesh: THREE.Object3D;
  def: DecorationDef;
  initialY: number;
  time: number;
}

export class LevelManager {
  private engine: Engine;
  private physics: PhysicsWorld;
  private textureManager: TextureManager;
  private platforms: PlatformRuntime[] = [];
  private decorations: DecorationRuntime[] = [];
  private currentConfig: LevelConfig | null = null;

  constructor(
    engine: Engine,
    physics: PhysicsWorld,
    textureManager: TextureManager,
  ) {
    this.engine = engine;
    this.physics = physics;
    this.textureManager = textureManager;
  }

  /**
   * Load a level from config
   */
  loadLevel(config: LevelConfig): void {
    this.clearLevel();
    this.currentConfig = config;

    // Sky and fog
    if (config.skyColor !== undefined) {
      this.engine.scene.background = new THREE.Color(config.skyColor);
    }
    if (config.fogColor !== undefined) {
      this.engine.scene.fog = new THREE.Fog(
        config.fogColor,
        config.fogNear || 20,
        config.fogFar || 150,
      );
    }

    // Build platforms
    for (const platDef of config.platforms) {
      this.createPlatform(platDef);
    }

    // Build decorations
    if (config.decorations) {
      for (const decDef of config.decorations) {
        this.createDecoration(decDef);
      }
    }
  }

  private createPlatform(def: PlatformDef): void {
    const [sx, sy, sz] = def.size;
    const [px, py, pz] = def.position;

    // Visual mesh
    const geometry = new THREE.BoxGeometry(sx, sy, sz);
    const material = new THREE.MeshStandardMaterial({
      color: def.color || 0x668899,
      roughness: 0.6,
      metalness: 0.2,
    });

    // Apply texture if specified
    if (def.texture) {
      const tex = this.textureManager.getTexture(def.texture);
      if (tex) {
        const cloned = tex.clone();
        cloned.repeat.set(
          def.textureRepeat?.[0] || sx / 2,
          def.textureRepeat?.[1] || sz / 2,
        );
        cloned.needsUpdate = true;
        material.map = cloned;
      }
    }

    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(px, py, pz);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    this.engine.scene.add(mesh);

    // Physics body
    const halfExtents = new CANNON.Vec3(sx / 2, sy / 2, sz / 2);
    const shape = new CANNON.Box(halfExtents);
    const body = new CANNON.Body({
      mass: 0, // Static
      shape,
      position: new CANNON.Vec3(px, py, pz),
    });
    this.physics.addBody(body);

    this.platforms.push({
      mesh,
      body,
      def,
      initialPosition: new THREE.Vector3(px, py, pz),
      time: Math.random() * Math.PI * 2, // Random phase offset
    });
  }

  private createDecoration(def: DecorationDef): void {
    let geometry: THREE.BufferGeometry;
    switch (def.type) {
      case 'sphere':
        geometry = new THREE.SphereGeometry(0.5, 24, 24);
        break;
      case 'cone':
        geometry = new THREE.ConeGeometry(0.5, 1, 24);
        break;
      case 'cylinder':
        geometry = new THREE.CylinderGeometry(0.5, 0.5, 1, 24);
        break;
      case 'torus':
        geometry = new THREE.TorusGeometry(0.5, 0.15, 16, 48);
        break;
      case 'torusknot':
        geometry = new THREE.TorusKnotGeometry(0.4, 0.12, 100, 16);
        break;
      default:
        geometry = new THREE.SphereGeometry(0.5, 24, 24);
    }

    const material = new THREE.MeshStandardMaterial({
      color: def.color || 0xffaa00,
      roughness: 0.2,
      metalness: 0.8,
      emissive: new THREE.Color(def.emissive || 0x000000),
      emissiveIntensity: def.emissive ? 0.5 : 0,
    });

    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(...def.position);
    if (def.scale) mesh.scale.set(...def.scale);
    mesh.castShadow = true;
    this.engine.scene.add(mesh);

    this.decorations.push({
      mesh,
      def,
      initialY: def.position[1],
      time: Math.random() * Math.PI * 2,
    });
  }

  /**
   * Update moving/rotating platforms and decorations
   */
  update(dt: number): void {
    // Update platforms
    for (const plat of this.platforms) {
      plat.time += dt;

      if (plat.def.type === 'moving' && plat.def.moveAxis) {
        const range = plat.def.moveRange || 3;
        const speed = plat.def.moveSpeed || 1;
        const offset = Math.sin(plat.time * speed) * range;
        const axis = plat.def.moveAxis;

        const newPos = plat.initialPosition.clone();
        if (axis === 'x') newPos.x += offset;
        if (axis === 'y') newPos.y += offset;
        if (axis === 'z') newPos.z += offset;

        plat.mesh.position.copy(newPos);
        plat.body.position.set(newPos.x, newPos.y, newPos.z);
      }

      if (plat.def.type === 'rotating') {
        const speed = plat.def.rotateSpeed || 1;
        const axis = plat.def.rotateAxis || 'y';
        if (axis === 'x') plat.mesh.rotation.x += speed * dt;
        if (axis === 'y') plat.mesh.rotation.y += speed * dt;
        if (axis === 'z') plat.mesh.rotation.z += speed * dt;

        // Sync physics body rotation
        plat.body.quaternion.set(
          plat.mesh.quaternion.x,
          plat.mesh.quaternion.y,
          plat.mesh.quaternion.z,
          plat.mesh.quaternion.w,
        );
      }
    }

    // Update decorations (animations)
    for (const dec of this.decorations) {
      dec.time += dt;
      if (dec.def.animate) {
        if (dec.def.animate.rotateY) {
          dec.mesh.rotation.y += dec.def.animate.rotateY * dt;
        }
        if (dec.def.animate.bobSpeed && dec.def.animate.bobHeight) {
          dec.mesh.position.y =
            dec.initialY +
            Math.sin(dec.time * dec.def.animate.bobSpeed) *
              dec.def.animate.bobHeight;
        }
      }
    }
  }

  /**
   * Clear all level objects
   */
  clearLevel(): void {
    for (const plat of this.platforms) {
      this.engine.scene.remove(plat.mesh);
      this.physics.removeBody(plat.body);
      if (plat.mesh.geometry) plat.mesh.geometry.dispose();
    }
    for (const dec of this.decorations) {
      this.engine.scene.remove(dec.mesh);
    }
    this.platforms = [];
    this.decorations = [];
    this.currentConfig = null;
  }

  getSpawnPosition(): THREE.Vector3 {
    if (this.currentConfig) {
      return new THREE.Vector3(...this.currentConfig.spawnPosition);
    }
    return new THREE.Vector3(0, 5, 0);
  }
}
