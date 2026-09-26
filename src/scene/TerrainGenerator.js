/**
 * TerrainGenerator.js
 * Builds realistic 3D terrain using real GeoTIFF elevation DEM (/data/elevation.bin)
 * and high-resolution aerial satellite orthoimagery from GSI (/textures/matsushima_ortho.jpg).
 * Accurately models JASDF Matsushima Air Base (RJST), Runway 07/25 (2,700m), Runway 15/33 (1,500m),
 * Blue Impulse Apron, 11th Squadron Hangars, Control Tower, PAPI, Runway Lights, and Matsushima Bay.
 */

import * as THREE from 'three';

export class TerrainGenerator {
  constructor(scene) {
    this.scene = scene;
    this.elevationData = null;
    this.meta = null;
    this.groundMesh = null;
  }

  async build() {
    const group = new THREE.Group();
    group.name = 'MatsushimaTerrainGroup';

    // 1. Load elevation metadata & binary grid
    await this.loadElevationData();

    // 2. Build Realistic 3D Terrain Mesh with High-Resolution Aerial Orthophoto
    this.buildDemTerrain(group);

    // 3. Water Surface (Matsushima Bay, Sendai Bay, Ishinomaki Coast)
    this.buildOceanWater(group);

    // 4. Matsushima Air Base Apron & Pavement
    this.buildAirfieldApron(group);

    // 5. Runways (07/25 & 15/33)
    this.buildRunways(group);

    // 6. Hangars, Control Tower & Air Base Structures
    this.buildBaseStructures(group);

    // 7. Approach & Runway Lighting
    this.buildAirfieldLights(group);

    this.scene.add(group);
    return group;
  }

  async loadElevationData() {
    try {
      const metaRes = await fetch('/data/elevation_meta.json');
      if (metaRes.ok) {
        this.meta = await metaRes.json();
      }

      const binRes = await fetch('/data/elevation.bin');
      if (binRes.ok) {
        const buffer = await binRes.arrayBuffer();
        this.elevationData = new Float32Array(buffer);
        console.log('Loaded Matsushima GeoTIFF DEM elevation data:', this.meta);
      }
    } catch (e) {
      console.warn('Could not load elevation binary, falling back to procedural terrain:', e);
    }
  }

  getElevationAt(worldX, worldZ) {
    if (!this.elevationData || !this.meta) {
      // Matsushima Airfield base elevation fallback
      if (Math.abs(worldX) < 4000 && Math.abs(worldZ) < 4000) {
        return 2.5;
      }
      return 0.0;
    }

    const { x_min, x_max, z_min, z_max, width, height } = this.meta;
    if (worldX < x_min || worldX > x_max || worldZ < z_min || worldZ > z_max) {
      return 0.0;
    }

    const u = (worldX - x_min) / (x_max - x_min);
    const v = (worldZ - z_min) / (z_max - z_min);

    const px = Math.min(width - 1, Math.max(0, Math.floor(u * (width - 1))));
    const py = Math.min(height - 1, Math.max(0, Math.floor(v * (height - 1))));

    const elev = this.elevationData[py * width + px] || 0.0;
    // In immediate vicinity of Matsushima Air Base runways, ensure flat airfield elevation (2.5m)
    if (Math.abs(worldX) < 2600 && Math.abs(worldZ) < 2200) {
      return 2.5;
    }
    return Math.max(0.0, elev);
  }

  buildDemTerrain(parent) {
    const texLoader = new THREE.TextureLoader();
    const orthoTex = texLoader.load('/textures/matsushima_ortho.jpg');
    orthoTex.wrapS = THREE.ClampToEdgeWrapping;
    orthoTex.wrapT = THREE.ClampToEdgeWrapping;
    orthoTex.generateMipmaps = true;
    orthoTex.minFilter = THREE.LinearMipmapLinearFilter;
    orthoTex.magFilter = THREE.LinearFilter;
    orthoTex.anisotropy = 16;
    orthoTex.colorSpace = THREE.SRGBColorSpace;

    const totalW = this.meta ? this.meta.total_width_m : 153629;
    const totalD = this.meta ? this.meta.total_depth_m : 136382;
    const centerX = this.meta ? this.meta.center_x : -8203;
    const centerZ = this.meta ? this.meta.center_z : -8938;

    // High fidelity terrain geometry (384 x 384)
    const segmentsX = 384;
    const segmentsZ = 384;
    const groundGeo = new THREE.PlaneGeometry(totalW, totalD, segmentsX, segmentsZ);
    groundGeo.rotateX(-Math.PI / 2);

    const pos = groundGeo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const localX = pos.getX(i);
      const localZ = pos.getZ(i);

      const worldX = localX + centerX;
      const worldZ = localZ + centerZ;

      const elev = this.getElevationAt(worldX, worldZ);
      pos.setY(i, elev);
    }
    groundGeo.computeVertexNormals();

    const groundMat = new THREE.MeshStandardMaterial({
      map: orthoTex,
      roughness: 0.85,
      metalness: 0.05,
    });

