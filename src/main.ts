import * as THREE from 'three';
import { Engine } from './core/engine';
import { InputManager } from './core/input-manager';
import { PhysicsWorld } from './core/physics-world';
import { LightingSystem } from './systems/lighting-system';
import { TextureManager } from './systems/texture-manager';
import { PlayerController } from './entities/player-controller';
import { LevelManager } from './levels/level-manager';
import { LEVEL_PARKOUR_CITY } from './levels/level-data';
import { DebugGUI } from './ui/debug-ui';
import {
  PrimitivePlacementSystem,
  type PrimitiveType,
} from './systems/primitive-placement';
import { BLOCK_CATALOGUE, BlockInventory } from './systems/block-system';

class Game {
  private engine: Engine;
  private input: InputManager;
  private physics: PhysicsWorld;
  private lighting: LightingSystem;
  private textureManager: TextureManager;
  private player: PlayerController;
  private levelManager: LevelManager;
  private debugGUI: DebugGUI;
  private primitivePlacement: PrimitivePlacementSystem;
  private blockInventory: BlockInventory;

  private isRunning = false;
  private isPaused = false;
  private isDead = false;
  private isFinished = false;
  private score = 0;
  private elapsedTime = 0;
  private deathCount = 0;
  private deathY = -10;
  private isStarted = false;
  private animationFrameId: number | null = null;

  private hudEl: HTMLElement;
  private scoreEl: HTMLElement;
  private timeEl: HTMLElement;
  private speedEl: HTMLElement;
  private deathsEl: HTMLElement;
  private startScreen: HTMLElement;
  private deathScreen: HTMLElement;
  private pauseScreen: HTMLElement;
  private loadingScreen: HTMLElement;
  private captureHintEl: HTMLElement;

  constructor() {
    const canvas = document.getElementById('game-canvas') as HTMLCanvasElement;

    this.engine = new Engine(canvas);
    this.input = new InputManager(canvas);
    this.physics = new PhysicsWorld();

    this.textureManager = new TextureManager();
    this.textureManager.createCheckerboard();
    this.textureManager.createBrickTexture();
    this.textureManager.createMetalTexture();
    this.textureManager.createGrassTexture();
    this.textureManager.createStoneTexture();
    this.textureManager.createWoodTexture();

    this.lighting = new LightingSystem(this.engine);
    this.levelManager = new LevelManager(
      this.engine,
      this.physics,
      this.textureManager,
    );
    this.levelManager.loadLevel(LEVEL_PARKOUR_CITY);

    this.player = new PlayerController(
      this.engine,
      this.input,
      this.physics,
      this.levelManager.getSpawnPosition(),
    );

    this.primitivePlacement = new PrimitivePlacementSystem(
      this.engine,
      this.physics,
    );

    this.blockInventory = new BlockInventory();

    this.debugGUI = new DebugGUI(
      this.engine,
      this.lighting,
      this.textureManager,
      this.primitivePlacement,
      (type) => this.primitivePlacement.place(type as PrimitiveType, this.engine.camera),
      () => this.primitivePlacement.clear(),
    );
    this.debugGUI.hide();

    this.hudEl = document.getElementById('hud')!;
    this.scoreEl = document.getElementById('hud-score')!;
    this.timeEl = document.getElementById('hud-time')!;
    this.speedEl = document.getElementById('hud-speed')!;
    this.deathsEl = document.getElementById('hud-deaths')!;
    this.startScreen = document.getElementById('start-screen')!;
    this.deathScreen = document.getElementById('death-screen')!;
    this.pauseScreen = document.getElementById('pause-screen')!;
    this.loadingScreen = document.getElementById('loading')!;
    this.captureHintEl = document.getElementById('capture-hint')!;

    this.setupEventListeners();
    this.setupSkybox();

    this.loadingScreen.classList.add('hidden');
    setTimeout(() => {
      this.loadingScreen.style.display = 'none';
    }, 500);
  }

  private setupSkybox(): void {
    const skyGeo = new THREE.SphereGeometry(400, 32, 15);
    const skyMat = new THREE.ShaderMaterial({
      uniforms: {
        topColor: { value: new THREE.Color(0x0077ff) },
        bottomColor: { value: new THREE.Color(0xc8ddf0) },
        offset: { value: 20 },
        exponent: { value: 0.4 },
      },
      vertexShader: `
        varying vec3 vWorldPosition;
        void main() {
          vec4 worldPosition = modelMatrix * vec4(position, 1.0);
          vWorldPosition = worldPosition.xyz;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 topColor;
        uniform vec3 bottomColor;
        uniform float offset;
        uniform float exponent;
        varying vec3 vWorldPosition;
        void main() {
          float h = normalize(vWorldPosition + vec3(0.0, offset, 0.0)).y;
          gl_FragColor = vec4(mix(bottomColor, topColor, max(pow(max(h, 0.0), exponent), 0.0)), 1.0);
        }
      `,
      side: THREE.BackSide,
      depthWrite: false,
    });
    const sky = new THREE.Mesh(skyGeo, skyMat);
    this.engine.scene.add(sky);
  }

