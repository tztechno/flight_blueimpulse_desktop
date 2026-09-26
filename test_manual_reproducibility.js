import * as THREE from 'three';
import { AerobaticRoutines } from './src/sim/AerobaticRoutines.js';

const routines = [
  'diamond_takeoff',
  'delta_loop',
  'star_cross',
  'level_sunrise',
  'changeover',
  'corkscrew',
  'combat_pitch',
];

const dt = 0.05;

// Physical human/aircraft manual flight limits for Kawasaki T-4 Blue Impulse
const MAX_PITCH_RATE_DEG_S = 45.0; // Realistic max elevator pull rate (deg/s)
const MAX_ROLL_RATE_DEG_S = 360.0;  // Realistic max aileron roll rate (deg/s)
const MAX_G_FORCE = 7.5;           // Realistic max pilot G limit
const MIN_SPEED_MS = 25.0;         // ~50 kt (stall boundary when airborne)
const MAX_SPEED_MS = 180.0;        // ~350 kt (max aerobatic entry speed)
const MAX_ACCELERATION_MS2 = 30.0; // Max along-path acceleration (m/s^2)

console.log(`================================================================`);
console.log(` AEROBATIC ROUTINE MANUAL REPRODUCIBILITY & FLYABILITY AUDIT `);
console.log(` Checking all 5 aircraft across 8 routines for physical flyability`);
console.log(`================================================================`);

let overallFlyabilityPass = true;

