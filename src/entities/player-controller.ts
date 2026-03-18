import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import type { Engine } from '../core/engine';
import type { InputManager } from '../core/input-manager';
import type { PhysicsWorld } from '../core/physics-world';

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

  // Character Model
  private modelGroup!: THREE.Group;
  private mixer!: THREE.AnimationMixer;
  private actions: Map<string, THREE.AnimationAction> = new Map();
  private currentActionName = '';
  private isModelLoaded = false;
  
  public isDead = false;

  // Camera Settings
  private cameraOffset = new THREE.Vector3(0, 1.5, 4); // 3rd person offset
  private viewMode: 'first' | 'third' = 'third';
  private thirdPersonView: 'back' | 'front' = 'back';

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
    this.loadModel();
    this.syncCameraToBody();

    // View mode toggles
    this.input.onKeyPress('v', () => {
      this.viewMode = this.viewMode === 'first' ? 'third' : 'first';
      if (this.viewMode === 'first') {
        this.engine.camera.rotation.order = 'YXZ';
      }
    });
    this.input.onKeyPress('b', () => {
      if (this.viewMode === 'third') {
        this.thirdPersonView = this.thirdPersonView === 'back' ? 'front' : 'back';
      }
    });
  }

  private loadModel(): void {
    this.modelGroup = new THREE.Group();
    this.engine.scene.add(this.modelGroup);

    const loader = new GLTFLoader();
    loader.load('/src/assets/characters/Man.glb', (gltf) => {
      console.log(gltf.animations)
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

      console.log(this.actions)

      this.playAnimation('HumanArmature|Man_Idle');
      this.isModelLoaded = true;
    });
  }

  private playAnimation(name: string, crossfadeTime = 0.2): void {
    if (name === this.currentActionName) return;

    const nextAction = this.actions.get(name);
    if (!nextAction) return;

    const prevAction = this.actions.get(this.currentActionName);

    nextAction.reset().fadeIn(crossfadeTime).play();

    if (name === 'HumanArmature|Man_Death') {
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
    this.modelGroup.visible = this.viewMode === 'third';
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
    let nextAction = 'HumanArmature|Man_Idle';
    
    if (this.isDead) {
      nextAction = 'HumanArmature|Man_Death';
    } else if (!this.isGrounded) {
      if (speed > 1.0) {
        nextAction = 'HumanArmature|Man_RunningJump';
      } else {
        nextAction = 'HumanArmature|Man_Jump';
      }
    } else if (speed > 0.1) {
      if (this.isSprinting) {
        nextAction = 'HumanArmature|Man_Run';
      } else {
        nextAction = 'HumanArmature|Man_Walk';
      }
    }

    this.playAnimation(nextAction);
  }

  update(dt: number): void {
    this.handleMouseLook();
    this.updateGroundedState();
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
    
    if (this.viewMode === 'first') {
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
    if (this.viewMode === 'first') {
      this.engine.camera.position.set(
        this.body.position.x,
        this.body.position.y + 1.5, // Move camera up to head level
        this.body.position.z,
      );
      this.engine.camera.rotation.order = 'YXZ';
      this.engine.camera.rotation.y = this.yaw;
      this.engine.camera.rotation.x = this.pitch;
    } else {
      const targetPosition = this.getPosition();
      targetPosition.y += 1.5; // Target head level for looking

      const offset = this.cameraOffset.clone();
      if (this.thirdPersonView === 'front') {
        offset.z = -offset.z; // Move camera to the front
      }
      
      // Apply pitch around x-axis, then yaw around y-axis
      const pitchQuat = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), this.pitch);
      const yawQuat = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), this.yaw);
      
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
}
