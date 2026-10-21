import * as THREE from 'three';

export class Bicycle {
  constructor(scene) {
    this.scene = scene;
    this.root = new THREE.Group();
    this.scene.add(this.root);

    // Dimensions
    this.wheelRadius = 0.42;
    this.wheelbase = 1.15;
    this.crankAngle = 0;
    this.wheelAngle = 0;
    this.steerAngle = 0;
    this.leanAngle = 0;

    // Materials
    this.frameMat = new THREE.MeshStandardMaterial({
      color: 0x00e5ff,
      metalness: 0.85,
      roughness: 0.25,
    });
    this.accentMat = new THREE.MeshStandardMaterial({
      color: 0xff3366,
      metalness: 0.5,
      roughness: 0.3,
    });
    this.darkMetalMat = new THREE.MeshStandardMaterial({
      color: 0x22222a,
      metalness: 0.9,
      roughness: 0.2,
    });
    this.rubberMat = new THREE.MeshStandardMaterial({
      color: 0x111113,
      roughness: 0.9,
      metalness: 0.1,
    });
    this.spokeMat = new THREE.MeshStandardMaterial({
      color: 0xcccccc,
      metalness: 0.95,
      roughness: 0.1,
    });
    this.lightMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      emissive: 0xffeeaa,
      emissiveIntensity: 0.8,
    });

    this.riderMat = new THREE.MeshStandardMaterial({
      color: 0x2979ff,
      roughness: 0.5,
    });
    this.skinMat = new THREE.MeshStandardMaterial({
      color: 0xffb74d,
      roughness: 0.6,
    });
    this.helmetMat = new THREE.MeshStandardMaterial({
      color: 0xffea00,
      metalness: 0.4,
      roughness: 0.2,
    });

    this.buildBicycle();
    this.buildRider();
  }

  createWheel() {
    const wheelGroup = new THREE.Group();

    // Tire
    const tireGeo = new THREE.TorusGeometry(this.wheelRadius, 0.045, 12, 36);
    const tire = new THREE.Mesh(tireGeo, this.rubberMat);
    tire.castShadow = true;
    wheelGroup.add(tire);

    // Rim
    const rimGeo = new THREE.TorusGeometry(this.wheelRadius * 0.92, 0.02, 8, 36);
    const rim = new THREE.Mesh(rimGeo, this.darkMetalMat);
    wheelGroup.add(rim);

    // Hub
    const hubGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.1, 12);
    hubGeo.rotateX(Math.PI / 2);
    const hub = new THREE.Mesh(hubGeo, this.darkMetalMat);
    wheelGroup.add(hub);

    // Spokes
    const spokeCount = 16;
    for (let i = 0; i < spokeCount; i++) {
      const angle = (i / spokeCount) * Math.PI * 2;
      const spokeGeo = new THREE.CylinderGeometry(0.003, 0.003, this.wheelRadius * 1.84, 4);
      spokeGeo.rotateZ(angle);
      const spoke = new THREE.Mesh(spokeGeo, this.spokeMat);
      wheelGroup.add(spoke);
    }

    return wheelGroup;
  }

  createTube(start, end, radius, material) {
    const dir = new THREE.Vector3().subVectors(end, start);
    const len = dir.length();
    const mid = new THREE.Vector3().addVectors(start, end).multiplyScalar(0.5);

    const geo = new THREE.CylinderGeometry(radius, radius, len, 8);
    const mesh = new THREE.Mesh(geo, material);

    const axis = new THREE.Vector3(0, 1, 0);
    dir.normalize();
    mesh.quaternion.setFromUnitVectors(axis, dir);
    mesh.position.copy(mid);
    mesh.castShadow = true;
    return mesh;
  }

  buildBicycle() {
    this.bikeBody = new THREE.Group();
    this.root.add(this.bikeBody);

    // Key Frame Coordinates (Relative to Bottom Bracket at [0, 0.42, 0])
    const bb = new THREE.Vector3(0, 0.42, 0);                 // Bottom bracket
    const rearAxle = new THREE.Vector3(-this.wheelbase * 0.52, 0.42, 0); // Rear wheel center
    const frontAxle = new THREE.Vector3(this.wheelbase * 0.48, 0.42, 0); // Front wheel center
    const seatCluster = new THREE.Vector3(-0.16, 0.88, 0);    // Top of seat tube
    const headTop = new THREE.Vector3(0.42, 0.98, 0);         // Top of head tube
    const headBottom = new THREE.Vector3(0.46, 0.76, 0);      // Bottom of head tube

    // 1. Frame tubes
    this.bikeBody.add(this.createTube(bb, seatCluster, 0.024, this.frameMat)); // Seat tube
    this.bikeBody.add(this.createTube(bb, headBottom, 0.026, this.frameMat));  // Down tube
    this.bikeBody.add(this.createTube(seatCluster, headTop, 0.022, this.frameMat)); // Top tube
    this.bikeBody.add(this.createTube(headBottom, headTop, 0.03, this.darkMetalMat)); // Head tube

    // Chainstays (Rear axle to BB)
    this.bikeBody.add(this.createTube(rearAxle, bb, 0.016, this.darkMetalMat));
    // Seatstays (Rear axle to seat cluster)
    this.bikeBody.add(this.createTube(rearAxle, seatCluster, 0.016, this.frameMat));

    // 2. Saddle & Seatpost
    const seatPostTop = new THREE.Vector3(-0.20, 1.02, 0);
    this.bikeBody.add(this.createTube(seatCluster, seatPostTop, 0.018, this.darkMetalMat));
    const saddleGeo = new THREE.BoxGeometry(0.25, 0.05, 0.14);
    const saddle = new THREE.Mesh(saddleGeo, this.rubberMat);
    saddle.position.copy(seatPostTop);
    saddle.position.y += 0.03;
    saddle.position.x -= 0.02;
    saddle.castShadow = true;
    this.bikeBody.add(saddle);

    // 3. Rear Wheel
    this.rearWheel = this.createWheel();
    this.rearWheel.position.copy(rearAxle);
    this.bikeBody.add(this.rearWheel);

    // 4. Steerable Front Fork + Handlebar + Front Wheel Assembly
    this.forkGroup = new THREE.Group();
    this.forkGroup.position.copy(headTop);

    // Fork blades extending down to front axle
    const localAxle = new THREE.Vector3().subVectors(frontAxle, headTop);
    const forkLeft = this.createTube(new THREE.Vector3(0, 0, 0.05), localAxle.clone().add(new THREE.Vector3(0,0,0.05)), 0.018, this.accentMat);
    const forkRight = this.createTube(new THREE.Vector3(0, 0, -0.05), localAxle.clone().add(new THREE.Vector3(0,0,-0.05)), 0.018, this.accentMat);
    this.forkGroup.add(forkLeft);
    this.forkGroup.add(forkRight);

    // Stem and Handlebars
    const stemGeo = new THREE.CylinderGeometry(0.018, 0.018, 0.12, 8);
    const stem = new THREE.Mesh(stemGeo, this.darkMetalMat);
    stem.position.set(0.04, 0.06, 0);
    stem.rotation.z = -0.3;
    this.forkGroup.add(stem);

    const barGeo = new THREE.CylinderGeometry(0.015, 0.015, 0.65, 8);
    barGeo.rotateX(Math.PI / 2);
    const bar = new THREE.Mesh(barGeo, this.darkMetalMat);
    bar.position.set(0.08, 0.11, 0);
    this.forkGroup.add(bar);

    // Grips
    const gripGeo = new THREE.CylinderGeometry(0.02, 0.02, 0.14, 8);
    gripGeo.rotateX(Math.PI / 2);
    const gripL = new THREE.Mesh(gripGeo, this.rubberMat);
    gripL.position.set(0.08, 0.11, 0.26);
    const gripR = new THREE.Mesh(gripGeo, this.rubberMat);
    gripR.position.set(0.08, 0.11, -0.26);
    this.forkGroup.add(gripL);
    this.forkGroup.add(gripR);

    // Headlight
    const lightGeo = new THREE.ConeGeometry(0.04, 0.08, 12);
    lightGeo.rotateZ(-Math.PI / 2);
    const headlight = new THREE.Mesh(lightGeo, this.lightMat);
    headlight.position.set(0.12, 0.02, 0);
    this.forkGroup.add(headlight);

    // SpotLight for night riding
    this.spotLight = new THREE.SpotLight(0xfffaed, 2, 45, Math.PI / 6, 0.3, 1);
    this.spotLight.position.set(0.15, 0.02, 0);
    this.spotLight.target.position.set(15, -1, 0);
    this.forkGroup.add(this.spotLight);
    this.forkGroup.add(this.spotLight.target);

    // Front Wheel
    this.frontWheel = this.createWheel();
    this.frontWheel.position.copy(localAxle);
    this.forkGroup.add(this.frontWheel);

    this.bikeBody.add(this.forkGroup);

    // 5. Bottom bracket Crank & Pedals
    this.crankGroup = new THREE.Group();
    this.crankGroup.position.copy(bb);

    const chainringGeo = new THREE.CylinderGeometry(0.09, 0.09, 0.01, 24);
    chainringGeo.rotateX(Math.PI / 2);
    const chainring = new THREE.Mesh(chainringGeo, this.darkMetalMat);
    chainring.position.z = 0.06;
    this.crankGroup.add(chainring);

    // Crank arms
    this.crankArmL = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.16, 0.015), this.darkMetalMat);
    this.crankArmL.position.set(0, 0.06, 0.08);
    this.crankGroup.add(this.crankArmL);

    this.pedalL = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.02, 0.09), this.rubberMat);
    this.pedalL.position.set(0, 0.13, 0.12);
    this.crankGroup.add(this.pedalL);

    this.crankArmR = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.16, 0.015), this.darkMetalMat);
    this.crankArmR.position.set(0, -0.06, -0.08);
    this.crankGroup.add(this.crankArmR);

    this.pedalR = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.02, 0.09), this.rubberMat);
    this.pedalR.position.set(0, -0.13, -0.12);
    this.crankGroup.add(this.pedalR);

    this.bikeBody.add(this.crankGroup);
  }

  buildRider() {
    this.riderGroup = new THREE.Group();

    // Pelvis / Torso
    this.torso = new THREE.Group();
    this.torso.position.set(-0.16, 1.12, 0);
    this.torso.rotation.z = -0.45; // leaning forward aggressively

    const chestMesh = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.42, 0.28), this.riderMat);
    chestMesh.position.y = 0.21;
    chestMesh.castShadow = true;
    this.torso.add(chestMesh);

    // Neck & Head with Helmet
    const headGroup = new THREE.Group();
    headGroup.position.set(0, 0.46, 0);

    const face = new THREE.Mesh(new THREE.SphereGeometry(0.11, 12, 12), this.skinMat);
    face.position.y = 0.04;
    headGroup.add(face);

    const helmet = new THREE.Mesh(new THREE.ConeGeometry(0.14, 0.24, 8), this.helmetMat);
    helmet.rotation.x = Math.PI / 2;
    helmet.rotation.z = Math.PI;
    helmet.position.set(0, 0.11, 0);
    helmet.castShadow = true;
    headGroup.add(helmet);

    // Visor
    const visor = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.03, 0.18), this.darkMetalMat);
    visor.position.set(0.12, 0.05, 0);
    headGroup.add(visor);

    this.torso.add(headGroup);

    // Arms reaching to handlebars
    const armL = this.createTube(new THREE.Vector3(0.06, 0.35, 0.18), new THREE.Vector3(0.58, 0.08, 0.24), 0.035, this.riderMat);
    const armR = this.createTube(new THREE.Vector3(0.06, 0.35, -0.18), new THREE.Vector3(0.58, 0.08, -0.24), 0.035, this.riderMat);
    this.torso.add(armL);
    this.torso.add(armR);

    this.riderGroup.add(this.torso);

    // Legs: Upper and Lower thighs connecting saddle to pedals
    this.leftLegGroup = new THREE.Group();
    this.rightLegGroup = new THREE.Group();
    this.riderGroup.add(this.leftLegGroup);
    this.riderGroup.add(this.rightLegGroup);

    this.bikeBody.add(this.riderGroup);
  }

  update(velocity, steeringInput, leanAngle, dt) {
    const speed = velocity.length();

    // 1. Wheel rotation
    const rotationStep = (speed * dt) / this.wheelRadius;
    this.wheelAngle += rotationStep;
    this.rearWheel.rotation.z = -this.wheelAngle;
    this.frontWheel.rotation.z = -this.wheelAngle;

    // 2. Crank & pedal rotation
    this.crankAngle += rotationStep * 0.7; // Gear ratio
    this.crankGroup.rotation.z = -this.crankAngle;
    this.pedalL.rotation.z = this.crankAngle; // Keep pedals level
    this.pedalR.rotation.z = this.crankAngle;

    // 3. Handlebar steering
    this.steerAngle = THREE.MathUtils.lerp(this.steerAngle, steeringInput * 0.45, dt * 10);
    this.forkGroup.rotation.y = this.steerAngle;

    // 4. Lean angle into corners
    this.leanAngle = THREE.MathUtils.lerp(this.leanAngle, leanAngle, dt * 10);
    this.bikeBody.rotation.z = this.leanAngle;

    // Subtle rider bobbing while pedaling
    if (speed > 0.2) {
      this.torso.position.y = 1.12 + Math.sin(this.crankAngle * 2) * 0.02;
    }
  }

  getRearWheelContactPosition() {
    const rearLocal = new THREE.Vector3(-this.wheelbase * 0.52, 0, 0);
    return this.root.localToWorld(rearLocal);
  }

  setLightIntensity(intensity) {
    this.spotLight.intensity = intensity;
  }
}
