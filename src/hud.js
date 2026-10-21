export class HUD {
  constructor() {
    this.speedValueEl = document.getElementById('speed-value');
    this.speedBarEl = document.getElementById('speed-bar');
    this.distValueEl = document.getElementById('dist-value');
    this.coinsValueEl = document.getElementById('coins-value');
    this.scoreValueEl = document.getElementById('score-value');
    this.trickPopupEl = document.getElementById('trick-popup');
    this.cameraLabelEl = document.getElementById('camera-label');

    // Time Trial Elements
    this.lapTimeEl = document.getElementById('lap-time');
    this.cpProgressEl = document.getElementById('cp-progress');
    this.bestLapEl = document.getElementById('best-lap');

    // Minimap Canvas
    this.mapCanvas = document.getElementById('minimap-canvas');
    if (this.mapCanvas) {
      this.mapCtx = this.mapCanvas.getContext('2d');
    }

    this.lastTrick = '';
    this.trickTimeout = null;
  }

  update(physicsData, coinsCollected, cameraMode, world) {
    // 1. Speedometer
    const speed = Math.round(physicsData.speedKmh);
    if (this.speedValueEl) {
      this.speedValueEl.textContent = speed;
    }
    if (this.speedBarEl) {
      const pct = Math.min(100, (speed / 60) * 100);
      this.speedBarEl.style.width = `${pct}%`;
    }

    // 2. Distance
    if (this.distValueEl) {
      const d = Math.round(physicsData.totalDistance);
      if (d > 1000) {
        this.distValueEl.textContent = `${(d / 1000).toFixed(2)} km`;
      } else {
        this.distValueEl.textContent = `${d} m`;
      }
    }

    // 3. Coins & Score
    if (this.coinsValueEl) {
      this.coinsValueEl.textContent = coinsCollected;
    }
    if (this.scoreValueEl) {
      this.scoreValueEl.textContent = physicsData.stuntScore;
    }

    // 4. Stunt Popup
    if (physicsData.trickName && physicsData.trickName !== this.lastTrick) {
      this.lastTrick = physicsData.trickName;
      if (this.trickPopupEl) {
        this.trickPopupEl.textContent = physicsData.trickName;
        this.trickPopupEl.classList.remove('hidden');
        this.trickPopupEl.classList.add('pop-animation');
        clearTimeout(this.trickTimeout);
        this.trickTimeout = setTimeout(() => {
          this.trickPopupEl.classList.remove('pop-animation');
          this.trickPopupEl.classList.add('hidden');
        }, 2200);
      }
    }

    // 5. Camera Label
    if (this.cameraLabelEl) {
      this.cameraLabelEl.textContent = cameraMode;
    }

    // 6. Time Trial
    if (timeTrialData) {
      if (this.lapTimeEl) {
        this.lapTimeEl.textContent = this.formatTime(timeTrialData.lapTime);
      }
      if (this.cpProgressEl) {
        this.cpProgressEl.textContent = `${timeTrialData.activeCheckpoint + 1} / ${timeTrialData.totalCheckpoints}`;
      }
      if (this.bestLapEl) {
        this.bestLapEl.textContent = timeTrialData.bestLap ? this.formatTime(timeTrialData.bestLap) : '--:--.-';
      }
    }

    // 7. Mini-map
    this.drawMinimap(physicsData, world, timeTrialData ? timeTrialData.activeCheckpoint : 0);
  }

  formatTime(seconds) {
    if (!seconds || seconds <= 0) return '00:00.0';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 10);
    const pad = (n) => n.toString().padStart(2, '0');
    return `${pad(mins)}:${pad(secs)}.${ms}`;
  }

  drawMinimap(physicsData, world) {
    if (!this.mapCtx || !world) return;
    const ctx = this.mapCtx;
    const w = this.mapCanvas.width;
    const h = this.mapCanvas.height;
    const cx = w / 2;
    const cy = h / 2;
    const scale = 0.32; // Map scale factor

    ctx.clearRect(0, 0, w, h);

    // Map background
    ctx.fillStyle = 'rgba(15, 23, 42, 0.75)';
    ctx.beginPath();
    ctx.arc(cx, cy, cx - 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#00e5ff';
    ctx.stroke();

    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, cx - 3, 0, Math.PI * 2);
    ctx.clip();

    // Center on player
    const px = physicsData.position ? physicsData.position.x : 0;
    const pz = physicsData.position ? physicsData.position.z : 0;

    // Draw road if available
    if (world.roadCurve) {
      ctx.strokeStyle = 'rgba(148, 163, 184, 0.6)';
      ctx.lineWidth = 5;
      ctx.beginPath();
      const points = world.roadCurve.getPoints(80);
      for (let i = 0; i < points.length; i++) {
        const mx = cx + (points[i].x - px) * scale;
        const my = cy + (points[i].z - pz) * scale;
        if (i === 0) ctx.moveTo(mx, my);
        else ctx.lineTo(mx, my);
      }
      ctx.closePath();
      ctx.stroke();
    }

    // Draw uncollected coins
    ctx.fillStyle = '#ffd700';
    for (const coin of world.coins) {
      if (!coin.userData.collected) {
        const mx = cx + (coin.position.x - px) * scale;
        const my = cy + (coin.position.z - pz) * scale;
        ctx.beginPath();
        ctx.arc(mx, my, 2.5, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Draw Ramps
    ctx.fillStyle = '#ff7043';
    for (const ramp of world.ramps) {
      const mx = cx + (ramp.pos.x - px) * scale;
      const my = cy + (ramp.pos.z - pz) * scale;
      ctx.beginPath();
      ctx.arc(mx, my, 3.5, 0, Math.PI * 2);
      ctx.fill();
    }

    // Draw Checkpoints
    if (world.checkpoints) {
      world.checkpoints.forEach((cp, idx) => {
        const mx = cx + (cp.pos.x - px) * scale;
        const my = cy + (cp.pos.z - pz) * scale;
        const isActive = (idx === activeCpIdx);
        ctx.fillStyle = isActive ? '#00e676' : 'rgba(0, 229, 255, 0.4)';
        ctx.beginPath();
        ctx.arc(mx, my, isActive ? 4.5 : 2.5, 0, Math.PI * 2);
        ctx.fill();
        if (isActive) {
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 1.5;
          ctx.stroke();
        }
      });
    }

    // Player arrow at center
    ctx.restore();
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(-physicsData.heading + Math.PI);

    ctx.fillStyle = '#00e5ff';
    ctx.beginPath();
    ctx.moveTo(0, -7);
    ctx.lineTo(5, 6);
    ctx.lineTo(0, 3);
    ctx.lineTo(-5, 6);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }
}
