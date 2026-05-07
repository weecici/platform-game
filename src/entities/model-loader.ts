import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OBJLoader } from 'three/addons/loaders/OBJLoader.js';
import { FBXLoader } from 'three/addons/loaders/FBXLoader.js';
import { USDZLoader } from 'three/addons/loaders/USDZLoader.js';

/**
 * ModelLoader - Loads 3D models from files (GLTF/GLB, OBJ, FBX, USDZ)
 *
 * URL-based cache: the same file path is only fetched ONCE.
 * Every subsequent request receives a cheap .clone() of the cached group,
 * so placing 14 identical trees costs only 1 network round-trip.
 */
export class ModelLoader {
  private gltfLoader: GLTFLoader;
  private objLoader: OBJLoader;
  private fbxLoader: FBXLoader;
  private usdzLoader: USDZLoader;
  private loadedModels: Map<string, THREE.Group> = new Map();

  /** Cache: url → already-loaded master group */
  private urlCache: Map<string, THREE.Group> = new Map();
  /** In-flight dedup: url → promise that resolves to the master group */
  private pendingLoads: Map<string, Promise<THREE.Group>> = new Map();

  constructor() {
    this.gltfLoader = new GLTFLoader();
    this.objLoader = new OBJLoader();
    this.fbxLoader = new FBXLoader();
    this.usdzLoader = new USDZLoader();
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
   * Load a USDZ model
   */
  async loadUSDZ(url: string, name?: string): Promise<THREE.Group> {
    return new Promise((resolve, reject) => {
      this.usdzLoader.load(
        url,
        (usdz) => {
          usdz.traverse((child) => {
            if (child instanceof THREE.Mesh) {
              child.castShadow = true;
              child.receiveShadow = true;
            }
          });
          if (name) this.loadedModels.set(name, usdz);
          resolve(usdz);
        },
        undefined,
        (error) => reject(error),
      );
    });
  }

  /**
   * Auto-detect format and load.
   * Results are cached by URL — identical paths return a .clone() of the
   * master group without re-downloading the file.
   */
  async load(url: string, name?: string): Promise<THREE.Group> {
    // 1. Already cached → return a cheap clone immediately
    const cached = this.urlCache.get(url);
    if (cached) {
      const clone = cached.clone();
      if (name) this.loadedModels.set(name, clone);
      return clone;
    }

    // 2. Same URL is already being fetched → wait for that promise, then clone
    const inFlight = this.pendingLoads.get(url);
    if (inFlight) {
      const master = await inFlight;
      const clone = master.clone();
      if (name) this.loadedModels.set(name, clone);
      return clone;
    }

    // 3. First time seeing this URL → kick off the real load
    const ext = url.split('.').pop()?.toLowerCase();
    let loadPromise: Promise<THREE.Group>;
    switch (ext) {
      case 'glb':
      case 'gltf':
        loadPromise = this.loadGLTF(url);
        break;
      case 'obj':
        loadPromise = this.loadOBJ(url);
        break;
      case 'fbx':
        loadPromise = this.loadFBX(url);
        break;
      case 'usdz':
        loadPromise = this.loadUSDZ(url);
        break;
      default:
        return Promise.reject(new Error(`Unsupported model format: ${ext}`));
    }

    this.pendingLoads.set(url, loadPromise);

    const master = await loadPromise;
    this.urlCache.set(url, master);          // store master
    this.pendingLoads.delete(url);

    const clone = master.clone();
    if (name) this.loadedModels.set(name, clone);
    return clone;
  }

  getModel(name: string): THREE.Group | undefined {
    return this.loadedModels.get(name)?.clone();
  }
}
