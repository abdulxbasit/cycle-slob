import * as THREE from 'three';

export class WeatherSystem {
  constructor(scene) {
    this.scene = scene;
    this.modes = ['Clear', 'Rain', 'Foggy'];
    this.currentModeIndex = 0;

    // Rain Particle System using realistic streak lines
    this.rainCount = 1200;
    this.rainGeo = new THREE.BufferGeometry();
    const positions = new Float32Array(this.rainCount * 6); // 2 vertices per streak
    this.velocities = new Float32Array(this.rainCount);

    this.rainRadius = 45;
    for (let i = 0; i < this.rainCount; i++) {
      const rx = (Math.random() - 0.5) * this.rainRadius * 2;
      const ry = Math.random() * 32;
      const rz = (Math.random() - 0.5) * this.rainRadius * 2;

      // Top vertex
      positions[i * 6] = rx;
      positions[i * 6 + 1] = ry;
      positions[i * 6 + 2] = rz;

      // Bottom vertex of streak
      positions[i * 6 + 3] = rx - 0.15;
      positions[i * 6 + 4] = ry - 1.2;
      positions[i * 6 + 5] = rz - 0.15;

      this.velocities[i] = 28 + Math.random() * 12;
    }

    this.rainGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const rainMat = new THREE.LineBasicMaterial({
      color: 0x90caf9,
      transparent: true,
      opacity: 0.65,
      depthWrite: false,
    });

    this.rainPoints = new THREE.LineSegments(this.rainGeo, rainMat);
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
      const topIdx = i * 2;
      const botIdx = i * 2 + 1;
      let y = pos.getY(topIdx) - this.velocities[i] * dt;
      if (y < 0) {
        y = 28 + Math.random() * 4;
        const rx = (Math.random() - 0.5) * this.rainRadius * 2;
        const rz = (Math.random() - 0.5) * this.rainRadius * 2;
        pos.setX(topIdx, rx);
        pos.setZ(topIdx, rz);
        pos.setX(botIdx, rx - 0.15);
        pos.setZ(botIdx, rz - 0.15);
      }
      pos.setY(topIdx, y);
      pos.setY(botIdx, y - 1.2);
    }
    pos.needsUpdate = true;
  }
}
