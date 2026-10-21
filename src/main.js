import * as THREE from 'three';
import { Bicycle } from './bicycle.js';
import { GameWorld } from './world.js';
import { BikePhysics } from './physics.js';
import { sound } from './audio.js';
import { HUD } from './hud.js';
import { ParticleAndSkidSystem } from './particles.js';

class Game {
  constructor() {
    this.container = document.getElementById('canvas-container');
    this.clock = new THREE.Clock();

    // Scene & Renderer
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x81d4fa);
    this.scene.fog = new THREE.FogExp2(0x81d4fa, 0.0035);

    this.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.container.appendChild(this.renderer.domElement);

    // Camera
    this.camera = new THREE.PerspectiveCamera(65, window.innerWidth / window.innerHeight, 0.1, 1500);
    this.cameraModes = ['Chase', 'Cockpit', 'Orbit'];
    this.cameraIndex = 0;

    // Game Objects
    this.world = new GameWorld(this.scene);
    this.bicycle = new Bicycle(this.scene);
    this.physics = new BikePhysics(this.world);
    this.particles = new ParticleAndSkidSystem(this.scene, this.world);
    this.hud = new HUD();

    this.coinsCollected = 0;
    this.isNight = false;

    // Time Trial State
    this.activeCheckpoint = 0;
    this.lapTime = 0;
    this.lapActive = false;
    this.bestLap = parseFloat(localStorage.getItem('velocity_best_lap')) || null;

    // Lighting
    this.setupLighting();

    // Input state
    this.inputs = {
      forward: false,
      backward: false,
      left: false,
      right: false,
      sprint: false,
      jump: false,
    };

    this.setupInputs();
    this.setupUI();
    this.setupWindowResize();

