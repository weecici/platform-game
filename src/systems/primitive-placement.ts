import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import type { Engine } from '../core/engine';
import type { PhysicsWorld } from '../core/physics-world';
import type { TextureManager } from './texture-manager';
import type { BlockType, BlockInventory } from './block-system';
import { ShapeFactory } from '../entities/shape-factory';

export type PrimitiveType =
  | 'box'
  | 'sphere'
  | 'cone'
  | 'cylinder'
  | 'wheel'
  | 'teapot'
  | 'torusknot';

interface PlacedPrimitive {
  object: THREE.Object3D;
  body: CANNON.Body;
  /** Cache of the last axis-aligned bounding-box size used to build the body shape */
  lastSize: THREE.Vector3;
}

/**
 * PrimitivePlacementSystem
 *
 * Manages block placement with:
 * - Ghost preview mesh that follows the camera each frame
 * - Left-click confirmation that creates a real physics body
 * - Full affine-transform sync: position, rotation (quaternion), scale → body shape
 */
export class PrimitivePlacementSystem {
  private engine: Engine;
  private physics: PhysicsWorld;

  /** All currently placed blocks */
  private placed: PlacedPrimitive[] = [];

  /** Map from Three.js Object3D to its PlacedPrimitive entry for O(1) lookup */
  private objectToPrimitive: Map<THREE.Object3D, PlacedPrimitive> = new Map();

  // ------------- Ghost preview state ---------------
  private ghostObject: THREE.Object3D | null = null;
  private selectedBlockType: BlockType | null = null;
  /** Distance in front of the camera where the ghost is projected */
  private readonly GHOST_DISTANCE = 5;

  constructor(engine: Engine, physics: PhysicsWorld) {
    this.engine = engine;
    this.physics = physics;
  }

  // ================================================================
  // Ghost / Selection
  // ================================================================

