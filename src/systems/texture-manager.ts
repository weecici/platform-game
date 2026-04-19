import * as THREE from 'three';

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
  async loadTextureSet(name: string, paths: TextureSetPaths): Promise<TextureSet> {
    const set: TextureSet = {};

    const load = async (
      url: string | undefined,
      isColor: boolean,
    ): Promise<THREE.Texture | undefined> => {
      if (!url) return undefined;
      return this.loadTextureFromUrl(url, isColor);
    };

    const [baseColor, normal, roughness, ao, metallic, height] = await Promise.all([
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
   * Generate a procedural checkerboard texture
   */
  createCheckerboard(
    size = 512,
    divisions = 8,
    color1 = '#ffffff',
    color2 = '#888888',
  ): THREE.Texture {
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d')!;

    const cellSize = size / divisions;
    for (let y = 0; y < divisions; y++) {
      for (let x = 0; x < divisions; x++) {
        ctx.fillStyle = (x + y) % 2 === 0 ? color1 : color2;
        ctx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize);
      }
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.colorSpace = THREE.SRGBColorSpace;
    this.textures.set('checkerboard', texture);
    return texture;
  }

  /**
   * Generate a procedural brick texture
   */
  createBrickTexture(width = 512, height = 512): THREE.Texture {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d')!;

    // Base color
    ctx.fillStyle = '#8B4513';
    ctx.fillRect(0, 0, width, height);

    const brickWidth = width / 4;
    const brickHeight = height / 8;
    const mortarSize = 3;

    for (let row = 0; row < 8; row++) {
      const offset = row % 2 === 0 ? 0 : brickWidth / 2;
      for (let col = -1; col < 5; col++) {
        const x = col * brickWidth + offset;
        const y = row * brickHeight;

        // Random brick color variation
        const r = 139 + Math.random() * 30 - 15;
        const g = 69 + Math.random() * 20 - 10;
        const b = 19 + Math.random() * 15 - 7;
        ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
        ctx.fillRect(
          x + mortarSize,
          y + mortarSize,
          brickWidth - mortarSize * 2,
          brickHeight - mortarSize * 2,
        );
      }
    }

    // Mortar lines
    ctx.fillStyle = '#A0A0A0';
    for (let row = 0; row <= 8; row++) {
      ctx.fillRect(0, row * brickHeight - mortarSize / 2, width, mortarSize);
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.colorSpace = THREE.SRGBColorSpace;
    this.textures.set('brick', texture);
    return texture;
  }

  /**
   * Generate a procedural metal/grid texture
   */
  createMetalTexture(size = 512): THREE.Texture {
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d')!;

    // Gradient base
    const gradient = ctx.createLinearGradient(0, 0, size, size);
    gradient.addColorStop(0, '#707080');
    gradient.addColorStop(0.5, '#909098');
    gradient.addColorStop(1, '#606070');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, size, size);

    // Add noise
    for (let i = 0; i < 5000; i++) {
      const x = Math.random() * size;
      const y = Math.random() * size;
      const brightness = Math.random() * 40 - 20;
      ctx.fillStyle = `rgba(${128 + brightness}, ${128 + brightness}, ${135 + brightness}, 0.3)`;
      ctx.fillRect(x, y, 2, 2);
    }

    // Grid lines
    ctx.strokeStyle = 'rgba(0,0,0,0.15)';
    ctx.lineWidth = 1;
    const gridSize = size / 8;
    for (let i = 0; i <= 8; i++) {
      ctx.beginPath();
      ctx.moveTo(i * gridSize, 0);
      ctx.lineTo(i * gridSize, size);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, i * gridSize);
      ctx.lineTo(size, i * gridSize);
      ctx.stroke();
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.colorSpace = THREE.SRGBColorSpace;
    this.textures.set('metal', texture);
    return texture;
  }

  /**
   * Generate a grass texture
   */
  createGrassTexture(size = 512): THREE.Texture {
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d')!;

    // Base green
    ctx.fillStyle = '#3a7d2c';
    ctx.fillRect(0, 0, size, size);

    // Grass blades
    for (let i = 0; i < 8000; i++) {
      const x = Math.random() * size;
      const y = Math.random() * size;
      const length = 3 + Math.random() * 8;
      const g = 80 + Math.random() * 80;
      ctx.strokeStyle = `rgba(${30 + Math.random() * 40}, ${g}, ${20 + Math.random() * 30}, 0.6)`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + (Math.random() - 0.5) * 4, y - length);
      ctx.stroke();
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.colorSpace = THREE.SRGBColorSpace;
    this.textures.set('grass', texture);
    return texture;
  }

  /**
   * Generate a stone/concrete texture
   */
  createStoneTexture(size = 512): THREE.Texture {
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d')!;

    // Base gray
    ctx.fillStyle = '#808080';
    ctx.fillRect(0, 0, size, size);

    // Noise for stone look
    for (let i = 0; i < 10000; i++) {
      const x = Math.random() * size;
      const y = Math.random() * size;
      const brightness = 100 + Math.random() * 60;
      ctx.fillStyle = `rgba(${brightness}, ${brightness}, ${brightness + 5}, 0.4)`;
      ctx.fillRect(x, y, 1 + Math.random() * 3, 1 + Math.random() * 3);
    }

    // Cracks
    ctx.strokeStyle = 'rgba(60,60,60,0.3)';
    ctx.lineWidth = 1;
    for (let i = 0; i < 10; i++) {
      ctx.beginPath();
      let cx = Math.random() * size;
      let cy = Math.random() * size;
      ctx.moveTo(cx, cy);
      for (let j = 0; j < 5; j++) {
        cx += (Math.random() - 0.5) * 60;
        cy += (Math.random() - 0.5) * 60;
        ctx.lineTo(cx, cy);
      }
      ctx.stroke();
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.colorSpace = THREE.SRGBColorSpace;
    this.textures.set('stone', texture);
    return texture;
  }

  /**
   * Create a wood texture
   */
  createWoodTexture(size = 512): THREE.Texture {
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d')!;

    // Base wood color
    ctx.fillStyle = '#8B6914';
    ctx.fillRect(0, 0, size, size);

    // Wood grain
    for (let y = 0; y < size; y++) {
      const wave = Math.sin(y * 0.05) * 20 + Math.sin(y * 0.02) * 10;
      const brightness = 100 + wave + Math.random() * 15;
      ctx.fillStyle = `rgb(${brightness + 30}, ${brightness - 10}, ${brightness - 60})`;
      ctx.fillRect(0, y, size, 1);
    }

    // Add grain details
    for (let i = 0; i < 3000; i++) {
      const x = Math.random() * size;
      const y = Math.random() * size;
      ctx.fillStyle = `rgba(${60 + Math.random() * 40}, ${30 + Math.random() * 30}, ${10 + Math.random() * 20}, 0.2)`;
      ctx.fillRect(x, y, 1 + Math.random() * 8, 1);
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.colorSpace = THREE.SRGBColorSpace;
    this.textures.set('wood', texture);
    return texture;
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
      material.map = this.cloneTextureWithRepeat(set.baseColor, repeatX, repeatY);
      material.color.setHex(0xffffff);
    }
    if (set.normal) {
      material.normalMap = this.cloneTextureWithRepeat(set.normal, repeatX, repeatY);
    }
    if (set.roughness) {
      material.roughnessMap = this.cloneTextureWithRepeat(set.roughness, repeatX, repeatY);
      material.roughness = 1.0;
    }
    if (set.ao) {
      this.ensureUv2(mesh.geometry);
      material.aoMap = this.cloneTextureWithRepeat(set.ao, repeatX, repeatY);
      material.aoMapIntensity = 1.0;
    }
    if (set.metallic) {
      material.metalnessMap = this.cloneTextureWithRepeat(set.metallic, repeatX, repeatY);
      material.metalness = 1.0;
    }
    if (set.height) {
      material.displacementMap = this.cloneTextureWithRepeat(set.height, repeatX, repeatY);
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
    const uv = geometry.getAttribute('uv');
    const uv2 = geometry.getAttribute('uv2');
    if (!uv || uv2) return;

    const uvArray = (uv.array as Float32Array).slice();
    geometry.setAttribute('uv2', new THREE.BufferAttribute(uvArray, 2));
  }
}
