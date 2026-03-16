import GUI from 'lil-gui';
import * as THREE from 'three';
import type { Engine } from '../core/Engine';
import type { LightingSystem } from '../systems/LightingSystem';
import { AffineTransforms, TransformMode } from '../systems/AffineTransforms';
import { ShapeFactory } from '../entities/ShapeFactory';
import type { TextureManager } from '../systems/TextureManager';

/**
 * DebugGUI - lil-gui based control panel for:
 * - Perspective projection parameters (fov, near, far, x, y, z)
 * - Affine transformations on selected objects
 * - Lighting configuration
 * - Texture selection
 * - Shape spawning
 */
export class DebugGUI {
  private gui: GUI;
  private engine: Engine;
  private lighting: LightingSystem;
  private textureManager: TextureManager;
  private selectedObject: THREE.Object3D | null = null;
  private spawnedObjects: THREE.Object3D[] = [];

  // Transform state
  private transformState = {
    mode: TransformMode.TRANSLATE as string,
    translateX: 0,
    translateY: 0,
    translateZ: 0,
    rotateX: 0,
    rotateY: 0,
    rotateZ: 0,
    scaleX: 1,
    scaleY: 1,
    scaleZ: 1,
  };

  constructor(
    engine: Engine,
    lighting: LightingSystem,
    textureManager: TextureManager,
  ) {
    this.engine = engine;
    this.lighting = lighting;
    this.textureManager = textureManager;

    this.gui = new GUI({ title: 'Debug Controls', width: 320 });
    this.gui.domElement.style.zIndex = '1000';
    this.gui.close(); // Start closed

    this.setupPerspectiveFolder();
    this.setupLightingFolder();
    this.setupTransformFolder();
    this.setupTextureFolder();
    this.setupShapeSpawner();
  }

  private setupPerspectiveFolder(): void {
    const folder = this.gui.addFolder('Perspective Projection');
    const params = this.engine.perspectiveParams;

    folder
      .add(params, 'fov', 20, 120, 1)
      .name('FOV')
      .onChange(() => this.engine.updatePerspective(params));
    folder
      .add(params, 'near', 0.01, 10, 0.01)
      .name('Near Plane')
      .onChange(() => this.engine.updatePerspective(params));
    folder
      .add(params, 'far', 50, 2000, 10)
      .name('Far Plane')
      .onChange(() => this.engine.updatePerspective(params));
    folder
      .add(params, 'positionX', -100, 100, 0.5)
      .name('Camera X')
      .listen();
    folder
      .add(params, 'positionY', -100, 100, 0.5)
      .name('Camera Y')
      .listen();
    folder
      .add(params, 'positionZ', -100, 100, 0.5)
      .name('Camera Z')
      .listen();

    folder.close();
  }

  private setupLightingFolder(): void {
    const folder = this.gui.addFolder('Lighting');
    const config = this.lighting.config;

    const ambientFolder = folder.addFolder('Ambient Light');
    ambientFolder
      .addColor(config, 'ambientColor')
      .name('Color')
      .onChange(() => this.lighting.updateConfig(config));
    ambientFolder
      .add(config, 'ambientIntensity', 0, 2, 0.05)
      .name('Intensity')
      .onChange(() => this.lighting.updateConfig(config));

    const dirFolder = folder.addFolder('Directional (Sun)');
    dirFolder
      .addColor(config, 'directionalColor')
      .name('Color')
      .onChange(() => this.lighting.updateConfig(config));
    dirFolder
      .add(config, 'directionalIntensity', 0, 5, 0.1)
      .name('Intensity')
      .onChange(() => this.lighting.updateConfig(config));
    dirFolder
      .add(config.directionalPosition, 'x', -100, 100, 1)
      .name('Pos X')
      .onChange(() =>
        this.lighting.directionalLight.position.set(
          config.directionalPosition.x,
          config.directionalPosition.y,
          config.directionalPosition.z,
        ),
      );
    dirFolder
      .add(config.directionalPosition, 'y', 0, 200, 1)
      .name('Pos Y')
      .onChange(() =>
        this.lighting.directionalLight.position.set(
          config.directionalPosition.x,
          config.directionalPosition.y,
          config.directionalPosition.z,
        ),
      );

    const pointFolder = folder.addFolder('Point Light');
    pointFolder
      .addColor(config, 'pointColor')
      .name('Color')
      .onChange(() => this.lighting.updateConfig(config));
    pointFolder
      .add(config, 'pointIntensity', 0, 5, 0.1)
      .name('Intensity')
      .onChange(() => this.lighting.updateConfig(config));
    pointFolder
      .add(config, 'pointDistance', 0, 100, 1)
      .name('Distance')
      .onChange(() => this.lighting.updateConfig(config));

    folder.close();
  }

