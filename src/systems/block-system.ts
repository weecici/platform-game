import type { PrimitiveType } from './primitive-placement';

/**
 * BlockSystem – one block type per primitive shape.
 * Texture is selected separately via the Debug GUI per-object.
 * Inventory starts at 0; player must collect pickups on the map.
 */
export interface BlockType {
  id: string;
  label: string;
  /** Emoji icon shown in hotbar & inventory */
  icon: string;
  /** Three.js primitive shape key */
  shape: PrimitiveType;
  physics: {
    friction: number;
    restitution: number;
  };
}

/**
 * The six block types mapped to keys 1-6.
 * One shape per slot — texture is orthogonal and can be changed in the debug UI.
 */
export const BLOCK_CATALOGUE: BlockType[] = [
  {
    id: 'box',
    label: 'Box',
    icon: '📦',
    shape: 'box',
    physics: { friction: 0.6, restitution: 0.0 },
  },
  {
    id: 'sphere',
    label: 'Sphere',
    icon: '⚽',
    shape: 'sphere',
    physics: { friction: 0.4, restitution: 0.3 },
  },
  {
    id: 'cone',
    label: 'Cone',
    icon: '🔺',
    shape: 'cone',
    physics: { friction: 0.5, restitution: 0.1 },
  },
  {
    id: 'cylinder',
    label: 'Cylinder',
    icon: '🛢️',
    shape: 'cylinder',
    physics: { friction: 0.6, restitution: 0.1 },
  },
  {
    id: 'wheel',
    label: 'Wheel',
    icon: '🍩',
    shape: 'wheel',
    physics: { friction: 0.5, restitution: 0.2 },
  },
  {
    id: 'teapot',
    label: 'Teapot',
    icon: '🫖',
    shape: 'teapot',
    physics: { friction: 0.4, restitution: 0.15 },
  },
];

/**
 * BlockInventory – tracks how many of each block type the player has collected.
 * Starts at ZERO; the player collects blocks from pickups on the map.
 */
export class BlockInventory {
  private counts: Map<string, number> = new Map();

  constructor() {
    this.reset();
  }

  /** Reset all counts to 0 (start of run). */
  reset(): void {
    this.counts.clear();
    for (const bt of BLOCK_CATALOGUE) {
      this.counts.set(bt.id, 0);
    }
  }

  /** Can the player place one of this block type? */
  canPlace(blockType: BlockType): boolean {
    return (this.counts.get(blockType.id) ?? 0) > 0;
  }

  /** How many of this block type does the player currently hold? */
  remaining(blockType: BlockType): number {
    return this.counts.get(blockType.id) ?? 0;
  }

  /** Spend one block (on placement). */
  use(blockType: BlockType): void {
    const current = this.counts.get(blockType.id) ?? 0;
    if (current > 0) {
      this.counts.set(blockType.id, current - 1);
    }
  }

  /** Gain one block (on collectible pickup). */
  add(blockTypeId: string): void {
    const current = this.counts.get(blockTypeId) ?? 0;
    this.counts.set(blockTypeId, current + 1);
  }
}
