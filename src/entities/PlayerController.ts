import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import type { Engine } from '../core/Engine';
import type { InputManager } from '../core/InputManager';
import type { PhysicsWorld } from '../core/PhysicsWorld';

/**
 * PlayerController - First-person parkour player with physics
 * Handles: movement, jumping, sprinting, camera look, collision
 */
export interface PlayerConfig {
  moveSpeed: number;
  sprintMultiplier: number;
  jumpForce: number;
  mouseSensitivity: number;
  playerHeight: number;
  playerRadius: number;
  maxPitchAngle: number;
}

export class PlayerController {
  public body: CANNON.Body;
  public velocity: THREE.Vector3 = new THREE.Vector3();
  public isGrounded = false;
  public isSprinting = false;
  public config: PlayerConfig;

  private engine: Engine;
  private input: InputManager;
  private physics: PhysicsWorld;
  private yaw = 0;
  private pitch = 0;
  private direction = new THREE.Vector3();
  private frontVector = new THREE.Vector3();
  private sideVector = new THREE.Vector3();

  // Contact tracking for ground detection
  private contactNormal = new CANNON.Vec3();

  constructor(
    engine: Engine,
    input: InputManager,
    physics: PhysicsWorld,
    spawnPosition: THREE.Vector3 = new THREE.Vector3(0, 5, 0),
  ) {
    this.engine = engine;
    this.input = input;
    this.physics = physics;

    this.config = {
      moveSpeed: 8,
      sprintMultiplier: 1.6,
      jumpForce: 10,
      mouseSensitivity: 0.002,
      playerHeight: 1.8,
      playerRadius: 0.4,
      maxPitchAngle: Math.PI / 2 - 0.1,
    };

    // Physics body - capsule approximated as sphere
    const shape = new CANNON.Sphere(this.config.playerRadius);
    this.body = new CANNON.Body({
      mass: 80,
      shape,
      position: new CANNON.Vec3(
        spawnPosition.x,
        spawnPosition.y,
        spawnPosition.z,
      ),
      linearDamping: 0.05,
      angularDamping: 1.0, // Prevent rolling
      fixedRotation: true,
    });

    physics.addBody(this.body);

    // Ground contact detection
    this.body.addEventListener('collide', (e: { contact: CANNON.ContactEquation }) => {
      const contact = e.contact;
      // Determine which body is "this" vs the other
      if (contact.bi.id === this.body.id) {
        contact.ni.negate(this.contactNormal);
      } else {
        this.contactNormal.copy(contact.ni);
      }
      // If the contact normal points upward, we're on the ground
      if (this.contactNormal.y > 0.5) {
        this.isGrounded = true;
      }
    });
  }

  /**
   * Update player every frame
   */
  update(dt: number): void {
    this.handleMouseLook();
    this.handleMovement(dt);
    this.handleJump();
    this.syncCameraToBody();

    // Reset grounded flag - will be set by collision events
    // Use a slight delay to allow for edge detection
    if (this.body.velocity.y < -0.5) {
      this.isGrounded = false;
    }
  }

  private handleMouseLook(): void {
    const mx = this.input.mouseMovementX;
    const my = this.input.mouseMovementY;

    this.yaw -= mx * this.config.mouseSensitivity;
    this.pitch -= my * this.config.mouseSensitivity;

    // Clamp pitch
    this.pitch = Math.max(
      -this.config.maxPitchAngle,
      Math.min(this.config.maxPitchAngle, this.pitch),
    );

    // Apply rotation to camera
    this.engine.camera.rotation.order = 'YXZ';
    this.engine.camera.rotation.y = this.yaw;
    this.engine.camera.rotation.x = this.pitch;
  }

  private handleMovement(_dt: number): void {
    this.isSprinting = this.input.isKeyDown('shift');
    const speed =
      this.config.moveSpeed *
      (this.isSprinting ? this.config.sprintMultiplier : 1);

    // Get forward and right vectors from camera yaw
    this.frontVector.set(0, 0, -1);
    this.sideVector.set(1, 0, 0);

    const yawQuat = new THREE.Quaternion().setFromAxisAngle(
      new THREE.Vector3(0, 1, 0),
      this.yaw,
    );
    this.frontVector.applyQuaternion(yawQuat);
    this.sideVector.applyQuaternion(yawQuat);

    // Calculate desired direction
    this.direction.set(0, 0, 0);

    if (this.input.isKeyDown('w')) this.direction.add(this.frontVector);
    if (this.input.isKeyDown('s')) this.direction.sub(this.frontVector);
    if (this.input.isKeyDown('d')) this.direction.add(this.sideVector);
    if (this.input.isKeyDown('a')) this.direction.sub(this.sideVector);

    if (this.direction.length() > 0) {
      this.direction.normalize();
      this.body.velocity.x = this.direction.x * speed;
      this.body.velocity.z = this.direction.z * speed;
    } else {
      // Apply friction when not moving
      this.body.velocity.x *= 0.85;
      this.body.velocity.z *= 0.85;
    }
  }

  private handleJump(): void {
    if (this.input.isKeyDown(' ') && this.isGrounded) {
      this.body.velocity.y = this.config.jumpForce;
      this.isGrounded = false;
    }
  }

  private syncCameraToBody(): void {
    this.engine.camera.position.set(
      this.body.position.x,
      this.body.position.y + this.config.playerHeight * 0.4,
      this.body.position.z,
    );
  }

  /**
   * Reset player to a position
   */
  respawn(position: THREE.Vector3): void {
    this.body.position.set(position.x, position.y, position.z);
    this.body.velocity.set(0, 0, 0);
    this.body.angularVelocity.set(0, 0, 0);
    this.yaw = 0;
    this.pitch = 0;
    this.isGrounded = false;
  }

  /**
   * Get current speed for HUD
   */
  getSpeed(): number {
    const vx = this.body.velocity.x;
    const vz = this.body.velocity.z;
    return Math.sqrt(vx * vx + vz * vz);
  }

  /**
   * Get current position
   */
  getPosition(): THREE.Vector3 {
    return new THREE.Vector3(
      this.body.position.x,
      this.body.position.y,
      this.body.position.z,
    );
  }
}
