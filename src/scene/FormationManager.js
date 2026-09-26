/**
 * FormationManager.js
 * Manages 1 to 5 (or 6) Blue Impulse aircraft, formation geometries,
 * relative positioning, dynamic formation transitions (morphing), individual flight trajectories,
 * and smoke emission.
 */

import * as THREE from 'three';
import { AircraftModel } from './AircraftModel.js';

export const FORMATIONS = {
  delta: {
    id: 'delta',
    nameJa: 'デルタ (Delta)',
    nameEn: 'Delta Formation',
    offsets: [
      new THREE.Vector3(0, 0, 0),        // #1 Lead
      new THREE.Vector3(-16, 0, 16),     // #2 Left
      new THREE.Vector3(16, 0, 16),      // #3 Right
      new THREE.Vector3(-32, 0, 32),     // #4 Outer Left
      new THREE.Vector3(32, 0, 32),      // #5 Outer Right
      new THREE.Vector3(0, -2, 48),      // #6 Trail
    ],
  },
  diamond: {
    id: 'diamond',
    nameJa: 'ダイヤモンド (Diamond)',
    nameEn: 'Diamond Formation',
    offsets: [
      new THREE.Vector3(0, 0, 0),        // #1 Lead
      new THREE.Vector3(-18, 0, 18),     // #2 Left Wing
      new THREE.Vector3(18, 0, 18),      // #3 Right Wing
      new THREE.Vector3(0, -2, 36),      // #4 Slot
      new THREE.Vector3(0, 4, 54),       // #5 Solo Trail
      new THREE.Vector3(0, -4, 72),      // #6
    ],
  },
  arrowhead: {
    id: 'arrowhead',
    nameJa: 'アローヘッド (Swan)',
    nameEn: 'Arrowhead Formation',
    offsets: [
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(-15, 0, 14),
      new THREE.Vector3(15, 0, 14),
      new THREE.Vector3(-30, 0, 28),
      new THREE.Vector3(30, 0, 28),
      new THREE.Vector3(0, 0, 42),
    ],
  },
  trail: {
    id: 'trail',
    nameJa: 'トレイル (Trail 縦列)',
    nameEn: 'Trail Formation',
    offsets: [
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(0, -1.8, 22),
      new THREE.Vector3(0, -3.6, 44),
      new THREE.Vector3(0, -5.4, 66),
      new THREE.Vector3(0, -7.2, 88),
      new THREE.Vector3(0, -9.0, 110),
    ],
  },
  echelon: {
    id: 'echelon',
    nameJa: 'エシュロン (Echelon 斜列)',
    nameEn: 'Echelon Right',
    offsets: [
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(18, -0.8, 16),
      new THREE.Vector3(36, -1.6, 32),
      new THREE.Vector3(54, -2.4, 48),
      new THREE.Vector3(72, -3.2, 64),
      new THREE.Vector3(90, -4.0, 80),
    ],
  },
  line: {
    id: 'line',
    nameJa: 'ライン・アブレスト (Line 横列)',
    nameEn: 'Line Abreast',
    offsets: [
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(-22, 0, 0),
      new THREE.Vector3(22, 0, 0),
      new THREE.Vector3(-44, 0, 0),
      new THREE.Vector3(44, 0, 0),
      new THREE.Vector3(0, -2, 22),
    ],
  },
};

export class FormationManager {
  constructor(scene, smokeSystem) {
    this.scene = scene;
    this.smokeSystem = smokeSystem;
    this.planes = [];
    this.activeCount = 5; // default 5 aircraft (1 or 5 supported)
    this.currentFormationId = 'diamond';
    this.targetFormationId = 'diamond';
    this.formationLerp = 1.0;
    this.transitionSpeed = 0.25; // default 4-second morphing transition

    this.group = new THREE.Group();
    this.group.name = 'FormationGroup';
    this.scene.add(this.group);

    this.playerPlaneIndex = -1;
    this.playerLivery = 'gold';
    this.showPlayerMarker = true;

    this.initPlanes(6);
    this.setCount(5);
  }

  initPlanes(maxCount = 6) {
    for (let i = 1; i <= maxCount; i++) {
      const plane = new AircraftModel(i);
      this.planes.push(plane);
      this.group.add(plane.mesh);
    }
  }

