import * as THREE from 'three';

/**
 * Engine - Core rendering engine managing the Three.js renderer, scene, and camera.
 * Handles perspective projection with adjustable parameters.
 */
export interface PerspectiveParams {
  fov: number;
  near: number;
  far: number;
  positionX: number;
  positionY: number;
  positionZ: number;
}

/**
 * SpectatorController — free-fly noclip camera.
 * - Press O to toggle on/off
 * - Mouse (pointer-locked): look around freely
 * - WASD: move forward / back / left / right
 * - Space: fly up  |  Shift or C: fly down
 * - Scroll wheel: change movement speed
 */
class SpectatorController {
  private camera: THREE.PerspectiveCamera;
  private domElement: HTMLElement;

  private yaw = 0;   // horizontal rotation (radians)
  private pitch = 0; // vertical rotation (radians)

  private moveSpeed = 20;       // units/second
  private mouseSensitivity = 0.0015;

  private keys: Set<string> = new Set();
  private _enabled = false;

  private onMouseMove: (e: MouseEvent) => void;
  private onKeyDown: (e: KeyboardEvent) => void;
  private onKeyUp: (e: KeyboardEvent) => void;
  private onWheel: (e: WheelEvent) => void;
  private onPointerLockChange: () => void;

  constructor(camera: THREE.PerspectiveCamera, domElement: HTMLElement) {
    this.camera = camera;
    this.domElement = domElement;

    // Sync initial yaw/pitch from the camera's current rotation
    const euler = new THREE.Euler().setFromQuaternion(camera.quaternion, 'YXZ');
    this.yaw   = euler.y;
    this.pitch = euler.x;

    // --- Event handlers ---
    this.onMouseMove = (e: MouseEvent) => {
      if (!this._enabled || document.pointerLockElement !== this.domElement) return;
      this.yaw   -= e.movementX * this.mouseSensitivity;
      this.pitch -= e.movementY * this.mouseSensitivity;
      // Clamp pitch so we can't flip upside-down
      this.pitch = Math.max(-Math.PI / 2 + 0.01, Math.min(Math.PI / 2 - 0.01, this.pitch));
      this.applyRotation();
    };

    this.onKeyDown = (e: KeyboardEvent) => {
      if (this._enabled) this.keys.add(e.code);
    };

    this.onKeyUp = (e: KeyboardEvent) => {
      this.keys.delete(e.code);
    };

    this.onWheel = (e: WheelEvent) => {
      if (!this._enabled) return;
      this.moveSpeed = Math.max(1, this.moveSpeed - e.deltaY * 0.05);
    };

    this.onPointerLockChange = () => {
      // If the user pressed Escape (pointer lock exits), re-request if still in spectator mode
      if (this._enabled && document.pointerLockElement !== this.domElement) {
        // Small delay to avoid instant re-lock when user intentionally exits
        setTimeout(() => {
          if (this._enabled) this.domElement.requestPointerLock();
        }, 300);
      }
    };

    document.addEventListener('mousemove', this.onMouseMove);
    document.addEventListener('keydown', this.onKeyDown);
    document.addEventListener('keyup', this.onKeyUp);
    document.addEventListener('wheel', this.onWheel, { passive: true });
    document.addEventListener('pointerlockchange', this.onPointerLockChange);
  }

  get enabled() { return this._enabled; }

  set enabled(value: boolean) {
    this._enabled = value;
    if (value) {
      // Sync yaw/pitch to current camera orientation
      const euler = new THREE.Euler().setFromQuaternion(this.camera.quaternion, 'YXZ');
      this.yaw   = euler.y;
      this.pitch = euler.x;
      // Request pointer lock so mouse movements are captured
      this.domElement.requestPointerLock();
    } else {
      this.keys.clear();
      document.exitPointerLock();
    }
  }

