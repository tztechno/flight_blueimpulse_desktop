import * as THREE from 'three';

function makeBasisQuat(fwd, up, right = null) {
  const f = fwd.clone().normalize();
  let r = right ? right.clone().normalize() : new THREE.Vector3().crossVectors(f, up).normalize();
  if (r.lengthSq() < 1e-4) r = new THREE.Vector3(1, 0, 0);
  const u = new THREE.Vector3().crossVectors(r, f).normalize();
  const dBack = f.clone().negate();
  const mat = new THREE.Matrix4().makeBasis(r, u, dBack);
  return new THREE.Quaternion().setFromRotationMatrix(mat);
}

function createPlaneState(pos, fwd, bankDeg, airspeed, isSmoking, gear = 0.0, throttle = 0.85) {
  const fwdNorm = fwd.clone().normalize();
  let r0 = new THREE.Vector3().crossVectors(fwdNorm, new THREE.Vector3(0, 1, 0));
  if (r0.lengthSq() < 1e-4) r0.set(1, 0, 0);
  else r0.normalize();
  const u0 = new THREE.Vector3().crossVectors(r0, fwdNorm).normalize();
  const bankRad = (bankDeg * Math.PI) / 180.0;
  const rBanked = new THREE.Vector3().copy(r0).multiplyScalar(Math.cos(bankRad)).addScaledVector(u0, -Math.sin(bankRad));
  const uBanked = new THREE.Vector3().copy(r0).multiplyScalar(Math.sin(bankRad)).addScaledVector(u0, Math.cos(bankRad));
  const dBack = new THREE.Vector3().copy(fwdNorm).negate();
  const rotMat = new THREE.Matrix4().makeBasis(rBanked, uBanked, dBack);
  const quat = new THREE.Quaternion().setFromRotationMatrix(rotMat);
  return {
    position: pos,
    quaternion: quat,
    forward: fwdNorm,
    velocity: fwdNorm.clone().multiplyScalar(airspeed),
    gear: gear,
    airbrake: 0.0,
    throttle: throttle,
    isSmoking: isSmoking,
  };
}

export class AerobaticRoutines {
  constructor(routineId = 'diamond_takeoff') {
    this.routineId = routineId;
    this.totalDuration = 120.0;
  }

  setRoutine(routineId) {
    this.routineId = routineId;
    this.totalDuration = 120.0;
  }

