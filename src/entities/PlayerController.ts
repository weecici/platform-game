import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import type { Engine } from '../core/Engine';
import type { InputManager } from '../core/InputManager';
import type { PhysicsWorld } from '../core/PhysicsWorld';

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
  private groundCheckResult = new CANNON.RaycastResult();

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
      angularDamping: 1,
      fixedRotation: true,
    });

    physics.addBody(this.body);
    this.syncCameraToBody();
  }

  update(dt: number): void {
    this.handleMouseLook();
    this.updateGroundedState();
    this.handleMovement(dt);
    this.handleJump();
    this.syncCameraToBody();
  }

  private handleMouseLook(): void {
    if (!this.input.isPointerLocked) {
      return;
    }

    this.yaw -= this.input.mouseMovementX * this.config.mouseSensitivity;
    this.pitch -= this.input.mouseMovementY * this.config.mouseSensitivity;
    this.pitch = Math.max(
      -this.config.maxPitchAngle,
      Math.min(this.config.maxPitchAngle, this.pitch),
    );

    this.engine.camera.rotation.order = 'YXZ';
    this.engine.camera.rotation.y = this.yaw;
    this.engine.camera.rotation.x = this.pitch;
  }

  private handleMovement(_dt: number): void {
    this.isSprinting = this.input.isKeyDown('shift');
    const speed =
      this.config.moveSpeed *
      (this.isSprinting ? this.config.sprintMultiplier : 1);

    this.frontVector.set(0, 0, -1);
    this.sideVector.set(1, 0, 0);

    const yawQuat = new THREE.Quaternion().setFromAxisAngle(
      new THREE.Vector3(0, 1, 0),
      this.yaw,
    );
    this.frontVector.applyQuaternion(yawQuat);
    this.sideVector.applyQuaternion(yawQuat);

    this.direction.set(0, 0, 0);
    if (this.input.isKeyDown('w')) this.direction.add(this.frontVector);
    if (this.input.isKeyDown('s')) this.direction.sub(this.frontVector);
    if (this.input.isKeyDown('d')) this.direction.add(this.sideVector);
    if (this.input.isKeyDown('a')) this.direction.sub(this.sideVector);

    if (this.direction.lengthSq() > 0) {
      this.direction.normalize();
      const airControl = this.isGrounded ? 1 : 0.35;
      this.body.velocity.x +=
        (this.direction.x * speed - this.body.velocity.x) * airControl;
      this.body.velocity.z +=
        (this.direction.z * speed - this.body.velocity.z) * airControl;
    } else {
      const damping = this.isGrounded ? 0.78 : 0.96;
      this.body.velocity.x *= damping;
      this.body.velocity.z *= damping;
    }
  }

  private handleJump(): void {
    if (this.input.isKeyDown(' ') && this.isGrounded) {
      this.body.velocity.y = this.config.jumpForce;
      this.isGrounded = false;
    }
  }

  private updateGroundedState(): void {
    this.groundCheckResult.reset();
    const from = new CANNON.Vec3(
      this.body.position.x,
      this.body.position.y,
      this.body.position.z,
    );
    const to = new CANNON.Vec3(
      this.body.position.x,
      this.body.position.y - (this.config.playerRadius + 0.2),
      this.body.position.z,
    );

    this.physics.world.raycastClosest(from, to, { skipBackfaces: true }, this.groundCheckResult);

    this.isGrounded = this.groundCheckResult.hasHit && this.body.velocity.y <= 1.5;
  }

  private syncCameraToBody(): void {
    this.engine.camera.position.set(
      this.body.position.x,
      this.body.position.y + this.config.playerHeight * 0.4,
      this.body.position.z,
    );
  }

  respawn(position: THREE.Vector3): void {
    this.body.position.set(position.x, position.y, position.z);
    this.body.velocity.set(0, 0, 0);
    this.body.angularVelocity.set(0, 0, 0);
    this.yaw = 0;
    this.pitch = 0;
    this.isGrounded = false;
    this.engine.camera.rotation.set(0, 0, 0);
    this.syncCameraToBody();
  }

  getSpeed(): number {
    const vx = this.body.velocity.x;
    const vz = this.body.velocity.z;
    return Math.sqrt(vx * vx + vz * vz);
  }

  getPosition(): THREE.Vector3 {
    return new THREE.Vector3(
      this.body.position.x,
      this.body.position.y,
      this.body.position.z,
    );
  }
}
