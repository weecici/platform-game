import * as THREE from "three";
import * as CANNON from "cannon-es";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import type { Engine } from "../core/engine";
import type { InputManager } from "../core/input-manager";
import type { PhysicsWorld } from "../core/physics-world";

export interface PlayerConfig {
  moveSpeed: number;
  sprintMultiplier: number;
  jumpForce: number;
  mouseSensitivity: number;
  playerHeight: number;
  playerRadius: number;
  maxPitchAngle: number;
  /** Percentage of max speed achieved per second (e.g. 0.99 = 99% speed in 1s) */
  groundAccel: number;
  /** Percentage of speed lost per second when braking (e.g. 0.95 = 95% speed lost in 1s) */
  groundDecel: number;
  /** Fraction of groundAccel available while airborne (0-1) */
  airControl: number;
  /** Per-second drag retention while airborne. Lower = more drag. Applied via pow(airDrag, time) */
  airDrag: number;
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
  private ungroundedTimer = 0;
  private readonly coyoteTime = 0.15; // 150ms of leniency when leaving ground

  // Character Model
  private modelGroup!: THREE.Group;
  private mixer!: THREE.AnimationMixer;
  private actions: Map<string, THREE.AnimationAction> = new Map();
  private currentActionName = "";
  private isModelLoaded = false;

  public isDead = false;

  // Camera Settings
  private cameraOffset = new THREE.Vector3(0, 1.5, 4); // 3rd person offset
  private viewMode: "first" | "third" = "third";
  private thirdPersonView: "back" | "front" = "back";

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
      moveSpeed: 7,
      sprintMultiplier: 1.6,
      jumpForce: 10,
      mouseSensitivity: 0.002,
      playerHeight: 1.8,
      playerRadius: 0.4,
      maxPitchAngle: Math.PI / 2 - 0.1,
      // Momentum — these are percentages per second (0-0.99)
      groundAccel: 0.99, // 99% of top speed reached in 1 second
      groundDecel: 0.95, // 95% of current speed lost in 1 second (simulates friction/inertia)
      airControl: 1.0,   // percentage of ground acceleration while airborne
      airDrag: 0.9,      // percentage of speed after 1s airborne
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
    this.loadModel();
    this.syncCameraToBody();

