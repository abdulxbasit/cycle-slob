import * as THREE from 'three';

export class ParticleAndSkidSystem {
  constructor(scene, world) {
    this.scene = scene;
    this.world = world;

    // 1. Dust & Smoke Particles
    this.maxParticles = 120;
    this.particles = [];
    const pGeo = new THREE.DodecahedronGeometry(0.08, 0);
    const pMat = new THREE.MeshBasicMaterial({
      color: 0xd7ccc8,
      transparent: true,
      opacity: 0.6,
      depthWrite: false,
    });
    this.particleMesh = new THREE.InstancedMesh(pGeo, pMat, this.maxParticles);
    this.particleMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    this.scene.add(this.particleMesh);

    // Initialize particle pool
    const dummy = new THREE.Object3D();
    dummy.scale.set(0, 0, 0);
    dummy.updateMatrix();
    for (let i = 0; i < this.maxParticles; i++) {
      this.particleMesh.setMatrixAt(i, dummy.matrix);
      this.particles.push({
        active: false,
        pos: new THREE.Vector3(),
        vel: new THREE.Vector3(),
        scale: 0,
        maxScale: 0.35,
        life: 0,
        maxLife: 0.6,
      });
    }
    this.particleMesh.instanceMatrix.needsUpdate = true;
    this.particleIndex = 0;

    // 2. Skid Mark Mesh Strips
    this.maxSkidSegments = 80;
    this.skidSegments = [];
    this.lastSkidPos = null;
    this.skidMat = new THREE.MeshBasicMaterial({
      color: 0x111111,
      transparent: true,
      opacity: 0.55,
      depthWrite: false,
      side: THREE.DoubleSide,
    });
  }

  emitDust(pos, velocity, isHardSkid) {
    const p = this.particles[this.particleIndex];
    this.particleIndex = (this.particleIndex + 1) % this.maxParticles;

    p.active = true;
    p.life = 0;
    p.maxLife = isHardSkid ? 0.75 : 0.45;
    p.scale = 0.05;
    p.maxScale = isHardSkid ? (0.25 + Math.random() * 0.2) : (0.12 + Math.random() * 0.1);

    // Position around tire contact with slight jitter
    p.pos.copy(pos).add(new THREE.Vector3(
      (Math.random() - 0.5) * 0.15,
      0.02,
      (Math.random() - 0.5) * 0.15
    ));

    // Velocity puffs upwards and backwards
    p.vel.set(
      -velocity.x * 0.2 + (Math.random() - 0.5) * 1.2,
      0.8 + Math.random() * 1.2,
      -velocity.z * 0.2 + (Math.random() - 0.5) * 1.2
    );
  }

  addSkidSegment(startPos, endPos) {
    if (startPos.distanceTo(endPos) < 0.25) return;

    // Create a ground-aligned quad for the tire mark
    const dir = new THREE.Vector3().subVectors(endPos, startPos).normalize();
    const normal = new THREE.Vector3(-dir.z, 0, dir.x).normalize();
    const halfWidth = 0.045; // Tire width

    const p1 = startPos.clone().addScaledVector(normal, -halfWidth);
    const p2 = startPos.clone().addScaledVector(normal, halfWidth);
    const p3 = endPos.clone().addScaledVector(normal, -halfWidth);
    const p4 = endPos.clone().addScaledVector(normal, halfWidth);

    // Snap slightly above terrain to prevent z-fighting
    p1.y = this.world.getTerrainHeight(p1.x, p1.z) + 0.025;
    p2.y = this.world.getTerrainHeight(p2.x, p2.z) + 0.025;
    p3.y = this.world.getTerrainHeight(p3.x, p3.z) + 0.025;
    p4.y = this.world.getTerrainHeight(p4.x, p4.z) + 0.025;

    const geo = new THREE.BufferGeometry();
    const vertices = new Float32Array([
      p1.x, p1.y, p1.z,
      p2.x, p2.y, p2.z,
      p3.x, p3.y, p3.z,
      p2.x, p2.y, p2.z,
      p4.x, p4.y, p4.z,
      p3.x, p3.y, p3.z,
    ]);
    geo.setAttribute('position', new THREE.BufferAttribute(vertices, 3));

    const mesh = new THREE.Mesh(geo, this.skidMat.clone());
    this.scene.add(mesh);

    this.skidSegments.push({
      mesh,
      life: 0,
      maxLife: 6.0, // Fade out over 6 seconds
    });

    // Clean up oldest if exceeding buffer
    if (this.skidSegments.length > this.maxSkidSegments) {
      const old = this.skidSegments.shift();
      this.scene.remove(old.mesh);
      old.mesh.geometry.dispose();
      old.mesh.material.dispose();
    }
  }

  update(dt, rearWheelPos, velocity, isSkidding, isGrounded) {
    // 1. Emit when skidding or riding fast
    const speed = velocity.length();
    if (isGrounded) {
      if (isSkidding) {
        // Emit heavy dust puffs
        this.emitDust(rearWheelPos, velocity, true);
        this.emitDust(rearWheelPos, velocity, true);

        // Record skid mark
        if (this.lastSkidPos) {
          this.addSkidSegment(this.lastSkidPos, rearWheelPos);
        }
        this.lastSkidPos = rearWheelPos.clone();
      } else {
        this.lastSkidPos = null;
        // Light dust at speed on dirt
        if (speed > 5 && Math.random() < 0.35) {
          this.emitDust(rearWheelPos, velocity, false);
        }
      }
    } else {
      this.lastSkidPos = null;
    }

    // 2. Animate and fade dust particles
    const dummy = new THREE.Object3D();
    for (let i = 0; i < this.maxParticles; i++) {
      const p = this.particles[i];
      if (p.active) {
        p.life += dt;
        if (p.life >= p.maxLife) {
          p.active = false;
          dummy.scale.set(0, 0, 0);
        } else {
          p.pos.addScaledVector(p.vel, dt);
          p.vel.y -= 0.5 * dt; // Slow gravity / air resistance
          p.vel.x *= 0.94;
          p.vel.z *= 0.94;

          const progress = p.life / p.maxLife;
          const currentScale = p.scale + (p.maxScale - p.scale) * Math.sin(progress * Math.PI);
          dummy.position.copy(p.pos);
          dummy.scale.set(currentScale, currentScale, currentScale);
        }
      } else {
        dummy.scale.set(0, 0, 0);
      }
      dummy.updateMatrix();
      this.particleMesh.setMatrixAt(i, dummy.matrix);
    }
    this.particleMesh.instanceMatrix.needsUpdate = true;

    // 3. Update skid marks fade-out
    for (let i = this.skidSegments.length - 1; i >= 0; i--) {
      const seg = this.skidSegments[i];
      seg.life += dt;
      if (seg.life >= seg.maxLife) {
        this.scene.remove(seg.mesh);
        seg.mesh.geometry.dispose();
        seg.mesh.material.dispose();
        this.skidSegments.splice(i, 1);
      } else {
        seg.mesh.material.opacity = (1 - seg.life / seg.maxLife) * 0.55;
      }
    }
  }
}
