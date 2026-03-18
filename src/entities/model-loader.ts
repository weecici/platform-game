import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OBJLoader } from 'three/addons/loaders/OBJLoader.js';
import { FBXLoader } from 'three/addons/loaders/FBXLoader.js';

/**
 * ModelLoader - Loads 3D models from files (GLTF/GLB, OBJ, FBX)
 */
export class ModelLoader {
  private gltfLoader: GLTFLoader;
  private objLoader: OBJLoader;
  private fbxLoader: FBXLoader;
  private loadedModels: Map<string, THREE.Group> = new Map();

  constructor() {
    this.gltfLoader = new GLTFLoader();
    this.objLoader = new OBJLoader();
    this.fbxLoader = new FBXLoader();
  }

  /**
   * Load a GLTF/GLB model
   */
  async loadGLTF(url: string, name?: string): Promise<THREE.Group> {
    return new Promise((resolve, reject) => {
      this.gltfLoader.load(
        url,
        (gltf) => {
          const model = gltf.scene;
          model.traverse((child) => {
            if (child instanceof THREE.Mesh) {
              child.castShadow = true;
              child.receiveShadow = true;
            }
          });
          if (name) this.loadedModels.set(name, model);
          resolve(model);
        },
        undefined,
        (error) => reject(error),
      );
    });
  }

  /**
   * Load an OBJ model
   */
  async loadOBJ(url: string, name?: string): Promise<THREE.Group> {
    return new Promise((resolve, reject) => {
      this.objLoader.load(
        url,
        (obj) => {
          obj.traverse((child) => {
            if (child instanceof THREE.Mesh) {
              child.castShadow = true;
              child.receiveShadow = true;
            }
          });
          if (name) this.loadedModels.set(name, obj);
          resolve(obj);
        },
        undefined,
        (error) => reject(error),
      );
    });
  }

  /**
   * Load an FBX model
   */
  async loadFBX(url: string, name?: string): Promise<THREE.Group> {
    return new Promise((resolve, reject) => {
      this.fbxLoader.load(
        url,
        (fbx) => {
          fbx.traverse((child) => {
            if (child instanceof THREE.Mesh) {
              child.castShadow = true;
              child.receiveShadow = true;
            }
          });
          if (name) this.loadedModels.set(name, fbx);
          resolve(fbx);
        },
        undefined,
        (error) => reject(error),
      );
    });
  }

  /**
   * Auto-detect format and load
   */
  async load(url: string, name?: string): Promise<THREE.Group> {
    const ext = url.split('.').pop()?.toLowerCase();
    switch (ext) {
      case 'glb':
      case 'gltf':
        return this.loadGLTF(url, name);
      case 'obj':
        return this.loadOBJ(url, name);
      case 'fbx':
        return this.loadFBX(url, name);
      default:
        throw new Error(`Unsupported model format: ${ext}`);
    }
  }

  getModel(name: string): THREE.Group | undefined {
    return this.loadedModels.get(name)?.clone();
  }
}
