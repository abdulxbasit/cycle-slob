import * as THREE from 'three';
import { GhostBicycle } from './bicycle.js';

export class GhostSystem {
  constructor(scene, world) {
    this.scene = scene;
    this.world = world;
    this.enabled = true;
    this.ghostBike = new GhostBicycle(this.scene);

    this.recording = []; // Samples recorded during the player's active lap
    this.lastRecordTime = -1;
    this.recordInterval = 0.05; // 20 Hz recording interval

    this.bestReplay = null; // Stored best lap replay samples
    this.bestLapTime = null;
    this.isBenchmark = false;

    this.freeRideTime = 0;
    this.ghostPosition = new THREE.Vector3();
    this.ghostHeading = 0;
    this.splitDelta = null; // In seconds (- ahead, + behind)

    this.checkpointSplits = []; // Splits at each checkpoint
    this.ghostCheckpointSplits = [];

    this.loadBestReplay();
  }

  loadBestReplay() {
    try {
      const saved = localStorage.getItem('velocity_ghost_replay');
      const savedLap = parseFloat(localStorage.getItem('velocity_best_lap'));
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 20) {
          this.bestReplay = parsed;
          this.bestLapTime = savedLap || parsed[parsed.length - 1].t;
          this.isBenchmark = false;
          this.ghostBike.setLabel('👑 YOUR RECORD', this.formatTime(this.bestLapTime));
          this.extractGhostCheckpointSplits();
          return;
        }
      }
    } catch (e) {
      console.warn('Could not load ghost replay from storage', e);
    }

    // Fallback: procedural benchmark rival ghost along circuit road
    this.generateBenchmarkReplay();
  }

  saveBestReplay(replay, lapTime) {
    this.bestReplay = replay;
    this.bestLapTime = lapTime;
    this.isBenchmark = false;
    this.ghostBike.setLabel('👑 YOUR RECORD', this.formatTime(lapTime));
    this.extractGhostCheckpointSplits();

    try {
      localStorage.setItem('velocity_ghost_replay', JSON.stringify(replay));
      localStorage.setItem('velocity_best_lap', lapTime.toFixed(2));
    } catch (e) {
      console.warn('Could not save ghost replay to localStorage', e);
    }
  }

  generateBenchmarkReplay() {
    if (!this.world || !this.world.roadCurve) return;
    const curve = this.world.roadCurve;

    // Benchmark rival ghost lap: ~54.8 seconds (~24.5 m/s or 88 km/h fast pace)
    const targetDuration = 54.8;
    const sampleRate = 0.05;
    const totalSamples = Math.floor(targetDuration / sampleRate);
    const replay = [];

    for (let i = 0; i <= totalSamples; i++) {
      const t = i * sampleRate;
      const u = (i / totalSamples) % 1.0;

      const pt = curve.getPointAt(u);
      const tangent = curve.getTangentAt(u);
      const groundY = this.world.getTerrainHeight(pt.x, pt.z) + 0.42;

      // Heading from tangent vector
      const heading = Math.atan2(tangent.x, tangent.z);

      // Estimate road curvature & lean banking
      const nextU = ((i + 1) / totalSamples) % 1.0;
      const nextTan = curve.getTangentAt(nextU);
      const headingNext = Math.atan2(nextTan.x, nextTan.z);
      let angleDiff = headingNext - heading;
      while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
      while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
      const turnRate = angleDiff / sampleRate;

      const lean = THREE.MathUtils.clamp(-turnRate * 0.7, -0.42, 0.42);
      const steer = THREE.MathUtils.clamp(turnRate * 0.32, -0.38, 0.38);

      // Slower in hairpin corners, full throttle on straights
      const speed = Math.max(13.0, 22.5 - Math.abs(turnRate) * 11.0);

      replay.push({
        t: Math.round(t * 100) / 100,
        x: Math.round(pt.x * 100) / 100,
        y: Math.round(groundY * 100) / 100,
        z: Math.round(pt.z * 100) / 100,
        heading: Math.round(heading * 1000) / 1000,
        pitch: 0,
        roll: 0,
        speed: Math.round(speed * 10) / 10,
        steer: Math.round(steer * 100) / 100,
        lean: Math.round(lean * 100) / 100,
      });
    }

    this.bestReplay = replay;
    this.bestLapTime = targetDuration;
    this.isBenchmark = true;
    this.ghostBike.setLabel('👻 RIVAL GHOST', this.formatTime(targetDuration));
    this.extractGhostCheckpointSplits();
  }

  extractGhostCheckpointSplits() {
    this.ghostCheckpointSplits = [];
    if (!this.bestReplay || !this.world || !this.world.checkpoints) return;

    const cps = this.world.checkpoints;
    cps.forEach(cp => {
      let closestSample = null;
      let minDistance = Infinity;

      for (const s of this.bestReplay) {
        const d = Math.hypot(s.x - cp.pos.x, s.z - cp.pos.z);
        if (d < minDistance) {
          minDistance = d;
          closestSample = s;
        }
      }

      this.ghostCheckpointSplits.push(closestSample ? closestSample.t : null);
    });
  }

  recordSample(lapTime, physics, physicsData) {
    if (!this.enabled) return;
    if (lapTime - this.lastRecordTime < this.recordInterval) return;
    this.lastRecordTime = lapTime;

    const sample = {
      t: Math.round(lapTime * 100) / 100,
      x: Math.round(physics.position.x * 100) / 100,
      y: Math.round(physics.position.y * 100) / 100,
      z: Math.round(physics.position.z * 100) / 100,
      heading: Math.round(physics.heading * 1000) / 1000,
      pitch: Math.round(physics.pitchAngle * 1000) / 1000,
      roll: Math.round(physics.rollAngle * 1000) / 1000,
      speed: Math.round(physicsData.forwardSpeed * 10) / 10,
      steer: Math.round(physicsData.steerInput * 100) / 100,
      lean: Math.round(physicsData.leanAngle * 100) / 100,
    };
    this.recording.push(sample);
  }

  onLapStart() {
    this.recording = [];
    this.lastRecordTime = -1;
    this.checkpointSplits = [];
    this.splitDelta = null;
  }

  onLapComplete(lapTime) {
    const isRecord = (!this.bestLapTime || lapTime < this.bestLapTime);
    if (isRecord && this.recording.length > 20) {
      this.saveBestReplay(this.recording, lapTime);
    }
    this.recording = [];
    return isRecord;
  }

  onCheckpointHit(cpIndex, lapTime) {
    this.checkpointSplits[cpIndex] = lapTime;
    const ghostSplit = this.ghostCheckpointSplits[cpIndex];
    if (ghostSplit !== undefined && ghostSplit !== null) {
      this.splitDelta = lapTime - ghostSplit; // Negative = player is ahead!
    }
  }

  sampleReplayAt(replay, t) {
    if (!replay || replay.length === 0) return null;
    if (t <= replay[0].t) return replay[0];
    if (t >= replay[replay.length - 1].t) return replay[replay.length - 1];

    let low = 0;
    let high = replay.length - 1;
    while (low <= high) {
      const mid = (low + high) >> 1;
      if (replay[mid].t < t) {
        low = mid + 1;
      } else {
        high = mid - 1;
      }
    }

    const i0 = Math.max(0, low - 1);
    const i1 = Math.min(replay.length - 1, low);
    const s0 = replay[i0];
    const s1 = replay[i1];

    if (i0 === i1 || s1.t === s0.t) return s0;

    const alpha = (t - s0.t) / (s1.t - s0.t);

    const lerpAngle = (a0, a1, frac) => {
      let diff = a1 - a0;
      while (diff > Math.PI) diff -= Math.PI * 2;
      while (diff < -Math.PI) diff += Math.PI * 2;
      return a0 + diff * frac;
    };

    return {
      t: t,
      x: THREE.MathUtils.lerp(s0.x, s1.x, alpha),
      y: THREE.MathUtils.lerp(s0.y, s1.y, alpha),
      z: THREE.MathUtils.lerp(s0.z, s1.z, alpha),
      heading: lerpAngle(s0.heading, s1.heading, alpha),
      pitch: THREE.MathUtils.lerp(s0.pitch, s1.pitch, alpha),
      roll: THREE.MathUtils.lerp(s0.roll, s1.roll, alpha),
      speed: THREE.MathUtils.lerp(s0.speed, s1.speed, alpha),
      steer: THREE.MathUtils.lerp(s0.steer, s1.steer, alpha),
      lean: THREE.MathUtils.lerp(s0.lean, s1.lean, alpha),
    };
  }

  update(dt, isPlayerLapActive, playerLapTime, playerPos) {
    if (!this.enabled || !this.bestReplay || this.bestReplay.length < 2) {
      this.ghostBike.setVisible(false);
      return null;
    }

    this.ghostBike.setVisible(true);

    const replay = this.bestReplay;
    const duration = replay[replay.length - 1].t || this.bestLapTime;

    let targetTime = 0;
    if (isPlayerLapActive) {
      // Synchronized head-to-head racing with current lap!
      targetTime = playerLapTime;
      if (targetTime > duration) {
        targetTime = duration;
      }
    } else {
      // Free ride mode: ghost loops track continuously
      this.freeRideTime = (this.freeRideTime + dt) % duration;
      targetTime = this.freeRideTime;
    }

    const sample = this.sampleReplayAt(replay, targetTime);
    if (!sample) return null;

    const vel = new THREE.Vector3(
      Math.sin(sample.heading) * sample.speed,
      0,
      Math.cos(sample.heading) * sample.speed
    );

    this.ghostPosition.set(sample.x, sample.y, sample.z);
    this.ghostHeading = sample.heading;

    this.ghostBike.updateGhost(
      this.ghostPosition,
      sample.heading,
      sample.pitch,
      sample.roll,
      sample.steer,
      sample.lean,
      vel,
      dt
    );

    // Compute continuous spatial split delta
    let delta = this.splitDelta;
    if (isPlayerLapActive && playerPos) {
      const toPlayer = new THREE.Vector3().subVectors(playerPos, this.ghostPosition);
      const forward = new THREE.Vector3(Math.sin(sample.heading), 0, Math.cos(sample.heading));
      const dot = toPlayer.dot(forward);
      const avgSpeed = Math.max(6, sample.speed);
      delta = -(dot / avgSpeed); // Negative = player is ahead
    }

    return {
      position: this.ghostPosition,
      heading: this.ghostHeading,
      delta: delta,
      bestLapTime: this.bestLapTime,
      isBenchmark: this.isBenchmark,
    };
  }

  toggleVisible() {
    this.enabled = !this.enabled;
    this.ghostBike.setVisible(this.enabled);
    return this.enabled;
  }

  formatTime(seconds) {
    if (!seconds || seconds <= 0) return '00:00.0';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 10);
    const pad = (n) => n.toString().padStart(2, '0');
    return `${pad(mins)}:${pad(secs)}.${ms}`;
  }
}
