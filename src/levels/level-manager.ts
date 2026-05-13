import * as THREE from "three";
import * as CANNON from "cannon-es";
import type { Engine } from "../core/engine";
import type { PhysicsWorld } from "../core/physics-world";
import type { TextureManager } from "../systems/texture-manager";
import { ModelLoader } from "../entities/model-loader";

export interface PlatformDef {
  position: [number, number, number];
  size: [number, number, number];
  color?: number;
  texture?: string;
  textureRepeat?: [number, number];
  solid?: boolean;
  type?: "static" | "moving" | "rotating" | "crumbling";
  moveAxis?: "x" | "y" | "z";
  moveRange?: number;
  moveSpeed?: number;
  rotateAxis?: "x" | "y" | "z";
  rotateSpeed?: number;
  /** If true, this platform will ignore distance-based culling */
  noCull?: boolean;
}

export interface LevelConfig {
  name: string;
  spawnPosition: [number, number, number];
  platforms: PlatformDef[];
  decorations: DecorationDef[];
  skyColor?: number;
  fogColor?: number;
  fogNear?: number;
  fogFar?: number;
}

export interface DecorationDef {
  type:
    | "sphere"
    | "cone"
    | "cylinder"
    | "torus"
    | "torusknot"
    | "model"
    | "river";
  position: [number, number, number];
  scale?: [number, number, number];
  rotation?: [number, number, number];
  color?: number;
  emissive?: number;
  modelPath?: string;
  /**
   * Extract a single child by index from the loaded model.
   * Useful when a USDZ file contains multiple objects (e.g. a forest of trees)
   * and you only want one specific tree. Index 0 = first child.
   */
  childIndex?: number;
  /** Extract a single child by name instead of index. */
  childName?: string;
  animate?: {
    rotateY?: number;
    bobSpeed?: number;
    bobHeight?: number;
    /** Orbit radius — makes the decoration fly in a circle on the XZ plane */
    orbitRadius?: number;
    /** Orbit speed in radians per second */
    orbitSpeed?: number;
    /** Offset rotation for orbiting models (e.g. to fix moonwalking or sideways models) */
    orbitRotationOffset?: number;
  };
  /** If set, this decoration is a collectible that grants the named block type id. */
  collectible?: string;
  /** Whether the decoration acts as a solid physical obstacle */
  solid?: boolean;
  /** If true, this decoration will ignore distance-based culling */
  noCull?: boolean;
}

interface PlatformRuntime {
  mesh: THREE.Mesh;
  body: CANNON.Body | null;
  def: PlatformDef;
  initialPosition: THREE.Vector3;
  previousPosition: THREE.Vector3;
  time: number;
  initialTime: number;
  initialRotation: THREE.Euler;
  isCulled: boolean;
}

interface DecorationRuntime {
  mesh: THREE.Object3D;
  def: DecorationDef;
  initialPosition: THREE.Vector3;
  initialY: number;
  time: number;
  initialTime: number;
  /** Has the player already collected this pickup? */
  collected: boolean;
  bodies: CANNON.Body[];
  initialScale: THREE.Vector3;
  isLoadingModel: boolean;
  isModelLoaded: boolean;
  generation: number;
  isCulled: boolean;
}

export class LevelManager {
  private engine: Engine;
  private physics: PhysicsWorld;
  private textureManager: TextureManager;
  private modelLoader: ModelLoader;
  private platforms: PlatformRuntime[] = [];
  private decorations: DecorationRuntime[] = [];
  private currentConfig: LevelConfig | null = null;
  private levelGeneration = 0;

  constructor(
    engine: Engine,
    physics: PhysicsWorld,
    textureManager: TextureManager,
  ) {
    this.engine = engine;
    this.physics = physics;
    this.textureManager = textureManager;
    this.modelLoader = new ModelLoader();
  }

  loadLevel(config: LevelConfig): void {
    this.clearLevel();
    this.levelGeneration += 1;
    const generation = this.levelGeneration;
    this.currentConfig = config;

    for (const platDef of config.platforms) {
      this.createPlatform(platDef);
    }

    if (config.decorations) {
      for (const decDef of config.decorations) {
        this.createDecoration(decDef, generation);
      }
    }
  }

