/**
 * InputManager - Centralized input handling for keyboard and mouse
 */
export class InputManager {
  public keys: Map<string, boolean> = new Map();
  public mouseMovementX = 0;
  public mouseMovementY = 0;
  public isPointerLocked = false;

  private canvas: HTMLCanvasElement;
  private keyDownCallbacks: Map<string, Array<() => void>> = new Map();

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;

    document.addEventListener('keydown', this.onKeyDown.bind(this));
    document.addEventListener('keyup', this.onKeyUp.bind(this));
    document.addEventListener('mousemove', this.onMouseMove.bind(this));
    document.addEventListener('pointerlockchange', this.onPointerLockChange.bind(this));
  }

  /**
   * Register a callback for when a specific key is pressed down
   */
  onKeyPress(key: string, callback: () => void): void {
    const lowerKey = key.toLowerCase();
    if (!this.keyDownCallbacks.has(lowerKey)) {
      this.keyDownCallbacks.set(lowerKey, []);
    }
    this.keyDownCallbacks.get(lowerKey)!.push(callback);
  }

  isKeyDown(key: string): boolean {
    return this.keys.get(key.toLowerCase()) || false;
  }

  requestPointerLock(): void {
    this.canvas.requestPointerLock();
  }

  exitPointerLock(): void {
    document.exitPointerLock();
  }

  /**
   * Call at end of each frame to reset per-frame mouse deltas
   */
  resetMouseDelta(): void {
    this.mouseMovementX = 0;
    this.mouseMovementY = 0;
  }

  private onKeyDown(e: KeyboardEvent): void {
    const key = e.key.toLowerCase();
    if (!this.keys.get(key)) {
      // First press - fire callbacks
      this.keys.set(key, true);
      this.keyDownCallbacks.get(key)?.forEach((cb) => cb());
    }
  }

  private onKeyUp(e: KeyboardEvent): void {
    this.keys.set(e.key.toLowerCase(), false);
  }

  private onMouseMove(e: MouseEvent): void {
    if (this.isPointerLocked) {
      this.mouseMovementX += e.movementX;
      this.mouseMovementY += e.movementY;
    }
  }

  private onPointerLockChange(): void {
    this.isPointerLocked = document.pointerLockElement === this.canvas;
  }

  dispose(): void {
    document.removeEventListener('keydown', this.onKeyDown.bind(this));
    document.removeEventListener('keyup', this.onKeyUp.bind(this));
    document.removeEventListener('mousemove', this.onMouseMove.bind(this));
  }
}
