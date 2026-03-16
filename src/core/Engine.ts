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

export class Engine {
  public renderer: THREE.WebGLRenderer;
  public scene: THREE.Scene;
  public camera: THREE.PerspectiveCamera;
  public clock: THREE.Clock;
  public perspectiveParams: PerspectiveParams;

  private canvas: HTMLCanvasElement;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.clock = new THREE.Clock();

    // Default perspective parameters
    this.perspectiveParams = {
      fov: 75,
      near: 0.1,
      far: 1000,
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
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.2;

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

    // Handle resize
    window.addEventListener('resize', this.onResize.bind(this));
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

  render(): void {
    this.renderer.render(this.scene, this.camera);
  }

  dispose(): void {
    this.renderer.dispose();
    window.removeEventListener('resize', this.onResize.bind(this));
  }
}
