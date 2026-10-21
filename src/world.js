import * as THREE from 'three';

export class GameWorld {
  constructor(scene) {
    this.scene = scene;
    this.mapSize = 1200;
    this.coins = [];
    this.ramps = [];
    this.checkpoints = [];
    this.boostPads = [];
    this.clouds = [];
    this.colliders = [];

    this.createTerrain();
    this.createRoadNetwork();
    this.createStuntRamps();
    this.createVegetation();
    this.createLightingAndDecorations();
    this.createCollectibles();
    this.createCheckpoints();
    this.createBoostPads();
    this.createVillageAndTunnel();
    this.createClouds();
  }

  // Smooth undulating procedural landscape height formula
  getTerrainHeight(x, z) {
    // Keep central town / starting hub flat
    const distCenter = Math.hypot(x, z);
    if (distCenter < 40) return 0;

    const blend = Math.min(1, (distCenter - 40) / 60);

    // Compound hills and valleys
    let h = Math.sin(x * 0.015) * Math.cos(z * 0.015) * 6 +
            Math.sin(x * 0.035 + 1.2) * Math.sin(z * 0.025) * 3 +
            Math.cos(x * 0.008 - z * 0.008) * 9;

    // Check ramp elevation override
    for (const ramp of this.ramps) {
      const rx = x - ramp.pos.x;
      const rz = z - ramp.pos.z;
      // Rotate to ramp's local space
      const cosA = Math.cos(-ramp.rotY);
      const sinA = Math.sin(-ramp.rotY);
      const localX = rx * cosA - rz * sinA;
      const localZ = rx * sinA + rz * cosA;

      if (Math.abs(localZ) < ramp.width / 2 && localX >= -ramp.length / 2 && localX <= ramp.length / 2) {
        const t = (localX + ramp.length / 2) / ramp.length;
        const rampHeight = ramp.pos.y + t * ramp.height;
        if (rampHeight > h) return rampHeight;
      }
    }

    return h * blend;
  }

  createTerrain() {
    const geo = new THREE.PlaneGeometry(this.mapSize, this.mapSize, 180, 180);
    geo.rotateX(-Math.PI / 2);

    const pos = geo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const z = pos.getZ(i);
      pos.setY(i, this.getTerrainHeight(x, z));
    }
    geo.computeVertexNormals();

    // Procedural terrain vertex colors (grass green to hill dirt/rock)
    const count = pos.count;
    const colors = new Float32Array(count * 3);
    const colorLow = new THREE.Color(0x388e3c);  // Lush grass
    const colorMid = new THREE.Color(0x558b2f);  // Sunny green
    const colorHigh = new THREE.Color(0x795548); // Dirt/rock peak

    for (let i = 0; i < count; i++) {
      const y = pos.getY(i);
      let c = new THREE.Color();
      if (y < 2) {
        c.lerpColors(colorLow, colorMid, Math.max(0, y / 2));
      } else {
        c.lerpColors(colorMid, colorHigh, Math.min(1, (y - 2) / 12));
      }
      colors[i * 3] = c.r;
      colors[i * 3 + 1] = c.g;
      colors[i * 3 + 2] = c.b;
    }
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const mat = new THREE.MeshStandardMaterial({
      vertexColors: true,
      roughness: 0.9,
      metalness: 0.05,
      flatShading: true,
    });

