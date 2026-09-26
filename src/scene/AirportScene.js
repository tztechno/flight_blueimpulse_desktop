/**
 * AirportScene.js
 * Master 3D scene builder and orchestrator for Matsushima Air Base (RJST).
 * Manages Three.js WebGLRenderer, dynamic sky & lighting presets (Day, Sunset, Airshow, Night),
 * TerrainGenerator, FormationManager, and SmokeSystem.
 */

import * as THREE from 'three';
import { TerrainGenerator } from './TerrainGenerator.js';
import { FormationManager } from './FormationManager.js';
import { SmokeSystem } from './SmokeSystem.js';

export class AirportScene {
  constructor(container) {
    this.container = container;
    this.scene = new THREE.Scene();
    this.environmentMode = 'day';

    this.initRenderer();
    this.initLighting();
    this.initEnvironment();

    // 1. Aerobatic Smoke Particle System
    this.smokeSystem = new SmokeSystem(this.scene, 6);

    // 2. Terrain & Matsushima Air Base
    this.terrain = new TerrainGenerator(this.scene);
    this.terrain.build();

    // 3. Blue Impulse Formation Manager (1 to 6 planes)
    this.formationManager = new FormationManager(this.scene, this.smokeSystem);
  }

  initRenderer() {
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: 'high-performance',
      logarithmicDepthBuffer: true,
    });
    this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.15;

    this.container.appendChild(this.renderer.domElement);
  }

  initLighting() {
    this.hemiLight = new THREE.HemisphereLight(0xffffff, 0x445566, 1.1);
    this.scene.add(this.hemiLight);

    this.sunLight = new THREE.DirectionalLight(0xfffaed, 2.2);
    this.sunLight.position.set(-15000, 18000, -12000);
    this.sunLight.castShadow = true;
    this.sunLight.shadow.mapSize.width = 2048;
    this.sunLight.shadow.mapSize.height = 2048;
    this.sunLight.shadow.camera.near = 500;
    this.sunLight.shadow.camera.far = 60000;
    const d = 10000;
    this.sunLight.shadow.camera.left = -d;
    this.sunLight.shadow.camera.right = d;
    this.sunLight.shadow.camera.top = d;
    this.sunLight.shadow.camera.bottom = -d;
    this.scene.add(this.sunLight);

    this.ambientLight = new THREE.AmbientLight(0x223344, 0.4);
    this.scene.add(this.ambientLight);
  }

  initEnvironment() {
    this.setEnvironmentMode('day');
  }

  setEnvironmentMode(mode) {
    this.environmentMode = mode;
    if (mode === 'day') {
      // Crisp Blue Sky over Matsushima Bay & Miyagi Coast
      this.scene.background = new THREE.Color(0x6eb4e8);
      this.scene.fog = new THREE.FogExp2(0x8bc4ee, 0.000009);

      this.hemiLight.color.setHex(0xffffff);
      this.hemiLight.groundColor.setHex(0x556677);
      this.hemiLight.intensity = 1.1;

      this.sunLight.color.setHex(0xfffaed);
      this.sunLight.position.set(-12000, 18000, -10000);
      this.sunLight.intensity = 2.2;
      this.renderer.toneMappingExposure = 1.1;

    } else if (mode === 'sunset') {
      // Golden Hour Twilight over Mount Zao & Matsushima Bay
      this.scene.background = new THREE.Color(0xf47c42);
      this.scene.fog = new THREE.FogExp2(0xf08050, 0.000012);

      this.hemiLight.color.setHex(0xffaa77);
      this.hemiLight.groundColor.setHex(0x332211);
      this.hemiLight.intensity = 1.2;

      this.sunLight.color.setHex(0xff7733);
      this.sunLight.position.set(-25000, 4500, -18000);
      this.sunLight.intensity = 2.5;
      this.renderer.toneMappingExposure = 1.2;

    } else if (mode === 'airshow') {
      // High-contrast Airshow Atmosphere for Maximum White Smoke Pop
      this.scene.background = new THREE.Color(0x4a9cd6);
      this.scene.fog = new THREE.FogExp2(0x6caede, 0.000007);

      this.hemiLight.color.setHex(0xffffff);
      this.hemiLight.groundColor.setHex(0x334455);
      this.hemiLight.intensity = 1.25;

      this.sunLight.color.setHex(0xffffff);
      this.sunLight.position.set(0, 22000, 0);
      this.sunLight.intensity = 2.4;
      this.renderer.toneMappingExposure = 1.18;

    } else if (mode === 'night') {
      // Matsushima Airfield Night Operations & Strobe Glow
      this.scene.background = new THREE.Color(0x060c18);
      this.scene.fog = new THREE.FogExp2(0x081224, 0.000018);

      this.hemiLight.color.setHex(0x112233);
      this.hemiLight.groundColor.setHex(0x050810);
      this.hemiLight.intensity = 0.3;

      this.sunLight.color.setHex(0x223355);
      this.sunLight.position.set(5000, 10000, 5000);
      this.sunLight.intensity = 0.25;
      this.renderer.toneMappingExposure = 1.45;
    }
  }

  update(dt, leaderState, customOffsets = null, individualPlaneStates = null, camera = null) {
    // 1. Update smoke particles
    this.smokeSystem.update(dt);

    // 2. Update aircraft formation
    this.formationManager.update(dt, leaderState, customOffsets, individualPlaneStates, camera);
  }

  render(camera) {
    this.renderer.render(this.scene, camera);
  }

  resize(width, height) {
    this.renderer.setSize(width, height);
    if (this.smokeSystem) {
      this.smokeSystem.updateViewport(width, height);
    }
  }
}