  private createPlatform(def: PlatformDef): void {
    const [sx, sy, sz] = def.size;
    const [px, py, pz] = def.position;

    const geometry = new THREE.BoxGeometry(sx, sy, sz);
    
    // World-space UV mapping for perfect aspect ratio without squishing
    const positionAttribute = geometry.getAttribute("position");
    const normalAttribute = geometry.getAttribute("normal");
    const uvAttribute = geometry.getAttribute("uv");

    const vertex = new THREE.Vector3();
    const normal = new THREE.Vector3();
    
    // Default tiles per world unit (e.g. 0.5 = 1 tile every 2 units)
    // We ignore def.textureRepeat now to enforce a globally consistent texture scale
    const tileScale = 0.5;

    for (let i = 0; i < positionAttribute.count; i++) {
      vertex.fromBufferAttribute(positionAttribute, i);
      normal.fromBufferAttribute(normalAttribute, i);

      let u = 0, v = 0;

      // Top / Bottom face (normal points along Y)
      if (Math.abs(normal.y) > 0.5) {
        u = vertex.x * tileScale;
        v = vertex.z * tileScale;
      }
      // Front / Back face (normal points along Z)
      else if (Math.abs(normal.z) > 0.5) {
        u = vertex.x * tileScale;
        v = vertex.y * tileScale;
      }
      // Left / Right face (normal points along X)
      else if (Math.abs(normal.x) > 0.5) {
        u = vertex.z * tileScale;
        v = vertex.y * tileScale;
      }

      uvAttribute.setXY(i, u, v);
    }
    uvAttribute.needsUpdate = true;

    const material = new THREE.MeshStandardMaterial({
      color: def.color || 0x668899,
      roughness: 0.6,
      metalness: 0.2,
    });

    const mesh = new THREE.Mesh(geometry, material);

    if (def.texture) {
      // Pass 1, 1 since the geometry UVs handle the tiling now
      const appliedSet = this.textureManager.applyTextureSet(
        mesh,
        def.texture,
        1,
        1,
      );

      if (!appliedSet) {
        const tex = this.textureManager.getTexture(def.texture);
        if (tex) {
          const cloned = tex.clone();
          cloned.repeat.set(1, 1);
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
          def.type === "moving" || def.type === "rotating"
            ? CANNON.Body.KINEMATIC
            : CANNON.Body.STATIC,
        shape,
        position: new CANNON.Vec3(px, py, pz),
      });
      this.physics.addBody(body);
    }

    const initialTime = Math.random() * Math.PI * 2;
    this.platforms.push({
      mesh,
      body,
      def,
      initialPosition: new THREE.Vector3(px, py, pz),
      previousPosition: new THREE.Vector3(px, py, pz),
      time: initialTime,
      initialTime: initialTime,
      initialRotation: mesh.rotation.clone(),
      isCulled: false,
    });
  }

