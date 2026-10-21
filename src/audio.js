// Synthesized Web Audio API sound effects and procedural BGM synthesizer
// Zero external audio assets required - 100% procedurally synthesized

class ProceduralMusicSynthesizer {
  constructor(ctx) {
    this.ctx = ctx;
    this.isPlaying = false;
    this.timerId = null;
    this.currentTrackIndex = 0; // 0: Cyber Cruise, 1: Neon Downhill, 2: Sunset Glide
    this.speedIntensity = 0;
    this.isBoosting = false;
    this.userEnabled = true;

    // Timing state
    this.nextNoteTime = 0;
    this.current16thStep = 0;
    this.scheduleAheadTime = 0.12; // 120ms lookahead
    this.lookaheadInterval = 25; // 25ms interval check

    // Pre-allocated noise buffer for drum sounds
    this.noiseBuffer = null;

    // Track definitions
    this.tracks = [
      {
        id: 'cyber-cruise',
        name: 'CYBER CRUISE',
        bpm: 122,
        bars: 8,
        description: 'Driving 80s synthwave arpeggio & galloping bassline',
        // 8-bar chord roots: Am, F, C, G, Am, F, Dm, Em
        chords: [
          { root: 45, arpNotes: [69, 72, 76, 81, 76, 72, 69, 72, 76, 81, 84, 81, 76, 72, 76, 72] }, // Am
          { root: 41, arpNotes: [65, 69, 72, 77, 72, 69, 65, 69, 72, 77, 81, 77, 72, 69, 72, 69] }, // F
          { root: 36, arpNotes: [60, 64, 67, 72, 67, 64, 60, 64, 67, 72, 76, 72, 67, 64, 67, 64] }, // C
          { root: 43, arpNotes: [67, 71, 74, 79, 74, 71, 67, 71, 74, 79, 83, 79, 74, 71, 74, 71] }, // G
          { root: 45, arpNotes: [69, 72, 76, 81, 76, 72, 69, 72, 76, 81, 84, 81, 76, 72, 76, 72] }, // Am
          { root: 41, arpNotes: [65, 69, 72, 77, 72, 69, 65, 69, 72, 77, 81, 77, 72, 69, 72, 69] }, // F
          { root: 38, arpNotes: [62, 65, 69, 74, 69, 65, 62, 65, 69, 74, 77, 74, 69, 65, 69, 65] }, // Dm
          { root: 40, arpNotes: [64, 67, 71, 76, 71, 67, 64, 67, 71, 76, 79, 76, 71, 67, 71, 67] }  // Em
        ],
        // Lead melody on bars 4-7
        leadMelody: [
          null, null, null, null, // bars 0-3 no lead
          [69, null, null, 72, null, 76, null, 74, null, 72, null, 69, null, null, 72, 74], // bar 4
          [76, null, null, 77, null, 76, null, 72, null, 69, null, 65, null, null, 69, 72], // bar 5
          [74, null, null, 76, null, 74, null, 72, null, 67, null, 72, null, null, 74, 76], // bar 6
          [79, null, 76, 74, null, 72, null, 71, null, 69, null, 67, null, 69, null, null]  // bar 7
        ],
        drumStyle: 'synthwave'
      },
      {
        id: 'neon-downhill',
        name: 'NEON DOWNHILL',
        bpm: 138,
        bars: 4,
        description: 'Fast-paced arcade chiptune rush with square wave leads',
        chords: [
          { root: 38, arpNotes: [74, 77, 81, 86, 81, 77, 74, 77, 81, 86, 89, 86, 81, 77, 81, 77] }, // Dm
          { root: 34, arpNotes: [70, 74, 77, 82, 77, 74, 70, 74, 77, 82, 86, 82, 77, 74, 77, 74] }, // Bb
          { root: 41, arpNotes: [72, 77, 81, 84, 81, 77, 72, 77, 81, 84, 89, 84, 81, 77, 81, 77] }, // F
          { root: 36, arpNotes: [72, 76, 79, 84, 79, 76, 72, 76, 79, 84, 88, 84, 79, 76, 79, 76] }  // C
        ],
        leadMelody: [
          [74, null, 77, null, 81, null, 86, null, 84, null, 81, null, 77, null, 74, 77],
          [70, null, 74, null, 77, null, 82, null, 81, null, 77, null, 74, null, 70, 74],
          [72, null, 77, null, 81, null, 84, null, 86, null, 84, null, 81, null, 77, 81],
          [84, null, 81, null, 79, null, 76, null, 74, 76, 77, 79, 81, 84, 86, 89]
        ],
        drumStyle: 'chiptune'
      },
      {
        id: 'sunset-glide',
        name: 'SUNSET GLIDE',
        bpm: 104,
        bars: 4,
        description: 'Chillwave lo-fi retro cruise with warm filter pads',
        chords: [
          { root: 40, arpNotes: [64, 67, 71, 74, 71, 67, 64, 67, 71, 74, 76, 74, 71, 67, 71, 67] }, // Em7
          { root: 36, arpNotes: [60, 64, 67, 71, 67, 64, 60, 64, 67, 71, 72, 71, 67, 64, 67, 64] }, // Cmaj7
          { root: 31, arpNotes: [55, 59, 62, 67, 62, 59, 55, 59, 62, 67, 71, 67, 62, 59, 62, 59] }, // G
          { root: 38, arpNotes: [62, 66, 69, 74, 69, 66, 62, 66, 69, 74, 78, 74, 69, 66, 69, 66] }  // D
        ],
        leadMelody: [
          [67, null, null, null, 71, null, null, null, 74, null, 76, null, 74, null, null, null],
          [72, null, null, null, 71, null, 67, null, 64, null, null, null, 67, null, 71, null],
          [67, null, null, null, 62, null, null, null, 67, null, 71, null, 74, null, null, null],
          [69, null, null, null, 74, null, 71, null, 69, null, 66, null, 67, null, null, null]
        ],
        drumStyle: 'chillwave'
      }
    ];

    // Load user preference from localStorage
    const savedTrack = localStorage.getItem('velocity_bgm_track');
    if (savedTrack !== null) {
      const idx = parseInt(savedTrack, 10);
      if (!isNaN(idx)) {
        if (idx === -1) {
          this.userEnabled = false;
        } else if (idx >= 0 && idx < this.tracks.length) {
          this.currentTrackIndex = idx;
        }
      }
    }
  }