  private setupEventListeners(): void {
    document.getElementById('btn-start')!.addEventListener('click', () => {
      this.startGame();
    });

    document.getElementById('btn-restart')!.addEventListener('click', () => {
      this.restartGame();
    });

    document.getElementById('btn-resume')!.addEventListener('click', () => {
      this.resumeGame();
    });

    this.engine.renderer.domElement.addEventListener('click', () => {
      if (this.isStarted && this.isRunning && !this.input.isPointerLocked) {
        this.input.requestPointerLock();
      }
    });

    // Left mouse click → place block at ghost position
    this.engine.renderer.domElement.addEventListener('mousedown', (e) => {
      if (
        e.button === 0 &&
        this.isStarted &&
        this.isRunning &&
        this.input.isPointerLocked
      ) {
        const placed = this.primitivePlacement.confirmPlace(
          this.engine.camera,
          this.player.getPosition(),
          this.textureManager,
          this.blockInventory,
        );
        if (placed) {
          this.debugGUI.selectObject(placed);
          this.updateInventoryHUD();
        }
      }
    });

    // Scroll wheel → adjust ghost placement distance
    this.engine.renderer.domElement.addEventListener('wheel', (e) => {
      if (this.isStarted && this.isRunning && this.input.isPointerLocked) {
        // deltaY > 0 = scroll down = farther; < 0 = scroll up = closer
        const step = e.deltaY > 0 ? 0.5 : -0.5;
        this.primitivePlacement.adjustGhostDistance(step);
        this.showDistanceHint();
        e.preventDefault();
      }
    }, { passive: false });

    document.addEventListener('pointerlockchange', () => {
      const shouldShowHint =
        this.isStarted &&
        this.isRunning &&
        !this.isPaused &&
        !this.input.isPointerLocked;
      this.captureHintEl.classList.toggle('visible', shouldShowHint);
    });

    this.input.onKeyPress('p', () => {
      if (this.isStarted && this.isRunning) {
        this.pauseGame();
      } else if (this.isPaused) {
        this.resumeGame();
      }
    });

    this.input.onKeyPress('g', () => {
      this.debugGUI.toggle();
    });

    this.input.onKeyPress('r', () => {
      if (this.isStarted) {
        this.restartGame();
      }
    });

    // Keys 1-5: select typed block for placement (ghost preview)
    // Keys 6-7: legacy debug-mode shape placement
    const blockKeys: Record<string, number> = {
      '1': 0, '2': 1, '3': 2, '4': 3, '5': 4,
    };
    const legacyShapeKeys: Record<string, PrimitiveType | null> = {
      '6': 'wheel',
      '7': 'torusknot',
      '8': null,
      '9': null,
      '0': null,
    };

    for (const [key, idx] of Object.entries(blockKeys)) {
      this.input.onKeyPress(key, () => {
        if (this.isStarted && this.isRunning) {
          this.activateHotbarSlot(key);
          const blockType = BLOCK_CATALOGUE[idx];
          this.primitivePlacement.selectBlock(blockType, this.textureManager);
        }
      });
    }

    for (const [key, shape] of Object.entries(legacyShapeKeys)) {
      this.input.onKeyPress(key, () => {
        if (this.isStarted && this.isRunning) {
          this.activateHotbarSlot(key);
          // Deselect typed block when switching to legacy keys
          this.primitivePlacement.deselectBlock();
          if (shape) {
            this.debugGUI.spawnShapeAtCamera(shape);
          }
        }
      });
    }

    this.input.onKeyPress('backspace', () => {
      if (this.isStarted) {
        this.primitivePlacement.deselectBlock();
        this.primitivePlacement.clear();
        this.blockInventory.reset();
        this.updateInventoryHUD();
        document.querySelectorAll('.hotbar-slot').forEach(el => el.classList.remove('active'));
      }
    });
  }

  private activateHotbarSlot(key: string): void {
    document.querySelectorAll('.hotbar-slot').forEach(el => el.classList.remove('active'));
    const slot = document.getElementById(`slot-${key}`);
    if (slot) slot.classList.add('active');
  }

  private startGame(): void {
    this.cancelLoop();
    this.isStarted = true;
    this.isRunning = true;
    this.isPaused = false;
    this.isDead = false;
    this.isFinished = false;
    this.score = 0;
    this.elapsedTime = 0;
    this.input.setGameplayActive(true);

    this.startScreen.style.display = 'none';
    this.deathScreen.classList.remove('active');
    this.pauseScreen.classList.remove('active');
    this.hudEl.style.display = '';

    this.input.requestPointerLock();
    this.engine.clock.start();
    this.gameLoop();
  }

  private pauseGame(): void {
    this.cancelLoop();
    this.isRunning = false;
    this.isPaused = true;
    this.input.setGameplayActive(false);
    this.pauseScreen.classList.add('active');
    this.input.exitPointerLock();
  }