    this.terrainMesh = new THREE.Mesh(geo, mat);
    this.terrainMesh.receiveShadow = true;
    this.scene.add(this.terrainMesh);
  }

  createRoadNetwork() {
    // Generate curved asphalt tracks through points
    const trackPoints = [
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(60, 0, 30),
      new THREE.Vector3(120, 0, 100),
      new THREE.Vector3(140, 0, 220),
      new THREE.Vector3(80, 0, 320),
      new THREE.Vector3(-40, 0, 340),
      new THREE.Vector3(-160, 0, 260),
      new THREE.Vector3(-220, 0, 120),
      new THREE.Vector3(-180, 0, -80),
      new THREE.Vector3(-60, 0, -180),
      new THREE.Vector3(80, 0, -200),
      new THREE.Vector3(160, 0, -110),
      new THREE.Vector3(100, 0, -40)
    ];

    // Lift curve to match terrain
    trackPoints.forEach(p => {
      p.y = this.getTerrainHeight(p.x, p.z) + 0.12;
    });

    const curve = new THREE.CatmullRomCurve3(trackPoints, true);
    const roadWidth = 10;
    const samples = 300;
    const roadPoints = curve.getPoints(samples);

    const roadGeo = new THREE.BufferGeometry();
    const positions = [];
    const uvs = [];
    const indices = [];

    for (let i = 0; i <= samples; i++) {
      const p = roadPoints[i % samples];
      const nextP = roadPoints[(i + 1) % samples];
      const dir = new THREE.Vector3().subVectors(nextP, p).normalize();
      const normal = new THREE.Vector3(-dir.z, 0, dir.x).normalize();

      const left = p.clone().addScaledVector(normal, -roadWidth / 2);
      const right = p.clone().addScaledVector(normal, roadWidth / 2);

      left.y = this.getTerrainHeight(left.x, left.z) + 0.1;
      right.y = this.getTerrainHeight(right.x, right.z) + 0.1;

      positions.push(left.x, left.y, left.z);
      positions.push(right.x, right.y, right.z);

      const v = i / samples * 30;
      uvs.push(0, v);
      uvs.push(1, v);

      if (i < samples) {
        const base = i * 2;
        indices.push(base, base + 1, base + 2);
        indices.push(base + 1, base + 3, base + 2);
      }
    }

    roadGeo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    roadGeo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
    roadGeo.setIndex(indices);
    roadGeo.computeVertexNormals();

    const roadMat = new THREE.MeshStandardMaterial({
      color: 0x212121,
      roughness: 0.85,
      metalness: 0.1,
    });

    const roadMesh = new THREE.Mesh(roadGeo, roadMat);
    roadMesh.receiveShadow = true;
    this.scene.add(roadMesh);

    // Dashed center lane markings along road circuit
    const stripePoints = curve.getPoints(samples * 2);
    const stripeGeo = new THREE.BufferGeometry();
    const stripePos = [];
    const stripeIndices = [];
    let stripeIdx = 0;

    for (let i = 0; i < stripePoints.length - 1; i += 2) {
      const p = stripePoints[i];
      const nextP = stripePoints[i + 1];
      const dir = new THREE.Vector3().subVectors(nextP, p).normalize();
      const normal = new THREE.Vector3(-dir.z, 0, dir.x).normalize();
      const hw = 0.14; // Line half-width

      const p1 = p.clone().addScaledVector(normal, -hw);
      const p2 = p.clone().addScaledVector(normal, hw);
      const p3 = nextP.clone().addScaledVector(normal, -hw);
      const p4 = nextP.clone().addScaledVector(normal, hw);

      p1.y = this.getTerrainHeight(p1.x, p1.z) + 0.14;
      p2.y = this.getTerrainHeight(p2.x, p2.z) + 0.14;
      p3.y = this.getTerrainHeight(p3.x, p3.z) + 0.14;
      p4.y = this.getTerrainHeight(p4.x, p4.z) + 0.14;

      stripePos.push(p1.x, p1.y, p1.z, p2.x, p2.y, p2.z, p3.x, p3.y, p3.z, p4.x, p4.y, p4.z);
      stripeIndices.push(stripeIdx, stripeIdx + 1, stripeIdx + 2, stripeIdx + 1, stripeIdx + 3, stripeIdx + 2);
      stripeIdx += 4;
    }

    stripeGeo.setAttribute('position', new THREE.Float32BufferAttribute(stripePos, 3));
    stripeGeo.setIndex(stripeIndices);
    stripeGeo.computeVertexNormals();

    const stripeMesh = new THREE.Mesh(stripeGeo, new THREE.MeshStandardMaterial({
      color: 0xffeb3b,
      roughness: 0.4,
      emissive: 0xffd54f,
      emissiveIntensity: 0.35,
    }));
    this.scene.add(stripeMesh);

    // Save road path curve for mini-map rendering
    this.roadCurve = curve;
  }

  createStuntRamps() {
    const rampConfigs = [
      { x: 30, z: 40, rotY: 0.4, w: 7, len: 14, h: 4 },
      { x: -50, z: 80, rotY: -0.8, w: 8, len: 16, h: 5 },
      { x: 100, z: -80, rotY: 2.1, w: 6, len: 12, h: 3.5 },
      { x: -120, z: -50, rotY: 1.4, w: 9, len: 18, h: 6 },
    ];

    const woodMat = new THREE.MeshStandardMaterial({
      color: 0xd7ccc8,
      roughness: 0.7,
      metalness: 0.1,
    });

    const stripeMat = new THREE.MeshStandardMaterial({
      color: 0xffeb3b,
      roughness: 0.4,
    });

    rampConfigs.forEach(cfg => {
      const groundY = this.getTerrainHeight(cfg.x, cfg.z);
      this.ramps.push({
        pos: new THREE.Vector3(cfg.x, groundY, cfg.z),
        rotY: cfg.rotY,
        width: cfg.w,
        length: cfg.len,
        height: cfg.h,
      });

      const rampGroup = new THREE.Group();
      rampGroup.position.set(cfg.x, groundY, cfg.z);
      rampGroup.rotation.y = cfg.rotY;

      // Wedge shape
      const shape = new THREE.Shape();
      shape.moveTo(-cfg.len / 2, 0);
      shape.lineTo(cfg.len / 2, cfg.h);
      shape.lineTo(cfg.len / 2, 0);
      shape.closePath();

      const extrudeSettings = { depth: cfg.w, bevelEnabled: false };
      const geo = new THREE.ExtrudeGeometry(shape, extrudeSettings);
      geo.translate(0, 0, -cfg.w / 2);

      const rampMesh = new THREE.Mesh(geo, woodMat);
      rampMesh.castShadow = true;
      rampMesh.receiveShadow = true;
      rampGroup.add(rampMesh);

      // Warning chevron stripe on top edge
      const edgeGeo = new THREE.BoxGeometry(0.3, 0.1, cfg.w);
      const edgeMesh = new THREE.Mesh(edgeGeo, stripeMat);
      edgeMesh.position.set(cfg.len / 2 - 0.15, cfg.h + 0.05, 0);
      rampGroup.add(edgeMesh);

      this.scene.add(rampGroup);
    });
  }

  createVegetation() {
    const treeGeoCone = new THREE.ConeGeometry(2.4, 5, 5);
    const treeGeoOak = new THREE.DodecahedronGeometry(2.6, 1);
    const trunkGeo = new THREE.CylinderGeometry(0.35, 0.5, 2.5, 6);

    const foliageMat1 = new THREE.MeshStandardMaterial({ color: 0x2e7d32, roughness: 0.8, flatShading: true });
    const foliageMat2 = new THREE.MeshStandardMaterial({ color: 0x388e3c, roughness: 0.8, flatShading: true });
    const foliageMat3 = new THREE.MeshStandardMaterial({ color: 0x66bb6a, roughness: 0.8, flatShading: true });
    const trunkMat = new THREE.MeshStandardMaterial({ color: 0x4e342e, roughness: 0.9 });

    // Rock geometry
    const rockGeo = new THREE.DodecahedronGeometry(1.5, 0);
    const rockMat = new THREE.MeshStandardMaterial({ color: 0x78909c, roughness: 0.85, flatShading: true });

    // Instanced meshes for great performance
    const treeCount = 220;
    const rockCount = 60;

    for (let i = 0; i < treeCount; i++) {
      const radius = 35 + Math.random() * 450;
      const angle = Math.random() * Math.PI * 2;
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;
      const y = this.getTerrainHeight(x, z);

      const tree = new THREE.Group();
      tree.position.set(x, y, z);

      const trunk = new THREE.Mesh(trunkGeo, trunkMat);
      trunk.position.y = 1.25;
      trunk.castShadow = true;
      tree.add(trunk);

      const isPine = (i % 2 === 0);
      if (isPine) {
        const fol1 = new THREE.Mesh(treeGeoCone, foliageMat1);
        fol1.position.y = 3.6;
        fol1.castShadow = true;
        tree.add(fol1);

        const fol2 = new THREE.Mesh(treeGeoCone, foliageMat2);
        fol2.scale.set(0.75, 0.75, 0.75);
        fol2.position.y = 5.2;
        fol2.castShadow = true;
        tree.add(fol2);
      } else {
        const oak = new THREE.Mesh(treeGeoOak, foliageMat3);
        oak.position.y = 3.8;
        oak.scale.set(1, 1.2, 1);
        oak.castShadow = true;
        tree.add(oak);
      }

      const s = 0.7 + Math.random() * 0.6;
      tree.scale.set(s, s, s);
      tree.rotation.y = Math.random() * Math.PI * 2;
      this.scene.add(tree);
    }

    // Rocks
    for (let i = 0; i < rockCount; i++) {
      const radius = 30 + Math.random() * 400;
      const angle = Math.random() * Math.PI * 2;
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;
      const y = this.getTerrainHeight(x, z);

      const rock = new THREE.Mesh(rockGeo, rockMat);
      rock.position.set(x, y + 0.5, z);
      const s = 0.6 + Math.random() * 1.5;
      rock.scale.set(s * (0.8 + Math.random() * 0.4), s * 0.7, s * (0.8 + Math.random() * 0.4));
      rock.rotation.set(Math.random(), Math.random(), Math.random());
      rock.castShadow = true;
      this.scene.add(rock);
    }
  }

  createLightingAndDecorations() {
    // Starting Plaza Arch
    const archGroup = new THREE.Group();
    archGroup.position.set(0, 0, 10);

    const pillarMat = new THREE.MeshStandardMaterial({ color: 0x37474f, roughness: 0.4 });
    const signMat = new THREE.MeshStandardMaterial({ color: 0x00e676, emissive: 0x00e676, emissiveIntensity: 0.6 });

    const pLeft = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.4, 7, 12), pillarMat);
    pLeft.position.set(-6, 3.5, 0);
    const pRight = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.4, 7, 12), pillarMat);
    pRight.position.set(6, 3.5, 0);

    const topBeam = new THREE.Mesh(new THREE.BoxGeometry(13, 0.8, 1), pillarMat);
    topBeam.position.set(0, 7, 0);

    const banner = new THREE.Mesh(new THREE.BoxGeometry(8, 1.4, 0.2), signMat);
    banner.position.set(0, 6.2, 0);

    archGroup.add(pLeft, pRight, topBeam, banner);
    this.scene.add(archGroup);

    // Street Lamps along start track
    for (let i = -3; i <= 3; i++) {
      if (i === 0) continue;
      const z = i * 25;
      const lamp = this.createStreetLamp(7.5, z);
      this.scene.add(lamp);
    }
  }

  createStreetLamp(x, z) {
    const y = this.getTerrainHeight(x, z);
    const lamp = new THREE.Group();
    lamp.position.set(x, y, z);

    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.16, 6, 8), new THREE.MeshStandardMaterial({ color: 0x263238 }));
    pole.position.y = 3;
    lamp.add(pole);

    const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.3, 8, 8), new THREE.MeshStandardMaterial({
      color: 0xfff59d,
      emissive: 0xffd54f,
      emissiveIntensity: 1.2,
    }));
    bulb.position.set(-0.6, 5.8, 0);
    lamp.add(bulb);

    return lamp;
  }

  createCollectibles() {
    const coinGeo = new THREE.CylinderGeometry(0.8, 0.8, 0.15, 16);
    coinGeo.rotateX(Math.PI / 2);

    const coinMat = new THREE.MeshStandardMaterial({
      color: 0xffd700,
      metalness: 0.9,
      roughness: 0.2,
      emissive: 0xffaa00,
      emissiveIntensity: 0.4,
    });

    // Place coins along road and on ramps
    const spots = [
      { x: 30, z: 40, extraY: 3.5 }, // Ramp jump reward!
      { x: -50, z: 80, extraY: 4.5 },
      { x: 100, z: -80, extraY: 3.5 },
      { x: 0, z: 50, extraY: 1.2 },
      { x: 50, z: 25, extraY: 1.2 },
      { x: 110, z: 90, extraY: 1.2 },
      { x: 135, z: 200, extraY: 1.2 },
      { x: 70, z: 310, extraY: 1.2 },
      { x: -30, z: 330, extraY: 1.2 },
      { x: -150, z: 250, extraY: 1.2 },
      { x: -210, z: 110, extraY: 1.2 },
      { x: -170, z: -70, extraY: 1.2 },
      { x: -50, z: -170, extraY: 1.2 },
      { x: 70, z: -190, extraY: 1.2 },
    ];

    spots.forEach((sp, idx) => {
      const coin = new THREE.Mesh(coinGeo, coinMat);
      const groundY = this.getTerrainHeight(sp.x, sp.z);
      coin.position.set(sp.x, groundY + sp.extraY, sp.z);
      coin.userData = { id: idx, collected: false, baseHeight: groundY + sp.extraY };
      this.coins.push(coin);
      this.scene.add(coin);
    });
  }

  update(time) {
    // Animate spinning and bobbing coins
    for (const coin of this.coins) {
      if (!coin.userData.collected) {
        coin.rotation.y = time * 3;
        coin.position.y = coin.userData.baseHeight + Math.sin(time * 4 + coin.userData.id) * 0.3;
      }
    }

    // Animate drifting clouds
    if (this.clouds) {
      for (const cloud of this.clouds) {
        cloud.position.x += 0.05;
        if (cloud.position.x > 500) cloud.position.x = -500;
      }
    }
  }

  checkCoinCollection(playerPos, onCollect) {
    for (const coin of this.coins) {
      if (!coin.userData.collected) {
        if (playerPos.distanceTo(coin.position) < 2.0) {
          coin.userData.collected = true;
          coin.visible = false;
          if (onCollect) onCollect(coin.userData.id);
        }
      }
    }
  }

  createCheckpoints() {
    const cpPoints = [
      new THREE.Vector3(0, 0, 0),         // Gate 0: Start / Finish
      new THREE.Vector3(60, 0, 30),
      new THREE.Vector3(120, 0, 100),
      new THREE.Vector3(140, 0, 220),
      new THREE.Vector3(80, 0, 320),
      new THREE.Vector3(-40, 0, 340),
      new THREE.Vector3(-160, 0, 260),
      new THREE.Vector3(-220, 0, 120),
      new THREE.Vector3(-180, 0, -80),
      new THREE.Vector3(-60, 0, -180),
      new THREE.Vector3(80, 0, -200),
      new THREE.Vector3(160, 0, -110),
    ];

    const archGeo = new THREE.TorusGeometry(5.2, 0.28, 12, 24, Math.PI);
    archGeo.rotateZ(Math.PI); // Arch over the road

    cpPoints.forEach((pt, idx) => {
      const groundY = this.getTerrainHeight(pt.x, pt.z);
      const cpGroup = new THREE.Group();
      cpGroup.position.set(pt.x, groundY + 0.1, pt.z);

      // Orient arch perpendicular to road track
      const nextIdx = (idx + 1) % cpPoints.length;
      const nextPt = cpPoints[nextIdx];
      const dir = new THREE.Vector3(nextPt.x - pt.x, 0, nextPt.z - pt.z).normalize();
      const angle = Math.atan2(dir.x, dir.z);
      cpGroup.rotation.y = angle;

      const isStartFinish = (idx === 0);
      const activeColor = isStartFinish ? 0x00e676 : 0x00e5ff;

      const ringMat = new THREE.MeshStandardMaterial({
        color: activeColor,
        emissive: activeColor,
        emissiveIntensity: 0.6,
        roughness: 0.2,
      });

      const archMesh = new THREE.Mesh(archGeo, ringMat);
      archMesh.position.y = 0;
      cpGroup.add(archMesh);

      // Support pillars
      const pillarGeo = new THREE.CylinderGeometry(0.3, 0.35, 5.5, 8);
      const pillarMat = new THREE.MeshStandardMaterial({ color: 0x263238, roughness: 0.5 });
      const pL = new THREE.Mesh(pillarGeo, pillarMat);
      pL.position.set(-5.2, 2.7, 0);
      const pR = new THREE.Mesh(pillarGeo, pillarMat);
      pR.position.set(5.2, 2.7, 0);
      cpGroup.add(pL, pR);

      // Glowing floating chevron pointing forward
      const arrowGeo = new THREE.ConeGeometry(0.8, 1.6, 4);
      arrowGeo.rotateX(-Math.PI / 2);
      const arrowMat = new THREE.MeshStandardMaterial({
        color: activeColor,
        emissive: activeColor,
        emissiveIntensity: 1.0,
      });
      const arrow = new THREE.Mesh(arrowGeo, arrowMat);
      arrow.position.set(0, 5.0, 0);
      cpGroup.add(arrow);

      this.checkpoints.push({
        id: idx,
        pos: new THREE.Vector3(pt.x, groundY, pt.z),
        group: cpGroup,
        archMesh,
        ringMat,
        arrow,
        arrowMat,
        isStartFinish,
      });

      this.scene.add(cpGroup);
    });
  }

  updateCheckpoints(time, activeIdx) {
    this.checkpoints.forEach(cp => {
      const isActive = (cp.id === activeIdx);
      if (isActive) {
        const pulse = 0.8 + Math.sin(time * 8) * 0.4;
        cp.ringMat.emissiveIntensity = pulse;
        cp.arrowMat.emissiveIntensity = pulse * 1.5;
        cp.arrow.position.y = 5.0 + Math.sin(time * 6) * 0.3;
        cp.arrow.visible = true;
      } else {
        cp.ringMat.emissiveIntensity = 0.15;
        cp.arrow.visible = false;
      }
    });
  }

  checkCheckpointHit(playerPos, activeIdx) {
    const cp = this.checkpoints[activeIdx];
    if (!cp) return false;
    const dist = Math.hypot(playerPos.x - cp.pos.x, playerPos.z - cp.pos.z);
    return dist < 6.5;
  }

  createBoostPads() {
    const padLocations = [
      { x: 30, z: 15, rotY: 0.5 },
      { x: 130, z: 160, rotY: 1.4 },
      { x: 20, z: 335, rotY: -1.6 },
      { x: -200, z: 20, rotY: -2.8 },
      { x: -120, z: -130, rotY: -0.4 },
    ];

    const padBaseGeo = new THREE.BoxGeometry(6.0, 0.08, 10.0);
    const padBaseMat = new THREE.MeshStandardMaterial({
      color: 0x1a1a24,
      metalness: 0.8,
      roughness: 0.3,
    });

    const chevronGeo = new THREE.BoxGeometry(4.8, 0.12, 1.2);

    padLocations.forEach((loc, idx) => {
      const groundY = this.getTerrainHeight(loc.x, loc.z);
      const group = new THREE.Group();
      group.position.set(loc.x, groundY + 0.04, loc.z);
      group.rotation.y = loc.rotY;

      // Base plate
      const base = new THREE.Mesh(padBaseGeo, padBaseMat);
      base.receiveShadow = true;
      group.add(base);

      // 3 Chevrons
      const chevrons = [];
      const zOffsets = [-3.0, 0.0, 3.0];
      zOffsets.forEach((zo, cIdx) => {
        const cMat = new THREE.MeshStandardMaterial({
          color: 0xff3d00,
          emissive: 0xff3d00,
          emissiveIntensity: 1.2,
          roughness: 0.2,
        });
        const chev = new THREE.Mesh(chevronGeo, cMat);
        chev.position.set(0, 0.06, zo);
        group.add(chev);
        chevrons.push({ mesh: chev, mat: cMat, offset: cIdx });
      });

      this.boostPads.push({
        id: idx,
        pos: new THREE.Vector3(loc.x, groundY, loc.z),
        group,
        chevrons,
        lastTriggered: 0,
      });

      this.scene.add(group);
    });
  }

  updateBoostPads(time) {
    this.boostPads.forEach(pad => {
      pad.chevrons.forEach(c => {
        const pulse = 0.8 + Math.sin(time * 12 + c.offset * 1.5) * 0.7;
        c.mat.emissiveIntensity = Math.max(0.4, pulse * 1.8);
      });
    });
  }

  checkBoostPads(playerPos) {
    const now = performance.now();
    for (const pad of this.boostPads) {
      if (now - pad.lastTriggered < 3000) continue; // Cooldown per pad
      const dist = Math.hypot(playerPos.x - pad.pos.x, playerPos.z - pad.pos.z);
      if (dist < 4.0) {
        pad.lastTriggered = now;
        return true;
      }
    }
    return false;
  }

  createVillageAndTunnel() {
    // 1. Village Cottages
    const houses = [
      { x: 45, z: 80, rot: 0.25, wall: 0xfff8e1, roof: 0xb71c1c },
      { x: 72, z: 75, rot: -0.3, wall: 0xede7f6, roof: 0x37474f },
      { x: 96, z: 95, rot: 0.6, wall: 0xe0f2f1, roof: 0xd84315 },
      { x: 38, z: 110, rot: -0.45, wall: 0xfff3e0, roof: 0x4e342e },
      { x: 68, z: 130, rot: 0.8, wall: 0xfbe9e7, roof: 0x1565c0 },
    ];

    const windowMat = new THREE.MeshStandardMaterial({
      color: 0xffeb3b,
      emissive: 0xffd54f,
      emissiveIntensity: 0.9,
    });
    const doorMat = new THREE.MeshStandardMaterial({ color: 0x5d4037, roughness: 0.8 });

    houses.forEach(cfg => {
      const groundY = this.getTerrainHeight(cfg.x, cfg.z);
      const houseGroup = new THREE.Group();
      houseGroup.position.set(cfg.x, groundY, cfg.z);
      houseGroup.rotation.y = cfg.rot;

      // Walls
      const wallMat = new THREE.MeshStandardMaterial({ color: cfg.wall, roughness: 0.85 });
      const wallMesh = new THREE.Mesh(new THREE.BoxGeometry(6.5, 4.0, 5.5), wallMat);
      wallMesh.position.y = 2.0;
      wallMesh.castShadow = true;
      wallMesh.receiveShadow = true;
      houseGroup.add(wallMesh);

      // Roof (triangular prism / cone)
      const roofMat = new THREE.MeshStandardMaterial({ color: cfg.roof, roughness: 0.7 });
      const roofMesh = new THREE.Mesh(new THREE.ConeGeometry(5.2, 2.5, 4), roofMat);
      roofMesh.position.y = 5.25;
      roofMesh.rotation.y = Math.PI / 4;
      roofMesh.castShadow = true;
      houseGroup.add(roofMesh);

      // Chimney
      const chimney = new THREE.Mesh(new THREE.BoxGeometry(0.7, 1.8, 0.7), new THREE.MeshStandardMaterial({ color: 0x795548 }));
      chimney.position.set(1.5, 5.5, 0.8);
      chimney.castShadow = true;
      houseGroup.add(chimney);

      // Door
      const door = new THREE.Mesh(new THREE.BoxGeometry(1.2, 2.2, 0.1), doorMat);
      door.position.set(0, 1.1, 2.76);
      houseGroup.add(door);

      // Windows
      const winGeo = new THREE.BoxGeometry(1.0, 1.0, 0.08);
      const winL = new THREE.Mesh(winGeo, windowMat);
      winL.position.set(-1.8, 2.2, 2.76);
      const winR = new THREE.Mesh(winGeo, windowMat);
      winR.position.set(1.8, 2.2, 2.76);
      houseGroup.add(winL, winR);

      this.scene.add(houseGroup);
    });

    // 2. Wooden Fences along village curve
    const fenceMat = new THREE.MeshStandardMaterial({ color: 0x6d4c41, roughness: 0.9 });
    const postGeo = new THREE.CylinderGeometry(0.08, 0.1, 1.3, 6);
    const railGeo = new THREE.BoxGeometry(2.8, 0.08, 0.06);

    for (let i = 0; i < 14; i++) {
      const fx = 28 + i * 2.4;
      const fz = 60 + i * 5.2;
      const fy = this.getTerrainHeight(fx, fz);

      const post = new THREE.Mesh(postGeo, fenceMat);
      post.position.set(fx, fy + 0.65, fz);
      post.castShadow = true;
      this.scene.add(post);

      if (i < 13) {
        const nextX = 28 + (i + 1) * 2.4;
        const nextZ = 60 + (i + 1) * 5.2;
        const nextY = this.getTerrainHeight(nextX, nextZ);

        const mid = new THREE.Vector3((fx + nextX) / 2, (fy + nextY) / 2 + 0.7, (fz + nextZ) / 2);
        const rail = new THREE.Mesh(railGeo, fenceMat);
        rail.position.copy(mid);
        rail.lookAt(nextX, mid.y, nextZ);
        this.scene.add(rail);
      }
    }

    // 3. Northern Mountain Arch Tunnel at (-40, 0, 340)
    const tunnelGroup = new THREE.Group();
    const tX = -40;
    const tZ = 340;
    const tY = this.getTerrainHeight(tX, tZ);
    tunnelGroup.position.set(tX, tY, tZ);
    tunnelGroup.rotation.y = -0.15;

    const stoneMat = new THREE.MeshStandardMaterial({
      color: 0x455a64,
      roughness: 0.9,
      flatShading: true,
    });

    // Outer Mountain Arch Structure
    const tunnelArchGeo = new THREE.CylinderGeometry(8.5, 9.2, 20.0, 16, 1, true, 0, Math.PI);
    tunnelArchGeo.rotateZ(Math.PI / 2);
    tunnelArchGeo.rotateY(Math.PI / 2);

    const tunnelMesh = new THREE.Mesh(tunnelArchGeo, stoneMat);
    tunnelMesh.position.y = 0.5;
    tunnelMesh.castShadow = true;
    tunnelMesh.receiveShadow = true;
    tunnelGroup.add(tunnelMesh);

    // Stone Portal Facades at entrance and exit
    const portalGeo = new THREE.BoxGeometry(16.0, 9.0, 1.5);
    const portalFront = new THREE.Mesh(portalGeo, stoneMat);
    portalFront.position.set(0, 4.5, -10.0);
    portalFront.castShadow = true;
    const portalBack = new THREE.Mesh(portalGeo, stoneMat);
    portalBack.position.set(0, 4.5, 10.0);
    portalBack.castShadow = true;
    tunnelGroup.add(portalFront, portalBack);

    // Tunnel Interior Wall Lanterns
    const lanternMat = new THREE.MeshStandardMaterial({
      color: 0xffa726,
      emissive: 0xff9800,
      emissiveIntensity: 1.8,
    });
    const lanternGeo = new THREE.SphereGeometry(0.3, 8, 8);
    [-5, 5].forEach(zOffset => {
      const lLeft = new THREE.Mesh(lanternGeo, lanternMat);
      lLeft.position.set(-5.5, 3.2, zOffset);
      const lRight = new THREE.Mesh(lanternGeo, lanternMat);
      lRight.position.set(5.5, 3.2, zOffset);
      tunnelGroup.add(lLeft, lRight);
    });

    this.scene.add(tunnelGroup);
  }

  createClouds() {
    const cloudMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.4,
      metalness: 0.05,
      flatShading: true,
    });
    const puffGeo = new THREE.DodecahedronGeometry(7, 1);

    for (let i = 0; i < 35; i++) {
      const cloud = new THREE.Group();
      const cx = (Math.random() - 0.5) * 900;
      const cy = 75 + Math.random() * 45;
      const cz = (Math.random() - 0.5) * 900;
      cloud.position.set(cx, cy, cz);

      // Multiple overlapping puffs
      const puffCount = 3 + Math.floor(Math.random() * 3);
      for (let p = 0; p < puffCount; p++) {
        const puff = new THREE.Mesh(puffGeo, cloudMat);
        puff.position.set((p - puffCount / 2) * 6, (Math.random() - 0.5) * 3, (Math.random() - 0.5) * 4);
        const s = 0.7 + Math.random() * 0.6;
        puff.scale.set(s, s * 0.75, s);
        cloud.add(puff);
      }

      this.clouds.push(cloud);
      this.scene.add(cloud);
    }
  }
}