  private setupTransformFolder(): void {
    const folder = this.gui.addFolder('Affine Transforms');
    const state = this.transformState;

    folder.add(state, 'mode', {
      'Translate (Tinh Tien)': TransformMode.TRANSLATE,
      'Rotate (Quay)': TransformMode.ROTATE,
      'Scale (Ti Le)': TransformMode.SCALE,
    }).name('Mode');

    const transFolder = folder.addFolder('Translation');
    transFolder.add(state, 'translateX', -50, 50, 0.1).name('X').onChange(() => this.applyTransform());
    transFolder.add(state, 'translateY', -50, 50, 0.1).name('Y').onChange(() => this.applyTransform());
    transFolder.add(state, 'translateZ', -50, 50, 0.1).name('Z').onChange(() => this.applyTransform());

    const rotFolder = folder.addFolder('Rotation (degrees)');
    rotFolder.add(state, 'rotateX', -180, 180, 1).name('X').onChange(() => this.applyTransform());
    rotFolder.add(state, 'rotateY', -180, 180, 1).name('Y').onChange(() => this.applyTransform());
    rotFolder.add(state, 'rotateZ', -180, 180, 1).name('Z').onChange(() => this.applyTransform());

    const scaleFolder = folder.addFolder('Scale');
    scaleFolder.add(state, 'scaleX', 0.1, 5, 0.1).name('X').onChange(() => this.applyTransform());
    scaleFolder.add(state, 'scaleY', 0.1, 5, 0.1).name('Y').onChange(() => this.applyTransform());
    scaleFolder.add(state, 'scaleZ', 0.1, 5, 0.1).name('Z').onChange(() => this.applyTransform());

    folder.add({ reset: () => this.resetTransform() }, 'reset').name('Reset Transform');

    folder.close();
  }

  private setupTextureFolder(): void {
    const folder = this.gui.addFolder('Texture Mapping');
    const texOptions: Record<string, string> = { None: 'none' };
    for (const name of this.textureManager.getTextureNames()) {
      texOptions[name.charAt(0).toUpperCase() + name.slice(1)] = name;
    }

    const state = { texture: 'none', repeatX: 1, repeatY: 1 };

    folder.add(state, 'texture', texOptions).name('Texture').onChange((val: string) => {
      if (this.selectedObject && val !== 'none') {
        this.selectedObject.traverse((child) => {
          if (child instanceof THREE.Mesh) {
            this.textureManager.applyTexture(child, val, state.repeatX, state.repeatY);
          }
        });
      }
    });
    folder.add(state, 'repeatX', 1, 10, 1).name('Repeat X');
    folder.add(state, 'repeatY', 1, 10, 1).name('Repeat Y');

    folder.close();
  }

  private setupShapeSpawner(): void {
    const folder = this.gui.addFolder('Spawn Shapes');
    const actions = {
      spawnBox: () => this.spawnShapeAtCamera('box'),
      spawnSphere: () => this.spawnShapeAtCamera('sphere'),
      spawnCone: () => this.spawnShapeAtCamera('cone'),
      spawnCylinder: () => this.spawnShapeAtCamera('cylinder'),
      spawnWheel: () => this.spawnShapeAtCamera('wheel'),
      spawnTeapot: () => this.spawnShapeAtCamera('teapot'),
      spawnTorusKnot: () => this.spawnShapeAtCamera('torusknot'),
      clearAll: () => this.clearSpawnedObjects(),
    };

    folder.add(actions, 'spawnBox').name('Box (Hinh Hop)');
    folder.add(actions, 'spawnSphere').name('Sphere (Hinh Cau)');
    folder.add(actions, 'spawnCone').name('Cone (Hinh Non)');
    folder.add(actions, 'spawnCylinder').name('Cylinder (Hinh Tru)');
    folder.add(actions, 'spawnWheel').name('Wheel (Banh Xe)');
    folder.add(actions, 'spawnTeapot').name('Teapot (Am Tra)');
    folder.add(actions, 'spawnTorusKnot').name('Torus Knot');
    folder.add(actions, 'clearAll').name('Clear All Spawned');

    folder.close();
  }

