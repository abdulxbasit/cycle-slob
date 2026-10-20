import * as THREE from 'three';

export class BikePhysics {
  constructor(world) {
    this.world = world;

    // State
    this.position = new THREE.Vector3(0, 0.42, 0);
    this.velocity = new THREE.Vector3(0, 0, 0);
    this.heading = 0;          // Yaw angle in radians (0 = along +Z)
    this.verticalVelocity = 0;
    this.isGrounded = true;
    this.airTime = 0;
    this.stuntScore = 0;
    this.trickName = '';
    this.pitchAngle = 0;
    this.rollAngle = 0;
    this.totalDistance = 0;

    // Config
    this.acceleration = 12.0;       // m/s^2
    this.sprintMultiplier = 1.6;
    this.brakeDecel = 24.0;
    this.friction = 1.8;            // Rolling resistance
    this.airDrag = 0.04;            // Quadratic drag
    this.maxSpeed = 14.0;           // ~50 km/h
    this.turnSpeed = 1.9;
    this.gravity = 22.0;
    this.jumpForce = 7.5;
  }

  update(inputs, dt) {
    // 1. Current planar speed
    const forwardVector = new THREE.Vector3(Math.sin(this.heading), 0, Math.cos(this.heading));
    let forwardSpeed = this.velocity.dot(forwardVector);

    // 2. Pedaling / Acceleration
    let targetAcc = 0;
    let isPedaling = false;

    if (this.isGrounded) {
      if (inputs.forward) {
        let acc = this.acceleration;
        if (inputs.sprint) acc *= this.sprintMultiplier;
        targetAcc += acc;
        isPedaling = true;
      }
      if (inputs.backward) {
        if (forwardSpeed > 0.5) {
          // Braking
          targetAcc -= this.brakeDecel;
        } else {
          // Reversing slowly
          targetAcc -= this.acceleration * 0.4;
          forwardSpeed = Math.max(-3.5, forwardSpeed);
        }
      }

      // Rolling resistance & air drag
      const drag = (this.friction * Math.sign(forwardSpeed)) + (this.airDrag * forwardSpeed * Math.abs(forwardSpeed));
      forwardSpeed += (targetAcc - drag) * dt;

      // Check max speeds
      const topSpeedLimit = inputs.sprint ? this.maxSpeed * 1.5 : this.maxSpeed;
      if (forwardSpeed > topSpeedLimit) {
        forwardSpeed = THREE.MathUtils.lerp(forwardSpeed, topSpeedLimit, dt * 2);
      }

      // Stop completely at tiny speeds
      if (!inputs.forward && !inputs.backward && Math.abs(forwardSpeed) < 0.1) {
        forwardSpeed = 0;
      }
    } else {
      // In the air: maintain forward speed with slight air drag
      forwardSpeed *= Math.max(0, 1 - 0.01 * dt);
      this.airTime += dt;
    }

    // 3. Steering & Turning
    let steerInput = 0;
    if (inputs.left) steerInput += 1;
    if (inputs.right) steerInput -= 1;

    let leanAngle = 0;
    if (Math.abs(forwardSpeed) > 0.2) {
      // Speed-dependent turn rate (tighter at moderate speed, stable at high speed)
      const turnFactor = Math.min(1.0, 3.5 / (Math.abs(forwardSpeed) + 1.5));
      const turnDelta = steerInput * this.turnSpeed * turnFactor * Math.sign(forwardSpeed) * dt;
      this.heading += turnDelta;

      // Realistic bicycle lean into curve (centrifugal tilt)
      const maxLean = 0.52; // ~30 degrees
      leanAngle = THREE.MathUtils.clamp(-steerInput * Math.min(1.0, Math.abs(forwardSpeed) / 8.0) * 0.45, -maxLean, maxLean);
    }

    // Update horizontal velocity
    this.velocity.x = Math.sin(this.heading) * forwardSpeed;
    this.velocity.z = Math.cos(this.heading) * forwardSpeed;

    // Distance tracking
    this.totalDistance += Math.abs(forwardSpeed) * dt;

    // 4. Bunny Hop / Jump
    if (inputs.jump && this.isGrounded) {
      this.verticalVelocity = this.jumpForce;
      this.isGrounded = false;
      this.airTime = 0;
    }

    // 5. Vertical / Terrain Physics
    this.position.x += this.velocity.x * dt;
    this.position.z += this.velocity.z * dt;

    const terrainY = this.world.getTerrainHeight(this.position.x, this.position.z);
    const bikeRestY = terrainY + 0.42;

    if (!this.isGrounded) {
      this.verticalVelocity -= this.gravity * dt;
      this.position.y += this.verticalVelocity * dt;

      // In-air trick rotation if holding keys
      if (inputs.forward) this.pitchAngle += dt * 3.5;
      if (inputs.backward) this.pitchAngle -= dt * 3.5;
      if (inputs.left) this.rollAngle -= dt * 4.0;
      if (inputs.right) this.rollAngle += dt * 4.0;

      // Touchdown / landing check
      if (this.position.y <= bikeRestY) {
        this.position.y = bikeRestY;
        this.verticalVelocity = 0;
        this.isGrounded = true;

        // Score stunts based on airtime
        let points = 0;
        let trick = '';
        if (this.airTime > 1.4) {
          points = Math.round(this.airTime * 250);
          trick = 'INSANE AIR!';
        } else if (this.airTime > 0.8) {
          points = Math.round(this.airTime * 150);
          trick = 'BIG AIR!';
        } else if (this.airTime > 0.4) {
          points = 50;
          trick = 'HOP!';
        }

        if (points > 0) {
          this.stuntScore += points;
          this.trickName = `${trick} +${points}`;
        }

        this.pitchAngle = 0;
        this.rollAngle = 0;
        this.airTime = 0;
      }
    } else {
      // Ground snap with gentle slope response
      // Calculate terrain gradient for uphill/downhill slope pull
      const sampleDist = 0.5;
      const frontX = this.position.x + Math.sin(this.heading) * sampleDist;
      const frontZ = this.position.z + Math.cos(this.heading) * sampleDist;
      const frontY = this.world.getTerrainHeight(frontX, frontZ);
      const slope = (frontY - terrainY) / sampleDist;

      // Gravity pushes down slopes
      if (this.isGrounded) {
        forwardSpeed -= slope * 9.8 * 0.4 * dt;
      }

      this.position.y = bikeRestY;
      this.pitchAngle = Math.atan2(frontY - terrainY, sampleDist);
    }

    return {
      speedKmh: Math.abs(forwardSpeed) * 3.6,
      forwardSpeed,
      steerInput,
      leanAngle,
      isGrounded: this.isGrounded,
      isPedaling,
      airTime: this.airTime,
      stuntScore: this.stuntScore,
      trickName: this.trickName,
      totalDistance: this.totalDistance
    };
  }

  reset() {
    this.position.set(0, 0.42, 0);
    this.velocity.set(0, 0, 0);
    this.heading = 0;
    this.verticalVelocity = 0;
    this.isGrounded = true;
    this.pitchAngle = 0;
    this.rollAngle = 0;
    this.airTime = 0;
  }
}
