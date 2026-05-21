import * as THREE from "three";
import type { Engine } from "../core/engine";
import type { PlayerController } from "./player-controller";
import { ModelLoader } from "./model-loader";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

export interface NPCOptions {
  modelPath: string;
  position: [number, number, number];
  interactionRadius?: number;
  name?: string;
}

export class NPC {
  private engine: Engine;
  private modelLoader: ModelLoader;
  public group: THREE.Group;
  private mixer: THREE.AnimationMixer | null = null;
  private actions: Map<string, THREE.AnimationAction> = new Map();
  private isLoaded = false;
  private pos = new THREE.Vector3();
  private interactionRadius: number;
  public name: string;

  constructor(engine: Engine, opts: NPCOptions) {
    this.engine = engine;
    this.modelLoader = new ModelLoader();
    this.group = new THREE.Group();
    this.pos.set(...opts.position);
    this.group.position.copy(this.pos);
    this.interactionRadius = opts.interactionRadius ?? 3.0;
    this.name = opts.name ?? "NPC";

    this.engine.scene.add(this.group);
    void this.loadModel(opts.modelPath);
  }

  private async loadModel(path: string): Promise<void> {
    // Use GLTFLoader directly to preserve animations
    const loader = new GLTFLoader();
    loader.load(
      path,
      (gltf) => {
        const model = gltf.scene;
        model.position.set(0, 0, 0);
        this.group.add(model);

        // console.log("lo con cac");
        // console.log(gltf.animations);
        if (gltf.animations && gltf.animations.length > 0) {
          this.mixer = new THREE.AnimationMixer(model);

          for (const clip of gltf.animations) {
            const action = this.mixer.clipAction(clip);
            this.actions.set(clip.name, action);
          }

          // Target the "Idle" animation directly
          const idleAction = this.actions.get("Wave");

          if (idleAction) {
            idleAction.play();
          } else {
            // Fallback: Play the first available animation if "Idle" missing
            const first = this.actions.values().next().value;
            if (first) first.play();
          }
        }

        this.isLoaded = true;
      },
      undefined,
      (err) => {
        console.warn("NPC GLTF load failed:", path, err);
      },
    );
  }

  update(dt: number, playerPos: THREE.Vector3): void {
    if (!this.isLoaded) return;
    if (this.mixer) this.mixer.update(dt);

    // simple facing: rotate to look at player on Y axis only
    const lookAt = playerPos.clone();
    lookAt.y = this.group.position.y;
    this.group.lookAt(lookAt);
  }

  isPlayerNearby(playerPos: THREE.Vector3): boolean {
    const d2 = playerPos.distanceToSquared(this.group.position);
    return d2 <= this.interactionRadius * this.interactionRadius;
  }

  async onInteract(player: PlayerController): Promise<void> {
    // Placeholder — actual conversation flow will be orchestrated from main.ts
    console.log(`${this.name} interacted with player`);
  }

  dispose(): void {
    if (this.group.parent) this.group.parent.remove(this.group);
  }
}

export default NPC;
