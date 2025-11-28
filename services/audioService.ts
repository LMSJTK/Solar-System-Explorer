
type GameMode = 'solar' | 'arcade' | 'orbit' | 'raiden';

class AudioService {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private thrusterGain: GainNode | null = null;
  private thrusterFilter: BiquadFilterNode | null = null;
  private initialized = false;
  private muted = false;

  // Background music
  private musicGain: GainNode | null = null;
  private currentMusicSource: AudioBufferSourceNode | null = null;
  private currentTrack: GameMode | null = null;
  private musicBuffers: Map<GameMode, AudioBuffer> = new Map();
  private musicVolume = 0.3;
  private isMusicEnabled = true;

  init() {
    if (this.initialized) return;

    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    this.ctx = new AudioContextClass();
    this.masterGain = this.ctx.createGain();
    this.masterGain.connect(this.ctx.destination);
    this.masterGain.gain.value = 0.3; // Default volume

    // Music gain (separate from master for independent volume control)
    this.musicGain = this.ctx.createGain();
    this.musicGain.gain.value = this.musicVolume;
    this.musicGain.connect(this.ctx.destination);

    // Ambient Drone
    this.createDrone();

    // Thruster Noise
    this.createThruster();

    // Load background music tracks
    this.loadMusicTracks();

    this.initialized = true;
  }

  private createDrone() {
    if (!this.ctx || !this.masterGain) return;

    // Create a cluster of low frequency oscillators for a space drone
    const frequencies = [55, 110, 138.59, 82.41]; // A1, A2, C#3, E2
    frequencies.forEach((freq, i) => {
        const osc = this.ctx!.createOscillator();
        osc.type = i % 2 === 0 ? 'sine' : 'triangle';
        osc.frequency.value = freq;
        
        const gain = this.ctx!.createGain();
        gain.gain.value = 0.05;
        
        // LFO for subtle movement (breathing effect)
        const lfo = this.ctx!.createOscillator();
        lfo.frequency.value = 0.05 + Math.random() * 0.1;
        const lfoGain = this.ctx!.createGain();
        lfoGain.gain.value = 2; // Hz modulation depth
        lfo.connect(lfoGain);
        lfoGain.connect(osc.frequency);

        // Stereo Panner for wideness
        const panner = this.ctx!.createStereoPanner();
        panner.pan.value = (Math.random() * 2) - 1;

        osc.connect(gain);
        gain.connect(panner);
        panner.connect(this.masterGain!);
        
        osc.start();
        lfo.start();
    });
  }

  private createThruster() {
    if (!this.ctx || !this.masterGain) return;

    // White noise buffer
    const bufferSize = this.ctx.sampleRate * 2;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;
    noise.loop = true;

    this.thrusterFilter = this.ctx.createBiquadFilter();
    this.thrusterFilter.type = 'lowpass';
    this.thrusterFilter.frequency.value = 100;

    this.thrusterGain = this.ctx.createGain();
    this.thrusterGain.gain.value = 0;

    noise.connect(this.thrusterFilter);
    this.thrusterFilter.connect(this.thrusterGain);
    this.thrusterGain.connect(this.masterGain);
    noise.start();
  }

  setThrust(amount: number) {
    if (!this.initialized || !this.ctx || !this.thrusterGain || !this.thrusterFilter) return;
    if (this.ctx.state === 'suspended') {
        this.ctx.resume().catch(() => {});
    }
    
    const time = this.ctx.currentTime;
    // Volume ramps up with thrust
    this.thrusterGain.gain.setTargetAtTime(amount * 0.4, time, 0.1);
    // Filter opens up (brighter sound) with thrust
    this.thrusterFilter.frequency.setTargetAtTime(100 + (amount * 1500), time, 0.1);
  }

  playAlert() {
    if (!this.initialized || !this.ctx || !this.masterGain) return;
    if (this.ctx.state === 'suspended') {
        this.ctx.resume().catch(() => {});
    }

    const time = this.ctx.currentTime;
    
    // Double beep
    const playBeep = (t: number) => {
        const osc = this.ctx!.createOscillator();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(1200, t);
        osc.frequency.exponentialRampToValueAtTime(600, t + 0.1);
        
        const gain = this.ctx!.createGain();
        gain.gain.setValueAtTime(0.15, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.1);
        
        osc.connect(gain);
        gain.connect(this.masterGain!);
        
        osc.start(t);
        osc.stop(t + 0.1);
    };

    playBeep(time);
    playBeep(time + 0.15);
  }

