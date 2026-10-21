import { BIKE_PARTS_CATALOG } from './bicycle.js';

export class HUD {
  constructor() {
    this.speedValueEl = document.getElementById('speed-value');
    this.speedBarEl = document.getElementById('speed-bar');
    this.speedLinesEl = document.getElementById('speed-lines');
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

    // Active Category in Bike Shop
    this.activeShopSlot = 'frame';
  }

  update(physicsData, coinsCollected, cameraMode, world, timeTrialData = null, ghostData = null) {
    // 1. Speedometer
    const speed = Math.round(physicsData.speedKmh);
    if (this.speedValueEl) {
      this.speedValueEl.textContent = speed;
      if (physicsData.isBoosting) {
        this.speedValueEl.classList.add('boosting');
      } else {
        this.speedValueEl.classList.remove('boosting');
      }
    }

    if (this.speedBarEl) {
      const pct = Math.min(100, (speed / 65) * 100);
      this.speedBarEl.style.width = `${pct}%`;
    }

    if (this.speedLinesEl) {
      if (physicsData.isBoosting || speed > 48) {
        this.speedLinesEl.classList.add('active');
      } else {
        this.speedLinesEl.classList.remove('active');
      }
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

    // 4. Stunt Trick Popup
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

    // 6. Time Trial Splits
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

    // 7. Ghost Split Delta Display
    const ghostBadgeEl = document.getElementById('ghost-badge');
    const ghostDeltaEl = document.getElementById('ghost-delta');
    if (ghostBadgeEl && ghostDeltaEl) {
      if (ghostData && ghostData.delta !== null && timeTrialData && timeTrialData.lapActive) {
        ghostBadgeEl.classList.remove('hidden');
        const d = ghostData.delta;
        const sign = d <= 0 ? '-' : '+';
        const absD = Math.abs(d).toFixed(2);
        ghostDeltaEl.textContent = `${sign}${absD}s`;
        if (d <= 0) {
          ghostBadgeEl.style.borderColor = 'var(--ww-green)';
          ghostBadgeEl.style.color = 'var(--ww-green)';
        } else {
          ghostBadgeEl.style.borderColor = 'var(--ww-coral)';
          ghostBadgeEl.style.color = 'var(--ww-coral)';
        }
      } else if (ghostData && ghostData.bestLapTime) {
        ghostBadgeEl.classList.remove('hidden');
        ghostDeltaEl.textContent = this.formatTime(ghostData.bestLapTime);
        ghostBadgeEl.style.borderColor = 'var(--ww-cyan)';
        ghostBadgeEl.style.color = 'var(--ww-cyan)';
      } else {
        ghostBadgeEl.classList.add('hidden');
      }
    }

    // 8. Mini-map with live ghost blip
    this.drawMinimap(physicsData, world, timeTrialData ? timeTrialData.activeCheckpoint : 0, ghostData);
  }

  formatTime(seconds) {
    if (!seconds || seconds <= 0) return '00:00.0';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 10);
    const pad = (n) => n.toString().padStart(2, '0');
    return `${pad(mins)}:${pad(secs)}.${ms}`;
  }