  /**
   * Spawn a shape in front of the camera
   */
  spawnShapeAtCamera(type: string): void {
    let obj: THREE.Object3D;

    const forward = new THREE.Vector3(0, 0, -5);
    forward.applyQuaternion(this.engine.camera.quaternion);
    const spawnPos = this.engine.camera.position.clone().add(forward);

    switch (type) {
      case 'box':
        obj = ShapeFactory.createBox();
        break;
      case 'sphere':
        obj = ShapeFactory.createSphere();
        break;
      case 'cone':
        obj = ShapeFactory.createCone();
        break;
      case 'cylinder':
        obj = ShapeFactory.createCylinder();
        break;
      case 'wheel':
        obj = ShapeFactory.createWheel();
        break;
      case 'teapot':
        obj = ShapeFactory.createTeapot();
        break;
      case 'torusknot':
        obj = ShapeFactory.createTorusKnot();
        break;
      default:
        obj = ShapeFactory.createBox();
    }

    obj.position.copy(spawnPos);
    this.engine.scene.add(obj);
    this.spawnedObjects.push(obj);
    this.selectObject(obj);
  }

  selectObject(obj: THREE.Object3D): void {
    this.selectedObject = obj;
    this.transformState.translateX = obj.position.x;
    this.transformState.translateY = obj.position.y;
    this.transformState.translateZ = obj.position.z;
    this.transformState.rotateX = THREE.MathUtils.radToDeg(obj.rotation.x);
    this.transformState.rotateY = THREE.MathUtils.radToDeg(obj.rotation.y);
    this.transformState.rotateZ = THREE.MathUtils.radToDeg(obj.rotation.z);
    this.transformState.scaleX = obj.scale.x;
    this.transformState.scaleY = obj.scale.y;
    this.transformState.scaleZ = obj.scale.z;
    this.gui.controllersRecursive().forEach((c) => c.updateDisplay());
  }

  private applyTransform(): void {
    if (!this.selectedObject) return;
    const s = this.transformState;

    AffineTransforms.setPosition(this.selectedObject, s.translateX, s.translateY, s.translateZ);
    AffineTransforms.setRotation(
      this.selectedObject,
      THREE.MathUtils.degToRad(s.rotateX),
      THREE.MathUtils.degToRad(s.rotateY),
      THREE.MathUtils.degToRad(s.rotateZ),
    );
    AffineTransforms.setScale(this.selectedObject, s.scaleX, s.scaleY, s.scaleZ);
  }

  private resetTransform(): void {
    this.transformState.translateX = 0;
    this.transformState.translateY = 3;
    this.transformState.translateZ = 0;
    this.transformState.rotateX = 0;
    this.transformState.rotateY = 0;
    this.transformState.rotateZ = 0;
    this.transformState.scaleX = 1;
    this.transformState.scaleY = 1;
    this.transformState.scaleZ = 1;
    this.applyTransform();
    this.gui.controllersRecursive().forEach((c) => c.updateDisplay());
  }

  private clearSpawnedObjects(): void {
    for (const obj of this.spawnedObjects) {
      this.engine.scene.remove(obj);
    }
    this.spawnedObjects = [];
    this.selectedObject = null;
  }

  toggle(): void {
    if (this.gui.domElement.style.display === 'none') {
      this.gui.domElement.style.display = '';
    } else {
      this.gui.domElement.style.display = 'none';
    }
  }

  show(): void {
    this.gui.domElement.style.display = '';
  }

  hide(): void {
    this.gui.domElement.style.display = 'none';
  }
}
