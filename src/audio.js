// Synthesized Web Audio API sound effects - zero external audio assets required
class SoundController {
  constructor() {
    this.ctx = null;
    this.muted = false;
    this.initialized = false;
    this.rollNoise = null;
    this.rollGain = null;
    this.windNoise = null;
    this.windGain = null;
    this.chainOsc = null;
    this.chainGain = null;
    this.lastChainClick = 0;
  }

  init() {
    if (this.initialized) return;
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioContext();
      this.setupContinuousAudio();
      this.initialized = true;
    } catch (e) {
      console.warn('Web Audio not supported or blocked:', e);
    }
  }

  setupContinuousAudio() {
    if (!this.ctx) return;

    // 1. Tire rolling noise (filtered pink noise)
    const bufferSize = this.ctx.sampleRate * 2;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    let b0 = 0, b1 = 0, b2 = 0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.96900 * b2 + white * 0.1538520;
      output[i] = (b0 + b1 + b2) * 0.1;
    }

    const rollSource = this.ctx.createBufferSource();
    rollSource.buffer = noiseBuffer;
    rollSource.loop = true;

    this.rollFilter = this.ctx.createBiquadFilter();
    this.rollFilter.type = 'lowpass';
    this.rollFilter.frequency.value = 200;

    this.rollGain = this.ctx.createGain();
    this.rollGain.gain.value = 0;

    rollSource.connect(this.rollFilter);
    this.rollFilter.connect(this.rollGain);
    this.rollGain.connect(this.ctx.destination);
    rollSource.start(0);

    // 2. Wind noise for high speeds
    const windSource = this.ctx.createBufferSource();
    windSource.buffer = noiseBuffer;
    windSource.loop = true;

    this.windFilter = this.ctx.createBiquadFilter();
    this.windFilter.type = 'bandpass';
    this.windFilter.frequency.value = 450;
    this.windFilter.Q.value = 2.0;

    this.windGain = this.ctx.createGain();
    this.windGain.gain.value = 0;

    windSource.connect(this.windFilter);
    this.windFilter.connect(this.windGain);
    this.windGain.connect(this.ctx.destination);
    windSource.start(0);

    // 3. Tire screech / skid friction noise
    const skidSource = this.ctx.createBufferSource();
    skidSource.buffer = noiseBuffer;
    skidSource.loop = true;

    this.skidFilter = this.ctx.createBiquadFilter();
    this.skidFilter.type = 'bandpass';
    this.skidFilter.frequency.value = 1600;
    this.skidFilter.Q.value = 4.0;

    this.skidGain = this.ctx.createGain();
    this.skidGain.gain.value = 0;

    skidSource.connect(this.skidFilter);
    this.skidFilter.connect(this.skidGain);
    this.skidGain.connect(this.ctx.destination);
    skidSource.start(0);
  }

  update(speed, isGrounded, isPedaling, isSkidding = false) {
    if (!this.initialized || this.muted || !this.ctx) return;
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }

    const absSpeed = Math.abs(speed);
    const now = this.ctx.currentTime;

    // Roll noise modulation
    if (this.rollGain && this.rollFilter) {
      if (isGrounded && absSpeed > 0.5) {
        const targetGain = Math.min(0.25, (absSpeed / 40) * 0.2);
        this.rollGain.gain.setTargetAtTime(targetGain, now, 0.08);
        this.rollFilter.frequency.setTargetAtTime(150 + absSpeed * 30, now, 0.08);
      } else {
        this.rollGain.gain.setTargetAtTime(0, now, 0.05);
      }
    }

    // Wind noise
    if (this.windGain && this.windFilter) {
      if (absSpeed > 15) {
        const windStrength = Math.min(0.3, ((absSpeed - 15) / 45) * 0.3);
        this.windGain.gain.setTargetAtTime(windStrength, now, 0.1);
        this.windFilter.frequency.setTargetAtTime(350 + absSpeed * 20, now, 0.1);
      } else {
        this.windGain.gain.setTargetAtTime(0, now, 0.1);
      }
    }

    // Tire Skid Screech
    if (this.skidGain && this.skidFilter) {
      if (isGrounded && isSkidding && absSpeed > 1.5) {
        const skidVol = Math.min(0.35, 0.15 + (absSpeed / 30) * 0.2);
        this.skidGain.gain.setTargetAtTime(skidVol, now, 0.04);
        this.skidFilter.frequency.setTargetAtTime(1400 + Math.random() * 400, now, 0.04);
      } else {
        this.skidGain.gain.setTargetAtTime(0, now, 0.06);
      }
    }

    // Periodic chain click
    if (isPedaling && absSpeed > 1 && (Date.now() - this.lastChainClick > Math.max(60, 300 - absSpeed * 6))) {
      this.playChainClick();
      this.lastChainClick = Date.now();
    }
  }

  playChainClick() {
    if (!this.ctx || this.muted) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(800 + Math.random() * 200, this.ctx.currentTime);
    gain.gain.setValueAtTime(0.015, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + 0.03);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.035);
  }

  // Classic dual-tone bicycle bell ding-ding!
  ringBell() {
    this.init();
    if (!this.ctx || this.muted) return;

    const playChime = (freq, delay, dur) => {
      setTimeout(() => {
        if (!this.ctx) return;
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now);
        
        // Harmonics
        const osc2 = this.ctx.createOscillator();
        osc2.type = 'triangle';
        osc2.frequency.setValueAtTime(freq * 2.76, now);

        gain.gain.setValueAtTime(0.35, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + dur);

        osc.connect(gain);
        osc2.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now);
        osc2.start(now);
        osc.stop(now + dur);
        osc2.stop(now + dur);
      }, delay);
    };

    playChime(2093, 0, 0.6);   // High C7
    playChime(2637, 140, 0.7); // E7 ding-ding
  }

  playJump() {
    this.init();
    if (!this.ctx || this.muted) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(140, now);
    osc.frequency.exponentialRampToValueAtTime(320, now + 0.18);
    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.22);
  }

  playLand() {
    this.init();
    if (!this.ctx || this.muted) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(90, now);
    osc.frequency.exponentialRampToValueAtTime(35, now + 0.15);
    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.2);
  }

  playCoin() {
    this.init();
    if (!this.ctx || this.muted) return;
    const notes = [987.77, 1318.51, 1567.98, 2093.00];
    notes.forEach((freq, idx) => {
      setTimeout(() => {
        if (!this.ctx) return;
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now);
        gain.gain.setValueAtTime(0.18, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.26);
      }, idx * 60);
    });
  }

  playBoost() {
    this.init();
    if (!this.ctx || this.muted) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(110, now);
    osc.frequency.exponentialRampToValueAtTime(540, now + 0.8);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(300, now);
    filter.frequency.exponentialRampToValueAtTime(2400, now + 0.7);

    gain.gain.setValueAtTime(0.35, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.9);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.95);
  }

  toggleMute() {
    this.muted = !this.muted;
    if (this.rollGain && this.ctx) {
      this.rollGain.gain.setValueAtTime(0, this.ctx.currentTime);
    }
    if (this.windGain && this.ctx) {
      this.windGain.gain.setValueAtTime(0, this.ctx.currentTime);
    }
    return this.muted;
  }
}

export const sound = new SoundController();
