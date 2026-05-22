export type DialogSoundCallback = () => void;

export class NPCDialog {
  private container: HTMLDivElement | null = null;
  private contentEl: HTMLDivElement | null = null;
  private speakerEl: HTMLDivElement | null = null;
  private hintEl: HTMLDivElement | null = null;
  private resolveCurrent: (() => void) | null = null;

  private steps: Array<{ speaker: string; text: string }> = [];
  private currentStepIndex = 0;
  private isTyping = false;
  private typewriterInterval: any = null;
  private currentStepText = "";
  private onCharTyped: DialogSoundCallback | null = null;

  constructor() { }

  setOnCharTyped(cb: DialogSoundCallback | null): void {
    this.onCharTyped = cb;
  }

  show(
    steps: string[] | Array<{ speaker: string; text: string }>,
    defaultSpeaker?: string
  ): Promise<void> {
    if (!this.container) this.createElements();

    if (!this.container || !this.contentEl || !this.speakerEl || !this.hintEl)
      return Promise.resolve();

    // Normalize steps
    this.steps = steps.map((step) => {
      if (typeof step === "string") {
        return { speaker: defaultSpeaker ?? "Narrator", text: step };
      }
      return step;
    });

    this.currentStepIndex = 0;
    this.container.classList.add("active");

    return new Promise((resolve) => {
      this.resolveCurrent = resolve;
      this.displayCurrentStep();

      const onKey = (e: KeyboardEvent) => {
        if (e.key.toLowerCase() === "f") {
          e.stopPropagation();
          e.preventDefault();
          this.handleAdvance();
        }
      };

      const onClick = (e: MouseEvent) => {
        e.stopPropagation();
        this.handleAdvance();
      };

      document.addEventListener("keydown", onKey, { capture: true });
      this.container!.addEventListener("click", onClick);

      // cleanup when hidden
      const cleanup = () => {
        document.removeEventListener("keydown", onKey, {
          capture: true,
        } as any);
        if (this.container) {
          this.container.removeEventListener("click", onClick);
        }
      };

      // attach resolve to hide to run cleanup
      const origResolve = this.resolveCurrent;
      this.resolveCurrent = () => {
        cleanup();
        if (origResolve) origResolve();
        resolve();
      };
    });
  }

  private displayCurrentStep(): void {
    if (this.currentStepIndex >= this.steps.length) {
      this.hide();
      return;
    }

    const step = this.steps[this.currentStepIndex];
    this.speakerEl!.textContent = step.speaker;

    // Apply speaker theme class
    const lowerSpeaker = step.speaker.toLowerCase();
    this.speakerEl!.className = "npc-speaker";
    this.container!.className = "npc-dialog-container active";

    if (
      lowerSpeaker === "you" ||
      lowerSpeaker.includes("player") ||
      lowerSpeaker.includes("alien")
    ) {
      this.speakerEl!.classList.add("speaker-player");
      this.container!.classList.add("theme-player");
    } else if (
      lowerSpeaker.includes("owner") ||
      lowerSpeaker.includes("manager") ||
      lowerSpeaker.includes("trưởng")
    ) {
      this.speakerEl!.classList.add("speaker-owner");
      this.container!.classList.add("theme-owner");
    } else {
      this.speakerEl!.classList.add("speaker-narrator");
      this.container!.classList.add("theme-narrator");
    }

    this.currentStepText = step.text;
    this.startTypewriter();
  }

  private startTypewriter(): void {
    if (this.typewriterInterval) clearInterval(this.typewriterInterval);
    this.isTyping = true;
    this.hintEl!.classList.remove("visible");

    let charIndex = 0;
    this.contentEl!.innerHTML = "";

    this.typewriterInterval = setInterval(() => {
      if (charIndex < this.currentStepText.length) {
        this.contentEl!.textContent = this.currentStepText.slice(0, charIndex + 1);
        if (this.currentStepText[charIndex] !== ' ') this.onCharTyped?.();
        charIndex++;
      } else {
        this.completeTypewriter();
      }
    }, 15);
  }

  private completeTypewriter(): void {
    if (this.typewriterInterval) {
      clearInterval(this.typewriterInterval);
      this.typewriterInterval = null;
    }
    this.contentEl!.textContent = this.currentStepText;
    this.isTyping = false;
    this.hintEl!.classList.add("visible");
  }

  private handleAdvance(): void {
    if (this.isTyping) {
      this.completeTypewriter();
    } else {
      this.currentStepIndex++;
      if (this.currentStepIndex < this.steps.length) {
        this.displayCurrentStep();
      } else {
        this.hide();
      }
    }
  }

  hide(): void {
    if (this.typewriterInterval) {
      clearInterval(this.typewriterInterval);
      this.typewriterInterval = null;
    }
    if (!this.container) return;
    this.container.classList.remove("active");
    this.container.className = "npc-dialog-container";
    if (this.resolveCurrent) {
      this.resolveCurrent();
      this.resolveCurrent = null;
    }
  }