  /** Apply yaw + pitch to camera quaternion */
  private applyRotation(): void {
    const q = new THREE.Quaternion();
    const qYaw   = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), this.yaw);
    const qPitch = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), this.pitch);
    q.multiplyQuaternions(qYaw, qPitch);
    this.camera.quaternion.copy(q);
  }

  /** Call this every frame with delta-time in seconds */
  update(dt: number): void {
    if (!this._enabled) return;

    const speed = this.moveSpeed * dt;

    // Build movement directions from camera orientation
    const forward = new THREE.Vector3();
    this.camera.getWorldDirection(forward);
    forward.y = 0;
    forward.normalize();

    const right = new THREE.Vector3();
    right.crossVectors(forward, new THREE.Vector3(0, 1, 0)).normalize();

    const move = new THREE.Vector3();

    if (this.keys.has('KeyW') || this.keys.has('ArrowUp'))    move.addScaledVector(forward,  1);
    if (this.keys.has('KeyS') || this.keys.has('ArrowDown'))  move.addScaledVector(forward, -1);
    if (this.keys.has('KeyA') || this.keys.has('ArrowLeft'))  move.addScaledVector(right,   -1);
    if (this.keys.has('KeyD') || this.keys.has('ArrowRight')) move.addScaledVector(right,    1);
    if (this.keys.has('Space'))                               move.y += 1;
    if (this.keys.has('ShiftLeft') || this.keys.has('ShiftRight') || this.keys.has('KeyC')) move.y -= 1;

    if (move.lengthSq() > 0) {
      move.normalize().multiplyScalar(speed);
      this.camera.position.add(move);
    }
  }

  dispose(): void {
    document.removeEventListener('mousemove', this.onMouseMove);
    document.removeEventListener('keydown', this.onKeyDown);
    document.removeEventListener('keyup', this.onKeyUp);
    document.removeEventListener('wheel', this.onWheel);
    document.removeEventListener('pointerlockchange', this.onPointerLockChange);
  }
}

// ─────────────────────────────────────────────────────────────────────────────

export class Engine {
  public renderer: THREE.WebGLRenderer;
  public scene: THREE.Scene;
  public camera: THREE.PerspectiveCamera;
  public clock: THREE.Clock;
  public perspectiveParams: PerspectiveParams;
  public isSpectatorMode: boolean = false;

  private canvas: HTMLCanvasElement;
  private spectator: SpectatorController;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.clock = new THREE.Clock();

    // Default perspective parameters
    this.perspectiveParams = {
      fov: 75,
      near: 0.1,
      far: 3000,
      positionX: 0,
      positionY: 5,
      positionZ: 10,
    };

    // Renderer setup with shadows
    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      powerPreference: 'high-performance',
    });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 2.5;

    // Scene
    this.scene = new THREE.Scene();

    // Camera with perspective projection
    const aspect = window.innerWidth / window.innerHeight;
    this.camera = new THREE.PerspectiveCamera(
      this.perspectiveParams.fov,
      aspect,
      this.perspectiveParams.near,
      this.perspectiveParams.far,
    );
    this.camera.position.set(
      this.perspectiveParams.positionX,
      this.perspectiveParams.positionY,
      this.perspectiveParams.positionZ,
    );

    // Free-fly spectator controller (disabled by default)
    this.spectator = new SpectatorController(this.camera, this.renderer.domElement);

    // Handle resize
    window.addEventListener('resize', this.onResize.bind(this));

    // Toggle spectator mode with 'O'
    window.addEventListener('keydown', (e) => {
      if (e.key === 'o' || e.key === 'O') {
        this.isSpectatorMode = !this.isSpectatorMode;
        this.spectator.enabled = this.isSpectatorMode;
      }
    });
  }

  /**
   * Update perspective projection parameters
   */
  updatePerspective(params: Partial<PerspectiveParams>): void {
    Object.assign(this.perspectiveParams, params);
    this.camera.fov = this.perspectiveParams.fov;
    this.camera.near = this.perspectiveParams.near;
    this.camera.far = this.perspectiveParams.far;
    this.camera.updateProjectionMatrix();
  }

  private onResize(): void {
    const width = window.innerWidth;
    const height = window.innerHeight;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }

  render(dt?: number): void {
    if (this.isSpectatorMode) {
      this.spectator.update(dt ?? 0.016);
    }
    this.renderer.render(this.scene, this.camera);
  }

  dispose(): void {
    this.spectator.dispose();
    this.renderer.dispose();
  }
}