  setCount(count) {
    this.activeCount = Math.max(1, Math.min(6, count));
    if (this.smokeSystem) {
      this.smokeSystem.setActiveCount(this.activeCount);
    }
    this.planes.forEach((p, idx) => {
      p.mesh.visible = idx < this.activeCount;
    });
  }

  setPlayerPlane(playerIndex, liveryId = 'gold', showMarker = true) {
    this.playerPlaneIndex = playerIndex;
    this.playerLivery = liveryId;
    this.showPlayerMarker = showMarker;

    this.planes.forEach((plane, idx) => {
      const isPlayer = idx === playerIndex;
      plane.setPlayerStatus(isPlayer, isPlayer ? liveryId : 'standard', showMarker);
    });
  }

  setFormation(formationId, transitionDuration = 4.0) {
    if (FORMATIONS[formationId] && formationId !== this.targetFormationId) {
      this.currentFormationId = this.targetFormationId;
      this.targetFormationId = formationId;
      this.formationLerp = 0.0;
      this.transitionSpeed = 1.0 / Math.max(0.5, transitionDuration);
    }
  }

  checkPlayerCollision(playerIndex) {
    if (playerIndex < 0 || playerIndex >= this.activeCount) return null;

    const playerPlane = this.planes[playerIndex];
    if (!playerPlane || !playerPlane.mesh.visible) return null;

    const playerPos = playerPlane.mesh.position;

    let closestDist = Infinity;
    let closestIndex = -1;

    for (let i = 0; i < this.activeCount; i++) {
      if (i === playerIndex) continue;
      const otherPlane = this.planes[i];
      if (!otherPlane || !otherPlane.mesh.visible) continue;

      const otherPos = otherPlane.mesh.position;
      const dist = playerPos.distanceTo(otherPos);

      if (dist < closestDist) {
        closestDist = dist;
        closestIndex = i;
      }

      // Mid-Air collision distance threshold: 6.5 meters
      const collisionThreshold = 6.5;

      if (dist < collisionThreshold) {
        return {
          collided: true,
          otherIndex: i,
          otherAircraftNumber: i + 1,
          otherPosition: otherPos.clone(),
          playerPosition: playerPos.clone(),
          distance: dist,
          threshold: collisionThreshold,
        };
      }
    }

    return {
      collided: false,
      closestIndex,
      closestAircraftNumber: closestIndex >= 0 ? closestIndex + 1 : null,
      closestDistance: closestDist,
      isNearMiss: closestDist < 14.0,
    };
  }

  checkAllPlanesCollision() {
    if (this.activeCount <= 1) return null;

    let closestDist = Infinity;
    let planeAIndex = -1;
    let planeBIndex = -1;
    const collisionThreshold = 6.5;

    for (let i = 0; i < this.activeCount; i++) {
      const planeA = this.planes[i];
      if (!planeA || !planeA.mesh.visible) continue;
      const posA = planeA.mesh.position;

      for (let j = i + 1; j < this.activeCount; j++) {
        const planeB = this.planes[j];
        if (!planeB || !planeB.mesh.visible) continue;
        const posB = planeB.mesh.position;

        const dist = posA.distanceTo(posB);
        if (dist < closestDist) {
          closestDist = dist;
          planeAIndex = i;
          planeBIndex = j;
        }

        if (dist < collisionThreshold) {
          return {
            collided: true,
            planeAIndex: i,
            planeBIndex: j,
            planeANumber: i + 1,
            planeBNumber: j + 1,
            posA: posA.clone(),
            posB: posB.clone(),
            distance: dist,
            threshold: collisionThreshold,
          };
        }
      }
    }

    return {
      collided: false,
      planeAIndex,
      planeBIndex,
      planeANumber: planeAIndex >= 0 ? planeAIndex + 1 : null,
      planeBNumber: planeBIndex >= 0 ? planeBIndex + 1 : null,
      closestDistance: closestDist,
      isNearMiss: closestDist < 14.0,
    };
  }