  private createDecoration(def: DecorationDef, generation: number): void {
    if (def.type === "model") {
      if (!def.modelPath) {
        console.warn('Decoration of type "model" is missing modelPath.', def);
        return;
      }

      const anchor = new THREE.Group();
      anchor.position.set(...def.position);
      if (def.scale) anchor.scale.set(...def.scale);
      if (def.rotation) anchor.rotation.set(...def.rotation);
      this.engine.scene.add(anchor);

      const initialTime = Math.random() * Math.PI * 2;
      const decRuntime: DecorationRuntime = {
        mesh: anchor,
        def,
        initialPosition: new THREE.Vector3(...def.position),
        initialY: def.position[1],
        time: initialTime,
        initialTime: initialTime,
        collected: false,
        bodies: [],
        initialScale: anchor.scale.clone(),
        isLoadingModel: false,
        isModelLoaded: false,
        generation: this.levelGeneration,
        isCulled: false,
      };
      this.decorations.push(decRuntime);
      return;
    }

    let geometry: THREE.BufferGeometry;
    switch (def.type) {
      case "sphere":
        geometry = new THREE.SphereGeometry(0.5, 24, 24);
        break;
      case "cone":
        geometry = new THREE.ConeGeometry(0.5, 1, 24);
        break;
      case "cylinder":
        geometry = new THREE.CylinderGeometry(0.5, 0.5, 1, 24);
        break;
      case "torus":
        geometry = new THREE.TorusGeometry(0.5, 0.15, 16, 48);
        break;
      case "torusknot":
        geometry = new THREE.TorusKnotGeometry(0.4, 0.12, 100, 16);
        break;
      case "river":
        geometry = new THREE.PlaneGeometry(15, 295);
        break;
      default:
        geometry = new THREE.SphereGeometry(0.5, 24, 24);
    }

    const material = new THREE.MeshStandardMaterial({
      color: def.color || 0xffaa00,
      roughness: def.type === "river" ? 0.1 : 0.2,
      metalness: def.type === "river" ? 0.1 : 0.8,
      transparent: def.type === "river",
      opacity: def.type === "river" ? 0.8 : 1,
      emissive: new THREE.Color(def.emissive || 0x000000),
      emissiveIntensity: def.emissive ? 0.5 : 0,
    });

    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(...def.position);
    if (def.type === "river") mesh.rotation.x = -Math.PI / 2;
    if (def.scale) mesh.scale.set(...def.scale);
    mesh.castShadow = def.type !== "river";
    this.engine.scene.add(mesh);

    const initialTime = Math.random() * Math.PI * 2;
    this.decorations.push({
      mesh,
      def,
      initialPosition: new THREE.Vector3(...def.position),
      initialY: def.position[1],
      time: initialTime,
      initialTime: initialTime,
      collected: false,
      bodies: [],
      initialScale: mesh.scale.clone(),
      isLoadingModel: true,
      isModelLoaded: true,
      generation: this.levelGeneration,
      isCulled: false,
    });
  }

  private loadDecorationModel(dec: DecorationRuntime): void {
    if (!dec.def.modelPath) return;

    void this.modelLoader
      .load(dec.def.modelPath)
      .then((model) => {
        if (dec.generation !== this.levelGeneration) {
          disposeObject3D(model);
          return;
        }

        const anchor = dec.mesh as THREE.Group;
        const def = dec.def;

        let objectToAdd: THREE.Object3D = model;

        if (def.childName) {
          const found = model.getObjectByName(def.childName);
          objectToAdd = found ?? model;
        } else if (def.childIndex !== undefined) {
          const collectLeafGroups = (
            root: THREE.Object3D,
          ): THREE.Object3D[] => {
            const meaningful = root.children.filter((c) => {
              let hasMesh = false;
              c.traverse((x) => {
                if (x instanceof THREE.Mesh) hasMesh = true;
              });
              return hasMesh;
            });
            if (meaningful.length > 1) return meaningful;
            if (meaningful.length === 1)
              return collectLeafGroups(meaningful[0]);
            return [root];
          };

          const leafGroups = collectLeafGroups(model);
          const picked = leafGroups[def.childIndex % leafGroups.length];
          if (picked) {
            objectToAdd = picked;
          }
        }

        const bounds = new THREE.Box3().setFromObject(objectToAdd);
        const center = bounds.getCenter(new THREE.Vector3());
        objectToAdd.position.x -= center.x;
        objectToAdd.position.y -= bounds.min.y;
        objectToAdd.position.z -= center.z;

        if (def.modelPath && def.modelPath.includes("clouds")) {
          objectToAdd.traverse((child) => {
            if (child instanceof THREE.Mesh) {
              child.material = new THREE.MeshStandardMaterial({
                color: 0xffffff,
                roughness: 0.9,
                metalness: 0.0,
                emissive: new THREE.Color(0xddeeff),
                emissiveIntensity: 0.18,
              });
              // Disable heavy shadow calculations for clouds
              child.castShadow = false;
              child.receiveShadow = false;
            }
          });
        }

        if (def.modelPath && def.modelPath.includes("Low_poly_sun")) {
          objectToAdd.traverse((child) => {
            if (child instanceof THREE.Mesh) {
              child.material = new THREE.MeshStandardMaterial({
                color: 0xffdd44,
                roughness: 0.1,
                metalness: 0.0,
                emissive: new THREE.Color(0xffaa00),
                emissiveIntensity: 2.0,
              });
              child.castShadow = false;
              child.receiveShadow = false;
            }
          });

          const sunLight = new THREE.PointLight(0xffaa44, 8, 120);
          sunLight.position.copy(anchor.position);
          sunLight.position.y += 2;
          this.engine.scene.add(sunLight);
        }

        anchor.add(objectToAdd);

        if (def.solid) {
          anchor.updateMatrixWorld(true);

          objectToAdd.traverse((child) => {
            if (child instanceof THREE.Mesh) {
              const geometry = child.geometry as THREE.BufferGeometry;
              if (!geometry.attributes.position) return;

              const positions = geometry.attributes.position.array;
              const indices = geometry.index ? geometry.index.array : null;

              const vertices: number[] = [];
              const faces: number[] = [];

              const vertex = new THREE.Vector3();
              for (let i = 0; i < positions.length; i += 3) {
                vertex.set(positions[i], positions[i + 1], positions[i + 2]);
                vertex.applyMatrix4(child.matrixWorld);
                vertices.push(vertex.x, vertex.y, vertex.z);
              }

              if (indices) {
                for (let i = 0; i < indices.length; i++) {
                  faces.push(indices[i]);
                }
              } else {
                for (let i = 0; i < positions.length / 3; i++) {
                  faces.push(i);
                }
              }

              const trimeshShape = new CANNON.Trimesh(vertices, faces);
              const body = new CANNON.Body({
                mass: 0,
                type: CANNON.Body.STATIC,
              });
              body.addShape(trimeshShape);
              // Only add to physics if not currently culled
              if (!dec.isCulled) {
                this.physics.addBody(body);
              }
              dec.bodies.push(body);
            }
          });
        }
        dec.isModelLoaded = true;
      })
      .catch((error) => {
        console.warn(
          `Failed to load decoration model: ${dec.def.modelPath}`,
          error,
        );
      });
  }

