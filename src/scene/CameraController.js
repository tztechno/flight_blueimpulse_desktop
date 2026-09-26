/**
 * CameraController.js
 * Multi-camera management supporting any of the 5 cockpit views,
 * 5-ship global spectator view, chase cam, wing cam, tower cam, ground spectator, and 360° orbit.
 */

import * as THREE from 'three';

export class CameraController {
  constructor(domElement) {
    this.domElement = domElement;
    this.mode = 'formation_global'; // 'formation_global', 'cockpit_1'...'cockpit_5', 'chase', 'wing', 'tower', 'ground', 'orbit'
    this.activePlaneIndex = 0; // 0 to 4 (#1 to #5)

    this.camera = new THREE.PerspectiveCamera(58, window.innerWidth / window.innerHeight, 1.0, 250000);
    this.currentPos = new THREE.Vector3(0, 100, 250);
    this.currentTarget = new THREE.Vector3(0, 30, 0);

    // Free Head Look inside Cockpit
    this.cockpitYaw = 0.0;
    this.cockpitPitch = 0.0;

    // Orbit state
    this.isDragging = false;
    this.prevMouse = { x: 0, y: 0 };
    this.orbitTheta = 0.0;
    this.orbitPhi = Math.PI / 3.5;
    this.orbitRadius = 120.0;

    this.initMouseListeners();
  }

  setMode(mode, targetIndex = null) {
    this.mode = mode;
    this.cockpitYaw = 0.0;
    this.cockpitPitch = 0.0;

    if (mode === 'cockpit_1') this.activePlaneIndex = 0;
    else if (mode === 'cockpit_2') this.activePlaneIndex = 1;
    else if (mode === 'cockpit_3') this.activePlaneIndex = 2;
    else if (mode === 'cockpit_4') this.activePlaneIndex = 3;
    else if (mode === 'cockpit_5') this.activePlaneIndex = 4;
    else if (targetIndex !== null) {
      this.activePlaneIndex = targetIndex;
    }
  }

  initMouseListeners() {
    if (!this.domElement) return;

    this.domElement.addEventListener('mousedown', (e) => {
      this.isDragging = true;
      this.prevMouse = { x: e.clientX, y: e.clientY };
    });

    window.addEventListener('mouseup', () => {
      this.isDragging = false;
    });

    window.addEventListener('mousemove', (e) => {
      if (!this.isDragging) return;
      const dx = e.clientX - this.prevMouse.x;
      const dy = e.clientY - this.prevMouse.y;
      this.prevMouse = { x: e.clientX, y: e.clientY };

      if (this.mode.startsWith('cockpit')) {
        // Cockpit Free Head Look (Glance left/right at wingmen)
        this.cockpitYaw -= dx * 0.004;
        this.cockpitPitch = Math.max(-Math.PI / 3.5, Math.min(Math.PI / 3.5, this.cockpitPitch - dy * 0.004));
      } else if (this.mode === 'orbit') {
        this.orbitTheta -= dx * 0.005;
        this.orbitPhi = Math.max(0.05, Math.min(Math.PI / 2 - 0.05, this.orbitPhi + dy * 0.005));
      }
    });

    this.domElement.addEventListener('wheel', (e) => {
      if (this.mode === 'orbit') {
        this.orbitRadius = Math.max(20.0, Math.min(800.0, this.orbitRadius + e.deltaY * 0.15));
      }
    });
  }