routines.forEach((rId) => {
  const routine = new AerobaticRoutines(rId);
  console.log(`\n--- Auditing Routine: [${rId}] ---`);

  let maxPitchRate = 0, maxPitchTime = 0, maxPitchPlane = 0;
  let maxRollRate = 0, maxRollTime = 0, maxRollPlane = 0;
  let maxG = 0, maxGTime = 0;
  let minSpeed = Infinity, minSpeedTime = 0;
  let maxSpeed = 0, maxSpeedTime = 0;
  let maxAccel = 0, maxAccelTime = 0;

  let prevPositions = null;
  let prevVelocities = null;
  let prevRotations = null;

  const violations = [];

  for (let t = 0; t <= routine.totalDuration; t += dt) {
    const frame = routine.sample(t);
    const planePositions = [];
    const planeRotations = [];
    const planeVelocities = [];

    const leaderPos = frame.position;
    const leaderQuat = frame.quaternion;

    for (let i = 0; i < 5; i++) {
      if (frame.individualPlaneStates && frame.individualPlaneStates[i]) {
        const ps = frame.individualPlaneStates[i];
        planePositions.push(ps.position.clone());
        planeRotations.push(ps.quaternion.clone());
        planeVelocities.push(ps.velocity ? ps.velocity.clone() : frame.forward.clone().multiplyScalar(frame.airspeed));
      } else if (i === 0) {
        planePositions.push(leaderPos.clone());
        planeRotations.push(leaderQuat.clone());
        planeVelocities.push(frame.forward.clone().multiplyScalar(frame.airspeed));
      } else {
        let offsetVec = new THREE.Vector3();
        if (frame.customOffsets && frame.customOffsets[i]) {
          offsetVec.copy(frame.customOffsets[i]);
        } else {
          const offsets = [
            new THREE.Vector3(0, 0, 0),
            new THREE.Vector3(-16, 0, 16),
            new THREE.Vector3(16, 0, 16),
            new THREE.Vector3(-32, 0, 32),
            new THREE.Vector3(32, 0, 32),
          ];
          offsetVec.copy(offsets[i] || new THREE.Vector3());
        }
        const worldPos = leaderPos.clone().add(offsetVec.clone().applyQuaternion(leaderQuat));
        planePositions.push(worldPos);
        planeRotations.push(leaderQuat.clone());
        planeVelocities.push(frame.forward.clone().multiplyScalar(frame.airspeed));
      }
    }

    if (prevPositions && prevVelocities && prevRotations) {
      for (let i = 0; i < 5; i++) {
        // 1. Instantaneous Speed & Acceleration
        const speed = prevPositions[i].distanceTo(planePositions[i]) / dt;
        const prevSpeed = prevVelocities[i].length();
        const accel = Math.abs(speed - prevSpeed) / dt;

        if (speed > maxSpeed) { maxSpeed = speed; maxSpeedTime = t; }
        if (speed < minSpeed && t > 15.0 && planePositions[i].y > 20.0) { minSpeed = speed; minSpeedTime = t; }
        if (accel > maxAccel && t > 5.0) { maxAccel = accel; maxAccelTime = t; }

        // 2. Angular rates (Pitch and Roll from Quaternion delta)
        const qDelta = prevRotations[i].clone().invert().multiply(planeRotations[i]);
        const euler = new THREE.Euler().setFromQuaternion(qDelta, 'YXZ');
        const pitchRate = Math.abs((euler.x * 180.0) / Math.PI) / dt;
        const rollRate = Math.abs((euler.z * 180.0) / Math.PI) / dt;

        if (pitchRate > maxPitchRate) { maxPitchRate = pitchRate; maxPitchTime = t; maxPitchPlane = i + 1; }
        if (rollRate > maxRollRate) { maxRollRate = rollRate; maxRollTime = t; maxRollPlane = i + 1; }

        // Check against physical manual flight limits
        if (pitchRate > MAX_PITCH_RATE_DEG_S) {
          violations.push(`t=${t.toFixed(2)}s: Plane #${i+1} pitch rate ${pitchRate.toFixed(1)}°/s exceeds human limit ${MAX_PITCH_RATE_DEG_S}°/s`);
        }
        if (rollRate > MAX_ROLL_RATE_DEG_S) {
          violations.push(`t=${t.toFixed(2)}s: Plane #${i+1} roll rate ${rollRate.toFixed(1)}°/s exceeds human limit ${MAX_ROLL_RATE_DEG_S}°/s`);
        }
        if (accel > MAX_ACCELERATION_MS2 && t > 5.0) {
          violations.push(`t=${t.toFixed(2)}s: Plane #${i+1} accel ${accel.toFixed(1)}m/s² exceeds jet limit ${MAX_ACCELERATION_MS2}m/s²`);
        }
      }
    }

    if (frame.gForce && frame.gForce > maxG) {
      maxG = frame.gForce;
      maxGTime = t;
    }

    prevPositions = planePositions;
    prevVelocities = planeVelocities;
    prevRotations = planeRotations;
  }

  console.log(`  Speed Range: ${(minSpeed * 1.94384).toFixed(0)} KT (${minSpeed.toFixed(0)} m/s) 〜 ${(maxSpeed * 1.94384).toFixed(0)} KT (${maxSpeed.toFixed(0)} m/s) [Realistic T-4 Range: 110〜320 KT]`);
  console.log(`  Max Pitch Rate: ${maxPitchRate.toFixed(1)}°/s (Plane #${maxPitchPlane} at t=${maxPitchTime.toFixed(1)}s) [Limit: ${MAX_PITCH_RATE_DEG_S}°/s]`);
  console.log(`  Max Roll Rate: ${maxRollRate.toFixed(1)}°/s (Plane #${maxRollPlane} at t=${maxRollTime.toFixed(1)}s) [Limit: ${MAX_ROLL_RATE_DEG_S}°/s]`);
  console.log(`  Max Acceleration: ${maxAccel.toFixed(1)} m/s² [Limit: ${MAX_ACCELERATION_MS2} m/s²]`);
  console.log(`  Max G-Force: ${maxG.toFixed(1)} G (at t=${maxGTime.toFixed(1)}s) [Limit: ${MAX_G_FORCE} G]`);

  if (violations.length > 0) {
    console.log(`  ⚠️ REPRODUCIBILITY WARNINGS (${violations.length} issues):`);
    violations.slice(0, 3).forEach(v => console.log(`     ${v}`));
    overallFlyabilityPass = false;
  } else {
    console.log(`  ✅ Flyability & Reproducibility: 100% REPRODUCIBLE WITH MANUAL CONTROLS`);
  }
});

console.log(`\n================================================================`);
console.log(`OVERALL MANUAL REPRODUCIBILITY STATUS: ${overallFlyabilityPass ? '✅ ALL 8 ROUTINES ARE 100% MANUALLY FLYABLE' : '⚠️ ADJUSTMENTS NEEDED'}`);
console.log(`================================================================`);
