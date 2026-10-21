import * as THREE from 'three';

// Modular Part Configurations and Stat Profiles (Wheel World inspired)
export const BIKE_PARTS_CATALOG = {
  frame: {
    apex: {
      name: 'Apex Aero Carbon',
      desc: 'High-modulus carbon monocoque with aerodynamic airfoil tubes.',
      power: 82,
      aero: 94,
      handling: 85,
      grip: 72,
      perk: '💨 -20% Wind Drag at High Speed',
    },
    summit: {
      name: 'Summit Hardtail MTB',
      desc: 'Reinforced hydroformed 6061 alloy with aggressive trail geometry.',
      power: 76,
      aero: 68,
      handling: 92,
      grip: 96,
      perk: '🏔️ +25% Offroad & Grass Traction',
    },
    cruiser: {
      name: 'Ghost Mixte Steel',
      desc: 'Classic double-curved chromoly twin-stay frame with supple ride feel.',
      power: 72,
      aero: 74,
      handling: 86,
      grip: 84,
      perk: '🦘 +20% Bunnyhop Height & Air Time',
    },
  },
  fork: {
    suspension: {
      name: 'RockShox Blaster 120',
      desc: 'Plush air spring suspension with 32mm stanchions and magnesium lowers.',
      power: 72,
      aero: 70,
      handling: 90,
      grip: 96,
      perk: '🛡️ Smooth Landings, No Speed Loss',
    },
    aero: {
      name: 'Monocoque Blade Carbon',
      desc: 'Deep aerodynamic bladed fork with integrated crown and flat mounts.',
      power: 86,
      aero: 96,
      handling: 82,
      grip: 74,
      perk: '⚡ +12% Top Speed Acceleration',
    },
    retro: {
      name: 'Classic Chromoly Curved',
      desc: 'Hand-brazed curved steel fork blades for vintage shock absorption.',
      power: 78,
      aero: 78,
      handling: 86,
      grip: 84,
      perk: '🎯 +10% Cornering Precision',
    },
  },
  wheels: {
    aero: {
      name: 'Aero 50 Carbon Deep-Rim',
      desc: '50mm deep-profile carbon clinchers with bladed aero spokes and slick speed tires.',
      power: 88,
      aero: 96,
      handling: 78,
      grip: 76,
      perk: '🚀 Turbo Boost Multiplier +25%',
    },
    mtb: {
      name: 'MaxxGrip 29er Trail',
      desc: 'Wide reinforced alloy rims with 32 laced spokes and aggressive knobby tires.',
      power: 74,
      aero: 64,
      handling: 88,
      grip: 98,
      perk: '🪨 Zero Drift Skid Loss on Sharp Turns',
    },
    trispoke: {
      name: 'Tri-Spoke Blade Mag',
      desc: 'One-piece carbon composite 3-blade mag wheel with razor aerodynamics.',
      power: 92,
      aero: 92,
      handling: 84,
      grip: 80,
      perk: '🏎️ +15% Sprint Boost Duration',
    },
  },
  bars: {
    riser: {
      name: 'Wide Trail Riser 780',
      desc: 'Wide 780mm alloy riser bars with ergonomic sweep for maximum control.',
      power: 76,
      aero: 70,
      handling: 98,
      grip: 86,
      perk: '🕹️ Ultra-Responsive Rapid Steering',
    },
    drops: {
      name: 'Velodrome Track Drops',
      desc: 'Deep aerodynamic road drop bars with textured tape and aero hoods.',
      power: 92,
      aero: 96,
      handling: 76,
      grip: 72,
      perk: '💨 Aero Tuck: +15% Sprint Max Speed',
    },
    bullhorn: {
      name: 'Courier Alloy Bullhorns',
      desc: 'Aggressive forward-reaching bullhorn bars with reverse brake levers.',
      power: 84,
      aero: 86,
      handling: 90,
      grip: 80,
      perk: '⚡ Quick Bunnyhop Launch Speed',
    },
  },
  drivetrain: {
    cassette: {
      name: '1x12 Mountain Eagle',
      desc: 'Wide-ratio 10-52t cassette with narrow-wide chainring and clutched derailleur.',
      power: 92,
      aero: 82,
      handling: 82,
      grip: 84,
      perk: '⚡ Quick Acceleration from Standstill',
    },
    singlespeed: {
      name: 'Gold Track Single-Speed',
      desc: 'Direct-drive track chainring with chunky gold link chain and single silver cog.',
      power: 96,
      aero: 90,
      handling: 84,
      grip: 76,
      perk: '🔥 Instant Pedal Response & Boost',
    },
    beltdrive: {
      name: 'Carbon Drive CDX Belt',
      desc: 'Quiet carbon-reinforced polyurethane belt with grooved alloy sprockets.',
      power: 84,
      aero: 86,
      handling: 86,
      grip: 86,
      perk: '🤫 Frictionless Rolling: -15% Coast Drag',
    },
  },
  saddle: {
    racing: {
      name: 'Pro SLR Carbon Cutout',
      desc: 'Featherlight carbon shell with central anatomic pressure relief cutout.',
      power: 86,
      aero: 92,
      handling: 86,
      grip: 80,
      perk: '🌪️ +25% Stunt Rotation Spin Speed',
    },
    comfort: {
      name: 'Gel Touring Suspension',
      desc: 'Ergonomic plush gel saddle with elastomer twin springs for smooth landings.',
      power: 74,
      aero: 72,
      handling: 82,
      grip: 90,
      perk: '⭐ Stunt Landing Score Bonus +20%',
    },
    vintage: {
      name: 'Brooks Riveted Leather',
      desc: 'Hand-hammered copper rivets on thick vegetable-tanned natural leather.',
      power: 80,
      aero: 78,
      handling: 84,
      grip: 84,
      perk: '🧲 +20% Coin Magnet Attraction Radius',
    },
  },
};

export class Bicycle {
  constructor(scene) {
    this.scene = scene;
    this.root = new THREE.Group();
    this.scene.add(this.root);

    // Geometry Dimensions
    this.wheelRadius = 0.42;
    this.wheelbase = 1.16;
    this.crankAngle = 0;
    this.wheelAngle = 0;
    this.steerAngle = 0;
    this.leanAngle = 0;

    // Equipped Modular Parts State
    this.equipped = {
      frame: 'apex',
      fork: 'suspension',
      wheels: 'aero',
      bars: 'riser',
      drivetrain: 'cassette',
      saddle: 'racing',
    };

    // Load saved parts from localStorage if present
    this.loadSavedParts();

    // Stylized Materials (Cel-shaded/Vibrant Wheel World Aesthetic)
    this.initMaterials();

    // Sub-groups for modular swapping
    this.bikeBody = new THREE.Group();
    this.bikeBody.rotation.y = -Math.PI / 2; // Orient forward along +Z
    this.root.add(this.bikeBody);

    this.frameGroup = new THREE.Group();
    this.forkGroup = new THREE.Group();
    this.rearWheelGroup = new THREE.Group();
    this.frontWheelGroup = new THREE.Group();
    this.barsGroup = new THREE.Group();
    this.drivetrainGroup = new THREE.Group();
    this.saddleGroup = new THREE.Group();
    this.riderGroup = new THREE.Group();

    this.bikeBody.add(this.frameGroup);
    this.bikeBody.add(this.forkGroup);
    this.bikeBody.add(this.rearWheelGroup);
    this.bikeBody.add(this.drivetrainGroup);
    this.bikeBody.add(this.saddleGroup);
    this.bikeBody.add(this.riderGroup);

    // Build complete bicycle and rider
    this.rebuildAll();
  }