  update(formationManager, overrideIndex = null) {
    if (!formationManager) return;

    let targetIdx = this.activePlaneIndex;
    if (overrideIndex !== null && overrideIndex !== undefined) {
      targetIdx = overrideIndex;
    } else if (this.mode === 'cockpit_1') targetIdx = 0;
    else if (this.mode === 'cockpit_2') targetIdx = 1;
    else if (this.mode === 'cockpit_3') targetIdx = 2;
    else if (this.mode === 'cockpit_4') targetIdx = 3;
    else if (this.mode === 'cockpit_5') targetIdx = 4;

    const leader = formationManager.getLeader();
    const targetPlane = formationManager.getPlane(targetIdx) || leader;

    const pos = targetPlane.mesh.position;
    const quat = targetPlane.mesh.quaternion;

    const fwd = new THREE.Vector3(0, 0, -1).applyQuaternion(quat);
    const up = new THREE.Vector3(0, 1, 0).applyQuaternion(quat);
    const right = new THREE.Vector3(1, 0, 0).applyQuaternion(quat);

    let targetCamPos = new THREE.Vector3();
    let targetLookAt = new THREE.Vector3();

    if (this.mode === 'formation_global') {
      // 5-Ship Global Spectator Cam: High behind the formation
      targetCamPos.copy(leader.mesh.position)
        .addScaledVector(fwd, -110.0)
        .addScaledVector(up, 38.0);
      targetLookAt.copy(leader.mesh.position).addScaledVector(fwd, 40.0);
      this.camera.fov = 62;

    } else if (this.mode.startsWith('cockpit')) {
      // Cockpit FPV inside selected plane (#1 to #5)
      const eyeOffset = new THREE.Vector3(0, 0.48, -3.2).applyQuaternion(quat);
      targetCamPos.copy(pos).add(eyeOffset);

      // Apply pilot head look rotation
      const lookDir = fwd.clone()
        .applyAxisAngle(up, this.cockpitYaw)
        .applyAxisAngle(right, this.cockpitPitch);
      targetLookAt.copy(targetCamPos).addScaledVector(lookDir, 200.0);
      this.camera.fov = 65;

    } else if (this.mode === 'chase') {
      // Dynamic Third-Person Chase Cam behind selected plane
      targetCamPos.copy(pos).addScaledVector(fwd, -42.0).addScaledVector(up, 11.5);
      targetLookAt.copy(pos).addScaledVector(fwd, 35.0);
      this.camera.fov = 58;

    } else if (this.mode === 'wing') {
      // Wingtip Camera looking across at Wingmen
      const wingOffset = new THREE.Vector3(5.2, 0.3, 0.8).applyQuaternion(quat);
      targetCamPos.copy(pos).add(wingOffset);
      targetLookAt.copy(pos).addScaledVector(fwd, 40.0).addScaledVector(right, -12.0);
      this.camera.fov = 52;

    } else if (this.mode === 'tower') {
      // Matsushima Air Base Control Tower Observation Deck (x: 220, y: 58.0, z: 390 - Clear Panoramas)
      targetCamPos.set(220, 58.0, 390);
      targetLookAt.copy(leader.mesh.position);
      const dist = targetCamPos.distanceTo(leader.mesh.position);
      const targetFov = Math.max(18, Math.min(52, dist / 80.0));
      this.camera.fov = THREE.MathUtils.lerp(this.camera.fov, targetFov, 0.06);

    } else if (this.mode === 'ground') {
      // Matsushima Airshow Flight Line Grandstand (x: -100, y: 6.5, z: 380)
      targetCamPos.set(-100, 6.5, 380);
      targetLookAt.copy(leader.mesh.position);
      const dist = targetCamPos.distanceTo(leader.mesh.position);
      const targetFov = Math.max(18, Math.min(58, dist / 70.0));
      this.camera.fov = THREE.MathUtils.lerp(this.camera.fov, targetFov, 0.06);

    } else if (this.mode === 'orbit') {
      // 360° Spherical Orbit Cam centered on selected aircraft or formation
      const ox = this.orbitRadius * Math.sin(this.orbitPhi) * Math.sin(this.orbitTheta);
      const oy = this.orbitRadius * Math.cos(this.orbitPhi);
      const oz = this.orbitRadius * Math.sin(this.orbitPhi) * Math.cos(this.orbitTheta);

      targetCamPos.copy(pos).add(new THREE.Vector3(ox, oy, oz));
      targetLookAt.copy(pos);
      this.camera.fov = THREE.MathUtils.lerp(this.camera.fov, 58, 0.1);
    }

    // Smooth camera damping
    const lerpFactor = this.mode.startsWith('cockpit') ? 0.92 : (this.mode === 'tower' || this.mode === 'ground' ? 0.10 : 0.16);
    this.currentPos.lerp(targetCamPos, lerpFactor);
    this.currentTarget.lerp(targetLookAt, lerpFactor);

    this.camera.position.copy(this.currentPos);
    this.camera.lookAt(this.currentTarget);
    this.camera.updateProjectionMatrix();
  }

  resize(width, height) {
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
  }
}
