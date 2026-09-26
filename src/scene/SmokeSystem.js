/**
 * SmokeSystem.js
 * High-performance 3D Aerobatic Smoke Particle & Ribbon System.
 * Renders soft, billowing translucent white smoke trails emitted by Blue Impulse aircraft.
 * Supports Logarithmic Depth Buffer chunk integration to render seamlessly over ground and sky,
 * realistic expansion, adjustable density / opacity, and high visual realism.
 */

import * as THREE from 'three';

export class SmokeSystem {
  constructor(scene, maxPlanes = 6) {
    this.scene = scene;
    this.maxPlanes = maxPlanes;
    this.activeCount = 5;
    this.enabled = true;
    this.density = 0.45; // Default soft translucent density (0.1 to 1.0)
    this.colorMode = 'white';

    // Particle buffer configuration (24,000 total particles)
    this.maxParticles = 24000;
    this.particlesPerPlane = Math.floor(this.maxParticles / maxPlanes);
    this.particleData = [];

    // WebGL Points attributes
    this.geometry = new THREE.BufferGeometry();
    this.positions = new Float32Array(this.maxParticles * 3);
    this.colors = new Float32Array(this.maxParticles * 3);
    this.sizes = new Float32Array(this.maxParticles);
    this.opacities = new Float32Array(this.maxParticles);

    // Initialize all particles below world ground
    for (let i = 0; i < this.maxParticles; i++) {
      this.positions[i * 3] = 0;
      this.positions[i * 3 + 1] = -10000;
      this.positions[i * 3 + 2] = 0;

      this.colors[i * 3] = 0.98;
      this.colors[i * 3 + 1] = 0.99;
      this.colors[i * 3 + 2] = 1.0;

      this.sizes[i] = 0.0;
      this.opacities[i] = 0.0;

      this.particleData.push({
        active: false,
        age: 0,
        maxLife: 13.0, // seconds smoke remains visible in sky
        initialSize: 4.8,
        finalSize: 42.0,
        velocity: new THREE.Vector3(),
      });
    }

    this.geometry.setAttribute('position', new THREE.BufferAttribute(this.positions, 3));
    this.geometry.setAttribute('customColor', new THREE.BufferAttribute(this.colors, 3));
    this.geometry.setAttribute('size', new THREE.BufferAttribute(this.sizes, 1));
    this.geometry.setAttribute('opacity', new THREE.BufferAttribute(this.opacities, 1));

    // Custom shader material with full Logarithmic Depth Buffer support
    const smokeTexture = this.createSmokeTexture();
    this.material = new THREE.ShaderMaterial({
      uniforms: {
        pointTexture: { value: smokeTexture },
        pointScale: { value: 850.0 },
      },
      vertexShader: `
        #include <common>
        #include <logdepthbuf_pars_vertex>

        attribute float size;
        attribute float opacity;
        attribute vec3 customColor;
        uniform float pointScale;
        varying vec3 vColor;
        varying float vOpacity;

        void main() {
          vColor = customColor;
          vOpacity = opacity;
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          float depth = max(1.0, -mvPosition.z);
          // Scale smoothly with distance while ensuring visibility across large terrain distances
          gl_PointSize = clamp(size * (pointScale / depth), 2.5, 340.0);
          gl_Position = projectionMatrix * mvPosition;

          #include <logdepthbuf_vertex>
        }
      `,
      fragmentShader: `
        #include <common>
        #include <logdepthbuf_pars_fragment>

        uniform sampler2D pointTexture;
        varying vec3 vColor;
        varying float vOpacity;

        void main() {
          #include <logdepthbuf_fragment>

          vec4 tex = texture2D(pointTexture, gl_PointCoord);
          if (tex.a < 0.008) discard;

          // Soft translucent smoke alpha
          float finalAlpha = tex.a * vOpacity;
          gl_FragColor = vec4(vColor, finalAlpha);
        }
      `,
      blending: THREE.NormalBlending,
      depthTest: true,
      depthWrite: false,
      transparent: true,
    });

    this.points = new THREE.Points(this.geometry, this.material);
    this.points.frustumCulled = false;
    this.points.renderOrder = 100; // Render on top of terrain and water surfaces
    this.scene.add(this.points);

    this.emitPointers = new Array(maxPlanes).fill(0);
    this.lastNozzlePositions = Array.from({ length: maxPlanes }, () => [null, null]);
  }

  createSmokeTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');

