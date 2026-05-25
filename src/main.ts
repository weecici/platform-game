/// <reference types="vite/client" />
import * as THREE from "three";
import { Engine } from "./core/engine";
import { InputManager } from "./core/input-manager";
import { PhysicsWorld } from "./core/physics-world";
import { LightingSystem } from "./systems/lighting-system";
import { TextureManager } from "./systems/texture-manager";
import { PlayerController } from "./entities/player-controller";
import { LevelManager } from "./levels/level-manager";
import { LEVEL_PARKOUR_CITY } from "./levels/level-data";
import { DebugGUI } from "./ui/debug-ui";
import { NPC } from "./entities/npc";
import { NPCDialog } from "./ui/npc-dialog";
import { PrimitivePlacementSystem } from "./systems/primitive-placement";
import { BLOCK_CATALOGUE, BlockInventory } from "./systems/block-system";
import { DayNightSystem } from "./systems/day-night-system";
import { SoundManager } from "./systems/sound-manager";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import {
  STORY_CONFIG,
  GameQuestState,
  getPantsRetrievedDialogue,
  getUfoBoardingDialogue,
} from "./data/story-data";

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
  private dayNightSystem: DayNightSystem;
  private soundManager: SoundManager;
  private npcs: { [id: string]: NPC } = {};
  private npcDialog: NPCDialog | null = null;

  // Quest and ending state tracking
  private npcTalkStates: { [npcId: string]: boolean } = {};
  private npcCompleteStates: { [npcId: string]: boolean } = {};
  private teleportedToRoof = false;
  private gameWon = false;

  private isRunning = false;
  private isPaused = false;
  private isDead = false;
  private isFinished = false;
  private score = 0;
  private elapsedTime = 0;
  private deathCount = 0;
  private deathY = -50.0;
  private isStarted = false;
  private animationFrameId: number | null = null;
  private deathSequenceTimer = 0;
  private readonly deathSequenceDuration = 1.2;
  private deathReason = "You fell out of the course.";
  private readonly springPos = new THREE.Vector3(-8.6, 0.7, -234.7);
  private springCooldown = 0;
  private readonly tireLaunchPos = new THREE.Vector3(-50, 35, -230);
  private tireLaunchCooldown = 0;
  private readonly cyl3Pos = new THREE.Vector3(-115, 52, -215);
  private cyl3Cooldown = 0;

  private dialogueLines = [
    "An astronaut tried to change his pants.",
    "However, a solar wind blew them away.",
    "It fell down to the Earth, on top of a highest building in a crowded city.",
    "To get it back without being noticed, the astronaut parked his UFO at a mountain nearby and started the journey to get his shorts back.",
    "Can you help him reach the top?",
  ];
  private currentDialogueIndex = 0;
  private readonly altPlat0 = new THREE.Vector3(109, 20, -231);
  private readonly altPlat1 = new THREE.Vector3(109, 20, -227);
  private altPlatCooldown = 0;
  private altPlatNext = -1; // -1 = uninitialized; 0 or 1 = which bounces next

  // Command console state
  private isCommandConsoleActive = false;
  private commandContainer!: HTMLElement;
  private commandInput!: HTMLInputElement;

  private hudEl: HTMLElement;
  private scoreEl: HTMLElement;
  private timeEl: HTMLElement;
  private speedEl: HTMLElement;
  private deathsEl: HTMLElement;
  private coordsEl: HTMLElement;
  private startScreen: HTMLElement;
  private deathScreen: HTMLElement;
  private pauseScreen: HTMLElement;
  private loadingScreen: HTMLElement;
  private captureHintEl: HTMLElement;

  // Character Selection UI & Preview Scene
  private charSelectScreen!: HTMLElement;
  private charListContainer!: HTMLElement;
  private btnSelectPlay!: HTMLButtonElement;
  private charPreviewCanvas!: HTMLCanvasElement;
  private selectedCharacterPath: string =
    "/assets/characters/Astronaut_FernandoTheFlamingo.gltf";

  private previewRenderer!: THREE.WebGLRenderer;
  private previewScene!: THREE.Scene;
  private previewCamera!: THREE.PerspectiveCamera;
  private previewMixer: THREE.AnimationMixer | null = null;
  private previewModel: THREE.Group | null = null;
  private previewRAF: number | null = null;
  private previewClock!: THREE.Clock;
  private previewActions: Map<string, THREE.AnimationAction> = new Map();

  constructor() {
    const canvas = document.getElementById("game-canvas") as HTMLCanvasElement;

    this.engine = new Engine(canvas);
    this.input = new InputManager(canvas);
    this.physics = new PhysicsWorld();

    this.textureManager = new TextureManager();

    this.lighting = new LightingSystem(this.engine);
    this.levelManager = new LevelManager(
      this.engine,
      this.physics,
      this.textureManager,
    );
    this.levelManager.loadLevel(LEVEL_PARKOUR_CITY);
    // Spawn all dynamic NPCs configured in the story registry
    for (const conf of STORY_CONFIG.npcs) {
      this.npcs[conf.id] = new NPC(this.engine, {
        modelPath: conf.modelPath,
        position: conf.position,
        interactionRadius: conf.interactionRadius,
        name: conf.name,
      });
      this.npcTalkStates[conf.id] = false;
      this.npcCompleteStates[conf.id] = false;
    }
    this.soundManager = new SoundManager();
    void this.soundManager.load("jump", "/assets/sfx/jump.wav");
    void this.soundManager.load("step", "/assets/sfx/step.mp3");
    void this.soundManager.load("typing", "/assets/sfx/typing.wav");
    void this.soundManager.load("bgm", "/assets/sfx/bgm.mp3");

    this.npcDialog = new NPCDialog();
    this.npcDialog.setOnCharTyped(() => this.soundManager.play("typing", 0.3));
    void this.loadExternalTextureSets();

    this.player = new PlayerController(
      this.engine,
      this.input,
      this.physics,
      this.levelManager.getSpawnPosition(),
      undefined,
      this.soundManager,
    );

    this.primitivePlacement = new PrimitivePlacementSystem(
      this.engine,
      this.physics,
    );

    this.blockInventory = new BlockInventory();
    this.dayNightSystem = new DayNightSystem(this.engine, this.lighting);

    this.debugGUI = new DebugGUI(
      this.engine,
      this.lighting,
      this.textureManager,
      this.primitivePlacement,
      (type) => this.primitivePlacement.place(type as any, this.engine.camera),
      () => this.primitivePlacement.clear(),
    );
    this.debugGUI.hide();

    this.hudEl = document.getElementById("hud")!;
    this.scoreEl = document.getElementById("hud-score")!;
    this.timeEl = document.getElementById("hud-time")!;
    this.speedEl = document.getElementById("hud-speed")!;
    this.deathsEl = document.getElementById("hud-deaths")!;
    this.coordsEl = document.getElementById("hud-coords")!;
    this.startScreen = document.getElementById("start-screen")!;
    this.deathScreen = document.getElementById("death-screen")!;
    this.pauseScreen = document.getElementById("pause-screen")!;
    this.loadingScreen = document.getElementById("loading")!;
    this.captureHintEl = document.getElementById("capture-hint")!;

    // Character selection UI bindings
    this.charSelectScreen = document.getElementById("character-select-screen")!;
    this.charListContainer = document.getElementById("char-list-container")!;
    this.btnSelectPlay = document.getElementById(
      "btn-select-play",
    ) as HTMLButtonElement;
    this.charPreviewCanvas = document.getElementById(
      "char-preview-canvas",
    ) as HTMLCanvasElement;

    this.setupEventListeners();

    this.loadingScreen.classList.add("hidden");
    setTimeout(() => {
      this.loadingScreen.style.display = "none";
    }, 500);
  }

  private async loadExternalTextureSets(): Promise<void> {
    try {
      await Promise.all([
        this.textureManager.loadTextureSet("grass", {
          baseColor: "/assets/textures/grass/baseColor.jpg",
        }),
        this.textureManager.loadTextureSet("marble-tiles", {
          baseColor: "/assets/textures/marble-tiles/baseColor.jpg",
        }),
        this.textureManager.loadTextureSet("ground-tiles-14", {
          baseColor: "/assets/textures/ground-tiles-14/baseColor.jpg",
        }),
        this.textureManager.loadTextureSet("stone-1", {
          baseColor: "/assets/textures/stone-1/baseColor.jpg",
        }),
        this.textureManager.loadTextureSet("stone-2", {
          baseColor: "/assets/textures/stone-2/baseColor.jpg",
        }),
      ]);

      // Refresh level so all already-created platform materials receive PBR maps.
      this.levelManager.loadLevel(LEVEL_PARKOUR_CITY);

      // Update Debug GUI texture dropdown with newly loaded textures
      if (this.debugGUI) {
        this.debugGUI.updateTextureDropdown();
      }
    } catch (error) {
      console.warn(
        "Failed to load external texture sets. Falling back to procedural textures.",
        error,
      );
    }
  }

  private setupEventListeners(): void {
    this.commandContainer = document.getElementById("command-container")!;
    this.commandInput = document.getElementById(
      "command-input",
    ) as HTMLInputElement;

    // Command console listener
    this.commandInput.addEventListener("keydown", (e) => {
      e.stopPropagation(); // prevent input manager from catching
      if (e.key === "Enter") {
        this.processCommand(this.commandInput.value);
        this.hideCommandConsole();
      } else if (e.key === "Escape") {
        this.hideCommandConsole();
      }
    });

    this.input.onKeyPress("/", () => {
      if (
        this.isStarted &&
        !this.isDead &&
        !this.isFinished &&
        !this.isPaused
      ) {
        if (!this.isCommandConsoleActive) {
          this.showCommandConsole();
        }
      }
    });

    // Interaction key for NPCs and UFO
    this.input.onKeyPress("f", () => {
      if (!this.isStarted || this.isDead || this.isFinished || this.isPaused)
        return;

      const playerPos = this.player.getPosition();
      const ufoPos = new THREE.Vector3(...STORY_CONFIG.ufoPosition);
      const isNearUfo = playerPos.distanceTo(ufoPos) <= 8.0;

      // Find the nearest active NPC within range dynamically from registry
      let activeNpcId: string | null = null;
      for (const id in this.npcs) {
        if (this.npcs[id].isPlayerNearby(playerPos)) {
          activeNpcId = id;
          break;
        }
      }

      if (!activeNpcId && !isNearUfo) return;

      void (async () => {
        // Freeze controls and exit pointer lock during dialogue
        this.input.setGameplayActive(false);
        this.input.exitPointerLock();

        if (isNearUfo) {
          await this.handleUfoInteraction();
        } else if (activeNpcId) {
          await this.handleNpcRegistryInteraction(activeNpcId);
        }

        // Restore game controls and cursor lock
        this.input.setGameplayActive(true);
        this.input.requestPointerLock();
      })();
    });

    document.getElementById("btn-start")!.addEventListener("click", () => {
      this.soundManager.resume();
      this.showCharacterSelection();
    });

    this.btnSelectPlay.addEventListener("click", () => {
      this.startDialogueSequence();
    });

    document.getElementById("btn-restart")!.addEventListener("click", () => {
      this.restartGame();
    });

    document.getElementById("btn-resume")!.addEventListener("click", () => {
      this.resumeGame();
    });

    this.engine.renderer.domElement.addEventListener("click", () => {
      if (this.isStarted && this.isRunning && !this.input.isPointerLocked) {
        this.input.requestPointerLock();
      }
    });

    // Left mouse click → place block at ghost position
    this.engine.renderer.domElement.addEventListener("mousedown", (e) => {
      if (
        e.button === 0 &&
        this.isStarted &&
        this.isRunning &&
        this.input.isPointerLocked &&
        !this.engine.isSpectatorMode
      ) {
        const placed = this.primitivePlacement.confirmPlace(
          this.engine.camera,
          this.player.getPosition(),
          this.player.aimYaw,
          this.player.aimPitch,
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
    this.engine.renderer.domElement.addEventListener(
      "wheel",
      (e) => {
        if (this.isStarted && this.isRunning && this.input.isPointerLocked) {
          // deltaY > 0 = scroll down = farther; < 0 = scroll up = closer
          const step = e.deltaY > 0 ? 0.5 : -0.5;
          this.primitivePlacement.adjustGhostDistance(step);
          this.showDistanceHint();
          e.preventDefault();
        }
      },
      { passive: false },
    );

    document.addEventListener("pointerlockchange", () => {
      const shouldShowHint =
        this.isStarted &&
        this.isRunning &&
        !this.isPaused &&
        !this.input.isPointerLocked;
      this.captureHintEl.classList.toggle("visible", shouldShowHint);
    });

    this.input.onKeyPress("p", () => {
      if (this.isStarted && this.isRunning) {
        this.pauseGame();
      } else if (this.isPaused) {
        this.resumeGame();
      }
    });

    this.input.onKeyPress("g", () => {
      this.debugGUI.toggle();
    });

    this.input.onKeyPress("r", () => {
      if (this.isStarted) {
        this.restartGame();
      }
    });

    this.input.onKeyPress("o", () => {
      if (this.isStarted && !this.isDead) {
        this.engine.setSpectatorMode(!this.engine.isSpectatorMode);
        this.player.isActive = !this.engine.isSpectatorMode;

        const helper = document.getElementById("spectator-hint");
        if (helper) {
          if (this.engine.isSpectatorMode) helper.classList.add("visible");
          else helper.classList.remove("visible");
        }
      }
    });

    this.input.onKeyPress("t", () => {
      if (this.engine.isSpectatorMode && this.isStarted && !this.isDead) {
        this.engine.setSpectatorMode(false);
        this.player.teleportToSpectator(this.engine.camera);

        const helper = document.getElementById("spectator-hint");
        if (helper) helper.classList.remove("visible");

        this.showNotification("Teleported!", 1500);
      }
    });

    this.input.onKeyPress("i", () => {
      this.inspectObjectSize();
    });

    // Keys 1-6: select block type for placement (ghost preview)
    // Each key maps to one unique shape in the catalogue.
    const blockKeys: Record<string, number> = {
      "1": 0,
      "2": 1,
      "3": 2,
      "4": 3,
      "5": 4,
      "6": 5,
      "!": 0,
      "@": 1,
      "#": 2,
      $: 3,
      "%": 4,
      "^": 5,
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

    this.input.onKeyPress("backspace", () => {
      if (this.isStarted) {
        this.primitivePlacement.deselectBlock();
        this.primitivePlacement.clear();
        this.blockInventory.reset();
        this.updateInventoryHUD();
        document
          .querySelectorAll(".hotbar-slot")
          .forEach((el) => el.classList.remove("active"));
      }
    });
  }

  private activateHotbarSlot(key: string): void {
    switch (key) {
      case "!":
        key = "1";
        break;
      case "@":
        key = "2";
        break;
      case "#":
        key = "3";
        break;
      case "$":
        key = "4";
        break;
      case "%":
        key = "5";
        break;
      case "^":
        key = "6";
        break;
    }
    document
      .querySelectorAll(".hotbar-slot")
      .forEach((el) => el.classList.remove("active"));
    const slot = document.getElementById(`slot-${key}`);
    if (slot) slot.classList.add("active");
  }

  private showCharacterSelection(): void {
    this.startScreen.style.display = "none";
    this.charSelectScreen.classList.add("active");
    this.setupPreviewScene();

    // Glob characters dynamically
    const models = import.meta.glob("/public/assets/characters/*.{gltf,glb}", {
      query: "?url",
    });
    this.charListContainer.innerHTML = "";

    const paths = Object.keys(models).map((p) => p.replace("/public", ""));
    if (paths.length > 0 && !paths.includes(this.selectedCharacterPath)) {
      this.selectedCharacterPath = paths[0];
    }

    paths.forEach((path) => {
      const name =
        path
          .split("/")
          .pop()
          ?.replace(/\.(gltf|glb)$/, "") || "Character";
      const prettyName = name
        .replace(/_/g, " ")
        .replace(/([a-z])([A-Z])/g, "$1 $2");

      const btn = document.createElement("button");
      btn.className = "char-btn";
      if (path === this.selectedCharacterPath) btn.classList.add("selected");
      btn.innerHTML = `<span>${prettyName}</span> <span>></span>`;

      btn.addEventListener("click", () => {
        document
          .querySelectorAll(".char-btn")
          .forEach((b) => b.classList.remove("selected"));
        btn.classList.add("selected");
        this.selectedCharacterPath = path;
        this.loadPreviewModel(path);
      });

      this.charListContainer.appendChild(btn);
    });

    this.btnSelectPlay.disabled = false;
    this.loadPreviewModel(this.selectedCharacterPath);
  }

  private setupPreviewScene(): void {
    if (this.previewRenderer) return; // Already setup

    this.previewRenderer = new THREE.WebGLRenderer({
      canvas: this.charPreviewCanvas,
      alpha: true,
      antialias: true,
    });
    const rect = this.charPreviewCanvas.parentElement!.getBoundingClientRect();
    this.previewRenderer.setSize(rect.width, rect.height, false);
    this.previewRenderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.previewRenderer.outputColorSpace = THREE.SRGBColorSpace;

    this.previewScene = new THREE.Scene();
    this.previewCamera = new THREE.PerspectiveCamera(
      45,
      rect.width / rect.height,
      0.1,
      100,
    );
    this.previewCamera.position.set(0, 0.8, 3.5);
    this.previewCamera.lookAt(0, 0.3, 0);

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    this.previewScene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 1.5);
    dirLight.position.set(5, 5, 5);
    this.previewScene.add(dirLight);

    this.previewClock = new THREE.Clock();
  }

  private loadPreviewModel(path: string): void {
    if (this.previewModel) {
      this.previewScene.remove(this.previewModel);
    }
    if (this.previewMixer) {
      this.previewMixer.stopAllAction();
    }
    this.previewActions.clear();

    const loader = new GLTFLoader();
    loader.load(path, (gltf) => {
      this.previewModel = gltf.scene;
      this.previewModel.position.y = -0.6; // Center model's waist
      this.previewModel.scale.setScalar(0.7);
      this.previewScene.add(this.previewModel);

      this.previewMixer = new THREE.AnimationMixer(this.previewModel);
      gltf.animations.forEach((clip) => {
        const action = this.previewMixer!.clipAction(clip);
        this.previewActions.set(clip.name, action);
      });

      if (this.previewActions.has("Idle")) {
        this.previewActions.get("Idle")!.play();
      } else if (gltf.animations.length > 0) {
        this.previewActions.get(gltf.animations[0].name)!.play();
      }

      if (!this.previewRAF) {
        const loop = () => {
          this.previewRAF = requestAnimationFrame(loop);
          const dt = this.previewClock.getDelta();
          if (this.previewMixer) this.previewMixer.update(dt);
          if (this.previewModel) this.previewModel.rotation.y += dt * 0.5; // slowly spin
          this.previewRenderer.render(this.previewScene, this.previewCamera);
        };
        this.previewClock.start();
        loop();
      }
    });
  }

  private startDialogueSequence(): void {
    this.charSelectScreen.classList.remove("active");
    if (this.previewRAF) {
      cancelAnimationFrame(this.previewRAF);
      this.previewRAF = null;
    }

    const dialogueScreen = document.getElementById("dialogue-screen")!;
    const dialogueText = document.getElementById("dialogue-text")!;

    dialogueScreen.classList.add("active");
    this.currentDialogueIndex = 0;

    const showLine = () => {
      dialogueText.classList.remove("visible");
      setTimeout(() => {
        if (this.currentDialogueIndex >= this.dialogueLines.length) {
          dialogueScreen.classList.remove("active");
          this.startGame();
          return;
        }
        dialogueText.innerText = this.dialogueLines[this.currentDialogueIndex];
        dialogueText.classList.add("visible");
        this.currentDialogueIndex++;
      }, 500);
    };

    showLine();

    const clickHandler = () => {
      if (!dialogueScreen.classList.contains("active")) {
        dialogueScreen.removeEventListener("click", clickHandler);
        return;
      }
      showLine();
    };
    dialogueScreen.addEventListener("click", clickHandler);
  }

  private startGame(): void {
    this.charSelectScreen.classList.remove("active");
    if (this.previewRAF) {
      cancelAnimationFrame(this.previewRAF);
      this.previewRAF = null;
    }

    this.player.changeModel(this.selectedCharacterPath);

    this.cancelLoop();
    this.isStarted = true;
    this.isRunning = true;
    this.isPaused = false;
    this.isDead = false;
    this.isFinished = false;
    this.deathSequenceTimer = 0;
    this.deathReason = "You fell out of the course.";
    this.player.isDead = false;
    this.score = 0;
    this.elapsedTime = 0;
    this.input.setGameplayActive(true);

    this.startScreen.style.display = "none";
    this.deathScreen.classList.remove("active");
    this.pauseScreen.classList.remove("active");
    this.hudEl.style.display = "";

    this.input.requestPointerLock();
    this.engine.clock.start();
    this.soundManager.playMusic("bgm", 1);
    this.gameLoop();
  }

  private showCommandConsole(): void {
    this.isCommandConsoleActive = true;
    this.commandContainer.classList.add("active");
    this.commandInput.value = "/";
    // We must wait for the DOM to update to focus
    setTimeout(() => {
      this.commandInput.focus();
      // Move cursor to end
      this.commandInput.setSelectionRange(
        this.commandInput.value.length,
        this.commandInput.value.length,
      );
    }, 10);

    this.input.exitPointerLock();
    // Disable inputs so WASD doesn't move character while typing
    this.input.setGameplayActive(false);
  }

  private hideCommandConsole(): void {
    if (!this.isCommandConsoleActive) return;
    this.isCommandConsoleActive = false;
    this.commandContainer.classList.remove("active");
    this.commandInput.blur();

    // Regain game focus
    this.input.setGameplayActive(true);
    this.engine.renderer.domElement.requestPointerLock();
  }

  private processCommand(cmdString: string): void {
    const raw = cmdString.trim();
    if (!raw.startsWith("/")) return;

    const parts = raw
      .substring(1)
      .split(" ")
      .filter((p) => p.length > 0);
    if (parts.length === 0) return;

    const cmd = parts[0].toLowerCase();
    const args = parts.slice(1);

    switch (cmd) {
      case "tp":
        if (args.length >= 3) {
          const x = parseFloat(args[0]);
          const y = parseFloat(args[1]);
          const z = parseFloat(args[2]);
          if (!isNaN(x) && !isNaN(y) && !isNaN(z)) {
            // Cancel current velocity
            this.player.body.velocity.set(0, 0, 0);
            this.player.body.angularVelocity.set(0, 0, 0);
            // Teleport
            this.player.body.position.set(x, y, z);
            this.player.update(0); // force sync
            this.showNotification(
              `Teleported to ${x.toFixed(1)}, ${y.toFixed(1)}, ${z.toFixed(1)}`,
            );
          } else {
            this.showNotification(
              "Invalid coordinates for /tp (use: /tp x y z)",
            );
          }
        } else {
          this.showNotification("Usage: /tp <x> <y> <z>");
        }
        break;

      case "speed":
        if (args.length >= 1) {
          const s = parseFloat(args[0]);
          if (!isNaN(s) && s > 0) {
            this.player.config.moveSpeed = s;
            this.showNotification(`Set speed to ${s}`);
          } else {
            this.showNotification("Invalid speed value");
          }
        } else {
          this.showNotification("Usage: /speed <number>");
        }
        break;

      case "jump":
        if (args.length >= 1) {
          const j = parseFloat(args[0]);
          if (!isNaN(j) && j > 0) {
            this.player.config.jumpForce = j;
            this.showNotification(`Set jump force to ${j}`);
          } else {
            this.showNotification("Invalid jump value");
          }
        } else {
          this.showNotification("Usage: /jump <number>");
        }
        break;

      case "give":
        if (args.length >= 2) {
          const bType = args[0];
          const amt = parseInt(args[1], 10);

          if (isNaN(amt) || amt <= 0) {
            this.showNotification("Invalid amount");
            return;
          }

          let blockTypeObj: (typeof BLOCK_CATALOGUE)[0] | null = null;
          // Find block by lowercase name
          for (let i = 0; i < BLOCK_CATALOGUE.length; i++) {
            if (
              BLOCK_CATALOGUE[i].label.toLowerCase() === bType.toLowerCase() ||
              BLOCK_CATALOGUE[i].id.toLowerCase() === bType.toLowerCase()
            ) {
              blockTypeObj = BLOCK_CATALOGUE[i];
              break;
            }
          }

          if (blockTypeObj !== null) {
            for (let i = 0; i < amt; i++) {
              this.blockInventory.add(blockTypeObj.id);
            }
            this.updateInventoryHUD();
            this.showNotification(`Gave ${amt} ${blockTypeObj.label}(s)`);
          } else {
            this.showNotification(`Unknown block type: ${bType}`);
          }
        } else {
          this.showNotification("Usage: /give <block_name> <amount>");
        }
        break;

      case "kill":
      case "reset":
        this.playerDied("Killed via console.");
        break;

      case "timestop":
        this.dayNightSystem.isTimeStopped = !this.dayNightSystem.isTimeStopped;
        if (this.dayNightSystem.isTimeStopped) {
          this.showNotification("ZA WARUDO! (Time Stopped)");
        } else {
          this.showNotification("Time has resumed.");
        }
        break;

      default:
        this.showNotification(`Unknown command: ${cmd}`);
        break;
    }
  }

  private pauseGame(): void {
    this.cancelLoop();
    this.isRunning = false;
    this.isPaused = true;
    this.input.setGameplayActive(false);
    this.pauseScreen.classList.add("active");
    this.input.exitPointerLock();
    this.soundManager.stopMusic(0.3);
  }

  private resumeGame(): void {
    this.cancelLoop();
    this.isPaused = false;
    this.isRunning = true;
    this.input.setGameplayActive(true);
    this.pauseScreen.classList.remove("active");
    this.input.requestPointerLock();
    this.engine.clock.start();
    this.soundManager.playMusic("bgm", 1);
    this.gameLoop();
  }

  private restartGame(): void {
    this.cancelLoop();
    this.player.isDead = false;

    // Soft reset the level to restore platforms, pickups, and physics instantly
    this.levelManager.resetLevel();

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
    this.deathSequenceTimer = 0;
    this.deathReason = "You fell out of the course.";
    this.input.setGameplayActive(true);

    // Reset quest state variables
    // Reset quest state variables dynamically
    this.teleportedToRoof = false;
    this.gameWon = false;
    this.springCooldown = 0;
    this.tireLaunchCooldown = 0;
    this.cyl3Cooldown = 0;
    this.altPlatCooldown = 0;
    this.altPlatNext = -1;
    for (const key in this.npcTalkStates) {
      this.npcTalkStates[key] = false;
    }
    for (const key in this.npcCompleteStates) {
      this.npcCompleteStates[key] = false;
    }

    this.deathScreen.classList.remove("active");
    this.pauseScreen.classList.remove("active");
    this.hudEl.style.display = "";

    this.updateInventoryHUD();
    document
      .querySelectorAll(".hotbar-slot")
      .forEach((el) => el.classList.remove("active"));

    this.input.requestPointerLock();
    this.engine.clock.start();
    this.gameLoop();
  }

  private inspectObjectSize(): void {
    if (!this.isRunning || !this.isStarted) return;

    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(new THREE.Vector2(0, 0), this.engine.camera);

    const intersects = raycaster.intersectObjects(
      this.engine.scene.children,
      true,
    );

    if (intersects.length > 0) {
      let object: THREE.Object3D | null = intersects[0].object;

      // Ignore the player's own body
      if (
        object === this.player.modelGroup ||
        object.parent === this.player.modelGroup
      ) {
        if (intersects.length > 1) object = intersects[1].object;
        else return;
      }

      // Walk up the hierarchy to find the main group inserted by level-manager
      let root = object;
      while (root.parent && root.parent !== this.engine.scene) {
        root = root.parent;
      }

      // Temporarily remove rotation to measure the true local size, not the inflated AABB
      const originalRotation = root.rotation.clone();
      root.rotation.set(0, 0, 0);
      root.updateMatrixWorld(true);

      const box = new THREE.Box3().setFromObject(root);
      const size = new THREE.Vector3();
      box.getSize(size);

      // Restore original rotation
      root.rotation.copy(originalRotation);
      root.updateMatrixWorld(true);

      const msg = `Size: ${size.x.toFixed(2)} x ${size.y.toFixed(2)} x ${size.z.toFixed(2)}`;
      this.showNotification(msg, 4000);
      console.log(`[INSPECT] Object:`, root, `\nSize:`, size);
    } else {
      this.showNotification("No object in crosshair", 1500);
    }
  }

  private playerDied(reason = "You fell out of the course."): void {
    if (this.isDead) return;

    this.isDead = true;
    this.player.isDead = true;
    this.deathCount += 1;
    this.deathSequenceTimer = 0;
    this.deathReason = reason;
    this.input.setGameplayActive(false);
    this.input.exitPointerLock();
  }

  private finalizeDeathScreen(): void {
    this.cancelLoop();
    this.isRunning = false;
    const deathScoreEl = document.getElementById("death-score")!;
    deathScoreEl.textContent = `${this.deathReason} Score: ${this.score} | Time: ${this.elapsedTime.toFixed(1)}s`;
    this.deathScreen.classList.add("active");
  }

  private finishRun(): void {
    if (this.isFinished) return;

    this.cancelLoop();
    this.isRunning = false;
    this.isFinished = true;
    this.input.setGameplayActive(false);
    this.input.exitPointerLock();

    const deathScoreEl = document.getElementById("death-score")!;
    deathScoreEl.textContent = `You finished the course! Score: ${this.score} | Time: ${this.elapsedTime.toFixed(1)}s`;
    this.deathScreen.classList.add("active");
  }

  private gameLoop(): void {
    if (!this.isRunning) return;

    this.animationFrameId = requestAnimationFrame(() => this.gameLoop());

    const dt = Math.min(this.engine.clock.getDelta(), 0.05);
    this.physics.step(dt);

    // Player controller still updates animations and physics even if inactive
    this.player.update(dt);

    this.input.resetMouseDelta();

    const playerPos = this.player.getPosition();
    this.levelManager.update(dt, playerPos);

    // Spring bounce pad check
    if (this.springCooldown > 0) this.springCooldown -= dt;
    if (
      this.springCooldown <= 0 &&
      playerPos.distanceTo(this.springPos) < 1.5 &&
      this.player.isGrounded &&
      !this.isDead
    ) {
      this.player.body.velocity.set(-6.6, 28.3, 3.3);
      this.player.isGrounded = false;
      this.springCooldown = 1.0;
    }

    // Cylinder bounce pad at [-50, 35, -230]: bật lên Y+5
    if (this.tireLaunchCooldown > 0) this.tireLaunchCooldown -= dt;
    const distToTire = playerPos.distanceTo(this.tireLaunchPos);
    if (this.tireLaunchCooldown <= 0 && distToTire < 1.5 && !this.isDead) {
      this.player.body.velocity.y = 14;
      this.tireLaunchCooldown = 0.5;
    }

    // Cylinder bounce at [-115, 52, -215]: Y+10
    if (this.cyl3Cooldown > 0) this.cyl3Cooldown -= dt;
    if (
      this.cyl3Cooldown <= 0 &&
      playerPos.distanceTo(this.cyl3Pos) < 1.5 &&
      !this.isDead
    ) {
      this.player.body.velocity.y = 20;
      this.cyl3Cooldown = 0.5;
    }

    // Alternate bounce platforms at [109,20,-231] & [109,20,-227]: Y+10
    if (this.altPlatCooldown > 0) this.altPlatCooldown -= dt;
    const distAlt0 = playerPos.distanceTo(this.altPlat0);
    const distAlt1 = playerPos.distanceTo(this.altPlat1);
    if (this.altPlatCooldown <= 0 && !this.isDead) {
      // First step on any platform → initialize
      if (this.altPlatNext === -1) {
        if (distAlt0 < 1.5) this.altPlatNext = 0;
        else if (distAlt1 < 1.5) this.altPlatNext = 1;
      }
      if (this.altPlatNext === 0 && distAlt0 < 1.5) {
        this.player.body.velocity.y = 20;
        this.altPlatCooldown = 0.5;
        this.altPlatNext = 1;
      } else if (this.altPlatNext === 1 && distAlt1 < 1.5) {
        this.player.body.velocity.y = 20;
        this.altPlatCooldown = 0.5;
        this.altPlatNext = 0;
      }
    }

    // Only update ghost preview if not in spectator mode
    if (!this.engine.isSpectatorMode) {
      this.primitivePlacement.updateGhost(
        playerPos,
        this.player.aimYaw,
        this.player.aimPitch,
      );
    } else {
      // Hide ghost in spectator mode
      this.primitivePlacement.deselectBlock();
    }

    // Update Day/Night cycle
    this.dayNightSystem.update(dt, playerPos);

    // Check for collectible pickups
    const collected = this.levelManager.checkCollectibles(playerPos);
    for (const blockId of collected) {
      if (blockId === "jeans") {
        // Intercept player's pants retrieval dynamically
        void (async () => {
          this.input.setGameplayActive(false);
          this.input.exitPointerLock();

          const pantsLabel = this.levelManager.getCollectibleLabel("jeans");
          await this.npcDialog!.show(getPantsRetrievedDialogue(pantsLabel));

          this.input.setGameplayActive(true);
          this.input.requestPointerLock();
        })();
      } else if (
        STORY_CONFIG.npcs.some((npc) => npc.requiredItems?.includes(blockId))
      ) {
        // Collect quest items dynamically
        const itemLabel = this.levelManager.getCollectibleLabel(blockId);
        this.showNotification(`✨ Collected Key Item: ${itemLabel}!`, 4000);
      } else {
        this.blockInventory.add(blockId);
        this.updateInventoryHUD();
        this.showPickupNotification(blockId);
      }
    }

    this.engine.perspectiveParams.positionX = this.engine.camera.position.x;
    this.engine.perspectiveParams.positionY = this.engine.camera.position.y;
    this.engine.perspectiveParams.positionZ = this.engine.camera.position.z;

    if (this.isDead) {
      this.deathSequenceTimer += dt;
      this.updateHUD();
      this.engine.render();

      if (this.deathSequenceTimer >= this.deathSequenceDuration) {
        this.finalizeDeathScreen();
      }
      return;
    }

    const playerFeetY = playerPos.y - this.player.config.playerRadius;
    if (playerFeetY < this.deathY) {
      this.playerDied();
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
    // Update all dynamic NPCs configured in the story registry
    for (const id in this.npcs) {
      this.npcs[id].update(dt, playerPos);
    }
    this.engine.render(dt);
  }

  private updateHUD(): void {
    this.scoreEl.textContent = `Score: ${this.score}`;
    this.timeEl.textContent = `Time: ${this.elapsedTime.toFixed(1)}s`;
    this.speedEl.textContent = `Speed: ${this.player.getSpeed().toFixed(1)}`;
    this.deathsEl.textContent = `Deaths: ${this.deathCount}`;

    const pos = this.player.getPosition();
    this.coordsEl.textContent = `XYZ: ${pos.x.toFixed(1)}, ${pos.y.toFixed(1)}, ${pos.z.toFixed(1)}`;
  }

  /** Flash the placement-distance hint briefly when scroll wheel is used */
  private distanceHintTimeout: ReturnType<typeof setTimeout> | null = null;
  private showDistanceHint(): void {
    const el = document.getElementById("placement-distance");
    if (!el) return;
    el.textContent = `📏 Distance: ${this.primitivePlacement.getGhostDistance().toFixed(1)}`;
    el.classList.add("visible");
    if (this.distanceHintTimeout) clearTimeout(this.distanceHintTimeout);
    this.distanceHintTimeout = setTimeout(
      () => el.classList.remove("visible"),
      1200,
    );
  }

  private async handleNpcRegistryInteraction(npcId: string): Promise<void> {
    if (!this.npcDialog) return;
    const conf = STORY_CONFIG.npcs.find((n) => n.id === npcId);
    if (!conf) return;

    const collected = this.levelManager.getCollectedSet();

    const state: GameQuestState = {
      collectedSet: collected,
      getLabel: (id) => this.levelManager.getCollectibleLabel(id),
      npcTalkStates: this.npcTalkStates,
      npcCompleteStates: this.npcCompleteStates,
      teleport: (x, y, z) => {
        this.player.body.position.set(x, y, z);
        this.player.body.velocity.set(0, 0, 0);
        this.player.body.angularVelocity.set(0, 0, 0);
        this.teleportedToRoof = true;
      },
      grantBlock: (blockId, count = 1) => {
        const bt = BLOCK_CATALOGUE.find((b) => b.id === blockId);
        if (bt) {
          for (let i = 0; i < count; i++) {
            this.blockInventory.add(blockId);
          }
          this.updateInventoryHUD();
          this.showNotification(
            `🎁 Received: ${bt.icon} ${count}x ${bt.label}!`,
            4000,
          );
        }
      },
    };

    // Retrieve dynamic dialogues from registry
    const dialogue = conf.getDialogue(state);
    await this.npcDialog.show(dialogue);

    // Dynamic quest completion check
    if (conf.requiredItems) {
      const hasAll = conf.requiredItems.every((id) => collected.has(id));
      if (hasAll && !this.npcCompleteStates[npcId]) {
        this.npcCompleteStates[npcId] = true;
        if (conf.onComplete) {
          conf.onComplete(state);
        }
      }
    } else {
      if (!this.npcCompleteStates[npcId]) {
        this.npcCompleteStates[npcId] = true;
        if (conf.onComplete) {
          conf.onComplete(state);
        }
      }
    }
  }

  private async handleUfoInteraction(): Promise<void> {
    if (!this.npcDialog) return;
    const collected = this.levelManager.getCollectedSet();
    const hasPants = collected.has("jeans");
    const pantsLabel = this.levelManager.getCollectibleLabel("jeans");

    await this.npcDialog.show(getUfoBoardingDialogue(hasPants, pantsLabel));

    if (hasPants) {
      this.triggerEndingScreen(true);
    } else {
      this.triggerEndingScreen(false);
    }
  }

  private triggerEndingScreen(isBestEnding: boolean): void {
    this.cancelLoop();
    this.isRunning = false;
    this.isFinished = true;
    this.input.setGameplayActive(false);
    this.input.exitPointerLock();

    const overlay = document.createElement("div");
    overlay.className = "victory-overlay";

    const titleText = isBestEnding
      ? "BEST ENDING ACHIEVED!"
      : "MEDIOCRE ENDING ACHIEVED";
    const titleClass = isBestEnding ? "best-ending" : "mediocre-ending";
    const descriptionText = isBestEnding
      ? "You retrieved your grandmother's handcrafted cosmic stardust trousers! You are officially the most stylish alien in this quadrant."
      : "You flew to a space-mall and settled for generic sweatpants. Safe, warm, but your grandmother would be disappointed.";

    const emoji = isBestEnding ? "👖🚀✨" : "🛸️🛍🛒";

    overlay.innerHTML = `
      <style>
        .victory-overlay {
          position: fixed;
          top: 0; left: 0; width: 100%; height: 100%;
          background: rgba(4, 4, 12, 0.85);
          backdrop-filter: blur(20px) saturate(180%);
          z-index: 10000;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          color: #fff;
          font-family: system-ui, -apple-system, sans-serif;
          opacity: 0;
          transition: opacity 0.5s ease;
        }
        .victory-card {
          background: rgba(20, 20, 35, 0.7);
          border: 1px solid rgba(255, 255, 255, 0.1);
          padding: 40px 50px;
          border-radius: 24px;
          text-align: center;
          max-width: 600px;
          box-shadow: 0 20px 50px rgba(0, 0, 0, 0.8);
          transform: scale(0.9);
          transition: transform 0.5s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .victory-overlay.active {
          opacity: 1;
        }
        .victory-overlay.active .victory-card {
          transform: scale(1);
        }
        .victory-emoji {
          font-size: 64px;
          margin-bottom: 20px;
          animation: victoryFloat 3s infinite ease-in-out;
        }
        .victory-title {
          font-size: 38px;
          font-weight: 900;
          letter-spacing: 2px;
          margin-bottom: 15px;
        }
        .best-ending {
          background: linear-gradient(45deg, #00e5ff, #7b2fff, #ff2d95);
          -webkit-background-clip: text;
          background-clip: text;
          -webkit-text-fill-color: transparent;
          text-shadow: 0 0 30px rgba(0, 229, 255, 0.2);
        }
        .mediocre-ending {
          background: linear-gradient(45deg, #ffd54f, #ff9100);
          -webkit-background-clip: text;
          background-clip: text;
          -webkit-text-fill-color: transparent;
        }
        .victory-desc {
          font-size: 16px;
          color: rgba(255, 255, 255, 0.7);
          line-height: 1.6;
          margin-bottom: 35px;
        }
        .victory-btn {
          padding: 14px 40px;
          font-size: 16px;
          font-weight: 700;
          color: #fff;
          background: linear-gradient(45deg, #7b2fff, #00d4ff);
          border: none;
          border-radius: 50px;
          cursor: pointer;
          letter-spacing: 1px;
          box-shadow: 0 8px 24px rgba(123, 47, 255, 0.4);
          transition: transform 0.2s, box-shadow 0.2s;
        }
        .victory-btn:hover {
          transform: scale(1.05);
          box-shadow: 0 12px 30px rgba(123, 47, 255, 0.6);
        }
        @keyframes victoryFloat {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
      </style>
      <div class="victory-card">
        <div class="victory-emoji">${emoji}</div>
        <h2 class="victory-title ${titleClass}">${titleText}</h2>
        <p class="victory-desc">${descriptionText}</p>
        <button class="victory-btn" id="btn-victory-restart">PLAY AGAIN</button>
      </div>
    `;

    document.body.appendChild(overlay);

    // Force reflow
    overlay.offsetHeight;
    overlay.classList.add("active");

    const restartBtn = overlay.querySelector("#btn-victory-restart")!;
    restartBtn.addEventListener("click", () => {
      overlay.classList.remove("active");
      setTimeout(() => {
        overlay.remove();
        this.restartGame();
      }, 500);
    });
  }

  /** Show a brief pickup notification */
  private pickupNotificationTimeout: ReturnType<typeof setTimeout> | null =
    null;

  private showNotification(message: string, duration = 1500): void {
    const el = document.getElementById("pickup-notification");
    if (!el) return;
    el.textContent = message;
    el.classList.add("visible");
    if (this.pickupNotificationTimeout)
      clearTimeout(this.pickupNotificationTimeout);
    this.pickupNotificationTimeout = setTimeout(
      () => el.classList.remove("visible"),
      duration,
    );
  }

  private showPickupNotification(blockId: string): void {
    const bt = BLOCK_CATALOGUE.find((b) => b.id === blockId);
    if (!bt) return;
    this.showNotification(`${bt.icon} +1 ${bt.label}`);
  }

  /** Update the block inventory HUD panel */
  updateInventoryHUD(): void {
    for (const bt of BLOCK_CATALOGUE) {
      const countEl = document.getElementById(`inv-count-${bt.id}`);
      if (countEl) {
        const rem = this.blockInventory.remaining(bt);
        countEl.textContent = `${rem}`;
        const card = document.getElementById(`inv-card-${bt.id}`);
        if (card) {
          card.classList.toggle("depleted", rem === 0);
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

window.addEventListener("DOMContentLoaded", () => {
  new Game();
});