  /**
   * Activate the ghost preview for a block type.
   * Replaces any previous ghost.
   */
  selectBlock(blockType: BlockType, textureManager: TextureManager): void {
    this.deselectBlock();
    this.selectedBlockType = blockType;

    const ghost = this.createVisualObject(blockType.shape, textureManager, blockType.texture);

    // Make it semi-transparent to clearly indicate "preview"
    ghost.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        const mat = child.material;
        if (Array.isArray(mat)) {
          mat.forEach((m) => {
            m.transparent = true;
            m.opacity = 0.45;
            m.depthWrite = false;
          });
        } else if (mat instanceof THREE.Material) {
          mat.transparent = true;
          (mat as THREE.Material).opacity = 0.45;
          mat.depthWrite = false;
        }
      }
    });

    this.ghostObject = ghost;
    this.engine.scene.add(ghost);
  }

  /** Remove and dispose the ghost preview without placing anything. */
  deselectBlock(): void {
    if (this.ghostObject) {
      this.engine.scene.remove(this.ghostObject);
      disposeObject(this.ghostObject);
      this.ghostObject = null;
    }
    this.selectedBlockType = null;
  }

  /**
   * Called every frame: repositions the ghost in front of the camera.
   * Must be called from the game loop if a block is selected.
   */
  updateGhost(camera: THREE.Camera): void {
    if (!this.ghostObject) return;

    const forward = new THREE.Vector3(0, -0.15, -1).normalize();
    forward.applyQuaternion(camera.quaternion);
    forward.multiplyScalar(this.GHOST_DISTANCE);

    this.ghostObject.position.copy(camera.position).add(forward);
    this.ghostObject.rotation.y = camera.rotation.y;
  }

  /**
   * Confirm placement: create a real block + physics body at the ghost position.
   * Returns the placed object, or null if placement was not possible.
   */
  confirmPlace(
    camera: THREE.Camera,
    textureManager: TextureManager,
    blockInventory: BlockInventory,
  ): THREE.Object3D | null {
    if (!this.selectedBlockType) return null;
    if (!blockInventory.canPlace(this.selectedBlockType)) return null;

    const blockType = this.selectedBlockType;

    // Determine placement position from ghost (or fall back to camera projection)
    const position = this.ghostObject
      ? this.ghostObject.position.clone()
      : (() => {
          const fwd = new THREE.Vector3(0, -0.15, -1).normalize();
          fwd.applyQuaternion(camera.quaternion);
          fwd.multiplyScalar(this.GHOST_DISTANCE);
          return camera.position.clone().add(fwd);
        })();

    const object = this.createVisualObject(blockType.shape, textureManager, blockType.texture);
    object.position.copy(position);
    object.rotation.y = camera.rotation.y;

    const placed = this.addToWorld(object, blockType);
    blockInventory.use(blockType);

    this.engine.scene.add(object);
    this.placed.push(placed);
    this.objectToPrimitive.set(object, placed);

    return object;
  }

  // ================================================================
  // Legacy API  (used by DebugGUI "Shape Tools" panel)
  // ================================================================

  /**
   * Immediately place a primitive of the given type at camera + offset.
   * Used by the old debug-GUI spawner and hot-keys 1-7 in debug mode.
   */
  place(type: PrimitiveType, camera: THREE.Camera): THREE.Object3D {
    const object = this.createLegacyObject(type);
    const offset = new THREE.Vector3(0, -0.2, -6);
    offset.applyQuaternion(camera.quaternion);
    position(object, camera.position.clone().add(offset));
    object.rotation.y = camera.rotation.y;

    const placed = this.addToWorldForObject(object);
    this.engine.scene.add(object);
    this.placed.push(placed);
    this.objectToPrimitive.set(object, placed);

    return object;
  }

  // ================================================================
  // Affine transform sync (called by DebugGUI after every slider change)
  // ================================================================

  /**
   * Re-sync a placed block's CANNON.Body to match its Three.js Object3D after
   * affine transformations (translate, rotate, scale) have been applied.
   *
   * Scale changes require rebuilding the body shape because CANNON shapes are
   * immutable once created, so we remove the old body and add a rebuilt one.
   */
  syncBodyToObject(object: THREE.Object3D): void {
    const entry = this.objectToPrimitive.get(object);
    if (!entry) return;

    // --- Position ---
    entry.body.position.set(
      object.position.x,
      object.position.y,
      object.position.z,
    );

    // --- Rotation (quaternion) ---
    object.updateMatrixWorld(true);
    entry.body.quaternion.set(
      object.quaternion.x,
      object.quaternion.y,
      object.quaternion.z,
      object.quaternion.w,
    );

    // --- Scale: if size changed, rebuild the physics shape ---
    const box = new THREE.Box3().setFromObject(object);
    const newSize = new THREE.Vector3();
    box.getSize(newSize);

    const sizeDiff =
      Math.abs(newSize.x - entry.lastSize.x) +
      Math.abs(newSize.y - entry.lastSize.y) +
      Math.abs(newSize.z - entry.lastSize.z);

    if (sizeDiff > 0.001) {
      // Replace old shape(s) with new box matching visual bounding box
      while (entry.body.shapes.length > 0) {
        entry.body.removeShape(entry.body.shapes[0]);
      }
      entry.body.addShape(
        new CANNON.Box(
          new CANNON.Vec3(
            Math.max(newSize.x, 0.1) / 2,
            Math.max(newSize.y, 0.1) / 2,
            Math.max(newSize.z, 0.1) / 2,
          ),
        ),
      );
      entry.lastSize.copy(newSize);
    }

    entry.body.aabbNeedsUpdate = true;
    entry.body.wakeUp?.();
  }

  // ================================================================
  // Helpers
  // ================================================================

  clear(): void {
    this.deselectBlock();
    for (const item of this.placed) {
      this.engine.scene.remove(item.object);
      this.physics.removeBody(item.body);
      disposeObject(item.object);
    }
    this.placed = [];
    this.objectToPrimitive.clear();
  }

  getCount(): number {
    return this.placed.length;
  }

  // ----------------------------------------------------------------
  // Private helpers
  // ----------------------------------------------------------------

  private addToWorld(object: THREE.Object3D, blockType: BlockType): PlacedPrimitive {
    const box = new THREE.Box3().setFromObject(object);
    const size = new THREE.Vector3();
    const center = new THREE.Vector3();
    box.getSize(size);
    box.getCenter(center);

    // Build Cannon material from block physics properties
    const mat = new CANNON.Material(blockType.id);
    const worldDefault = this.physics.world.defaultContactMaterial;
    const contactMat = new CANNON.ContactMaterial(mat, worldDefault.materials[0] ?? mat, {
      friction: blockType.physics.friction,
      restitution: blockType.physics.restitution,
    });
    this.physics.world.addContactMaterial(contactMat);

    const body = new CANNON.Body({
      mass: 0,
      type: CANNON.Body.STATIC,
      material: mat,
      shape: new CANNON.Box(
        new CANNON.Vec3(
          Math.max(size.x, 0.1) / 2,
          Math.max(size.y, 0.1) / 2,
          Math.max(size.z, 0.1) / 2,
        ),
      ),
      position: new CANNON.Vec3(center.x, center.y, center.z),
    });

    // Sync rotation from mesh
    body.quaternion.set(
      object.quaternion.x,
      object.quaternion.y,
      object.quaternion.z,
      object.quaternion.w,
    );

    this.physics.addBody(body);

    return { object, body, lastSize: size.clone() };
  }

  /** Legacy: add to world without block-type physics properties */
  private addToWorldForObject(object: THREE.Object3D): PlacedPrimitive {
    const box = new THREE.Box3().setFromObject(object);
    const size = new THREE.Vector3();
    const center = new THREE.Vector3();
    box.getSize(size);
    box.getCenter(center);

    const body = new CANNON.Body({
      mass: 0,
      type: CANNON.Body.STATIC,
      shape: new CANNON.Box(
        new CANNON.Vec3(
          Math.max(size.x, 0.6) / 2,
          Math.max(size.y, 0.6) / 2,
          Math.max(size.z, 0.6) / 2,
        ),
      ),
      position: new CANNON.Vec3(center.x, center.y, center.z),
    });

    this.physics.addBody(body);
    return { object, body, lastSize: size.clone() };
  }

  /** Create a Three.js object for a typed block with its texture */
  private createVisualObject(
    shape: PrimitiveType,
    textureManager: TextureManager,
    textureName: string,
  ): THREE.Object3D {
    const object = this.createLegacyObject(shape);

    // Apply texture to all meshes in the object
    const tex = textureManager.getTexture(textureName);
    if (tex) {
      object.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          const cloned = tex.clone();
          cloned.needsUpdate = true;
          if (child.material instanceof THREE.MeshStandardMaterial) {
            child.material = child.material.clone();
            (child.material as THREE.MeshStandardMaterial).map = cloned;
            child.material.needsUpdate = true;
          }
        }
      });
    }

    return object;
  }

  /** Create the raw Three.js primitive for a PrimitiveType (unchanged shapes) */
  private createLegacyObject(type: PrimitiveType): THREE.Object3D {
    switch (type) {
      case 'box':
        return ShapeFactory.createBox(1.8, 1.8, 1.8);
      case 'sphere':
        return ShapeFactory.createSphere(1);
      case 'cone':
        return ShapeFactory.createCone(0.9, 1.8);
      case 'cylinder':
        return ShapeFactory.createCylinder(0.9, 0.9, 1.8);
      case 'wheel':
        return ShapeFactory.createWheel(1, 0.25);
      case 'teapot':
        return ShapeFactory.createTeapot(1.2);
      case 'torusknot':
        return ShapeFactory.createTorusKnot(0.9, 0.25);
      default:
        return ShapeFactory.createBox();
    }
  }
}

// ================================================================
// Disposal helper (not a method so it can be called on non-class objects)
// ================================================================

function position(object: THREE.Object3D, pos: THREE.Vector3): void {
  object.position.copy(pos);
}

function disposeObject(obj: THREE.Object3D): void {
  obj.traverse((child) => {
    if (child instanceof THREE.Mesh) {
      child.geometry?.dispose();
      const mat = child.material;
      if (Array.isArray(mat)) mat.forEach((m) => m.dispose());
      else mat?.dispose();
    }
  });
}
