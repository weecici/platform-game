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

  // Character Model
  private modelGroup!: THREE.Group;
  private head!: THREE.Mesh;
  private torso!: THREE.Mesh;
  private leftArm!: THREE.Group;
  private rightArm!: THREE.Group;
  private leftLeg!: THREE.Group;
  private rightLeg!: THREE.Group;
  private animationTime = 0;

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
    this.createModel();
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

  private createLimb(width: number, height: number, depth: number, color: number): THREE.Group {
    const group = new THREE.Group();
    const material = new THREE.MeshStandardMaterial({ 
      color, 
      roughness: 0.7, 
      metalness: 0.1 
    });
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(width, height, depth), material);
    mesh.position.y = -height / 2; // Move mesh down so pivot is at top
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    group.add(mesh);
    return group;
  }

  private createModel(): void {
    this.modelGroup = new THREE.Group();

    // Materials - Minecraft/Roblox style colors
    const skinMaterial = new THREE.MeshStandardMaterial({ color: 0xffcc99, roughness: 0.6, metalness: 0.1 });
    const shirtMaterial = new THREE.MeshStandardMaterial({ color: 0x3366cc, roughness: 0.8, metalness: 0.1 });
    const pantsMaterial = new THREE.MeshStandardMaterial({ color: 0x223388, roughness: 0.9, metalness: 0.1 });

    // Head
    this.head = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.5, 0.5), skinMaterial);
    this.head.position.y = 0.65;
    this.head.castShadow = true;
    this.head.receiveShadow = true;
    this.modelGroup.add(this.head);

    // Torso
    this.torso = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.8, 0.4), shirtMaterial);
    this.torso.castShadow = true;
    this.torso.receiveShadow = true;
    this.modelGroup.add(this.torso);

    // Arms
    this.leftArm = this.createLimb(0.3, 0.8, 0.3, 0xffcc99);
    this.leftArm.position.set(-0.55, 0.4, 0);
    this.modelGroup.add(this.leftArm);

    this.rightArm = this.createLimb(0.3, 0.8, 0.3, 0xffcc99);
    this.rightArm.position.set(0.55, 0.4, 0);
    this.modelGroup.add(this.rightArm);

    // Legs
    this.leftLeg = this.createLimb(0.35, 0.9, 0.35, 0x223388);
    this.leftLeg.position.set(-0.2, -0.4, 0);
    this.modelGroup.add(this.leftLeg);

    this.rightLeg = this.createLimb(0.35, 0.9, 0.35, 0x223388);
    this.rightLeg.position.set(0.2, -0.4, 0);
    this.modelGroup.add(this.rightLeg);

    this.engine.scene.add(this.modelGroup);
  }

  private animateModel(dt: number, speed: number): void {
    if (!this.modelGroup) return;

    // Toggle visibility based on view mode
    this.modelGroup.visible = this.viewMode === 'third';
    if (!this.modelGroup.visible) return;

    // Sync position
    this.modelGroup.position.copy(this.getPosition());
    // Move model so legs align with bottom of physics sphere
    // The sphere has a radius of this.config.playerRadius (0.4) so its bottom is at y - 0.4.
    // The lowest point of the visual model legs is at -1.3. 
    // To align the lowest points (-1.3 to -0.4): modelGroup.y += 0.9.
    this.modelGroup.position.y += 0.9;
    
    // Rotate model to face movement direction based on yaw
    this.modelGroup.rotation.y = this.yaw;

    // Animations
    if (!this.isGrounded) {
      // Jump/Fall pose
      this.leftArm.rotation.x = Math.PI / 4;
      this.rightArm.rotation.x = Math.PI / 4;
      this.leftLeg.rotation.x = -Math.PI / 6;
      this.rightLeg.rotation.x = Math.PI / 6;
      this.head.rotation.x = 0;
    } else if (speed > 0.1) {
      // Run animation
      this.animationTime += dt * speed * (this.isSprinting ? 2.5 : 2.0);
      const swing = Math.sin(this.animationTime) * 1.2;
      
      this.leftArm.rotation.x = swing;
      this.rightArm.rotation.x = -swing;
      this.leftLeg.rotation.x = -swing;
      this.rightLeg.rotation.x = swing;
      
      // Slight bobbing for torso
      this.torso.rotation.y = Math.sin(this.animationTime) * 0.1;
      this.head.rotation.x = Math.sin(this.animationTime * 2) * 0.05;
    } else {
      // Idle pose
      this.animationTime += dt * 2;
      const breathe = Math.sin(this.animationTime) * 0.05;
      
      this.leftArm.rotation.x = breathe;
      this.rightArm.rotation.x = -breathe;
      this.leftArm.rotation.z = 0.1;
      this.rightArm.rotation.z = -0.1;
      
      this.leftLeg.rotation.x = 0;
      this.rightLeg.rotation.x = 0;
      this.torso.rotation.y = 0;
      
      this.head.rotation.x = Math.sin(this.animationTime * 0.5) * 0.05;
    }
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
