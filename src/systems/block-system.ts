import type { PrimitiveType } from './primitive-placement';

/**
 * BlockSystem – defines typed block catalogue with texture + physics properties.
 * Each block is a combination of a Shape and a Texture, and carries unique
 * physics interaction parameters.
 */
export interface BlockType {
  id: string;
  label: string;
  /** Emoji icon shown in hotbar */
  icon: string;
  /** Three.js primitive shape key */
  shape: PrimitiveType;
  /** Key into TextureManager */
  texture: string;
  physics: {
    /** Coulomb friction coefficient */
    friction: number;
    /** Coefficient of restitution (bounciness) */
    restitution: number;
  };
  /** Maximum number of this block type that can be placed in one run */
  maxCount: number;
}

/** The five block types the player can choose from (keys 1-5). */
export const BLOCK_CATALOGUE: BlockType[] = [
  {
    id: 'grass',
    label: 'Grass',
    icon: '🌿',
    shape: 'box',
    texture: 'grass',
    physics: { friction: 0.8, restitution: 0.1 },
    maxCount: 4,
  },
  {
    id: 'stone',
    label: 'Stone',
    icon: '🪨',
    shape: 'box',
    texture: 'stone',
    physics: { friction: 0.5, restitution: 0.0 },
    maxCount: 4,
  },
  {
    id: 'wood',
    label: 'Wood',
    icon: '🪵',
    shape: 'cylinder',
    texture: 'wood',
    physics: { friction: 0.7, restitution: 0.2 },
    maxCount: 3,
  },
  {
    id: 'ice',
    label: 'Ice',
    icon: '🧊',
    shape: 'box',
    texture: 'metal',
    physics: { friction: 0.05, restitution: 0.05 },
    maxCount: 3,
  },
  {
    id: 'bounce',
    label: 'Bounce',
    icon: '🎾',
    shape: 'sphere',
    texture: 'checkerboard',
    physics: { friction: 0.3, restitution: 0.85 },
    maxCount: 2,
  },
];

/**
 * BlockInventory tracks how many of each block type the player has used.
 */
export class BlockInventory {
  private used: Map<string, number> = new Map();

  constructor() {
    this.reset();
  }

  reset(): void {
    this.used.clear();
    for (const bt of BLOCK_CATALOGUE) {
      this.used.set(bt.id, 0);
    }
  }

  canPlace(blockType: BlockType): boolean {
    return (this.used.get(blockType.id) ?? 0) < blockType.maxCount;
  }

  remaining(blockType: BlockType): number {
    return blockType.maxCount - (this.used.get(blockType.id) ?? 0);
  }

  use(blockType: BlockType): void {
    const current = this.used.get(blockType.id) ?? 0;
    this.used.set(blockType.id, current + 1);
  }
}