  private resumeGame(): void {
    this.cancelLoop();
    this.isPaused = false;
    this.isRunning = true;
    this.input.setGameplayActive(true);
    this.pauseScreen.classList.remove('active');
    this.input.requestPointerLock();
    this.engine.clock.start();
    this.gameLoop();
  }

  private restartGame(): void {
    this.cancelLoop();
    this.player.isDead = false;
    this.player.respawn(this.levelManager.getSpawnPosition());
    this.primitivePlacement.deselectBlock();
    this.primitivePlacement.clear();
    this.blockInventory.reset();
    this.score = 0;
    this.elapsedTime = 0;
    this.isRunning = true;
    this.isPaused = false;
    this.isDead = false;
    this.isFinished = false;
    this.input.setGameplayActive(true);

    this.deathScreen.classList.remove('active');
    this.pauseScreen.classList.remove('active');
    this.hudEl.style.display = '';

    this.updateInventoryHUD();
    document.querySelectorAll('.hotbar-slot').forEach(el => el.classList.remove('active'));

    this.input.requestPointerLock();
    this.engine.clock.start();
    this.gameLoop();
  }

  private playerDied(reason = 'You fell out of the course.'): void {
    if (this.isDead) return;

    this.cancelLoop();
    this.isRunning = false;
    this.isDead = true;
    this.deathCount += 1;
    this.input.setGameplayActive(false);
    this.input.exitPointerLock();

    const deathScoreEl = document.getElementById('death-score')!;
    deathScoreEl.textContent = `${reason} Score: ${this.score} | Time: ${this.elapsedTime.toFixed(1)}s`;
    this.deathScreen.classList.add('active');
  }

  private finishRun(): void {
    if (this.isFinished) return;

    this.cancelLoop();
    this.isRunning = false;
    this.isFinished = true;
    this.input.setGameplayActive(false);
    this.input.exitPointerLock();

    const deathScoreEl = document.getElementById('death-score')!;
    deathScoreEl.textContent = `You finished the course! Score: ${this.score} | Time: ${this.elapsedTime.toFixed(1)}s`;
    this.deathScreen.classList.add('active');
  }

  private gameLoop(): void {
    if (!this.isRunning) return;

    this.animationFrameId = requestAnimationFrame(() => this.gameLoop());

    const dt = Math.min(this.engine.clock.getDelta(), 0.05);
    this.physics.step(dt);
    this.player.update(dt);
    this.input.resetMouseDelta();
    this.levelManager.update(dt);

    // Update ghost preview position every frame
    this.primitivePlacement.updateGhost(this.engine.camera, this.player.getPosition());

    const playerPos = this.player.getPosition();
    this.lighting.updateSunPosition(playerPos.x, playerPos.z);

    this.engine.perspectiveParams.positionX = this.engine.camera.position.x;
    this.engine.perspectiveParams.positionY = this.engine.camera.position.y;
    this.engine.perspectiveParams.positionZ = this.engine.camera.position.z;

    if (playerPos.y < this.deathY) {
      this.playerDied();
      return;
    }

    if (this.levelManager.isPlayerAtFinish(playerPos)) {
      this.finishRun();
      return;
    }

    this.elapsedTime += dt;
    this.score = Math.max(
      this.score,
      Math.floor(
        Math.abs(playerPos.z) +
          playerPos.y * 2 +
          this.primitivePlacement.getCount() * 5,
      ),
    );

    this.updateHUD();
    this.engine.render();
  }

  private updateHUD(): void {
    this.scoreEl.textContent = `Score: ${this.score}`;
    this.timeEl.textContent = `Time: ${this.elapsedTime.toFixed(1)}s`;
    this.speedEl.textContent = `Speed: ${this.player.getSpeed().toFixed(1)}`;
    this.deathsEl.textContent = `Deaths: ${this.deathCount}`;
  }

  /** Flash the placement-distance hint briefly when scroll wheel is used */
  private distanceHintTimeout: ReturnType<typeof setTimeout> | null = null;
  private showDistanceHint(): void {
    const el = document.getElementById('placement-distance');
    if (!el) return;
    el.textContent = `📏 Distance: ${this.primitivePlacement.getGhostDistance().toFixed(1)}`;
    el.classList.add('visible');
    if (this.distanceHintTimeout) clearTimeout(this.distanceHintTimeout);
    this.distanceHintTimeout = setTimeout(() => el.classList.remove('visible'), 1200);
  }

  /** Update the block inventory HUD panel */
  updateInventoryHUD(): void {
    for (const bt of BLOCK_CATALOGUE) {
      const countEl = document.getElementById(`inv-count-${bt.id}`);
      if (countEl) {
        const rem = this.blockInventory.remaining(bt);
        countEl.textContent = `${rem}`;
        // Dim if depleted
        const card = document.getElementById(`inv-card-${bt.id}`);
        if (card) {
          card.classList.toggle('depleted', rem === 0);
        }
      }
    }
  }

  private cancelLoop(): void {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }
}

window.addEventListener('DOMContentLoaded', () => {
  new Game();
});