    this.groundMesh = new THREE.Mesh(groundGeo, groundMat);
    this.groundMesh.position.set(centerX, 0, centerZ);
    this.groundMesh.receiveShadow = true;
    parent.add(this.groundMesh);
  }

  buildOceanWater(parent) {
    // Shimmering coastal water plane (Matsushima Bay & Sendai Bay)
    const waterGeo = new THREE.PlaneGeometry(170000, 150000);
    waterGeo.rotateX(-Math.PI / 2);

    const waterMat = new THREE.MeshStandardMaterial({
      color: 0x0a243a,
      roughness: 0.12,
      metalness: 0.8,
      depthWrite: true,
    });

    const waterMesh = new THREE.Mesh(waterGeo, waterMat);
    waterMesh.position.set(-8000, 0.4, -8000);
    waterMesh.renderOrder = 0;
    parent.add(waterMesh);
  }

  buildAirfieldApron(parent) {
    // Matsushima Air Base Concrete Tarmac Apron (Length ~2,400m, Width ~800m)
    const apronMat = new THREE.MeshStandardMaterial({
      color: 0x24282e,
      roughness: 0.9,
      metalness: 0.1,
    });

    const apronGeo = new THREE.BoxGeometry(2600, 0.6, 900);
    const apronMesh = new THREE.Mesh(apronGeo, apronMat);
    apronMesh.position.set(100, 2.3, 350);
    parent.add(apronMesh);

    // Blue Impulse Flight Line Parking Spots (#1 to #6)
    const lineMat = new THREE.MeshBasicMaterial({ color: 0xffd700 }); // Yellow tarmac lines
    for (let i = 1; i <= 6; i++) {
      const spotBoxGeo = new THREE.PlaneGeometry(16, 20);
      spotBoxGeo.rotateX(-Math.PI / 2);
      const spot = new THREE.Mesh(spotBoxGeo, lineMat);
      spot.position.set(-300 + (i - 1) * 60, 2.7, 260);
      parent.add(spot);
    }
  }

  buildRunways(parent) {
    const rwyMat = new THREE.MeshStandardMaterial({
      color: 0x181c22,
      roughness: 0.8,
      metalness: 0.15,
    });

    const markingMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const yellowMat = new THREE.MeshBasicMaterial({ color: 0xffcc00 });

    // 1. Main Runway 07/25 (Length: 2,700m x Width: 45m, Heading: 068° / 248°)
    // Center at (0, 2.55, 0)
    const rad07 = (68.0 * Math.PI) / 180.0;
    const rwy07Geo = new THREE.BoxGeometry(45, 0.3, 2700);
    const rwy07Mesh = new THREE.Mesh(rwy07Geo, rwyMat);
    rwy07Mesh.rotation.y = -rad07;
    rwy07Mesh.position.set(0, 2.55, 0);
    parent.add(rwy07Mesh);

    const fwdX = Math.sin(rad07);
    const fwdZ = -Math.cos(rad07);
    const perpX = Math.cos(rad07);
    const perpZ = Math.sin(rad07);

    // Runway 07/25 Centerline Stripes
    const stripeGeo = new THREE.PlaneGeometry(1.8, 30);
    stripeGeo.rotateX(-Math.PI / 2);
    for (let i = -18; i <= 18; i++) {
      const stripe = new THREE.Mesh(stripeGeo, markingMat);
      stripe.rotation.y = -rad07;
      stripe.position.set(fwdX * (i * 65), 2.75, fwdZ * (i * 65));
      parent.add(stripe);
    }

    // Threshold Piano Keys (Runway 07 Threshold at -1250m, Runway 25 at +1250m)
    const keyGeo = new THREE.PlaneGeometry(1.6, 25);
    keyGeo.rotateX(-Math.PI / 2);
    [-1250, 1250].forEach((dist) => {
      for (let k = -5; k <= 5; k++) {
        if (k === 0) continue;
        const key = new THREE.Mesh(keyGeo, markingMat);
        key.rotation.y = -rad07;
        key.position.set(fwdX * dist + perpX * (k * 3.2), 2.75, fwdZ * dist + perpZ * (k * 3.2));
        parent.add(key);
      }
    });

    // 2. Secondary Cross Runway 15/33 (Length: 1,500m x Width: 45m, Heading: 150° / 330°)
    const rad15 = (150.0 * Math.PI) / 180.0;
    const rwy15Geo = new THREE.BoxGeometry(45, 0.3, 1500);
    const rwy15Mesh = new THREE.Mesh(rwy15Geo, rwyMat);
    rwy15Mesh.rotation.y = -rad15;
    rwy15Mesh.position.set(350, 2.56, -100);
    parent.add(rwy15Mesh);
  }

  buildBaseStructures(parent) {
    const hangarMat = new THREE.MeshStandardMaterial({
      color: 0x5a6878,
      roughness: 0.6,
      metalness: 0.4,
    });
    const blueTrimMat = new THREE.MeshStandardMaterial({
      color: 0x003f9e,
      roughness: 0.3,
      metalness: 0.3,
    });
    const glassMat = new THREE.MeshStandardMaterial({
      color: 0x113355,
      roughness: 0.15,
      metalness: 0.85,
    });

    // 1. Blue Impulse 11th Squadron Main Hangars (第11飛行隊格納庫 - Apron Rear)
    for (let h = 0; h < 3; h++) {
      const hangarGroup = new THREE.Group();
      const hangarGeo = new THREE.BoxGeometry(90, 18, 60);
      const hangarMesh = new THREE.Mesh(hangarGeo, hangarMat);

      // Curved barrel roof
      const roofGeo = new THREE.CylinderGeometry(30, 30, 90, 16, 1, false, 0, Math.PI);
      roofGeo.rotateZ(Math.PI / 2);
      const roofMesh = new THREE.Mesh(roofGeo, blueTrimMat);
      roofMesh.position.set(0, 9, 0);

      hangarGroup.add(hangarMesh, roofMesh);
      hangarGroup.position.set(-500 + h * 160, 11.5, 580);
      parent.add(hangarGroup);
    }

    // 2. Matsushima Air Base Control Tower (松島基地 管制塔: Height ~45m)
    const towerGroup = new THREE.Group();
    towerGroup.position.set(220, 2.5, 420);

    const shaftGeo = new THREE.BoxGeometry(16, 38, 16);
    const shaftMesh = new THREE.Mesh(shaftGeo, hangarMat);
    shaftMesh.position.set(0, 19, 0);

    const cabGeo = new THREE.CylinderGeometry(14, 10, 8, 12);
    const cabMesh = new THREE.Mesh(cabGeo, glassMat);
    cabMesh.position.set(0, 42, 0);

    // Radar Dome (Radome on roof)
    const radomeGeo = new THREE.SphereGeometry(4.5, 16, 16);
    const radomeMat = new THREE.MeshStandardMaterial({ color: 0xeeeeee, roughness: 0.2 });
    const radome = new THREE.Mesh(radomeGeo, radomeMat);
    radome.position.set(0, 50, 0);

    towerGroup.add(shaftMesh, cabMesh, radome);
    parent.add(towerGroup);

    // 3. Airshow Spectator Grandstands & Flight Line Fence
    const grandstandMat = new THREE.MeshStandardMaterial({ color: 0x334455, roughness: 0.7 });
    const grandstandGeo = new THREE.BoxGeometry(450, 6, 40);
    const grandstand = new THREE.Mesh(grandstandGeo, grandstandMat);
    grandstand.position.set(-100, 5.5, 380);
    parent.add(grandstand);
  }

  buildAirfieldLights(parent) {
    const rad07 = (68.0 * Math.PI) / 180.0;
    const fwdX = Math.sin(rad07);
    const fwdZ = -Math.cos(rad07);
    const perpX = Math.cos(rad07);
    const perpZ = Math.sin(rad07);

    const alsGeo = new THREE.SphereGeometry(0.9, 8, 8);
    const whiteLightMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const greenLightMat = new THREE.MeshBasicMaterial({ color: 0x00ff44 });
    const redLightMat = new THREE.MeshBasicMaterial({ color: 0xff0022 });

    // 1. Runway 07 Approach Light System (ALS) extending 700m west
    for (let d = 60; d <= 700; d += 40) {
      const light = new THREE.Mesh(alsGeo, whiteLightMat);
      light.position.set(fwdX * (-1350 - d), 3.0, fwdZ * (-1350 - d));
      parent.add(light);
    }

    // 2. Threshold Lights (Green)
    for (let k = -6; k <= 6; k++) {
      const g07 = new THREE.Mesh(alsGeo, greenLightMat);
      g07.position.set(fwdX * -1350 + perpX * (k * 3.2), 3.0, fwdZ * -1350 + perpZ * (k * 3.2));
      parent.add(g07);

      const g25 = new THREE.Mesh(alsGeo, greenLightMat);
      g25.position.set(fwdX * 1350 + perpX * (k * 3.2), 3.0, fwdZ * 1350 + perpZ * (k * 3.2));
      parent.add(g25);
    }

    // 3. PAPI Lights (Runway 07 left side at -1000m)
    const papiOffset = -1000;
    for (let p = 0; p < 4; p++) {
      const papiLight = new THREE.Mesh(alsGeo, whiteLightMat);
      const px = fwdX * papiOffset - perpX * (32 + p * 6);
      const pz = fwdZ * papiOffset - perpZ * (32 + p * 6);
      papiLight.position.set(px, 3.2, pz);
      parent.add(papiLight);
    }

    // 4. Runway Edge Lights along 2,700m
    for (let d = -1350; d <= 1350; d += 60) {
      const l1 = new THREE.Mesh(alsGeo, whiteLightMat);
      l1.position.set(fwdX * d + perpX * 24, 2.9, fwdZ * d + perpZ * 24);
      parent.add(l1);

      const l2 = new THREE.Mesh(alsGeo, whiteLightMat);
      l2.position.set(fwdX * d - perpX * 24, 2.9, fwdZ * d - perpZ * 24);
      parent.add(l2);
    }
  }
}