  update(dt, leaderState, customOffsets = null, individualPlaneStates = null, camera = null) {
    dt = Math.max(0.001, Math.min(dt, 0.1));

    if (this.formationLerp < 1.0) {
      this.formationLerp = Math.min(1.0, this.formationLerp + dt * this.transitionSpeed);
    }

    const currForm = FORMATIONS[this.currentFormationId] || FORMATIONS.diamond;
    const targetForm = FORMATIONS[this.targetFormationId] || FORMATIONS.delta;

    const leaderPos = leaderState.position || new THREE.Vector3();
    const leaderQuat = leaderState.quaternion || new THREE.Quaternion();
    const leaderVel = leaderState.velocity || new THREE.Vector3();

    for (let i = 0; i < this.planes.length; i++) {
      const plane = this.planes[i];
      if (i >= this.activeCount) {
        plane.mesh.visible = false;
        continue;
      }
      plane.mesh.visible = true;

      // 1. In 1-plane Solo Mode (activeCount === 1), always use the sampled leader state directly
      if (this.activeCount === 1) {
        plane.mesh.position.copy(leaderPos);
        plane.mesh.quaternion.copy(leaderQuat);
        plane.updateAnimation({
          gear: leaderState.gear !== undefined ? leaderState.gear : 0.0,
          airbrake: leaderState.airbrake !== undefined ? leaderState.airbrake : 0.0,
          throttle: leaderState.throttle !== undefined ? leaderState.throttle : 0.6,
        }, camera);

        if (this.smokeSystem && leaderState.isSmoking !== false) {
          const nozzles = plane.getSmokeWorldPositions();
          this.smokeSystem.emit(0, nozzles, leaderVel);
        }
        continue;
      }

      // 2. If individual plane state is explicitly provided for this plane (in multi-plane formations)
      if (individualPlaneStates && individualPlaneStates[i]) {
        const pState = individualPlaneStates[i];
        plane.mesh.position.copy(pState.position);
        plane.mesh.quaternion.copy(pState.quaternion);

        plane.updateAnimation({
          gear: pState.gear !== undefined ? pState.gear : 1.0,
          airbrake: pState.airbrake !== undefined ? pState.airbrake : 0.0,
          throttle: pState.throttle !== undefined ? pState.throttle : 0.6,
        }, camera);

        if (this.smokeSystem && pState.isSmoking) {
          const nozzles = plane.getSmokeWorldPositions();
          this.smokeSystem.emit(i, nozzles, pState.velocity || leaderVel);
        }
        continue;
      }

      // 3. Default Leader / Wingman handling
      if (i === 0) {
        // Leader (#1)
        plane.mesh.position.copy(leaderPos);
        plane.mesh.quaternion.copy(leaderQuat);
        plane.updateAnimation({
          gear: leaderState.gear,
          airbrake: leaderState.airbrake,
          throttle: leaderState.throttle,
        }, camera);

        // Emit smoke
        if (this.smokeSystem && leaderState.isSmoking !== false) {
          const nozzles = plane.getSmokeWorldPositions();
          this.smokeSystem.emit(0, nozzles, leaderVel);
        }
      } else {
        // Wingmen (#2 through #5/6)
        let offsetVec = new THREE.Vector3();

        if (customOffsets && customOffsets[i]) {
          offsetVec.copy(customOffsets[i]);
        } else {
          const o1 = currForm.offsets[i] || new THREE.Vector3();
          const o2 = targetForm.offsets[i] || new THREE.Vector3();
          const ease = this.formationLerp * this.formationLerp * (3.0 - 2.0 * this.formationLerp);
          offsetVec.lerpVectors(o1, o2, ease);
        }

        // Apply leader rotation to formation offset
        const worldOffset = offsetVec.clone().applyQuaternion(leaderQuat);
        const targetPos = new THREE.Vector3().addVectors(leaderPos, worldOffset);

        // Smooth wingman response
        plane.mesh.position.copy(targetPos);
        plane.mesh.quaternion.copy(leaderQuat);

        plane.updateAnimation({
          gear: leaderState.gear,
          airbrake: leaderState.airbrake,
          throttle: leaderState.throttle,
        }, camera);

        // Emit wingman smoke
        if (this.smokeSystem && leaderState.isSmoking !== false) {
          const nozzles = plane.getSmokeWorldPositions();
          this.smokeSystem.emit(i, nozzles, leaderVel);
        }
      }
    }
  }

  getPlane(index) {
    return this.planes[index] || this.planes[0];
  }

  getLeader() {
    return this.planes[0];
  }

  getSolo() {
    return this.planes[4] || this.planes[0]; // #5 Solo
  }
}