  update(dt: number, playerPos: THREE.Vector3): void {
    const RENDER_DISTANCE = 150;
    const RENDER_DISTANCE_SQ = RENDER_DISTANCE * RENDER_DISTANCE;
    const LAZY_LOAD_DISTANCE = 200;
    const LAZY_LOAD_DISTANCE_SQ = LAZY_LOAD_DISTANCE * LAZY_LOAD_DISTANCE;

    for (const plat of this.platforms) {
      // Distance culling for platforms
      const dx = playerPos.x - plat.initialPosition.x;
      const dz = playerPos.z - plat.initialPosition.z;
      const distSq = dx * dx + dz * dz;

      const shouldBeVisible = plat.def.noCull || distSq <= RENDER_DISTANCE_SQ;

      if (shouldBeVisible && plat.isCulled) {
        plat.isCulled = false;
        plat.mesh.visible = true;
        if (plat.body) this.physics.addBody(plat.body);
      } else if (!shouldBeVisible && !plat.isCulled) {
        plat.isCulled = true;
        plat.mesh.visible = false;
        if (plat.body) this.physics.removeBody(plat.body);
      }

      if (plat.isCulled) continue;

      plat.time += dt;

      if (plat.def.type === "moving" && plat.def.moveAxis) {
        const range = plat.def.moveRange || 3;
        const speed = plat.def.moveSpeed || 1;
        const offset = Math.sin(plat.time * speed) * range;
        const axis = plat.def.moveAxis;

        const newPos = plat.initialPosition.clone();
        if (axis === "x") newPos.x += offset;
        if (axis === "y") newPos.y += offset;
        if (axis === "z") newPos.z += offset;

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

      if (plat.def.type === "rotating") {
        const speed = plat.def.rotateSpeed || 1;
        const axis = plat.def.rotateAxis || "y";
        if (axis === "x") plat.mesh.rotation.x += speed * dt;
        if (axis === "y") plat.mesh.rotation.y += speed * dt;
        if (axis === "z") plat.mesh.rotation.z += speed * dt;

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

      const dx = playerPos.x - dec.initialPosition.x;
      const dy = playerPos.y - dec.initialPosition.y;
      const dz = playerPos.z - dec.initialPosition.z;
      const distSq = dx * dx + dy * dy + dz * dz;

      // Lazy Loading for models
      if (dec.def.type === "model") {
        if (
          !dec.isModelLoaded &&
          !dec.isLoadingModel &&
          distSq <= LAZY_LOAD_DISTANCE_SQ
        ) {
          dec.isLoadingModel = true;
          this.loadDecorationModel(dec);
        }
      }

      // Visibility & Physics Culling
      const shouldBeVisible = dec.def.noCull || distSq <= RENDER_DISTANCE_SQ;

      if (shouldBeVisible && dec.isCulled) {
        dec.isCulled = false;
        dec.mesh.visible = true;
        for (const body of dec.bodies) {
          this.physics.addBody(body);
        }
      } else if (!shouldBeVisible && !dec.isCulled) {
        dec.isCulled = true;
        dec.mesh.visible = false;
        for (const body of dec.bodies) {
          this.physics.removeBody(body);
        }
      }

      if (dec.isCulled) continue;

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
        if (dec.def.animate.orbitRadius && dec.def.animate.orbitSpeed) {
          const angle = dec.time * dec.def.animate.orbitSpeed;
          const radius = dec.def.animate.orbitRadius;

          // Position — orbit on XZ plane
          dec.mesh.position.x =
            dec.initialPosition.x + Math.cos(angle) * radius;
          dec.mesh.position.z =
            dec.initialPosition.z + Math.sin(angle) * radius;

          // Heading — face direction of travel (tangent to circle)
          // Three.js default forward is -Z.
          const rotOffset = dec.def.animate.orbitRotationOffset || 0;
          dec.mesh.rotation.y = -angle + rotOffset;
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
          mesh.scale.set(startScale.x * s, startScale.y * s, startScale.z * s);
          mesh.position.y += 0.08; // float upward
          requestAnimationFrame(shrink);
        };
        shrink();
      }
    }

    return collected;
  }

  resetLevel(): void {
    if (!this.currentConfig) return;

    for (const plat of this.platforms) {
      plat.time = plat.initialTime;
      plat.mesh.position.copy(plat.initialPosition);
      plat.previousPosition.copy(plat.initialPosition);
      plat.mesh.rotation.copy(plat.initialRotation);

      if (plat.body && !plat.isCulled) {
        plat.body.position.set(
          plat.initialPosition.x,
          plat.initialPosition.y,
          plat.initialPosition.z,
        );
        plat.body.quaternion.set(
          plat.mesh.quaternion.x,
          plat.mesh.quaternion.y,
          plat.mesh.quaternion.z,
          plat.mesh.quaternion.w,
        );
        plat.body.velocity.set(0, 0, 0);
        plat.body.angularVelocity.set(0, 0, 0);
        plat.body.aabbNeedsUpdate = true;
      }
    }

    for (const dec of this.decorations) {
      dec.time = dec.initialTime;

      // If we bobbed or rotated, reset rotation and Y-position
      if (dec.def.animate) {
        if (dec.def.rotation) {
          dec.mesh.rotation.set(...dec.def.rotation);
        } else {
          dec.mesh.rotation.set(0, 0, 0);
        }
        dec.mesh.position.y = dec.initialY;
      }

      if (dec.collected) {
        dec.collected = false;
        dec.mesh.scale.copy(dec.initialScale);
        dec.mesh.position.y = dec.initialY;
        this.engine.scene.add(dec.mesh);
      }
    }
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
      disposeObject3D(dec.mesh);
      for (const body of dec.bodies) {
        this.physics.removeBody(body);
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
    // Player wins by reaching the very top of the vertical tower
    return position.y >= 105;
  }
}

function disposeObject3D(object: THREE.Object3D): void {
  object.traverse((child) => {
    if (!(child instanceof THREE.Mesh)) return;
    child.geometry.dispose();
    if (Array.isArray(child.material)) {
      child.material.forEach((material) => material.dispose());
    } else {
      child.material.dispose();
    }
  });
}