  private createElements(): void {
    this.container = document.createElement("div");
    this.container.className = "npc-dialog-container";

    const style = document.createElement("style");
    style.textContent = `
.npc-dialog-container {
  position: fixed;
  left: 50%;
  transform: translate(-50%, 20px);
  bottom: 6%;
  width: 80%;
  max-width: 800px;
  box-sizing: border-box;
  z-index: 9999;
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.3s cubic-bezier(0.16, 1, 0.3, 1), transform 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}
.npc-dialog-container.active {
  opacity: 1;
  transform: translate(-50%, 0);
  pointer-events: auto;
}
.npc-dialog {
  background: rgba(10, 10, 18, 0.85);
  backdrop-filter: blur(16px) saturate(180%);
  -webkit-backdrop-filter: blur(16px) saturate(180%);
  color: #f1f1f6;
  padding: 22px 28px;
  border-radius: 16px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  box-shadow: 0 16px 40px rgba(0, 0, 0, 0.6), inset 0 1px 0 rgba(255, 255, 255, 0.1);
  font-family: system-ui, -apple-system, sans-serif;
  font-size: 17px;
  line-height: 1.5;
  transition: border-color 0.3s ease, box-shadow 0.3s ease;
}

/* Dynamic container theme accents */
.npc-dialog-container.theme-player .npc-dialog {
  border-color: rgba(0, 229, 255, 0.25);
  box-shadow: 0 16px 40px rgba(0, 0, 0, 0.6), 0 0 20px rgba(0, 229, 255, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.1);
}
.npc-dialog-container.theme-owner .npc-dialog {
  border-color: rgba(255, 179, 0, 0.25);
  box-shadow: 0 16px 40px rgba(0, 0, 0, 0.6), 0 0 20px rgba(255, 179, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.1);
}
.npc-dialog-container.theme-narrator .npc-dialog {
  border-color: rgba(209, 196, 233, 0.25);
}

.npc-speaker {
  font-weight: 800;
  font-size: 15px;
  text-transform: uppercase;
  letter-spacing: 0.12em;
  margin-bottom: 10px;
  transition: color 0.3s ease;
}
.npc-speaker.speaker-player {
  color: #00e5ff;
  text-shadow: 0 0 8px rgba(0, 229, 255, 0.35);
}
.npc-speaker.speaker-owner {
  color: #ffb300;
  text-shadow: 0 0 8px rgba(255, 179, 0, 0.35);
}
.npc-speaker.speaker-narrator {
  color: #d1c4e9;
  text-shadow: 0 0 8px rgba(209, 196, 233, 0.35);
}

.npc-content {
  margin: 12px 0;
  min-height: 50px;
  font-weight: 400;
  letter-spacing: 0.01em;
}

.npc-hint {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  margin-top: 14px;
  font-size: 12px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.4);
  letter-spacing: 0.05em;
  opacity: 0;
  transform: translateY(5px);
  transition: opacity 0.2s ease, transform 0.2s ease;
  pointer-events: none;
}
.npc-hint.visible {
  opacity: 1;
  transform: translateY(0);
}

.npc-hint .key-cap {
  display: inline-block;
  background: rgba(255, 255, 255, 0.12);
  border: 1px solid rgba(255, 255, 255, 0.25);
  border-bottom: 2px solid rgba(255, 255, 255, 0.4);
  padding: 2px 7px;
  border-radius: 4px;
  font-family: monospace;
  font-weight: bold;
  color: #fff;
  margin: 0 6px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.2);
  animation: keypressPulse 1.8s infinite ease-in-out;
}

@keyframes keypressPulse {
  0%, 100% {
    transform: scale(1);
    box-shadow: 0 2px 4px rgba(0,0,0,0.2);
  }
  50% {
    transform: scale(0.96);
    border-bottom-width: 1px;
    box-shadow: 0 1px 2px rgba(0,0,0,0.1);
  }
}
`;

    const dialog = document.createElement("div");
    dialog.className = "npc-dialog";

    this.speakerEl = document.createElement("div");
    this.speakerEl.className = "npc-speaker";
    dialog.appendChild(this.speakerEl);

    this.contentEl = document.createElement("div");
    this.contentEl.className = "npc-content";
    dialog.appendChild(this.contentEl);

    this.hintEl = document.createElement("div");
    this.hintEl.className = "npc-hint";
    this.hintEl.innerHTML = 'Press <span class="key-cap">F</span> or Click to continue';
    dialog.appendChild(this.hintEl);

    this.container.appendChild(style);
    this.container.appendChild(dialog);

    document.body.appendChild(this.container);
  }
}

export default NPCDialog;