  initAudioGraph() {
    if (!this.ctx || this.audioGraphInitialized) return;

    // Master Music Bus
    this.musicGain = this.ctx.createGain();
    this.musicGain.gain.setValueAtTime(this.userEnabled ? 0.36 : 0, this.ctx.currentTime);

    // Dynamic Filter responding to bike speed & boost
    this.musicFilter = this.ctx.createBiquadFilter();
    this.musicFilter.type = 'lowpass';
    this.musicFilter.frequency.setValueAtTime(3600, this.ctx.currentTime);
    this.musicFilter.Q.value = 2.0;

    // Sub-busses
    this.drumGain = this.ctx.createGain();
    this.drumGain.gain.setValueAtTime(0.48, this.ctx.currentTime);

    this.bassGain = this.ctx.createGain();
    this.bassGain.gain.setValueAtTime(0.34, this.ctx.currentTime);

    this.arpGain = this.ctx.createGain();
    this.arpGain.gain.setValueAtTime(0.22, this.ctx.currentTime);

    this.leadGain = this.ctx.createGain();
    this.leadGain.gain.setValueAtTime(0.24, this.ctx.currentTime);

    // Connect sub-busses to dynamic music filter
    this.drumGain.connect(this.musicFilter);
    this.bassGain.connect(this.musicFilter);
    this.arpGain.connect(this.musicFilter);
    this.leadGain.connect(this.musicFilter);

    // Connect filter to master music gain
    this.musicFilter.connect(this.musicGain);

    // Connect master music gain to destination
    this.musicGain.connect(this.ctx.destination);

    // Pre-create 1-second white noise buffer for drums
    const bufferSize = Math.floor(this.ctx.sampleRate * 1.0);
    this.noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = this.noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }

