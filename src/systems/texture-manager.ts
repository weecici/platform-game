import * as THREE from "three";

export interface TextureSetPaths {
  baseColor?: string;
  normal?: string;
  roughness?: string;
  ao?: string;
  metallic?: string;
  height?: string;
}

export interface TextureSet {
  baseColor?: THREE.Texture;
  normal?: THREE.Texture;
  roughness?: THREE.Texture;
  ao?: THREE.Texture;
  metallic?: THREE.Texture;
  height?: THREE.Texture;
}

/**
 * TextureManager - Handles loading and applying textures to objects.
 * Supports loading from bitmap/image files and procedural textures.
 */
export class TextureManager {
  private textureLoader: THREE.TextureLoader;
  private textures: Map<string, THREE.Texture> = new Map();
  private textureSets: Map<string, TextureSet> = new Map();
  private cubeTextureLoader: THREE.CubeTextureLoader;

  constructor() {
    this.textureLoader = new THREE.TextureLoader();
    this.cubeTextureLoader = new THREE.CubeTextureLoader();
  }

  /**
   * Load a texture from URL
   */
  async loadTexture(name: string, url: string): Promise<THREE.Texture> {
    const texture = await this.loadTextureFromUrl(url, true);
    this.textures.set(name, texture);
    return texture;
  }

  /**
   * Load a full PBR texture set from explicit URLs.
   */
  async loadTextureSet(
    name: string,
    paths: TextureSetPaths,
  ): Promise<TextureSet> {
    const set: TextureSet = {};

    const load = async (
      url: string | undefined,
      isColor: boolean,
    ): Promise<THREE.Texture | undefined> => {
      if (!url) return undefined;
      return this.loadTextureFromUrl(url, isColor);
    };

    const [baseColor, normal, roughness, ao, metallic, height] =
      await Promise.all([
        load(paths.baseColor, true),
        load(paths.normal, false),
        load(paths.roughness, false),
        load(paths.ao, false),
        load(paths.metallic, false),
        load(paths.height, false),
      ]);

    set.baseColor = baseColor;
    set.normal = normal;
    set.roughness = roughness;
    set.ao = ao;
    set.metallic = metallic;
    set.height = height;

    this.textureSets.set(name, set);

    // Keep compatibility with old single-map API and debug texture dropdown.
    if (set.baseColor) {
      this.textures.set(name, set.baseColor);
    }

    return set;
  }

  /**
   * Apply a full texture set (baseColor/normal/roughness/ao/metallic) to a mesh.
   * Returns true if a texture set with this name exists and was applied.
   */
  applyTextureSet(
    mesh: THREE.Mesh,
    textureSetName: string,
    repeatX = 1,
    repeatY = 1,
  ): boolean {
    const set = this.textureSets.get(textureSetName);
    if (!set) return false;
    if (!(mesh.material instanceof THREE.MeshStandardMaterial)) return false;

    const material = mesh.material;

    if (set.baseColor) {
      material.map = this.cloneTextureWithRepeat(
        set.baseColor,
        repeatX,
        repeatY,
      );
      material.color.setHex(0xffffff);
    }
    if (set.normal) {
      material.normalMap = this.cloneTextureWithRepeat(
        set.normal,
        repeatX,
        repeatY,
      );
    }
    if (set.roughness) {
      material.roughnessMap = this.cloneTextureWithRepeat(
        set.roughness,
        repeatX,
        repeatY,
      );
      material.roughness = 1.0;
    }
    if (set.ao) {
      this.ensureUv2(mesh.geometry);
      material.aoMap = this.cloneTextureWithRepeat(set.ao, repeatX, repeatY);
      material.aoMapIntensity = 1.0;
    }
    if (set.metallic) {
      material.metalnessMap = this.cloneTextureWithRepeat(
        set.metallic,
        repeatX,
        repeatY,
      );
      material.metalness = 1.0;
    }
    if (set.height) {
      material.displacementMap = this.cloneTextureWithRepeat(
        set.height,
        repeatX,
        repeatY,
      );
      material.displacementScale = 0.02;
    }

    material.needsUpdate = true;
    return true;
  }

  /**
   * Apply a texture to a mesh
   */
  applyTexture(
    mesh: THREE.Mesh,
    textureName: string,
    repeatX = 1,
    repeatY = 1,
  ): void {
    const texture = this.textures.get(textureName);
    if (!texture) return;

    const clonedTexture = texture.clone();
    clonedTexture.repeat.set(repeatX, repeatY);
    clonedTexture.needsUpdate = true;

    if (mesh.material instanceof THREE.MeshStandardMaterial) {
      mesh.material.map = clonedTexture;
      mesh.material.needsUpdate = true;
    }
  }

  /**
   * Get a texture by name
   */
  getTexture(name: string): THREE.Texture | undefined {
    return this.textures.get(name);
  }

  /**
   * Get a texture set by name.
   */
  getTextureSet(name: string): TextureSet | undefined {
    return this.textureSets.get(name);
  }

  /**
   * Get all available texture names
   */
  getTextureNames(): string[] {
    return Array.from(this.textures.keys());
  }

  private async loadTextureFromUrl(
    url: string,
    isColorTexture: boolean,
  ): Promise<THREE.Texture> {
    return new Promise((resolve, reject) => {
      this.textureLoader.load(
        url,
        (texture) => {
          texture.wrapS = THREE.RepeatWrapping;
          texture.wrapT = THREE.RepeatWrapping;
          texture.colorSpace = isColorTexture
            ? THREE.SRGBColorSpace
            : THREE.NoColorSpace;
          resolve(texture);
        },
        undefined,
        reject,
      );
    });
  }

  private cloneTextureWithRepeat(
    texture: THREE.Texture,
    repeatX: number,
    repeatY: number,
  ): THREE.Texture {
    const cloned = texture.clone();
    cloned.wrapS = THREE.RepeatWrapping;
    cloned.wrapT = THREE.RepeatWrapping;
    cloned.repeat.set(repeatX, repeatY);
    cloned.colorSpace = texture.colorSpace;
    cloned.needsUpdate = true;
    return cloned;
  }

  private ensureUv2(geometry: THREE.BufferGeometry): void {
    const uv = geometry.getAttribute("uv");
    const uv2 = geometry.getAttribute("uv2");
    if (!uv || uv2) return;

    const uvArray = (uv.array as Float32Array).slice();
    geometry.setAttribute("uv2", new THREE.BufferAttribute(uvArray, 2));
  }
}
