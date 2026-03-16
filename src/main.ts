import * as THREE from 'three';
import { Engine } from './core/Engine';
import { InputManager } from './core/InputManager';
import { PhysicsWorld } from './core/PhysicsWorld';
import { LightingSystem } from './systems/LightingSystem';
import { TextureManager } from './systems/TextureManager';
import { PlayerController } from './entities/PlayerController';
import { LevelManager } from './levels/LevelManager';
import { LEVEL_PARKOUR_CITY } from './levels/LevelData';
import { DebugGUI } from './ui/DebugGUI';

/**
 * Game - Main game class orchestrating all systems
 */
class Game {
  private engine: Engine;
  private input: InputManager;
  private physics: PhysicsWorld;
  private lighting: LightingSystem;
  private textureManager: TextureManager;
  private player: PlayerController;
  private levelManager: LevelManager;
  private debugGUI: DebugGUI;

  // Game state
  private isRunning = false;
  private isPaused = false;
  private score = 0;
  private elapsedTime = 0;
  private deathY = -10; // Y below which player "dies"
  private isStarted = false;

  // UI Elements
  private hudEl: HTMLElement;
  private scoreEl: HTMLElement;
  private timeEl: HTMLElement;
  private speedEl: HTMLElement;
  private startScreen: HTMLElement;
  private deathScreen: HTMLElement;
  private pauseScreen: HTMLElement;
  private loadingScreen: HTMLElement;

  constructor() {
    const canvas = document.getElementById('game-canvas') as HTMLCanvasElement;

    // Core systems
    this.engine = new Engine(canvas);
    this.input = new InputManager(canvas);
    this.physics = new PhysicsWorld();

    // Texture manager - generate procedural textures
    this.textureManager = new TextureManager();
    this.textureManager.createCheckerboard();
    this.textureManager.createBrickTexture();
    this.textureManager.createMetalTexture();
    this.textureManager.createGrassTexture();
    this.textureManager.createStoneTexture();
    this.textureManager.createWoodTexture();

    // Lighting
    this.lighting = new LightingSystem(this.engine);

    // Level
    this.levelManager = new LevelManager(
      this.engine,
      this.physics,
      this.textureManager,
    );
    this.levelManager.loadLevel(LEVEL_PARKOUR_CITY);

    // Player
    const spawnPos = this.levelManager.getSpawnPosition();
    this.player = new PlayerController(
      this.engine,
      this.input,
      this.physics,
      spawnPos,
    );

    // Debug GUI
    this.debugGUI = new DebugGUI(
      this.engine,
      this.lighting,
      this.textureManager,
    );
    this.debugGUI.hide(); // Hidden by default

    // UI references
    this.hudEl = document.getElementById('hud')!;
    this.scoreEl = document.getElementById('hud-score')!;
    this.timeEl = document.getElementById('hud-time')!;
    this.speedEl = document.getElementById('hud-speed')!;
    this.startScreen = document.getElementById('start-screen')!;
    this.deathScreen = document.getElementById('death-screen')!;
    this.pauseScreen = document.getElementById('pause-screen')!;
    this.loadingScreen = document.getElementById('loading')!;

    this.setupEventListeners();
    this.setupSkybox();

    // Hide loading screen
    this.loadingScreen.classList.add('hidden');
    setTimeout(() => {
      this.loadingScreen.style.display = 'none';
    }, 500);
  }

