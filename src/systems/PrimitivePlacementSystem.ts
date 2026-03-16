import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import type { Engine } from '../core/Engine';
import type { PhysicsWorld } from '../core/PhysicsWorld';
import { ShapeFactory } from '../entities/ShapeFactory';

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
}

export class PrimitivePlacementSystem {
  private engine: Engine;
  private physics: PhysicsWorld;
  private placed: PlacedPrimitive[] = [];

  constructor(engine: Engine, physics: PhysicsWorld) {
    this.engine = engine;
    this.physics = physics;
  }

  place(type: PrimitiveType, camera: THREE.Camera): THREE.Object3D {
    const object = this.createObject(type);
    const position = new THREE.Vector3(0, -0.2, -6);
    position.applyQuaternion(camera.quaternion);
    position.add(camera.position);

    object.position.copy(position);
    object.rotation.y = camera.rotation.y;

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

    this.engine.scene.add(object);
    this.physics.addBody(body);
    this.placed.push({ object, body });
    return object;
  }

  clear(): void {
    for (const item of this.placed) {
      this.engine.scene.remove(item.object);
      this.physics.removeBody(item.body);
      item.object.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          child.geometry.dispose();
          if (Array.isArray(child.material)) {
            child.material.forEach((material) => material.dispose());
          } else {
            child.material.dispose();
          }
        }
      });
    }
    this.placed = [];
  }

  getCount(): number {
    return this.placed.length;
  }

  private createObject(type: PrimitiveType): THREE.Object3D {
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