    // View mode toggles
    this.input.onKeyPress("v", () => {
      this.viewMode = this.viewMode === "first" ? "third" : "first";
      if (this.viewMode === "first") {
        this.engine.camera.rotation.order = "YXZ";
      }
    });
    this.input.onKeyPress("b", () => {
      if (this.viewMode === "third") {
        this.thirdPersonView =
          this.thirdPersonView === "back" ? "front" : "back";
      }
    });
  }

  private loadModel(): void {
    this.modelGroup = new THREE.Group();
    this.engine.scene.add(this.modelGroup);

    const loader = new GLTFLoader();
    loader.load("/assets/characters/Ninja.gltf", (gltf) => {
      console.log(gltf.animations);
      const model = gltf.scene;

      // Enable shadows
      model.traverse((child) => {
        if ((child as THREE.Mesh).isMesh) {
          child.castShadow = true;
          child.receiveShadow = true;
        }
      });

      // Character's feet are usually at origin (y=0)
      // We want to align feet with the bottom of the physics sphere.
      // Since sphere center is at body.position, bottom is at -playerRadius.
      model.position.y = -this.config.playerRadius;

      // Scale the loaded character model to a reasonable size (adjust as needed)
      model.scale.setScalar(0.5);

      this.modelGroup.add(model);

      // Setup animations
      this.mixer = new THREE.AnimationMixer(model);
      gltf.animations.forEach((clip) => {
        const action = this.mixer.clipAction(clip);
        this.actions.set(clip.name, action);
      });

      this.playAnimation("Idle");
      this.isModelLoaded = true;
    });
  }

  private playAnimation(name: string, crossfadeTime = 0.2): void {
    if (name === this.currentActionName) return;

    const nextAction = this.actions.get(name);
    if (!nextAction) return;

    const prevAction = this.actions.get(this.currentActionName);

    nextAction.reset().fadeIn(crossfadeTime).play();

    if (name === "Death") {
      nextAction.setLoop(THREE.LoopOnce, 1);
      nextAction.clampWhenFinished = true;
    } else {
      nextAction.setLoop(THREE.LoopRepeat, Infinity);
    }

    if (prevAction) {
      prevAction.fadeOut(crossfadeTime);
    }

    this.currentActionName = name;
  }

  private animateModel(dt: number, speed: number): void {
    if (!this.isModelLoaded) return;

    if (this.mixer) {
      this.mixer.update(dt);
    }

    // Toggle visibility based on view mode
    this.modelGroup.visible = this.viewMode === "third";
    if (!this.modelGroup.visible) return;

    // Sync position
    this.modelGroup.position.copy(this.getPosition());

    // Smoothly rotate model to face movement direction
    if (this.direction.lengthSq() > 0.01) {
      // Math.atan2(x, z) gives rotation around Y axis.
      // A typical GLTF model faces +Z by default.
      // If we move forward (-Z), direction is (0, 0, -1). atan2(0, -1) = PI or -PI.
      const targetRotation = Math.atan2(this.direction.x, this.direction.z);

      // Find shortest path to target rotation
      let diff = targetRotation - this.modelGroup.rotation.y;
      // Normalize angle to [-PI, PI]
      diff = Math.atan2(Math.sin(diff), Math.cos(diff));

      // Interpolate
      this.modelGroup.rotation.y += diff * 15 * dt;
    }

    // Animations State Machine
    let nextAction = "Idle";
    const isMovingInput = this.direction.lengthSq() > 0.01;

    if (this.isDead) {
      nextAction = "Death";
    } else if (!this.isGrounded) {
      if (this.body.velocity.y > this.config.jumpForce * 0.8) {
        // Just started the jump (high upward velocity) -> Takeoff
        nextAction = "Jump";
      } else if (this.predictLanding()) {
        // Falling & close to ground -> Landing anticipation
        nextAction = "Jump_Land";
      } else {
        // Airborne (mid-air, apex, or falling far from ground) -> Airborne loop
        nextAction = "Jump_Idle";
      }
    } else if (isMovingInput) {
      if (this.isSprinting) {
        nextAction = "Run";
      } else {
        nextAction = "Walk";
      }
    }

    this.playAnimation(nextAction);
  }

  private predictLanding(): boolean {
    // Only predict landing when falling
    if (this.body.velocity.y >= 0) return false;

    this.groundCheckResult.reset();
    const from = new CANNON.Vec3(
      this.body.position.x,
      this.body.position.y,
      this.body.position.z,
    );
    // Look ahead 1.5 meters below the player to predict ground
    const to = new CANNON.Vec3(
      this.body.position.x,
      this.body.position.y - (this.config.playerRadius + 1.5),
      this.body.position.z,
    );

    this.physics.world.raycastClosest(
      from,
      to,
      { skipBackfaces: true },
      this.groundCheckResult,
    );

    return this.groundCheckResult.hasHit;
  }

  update(dt: number): void {
    this.handleMouseLook();
    this.updateGroundedState(dt);
    this.handleMovement(dt);
    this.handleJump();
    this.animateModel(dt, this.getSpeed());
    this.syncCameraToBody();
  }

  private handleMouseLook(): void {
    if (!this.input.isPointerLocked) {
      return;
    }

    this.yaw -= this.input.mouseMovementX * this.config.mouseSensitivity;
    this.pitch -= this.input.mouseMovementY * this.config.mouseSensitivity;

    if (this.viewMode === "first") {
      this.pitch = Math.max(
        -this.config.maxPitchAngle,
        Math.min(this.config.maxPitchAngle, this.pitch),
      );
    } else {
      // Don't look too far down or up in 3rd person
      this.pitch = Math.max(
        -this.config.maxPitchAngle + 0.5,
        Math.min(this.config.maxPitchAngle - 0.2, this.pitch),
      );
    }
  }

  /**
   * Momentum-based movement.
   *
   * Uses fixed per-frame interpolation factors instead of dt-based math
   * to avoid oscillation from tiny/unstable delta values.
   *
   * Ground + input  → lerp velocity vector toward target at groundAccel rate
   * Ground + no key → lerp velocity vector toward zero at groundDecel rate
   * Air    + input  → lerp at reduced rate (airControl fraction)
   * Air    + no key → drag via pow(airDrag, ungroundedTimer)  [accumulates over time]
   *
   * Diagonal: works on the velocity VECTOR, not per-component, so W+A gives
   * the exact same speed magnitude as W alone.
   */
  private handleMovement(dt: number): void {
    this.isSprinting = this.input.isKeyDown('shift');
    const targetSpeed =
      this.config.moveSpeed *
      (this.isSprinting ? this.config.sprintMultiplier : 1);

    // Compute desired horizontal direction
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

    const hasInput = this.direction.lengthSq() > 0;
    let vx = this.body.velocity.x;
    let vz = this.body.velocity.z;

    // ------------------------------------------------------------------
    // Step 1: Air drag (applied FIRST whenever airborne)
    // ------------------------------------------------------------------
    if (!this.isGrounded) {
      // airDrag is the percentage of speed retained per second.
      // E.g., 0.8 means 80% speed retained after 1 second in the air.
      const dragFactor = Math.pow(this.config.airDrag, this.ungroundedTimer);
      vx *= dragFactor;
      vz *= dragFactor;
    }

    // ------------------------------------------------------------------
    // Step 2: Acceleration / deceleration
    // ------------------------------------------------------------------
    if (hasInput) {
      this.direction.normalize();

      // Target velocity vector
      const tvx = this.direction.x * targetSpeed;
      const tvz = this.direction.z * targetSpeed;

      const accelP = this.isGrounded
        ? this.config.groundAccel
        : this.config.groundAccel * this.config.airControl;


      // Math.pow expects base > 0. Valid parameter range is 0 to 0.9999.
      const validAccel = Math.max(0, Math.min(accelP, 0.9999));

      // lerpFactor applies the "percentage reached per second" scaled dynamically by dt.
      // This is mathematically frame-rate independent!
      const lerpFactor = 1 - Math.pow(1 - validAccel, dt);

      if (Math.abs(tvx - vx) > Math.abs(tvx) * 0.2) {
        vx += (tvx - vx) * lerpFactor;
      } else if (this.isGrounded) {
        vx = tvx;
      }

      if (Math.abs(tvz - vz) > Math.abs(tvz) * 0.2) {
        vz += (tvz - vz) * lerpFactor;
      } else if (this.isGrounded) {
        vz = tvz;
      }

    } else {
      // No input → decelerate
      if (this.isGrounded) {
        // groundDecel is the percentage of speed lost per second.
        const validDecel = Math.max(0, Math.min(this.config.groundDecel, 0.9999));

        // Compute how much velocity remains after dt seconds.
        const dampFactor = Math.pow(1 - validDecel, dt);

        vx *= dampFactor;
        vz *= dampFactor;

        if (Math.sqrt(vx * vx + vz * vz) < this.config.moveSpeed / 4.0) {
          vx = 0;
          vz = 0;
        }
      }
    }

    // MUST use .set() for CANNON.Body velocity updates to reliably propagate,
    // assigning to .x and .z directly can fail to trigger internal sleep state wakeups
    // or proxy updates depending on CANNON configuration.
    // console.log("Old:", vx, vz)
    this.body.velocity.set(vx, this.body.velocity.y, vz);
  }

  private handleJump(): void {
    if (this.input.isKeyDown(" ") && this.isGrounded) {
      this.body.velocity.y = this.config.jumpForce;
      this.isGrounded = false;
      this.ungroundedTimer = this.coyoteTime; // instantly expire leniency
    }
  }

  private updateGroundedState(dt: number): void {
    let isTouchingGround = false;

    // Check all physical collision contacts to detect if we are standing on something.
    // This perfectly avoids any "bouncing" or relative-velocity delays.
    for (let i = 0; i < this.physics.world.contacts.length; i++) {
      const contact = this.physics.world.contacts[i];

      if (contact.bi === this.body || contact.bj === this.body) {
        const isBi = contact.bi === this.body;

        // Cannon's contact normal (ni) points from bi to bj
        // If the player is 'bi', normal points from player down to the floor (y < -0.5)
        // If the player is 'bj', normal points from floor up to the player (y > 0.5)
        if (isBi && contact.ni.y < -0.5) {
          isTouchingGround = true;
          break;
        } else if (!isBi && contact.ni.y > 0.5) {
          isTouchingGround = true;
          break;
        }
      }
    }

    if (isTouchingGround) {
      this.isGrounded = true;
      this.ungroundedTimer = 0;
    } else {
      this.ungroundedTimer += dt;
      if (this.ungroundedTimer >= this.coyoteTime) {
        this.isGrounded = false;
      }
    }
  }

  private syncCameraToBody(): void {
    if (this.viewMode === "first") {
      this.engine.camera.position.set(
        this.body.position.x,
        this.body.position.y + 1.5, // Move camera up to head level
        this.body.position.z,
      );
      this.engine.camera.rotation.order = "YXZ";
      this.engine.camera.rotation.y = this.yaw;
      this.engine.camera.rotation.x = this.pitch;
    } else {
      const targetPosition = this.getPosition();
      targetPosition.y += 1.5; // Target head level for looking

      const offset = this.cameraOffset.clone();
      if (this.thirdPersonView === "front") {
        offset.z = -offset.z; // Move camera to the front
      }

      // Apply pitch around x-axis, then yaw around y-axis
      const pitchQuat = new THREE.Quaternion().setFromAxisAngle(
        new THREE.Vector3(1, 0, 0),
        this.pitch,
      );
      const yawQuat = new THREE.Quaternion().setFromAxisAngle(
        new THREE.Vector3(0, 1, 0),
        this.yaw,
      );

      offset.applyQuaternion(pitchQuat);
      offset.applyQuaternion(yawQuat);

      this.engine.camera.position.copy(targetPosition).add(offset);
      this.engine.camera.lookAt(targetPosition);
    }
  }

  respawn(position: THREE.Vector3): void {
    this.body.position.set(position.x, position.y, position.z);
    this.body.velocity.set(0, 0, 0);
    this.body.angularVelocity.set(0, 0, 0);
    this.yaw = 0;
    this.pitch = 0;
    this.isGrounded = false;
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

  /**
   * The horizontal yaw angle (radians) used for both camera and player facing.
   * Shared between 1st-person and 3rd-person camera modes.
   */
  get aimYaw(): number {
    return this.yaw;
  }

  /**
   * The vertical pitch angle (radians) used for both camera modes.
   * Positive = looking up, negative = looking down.
   */
  get aimPitch(): number {
    return this.pitch;
  }
}