    // Start Loop
    this.animate = this.animate.bind(this);
    requestAnimationFrame(this.animate);
  }

  setupLighting() {
    this.hemiLight = new THREE.HemisphereLight(0xffffff, 0x334455, 0.6);
    this.scene.add(this.hemiLight);

    this.dirLight = new THREE.DirectionalLight(0xfff8e7, 1.3);
    this.dirLight.position.set(120, 200, 100);
    this.dirLight.castShadow = true;
    this.dirLight.shadow.mapSize.width = 2048;
    this.dirLight.shadow.mapSize.height = 2048;
    this.dirLight.shadow.camera.near = 10;
    this.dirLight.shadow.camera.far = 450;
    const d = 60;
    this.dirLight.shadow.camera.left = -d;
    this.dirLight.shadow.camera.right = d;
    this.dirLight.shadow.camera.top = d;
    this.dirLight.shadow.camera.bottom = -d;
    this.dirLight.shadow.bias = -0.0005;
    this.scene.add(this.dirLight);
    this.scene.add(this.dirLight.target);
  }

  toggleDayNight() {
    this.isNight = !this.isNight;
    const btn = document.getElementById('night-btn');

    if (this.isNight) {
      this.scene.background = new THREE.Color(0x060913);
      this.scene.fog.color = new THREE.Color(0x060913);
      this.hemiLight.intensity = 0.15;
      this.dirLight.intensity = 0.2;
      this.dirLight.color.setHex(0x3d5afe);
      this.bicycle.setLightIntensity(4.0);
      if (btn) btn.textContent = '☀️ Day';
    } else {
      this.scene.background = new THREE.Color(0x81d4fa);
      this.scene.fog.color = new THREE.Color(0x81d4fa);
      this.hemiLight.intensity = 0.6;
      this.dirLight.intensity = 1.3;
      this.dirLight.color.setHex(0xfff8e7);
      this.bicycle.setLightIntensity(0.5);
      if (btn) btn.textContent = '🌙 Night';
    }
  }

  setupInputs() {
    const keyMap = {
      KeyW: 'forward',
      ArrowUp: 'forward',
      KeyS: 'backward',
      ArrowDown: 'backward',
      KeyA: 'left',
      ArrowLeft: 'left',
      KeyD: 'right',
      ArrowRight: 'right',
      ShiftLeft: 'sprint',
      ShiftRight: 'sprint',
      Space: 'jump',
    };

    window.addEventListener('keydown', (e) => {
      sound.init(); // User interaction unlocks audio
      if (keyMap[e.code] !== undefined) {
        this.inputs[keyMap[e.code]] = true;
        if (e.code === 'Space') {
          sound.playJump();
          e.preventDefault();
        }
      }

      if (e.code === 'KeyC') {
        this.cycleCamera();
      }
      if (e.code === 'KeyB') {
        sound.ringBell();
      }
      if (e.code === 'KeyR') {
        this.resetBike();
      }
      if (e.code === 'KeyN') {
        this.toggleDayNight();
      }
      if (e.code === 'KeyG') {
        const modal = document.getElementById('garage-modal');
        if (modal) modal.classList.toggle('hidden');
      }
    });

    window.addEventListener('keyup', (e) => {
      if (keyMap[e.code] !== undefined) {
        this.inputs[keyMap[e.code]] = false;
      }
    });

    // Touch controls on screen for mobile/tablet
    const bindTouch = (id, action) => {
      const el = document.getElementById(id);
      if (!el) return;
      el.addEventListener('touchstart', (e) => {
        e.preventDefault();
        sound.init();
        this.inputs[action] = true;
        if (action === 'jump') sound.playJump();
      });
      el.addEventListener('touchend', (e) => {
        e.preventDefault();
        this.inputs[action] = false;
      });
    };

    bindTouch('btn-up', 'forward');
    bindTouch('btn-down', 'backward');
    bindTouch('btn-left', 'left');
    bindTouch('btn-right', 'right');
    bindTouch('btn-jump', 'jump');
    bindTouch('btn-sprint', 'sprint');
  }

  setupUI() {
    const bellBtn = document.getElementById('bell-btn');
    if (bellBtn) {
      bellBtn.addEventListener('click', () => sound.ringBell());
    }

    const soundBtn = document.getElementById('sound-btn');
    if (soundBtn) {
      soundBtn.addEventListener('click', () => {
        const muted = sound.toggleMute();
        soundBtn.textContent = muted ? '🔇 Unmute' : '🔊 Sound';
      });
    }

    const camBtn = document.getElementById('cam-btn');
    if (camBtn) {
      camBtn.addEventListener('click', () => this.cycleCamera());
    }

    const nightBtn = document.getElementById('night-btn');
    if (nightBtn) {
      nightBtn.addEventListener('click', () => this.toggleDayNight());
    }

    const resetBtn = document.getElementById('reset-btn');
    if (resetBtn) {
      resetBtn.addEventListener('click', () => this.resetBike());
    }

    this.setupGarage();
  }

  setupGarage() {
    const modal = document.getElementById('garage-modal');
    const openBtn = document.getElementById('garage-btn');
    const closeBtn = document.getElementById('garage-close');

    const toggleGarage = () => {
      if (modal) modal.classList.toggle('hidden');
    };

    if (openBtn) openBtn.addEventListener('click', toggleGarage);
    if (closeBtn) closeBtn.addEventListener('click', toggleGarage);

    // Load saved colors
    const savedFrame = localStorage.getItem('velocity_paint_frame');
    if (savedFrame) this.bicycle.setFrameColor(savedFrame);
    const savedHelmet = localStorage.getItem('velocity_paint_helmet');
    if (savedHelmet) this.bicycle.setHelmetColor(savedHelmet);
    const savedJersey = localStorage.getItem('velocity_paint_jersey');
    if (savedJersey) this.bicycle.setJerseyColor(savedJersey);

    // Swatches
    document.querySelectorAll('.swatch').forEach(btn => {
      btn.addEventListener('click', () => {
        const type = btn.getAttribute('data-type');
        const color = btn.getAttribute('data-color');

        if (btn.parentElement) {
          btn.parentElement.querySelectorAll('.swatch').forEach(s => s.classList.remove('selected'));
          btn.classList.add('selected');
        }

        if (type === 'frame') {
          this.bicycle.setFrameColor(color);
          localStorage.setItem('velocity_paint_frame', color);
        } else if (type === 'helmet') {
          this.bicycle.setHelmetColor(color);
          localStorage.setItem('velocity_paint_helmet', color);
        } else if (type === 'jersey') {
          this.bicycle.setJerseyColor(color);
          localStorage.setItem('velocity_paint_jersey', color);
        }
      });
    });
  }

  cycleCamera() {
    this.cameraIndex = (this.cameraIndex + 1) % this.cameraModes.length;
  }

  resetBike() {
    this.physics.reset();
  }

  setupWindowResize() {
    window.addEventListener('resize', () => {
      this.camera.aspect = window.innerWidth / window.innerHeight;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(window.innerWidth, window.innerHeight);
    });
  }

  updateCamera(dt, isBoosting) {
    const targetFov = isBoosting ? 78 : 65;
    this.camera.fov = THREE.MathUtils.lerp(this.camera.fov, targetFov, (dt || 0.016) * 5);
    this.camera.updateProjectionMatrix();

    const mode = this.cameraModes[this.cameraIndex];
    const pos = this.physics.position;
    const heading = this.physics.heading;

    if (mode === 'Chase') {
      // Third person follow camera
      const dist = 4.8;
      const height = 2.4;
      const targetCamX = pos.x - Math.sin(heading) * dist;
      const targetCamZ = pos.z - Math.cos(heading) * dist;
      const targetCamY = pos.y + height;

      this.camera.position.lerp(new THREE.Vector3(targetCamX, targetCamY, targetCamZ), 0.12);
      const lookTarget = new THREE.Vector3(
        pos.x + Math.sin(heading) * 3,
        pos.y + 1.2,
        pos.z + Math.cos(heading) * 3
      );
      this.camera.lookAt(lookTarget);
    } else if (mode === 'Cockpit') {
      // First person handlebar view
      const camPos = new THREE.Vector3(
        pos.x + Math.sin(heading) * 0.4,
        pos.y + 1.25,
        pos.z + Math.cos(heading) * 0.4
      );
      this.camera.position.copy(camPos);
      const lookTarget = new THREE.Vector3(
        pos.x + Math.sin(heading) * 20,
        pos.y + 1.1,
        pos.z + Math.cos(heading) * 20
      );
      this.camera.lookAt(lookTarget);
    } else if (mode === 'Orbit') {
      // Isometric action view
      const time = this.clock.getElapsedTime() * 0.3;
      this.camera.position.set(pos.x + Math.sin(time) * 12, pos.y + 7, pos.z + Math.cos(time) * 12);
      this.camera.lookAt(pos.x, pos.y + 1, pos.z);
    }
  }

  animate() {
    requestAnimationFrame(this.animate);

    const dt = Math.min(this.clock.getDelta(), 0.1);
    const elapsedTime = this.clock.getElapsedTime();

    // 1. Update Physics
    const physicsData = this.physics.update(this.inputs, dt);
    physicsData.position = this.physics.position;
    physicsData.heading = this.physics.heading;

    // 2. Sync Bicycle 3D Mesh
    this.bicycle.root.position.copy(this.physics.position);
    this.bicycle.root.rotation.order = 'YXZ';
    this.bicycle.root.rotation.y = this.physics.heading;
    this.bicycle.root.rotation.x = this.physics.pitchAngle;
    this.bicycle.root.rotation.z = this.physics.rollAngle;
    this.bicycle.update(this.physics.velocity, physicsData.steerInput, physicsData.leanAngle, dt);

    // Update Tire Skid & Dust Particles
    const rearWheelPos = this.bicycle.getRearWheelContactPosition();
    this.particles.update(dt, rearWheelPos, this.physics.velocity, physicsData.isSkidding, physicsData.isGrounded);

    // 3. Update Audio
    sound.update(physicsData.forwardSpeed, physicsData.isGrounded, physicsData.isPedaling, physicsData.isSkidding);

    // 4. Update World (Coin animations & Checkpoints)
    this.world.update(elapsedTime);

    // Time Trial Progress
    if (this.lapActive) {
      this.lapTime += dt;
    }

    if (this.world.checkCheckpointHit(this.physics.position, this.activeCheckpoint)) {
      sound.playCoin();
      if (this.activeCheckpoint === 0) {
        if (this.lapActive) {
          // Completed lap
          const isRecord = (!this.bestLap || this.lapTime < this.bestLap);
          if (isRecord) {
            this.bestLap = this.lapTime;
            localStorage.setItem('velocity_best_lap', this.bestLap.toFixed(2));
            physicsData.trickName = `🏁 RECORD! ${this.hud.formatTime(this.bestLap)}`;
          } else {
            physicsData.trickName = `🏁 LAP: ${this.hud.formatTime(this.lapTime)}`;
          }
          this.physics.stuntScore += 1000;
        }
        this.lapTime = 0;
        this.lapActive = true;
        this.activeCheckpoint = 1;
      } else {
        this.activeCheckpoint = (this.activeCheckpoint + 1) % this.world.checkpoints.length;
        this.physics.stuntScore += 100;
      }
    }
    this.world.updateCheckpoints(elapsedTime, this.activeCheckpoint);

    // Check Collectibles
    this.world.checkCoinCollection(this.physics.position, () => {
      this.coinsCollected++;
      sound.playCoin();
    });

    // Check Turbo Boost Pads
    if (this.world.checkBoostPads(this.physics.position)) {
      this.physics.applyTurboBoost();
      sound.playBoost();
    }
    this.world.updateBoostPads(elapsedTime);

    // 5. Directional Light follow player for continuous dynamic shadows
    this.dirLight.position.set(
      this.physics.position.x + 80,
      200,
      this.physics.position.z + 60
    );
    this.dirLight.target.position.copy(this.physics.position);

    // 6. Camera & HUD
    this.updateCamera(dt, physicsData.isBoosting);
    this.hud.update(
      physicsData,
      this.coinsCollected,
      this.cameraModes[this.cameraIndex],
      this.world,
      {
        lapTime: this.lapTime,
        activeCheckpoint: this.activeCheckpoint,
        totalCheckpoints: this.world.checkpoints.length,
        bestLap: this.bestLap
      }
    );

    // 7. Render
    this.renderer.render(this.scene, this.camera);
  }
}

// Boot game when DOM is loaded
window.addEventListener('DOMContentLoaded', () => {
  new Game();
});
