import * as THREE from 'three';

export class WeatherSystem {
  constructor(scene) {
    this.scene = scene;
    this.modes = ['Clear', 'Rain', 'Foggy'];
    this.currentModeIndex = 0;

    // Rain Particle System
    this.rainCount = 1800;
    this.rainGeo = new THREE.BufferGeometry();
    const positions = new Float32Array(this.rainCount * 3);
    const velocities = new Float32Array(this.rainCount);

    this.rainRadius = 45;
    for (let i = 0; i < this.rainCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * this.rainRadius * 2;
      positions[i * 3 + 1] = Math.random() * 30;
      positions[i * 3 + 2] = (Math.random() - 0.5) * this.rainRadius * 2;
      velocities[i] = 22 + Math.random() * 10;
    }

    this.rainGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    this.velocities = velocities;

    const rainMat = new THREE.PointsMaterial({
      color: 0x90caf9,
      size: 0.16,
      transparent: true,
      opacity: 0.7,
      depthWrite: false,
    });

    this.rainPoints = new THREE.Points(this.rainGeo, rainMat);
    this.rainPoints.visible = false;
    this.scene.add(this.rainPoints);
  }

  cycleWeather(scene, dirLight, hemiLight, terrainMesh, roadMesh) {
    this.currentModeIndex = (this.currentModeIndex + 1) % this.modes.length;
    const mode = this.modes[this.currentModeIndex];

    if (mode === 'Clear') {
      this.rainPoints.visible = false;
      scene.background.setHex(0x81d4fa);
      scene.fog.color.setHex(0x81d4fa);
      scene.fog.density = 0.0035;
      dirLight.intensity = 1.3;
      dirLight.color.setHex(0xfff8e7);
      hemiLight.intensity = 0.6;
    } else if (mode === 'Rain') {
      this.rainPoints.visible = true;
      scene.background.setHex(0x1e293b);
      scene.fog.color.setHex(0x273549);
      scene.fog.density = 0.0075;
      dirLight.intensity = 0.45;
      dirLight.color.setHex(0x94a3b8);
      hemiLight.intensity = 0.3;
    } else if (mode === 'Foggy') {
      this.rainPoints.visible = false;
      scene.background.setHex(0x9e9e9e);
      scene.fog.color.setHex(0x9e9e9e);
      scene.fog.density = 0.016; // Dense hill fog
      dirLight.intensity = 0.7;
      dirLight.color.setHex(0xffe0b2);
      hemiLight.intensity = 0.5;
    }

    return mode;
  }

  update(dt, playerPos) {
    if (!this.rainPoints.visible) return;

    // Keep rain centered around the bicycle
    this.rainPoints.position.set(playerPos.x, 0, playerPos.z);

    const pos = this.rainGeo.attributes.position;
    for (let i = 0; i < this.rainCount; i++) {
      let y = pos.getY(i) - this.velocities[i] * dt;
      if (y < 0) {
        y = 28 + Math.random() * 4;
        pos.setX(i, (Math.random() - 0.5) * this.rainRadius * 2);
        pos.setZ(i, (Math.random() - 0.5) * this.rainRadius * 2);
      }
      pos.setY(i, y);
    }
    pos.needsUpdate = true;
  }
}