  sample(time) {
    const t = Math.max(0, Math.min(time, this.totalDuration));
    const rwyHdgDeg = 68.0;
    const rad07 = (rwyHdgDeg * Math.PI) / 180.0;
    const fwd07X = Math.sin(rad07);
    const fwd07Z = -Math.cos(rad07);
    const perp07X = Math.cos(rad07);
    const perp07Z = Math.sin(rad07);

    const fwd07 = new THREE.Vector3(fwd07X, 0, fwd07Z);
    const perp07 = new THREE.Vector3(perp07X, 0, perp07Z);
    const upWorld = new THREE.Vector3(0, 1, 0);

    let pos = new THREE.Vector3();
    let quaternion = new THREE.Quaternion();
    let forward = fwd07.clone();
    let heading = rwyHdgDeg;
    let pitch = 0.0;
    let bank = 0.0;
    let airspeed = 80.0;
    let gForce = 1.0;
    let gear = 0.0;
    let airbrake = 0.0;
    let isSmoking = true;
    let formationType = 'delta';
    let customOffsets = null;
    let individualPlaneStates = null;
    let phaseName = 'Display Maneuver';
    let useCustomQuat = false;

    // Formation Reference Offsets
    const deltaOffsets = [
      new THREE.Vector3(0, 0, 0),        // #1 Lead
      new THREE.Vector3(-16, 0, 16),     // #2 Left Wing
      new THREE.Vector3(16, 0, 16),      // #3 Right Wing
      new THREE.Vector3(-32, 0, 32),     // #4 Outer Left
      new THREE.Vector3(32, 0, 32),      // #5 Outer Right
    ];

    const diamondOffsets = [
      new THREE.Vector3(0, 0, 0),        // #1 Lead
      new THREE.Vector3(-18, 0, 18),     // #2 Left Wing
      new THREE.Vector3(18, 0, 18),      // #3 Right Wing
      new THREE.Vector3(0, -2, 36),      // #4 Slot
      new THREE.Vector3(32, 0, 32),      // #5 Solo Trail
    ];

    const trailOffsets = [
      new THREE.Vector3(0, 0, 0),        // #1
      new THREE.Vector3(0, -1.8, 22),    // #2
      new THREE.Vector3(0, -3.6, 44),    // #3
      new THREE.Vector3(0, -5.4, 66),    // #4
      new THREE.Vector3(32, 0, 32),      // #5
    ];

    // =========================================================================
    // ROUTINE 0: free_flight (完全自由飛行 / フリーフライト・松島基地/松島湾パノラマ)
    // =========================================================================
    if (this.routineId === 'free_flight') {
      formationType = 'delta';
      const rwyDistStart = -1100.0;
      const rwyDistEnd = 400.0;
      const turnRadius = 800.0;

      if (t < 15.0) {
        // Phase 1: 離陸滑走 ＆ リフトオフ
        phaseName = '滑走路07 離陸滑走 ＆ リフトオフ';
        const progress = t / 15.0;
        const dist = rwyDistStart + progress * (rwyDistEnd - rwyDistStart);
        airspeed = 35.0 + progress * 55.0; // 35 -> 90 m/s
        gear = t < 10.0 ? 1.0 : Math.max(0, 1.0 - (t - 10.0) / 3.0);
        isSmoking = t > 10.0;
        if (t < 8.0) {
          pos.set(fwd07X * dist, 2.5, fwd07Z * dist);
          pitch = 0.0;
          quaternion = makeBasisQuat(fwd07, upWorld, perp07);
        } else {
          const climbT = (t - 8.0) / 7.0;
          const ease = climbT * climbT * (3.0 - 2.0 * climbT);
          pos.set(fwd07X * dist, 2.5 + ease * 140.0, fwd07Z * dist);
          pitch = 10.0 * Math.sin(climbT * Math.PI * 0.5);
          const climbFwd = new THREE.Vector3().copy(fwd07).multiplyScalar(Math.cos(pitch * Math.PI / 180)).addScaledVector(upWorld, Math.sin(pitch * Math.PI / 180)).normalize();
          quaternion = makeBasisQuat(climbFwd, upWorld, perp07);
        }
        forward = fwd07.clone();
        useCustomQuat = true;
      } else if (t < 45.0) {
        // Phase 2: 松島湾上空へ右旋回クライム (180°旋回)
        phaseName = '松島湾上空へ右旋回クライム ＆ パノラマ上昇';
        gear = 0.0;
        isSmoking = true;
        airspeed = 105.0;
        const turnT = (t - 15.0) / 30.0;
        const turnAngle = turnT * Math.PI; // 0 to 180 deg right turn
        const centerX = fwd07X * rwyDistEnd + perp07X * turnRadius;
        const centerZ = fwd07Z * rwyDistEnd + perp07Z * turnRadius;
        const curX = centerX - turnRadius * Math.cos(turnAngle) * perp07X + turnRadius * Math.sin(turnAngle) * fwd07X;
        const curZ = centerZ - turnRadius * Math.cos(turnAngle) * perp07Z + turnRadius * Math.sin(turnAngle) * fwd07Z;
        const alt = 142.5 + turnT * 500.0; // 142.5m -> 642.5m (~2100ft)
        pos.set(curX, alt, curZ);

        const curHdgRad = rad07 + turnAngle;
        const curFwd = new THREE.Vector3(Math.sin(curHdgRad), 0.08, -Math.cos(curHdgRad)).normalize();
        const curRight = new THREE.Vector3(Math.cos(curHdgRad), 0, Math.sin(curHdgRad)).normalize();
        const curUp = new THREE.Vector3().crossVectors(curRight, curFwd).normalize();
        const bankRad = Math.sin(turnT * Math.PI) * (25.0 * Math.PI / 180.0);
        const rBanked = new THREE.Vector3().copy(curRight).multiplyScalar(Math.cos(bankRad)).addScaledVector(curUp, -Math.sin(bankRad));
        const uBanked = new THREE.Vector3().copy(curRight).multiplyScalar(Math.sin(bankRad)).addScaledVector(curUp, Math.cos(bankRad));
        quaternion = makeBasisQuat(curFwd, uBanked, rBanked);
        forward = curFwd;
        useCustomQuat = true;
        bank = (bankRad * 180.0) / Math.PI;
        pitch = 4.5;
        gForce = 1.3;
      } else if (t < 85.0) {
        // Phase 3: 松島湾上空の8の字旋回 ＆ バレルロール
        phaseName = '松島湾上空 自由巡航 ＆ 優雅なバレルロール';
        gear = 0.0;
        isSmoking = true;
        airspeed = 125.0;
        const cruiseT = (t - 45.0) / 40.0;
        const turnAngle = Math.PI + cruiseT * Math.PI; // 180 to 360 deg
        const centerX = fwd07X * rwyDistEnd + perp07X * turnRadius;
        const centerZ = fwd07Z * rwyDistEnd + perp07Z * turnRadius;
        const curX = centerX - turnRadius * Math.cos(turnAngle) * perp07X + turnRadius * Math.sin(turnAngle) * fwd07X;
        const curZ = centerZ - turnRadius * Math.cos(turnAngle) * perp07Z + turnRadius * Math.sin(turnAngle) * fwd07Z;
        const alt = 642.5 - Math.sin(cruiseT * Math.PI) * 150.0;
        pos.set(curX, alt, curZ);

        const rollRad = cruiseT * Math.PI * 4.0; // 2 complete barrel rolls
        const curHdgRad = rad07 + turnAngle;
        const tangent = new THREE.Vector3(Math.sin(curHdgRad), 0, -Math.cos(curHdgRad)).normalize();
        const r0 = new THREE.Vector3(Math.cos(curHdgRad), 0, Math.sin(curHdgRad)).normalize();
        const u0 = new THREE.Vector3().crossVectors(r0, tangent).normalize();
        const rRoll = new THREE.Vector3().copy(r0).multiplyScalar(Math.cos(rollRad)).addScaledVector(u0, -Math.sin(rollRad));
        const uRoll = new THREE.Vector3().copy(r0).multiplyScalar(Math.sin(rollRad)).addScaledVector(u0, Math.cos(rollRad));
        quaternion = makeBasisQuat(tangent, uRoll, rRoll);
        forward = tangent;
        useCustomQuat = true;
        bank = ((rollRad * 180.0) / Math.PI) % 360;
        pitch = 0.0;
        gForce = 1.5;
      } else {
        // Phase 4: 滑走路07上空へローパス通過 ＆ クライム
        phaseName = '基地上空 高速ローパス ＆ 自由アセント';
        gear = 0.0;
        isSmoking = true;
        airspeed = 145.0;
        const passT = (t - 85.0) / 35.0;
        const dist = rwyDistEnd + passT * 3500.0;
        const alt = 642.5 - passT * 300.0; // 642.5m -> 342.5m
        pos.set(fwd07X * dist, alt, fwd07Z * dist);
        quaternion = makeBasisQuat(fwd07, upWorld, perp07);
        forward = fwd07.clone();
        useCustomQuat = true;
        bank = 0.0;
        pitch = 0.0;
        gForce = 1.0;
      }
      customOffsets = deltaOffsets;
    }

    // =========================================================================
    // ROUTINE 1: diamond_takeoff (ダイヤモンド・テイクオフ ＆ ダーティーループ)
    // =========================================================================
    else if (this.routineId === 'diamond_takeoff') {
      formationType = 'diamond';
      if (t < 20.0) {
        phaseName = '1〜4番機 ダイヤモンド離陸滑走 (5番機 待機中)';
        const progress = t / 20.0;
        const dist = -1100.0 + progress * 1600.0;
        airspeed = 35.0 + progress * 55.0; // 35 m/s (~70kt) -> 90 m/s (~175kt)
        gear = 1.0;
        isSmoking = false;
        if (t < 12.0) {
          pos.set(fwd07X * dist, 2.5, fwd07Z * dist);
          pitch = 0.0;
        } else {
          // Smooth rotation liftoff (elevator pull at ~1.5 deg/s)
          const climbT = (t - 12.0) / 8.0;
          const ease = climbT * climbT * (3.0 - 2.0 * climbT);
          pos.set(fwd07X * dist, 2.5 + ease * 180.0, fwd07Z * dist);
          pitch = 12.0 * Math.sin(climbT * Math.PI);
        }
        customOffsets = diamondOffsets;
      } else if (t < 52.0) {
        phaseName = '1〜4番機 ダーティーループ (5番機 単独ロールオン離陸)';
        gear = t < 42.0 ? 1.0 : Math.max(0, 1.0 - (t - 42.0) / 4.0);
        isSmoking = true;
        airspeed = 95.0; // Constant ~185 kt throughout loop
        const loopT = (t - 20.0) / 32.0;
        const angle = loopT * Math.PI * 2.0;
        const loopRadius = 450.0;
        const loopCenterY = 182.5 + loopRadius;
        const posY = loopCenterY - loopRadius * Math.cos(angle);
        const distAlongRwy = 500.0 + loopRadius * Math.sin(angle) + loopT * 1350.0;
        pos.set(fwd07X * distAlongRwy, posY, fwd07Z * distAlongRwy);

        // Gimbal-lock-free Loop Orientation (Pitch rate ~11.25 deg/s, ~3.8G)
        const loopFwd = new THREE.Vector3()
          .copy(fwd07)
          .multiplyScalar(Math.cos(angle))
          .addScaledVector(upWorld, Math.sin(angle))
          .normalize();
        const loopUp = new THREE.Vector3()
          .copy(fwd07)
          .multiplyScalar(-Math.sin(angle))
          .addScaledVector(upWorld, Math.cos(angle))
          .normalize();
        quaternion = makeBasisQuat(loopFwd, loopUp, perp07);
        forward = loopFwd;
        useCustomQuat = true;
        gForce = 3.5 + Math.cos(angle) * 1.0;
        customOffsets = diamondOffsets;

      } else if (t < 72.0) {
        phaseName = t < 60.0 ? '5番機 空中合流アプローチ中' : '4番機・5番機 デルタ隊形展開 ＆ 空中合流';
        gear = 0.0;
        isSmoking = true;
        airspeed = 110.0; // ~215 kt
        const jT = (t - 52.0) / 20.0;
        const dist = 1850.0 + jT * 2250.0;
        pos.set(fwd07X * dist, 182.5 + jT * (350.0 - 182.5), fwd07Z * dist);
        pitch = 4.8 * (1.0 - jT * 0.5);
        gForce = 1.0;

        if (t < 60.0) {
          formationType = 'diamond';
          customOffsets = diamondOffsets;
        } else {
          formationType = 'delta';
          const transT = Math.min(1.0, (t - 60.0) / 8.0);
          const ease = transT * transT * (3.0 - 2.0 * transT);
          customOffsets = [
            new THREE.Vector3(0, 0, 0),
            new THREE.Vector3().lerpVectors(diamondOffsets[1], deltaOffsets[1], ease),
            new THREE.Vector3().lerpVectors(diamondOffsets[2], deltaOffsets[2], ease),
            new THREE.Vector3().lerpVectors(diamondOffsets[3], deltaOffsets[3], ease),
            deltaOffsets[4],
          ];
        }
      } else if (t < 98.0) {
        phaseName = '5機デルタ編隊 松島湾上空 360°大旋回';
        formationType = 'delta';
        gear = 0.0;
        isSmoking = true;
        airspeed = 120.0; // ~235 kt
        const turnT = (t - 72.0) / 26.0;
        const turnAngle = turnT * Math.PI * 2.0;
        const turnR = 1200.0;

        const posX = fwd07X * 4100.0 + perp07X * (turnR - turnR * Math.cos(turnAngle)) + fwd07X * (turnR * Math.sin(turnAngle));
        const posZ = fwd07Z * 4100.0 + perp07Z * (turnR - turnR * Math.cos(turnAngle)) + fwd07Z * (turnR * Math.sin(turnAngle));

        pos.set(posX, 350.0 + Math.sin(turnT * Math.PI) * 100.0, posZ);
        heading = rwyHdgDeg + (turnAngle * 180.0) / Math.PI;
        bank = 45.0 * Math.sin(turnT * Math.PI); // Coordinated 2G turn
        pitch = 2.0;
        gForce = 1.8;
        customOffsets = deltaOffsets;
      } else {
        phaseName = '5機デルタ編隊 松島基地上空 高速フライパス';
        formationType = 'delta';
        gear = 0.0;
        isSmoking = true;
        airspeed = 135.0; // ~260 kt
        const fT = (t - 98.0) / 22.0;
        const dist = 4100.0 + fT * 3200.0;
        pos.set(fwd07X * dist, 350.0 + fT * 150.0, fwd07Z * dist);
        heading = rwyHdgDeg;
        pitch = 3.0;
        bank = 0.0;
        gForce = 1.0;
        customOffsets = deltaOffsets;
      }

      // 5番機 (Solo #5)
      if (t < 68.0) {
        individualPlaneStates = new Array(5).fill(null);
        let p5Pos = new THREE.Vector3();
        let p5Pitch = 0.0;
        let p5Bank = 0.0;
        let p5Speed = 80.0;

        if (t < 16.0) {
          p5Pos.set(fwd07X * -1250.0, 2.5, fwd07Z * -1250.0);
          individualPlaneStates[4] = createPlaneState(p5Pos, fwd07, 0, 0, false, 1.0, 0.1);
        } else if (t < 28.0) {
          const rollT = (t - 16.0) / 12.0;
          const dist = -1250.0 + rollT * rollT * 1150.0;
          p5Speed = rollT * 82.0;
          p5Pos.set(fwd07X * dist, 2.5, fwd07Z * dist);
          p5Pitch = rollT > 0.85 ? ((rollT - 0.85) / 0.15) * 8.0 : 0.0;
          const fVec = new THREE.Vector3(fwd07X, Math.tan((p5Pitch * Math.PI) / 180.0), fwd07Z).normalize();
          individualPlaneStates[4] = createPlaneState(p5Pos, fVec, 0, p5Speed, false, 1.0, 1.0);
        } else if (t < 38.0) {
          const lowT = (t - 28.0) / 10.0;
          const dist = -100.0 + lowT * 950.0;
          p5Speed = 82.0 + lowT * 48.0;
          const posY = 2.5 + Math.sin(lowT * Math.PI * 0.5) * 15.0;
          p5Pos.set(fwd07X * dist, posY, fwd07Z * dist);
          p5Pitch = 8.0 * (1.0 - lowT) + 2.0 * lowT;
          const fVec = new THREE.Vector3(fwd07X, Math.tan((p5Pitch * Math.PI) / 180.0), fwd07Z).normalize();
          individualPlaneStates[4] = createPlaneState(p5Pos, fVec, 0, p5Speed, false, Math.max(0, 1.0 - lowT * 2.5), 1.0);
        } else if (t < 52.0) {
          const rollOnT = (t - 38.0) / 14.0;
          const ease = rollOnT * rollOnT * (3.0 - 2.0 * rollOnT);
          const dist = 850.0 + rollOnT * 950.0;
          const posY = 17.5 + ease * (182.5 - 17.5);
          const rollAngle = rollOnT * Math.PI * 2.0;
          const helixLat = Math.sin(rollAngle) * 12.0 * Math.sin(rollOnT * Math.PI);
          const helixVert = (1.0 - Math.cos(rollAngle)) * 8.0 * Math.sin(rollOnT * Math.PI);
          const spiralLat = ease * 32.0 + helixLat;

          p5Pos.set(fwd07X * dist + perp07X * spiralLat, posY + helixVert, fwd07Z * dist + perp07Z * spiralLat);
          p5Pitch = 2.0 + Math.sin(rollOnT * Math.PI) * 18.0;
          p5Bank = rollOnT * 360.0;
          const fVec = new THREE.Vector3(fwd07X, Math.tan((p5Pitch * Math.PI) / 180.0), fwd07Z).normalize();
          individualPlaneStates[4] = createPlaneState(p5Pos, fVec, p5Bank, 130.0, true, 0.0, 1.0);
        } else {
          const joinT = Math.min(1.0, (t - 52.0) / 16.0);
          const ease = joinT * joinT * (3.0 - 2.0 * joinT);

          const leadDist = 1850.0 + ((t - 52.0) / 20.0) * 2250.0;
          const currentLeadPos = new THREE.Vector3(fwd07X * leadDist, 182.5 + ((t - 52.0) / 20.0) * 167.5, fwd07Z * leadDist);

          const startPosAtT = new THREE.Vector3(fwd07X * (leadDist - 50.0) + perp07X * 32.0, currentLeadPos.y, fwd07Z * (leadDist - 50.0) + perp07Z * 32.0);
          const targetPosAtT = new THREE.Vector3(fwd07X * (leadDist - 32.0) + perp07X * 32.0, currentLeadPos.y, fwd07Z * (leadDist - 32.0) + perp07Z * 32.0);

          p5Pos = new THREE.Vector3().lerpVectors(startPosAtT, targetPosAtT, ease);
          individualPlaneStates[4] = createPlaneState(p5Pos, fwd07, (1.0 - ease) * 0.0 + ease * bank, airspeed * 1.05, true, 0.0, 0.95);
        }
      }
    }

    // =========================================================================
    // ROUTINE 2: delta_loop (デルタ・ループ ＆ バレルロール)
    // =========================================================================
    else if (this.routineId === 'delta_loop') {
      formationType = 'delta';
      customOffsets = deltaOffsets;
      gear = 0.0;
      airspeed = 100.0; // ~195 kt

      if (t < 30.0) {
        phaseName = '松島基地滑走路07 5機デルタ進入 (Ingress)';
        isSmoking = false;
        const inT = t / 30.0;
        const dist = -3000.0 + inT * 3500.0;
        pos.set(fwd07X * dist, 180.0, fwd07Z * dist);
        pitch = 0.0;
        gForce = 1.0;
      } else if (t < 65.0) {
        phaseName = '5機デルタ・バーティカル大宙返り (4G Vertical Loop)';
        isSmoking = true;
        airspeed = 105.0; // ~205 kt
        const loopT = (t - 30.0) / 35.0;
        const angle = loopT * Math.PI * 2.0;
        const loopRadius = 500.0;
        const loopCenterY = 180.0 + loopRadius;
        const posY = loopCenterY - loopRadius * Math.cos(angle);
        const distAlongRwy = 500.0 + loopRadius * Math.sin(angle) + loopT * 1500.0;
        pos.set(fwd07X * distAlongRwy, posY, fwd07Z * distAlongRwy);

        // Smooth pitch rate ~10.3 deg/s, G-force ~4G
        const loopFwd = new THREE.Vector3()
          .copy(fwd07)
          .multiplyScalar(Math.cos(angle))
          .addScaledVector(upWorld, Math.sin(angle))
          .normalize();
        const loopUp = new THREE.Vector3()
          .copy(fwd07)
          .multiplyScalar(-Math.sin(angle))
          .addScaledVector(upWorld, Math.cos(angle))
          .normalize();
        quaternion = makeBasisQuat(loopFwd, loopUp, perp07);
        forward = loopFwd;
        useCustomQuat = true;
        gForce = 3.8 + Math.cos(angle) * 1.2;

      } else if (t < 90.0) {
        phaseName = '5機デルタ・ワイドバレルロール (Wide Barrel Roll)';
        isSmoking = true;
        airspeed = 115.0;
        const rT = (t - 65.0) / 25.0;
        const dist = 2000.0 + rT * 2400.0;
        pos.set(fwd07X * dist, 180.0 + Math.sin(rT * Math.PI) * 100.0, fwd07Z * dist);
        pitch = 3.0;
        bank = rT * 360.0; // Roll rate ~14.4 deg/s (comfortable manual aileron roll)
        gForce = 1.4;
      } else {
        phaseName = '松島湾上空 5機大旋回 ＆ アフターバーナークライム';
        airspeed = 125.0;
        const tT = (t - 90.0) / 30.0;
        const turnAngle = tT * Math.PI * 1.5;
        const turnR = 1400.0;
        const startDist = 4400.0;
        const posX = fwd07X * startDist + perp07X * (turnR - turnR * Math.cos(turnAngle)) + fwd07X * (turnR * Math.sin(turnAngle));
        const posZ = fwd07Z * startDist + perp07Z * (turnR - turnR * Math.cos(turnAngle)) + fwd07Z * (turnR * Math.sin(turnAngle));
        pos.set(posX, 180.0 + tT * 400.0, posZ);
        heading = rwyHdgDeg + (turnAngle * 180.0) / Math.PI;
        bank = 50.0 * Math.sin(tT * Math.PI);
        pitch = 4.0;
        gForce = 1.8;
      }
    }

    // =========================================================================
    // ROUTINE 3: star_cross (スター・クロス)
    // =========================================================================
    else if (this.routineId === 'star_cross') {
      gear = 0.0;
      airspeed = 100.0;
      formationType = 'delta';

      const starAngles = [
        0.0,
        (-72.0 * Math.PI) / 180.0,
        (72.0 * Math.PI) / 180.0,
        (-144.0 * Math.PI) / 180.0,
        (144.0 * Math.PI) / 180.0,
      ];

      if (t < 25.0) {
        phaseName = '松島基地上空 急加速進入 (Ingress)';
        isSmoking = false;
        const inT = t / 25.0;
        const dist = -2600.0 + inT * 2200.0;
        pos.set(fwd07X * dist, 180.0, fwd07Z * dist);
        pitch = 0.0;
        gForce = 1.0;
        customOffsets = deltaOffsets;
      } else if (t < 45.0) {
        phaseName = '5機垂直急上昇 (Vertical Climb to 1,200m)';
        isSmoking = false;
        const pT = (t - 25.0) / 20.0;
        const easeClimb = pT * pT * (3.0 - 2.0 * pT);
        pos.set(fwd07X * (-400.0 + pT * 400.0), 180.0 + easeClimb * 1020.0, fwd07Z * (-400.0 + pT * 400.0));
        // Smooth rotation pitch up (pitch rate ~4.2 deg/s)
        pitch = Math.sin(pT * Math.PI * 0.5) * 85.0 * (1.0 - Math.pow(pT, 8));
        gForce = 3.5;
        customOffsets = deltaOffsets;
      } else if (t < 60.0) {
        phaseName = '頂点5機ブレイク (Apex 5-Way Star Blossom)';
        isSmoking = true;
        const bT = (t - 45.0) / 15.0;
        pitch = 0.0;
        pos.set(fwd07X * (bT * 300.0), 1200.0 - bT * 100.0, fwd07Z * (bT * 300.0));

        const r = bT * bT * 400.0;
        customOffsets = deltaOffsets.map((d, i) => {
          const ang = starAngles[i];
          return new THREE.Vector3(
            d.x + Math.sin(ang) * r,
            d.y - (bT * bT) * 6.0,
            d.z - Math.cos(ang) * r
          );
        });
      } else if (t < 85.0) {
        phaseName = '大空の巨大星を描く (Star Cross Pattern)';
        isSmoking = true;
        const sT = (t - 60.0) / 25.0;
        pos.set(fwd07X * (300.0 + sT * 2500.0), 1100.0 - sT * 150.0, fwd07Z * (300.0 + sT * 2500.0));
        pitch = 0.0;

        const r = 400.0 + sT * 1200.0;
        customOffsets = deltaOffsets.map((d, i) => {
          const ang = starAngles[i];
          return new THREE.Vector3(
            d.x + Math.sin(ang) * r,
            d.y - 6.0 - sT * 18.0,
            d.z - Math.cos(ang) * r
          );
        });
      } else if (t < 112.0) {
        phaseName = '5機水平再編隊合流 (Rejoining into 5-Ship Delta)';
        isSmoking = true;
        const rT = (t - 85.0) / 27.0;
        const ease = rT * rT * (3.0 - 2.0 * rT);
        const r = 1600.0 * (1.0 - ease);

        const dist = 2800.0 + rT * 3000.0;
        pos.set(fwd07X * dist, 950.0 - rT * 350.0, fwd07Z * dist);
        pitch = 0.0;
        gForce = 1.2;

        customOffsets = deltaOffsets.map((d, i) => {
          const ang = starAngles[i];
          return new THREE.Vector3(
            d.x + Math.sin(ang) * r,
            d.y - 24.0 * (1.0 - ease),
            d.z - Math.cos(ang) * r
          );
        });
      } else {
        phaseName = '5機デルタ編隊 松島湾上空 フライパス';
        customOffsets = deltaOffsets;
        isSmoking = true;
        const fT = (t - 112.0) / 8.0;
        const dist = 5800.0 + fT * 1200.0;
        pos.set(fwd07X * dist, 600.0, fwd07Z * dist);
        pitch = 0.0;
        gForce = 1.0;
      }
    }

    // =========================================================================
    // ROUTINE 4: level_sunrise (レベル・サンライズ)
    // =========================================================================
    else if (this.routineId === 'level_sunrise') {
      gear = 0.0;
      airspeed = 120.0;
      formationType = 'delta';

      if (t < 30.0) {
        phaseName = '松島基地滑走路07 超密集デルタ低空進入 (Low Ingress)';
        isSmoking = false;
        const inT = t / 30.0;
        const dist = -3000.0 + inT * 3000.0;
        pos.set(fwd07X * dist, 120.0, fwd07Z * dist);
        pitch = 0.0;
        customOffsets = deltaOffsets;
      } else if (t < 65.0) {
        phaseName = 'レベルサンライズ扇状大開花ブレイク (5-Way Fan Break)';
        isSmoking = true;
        const bT = (t - 30.0) / 35.0;
        const ease = bT * bT * (3.0 - 2.0 * bT);
        const dist = bT * 3600.0;
        pos.set(fwd07X * dist, 120.0 + ease * 680.0, fwd07Z * dist);
        pitch = 10.0 * (1.0 - bT);

        customOffsets = [
          new THREE.Vector3(0, ease * 50.0, 0),
          new THREE.Vector3(-16.0 - ease * 120.0, ease * 35.0, 16.0 + ease * 20.0),
          new THREE.Vector3(16.0 + ease * 120.0, ease * 35.0, 16.0 + ease * 20.0),
          new THREE.Vector3(-32.0 - ease * 220.0, ease * 15.0, 32.0 + ease * 40.0),
          new THREE.Vector3(32.0 + ease * 220.0, ease * 15.0, 32.0 + ease * 40.0),
        ];
      } else if (t < 97.0) {
        phaseName = '外周大半径旋回 (Tactical Perimeter Turns)';
        isSmoking = true;
        const pT = (t - 65.0) / 32.0;
        const turnAngle = pT * Math.PI * 2.0; // 360 degree orbit back to runway centerline
        const turnR = 1000.0;
        const startDist = 3600.0;
        const posX = fwd07X * startDist + perp07X * (turnR - turnR * Math.cos(turnAngle)) + fwd07X * (turnR * Math.sin(turnAngle));
        const posZ = fwd07Z * startDist + perp07Z * (turnR - turnR * Math.cos(turnAngle)) + fwd07Z * (turnR * Math.sin(turnAngle));
        pos.set(posX, 800.0 - pT * 400.0, posZ);
        heading = rwyHdgDeg + (turnAngle * 180.0) / Math.PI;
        bank = 45.0 * Math.sin(pT * Math.PI);
        pitch = 0.0;

        const ease = (1.0 - pT) * (1.0 - pT);
        customOffsets = [
          new THREE.Vector3(0, ease * 50.0, 0),
          new THREE.Vector3(-16.0 - ease * 120.0, ease * 35.0, 16.0 + ease * 20.0),
          new THREE.Vector3(16.0 + ease * 120.0, ease * 35.0, 16.0 + ease * 20.0),
          new THREE.Vector3(-32.0 - ease * 220.0, ease * 15.0, 32.0 + ease * 40.0),
          new THREE.Vector3(32.0 + ease * 220.0, ease * 15.0, 32.0 + ease * 40.0),
        ];
      } else {
        phaseName = '5機デルタ編隊再集合 ＆ 松島基地フライパス';
        formationType = 'delta';
        customOffsets = deltaOffsets;
        isSmoking = true;
        const fT = (t - 97.0) / 23.0;
        const dist = 3600.0 + fT * 3200.0;
        pos.set(fwd07X * dist, 400.0 - fT * 100.0, fwd07Z * dist);
        heading = rwyHdgDeg;
        pitch = 2.0;
        bank = 0.0;
      }
    }

    // =========================================================================
    // ROUTINE 5: changeover (チェンジオーバー・ターン)
    // =========================================================================
    else if (this.routineId === 'changeover') {
      gear = 0.0;
      airspeed = 120.0;

      if (t < 30.0) {
        phaseName = '松島基地滑走路07 トレイル進入 (Trail Ingress)';
        formationType = 'trail';
        customOffsets = trailOffsets;
        isSmoking = false;
        const inT = t / 30.0;
        const dist = -3000.0 + inT * 3000.0;
        pos.set(fwd07X * dist, 200.0, fwd07Z * dist);
        pitch = 0.0;
      } else if (t < 75.0) {
        phaseName = 'トレイルからデルタへ 360°大旋回変形ターン (Changeover Turn)';
        formationType = 'delta';
        isSmoking = true;
        const turnT = (t - 30.0) / 45.0;
        const turnAngle = turnT * Math.PI * 2.0;
        const turnR = 1400.0;

        const posX = perp07X * (turnR - turnR * Math.cos(turnAngle)) + fwd07X * (turnR * Math.sin(turnAngle));
        const posZ = perp07Z * (turnR - turnR * Math.cos(turnAngle)) + fwd07Z * (turnR * Math.sin(turnAngle));

        pos.set(posX, 200.0 + Math.sin(turnT * Math.PI) * 100.0, posZ);
        heading = rwyHdgDeg + (turnAngle * 180.0) / Math.PI;
        bank = 45.0 * Math.sin(turnT * Math.PI);
        pitch = 2.0;
        gForce = 2.0;

        const morphT = Math.min(1.0, turnT * 1.5);
        const ease = morphT * morphT * (3.0 - 2.0 * morphT);

        customOffsets = [
          new THREE.Vector3(0, 0, 0),
          new THREE.Vector3().lerpVectors(trailOffsets[1], deltaOffsets[1], ease),
          new THREE.Vector3().lerpVectors(trailOffsets[2], deltaOffsets[2], ease),
          new THREE.Vector3().lerpVectors(trailOffsets[3], deltaOffsets[3], ease),
          new THREE.Vector3().lerpVectors(trailOffsets[4], deltaOffsets[4], ease),
        ];
      } else {
        phaseName = '完成デルタ編隊 松島基地高速フライパス (Flypast)';
        formationType = 'delta';
        customOffsets = deltaOffsets;
        isSmoking = true;
        const fT = (t - 75.0) / 45.0;
        const dist = fT * 5000.0;
        pos.set(fwd07X * dist, 200.0 + fT * 150.0, fwd07Z * dist);
        heading = rwyHdgDeg;
        pitch = 2.0;
        bank = 0.0;
        gForce = 1.0;
      }
    }

    // =========================================================================
    // ROUTINE 6: corkscrew (コークスクリュー / 連続スパイラルロール)
    // =========================================================================
    else if (this.routineId === 'corkscrew') {
      gear = 0.0;
      airspeed = 115.0;

      if (t < 75.0) {
        phaseName = '連続螺旋コークスクリュー (Continuous Spiral Corkscrew)';
        formationType = 'trail';
        isSmoking = true;
        const cT = t / 75.0;
        const dist = -3200.0 + cT * 6000.0;

        // 5 complete 360-degree helical revolutions (Clockwise / Right-hand corkscrew barrel roll)
        const rotations = 5.0;
        const omega = (rotations * Math.PI * 2.0) / 75.0;
        const helixAngle = cT * Math.PI * 2.0 * rotations;
        const helixRadius = 38.0;
        const vFwd = 80.0;

        // Clockwise / Right-hand orbital position:
        // theta = 0: top (+Y), theta = PI/2: right (+perp07), theta = PI: bottom (-Y), theta = 3PI/2: left (-perp07)
        const perpOffset = helixRadius * Math.sin(helixAngle);
        const altOffset = helixRadius * Math.cos(helixAngle);

        const centerPos = new THREE.Vector3(fwd07X * dist, 240.0, fwd07Z * dist);
        pos.set(
          centerPos.x + perp07X * perpOffset,
          centerPos.y + altOffset,
          centerPos.z + perp07Z * perpOffset
        );

        // Velocity / Tangent forward direction of clockwise helix
        const fwdTangent = new THREE.Vector3(
          fwd07X * vFwd + perp07X * (helixRadius * omega * Math.cos(helixAngle)),
          -helixRadius * omega * Math.sin(helixAngle),
          fwd07Z * vFwd + perp07Z * (helixRadius * omega * Math.cos(helixAngle))
        ).normalize();

        // Right-hand barrel roll basis aligned with tangent forward
        let r0 = new THREE.Vector3().crossVectors(fwdTangent, new THREE.Vector3(0, 1, 0));
        if (r0.lengthSq() < 1e-4) r0.set(1, 0, 0);
        else r0.normalize();
        const u0 = new THREE.Vector3().crossVectors(r0, fwdTangent).normalize();

        const rBanked = new THREE.Vector3().copy(r0).multiplyScalar(Math.cos(helixAngle)).addScaledVector(u0, -Math.sin(helixAngle));
        const uBanked = new THREE.Vector3().copy(r0).multiplyScalar(Math.sin(helixAngle)).addScaledVector(u0, Math.cos(helixAngle));
        const dBack = fwdTangent.clone().negate();

        const rotMat = new THREE.Matrix4().makeBasis(rBanked, uBanked, dBack);
        quaternion = new THREE.Quaternion().setFromRotationMatrix(rotMat);
        forward = fwdTangent;
        useCustomQuat = true;

        heading = (Math.atan2(fwdTangent.x, -fwdTangent.z) * 180.0) / Math.PI;
        pitch = (Math.asin(Math.max(-1, Math.min(1, fwdTangent.y))) * 180.0) / Math.PI;
        bank = (helixAngle * 180.0) / Math.PI;
        airspeed = 120.0;

        // In 5-plane formation mode, planes 1-4 fly straight inline trail inside the helix
        individualPlaneStates = new Array(5).fill(null);
        for (let i = 0; i < 4; i++) {
          const trailDist = dist - i * 22.0;
          const trailPos = new THREE.Vector3(fwd07X * trailDist, 240.0, fwd07Z * trailDist);
          individualPlaneStates[i] = createPlaneState(trailPos, fwd07, 0.0, 110.0, true);
        }
        // Plane 5 is the solo corkscrew jet
        individualPlaneStates[4] = {
          position: pos.clone(),
          quaternion: quaternion.clone(),
          forward: forward.clone(),
          velocity: forward.clone().multiplyScalar(120.0),
          gear: 0.0,
          airbrake: 0.0,
          throttle: 0.85,
          isSmoking: true,
        };

      } else if (t < 100.0) {
        phaseName = '螺旋ロール完了 ＆ デルタ編隊へスムーズ合流 (Rejoining)';
        formationType = 'delta';
        isSmoking = true;
        const rT = (t - 75.0) / 25.0;
        const dist = 2800.0 + rT * 2600.0;
        const centerPos = new THREE.Vector3(fwd07X * dist, 240.0 + rT * 80.0, fwd07Z * dist);

        const ease = rT * rT * (3.0 - 2.0 * rT);
        const topOffset = 38.0 * (1.0 - ease);
        pos.set(centerPos.x, centerPos.y + topOffset, centerPos.z);
        heading = rwyHdgDeg;
        bank = 0.0;
        pitch = 2.0;

        const startPos = new THREE.Vector3(centerPos.x, centerPos.y + 38.0, centerPos.z);
        const endPos = new THREE.Vector3(centerPos.x + perp07X * 32.0 - fwd07X * 32.0, centerPos.y, centerPos.z + perp07Z * 32.0 - fwd07Z * 32.0);

        individualPlaneStates = new Array(5).fill(null);
        for (let i = 0; i < 4; i++) {
          const off = new THREE.Vector3().lerpVectors(trailOffsets[i], deltaOffsets[i], ease);
          const pPos = new THREE.Vector3(centerPos.x + perp07X * off.x - fwd07X * off.z, centerPos.y + off.y, centerPos.z + perp07Z * off.x - fwd07Z * off.z);
          individualPlaneStates[i] = createPlaneState(pPos, fwd07, 0.0, 110.0, true);
        }
        const p5Pos = new THREE.Vector3().lerpVectors(startPos, endPos, ease);
        individualPlaneStates[4] = createPlaneState(p5Pos, fwd07, 0.0, 115.0, true);

      } else {
        phaseName = '5機デルタ編隊 松島湾上空 大旋回 (Bay Orbit)';
        formationType = 'delta';
        customOffsets = deltaOffsets;
        isSmoking = true;
        const fT = (t - 100.0) / 20.0;
        const dist = 5400.0 + fT * 2600.0;
        pos.set(fwd07X * dist, 320.0 + fT * 80.0, fwd07Z * dist);
        heading = rwyHdgDeg;
        bank = 0.0;
        pitch = 2.0;
        individualPlaneStates = null;
      }
    }

    // =========================================================================
    // =========================================================================
    // ROUTINE 7: combat_pitch (コンバット・ピッチ ＆ 滑走路07着陸)
    // =========================================================================
    else if (this.routineId === 'combat_pitch') {
      airspeed = 110.0;
      formationType = 'delta';
      customOffsets = deltaOffsets;

      // Landing staggered formation offsets (Within 45m runway width: +-8m lateral, 25m spacing)
      const landingOffsets = [
        new THREE.Vector3(0, 0, 0),        // #1 Center Lead
        new THREE.Vector3(-8.0, 0, 25.0),  // #2 Left 8m, Trail 25m
        new THREE.Vector3(8.0, 0, 50.0),   // #3 Right 8m, Trail 50m
        new THREE.Vector3(-8.0, 0, 75.0),  // #4 Left 8m, Trail 75m
        new THREE.Vector3(8.0, 0, 100.0),  // #5 Right 8m, Trail 100m
      ];

      // Formation offsets at completion of combat pitch break
      const breakOffsetsAtEnd = [
        new THREE.Vector3(0, 0, 0),
        new THREE.Vector3(-36.0, 6.0, 28.0),
        new THREE.Vector3(36.0, -6.0, 28.0),
        new THREE.Vector3(-60.0, 10.0, 52.0),
        new THREE.Vector3(60.0, -10.0, 52.0),
      ];

      if (t < 30.0) {
        phaseName = '滑走路07軸上 低空進入 (Runway 07 Low Approach)';
        isSmoking = true;
        const inT = t / 30.0;
        const dist = -3200.0 + inT * 3200.0;
        pos.set(fwd07X * dist, 180.0, fwd07Z * dist);
        heading = rwyHdgDeg;
        pitch = 0.0;
        bank = 0.0;
        gear = 0.0;
        airbrake = 0.0;
        airspeed = 110.0;
        customOffsets = deltaOffsets;
      } else if (t < 60.0) {
        phaseName = '連続ローリング・コンバット・ピッチ (Sequential Pitch Break)';
        const t2 = (t - 30.0) / 30.0;
        const breakAngle = t2 * Math.PI;
        const breakR = 750.0;

        const perpOffset = breakR * (1.0 - Math.cos(breakAngle));
        const easeFwd = t2 * t2 * (3.0 - 2.0 * t2);
        const fwdOffset = 200.0 * easeFwd + breakR * Math.sin(breakAngle);

        pos.set(perp07X * perpOffset + fwd07X * fwdOffset, 180.0 - easeFwd * 40.0, perp07Z * perpOffset + fwd07Z * fwdOffset);
        heading = rwyHdgDeg + (breakAngle * 180.0) / Math.PI;
        bank = 52.0 * Math.sin(t2 * Math.PI); // Smooth 2.5G combat pitch break bank
        pitch = 3.5 * Math.sin(t2 * Math.PI);
        gForce = 1.0 + 1.8 * Math.sin(t2 * Math.PI);
        airspeed = 110.0 - t2 * 22.0;
        isSmoking = t2 < 0.7;
        gear = 0.0;

        const breakEase = t2 * t2 * (3.0 - 2.0 * t2);
        customOffsets = [
          new THREE.Vector3(0, 0, 0),
          new THREE.Vector3(-16.0 - breakEase * 20.0, breakEase * 6.0, 16.0 + breakEase * 12.0),
          new THREE.Vector3(16.0 + breakEase * 20.0, -breakEase * 6.0, 16.0 + breakEase * 12.0),
          new THREE.Vector3(-32.0 - breakEase * 28.0, breakEase * 10.0, 32.0 + breakEase * 20.0),
          new THREE.Vector3(32.0 + breakEase * 28.0, -breakEase * 10.0, 32.0 + breakEase * 20.0),
        ];
      } else if (t < 76.0) {
        phaseName = 'ダウンウィンド 隊形再集結 ＆ 脚下げ (Downwind Re-join & Gear Down)';
        isSmoking = false;
        const t3 = (t - 60.0) / 16.0;
        const perpOffset = 1500.0;
        const fwdOffset = 200.0 - t3 * 1300.0;
        const altEase = t3 * t3 * (3.0 - 2.0 * t3);
        const alt = 140.0 - altEase * 40.0;

        pos.set(perp07X * perpOffset + fwd07X * fwdOffset, alt, perp07Z * perpOffset + fwd07Z * fwdOffset);
        heading = rwyHdgDeg + 180.0;
        bank = 0.0;
        pitch = 1.0;
        airspeed = 88.0 - t3 * 10.0;
        gear = Math.min(1.0, Math.max(0.0, (t - 64.0) / 8.0));

        // Smooth gradual formation transition from combat break offsets to landing staggered offsets
        const formLerp = Math.min(1.0, t3 / 0.85);
        const formEase = formLerp * formLerp * (3.0 - 2.0 * formLerp);
        customOffsets = landingOffsets.map((landOff, i) => {
          return new THREE.Vector3().lerpVectors(breakOffsetsAtEnd[i], landOff, formEase);
        });
      } else if (t < 94.0) {
        phaseName = 'ベースレグ旋回進入 (Base Turn to Final)';
        isSmoking = false;
        const t4 = (t - 76.0) / 18.0;
        const turnAngle = t4 * Math.PI;
        const baseR = 750.0;

        const perpOffset = baseR * (1.0 + Math.cos(turnAngle));
        const easeFwd = t4 * t4 * (3.0 - 2.0 * t4);
        const fwdOffset = -1100.0 - 1100.0 * easeFwd - baseR * Math.sin(turnAngle) * 0.4;
        const altEase = t4 * t4 * (3.0 - 2.0 * t4);
        const alt = 100.0 - altEase * 35.0;

        pos.set(perp07X * perpOffset + fwd07X * fwdOffset, alt, perp07Z * perpOffset + fwd07Z * fwdOffset);
        heading = rwyHdgDeg + 180.0 + (turnAngle * 180.0) / Math.PI;
        bank = 36.0 * Math.sin(t4 * Math.PI);
        pitch = 2.0;
        gear = 1.0;
        airbrake = 0.0;
        airspeed = 78.0 - t4 * 13.0;
        customOffsets = landingOffsets;
      } else if (t < 108.0) {
        phaseName = '滑走路07 最終進入 (Runway 07 Final Approach)';
        isSmoking = false;
        gear = 1.0;
        heading = rwyHdgDeg;
        bank = 0.0;
        customOffsets = landingOffsets;

        const t5 = (t - 94.0) / 14.0;
        const dist = -2200.0 + t5 * 1250.0;
        const alt = 2.5 + (1.0 - t5) * 62.5;
        pos.set(fwd07X * dist, alt, fwd07Z * dist);
        pitch = t5 > 0.8 ? 3.5 : 2.5;
        airbrake = 0.0;
        airspeed = 65.0 - t5 * 10.0;
      } else {
        isSmoking = false;
        gear = 1.0;
        heading = rwyHdgDeg;
        bank = 0.0;
        customOffsets = landingOffsets;

        const t6 = (t - 108.0) / 12.0;
        const gT = Math.min(1.0, t6);
        phaseName = gT < 0.95 ? '滑走路07 タッチダウン ＆ 減速滑走 (Touchdown & Rollout)' : '滑走路07 誘導路前 完全停止 (Runway Full Stop)';
        const dist = -950.0 + 1400.0 * (2.0 * gT - gT * gT);
        pos.set(fwd07X * dist, 2.5, fwd07Z * dist);
        pitch = 0.0;
        airbrake = 1.0;
        airspeed = Math.max(0.0, 55.0 * (1.0 - gT));
      }
    }

    // Convert Euler angles to basis rotation matrix and quaternion (gimbal-lock-free)
    if (!useCustomQuat) {
      const hdgRad = (heading * Math.PI) / 180.0;
      const pitchRad = (pitch * Math.PI) / 180.0;
      const bankRad = (bank * Math.PI) / 180.0;

      const fwd = new THREE.Vector3(
        Math.sin(hdgRad) * Math.cos(pitchRad),
        Math.sin(pitchRad),
        -Math.cos(hdgRad) * Math.cos(pitchRad)
      ).normalize();

      let r0 = new THREE.Vector3().crossVectors(fwd, new THREE.Vector3(0, 1, 0));
      if (r0.lengthSq() < 1e-4) r0.set(1, 0, 0);
      else r0.normalize();

      const u0 = new THREE.Vector3().crossVectors(r0, fwd).normalize();
      const rBanked = new THREE.Vector3().copy(r0).multiplyScalar(Math.cos(bankRad)).addScaledVector(u0, -Math.sin(bankRad));
      const uBanked = new THREE.Vector3().copy(r0).multiplyScalar(Math.sin(bankRad)).addScaledVector(u0, Math.cos(bankRad));
      const dBack = new THREE.Vector3().copy(fwd).negate();

      const rotMatrix = new THREE.Matrix4().makeBasis(rBanked, uBanked, dBack);
      quaternion = new THREE.Quaternion().setFromRotationMatrix(rotMatrix);
      forward = fwd;
    }

    return {
      time: t,
      position: pos,
      quaternion: quaternion,
      forward: forward,
      velocity: forward.clone().multiplyScalar(airspeed),
      headingDeg: heading,
      pitchDeg: pitch,
      bankDeg: bank,
      airspeed: airspeed,
      airspeedKt: airspeed * 1.94384,
      mach: airspeed / 340.0,
      altitudeFt: pos.y * 3.28084,
      gForce: gForce,
      gear: gear,
      airbrake: airbrake,
      throttle: airspeed > 100 ? 0.95 : 0.65,
      isSmoking: isSmoking,
      formationType: formationType,
      customOffsets: customOffsets,
      individualPlaneStates: individualPlaneStates,
      phaseName: phaseName,
      totalDuration: this.totalDuration,
    };
  }
}