  loadSavedParts() {
    try {
      const saved = localStorage.getItem('velocity_equipped_parts');
      if (saved) {
        const parsed = JSON.parse(saved);
        this.equipped = { ...this.equipped, ...parsed };
      }
    } catch (e) {
      console.warn('Could not load saved bike parts', e);
    }
  }

  saveParts() {
    try {
      localStorage.setItem('velocity_equipped_parts', JSON.stringify(this.equipped));
    } catch (e) {
      console.warn('Could not save bike parts', e);
    }
  }

  initMaterials() {
    // Punchy, stylized materials matching Wheel World Moebius comic palette
    this.frameMat = new THREE.MeshStandardMaterial({
      color: 0x00f0ff, // Vibrant Cyan
      roughness: 0.28,
      metalness: 0.72,
    });

    this.accentMat = new THREE.MeshStandardMaterial({
      color: 0xffea00, // Vibrant Electric Yellow
      roughness: 0.35,
      metalness: 0.55,
    });

    this.darkMetalMat = new THREE.MeshStandardMaterial({
      color: 0x181a20,
      roughness: 0.3,
      metalness: 0.85,
    });

    this.chromeMat = new THREE.MeshStandardMaterial({
      color: 0xe0e6ed,
      roughness: 0.12,
      metalness: 0.95,
    });

    this.rubberMat = new THREE.MeshStandardMaterial({
      color: 0x141416,
      roughness: 0.92,
      metalness: 0.05,
    });

    this.spokeMat = new THREE.MeshStandardMaterial({
      color: 0xc4c9d0,
      roughness: 0.2,
      metalness: 0.9,
    });

    this.goldMat = new THREE.MeshStandardMaterial({
      color: 0xffd700,
      roughness: 0.25,
      metalness: 0.85,
    });

    this.discRotorMat = new THREE.MeshStandardMaterial({
      color: 0xcccccc,
      roughness: 0.2,
      metalness: 0.95,
      side: THREE.DoubleSide,
    });

    this.lightMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      emissive: 0xffeeaa,
      emissiveIntensity: 0.9,
    });

    // Rider Materials
    this.riderMat = new THREE.MeshStandardMaterial({
      color: 0x2979ff, // Jersey Royal Blue
      roughness: 0.6,
    });

    this.shortsMat = new THREE.MeshStandardMaterial({
      color: 0x1a1a24, // Bib shorts dark slate
      roughness: 0.8,
    });

    this.skinMat = new THREE.MeshStandardMaterial({
      color: 0xffb380, // Stylized warm skin tone
      roughness: 0.7,
    });

    this.helmetMat = new THREE.MeshStandardMaterial({
      color: 0xffea00, // Solar Yellow
      roughness: 0.25,
      metalness: 0.3,
    });

    this.visorMat = new THREE.MeshStandardMaterial({
      color: 0x00f0ff, // Mirrored Cyan shades
      roughness: 0.1,
      metalness: 0.9,
    });

    this.shoeMat = new THREE.MeshStandardMaterial({
      color: 0xff2a6d, // Neon Coral sneakers
      roughness: 0.5,
    });
  }

  // --- Utility Builder Helpers ---
  createTube(start, end, radius, material) {
    const dir = new THREE.Vector3().subVectors(end, start);
    const len = dir.length();
    const mid = new THREE.Vector3().addVectors(start, end).multiplyScalar(0.5);

    const geo = new THREE.CylinderGeometry(radius, radius, len, 10);
    const mesh = new THREE.Mesh(geo, material);

    const axis = new THREE.Vector3(0, 1, 0);
    dir.normalize();
    mesh.quaternion.setFromUnitVectors(axis, dir);
    mesh.position.copy(mid);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    return mesh;
  }

  createDiscRotor(radius = 0.13) {
    const group = new THREE.Group();
    const discGeo = new THREE.RingGeometry(0.045, radius, 24);
    const disc = new THREE.Mesh(discGeo, this.discRotorMat);
    group.add(disc);

    // Caliper
    const calGeo = new THREE.BoxGeometry(0.045, 0.06, 0.025);
    const caliper = new THREE.Mesh(calGeo, this.darkMetalMat);
    caliper.position.set(0, radius * 0.85, 0.012);
    caliper.castShadow = true;
    group.add(caliper);
    return group;
  }

  // --- Wheel Models ---
  buildWheel(wheelType = 'aero') {
    const wheelGroup = new THREE.Group();

    if (wheelType === 'trispoke') {
      // 1. Carbon Tri-Spoke Blade Wheel
      // Tire
      const tireGeo = new THREE.TorusGeometry(this.wheelRadius, 0.042, 16, 40);
      const tire = new THREE.Mesh(tireGeo, this.rubberMat);
      tire.castShadow = true;
      wheelGroup.add(tire);

      // Deep aerodynamic rim
      const rimGeo = new THREE.TorusGeometry(this.wheelRadius * 0.91, 0.032, 12, 40);
      const rim = new THREE.Mesh(rimGeo, this.darkMetalMat);
      wheelGroup.add(rim);

      // 3 Aerodynamic carbon blades
      for (let i = 0; i < 3; i++) {
        const bladeAngle = (i / 3) * Math.PI * 2;
        const bladeGeo = new THREE.BoxGeometry(0.065, this.wheelRadius * 0.84, 0.016);
        const blade = new THREE.Mesh(bladeGeo, this.darkMetalMat);
        blade.position.set(
          Math.sin(bladeAngle) * (this.wheelRadius * 0.42),
          Math.cos(bladeAngle) * (this.wheelRadius * 0.42),
          0
        );
        blade.rotation.z = -bladeAngle;
        blade.castShadow = true;
        wheelGroup.add(blade);

        // Vibrant accent decal strip on each blade
        const decalGeo = new THREE.BoxGeometry(0.03, this.wheelRadius * 0.35, 0.018);
        const decal = new THREE.Mesh(decalGeo, this.accentMat);
        decal.position.copy(blade.position);
        decal.rotation.z = -bladeAngle;
        wheelGroup.add(decal);
      }

      // Hub
      const hubGeo = new THREE.CylinderGeometry(0.05, 0.05, 0.09, 16);
      hubGeo.rotateX(Math.PI / 2);
      const hub = new THREE.Mesh(hubGeo, this.chromeMat);
      wheelGroup.add(hub);

    } else if (wheelType === 'mtb') {
      // 2. Heavy Duty Knobby MTB 29er Wheel
      // Chunky knobby tire
      const tireGeo = new THREE.TorusGeometry(this.wheelRadius, 0.054, 16, 36);
      const tire = new THREE.Mesh(tireGeo, this.rubberMat);
      tire.castShadow = true;
      wheelGroup.add(tire);

      // Tire tread knobs
      const knobCount = 28;
      const knobGeo = new THREE.BoxGeometry(0.02, 0.018, 0.07);
      for (let k = 0; k < knobCount; k++) {
        const ang = (k / knobCount) * Math.PI * 2;
        const knob = new THREE.Mesh(knobGeo, this.rubberMat);
        knob.position.set(
          Math.sin(ang) * (this.wheelRadius + 0.046),
          Math.cos(ang) * (this.wheelRadius + 0.046),
          0
        );
        knob.rotation.z = -ang;
        wheelGroup.add(knob);
      }

      // Wide alloy rim
      const rimGeo = new THREE.TorusGeometry(this.wheelRadius * 0.89, 0.022, 10, 36);
      const rim = new THREE.Mesh(rimGeo, this.accentMat);
      wheelGroup.add(rim);

      // Hub
      const hubGeo = new THREE.CylinderGeometry(0.045, 0.045, 0.1, 14);
      hubGeo.rotateX(Math.PI / 2);
      const hub = new THREE.Mesh(hubGeo, this.darkMetalMat);
      wheelGroup.add(hub);

      // 24 Cross Spokes
      const spokeCount = 24;
      for (let i = 0; i < spokeCount; i++) {
        const angle = (i / spokeCount) * Math.PI * 2;
        const spokeGeo = new THREE.CylinderGeometry(0.0035, 0.0035, this.wheelRadius * 1.76, 4);
        spokeGeo.rotateZ(angle);
        const spoke = new THREE.Mesh(spokeGeo, this.spokeMat);
        wheelGroup.add(spoke);
      }

    } else {
      // 3. Aero 50 Carbon Deep-Rim (Default)
      // Slick speed tire
      const tireGeo = new THREE.TorusGeometry(this.wheelRadius, 0.042, 14, 40);
      const tire = new THREE.Mesh(tireGeo, this.rubberMat);
      tire.castShadow = true;
      wheelGroup.add(tire);

      // Sidewall speed stripe
      const stripeGeo = new THREE.TorusGeometry(this.wheelRadius * 0.97, 0.006, 8, 36);
      const stripe = new THREE.Mesh(stripeGeo, this.accentMat);
      wheelGroup.add(stripe);

      // Deep 50mm Carbon rim
      const rimGeo = new THREE.TorusGeometry(this.wheelRadius * 0.88, 0.038, 12, 40);
      const rim = new THREE.Mesh(rimGeo, this.darkMetalMat);
      wheelGroup.add(rim);

      // Hub
      const hubGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.09, 14);
      hubGeo.rotateX(Math.PI / 2);
      const hub = new THREE.Mesh(hubGeo, this.chromeMat);
      wheelGroup.add(hub);

      // 16 Bladed Aero Spokes
      const spokeCount = 16;
      for (let i = 0; i < spokeCount; i++) {
        const angle = (i / spokeCount) * Math.PI * 2;
        const spokeGeo = new THREE.BoxGeometry(0.005, this.wheelRadius * 1.74, 0.002);
        spokeGeo.rotateZ(angle);
        const spoke = new THREE.Mesh(spokeGeo, this.spokeMat);
        wheelGroup.add(spoke);
      }
    }

    // Ventilated Disc Brake Rotor on Left Side
    const rotor = this.createDiscRotor(0.125);
    rotor.position.z = 0.048;
    wheelGroup.add(rotor);

    return wheelGroup;
  }

  // --- Frame Models ---
  buildFrame(frameType = 'apex') {
    while (this.frameGroup.children.length > 0) {
      this.frameGroup.remove(this.frameGroup.children[0]);
    }

    const bb = new THREE.Vector3(0, 0.42, 0);
    const rearAxle = new THREE.Vector3(-this.wheelbase * 0.52, 0.42, 0);
    const headTop = new THREE.Vector3(0.42, 0.98, 0);
    const headBottom = new THREE.Vector3(0.46, 0.74, 0);

    let seatCluster = new THREE.Vector3(-0.16, 0.88, 0);
    if (frameType === 'summit') {
      seatCluster = new THREE.Vector3(-0.14, 0.80, 0); // Sloping MTB geometry
    } else if (frameType === 'cruiser') {
      seatCluster = new THREE.Vector3(-0.18, 0.78, 0); // Low step-through
    }

    // Bottom Bracket Shell
    const bbShellGeo = new THREE.CylinderGeometry(0.038, 0.038, 0.11, 14);
    bbShellGeo.rotateX(Math.PI / 2);
    const bbShell = new THREE.Mesh(bbShellGeo, this.darkMetalMat);
    bbShell.position.copy(bb);
    this.frameGroup.add(bbShell);

    // Head Tube
    const headTube = this.createTube(headBottom, headTop, 0.032, this.darkMetalMat);
    this.frameGroup.add(headTube);

    if (frameType === 'summit') {
      // Sloping aggressive MTB Frame
      this.frameGroup.add(this.createTube(bb, seatCluster, 0.028, this.frameMat));
      this.frameGroup.add(this.createTube(bb, headBottom, 0.034, this.frameMat)); // Beefy downtube
      this.frameGroup.add(this.createTube(seatCluster, headTop, 0.026, this.frameMat)); // Sloping top tube

      // Gusset reinforcement under head tube
      const gusset = this.createTube(new THREE.Vector3(0.38, 0.72, 0), new THREE.Vector3(0.44, 0.80, 0), 0.018, this.accentMat);
      this.frameGroup.add(gusset);

      // Twin chunky chainstays & seatstays
      [-0.05, 0.05].forEach(zOffset => {
        const rearDrop = rearAxle.clone().add(new THREE.Vector3(0, 0, zOffset));
        const bbSide = bb.clone().add(new THREE.Vector3(0, 0, zOffset * 0.7));
        const seatSide = seatCluster.clone().add(new THREE.Vector3(0, 0, zOffset * 0.5));
        this.frameGroup.add(this.createTube(rearDrop, bbSide, 0.018, this.darkMetalMat));
        this.frameGroup.add(this.createTube(rearDrop, seatSide, 0.016, this.frameMat));
      });

    } else if (frameType === 'cruiser') {
      // Classic Double Curved Mixte / Retro Frame
      this.frameGroup.add(this.createTube(bb, seatCluster, 0.024, this.frameMat));
      this.frameGroup.add(this.createTube(bb, headBottom, 0.026, this.frameMat));

      // Curved twin top-tube running from head down to rear dropouts
      [-0.035, 0.035].forEach(zOffset => {
        const topStart = headTop.clone().add(new THREE.Vector3(0, -0.06, zOffset * 0.4));
        const midPoint = new THREE.Vector3(0.06, 0.68, zOffset);
        const rearDrop = rearAxle.clone().add(new THREE.Vector3(0, 0, zOffset));
        this.frameGroup.add(this.createTube(topStart, midPoint, 0.016, this.frameMat));
        this.frameGroup.add(this.createTube(midPoint, rearDrop, 0.016, this.accentMat));
      });

      // Chainstays
      [-0.05, 0.05].forEach(zOffset => {
        const rearDrop = rearAxle.clone().add(new THREE.Vector3(0, 0, zOffset));
        this.frameGroup.add(this.createTube(rearDrop, bb.clone().add(new THREE.Vector3(0, 0, zOffset * 0.7)), 0.016, this.darkMetalMat));
      });

    } else {
      // Apex Aero Carbon (Default) - Diamond aero airfoil shape
      this.frameGroup.add(this.createTube(bb, seatCluster, 0.026, this.frameMat));
      this.frameGroup.add(this.createTube(bb, headBottom, 0.032, this.frameMat));
      this.frameGroup.add(this.createTube(seatCluster, headTop, 0.024, this.frameMat));

      // Aerodynamic rear seatstays & chainstays
      [-0.05, 0.05].forEach(zOffset => {
        const rearDrop = rearAxle.clone().add(new THREE.Vector3(0, 0, zOffset));
        const bbSide = bb.clone().add(new THREE.Vector3(0, 0, zOffset * 0.6));
        const seatSide = seatCluster.clone().add(new THREE.Vector3(-0.02, -0.04, zOffset * 0.4));
        this.frameGroup.add(this.createTube(rearDrop, bbSide, 0.018, this.darkMetalMat));
        this.frameGroup.add(this.createTube(rearDrop, seatSide, 0.016, this.frameMat));
      });

      // Sleek brand decal band on downtube
      const decalMesh = this.createTube(
        new THREE.Vector3(0.16, 0.54, 0),
        new THREE.Vector3(0.28, 0.63, 0),
        0.035,
        this.accentMat
      );
      this.frameGroup.add(decalMesh);
    }
  }

  // --- Fork Models ---
  buildFork(forkType = 'suspension') {
    while (this.forkGroup.children.length > 0) {
      this.forkGroup.remove(this.forkGroup.children[0]);
    }

    const headTop = new THREE.Vector3(0.42, 0.98, 0);
    const frontAxle = new THREE.Vector3(this.wheelbase * 0.48, 0.42, 0);
    this.forkGroup.position.copy(headTop);

    const localAxle = new THREE.Vector3().subVectors(frontAxle, headTop);

    // Steerer tube through headset
    const steerer = this.createTube(new THREE.Vector3(0, -0.24, 0), new THREE.Vector3(0, 0.04, 0), 0.022, this.darkMetalMat);
    this.forkGroup.add(steerer);

    if (forkType === 'suspension') {
      // 1. RockShox Dual Stanchion Suspension Fork
      const crownGeo = new THREE.BoxGeometry(0.06, 0.04, 0.16);
      const crown = new THREE.Mesh(crownGeo, this.darkMetalMat);
      crown.position.set(0, -0.22, 0);
      crown.castShadow = true;
      this.forkGroup.add(crown);

      // Suspension bridge arch
      const archGeo = new THREE.TorusGeometry(0.065, 0.014, 8, 16, Math.PI);
      archGeo.rotateY(Math.PI / 2);
      const arch = new THREE.Mesh(archGeo, this.accentMat);
      arch.position.set(localAxle.x * 0.55, localAxle.y * 0.55, 0);
      this.forkGroup.add(arch);

      [-0.056, 0.056].forEach(zOffset => {
        const topP = new THREE.Vector3(0, -0.24, zOffset);
        const midP = new THREE.Vector3(localAxle.x * 0.45, localAxle.y * 0.45, zOffset);
        const botP = localAxle.clone().add(new THREE.Vector3(0, 0, zOffset));

        // Shiny chrome upper stanchion
        const stanchion = this.createTube(topP, midP, 0.016, this.chromeMat);
        this.forkGroup.add(stanchion);

        // Chunky lower slider leg with seal collar
        const sealCollar = new THREE.Mesh(new THREE.CylinderGeometry(0.024, 0.024, 0.02, 10), this.darkMetalMat);
        sealCollar.position.copy(midP);
        this.forkGroup.add(sealCollar);

        const lowerLeg = this.createTube(midP, botP, 0.022, this.accentMat);
        this.forkGroup.add(lowerLeg);
      });

    } else if (forkType === 'aero') {
      // 2. Monocoque Carbon Aero Blade Fork
      const crownGeo = new THREE.CylinderGeometry(0.034, 0.04, 0.06, 12);
      const crown = new THREE.Mesh(crownGeo, this.darkMetalMat);
      crown.position.set(0, -0.22, 0);
      this.forkGroup.add(crown);

      [-0.05, 0.05].forEach(zOffset => {
        const topP = new THREE.Vector3(0, -0.24, zOffset);
        const botP = localAxle.clone().add(new THREE.Vector3(0, 0, zOffset));
        const blade = this.createTube(topP, botP, 0.024, this.frameMat);
        this.forkGroup.add(blade);
      });

    } else {
      // 3. Classic Chromoly Curved Steel Fork
      const crownGeo = new THREE.CylinderGeometry(0.028, 0.032, 0.05, 12);
      const crown = new THREE.Mesh(crownGeo, this.chromeMat);
      crown.position.set(0, -0.22, 0);
      this.forkGroup.add(crown);

      [-0.048, 0.048].forEach(zOffset => {
        const topP = new THREE.Vector3(0, -0.24, zOffset);
        const curveMid = new THREE.Vector3(localAxle.x * 0.65 - 0.02, localAxle.y * 0.65, zOffset);
        const botP = localAxle.clone().add(new THREE.Vector3(0, 0, zOffset));
        this.forkGroup.add(this.createTube(topP, curveMid, 0.016, this.accentMat));
        this.forkGroup.add(this.createTube(curveMid, botP, 0.014, this.chromeMat));
      });
    }

    // Attach Front Wheel to Front Axle
    this.frontWheel = this.buildWheel(this.equipped.wheels);
    this.frontWheel.position.copy(localAxle);
    this.forkGroup.add(this.frontWheel);

    // Front Headlight (with toggleable high-beam spotlight)
    const lightHousingGeo = new THREE.CylinderGeometry(0.032, 0.028, 0.07, 12);
    lightHousingGeo.rotateZ(Math.PI / 2);
    const lightHousing = new THREE.Mesh(lightHousingGeo, this.darkMetalMat);
    lightHousing.position.set(0.10, -0.12, 0);
    this.forkGroup.add(lightHousing);

    const lightLens = new THREE.Mesh(new THREE.CircleGeometry(0.028, 16), this.lightMat);
    lightLens.rotateY(Math.PI / 2);
    lightLens.position.set(0.136, -0.12, 0);
    this.forkGroup.add(lightLens);

    this.spotLight = new THREE.SpotLight(0xfffaed, 2, 50, Math.PI / 5, 0.35, 1);
    this.spotLight.position.set(0.14, -0.12, 0);
    this.spotLight.target.position.set(16, -1.2, 0);
    this.forkGroup.add(this.spotLight);
    this.forkGroup.add(this.spotLight.target);

    // Attach Handlebars to the top of the steerer
    this.forkGroup.add(this.barsGroup);
    this.buildBars(this.equipped.bars);
  }

  // --- Handlebar Models ---
  buildBars(barsType = 'riser') {
    while (this.barsGroup.children.length > 0) {
      this.barsGroup.remove(this.barsGroup.children[0]);
    }

    // Stem
    const stemGeo = new THREE.BoxGeometry(0.10, 0.034, 0.036);
    const stem = new THREE.Mesh(stemGeo, this.darkMetalMat);
    stem.position.set(0.05, 0.05, 0);
    stem.rotation.z = -0.22;
    stem.castShadow = true;
    this.barsGroup.add(stem);

    // Stem Faceplate Bolts
    const faceplate = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.022, 0.04, 10), this.accentMat);
    faceplate.position.set(0.10, 0.065, 0);
    faceplate.rotation.x = Math.PI / 2;
    this.barsGroup.add(faceplate);

    if (barsType === 'drops') {
      // 1. Velodrome Track Drop Bars
      const topBarGeo = new THREE.CylinderGeometry(0.015, 0.015, 0.44, 10);
      topBarGeo.rotateX(Math.PI / 2);
      const topBar = new THREE.Mesh(topBarGeo, this.darkMetalMat);
      topBar.position.set(0.10, 0.07, 0);
      this.barsGroup.add(topBar);

      // Curved Drop Curves
      [-0.22, 0.22].forEach(zOffset => {
        const dropCurveGeo = new THREE.TorusGeometry(0.07, 0.015, 8, 16, Math.PI * 0.7);
        dropCurveGeo.rotateY(Math.PI / 2);
        dropCurveGeo.rotateZ(-Math.PI * 0.3);
        const dropCurve = new THREE.Mesh(dropCurveGeo, this.rubberMat);
        dropCurve.position.set(0.14, 0.02, zOffset);
        this.barsGroup.add(dropCurve);

        // Brake Hoods
        const hoodGeo = new THREE.BoxGeometry(0.05, 0.04, 0.03);
        const hood = new THREE.Mesh(hoodGeo, this.rubberMat);
        hood.position.set(0.16, 0.06, zOffset);
        this.barsGroup.add(hood);

        // Alloy Brake Lever
        const lever = new THREE.Mesh(new THREE.BoxGeometry(0.01, 0.08, 0.015), this.chromeMat);
        lever.position.set(0.18, 0.02, zOffset);
        lever.rotation.z = 0.35;
        this.barsGroup.add(lever);
      });

    } else if (barsType === 'bullhorn') {
      // 2. Courier Alloy Bullhorns
      const barBaseGeo = new THREE.CylinderGeometry(0.015, 0.015, 0.42, 10);
      barBaseGeo.rotateX(Math.PI / 2);
      const barBase = new THREE.Mesh(barBaseGeo, this.darkMetalMat);
      barBase.position.set(0.10, 0.07, 0);
      this.barsGroup.add(barBase);

      // Forward Horns
      [-0.21, 0.21].forEach(zOffset => {
        const hornGeo = new THREE.CylinderGeometry(0.014, 0.014, 0.14, 8);
        hornGeo.rotateZ(Math.PI / 2);
        const horn = new THREE.Mesh(hornGeo, this.accentMat);
        horn.position.set(0.17, 0.09, zOffset);
        this.barsGroup.add(horn);

        // Reverse Brake Lever
        const lever = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.012, 0.012), this.chromeMat);
        lever.position.set(0.22, 0.075, zOffset);
        this.barsGroup.add(lever);
      });

    } else {
      // 3. Wide Trail Riser Bar (780mm) (Default)
      const centerGeo = new THREE.CylinderGeometry(0.016, 0.016, 0.22, 10);
      centerGeo.rotateX(Math.PI / 2);
      const center = new THREE.Mesh(centerGeo, this.darkMetalMat);
      center.position.set(0.10, 0.07, 0);
      this.barsGroup.add(center);

      // Angled riser sides
      [-0.11, 0.11].forEach(zDir => {
        const riserGeo = new THREE.CylinderGeometry(0.014, 0.014, 0.28, 8);
        riserGeo.rotateX(Math.PI / 2);
        const riser = new THREE.Mesh(riserGeo, this.darkMetalMat);
        riser.position.set(0.10, 0.088, zDir * 2.2);
        this.barsGroup.add(riser);

        // Lock-on Grips
        const gripGeo = new THREE.CylinderGeometry(0.022, 0.022, 0.14, 10);
        gripGeo.rotateX(Math.PI / 2);
        const grip = new THREE.Mesh(gripGeo, this.accentMat);
        grip.position.set(0.10, 0.088, zDir * 2.8);
        this.barsGroup.add(grip);

        // Brake Lever & Clamp
        const leverGeo = new THREE.BoxGeometry(0.012, 0.06, 0.018);
        const lever = new THREE.Mesh(leverGeo, this.chromeMat);
        lever.position.set(0.13, 0.06, zDir * 1.8);
        lever.rotation.z = -0.4;
        this.barsGroup.add(lever);
      });
    }

    // Classic Brass Bicycle Bell on Left Handlebar
    const bellGroup = new THREE.Group();
    bellGroup.position.set(0.11, 0.11, 0.14);
    const bellDome = new THREE.Mesh(new THREE.SphereGeometry(0.026, 12, 12, 0, Math.PI * 2, 0, Math.PI * 0.5), this.goldMat);
    bellDome.position.y = 0.01;
    bellGroup.add(bellDome);
    const bellBase = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.015, 10), this.darkMetalMat);
    bellGroup.add(bellBase);
    this.barsGroup.add(bellGroup);
  }

  // --- Drivetrain & Crank Models ---
  buildDrivetrain(trainType = 'cassette') {
    while (this.drivetrainGroup.children.length > 0) {
      this.drivetrainGroup.remove(this.drivetrainGroup.children[0]);
    }

    const bb = new THREE.Vector3(0, 0.42, 0);
    const rearAxle = new THREE.Vector3(-this.wheelbase * 0.52, 0.42, 0);

    this.crankGroup = new THREE.Group();
    this.crankGroup.position.copy(bb);

    // Front Chainring
    if (trainType === 'singlespeed') {
      // Chunky Gold Single Track Ring
      const ringGeo = new THREE.CylinderGeometry(0.10, 0.10, 0.012, 24);
      ringGeo.rotateX(Math.PI / 2);
      const ring = new THREE.Mesh(ringGeo, this.goldMat);
      ring.position.z = 0.062;
      this.crankGroup.add(ring);

      // Gold Chain Line
      const chainTop = this.createTube(
        bb.clone().add(new THREE.Vector3(0, 0.10, 0.062)),
        rearAxle.clone().add(new THREE.Vector3(0, 0.045, 0.062)),
        0.009,
        this.goldMat
      );
      const chainBot = this.createTube(
        bb.clone().add(new THREE.Vector3(0, -0.10, 0.062)),
        rearAxle.clone().add(new THREE.Vector3(0, -0.045, 0.062)),
        0.009,
        this.goldMat
      );
      this.drivetrainGroup.add(chainTop);
      this.drivetrainGroup.add(chainBot);

    } else if (trainType === 'beltdrive') {
      // Carbon Drive Belt Sprocket
      const ringGeo = new THREE.CylinderGeometry(0.095, 0.095, 0.014, 24);
      ringGeo.rotateX(Math.PI / 2);
      const ring = new THREE.Mesh(ringGeo, this.darkMetalMat);
      ring.position.z = 0.062;
      this.crankGroup.add(ring);

      // Blue Belt
      const beltTop = this.createTube(
        bb.clone().add(new THREE.Vector3(0, 0.095, 0.062)),
        rearAxle.clone().add(new THREE.Vector3(0, 0.04, 0.062)),
        0.008,
        this.accentMat
      );
      const beltBot = this.createTube(
        bb.clone().add(new THREE.Vector3(0, -0.095, 0.062)),
        rearAxle.clone().add(new THREE.Vector3(0, -0.04, 0.062)),
        0.008,
        this.accentMat
      );
      this.drivetrainGroup.add(beltTop);
      this.drivetrainGroup.add(beltBot);

    } else {
      // 1x12 Mountain Cassette & Clutched Rear Derailleur (Default)
      // Narrow-wide spider chainring
      const ringGeo = new THREE.CylinderGeometry(0.095, 0.095, 0.01, 24);
      ringGeo.rotateX(Math.PI / 2);
      const ring = new THREE.Mesh(ringGeo, this.darkMetalMat);
      ring.position.z = 0.062;
      this.crankGroup.add(ring);

      // 4-bolt spider arms
      for (let s = 0; s < 4; s++) {
        const sAng = (s / 4) * Math.PI * 2;
        const arm = new THREE.Mesh(new THREE.BoxGeometry(0.016, 0.09, 0.012), this.accentMat);
        arm.position.set(Math.sin(sAng) * 0.045, Math.cos(sAng) * 0.045, 0.062);
        arm.rotation.z = -sAng;
        this.crankGroup.add(arm);
      }

      // Stepped Multi-Cog Rear Cassette (12 speeds)
      const cogsGroup = new THREE.Group();
      cogsGroup.position.set(rearAxle.x, rearAxle.y, rearAxle.z + 0.055);
      for (let c = 0; c < 6; c++) {
        const cogRadius = 0.035 + c * 0.012;
        const cogGeo = new THREE.CylinderGeometry(cogRadius, cogRadius, 0.004, 20);
        cogGeo.rotateX(Math.PI / 2);
        const cog = new THREE.Mesh(cogGeo, this.chromeMat);
        cog.position.z = -c * 0.005;
        cogsGroup.add(cog);
      }
      this.drivetrainGroup.add(cogsGroup);

      // Rear Derailleur Body & Pulleys
      const derBody = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.05, 0.03), this.darkMetalMat);
      derBody.position.set(rearAxle.x - 0.04, rearAxle.y - 0.06, rearAxle.z + 0.065);
      this.drivetrainGroup.add(derBody);

      const derCage = this.createTube(
        new THREE.Vector3(rearAxle.x - 0.04, rearAxle.y - 0.06, rearAxle.z + 0.065),
        new THREE.Vector3(rearAxle.x - 0.03, rearAxle.y - 0.12, rearAxle.z + 0.065),
        0.008,
        this.accentMat
      );
      this.drivetrainGroup.add(derCage);

      // Chain loop
      const chainTop = this.createTube(
        bb.clone().add(new THREE.Vector3(0, 0.095, 0.062)),
        rearAxle.clone().add(new THREE.Vector3(0, 0.05, 0.062)),
        0.007,
        this.spokeMat
      );
      const chainBot = this.createTube(
        bb.clone().add(new THREE.Vector3(0, -0.095, 0.062)),
        new THREE.Vector3(rearAxle.x - 0.03, rearAxle.y - 0.12, rearAxle.z + 0.062),
        0.007,
        this.spokeMat
      );
      this.drivetrainGroup.add(chainTop);
      this.drivetrainGroup.add(chainBot);
    }

    // Crank arms (Left & Right)
    this.crankArmL = new THREE.Mesh(new THREE.BoxGeometry(0.024, 0.16, 0.016), this.darkMetalMat);
    this.crankArmL.position.set(0, 0.06, 0.08);
    this.crankArmL.castShadow = true;
    this.crankGroup.add(this.crankArmL);

    this.pedalL = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.02, 0.10), this.rubberMat);
    this.pedalL.position.set(0, 0.13, 0.12);
    this.pedalL.castShadow = true;
    this.crankGroup.add(this.pedalL);

    this.crankArmR = new THREE.Mesh(new THREE.BoxGeometry(0.024, 0.16, 0.016), this.darkMetalMat);
    this.crankArmR.position.set(0, -0.06, -0.08);
    this.crankArmR.castShadow = true;
    this.crankGroup.add(this.crankArmR);

    this.pedalR = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.02, 0.10), this.rubberMat);
    this.pedalR.position.set(0, -0.13, -0.12);
    this.pedalR.castShadow = true;
    this.crankGroup.add(this.pedalR);

    this.drivetrainGroup.add(this.crankGroup);
  }

  // --- Saddle Models ---
  buildSaddle(saddleType = 'racing') {
    while (this.saddleGroup.children.length > 0) {
      this.saddleGroup.remove(this.saddleGroup.children[0]);
    }

    const seatCluster = new THREE.Vector3(-0.16, 0.88, 0);
    const seatPostTop = new THREE.Vector3(-0.21, 1.04, 0);

    // Micro-adjust Seatpost
    const seatpost = this.createTube(seatCluster, seatPostTop, 0.018, this.darkMetalMat);
    this.saddleGroup.add(seatpost);

    // Seatpost Clamp Collar
    const clamp = new THREE.Mesh(new THREE.CylinderGeometry(0.024, 0.024, 0.025, 12), this.accentMat);
    clamp.position.copy(seatCluster);
    this.saddleGroup.add(clamp);

    // Saddle Rails
    [-0.02, 0.02].forEach(zOffset => {
      const rail = this.createTube(
        seatPostTop.clone().add(new THREE.Vector3(-0.06, 0.01, zOffset)),
        seatPostTop.clone().add(new THREE.Vector3(0.06, 0.01, zOffset)),
        0.005,
        this.chromeMat
      );
      this.saddleGroup.add(rail);
    });

    if (saddleType === 'comfort') {
      // Plush Gel Touring Saddle with Rear Springs
      const baseGeo = new THREE.BoxGeometry(0.26, 0.06, 0.18);
      const saddleMesh = new THREE.Mesh(baseGeo, this.rubberMat);
      saddleMesh.position.set(seatPostTop.x - 0.02, seatPostTop.y + 0.04, 0);
      saddleMesh.castShadow = true;
      this.saddleGroup.add(saddleMesh);

      // Twin Chrome Springs
      [-0.05, 0.05].forEach(zOffset => {
        const spring = new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.016, 0.04, 8), this.chromeMat);
        spring.position.set(seatPostTop.x - 0.09, seatPostTop.y + 0.01, zOffset);
        this.saddleGroup.add(spring);
      });

    } else if (saddleType === 'vintage') {
      // Brooks Leather Saddle with Rivets
      const baseGeo = new THREE.BoxGeometry(0.27, 0.05, 0.15);
      const leatherMat = new THREE.MeshStandardMaterial({ color: 0x8d5b4c, roughness: 0.6 });
      const saddleMesh = new THREE.Mesh(baseGeo, leatherMat);
      saddleMesh.position.set(seatPostTop.x - 0.01, seatPostTop.y + 0.038, 0);
      saddleMesh.castShadow = true;
      this.saddleGroup.add(saddleMesh);

      // Copper Rivets on rear rim
      for (let r = 0; r < 5; r++) {
        const rivet = new THREE.Mesh(new THREE.SphereGeometry(0.008, 8, 8), this.goldMat);
        rivet.position.set(seatPostTop.x - 0.13, seatPostTop.y + 0.055, (r - 2) * 0.028);
        this.saddleGroup.add(rivet);
      }

    } else {
      // Pro SLR Carbon Cutout Saddle (Default)
      const baseGeo = new THREE.BoxGeometry(0.25, 0.038, 0.13);
      const saddleMesh = new THREE.Mesh(baseGeo, this.rubberMat);
      saddleMesh.position.set(seatPostTop.x - 0.01, seatPostTop.y + 0.032, 0);
      saddleMesh.castShadow = true;
      this.saddleGroup.add(saddleMesh);

      // Central Anatomic Cutout Channel
      const cutout = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.045, 0.03), this.darkMetalMat);
      cutout.position.set(seatPostTop.x - 0.01, seatPostTop.y + 0.032, 0);
      this.saddleGroup.add(cutout);

      // Colored Wing Accents
      const accentWing = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.02, 0.14), this.accentMat);
      accentWing.position.set(seatPostTop.x - 0.07, seatPostTop.y + 0.028, 0);
      this.saddleGroup.add(accentWing);
    }
  }

  // --- Expressive Stylized Cyclist Avatar ---
  buildRider() {
    while (this.riderGroup.children.length > 0) {
      this.riderGroup.remove(this.riderGroup.children[0]);
    }

    // 1. Torso & Upper Body
    this.torso = new THREE.Group();
    this.torso.position.set(-0.16, 1.10, 0);
    this.torso.rotation.z = -0.42; // Aggressive aerodynamic tuck
    this.riderGroup.add(this.torso);

    // Jersey Chest & Back
    const chestGeo = new THREE.BoxGeometry(0.24, 0.40, 0.28);
    const chestMesh = new THREE.Mesh(chestGeo, this.riderMat);
    chestMesh.position.y = 0.20;
    chestMesh.castShadow = true;
    this.torso.add(chestMesh);

    // Racing Number Patch on Back
    const numberPatch = new THREE.Mesh(new THREE.BoxGeometry(0.01, 0.15, 0.15), new THREE.MeshStandardMaterial({ color: 0xffffff }));
    numberPatch.position.set(-0.125, 0.22, 0);
    this.torso.add(numberPatch);

    // Collar
    const collar = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.09, 0.04, 12), this.darkMetalMat);
    collar.position.set(0, 0.41, 0);
    this.torso.add(collar);

    // 2. Head, Helmet & Shades
    const headGroup = new THREE.Group();
    headGroup.position.set(0, 0.46, 0);

    const face = new THREE.Mesh(new THREE.SphereGeometry(0.10, 14, 14), this.skinMat);
    face.position.y = 0.03;
    headGroup.add(face);

    // Aerodynamic Teardrop Helmet
    const helmetGeo = new THREE.ConeGeometry(0.14, 0.26, 10);
    helmetGeo.rotateX(Math.PI / 2);
    helmetGeo.rotateZ(Math.PI);
    const helmet = new THREE.Mesh(helmetGeo, this.helmetMat);
    helmet.position.set(0, 0.09, 0);
    helmet.castShadow = true;
    headGroup.add(helmet);

    // Helmet Air Vents (dark grooves)
    const vent = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.04, 0.16), this.darkMetalMat);
    vent.position.set(-0.02, 0.12, 0);
    headGroup.add(vent);

    // Mirrored Wraparound Cycling Shades / Visor
    const shadesGeo = new THREE.BoxGeometry(0.12, 0.04, 0.19);
    const shades = new THREE.Mesh(shadesGeo, this.visorMat);
    shades.position.set(0.09, 0.045, 0);
    headGroup.add(shades);

    this.torso.add(headGroup);

    // 3. Arms (Shoulder to Handlebars)
    const armGeoL = this.createTube(new THREE.Vector3(0.05, 0.34, 0.17), new THREE.Vector3(0.55, 0.06, 0.24), 0.034, this.riderMat);
    const armGeoR = this.createTube(new THREE.Vector3(0.05, 0.34, -0.17), new THREE.Vector3(0.55, 0.06, -0.24), 0.034, this.riderMat);
    this.torso.add(armGeoL);
    this.torso.add(armGeoR);

    // Hands
    const handL = new THREE.Mesh(new THREE.SphereGeometry(0.03, 8, 8), this.skinMat);
    handL.position.set(0.55, 0.06, 0.24);
    this.torso.add(handL);
    const handR = new THREE.Mesh(new THREE.SphereGeometry(0.03, 8, 8), this.skinMat);
    handR.position.set(0.55, 0.06, -0.24);
    this.torso.add(handR);

    // 4. Bib Shorts & Hips
    const hipsMesh = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.18, 0.26), this.shortsMat);
    hipsMesh.position.set(-0.16, 0.96, 0);
    this.riderGroup.add(hipsMesh);

    // Dynamic Articulated Legs (Left & Right)
    this.leftLegGroup = new THREE.Group();
    this.rightLegGroup = new THREE.Group();
    this.riderGroup.add(this.leftLegGroup);
    this.riderGroup.add(this.rightLegGroup);

    this.updateLegs();
  }

  // --- Dynamic Pedaling Inverse Kinematics for Legs ---
  updateLegs() {
    // Clear previous leg frame meshes
    while (this.leftLegGroup.children.length > 0) this.leftLegGroup.remove(this.leftLegGroup.children[0]);
    while (this.rightLegGroup.children.length > 0) this.rightLegGroup.remove(this.rightLegGroup.children[0]);

    const bb = new THREE.Vector3(0, 0.42, 0);
    const crankRadius = 0.16;

    // Left Pedal (tracks current crank angle)
    const pedalL = new THREE.Vector3(
      bb.x + Math.sin(this.crankAngle) * crankRadius,
      bb.y + Math.cos(this.crankAngle) * crankRadius,
      0.12
    );
    const hipL = new THREE.Vector3(-0.14, 0.95, 0.11);

    // Right Pedal (opposite by PI)
    const pedalR = new THREE.Vector3(
      bb.x - Math.sin(this.crankAngle) * crankRadius,
      bb.y - Math.cos(this.crankAngle) * crankRadius,
      -0.12
    );
    const hipR = new THREE.Vector3(-0.14, 0.95, -0.11);

    this.solveLeg(hipL, pedalL, this.leftLegGroup);
    this.solveLeg(hipR, pedalR, this.rightLegGroup);
  }

  solveLeg(hip, foot, legGroup) {
    const thighLen = 0.36;
    const calfLen = 0.36;

    const hipToFoot = new THREE.Vector3().subVectors(foot, hip);
    const dist = Math.min(hipToFoot.length(), thighLen + calfLen - 0.02);

    // Angle of knee bending forward
    const cosAngle = (thighLen * thighLen + dist * dist - calfLen * calfLen) / (2 * thighLen * dist);
    const clampedCos = Math.max(-1, Math.min(1, cosAngle));
    const alpha = Math.acos(clampedCos);

    // Knee position solved forward in X-Y plane
    const dir = hipToFoot.clone().normalize();
    const perp = new THREE.Vector3(-dir.y, dir.x, 0).normalize();
    if (perp.x < 0) perp.multiplyScalar(-1); // ensure forward bend

    const knee = hip.clone()
      .add(dir.clone().multiplyScalar(Math.cos(alpha) * thighLen))
      .add(perp.clone().multiplyScalar(Math.sin(alpha) * thighLen));

    // Thigh (Bib shorts)
    const thigh = this.createTube(hip, knee, 0.042, this.shortsMat);
    legGroup.add(thigh);

    // Knee joint
    const kneeMesh = new THREE.Mesh(new THREE.SphereGeometry(0.038, 8, 8), this.skinMat);
    kneeMesh.position.copy(knee);
    legGroup.add(kneeMesh);

    // Calf / Shin (Bare skin)
    const calf = this.createTube(knee, foot, 0.034, this.skinMat);
    legGroup.add(calf);

    // Cycling Shoe / Sneaker at pedal
    const shoeGeo = new THREE.BoxGeometry(0.12, 0.04, 0.06);
    const shoe = new THREE.Mesh(shoeGeo, this.shoeMat);
    shoe.position.copy(foot);
    shoe.position.y += 0.02;
    shoe.position.x += 0.02;
    shoe.castShadow = true;
    legGroup.add(shoe);
  }

  // --- Complete Rebuild Pipeline ---
  rebuildAll() {
    this.buildFrame(this.equipped.frame);
    this.buildFork(this.equipped.fork);

    // Rear Wheel
    while (this.rearWheelGroup.children.length > 0) {
      this.rearWheelGroup.remove(this.rearWheelGroup.children[0]);
    }
    this.rearWheel = this.buildWheel(this.equipped.wheels);
    const rearAxle = new THREE.Vector3(-this.wheelbase * 0.52, 0.42, 0);
    this.rearWheel.position.copy(rearAxle);
    this.rearWheelGroup.add(this.rearWheel);

    this.buildDrivetrain(this.equipped.drivetrain);
    this.buildSaddle(this.equipped.saddle);
    this.buildRider();
  }

  // --- Part Swapping API ---
  setPart(slot, partId) {
    if (!BIKE_PARTS_CATALOG[slot] || !BIKE_PARTS_CATALOG[slot][partId]) {
      console.warn(`Invalid part ${partId} for slot ${slot}`);
      return false;
    }

    this.equipped[slot] = partId;
    this.saveParts();

    if (slot === 'frame') {
      this.buildFrame(partId);
      this.buildSaddle(this.equipped.saddle);
    } else if (slot === 'fork') {
      this.buildFork(partId);
    } else if (slot === 'wheels') {
      // Rebuild both front and rear wheels
      while (this.rearWheelGroup.children.length > 0) this.rearWheelGroup.remove(this.rearWheelGroup.children[0]);
      this.rearWheel = this.buildWheel(partId);
      this.rearWheel.position.set(-this.wheelbase * 0.52, 0.42, 0);
      this.rearWheelGroup.add(this.rearWheel);

      // Front wheel is child of forkGroup
      if (this.frontWheel && this.frontWheel.parent) {
        const localPos = this.frontWheel.position.clone();
        this.frontWheel.parent.remove(this.frontWheel);
        this.frontWheel = this.buildWheel(partId);
        this.frontWheel.position.copy(localPos);
        this.forkGroup.add(this.frontWheel);
      }
    } else if (slot === 'bars') {
      this.buildBars(partId);
    } else if (slot === 'drivetrain') {
      this.buildDrivetrain(partId);
    } else if (slot === 'saddle') {
      this.buildSaddle(partId);
    }

    return true;
  }

  getOverallStats() {
    let power = 0;
    let aero = 0;
    let handling = 0;
    let grip = 0;
    const slots = ['frame', 'fork', 'wheels', 'bars', 'drivetrain', 'saddle'];

    slots.forEach(slot => {
      const partKey = this.equipped[slot];
      const part = BIKE_PARTS_CATALOG[slot][partKey];
      if (part) {
        power += part.power;
        aero += part.aero;
        handling += part.handling;
        grip += part.grip;
      }
    });

    const count = slots.length;
    return {
      power: Math.round(power / count),
      aero: Math.round(aero / count),
      handling: Math.round(handling / count),
      grip: Math.round(grip / count),
    };
  }

  // --- Animation & Physics Tick Update ---
  update(velocity, steeringInput, leanAngle, dt) {
    const speed = velocity.length();

    // 1. Wheel Spin Rotation
    const rotationStep = (speed * dt) / this.wheelRadius;
    this.wheelAngle += rotationStep;
    if (this.rearWheel) this.rearWheel.rotation.z = -this.wheelAngle;
    if (this.frontWheel) this.frontWheel.rotation.z = -this.wheelAngle;

    // 2. Crank & Pedal Rotation
    this.crankAngle += rotationStep * 0.72; // Gear cadence ratio
    if (this.crankGroup) {
      this.crankGroup.rotation.z = -this.crankAngle;
      if (this.pedalL) this.pedalL.rotation.z = this.crankAngle;
      if (this.pedalR) this.pedalR.rotation.z = this.crankAngle;
    }

    // Dynamic Rider Pedaling Legs Animation
    this.updateLegs();

    // 3. Handlebar Steering
    this.steerAngle = THREE.MathUtils.lerp(this.steerAngle, steeringInput * 0.44, dt * 10);
    this.forkGroup.rotation.y = this.steerAngle;

    // 4. Lean into Corners
    this.leanAngle = THREE.MathUtils.lerp(this.leanAngle, leanAngle, dt * 10);
    this.bikeBody.rotation.z = this.leanAngle;

    // Subtle rider pedaling cadence bobbing
    if (speed > 0.2 && this.torso) {
      this.torso.position.y = 1.10 + Math.sin(this.crankAngle * 2) * 0.018;
    }
  }

  getRearWheelContactPosition() {
    const rearLocal = new THREE.Vector3(0, 0, -this.wheelbase * 0.52);
    return this.root.localToWorld(rearLocal);
  }

  setLightIntensity(intensity) {
    if (this.spotLight) {
      this.spotLight.intensity = intensity;
    }
  }

  setFrameColor(color) {
    this.frameMat.color.set(color);
  }

  setAccentColor(color) {
    this.accentMat.color.set(color);
  }

  setHelmetColor(color) {
    this.helmetMat.color.set(color);
  }

  setJerseyColor(color) {
    this.riderMat.color.set(color);
  }
}
