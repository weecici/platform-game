export class SoundManager {
  private ctx: AudioContext | null = null;
  private buffers = new Map<string, AudioBuffer>();
  private gainNode: GainNode | null = null;
  private musicGain: GainNode | null = null;
  private muted = false;
  private musicSource: AudioBufferSourceNode | null = null;
  private bgmName: string | null = null;

  constructor() {
    this.ctx = new AudioContext();
    this.gainNode = this.ctx.createGain();
    this.gainNode.gain.value = 0.5;
    this.gainNode.connect(this.ctx.destination);

    this.musicGain = this.ctx.createGain();
    this.musicGain.gain.value = 0.8;
    this.musicGain.connect(this.ctx.destination);
  }

  async load(name: string, url: string): Promise<void> {
    if (this.buffers.has(name)) return;
    try {
      const res = await fetch(url);
      const arrayBuffer = await res.arrayBuffer();
      const audioBuffer = await this.ctx!.decodeAudioData(arrayBuffer);
      this.buffers.set(name, audioBuffer);
    } catch (e) {
      console.warn(`SoundManager: failed to load "${name}" from ${url}`, e);
    }
  }

  play(name: string, volume = 1): void {
    if (this.muted) return;
    const buf = this.buffers.get(name);
    if (!buf || !this.ctx || !this.gainNode) return;

    this.resume();

    const source = this.ctx.createBufferSource();
    source.buffer = buf;

    const gain = this.ctx.createGain();
    gain.gain.value = volume;

    source.connect(gain);
    gain.connect(this.gainNode);
    source.start(0);
  }

  /** Play background music (looping). Call stopMusic() before changing tracks. */
  playMusic(name: string, fadeIn = 1): void {
    if (!this.ctx || !this.musicGain) return;
    this.stopMusic();

    const buf = this.buffers.get(name);
    if (!buf) {
      console.warn(`SoundManager: music "${name}" not loaded`);
      return;
    }

    this.resume();
    this.bgmName = name;

    const source = this.ctx.createBufferSource();
    source.buffer = buf;
    source.loop = true;

    const gain = this.ctx.createGain();
    gain.gain.value = 0.6;
    gain.gain.linearRampToValueAtTime(1, this.ctx.currentTime + fadeIn);

    source.connect(gain);
    gain.connect(this.musicGain);
    source.start(0);

    this.musicSource = source;
  }

  stopMusic(fadeOut = 0.5): void {
    if (!this.musicSource || !this.ctx) return;
    if (fadeOut > 0) {
      const gain = this.ctx.createGain();
      gain.gain.value = 1;
      gain.gain.linearRampToValueAtTime(0, this.ctx.currentTime + fadeOut);
      this.musicSource.connect(gain);
      gain.connect(this.ctx.destination);
    }
    try { this.musicSource.stop(); } catch { /* already stopped */ }
    this.musicSource = null;
    this.bgmName = null;
  }

  setMusicVolume(v: number): void {
    if (this.musicGain) this.musicGain.gain.value = v;
  }

  setMasterVolume(v: number): void {
    if (this.gainNode) this.gainNode.gain.value = v;
  }

  get isMuted(): boolean {
    return this.muted;
  }

  toggleMute(): boolean {
    this.muted = !this.muted;
    return this.muted;
  }

  resume(): void {
    if (this.ctx && this.ctx.state === "suspended") {
      this.ctx.resume();
    }
  }
}
