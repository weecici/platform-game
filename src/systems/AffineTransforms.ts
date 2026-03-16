import * as THREE from 'three';

/**
 * AffineTransforms - Provides affine transformation utilities
 * Supports: Translation, Rotation, Scale
 * All transformations can be applied interactively via mouse/keyboard
 */
export enum TransformMode {
  TRANSLATE = 'translate',
  ROTATE = 'rotate',
  SCALE = 'scale',
}

export class AffineTransforms {
  /**
   * Apply translation (Tinh tien)
   */
  static translate(
    object: THREE.Object3D,
    dx: number,
    dy: number,
    dz: number,
  ): void {
    object.position.x += dx;
    object.position.y += dy;
    object.position.z += dz;
  }

  /**
   * Apply rotation (Quay) - angles in radians
   */
  static rotate(
    object: THREE.Object3D,
    rx: number,
    ry: number,
    rz: number,
  ): void {
    object.rotation.x += rx;
    object.rotation.y += ry;
    object.rotation.z += rz;
  }

  /**
   * Apply scale (Ti le)
   */
  static scale(
    object: THREE.Object3D,
    sx: number,
    sy: number,
    sz: number,
  ): void {
    object.scale.x *= sx;
    object.scale.y *= sy;
    object.scale.z *= sz;
  }

  /**
   * Set absolute position
   */
  static setPosition(
    object: THREE.Object3D,
    x: number,
    y: number,
    z: number,
  ): void {
    object.position.set(x, y, z);
  }

  /**
   * Set absolute rotation from Euler angles (radians)
   */
  static setRotation(
    object: THREE.Object3D,
    x: number,
    y: number,
    z: number,
  ): void {
    object.rotation.set(x, y, z);
  }

  /**
   * Set absolute scale
   */
  static setScale(
    object: THREE.Object3D,
    x: number,
    y: number,
    z: number,
  ): void {
    object.scale.set(x, y, z);
  }

  /**
   * Apply a custom 4x4 transformation matrix
   */
  static applyMatrix(object: THREE.Object3D, matrix: THREE.Matrix4): void {
    object.applyMatrix4(matrix);
  }

  /**
   * Rotate around a specific axis by a given angle
   */
  static rotateAroundAxis(
    object: THREE.Object3D,
    axis: THREE.Vector3,
    angle: number,
  ): void {
    const quaternion = new THREE.Quaternion();
    quaternion.setFromAxisAngle(axis.normalize(), angle);
    object.quaternion.premultiply(quaternion);
  }

  /**
   * Build a composite affine transformation matrix
   */
  static buildMatrix(
    translation: THREE.Vector3,
    rotation: THREE.Euler,
    scale: THREE.Vector3,
  ): THREE.Matrix4 {
    const matrix = new THREE.Matrix4();
    const quaternion = new THREE.Quaternion().setFromEuler(rotation);
    matrix.compose(translation, quaternion, scale);
    return matrix;
  }
}
