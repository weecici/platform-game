import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import type { Engine } from '../core/engine';
import type { PhysicsWorld } from '../core/physics-world';
import type { TextureManager } from '../systems/texture-manager';

export interface PlatformDef {
  position: [number, number, number];
  size: [number, number, number];
  color?: number;
  texture?: string;
  textureRepeat?: [number, number];
  solid?: boolean;
  type?: 'static' | 'moving' | 'rotating' | 'crumbling';
  moveAxis?: 'x' | 'y' | 'z';
  moveRange?: number;
  moveSpeed?: number;
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
  /** If set, this decoration is a collectible that grants the named block type id. */
  collectible?: string;
}

interface PlatformRuntime {
  mesh: THREE.Mesh;
  body: CANNON.Body | null;
  def: PlatformDef;
  initialPosition: THREE.Vector3;
  previousPosition: THREE.Vector3;
  time: number;
}

interface DecorationRuntime {
  mesh: THREE.Object3D;
  def: DecorationDef;
  initialY: number;
  time: number;
  /** Has the player already collected this pickup? */
  collected: boolean;
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

  loadLevel(config: LevelConfig): void {
    this.clearLevel();
    this.currentConfig = config;

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

    for (const platDef of config.platforms) {
      this.createPlatform(platDef);
    }

    if (config.decorations) {
      for (const decDef of config.decorations) {
        this.createDecoration(decDef);
      }
    }
  }

  private createPlatform(def: PlatformDef): void {
    const [sx, sy, sz] = def.size;
    const [px, py, pz] = def.position;

    const geometry = new THREE.BoxGeometry(sx, sy, sz);
    const material = new THREE.MeshStandardMaterial({
      color: def.color || 0x668899,
      roughness: 0.6,
      metalness: 0.2,
    });

    const mesh = new THREE.Mesh(geometry, material);

    if (def.texture) {
      const repeatX = def.textureRepeat?.[0] || sx / 2;
      const repeatY = def.textureRepeat?.[1] || sz / 2;

      const appliedSet = this.textureManager.applyTextureSet(
        mesh,
        def.texture,
        repeatX,
        repeatY,
      );

      if (!appliedSet) {
        const tex = this.textureManager.getTexture(def.texture);
        if (tex) {
          const cloned = tex.clone();
          cloned.repeat.set(repeatX, repeatY);
          cloned.needsUpdate = true;
          material.map = cloned;
        }
      }
    }

    mesh.position.set(px, py, pz);
    mesh.castShadow = def.solid !== false;
    mesh.receiveShadow = true;
    this.engine.scene.add(mesh);

    let body: CANNON.Body | null = null;
    if (def.solid !== false) {
      const halfExtents = new CANNON.Vec3(sx / 2, sy / 2, sz / 2);
      const shape = new CANNON.Box(halfExtents);
      body = new CANNON.Body({
        mass: 0,
        type:
          def.type === 'moving' || def.type === 'rotating'
            ? CANNON.Body.KINEMATIC
            : CANNON.Body.STATIC,
        shape,
        position: new CANNON.Vec3(px, py, pz),
      });
      this.physics.addBody(body);
    }

    this.platforms.push({
      mesh,
      body,
      def,
      initialPosition: new THREE.Vector3(px, py, pz),
      previousPosition: new THREE.Vector3(px, py, pz),
      time: Math.random() * Math.PI * 2,
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
      collected: false,
    });
  }

  update(dt: number): void {
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
        if (plat.body) {
          plat.body.velocity.set(
            (newPos.x - plat.previousPosition.x) / Math.max(dt, 1 / 120),
            (newPos.y - plat.previousPosition.y) / Math.max(dt, 1 / 120),
            (newPos.z - plat.previousPosition.z) / Math.max(dt, 1 / 120),
          );
          plat.body.position.set(newPos.x, newPos.y, newPos.z);
          plat.body.aabbNeedsUpdate = true;
        }
        plat.previousPosition.copy(newPos);
      }

      if (plat.def.type === 'rotating') {
        const speed = plat.def.rotateSpeed || 1;
        const axis = plat.def.rotateAxis || 'y';
        if (axis === 'x') plat.mesh.rotation.x += speed * dt;
        if (axis === 'y') plat.mesh.rotation.y += speed * dt;
        if (axis === 'z') plat.mesh.rotation.z += speed * dt;

        if (plat.body) {
          plat.body.quaternion.set(
            plat.mesh.quaternion.x,
            plat.mesh.quaternion.y,
            plat.mesh.quaternion.z,
            plat.mesh.quaternion.w,
          );
          plat.body.aabbNeedsUpdate = true;
        }
      }
    }

    for (const dec of this.decorations) {
      if (dec.collected) continue;
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
   * Check if player is close enough to collect any collectible decorations.
   * Returns an array of block type IDs that were just collected.
   */
  checkCollectibles(playerPos: THREE.Vector3): string[] {
    const collected: string[] = [];
    const PICKUP_RADIUS = 2.0;
    const PICKUP_RADIUS_SQ = PICKUP_RADIUS * PICKUP_RADIUS;

    for (const dec of this.decorations) {
      if (dec.collected || !dec.def.collectible) continue;

      const dx = playerPos.x - dec.mesh.position.x;
      const dy = playerPos.y - dec.mesh.position.y;
      const dz = playerPos.z - dec.mesh.position.z;
      const distSq = dx * dx + dy * dy + dz * dz;

      if (distSq < PICKUP_RADIUS_SQ) {
        dec.collected = true;
        collected.push(dec.def.collectible);

        // Quick shrink-away animation then remove from scene
        const mesh = dec.mesh;
        const startScale = mesh.scale.clone();
        let t = 0;
        const shrink = () => {
          t += 0.05;
          if (t >= 1) {
            this.engine.scene.remove(mesh);
            return;
          }
          const s = 1 - t;
          mesh.scale.set(
            startScale.x * s,
            startScale.y * s,
            startScale.z * s,
          );
          mesh.position.y += 0.08; // float upward
          requestAnimationFrame(shrink);
        };
        shrink();
      }
    }

    return collected;
  }

  clearLevel(): void {
    for (const plat of this.platforms) {
      this.engine.scene.remove(plat.mesh);
      if (plat.body) {
        this.physics.removeBody(plat.body);
      }
      plat.mesh.geometry.dispose();
      if (Array.isArray(plat.mesh.material)) {
        plat.mesh.material.forEach((material) => material.dispose());
      } else {
        plat.mesh.material.dispose();
      }
    }

    for (const dec of this.decorations) {
      this.engine.scene.remove(dec.mesh);
      if (dec.mesh instanceof THREE.Mesh) {
        dec.mesh.geometry.dispose();
        if (Array.isArray(dec.mesh.material)) {
          dec.mesh.material.forEach((material) => material.dispose());
        } else {
          dec.mesh.material.dispose();
        }
      }
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

  isPlayerAtFinish(position: THREE.Vector3): boolean {
    return (
      position.z <= -131 &&
      position.z >= -141 &&
      position.x >= 10 &&
      position.x <= 20 &&
      position.y >= 12
    );
  }
}
