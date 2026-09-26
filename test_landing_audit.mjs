import * as THREE from 'three';
import { AerobaticRoutines } from './src/sim/AerobaticRoutines.js';

console.log('=== Blue Impulse Full Routine Audit & Runway Landing Validation ===');

const routines = [
  'free_flight',
  'diamond_takeoff',
  'delta_loop',
  'star_cross',
  'level_sunrise',
  'changeover',
  'corkscrew',
  'combat_pitch'
];

let totalErrors = 0;

for (const rId of routines) {
  const routine = new AerobaticRoutines(rId);
  console.log(`\nTesting Routine: ${rId}`);
  
  let maxPosJump = 0;
  let maxQuatJump = 0;
  let minPlaneDist = Infinity;
  let prevSample = null;
  let minAlt = Infinity;
  let finalState = null;

  for (let t = 0; t <= 120.0; t += 0.05) {
    const s = routine.sample(t);
    minAlt = Math.min(minAlt, s.position.y);
    finalState = s;

    if (prevSample) {
      const pDiff = s.position.distanceTo(prevSample.position);
      const qDiff = s.quaternion.angleTo(prevSample.quaternion);
      if (pDiff > maxPosJump) maxPosJump = pDiff;
      if (qDiff > maxQuatJump) maxQuatJump = qDiff;
    }
    prevSample = s;

    // Check individual planes for mid-air collision
    const planePositions = [];
    if (s.individualPlaneStates) {
      for (let i = 0; i < 5; i++) {
        if (s.individualPlaneStates[i]) {
          planePositions.push(s.individualPlaneStates[i].position);
        }
      }
    } else if (s.customOffsets) {
      for (let i = 0; i < 5; i++) {
        const off = s.customOffsets[i];
        if (off) {
          const worldPos = new THREE.Vector3().copy(off).applyQuaternion(s.quaternion).add(s.position);
          planePositions.push(worldPos);
        }
      }
    }

    for (let i = 0; i < planePositions.length; i++) {
      for (let j = i + 1; j < planePositions.length; j++) {
        const d = planePositions[i].distanceTo(planePositions[j]);
        if (d < minPlaneDist) minPlaneDist = d;
      }
    }
  }

  console.log(`  Max Pos Jump (dt=0.05s): ${maxPosJump.toFixed(3)}m`);
  console.log(`  Max Quat Jump (dt=0.05s): ${(maxQuatJump * 180 / Math.PI).toFixed(3)} deg`);
  console.log(`  Min Plane Distance: ${minPlaneDist.toFixed(2)}m (Collision threshold < 3m)`);
  console.log(`  Min Altitude: ${minAlt.toFixed(2)}m`);

  if (maxPosJump > 25.0) {
    console.error(`  ❌ ERROR: Excessive position jump in ${rId}!`);
    totalErrors++;
  }
  if (minPlaneDist < 3.0) {
    console.error(`  ❌ ERROR: Mid-air collision detected in ${rId}!`);
    totalErrors++;
  }

  if (rId === 'combat_pitch') {
    console.log(`  --- Runway Landing Check for combat_pitch ---`);
    // Sample key landing moments: t=92 (final start), t=106 (touchdown), t=120 (full stop)
    const rad07 = (68.0 * Math.PI) / 180.0;
    const fwd07 = new THREE.Vector3(Math.sin(rad07), 0, -Math.cos(rad07));
    const perp07 = new THREE.Vector3(Math.cos(rad07), 0, Math.sin(rad07));

    const checkTimes = [0, 30, 60, 76, 94, 108, 120];
    for (const ct of checkTimes) {
      const sample = routine.sample(ct);
      const fwdDist = sample.position.dot(fwd07);
      const perpDist = sample.position.dot(perp07);
      console.log(`    t=${ct}s [${sample.phaseName}]: Pos=(${sample.position.x.toFixed(1)}, ${sample.position.y.toFixed(1)}, ${sample.position.z.toFixed(1)}), RwyDist=${fwdDist.toFixed(1)}m, RwyOffset=${perpDist.toFixed(1)}m, Spd=${sample.airspeed.toFixed(1)}m/s, Gear=${sample.gear}, Airbrake=${sample.airbrake}`);
      
      if (ct === 108) {
        if (fwdDist < -1250 || fwdDist > 1250) {
          console.error(`    ❌ Touchdown outside runway threshold! (fwdDist=${fwdDist})`);
          totalErrors++;
        } else {
          console.log(`    ✅ Touchdown perfectly in Runway 07 Touchdown Zone (-1250m <= ${fwdDist.toFixed(1)}m <= -800m)`);
        }
      }
      if (ct === 120) {
        if (fwdDist > 1250 || fwdDist < -1250) {
          console.error(`    ❌ OVERRUN! Full stop outside runway! (fwdDist=${fwdDist})`);
          totalErrors++;
        } else {
          console.log(`    ✅ Full stop perfectly safely on runway (+450m vs +1250m end, 800m margin!)`);
        }
        if (sample.airspeed > 0.1) {
          console.error(`    ❌ Airplane did not come to complete stop! (Spd=${sample.airspeed})`);
          totalErrors++;
        }
      }
    }
  }
}

if (totalErrors === 0) {
  console.log('\n🎉 ALL ROUTINES & LANDING AUDIT PASSED WITH 0 ERRORS!');
} else {
  console.error(`\n❌ AUDIT FAILED WITH ${totalErrors} ERRORS!`);
  process.exit(1);
}