    // Soft Gaussian-like billowing radial gradient (avoiding solid plastic core)
    const grad = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
    grad.addColorStop(0, 'rgba(255, 255, 255, 0.65)');
    grad.addColorStop(0.25, 'rgba(255, 255, 255, 0.48)');
    grad.addColorStop(0.55, 'rgba(252, 253, 255, 0.22)');
    grad.addColorStop(0.8, 'rgba(245, 248, 255, 0.07)');
    grad.addColorStop(1.0, 'rgba(240, 245, 255, 0.0)');

    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 128, 128);

    const texture = new THREE.CanvasTexture(canvas);
    texture.generateMipmaps = true;
    texture.minFilter = THREE.LinearMipmapLinearFilter;
    return texture;
  }

  setActiveCount(count) {
    this.activeCount = Math.max(1, count);
  }

  setDensity(density) {
    this.density = Math.max(0.05, Math.min(1.0, density));
  }

  setColorMode(mode) {
    this.colorMode = mode || 'white';
  }

  toggleSmoke(forceState) {
    if (forceState !== undefined) {
      this.enabled = forceState;
    } else {
      this.enabled = !this.enabled;
    }
    return this.enabled;
  }

  getPlaneSmokeColor(planeIdx, nozzleIdx = 0) {
    // Pure authentic Blue Impulse white smoke with subtle natural sky tint
    return [0.98, 0.99, 1.0];
  }

  emit(planeIdx, nozzlePositions, velocityVec) {
    if (!this.enabled || !nozzlePositions || nozzlePositions.length === 0) {
      if (this.lastNozzlePositions[planeIdx]) {
        this.lastNozzlePositions[planeIdx] = [null, null];
      }
      return;
    }

    const baseOffset = planeIdx * this.particlesPerPlane;

    nozzlePositions.forEach((currentPos, nozzleIdx) => {
      const lastPos = this.lastNozzlePositions[planeIdx][nozzleIdx];
      let steps = 1;

      // Interpolate sub-steps to form smooth continuous smoke trail
      if (lastPos) {
        const dist = currentPos.distanceTo(lastPos);
        if (dist > 0.8 && dist < 45.0) {
          steps = Math.min(6, Math.max(1, Math.ceil(dist / 1.2)));
        }
      }

      for (let s = 1; s <= steps; s++) {
        const t = s / steps;
        const interpX = lastPos ? lastPos.x + (currentPos.x - lastPos.x) * t : currentPos.x;
        const interpY = lastPos ? lastPos.y + (currentPos.y - lastPos.y) * t : currentPos.y;
        const interpZ = lastPos ? lastPos.z + (currentPos.z - lastPos.z) * t : currentPos.z;

        const idx = baseOffset + this.emitPointers[planeIdx];
        this.emitPointers[planeIdx] = (this.emitPointers[planeIdx] + 1) % this.particlesPerPlane;

        const pData = this.particleData[idx];
        pData.active = true;
        pData.age = 0;
        pData.maxLife = 12.5;
        pData.initialSize = 4.5;
        pData.finalSize = 40.0;

        // Slight natural aerodynamic dispersion
        const spread = 0.32;
        pData.velocity.copy(velocityVec ? velocityVec.clone().multiplyScalar(-0.015) : new THREE.Vector3());
        pData.velocity.x += (Math.random() - 0.5) * spread;
        pData.velocity.y += (Math.random() - 0.5) * spread + 0.1; // gentle thermal buoyancy
        pData.velocity.z += (Math.random() - 0.5) * spread;

        this.positions[idx * 3] = interpX + (Math.random() - 0.5) * 0.25;
        this.positions[idx * 3 + 1] = interpY + (Math.random() - 0.5) * 0.25;
        this.positions[idx * 3 + 2] = interpZ + (Math.random() - 0.5) * 0.25;

        const colorRGB = this.getPlaneSmokeColor(planeIdx, nozzleIdx);
        this.colors[idx * 3] = colorRGB[0];
        this.colors[idx * 3 + 1] = colorRGB[1];
        this.colors[idx * 3 + 2] = colorRGB[2];

        this.sizes[idx] = pData.initialSize;
        this.opacities[idx] = this.density;
      }

      if (!this.lastNozzlePositions[planeIdx][nozzleIdx]) {
        this.lastNozzlePositions[planeIdx][nozzleIdx] = new THREE.Vector3();
      }
      this.lastNozzlePositions[planeIdx][nozzleIdx].copy(currentPos);
    });
  }

  update(dt) {
    dt = Math.max(0.001, Math.min(dt, 0.1));

    const posAttr = this.geometry.attributes.position;
    const colorAttr = this.geometry.attributes.customColor;
    const sizeAttr = this.geometry.attributes.size;
    const opacAttr = this.geometry.attributes.opacity;

    const currentDensity = this.density;

    for (let i = 0; i < this.maxParticles; i++) {
      const pData = this.particleData[i];
      if (!pData.active) continue;

      pData.age += dt;
      if (pData.age >= pData.maxLife) {
        pData.active = false;
        this.positions[i * 3 + 1] = -10000;
        this.opacities[i] = 0.0;
        this.sizes[i] = 0.0;
        continue;
      }

      const progress = pData.age / pData.maxLife;

      // Position update with velocity
      this.positions[i * 3] += pData.velocity.x * dt;
      this.positions[i * 3 + 1] += pData.velocity.y * dt;
      this.positions[i * 3 + 2] += pData.velocity.z * dt;

      // Smoke puff expands smoothly over time
      const expansion = Math.sqrt(progress);
      this.sizes[i] = pData.initialSize + (pData.finalSize - pData.initialSize) * expansion;

      // Smooth realistic dissipation curve matching density
      if (progress < 0.25) {
        // Initial soft bloom
        this.opacities[i] = currentDensity * (0.6 + 0.4 * (progress / 0.25));
      } else {
        // Graceful exponential dissipation
        const fade = (1.0 - progress) / 0.75;
        this.opacities[i] = currentDensity * Math.pow(fade, 1.4);
      }
    }

    posAttr.needsUpdate = true;
    colorAttr.needsUpdate = true;
    sizeAttr.needsUpdate = true;
    opacAttr.needsUpdate = true;
  }

  updateViewport(width, height) {
    if (this.material && this.material.uniforms && this.material.uniforms.pointScale) {
      this.material.uniforms.pointScale.value = Math.max(600.0, height * 0.95);
    }
  }

  clear() {
    for (let i = 0; i < this.maxParticles; i++) {
      this.particleData[i].active = false;
      this.positions[i * 3 + 1] = -10000;
      this.opacities[i] = 0.0;
      this.sizes[i] = 0.0;
    }
    this.lastNozzlePositions.forEach(planeNozzles => {
      planeNozzles[0] = null;
      planeNozzles[1] = null;
    });
    this.geometry.attributes.position.needsUpdate = true;
    this.geometry.attributes.customColor.needsUpdate = true;
    this.geometry.attributes.opacity.needsUpdate = true;
    this.geometry.attributes.size.needsUpdate = true;
  }
}