  playLaser() {
    if (!this.initialized || !this.ctx || !this.masterGain) return;
    
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(800, t);
    osc.frequency.exponentialRampToValueAtTime(100, t + 0.15);

    gain.gain.setValueAtTime(0.2, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.15);

    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(t);
    osc.stop(t + 0.15);
  }

  playExplosion() {
    if (!this.initialized || !this.ctx || !this.masterGain) return;

    const t = this.ctx.currentTime;
    const bufferSize = this.ctx.sampleRate * 0.5; // 0.5 seconds
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1);
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1000, t);
    filter.frequency.exponentialRampToValueAtTime(50, t + 0.4);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.4, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.4);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);
    noise.start(t);
  }

  toggleMute() {
    this.muted = !this.muted;
    if (this.masterGain && this.ctx) {
        this.masterGain.gain.setTargetAtTime(this.muted ? 0 : 0.3, this.ctx.currentTime, 0.1);
    }
    if (this.musicGain && this.ctx) {
        this.musicGain.gain.setTargetAtTime(this.muted ? 0 : this.musicVolume, this.ctx.currentTime, 0.1);
    }
    return this.muted;
  }

  isAudioInitialized() {
    return this.initialized;
  }

  // --- Background Music Methods ---

  private async loadMusicTracks() {
    if (!this.ctx) return;

    const modes: GameMode[] = ['solar', 'arcade', 'orbit', 'raiden'];
    const extensions = ['mp3', 'ogg', 'wav'];

    for (const mode of modes) {
      // Try to load each music file with fallback extensions
      for (const ext of extensions) {
        try {
          const url = `/music/${mode}.${ext}`;
          const response = await fetch(url);
          if (!response.ok) continue;

          const arrayBuffer = await response.arrayBuffer();
          const audioBuffer = await this.ctx.decodeAudioData(arrayBuffer);
          this.musicBuffers.set(mode, audioBuffer);
          console.log(`Loaded background music: ${mode}.${ext}`);
          break; // Successfully loaded, stop trying other extensions
        } catch (error) {
          // Silently continue to next extension/mode
          continue;
        }
      }
    }
  }

  playMusicForMode(mode: GameMode) {
    if (!this.initialized || !this.ctx || !this.musicGain || !this.isMusicEnabled) return;
    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }

    // Don't restart if already playing this track
    if (this.currentTrack === mode && this.currentMusicSource) return;

    // Stop current music with fade out
    if (this.currentMusicSource) {
      const fadeOutTime = 1.0; // 1 second fade
      this.musicGain.gain.setTargetAtTime(0, this.ctx.currentTime, fadeOutTime / 3);

      const oldSource = this.currentMusicSource;
      setTimeout(() => {
        try {
          oldSource.stop();
        } catch (e) {
          // Already stopped
        }
      }, fadeOutTime * 1000);
    }

    // Get the buffer for this mode
    const buffer = this.musicBuffers.get(mode);
    if (!buffer) {
      console.log(`No music file found for ${mode} mode`);
      return;
    }

    // Create and start new music source
    const source = this.ctx.createBufferSource();
    source.buffer = buffer;
    source.loop = true;
    source.connect(this.musicGain);

    // Fade in
    this.musicGain.gain.setValueAtTime(0, this.ctx.currentTime);
    this.musicGain.gain.setTargetAtTime(
      this.muted ? 0 : this.musicVolume,
      this.ctx.currentTime,
      1.0
    );

    source.start(0);
    this.currentMusicSource = source;
    this.currentTrack = mode;
  }

  stopMusic() {
    if (!this.currentMusicSource || !this.ctx || !this.musicGain) return;

    // Fade out
    this.musicGain.gain.setTargetAtTime(0, this.ctx.currentTime, 0.5);

    const source = this.currentMusicSource;
    setTimeout(() => {
      try {
        source.stop();
      } catch (e) {
        // Already stopped
      }
    }, 500);

    this.currentMusicSource = null;
    this.currentTrack = null;
  }

  setMusicVolume(volume: number) {
    this.musicVolume = Math.max(0, Math.min(1, volume));
    if (this.musicGain && this.ctx && !this.muted) {
      this.musicGain.gain.setTargetAtTime(this.musicVolume, this.ctx.currentTime, 0.1);
    }
  }

  getMusicVolume() {
    return this.musicVolume;
  }

  toggleMusic() {
    this.isMusicEnabled = !this.isMusicEnabled;
    if (!this.isMusicEnabled) {
      this.stopMusic();
    }
    return this.isMusicEnabled;
  }

  isMusicPlaying() {
    return this.currentMusicSource !== null;
  }
}

export const audioService = new AudioService();