  drawMinimap(physicsData, world, activeCpIdx = 0, ghostData = null) {
    if (!this.mapCtx || !world) return;
    const ctx = this.mapCtx;
    const w = this.mapCanvas.width;
    const h = this.mapCanvas.height;
    const cx = w / 2;
    const cy = h / 2;
    const scale = 0.32;

    ctx.clearRect(0, 0, w, h);

    // Map background
    ctx.fillStyle = 'rgba(15, 17, 24, 0.82)';
    ctx.beginPath();
    ctx.arc(cx, cy, cx - 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#00f0ff';
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
      ctx.strokeStyle = 'rgba(148, 163, 184, 0.65)';
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
    ctx.fillStyle = '#ffe600';
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
        ctx.fillStyle = isActive ? '#05ffa1' : 'rgba(0, 240, 255, 0.45)';
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

    // Draw Ghost Blip
    if (ghostData && ghostData.position) {
      const gx = cx + (ghostData.position.x - px) * scale;
      const gy = cy + (ghostData.position.z - pz) * scale;

      // Outer glowing pulse ring
      ctx.strokeStyle = 'rgba(0, 240, 255, 0.4)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(gx, gy, 7, 0, Math.PI * 2);
      ctx.stroke();

      // Ghost cyan diamond marker with heading orientation
      ctx.save();
      ctx.translate(gx, gy);
      ctx.rotate(-ghostData.heading + Math.PI);
      ctx.fillStyle = '#00f0ff';
      ctx.shadowColor = '#00f0ff';
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.moveTo(0, -6);
      ctx.lineTo(4, 5);
      ctx.lineTo(0, 2);
      ctx.lineTo(-4, 5);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }

    // Player arrow at center
    ctx.restore();
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(-physicsData.heading + Math.PI);

    ctx.fillStyle = '#00f0ff';
    ctx.beginPath();
    ctx.moveTo(0, -7);
    ctx.lineTo(5, 6);
    ctx.lineTo(0, 3);
    ctx.lineTo(-5, 6);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  // --- Wheel World Frankenstein Bike Co-Op Workshop Controller ---
  setupBikeShop(bicycle, physics, sound) {
    const modal = document.getElementById('garage-modal');
    const openBtn = document.getElementById('garage-btn');
    const closeBtn = document.getElementById('garage-close');
    const tabsContainer = document.getElementById('category-tabs');
    const contentContainer = document.getElementById('garage-parts-container');

    const updateStatsDisplay = () => {
      const stats = bicycle.getOverallStats();
      physics.applyBikeStats(stats);

      const pEl = document.getElementById('stat-val-power');
      const aEl = document.getElementById('stat-val-aero');
      const hEl = document.getElementById('stat-val-handling');
      const gEl = document.getElementById('stat-val-grip');

      const pBar = document.getElementById('stat-bar-power');
      const aBar = document.getElementById('stat-bar-aero');
      const hBar = document.getElementById('stat-bar-handling');
      const gBar = document.getElementById('stat-bar-grip');

      if (pEl) pEl.textContent = stats.power;
      if (aEl) aEl.textContent = stats.aero;
      if (hEl) hEl.textContent = stats.handling;
      if (gEl) gEl.textContent = stats.grip;

      if (pBar) pBar.style.width = `${stats.power}%`;
      if (aBar) aBar.style.width = `${stats.aero}%`;
      if (hBar) hBar.style.width = `${stats.handling}%`;
      if (gBar) gBar.style.width = `${stats.grip}%`;
    };

    const renderContent = () => {
      if (!contentContainer) return;
      contentContainer.innerHTML = '';

      if (this.activeShopSlot === 'paint') {
        // Render Paint Shop Swatches
        contentContainer.innerHTML = `
          <div class="paint-section">
            <label>🎨 Frame Paint:</label>
            <div class="swatches" id="frame-swatches">
              <button class="swatch" data-type="frame" data-color="#00f0ff" style="background: #00f0ff;" title="Vibrant Cyan"></button>
              <button class="swatch" data-type="frame" data-color="#ff1744" style="background: #ff1744;" title="Lava Red"></button>
              <button class="swatch" data-type="frame" data-color="#76ff03" style="background: #76ff03;" title="Acid Lime"></button>
              <button class="swatch" data-type="frame" data-color="#ffe600" style="background: #ffe600;" title="Electric Yellow"></button>
              <button class="swatch" data-type="frame" data-color="#141418" style="background: #141418;" title="Stealth Onyx"></button>
              <button class="swatch" data-type="frame" data-color="#d500f9" style="background: #d500f9;" title="Neon Magenta"></button>
              <button class="swatch" data-type="frame" data-color="#ffffff" style="background: #ffffff;" title="Chalk White"></button>
            </div>
          </div>
          <div class="paint-section">
            <label>⚡ Component Accent Color:</label>
            <div class="swatches" id="accent-swatches">
              <button class="swatch" data-type="accent" data-color="#ffe600" style="background: #ffe600;" title="Solar Yellow"></button>
              <button class="swatch" data-type="accent" data-color="#00f0ff" style="background: #00f0ff;" title="Electric Cyan"></button>
              <button class="swatch" data-type="accent" data-color="#ff2a6d" style="background: #ff2a6d;" title="Hot Coral"></button>
              <button class="swatch" data-type="accent" data-color="#05ffa1" style="background: #05ffa1;" title="Mint Green"></button>
              <button class="swatch" data-type="accent" data-color="#ffffff" style="background: #ffffff;" title="Chrome White"></button>
            </div>
          </div>
          <div class="paint-section">
            <label>⛑️ Cyclist Helmet Color:</label>
            <div class="swatches" id="helmet-swatches">
              <button class="swatch" data-type="helmet" data-color="#ffe600" style="background: #ffe600;" title="Solar Yellow"></button>
              <button class="swatch" data-type="helmet" data-color="#00f0ff" style="background: #00f0ff;" title="Electric Cyan"></button>
              <button class="swatch" data-type="helmet" data-color="#ff3d00" style="background: #ff3d00;" title="Blaze Orange"></button>
              <button class="swatch" data-type="helmet" data-color="#ffffff" style="background: #ffffff;" title="Pure White"></button>
              <button class="swatch" data-type="helmet" data-color="#141418" style="background: #141418;" title="Matte Black"></button>
            </div>
          </div>
          <div class="paint-section">
            <label>👕 Team Jersey Color:</label>
            <div class="swatches" id="jersey-swatches">
              <button class="swatch" data-type="jersey" data-color="#2979ff" style="background: #2979ff;" title="Royal Blue"></button>
              <button class="swatch" data-type="jersey" data-color="#05ffa1" style="background: #05ffa1;" title="Emerald Green"></button>
              <button class="swatch" data-type="jersey" data-color="#ff2a6d" style="background: #ff2a6d;" title="Neon Coral"></button>
              <button class="swatch" data-type="jersey" data-color="#ffab00" style="background: #ffab00;" title="Amber Gold"></button>
              <button class="swatch" data-type="jersey" data-color="#252836" style="background: #252836;" title="Charcoal"></button>
            </div>
          </div>
        `;

        // Bind swatch click listeners
        contentContainer.querySelectorAll('.swatch').forEach(btn => {
          btn.addEventListener('click', () => {
            sound.playClick();
            const type = btn.getAttribute('data-type');
            const color = btn.getAttribute('data-color');
            btn.parentElement.querySelectorAll('.swatch').forEach(s => s.classList.remove('selected'));
            btn.classList.add('selected');

            if (type === 'frame') {
              bicycle.setFrameColor(color);
              localStorage.setItem('velocity_paint_frame', color);
            } else if (type === 'accent') {
              bicycle.setAccentColor(color);
              localStorage.setItem('velocity_paint_accent', color);
            } else if (type === 'helmet') {
              bicycle.setHelmetColor(color);
              localStorage.setItem('velocity_paint_helmet', color);
            } else if (type === 'jersey') {
              bicycle.setJerseyColor(color);
              localStorage.setItem('velocity_paint_jersey', color);
            }
          });
        });
        return;
      }

      // Render 3 Modular Parts for the active slot
      const catalogSlot = BIKE_PARTS_CATALOG[this.activeShopSlot];
      if (!catalogSlot) return;

      const currentEquipped = bicycle.equipped[this.activeShopSlot];

      Object.entries(catalogSlot).forEach(([partKey, part]) => {
        const isEquipped = (currentEquipped === partKey);
        const card = document.createElement('div');
        card.className = `part-card ${isEquipped ? 'equipped' : ''}`;
        card.innerHTML = `
          <div class="part-info">
            <div class="part-title-row">
              <span class="part-name">${part.name}</span>
              ${isEquipped ? '<span style="color: #ffe600; font-size: 11px; font-weight: 800;">[EQUIPPED]</span>' : ''}
            </div>
            <div class="part-desc">${part.desc}</div>
            <div class="part-perk">${part.perk}</div>
            <div class="part-stats-mini">
              <span class="mini-stat">PWR ${part.power}</span>
              <span class="mini-stat">AERO ${part.aero}</span>
              <span class="mini-stat">HND ${part.handling}</span>
              <span class="mini-stat">GRP ${part.grip}</span>
            </div>
          </div>
          <button class="equip-btn" data-key="${partKey}">
            ${isEquipped ? '✓ IN USE' : 'EQUIP'}
          </button>
        `;

        const equipBtn = card.querySelector('.equip-btn');
        if (equipBtn && !isEquipped) {
          equipBtn.addEventListener('click', () => {
            sound.playEquip();
            bicycle.setPart(this.activeShopSlot, partKey);
            updateStatsDisplay();
            renderContent();
          });
        }

        contentContainer.appendChild(card);
      });
    };

    // Tab buttons
    if (tabsContainer) {
      tabsContainer.querySelectorAll('.cat-tab').forEach(tab => {
        tab.addEventListener('click', () => {
          sound.playClick();
          tabsContainer.querySelectorAll('.cat-tab').forEach(t => t.classList.remove('active'));
          tab.classList.add('active');
          this.activeShopSlot = tab.getAttribute('data-slot');
          renderContent();
        });
      });
    }

    const toggleModal = () => {
      if (modal) {
        modal.classList.toggle('hidden');
        if (!modal.classList.contains('hidden')) {
          sound.playClick();
          updateStatsDisplay();
          renderContent();
        }
      }
    };

    if (openBtn) openBtn.addEventListener('click', toggleModal);
    if (closeBtn) closeBtn.addEventListener('click', toggleModal);

    // Initial load
    updateStatsDisplay();
  }
}
