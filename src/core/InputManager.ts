/**
 * InputManager - Centralized input handling for keyboard and mouse
 */
export class InputManager {
  public keys: Map<string, boolean> = new Map();
  public mouseMovementX = 0;
  public mouseMovementY = 0;
  public isPointerLocked = false;
  public isGameplayActive = false;

  private canvas: HTMLCanvasElement;
  private keyDownCallbacks: Map<string, Array<() => void>> = new Map();
  private readonly gameplayKeys = new Set([
    'w',
    'a',
    's',
    'd',
    ' ',
    'shift',
    'p',
    'g',
    'r',
    'v',
    'b',
    '1',
    '2',
    '3',
    '4',
    '5',
    '6',
    '7',
    '8',
    '9',
    '0',
    'backspace',
    'arrowup',
    'arrowdown',
    'arrowleft',
    'arrowright',
  ]);

  private readonly handleKeyDown = (e: KeyboardEvent): void => this.onKeyDown(e);
  private readonly handleKeyUp = (e: KeyboardEvent): void => this.onKeyUp(e);
  private readonly handleMouseMove = (e: MouseEvent): void => this.onMouseMove(e);
  private readonly handlePointerLockChange = (): void => this.onPointerLockChange();
  private readonly handleBlur = (): void => this.resetAllKeys();

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;

    document.addEventListener('keydown', this.handleKeyDown);
    document.addEventListener('keyup', this.handleKeyUp);
    document.addEventListener('mousemove', this.handleMouseMove);
    document.addEventListener('pointerlockchange', this.handlePointerLockChange);
    window.addEventListener('blur', this.handleBlur);
  }

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
    this.canvas.focus();
    this.canvas.requestPointerLock();
  }

  exitPointerLock(): void {
    document.exitPointerLock();
  }

  resetMouseDelta(): void {
    this.mouseMovementX = 0;
    this.mouseMovementY = 0;
  }

  setGameplayActive(active: boolean): void {
    this.isGameplayActive = active;
    if (!active) {
      this.resetAllKeys();
      this.resetMouseDelta();
    }
  }

  private normalizeKey(e: KeyboardEvent): string {
    switch (e.code) {
      case 'Space':
        return ' ';
      case 'ShiftLeft':
      case 'ShiftRight':
        return 'shift';
      case 'Backspace':
        return 'backspace';
      case 'ArrowUp':
        return 'arrowup';
      case 'ArrowDown':
        return 'arrowdown';
      case 'ArrowLeft':
        return 'arrowleft';
      case 'ArrowRight':
        return 'arrowright';
      default:
        return e.key.toLowerCase();
    }
  }

  private shouldCaptureKey(key: string): boolean {
    return this.isGameplayActive && this.gameplayKeys.has(key);
  }

  private onKeyDown(e: KeyboardEvent): void {
    const key = this.normalizeKey(e);
    if (this.shouldCaptureKey(key)) {
      e.preventDefault();
      e.stopPropagation();
    }

    if (!this.keys.get(key)) {
      this.keys.set(key, true);
      this.keyDownCallbacks.get(key)?.forEach((cb) => cb());
    }
  }

  private onKeyUp(e: KeyboardEvent): void {
    const key = this.normalizeKey(e);
    if (this.shouldCaptureKey(key)) {
      e.preventDefault();
      e.stopPropagation();
    }
    this.keys.set(key, false);
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

  private resetAllKeys(): void {
    this.keys.clear();
  }

  dispose(): void {
    document.removeEventListener('keydown', this.handleKeyDown);
    document.removeEventListener('keyup', this.handleKeyUp);
    document.removeEventListener('mousemove', this.handleMouseMove);
    document.removeEventListener('pointerlockchange', this.handlePointerLockChange);
    window.removeEventListener('blur', this.handleBlur);
  }
}