  private setupSkybox(): void {
    // Create a gradient sky using a large sphere
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
          float h = normalize(vWorldPosition + offset).y;
          gl_FragColor = vec4(mix(bottomColor, topColor, max(pow(max(h, 0.0), exponent), 0.0)), 1.0);
        }
      `,
      side: THREE.BackSide,
    });
    const sky = new THREE.Mesh(skyGeo, skyMat);
    this.engine.scene.add(sky);
  }

  private setupEventListeners(): void {
    // Start button
    document.getElementById('btn-start')!.addEventListener('click', () => {
      this.startGame();
    });

    // Restart button
    document.getElementById('btn-restart')!.addEventListener('click', () => {
      this.restartGame();
    });

    // Resume button
    document.getElementById('btn-resume')!.addEventListener('click', () => {
      this.resumeGame();
    });

    // Keyboard shortcuts
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

    // Shape spawning shortcuts (1-7)
    const shapeKeys: Record<string, string> = {
      '1': 'box',
      '2': 'sphere',
      '3': 'cone',
      '4': 'cylinder',
      '5': 'wheel',
      '6': 'teapot',
      '7': 'torusknot',
    };
    for (const [key, shape] of Object.entries(shapeKeys)) {
      this.input.onKeyPress(key, () => {
        if (this.isStarted) {
          this.debugGUI.spawnShapeAtCamera(shape);
        }
      });
    }
  }

  private startGame(): void {
    this.isStarted = true;
    this.isRunning = true;
    this.isPaused = false;
    this.score = 0;
    this.elapsedTime = 0;

    this.startScreen.style.display = 'none';
    this.deathScreen.classList.remove('active');
    this.pauseScreen.classList.remove('active');
    this.hudEl.style.display = '';

    // Lock pointer for FPS controls
    this.input.requestPointerLock();

    // Start the game loop
    this.engine.clock.start();
    this.gameLoop();
  }

  private pauseGame(): void {
    this.isRunning = false;
    this.isPaused = true;
    this.pauseScreen.classList.add('active');
    this.input.exitPointerLock();
  }

  private resumeGame(): void {
    this.isPaused = false;
    this.isRunning = true;
    this.pauseScreen.classList.remove('active');
    this.input.requestPointerLock();
    this.engine.clock.start(); // Reset delta
    this.gameLoop();
  }

  private restartGame(): void {
    const spawnPos = this.levelManager.getSpawnPosition();
    this.player.respawn(spawnPos);
    this.score = 0;
    this.elapsedTime = 0;
    this.isRunning = true;
    this.isPaused = false;

    this.deathScreen.classList.remove('active');
    this.pauseScreen.classList.remove('active');
    this.hudEl.style.display = '';

    this.input.requestPointerLock();
    this.engine.clock.start();
    this.gameLoop();
  }

  private playerDied(): void {
    this.isRunning = false;
    this.input.exitPointerLock();

    const deathScoreEl = document.getElementById('death-score')!;
    deathScoreEl.textContent = `Score: ${this.score} | Time: ${this.elapsedTime.toFixed(1)}s`;
    this.deathScreen.classList.add('active');
  }

  private gameLoop(): void {
    if (!this.isRunning) return;

    requestAnimationFrame(() => this.gameLoop());

    const dt = Math.min(this.engine.clock.getDelta(), 0.05); // Cap delta time

    // Physics
    this.physics.step(dt);

    // Player update
    this.player.update(dt);
    this.input.resetMouseDelta();

    // Level update (moving platforms, decorations)
    this.levelManager.update(dt);

    // Update sun shadow position to follow player
    const playerPos = this.player.getPosition();
    this.lighting.updateSunPosition(playerPos.x, playerPos.z);

    // Update perspective params for GUI display
    this.engine.perspectiveParams.positionX = this.engine.camera.position.x;
    this.engine.perspectiveParams.positionY = this.engine.camera.position.y;
    this.engine.perspectiveParams.positionZ = this.engine.camera.position.z;

    // Check death
    if (playerPos.y < this.deathY) {
      this.playerDied();
      return;
    }

    // Score based on distance traveled
    this.elapsedTime += dt;
    this.score = Math.max(
      this.score,
      Math.floor(Math.abs(playerPos.z) + playerPos.y * 2),
    );

    // Update HUD
    this.updateHUD();

    // Render
    this.engine.render();
  }

  private updateHUD(): void {
    this.scoreEl.textContent = `Score: ${this.score}`;
    this.timeEl.textContent = `Time: ${this.elapsedTime.toFixed(1)}s`;
    this.speedEl.textContent = `Speed: ${this.player.getSpeed().toFixed(1)}`;
  }
}

// Boot the game
window.addEventListener('DOMContentLoaded', () => {
  new Game();
});