    this.audioGraphInitialized = true;
  }

  start() {
    if (this.isPlaying) return;
    this.initAudioGraph();
    if (!this.ctx) return;

    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }

    this.isPlaying = true;
    this.current16thStep = 0;
    this.nextNoteTime = this.ctx.currentTime + 0.05;

    if (this.timerId) clearInterval(this.timerId);
    this.timerId = setInterval(() => this.scheduler(), this.lookaheadInterval);
  }

  stop() {
    if (!this.isPlaying) return;
    this.isPlaying = false;
    if (this.timerId) {
      clearInterval(this.timerId);
      this.timerId = null;
    }
  }

  scheduler() {
    if (!this.ctx || !this.isPlaying) return;

    while (this.nextNoteTime < this.ctx.currentTime + this.scheduleAheadTime) {
      this.scheduleStep(this.current16thStep, this.nextNoteTime);
      this.advanceStep();
    }
  }

  advanceStep() {
    const track = this.tracks[this.currentTrackIndex];
    let effectiveBpm = track.bpm;

    // Gentle dynamic tempo boost during Nitro
    if (this.isBoosting) {
      effectiveBpm += 6;
    }

    const secondsPerBeat = 60.0 / effectiveBpm;
    const secondsPer16th = secondsPerBeat / 4.0;

    this.nextNoteTime += secondsPer16th;
    this.current16thStep = (this.current16thStep + 1) % (track.bars * 16);
  }

  scheduleStep(stepIndex, time) {
    if (!this.userEnabled) return;
    const track = this.tracks[this.currentTrackIndex];
    const totalBars = track.bars;
    const barIndex = Math.floor(stepIndex / 16) % totalBars;
    const stepInBar = stepIndex % 16;
    const chordData = track.chords[barIndex % track.chords.length];

    // 1. Bassline
    this.scheduleBass(chordData.root, stepInBar, time, track.drumStyle);

    // 2. Arpeggio
    if (chordData.arpNotes && chordData.arpNotes.length > 0) {
      const arpNote = chordData.arpNotes[stepInBar % chordData.arpNotes.length];
      this.scheduleArp(arpNote, stepInBar, time, track.drumStyle);
    }

    // 3. Drums
    this.scheduleDrums(stepInBar, barIndex, time, track.drumStyle);

    // 4. Lead Melody
    if (track.leadMelody && track.leadMelody[barIndex]) {
      const melodyBar = track.leadMelody[barIndex];
      const leadNote = melodyBar[stepInBar];
      if (leadNote !== null && leadNote !== undefined) {
        this.scheduleLead(leadNote, time, track.drumStyle);
      }
    }
  }

  scheduleBass(rootMidi, stepInBar, time, style) {
    if (!this.bassGain) return;

    let shouldPlay = false;
    let noteToPlay = rootMidi;
    let noteDur = 0.11;

    if (style === 'synthwave') {
      // Galloping 16th bassline (16th notes with octave jumps)
      shouldPlay = true;
      if (stepInBar % 4 === 1 || stepInBar % 4 === 3) {
        noteToPlay = rootMidi + 12; // Octave upper bounce
      }
    } else if (style === 'chiptune') {
      // Punchy 16th chiptune driving bass
      shouldPlay = stepInBar % 2 === 0 || stepInBar === 3 || stepInBar === 7 || stepInBar === 11 || stepInBar === 15;
      if (stepInBar === 14 || stepInBar === 15) {
        noteToPlay = rootMidi + 7; // 5th bounce before next bar
      }
    } else if (style === 'chillwave') {
      // Sustained mellow bass on downbeats
      shouldPlay = stepInBar === 0 || stepInBar === 6 || stepInBar === 10;
      noteDur = 0.28;
    }

    if (!shouldPlay) return;

    const freq = 440 * Math.pow(2, (noteToPlay - 69) / 12);

    // Dual oscillator: Rich Sawtooth + Sub Square (1 octave down)
    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    osc1.type = 'sawtooth';
    osc1.frequency.setValueAtTime(freq, time);

    osc2.type = 'square';
    osc2.frequency.setValueAtTime(freq * 0.5, time);

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.Q.value = 3.6;

    // Envelope sweep: sharp attack, decay to warm body
    const baseCutoff = Math.min(3600, 480 + this.speedIntensity * 1400);
    filter.frequency.setValueAtTime(baseCutoff, time);
    filter.frequency.exponentialRampToValueAtTime(140, time + noteDur * 0.9);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.28, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + noteDur);

    osc1.connect(filter);
    osc2.connect(filter);
    filter.connect(gain);
    gain.connect(this.bassGain);

    osc1.start(time);
    osc2.start(time);
    osc1.stop(time + noteDur + 0.02);
    osc2.stop(time + noteDur + 0.02);
  }

  scheduleArp(midiNote, stepInBar, time, style) {
    if (!this.arpGain) return;

    const freq = 440 * Math.pow(2, (midiNote - 69) / 12);
    const osc = this.ctx.createOscillator();
    osc.type = style === 'chiptune' ? 'square' : 'triangle';
    osc.frequency.setValueAtTime(freq, time);

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    const centerFreq = Math.min(6500, 1800 + this.speedIntensity * 3000);
    filter.frequency.setValueAtTime(centerFreq, time);
    filter.Q.value = 3.0;

    const gain = this.ctx.createGain();
    const dur = style === 'chiptune' ? 0.06 : 0.09;
    gain.gain.setValueAtTime(0.18, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + dur);

    osc.connect(filter);
    filter.connect(gain);

    // Ping-pong stereo panner
    if (this.ctx.createStereoPanner) {
      try {
        const panner = this.ctx.createStereoPanner();
        const panVal = Math.sin(stepInBar * 0.8) * 0.55;
        panner.pan.setValueAtTime(panVal, time);
        gain.connect(panner);
        panner.connect(this.arpGain);
      } catch (e) {
        gain.connect(this.arpGain);
      }
    } else {
      gain.connect(this.arpGain);
    }

    osc.start(time);
    osc.stop(time + dur + 0.02);
  }

  scheduleLead(midiNote, time, style) {
    if (!this.leadGain) return;

    const freq = 440 * Math.pow(2, (midiNote - 69) / 12);
    const osc = this.ctx.createOscillator();
    osc.type = style === 'chiptune' ? 'square' : 'sawtooth';
    osc.frequency.setValueAtTime(freq, time);

    // Subtle pitch vibrato
    const vibrato = this.ctx.createOscillator();
    const vibGain = this.ctx.createGain();
    vibrato.frequency.value = 5.2; // 5.2Hz
    vibGain.gain.setValueAtTime(3.5, time);
    vibrato.connect(osc.frequency);
    vibrato.start(time);
    vibrato.stop(time + 0.28);

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(3200 + this.speedIntensity * 2400, time);
    filter.Q.value = 2.4;

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.001, time);
    gain.gain.linearRampToValueAtTime(0.24, time + 0.015);
    gain.gain.setValueAtTime(0.22, time + 0.16);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.28);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.leadGain);

    osc.start(time);
    osc.stop(time + 0.3);
  }

  scheduleDrums(stepInBar, barIndex, time, style) {
    if (!this.drumGain || !this.noiseBuffer) return;

    if (style === 'synthwave') {
      // 4-on-the-floor kick
      if (stepInBar === 0 || stepInBar === 4 || stepInBar === 8 || stepInBar === 12) {
        this.playKick(time);
      }
      // Gated 80s Snare on 4 and 12
      if (stepInBar === 4 || stepInBar === 12) {
        this.playSnare(time);
      }
      // Hi-Hats: 16th notes with open accent on step 2, 6, 10, 14
      if (stepInBar % 2 === 0) {
        const isOpen = stepInBar === 6 || stepInBar === 14;
        this.playHiHat(time, isOpen);
      }
      // Cymbal crash on downbeat of bar 0
      if (barIndex === 0 && stepInBar === 0) {
        this.playCrash(time);
      }
    } else if (style === 'chiptune') {
      // Fast syncopated chiptune drums
      if (stepInBar === 0 || stepInBar === 3 || stepInBar === 8 || stepInBar === 10) {
        this.playKick(time);
      }
      // Snare on 4 and 12, plus rapid fills on last bar
      if (stepInBar === 4 || stepInBar === 12 || (barIndex === 3 && stepInBar >= 13)) {
        this.playSnare(time);
      }
      // Constant chiptune 16th hi-hats
      this.playHiHat(time, stepInBar % 4 === 2);
    } else if (style === 'chillwave') {
      // Half-time chill groove
      if (stepInBar === 0 || stepInBar === 10) {
        this.playKick(time);
      }
      if (stepInBar === 8) {
        this.playSnare(time);
      }
      if (stepInBar % 2 === 0) {
        this.playHiHat(time, false);
      }
    }
  }

  playKick(time) {
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(155, time);
    osc.frequency.exponentialRampToValueAtTime(36, time + 0.08);

    gain.gain.setValueAtTime(0.5, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.13);

    osc.connect(gain);
    gain.connect(this.drumGain);
    osc.start(time);
    osc.stop(time + 0.14);
  }

  playSnare(time) {
    // 1. Tonal pitch drop
    const osc = this.ctx.createOscillator();
    const oscGain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(220, time);
    osc.frequency.exponentialRampToValueAtTime(75, time + 0.07);
    oscGain.gain.setValueAtTime(0.28, time);
    oscGain.gain.exponentialRampToValueAtTime(0.001, time + 0.09);
    osc.connect(oscGain);
    oscGain.connect(this.drumGain);
    osc.start(time);
    osc.stop(time + 0.1);

    // 2. Highpass filtered noise
    const noise = this.ctx.createBufferSource();
    noise.buffer = this.noiseBuffer;
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.setValueAtTime(1000, time);

    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(0.32, time);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, time + 0.16);

    noise.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(this.drumGain);
    noise.start(time);
    noise.stop(time + 0.18);
  }

  playHiHat(time, open = false) {
    const noise = this.ctx.createBufferSource();
    noise.buffer = this.noiseBuffer;
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(8500, time);
    filter.Q.value = 4.0;

    const gain = this.ctx.createGain();
    const dur = open ? 0.16 : 0.04;
    const vol = open ? 0.2 : 0.13;
    gain.gain.setValueAtTime(vol, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + dur);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.drumGain);
    noise.start(time);
    noise.stop(time + dur + 0.02);
  }

  playCrash(time) {
    const noise = this.ctx.createBufferSource();
    noise.buffer = this.noiseBuffer;
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.setValueAtTime(4500, time);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.3, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.75);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.drumGain);
    noise.start(time);
    noise.stop(time + 0.8);
  }

  // Dynamic modulation from bicycle speed & turbo boost
  update(speedKmh, isBoosting = false) {
    if (!this.ctx || !this.musicFilter) return;

    this.isBoosting = isBoosting;
    const targetIntensity = Math.min(1.0, Math.max(0, speedKmh / 55));
    // Smooth dampening
    this.speedIntensity += (targetIntensity - this.speedIntensity) * 0.1;

    const now = this.ctx.currentTime;
    let targetCutoff = 3200 + this.speedIntensity * 7000;
    if (isBoosting) {
      targetCutoff = 13500; // Explode brightness on Nitro
    }

    this.musicFilter.frequency.setTargetAtTime(targetCutoff, now, 0.15);
  }

  cycleTrack() {
    this.initAudioGraph();
    if (!this.userEnabled) {
      // Turn back on to track 0
      this.userEnabled = true;
      this.currentTrackIndex = 0;
      localStorage.setItem('velocity_bgm_track', '0');
      if (this.musicGain) {
        this.musicGain.gain.setTargetAtTime(0.36, this.ctx.currentTime, 0.1);
      }
      if (!this.isPlaying) this.start();
      return this.getTrackInfo();
    }

    if (this.currentTrackIndex < this.tracks.length - 1) {
      this.currentTrackIndex++;
      localStorage.setItem('velocity_bgm_track', this.currentTrackIndex.toString());
      this.current16thStep = 0;
    } else {
      // Toggle off
      this.userEnabled = false;
      localStorage.setItem('velocity_bgm_track', '-1');
      if (this.musicGain) {
        this.musicGain.gain.setTargetAtTime(0, this.ctx.currentTime, 0.1);
      }
      return { active: false, name: 'OFF', bpm: 0 };
    }

    return this.getTrackInfo();
  }

  toggleMusic() {
    return this.cycleTrack();
  }

  getTrackInfo() {
    if (!this.userEnabled) {
      return { active: false, name: 'OFF', bpm: 0 };
    }
    const track = this.tracks[this.currentTrackIndex];
    return {
      active: true,
      id: track.id,
      name: track.name,
      bpm: track.bpm,
      description: track.description
    };
  }

  setMute(isMuted) {
    if (!this.musicGain || !this.ctx) return;
    const targetGain = (isMuted || !this.userEnabled) ? 0 : 0.36;
    this.musicGain.gain.setTargetAtTime(targetGain, this.ctx.currentTime, 0.08);
  }
}

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
    this.music = null;
  }

  init() {
    if (this.initialized) {
      if (this.ctx && this.ctx.state === 'suspended') {
        this.ctx.resume();
      }
      return;
    }
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioContext();
      this.setupContinuousAudio();
      this.music = new ProceduralMusicSynthesizer(this.ctx);
      this.music.initAudioGraph();
      if (this.music.userEnabled && !this.muted) {
        this.music.start();
      }
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

    // 4. Rain ambient sound
    const rainSource = this.ctx.createBufferSource();
    rainSource.buffer = noiseBuffer;
    rainSource.loop = true;

    this.rainFilter = this.ctx.createBiquadFilter();
    this.rainFilter.type = 'lowpass';
    this.rainFilter.frequency.value = 1200;

    this.rainGain = this.ctx.createGain();
    this.rainGain.gain.value = 0;

    rainSource.connect(this.rainFilter);
    this.rainFilter.connect(this.rainGain);
    this.rainGain.connect(this.ctx.destination);
    rainSource.start(0);
  }

  update(speed, isGrounded, isPedaling, isSkidding = false, isBoosting = false) {
    if (!this.initialized || !this.ctx) return;
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }

    const absSpeed = Math.abs(speed);
    const now = this.ctx.currentTime;

    // Update Music dynamic modulation
    if (this.music && !this.muted) {
      this.music.update(absSpeed * 3.6, isBoosting);
    }

    if (this.muted) return;

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

  playEquip() {
    this.init();
    if (!this.ctx || this.muted) return;
    // High-tech ratchet wrench click + chime
    [523.25, 659.25, 783.99, 1046.50].forEach((freq, idx) => {
      setTimeout(() => {
        if (!this.ctx) return;
        const t = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const g = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, t);
        g.gain.setValueAtTime(0.14, t);
        g.gain.exponentialRampToValueAtTime(0.001, t + 0.18);
        osc.connect(g);
        g.connect(this.ctx.destination);
        osc.start(t);
        osc.stop(t + 0.2);
      }, idx * 45);
    });
  }

  playClick() {
    this.init();
    if (!this.ctx || this.muted) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(800, now);
    osc.frequency.exponentialRampToValueAtTime(400, now + 0.04);
    gain.gain.setValueAtTime(0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.05);
  }

  playSmash(type = 'cone') {
    this.init();
    if (!this.ctx || this.muted) return;
    const now = this.ctx.currentTime;
    if (type === 'pins') {
      [440, 580, 880, 1100, 1400].forEach((freq, idx) => {
        setTimeout(() => {
          if (!this.ctx) return;
          const t = this.ctx.currentTime;
          const osc = this.ctx.createOscillator();
          const g = this.ctx.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(freq + Math.random() * 80, t);
          g.gain.setValueAtTime(0.22, t);
          g.gain.exponentialRampToValueAtTime(0.001, t + 0.25);
          osc.connect(g);
          g.connect(this.ctx.destination);
          osc.start(t);
          osc.stop(t + 0.26);
        }, idx * 25);
      });
    } else if (type === 'wood') {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(160, now);
      osc.frequency.exponentialRampToValueAtTime(40, now + 0.15);
      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.2);
    } else {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(280, now);
      osc.frequency.exponentialRampToValueAtTime(70, now + 0.12);
      gain.gain.setValueAtTime(0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.15);
    }
  }

  setRainVolume(vol) {
    if (!this.ctx || !this.rainGain) return;
    this.rainGain.gain.setTargetAtTime(this.muted ? 0 : vol, this.ctx.currentTime, 0.4);
  }

  playThunder() {
    this.init();
    if (!this.ctx || this.muted) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(55, now);
    osc.frequency.exponentialRampToValueAtTime(24, now + 1.8);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(140, now);

    gain.gain.setValueAtTime(0.35, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 2.1);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 2.2);
  }

  cycleMusicTrack() {
    this.init();
    if (this.music) {
      return this.music.cycleTrack();
    }
    return { active: false, name: 'OFF', bpm: 0 };
  }

  getMusicTrackInfo() {
    if (this.music) {
      return this.music.getTrackInfo();
    }
    return { active: true, name: 'CYBER CRUISE', bpm: 122 };
  }

  toggleMute() {
    this.muted = !this.muted;
    if (this.rollGain && this.ctx) {
      this.rollGain.gain.setValueAtTime(0, this.ctx.currentTime);
    }
    if (this.windGain && this.ctx) {
      this.windGain.gain.setValueAtTime(0, this.ctx.currentTime);
    }
    if (this.music) {
      this.music.setMute(this.muted);
    }
    return this.muted;
  }
}

export const sound = new SoundController();
