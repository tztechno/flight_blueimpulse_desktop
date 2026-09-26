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

class SeamlessAerobaticRoutines {
  constructor(routineId = 'diamond_takeoff') {
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

    // Standard Delta & Diamond reference offsets
    const deltaOffsets = [
      new THREE.Vector3(0, 0, 0),        // #1
      new THREE.Vector3(-16, 0, 16),     // #2
      new THREE.Vector3(16, 0, 16),      // #3
      new THREE.Vector3(-32, 0, 32),     // #4
      new THREE.Vector3(32, 0, 32),      // #5
    ];

    const diamondOffsets = [
      new THREE.Vector3(0, 0, 0),        // #1
      new THREE.Vector3(-18, 0, 18),     // #2
      new THREE.Vector3(18, 0, 18),      // #3
      new THREE.Vector3(0, -2, 36),      // #4
      new THREE.Vector3(32, 0, 32),      // #5
    ];

    const trailOffsets = [
      new THREE.Vector3(0, 0, 0),        // #1
      new THREE.Vector3(0, -1.8, 22),    // #2
      new THREE.Vector3(0, -3.6, 44),    // #3
      new THREE.Vector3(0, -5.4, 66),    // #4
      new THREE.Vector3(32, 0, 32),      // #5
    ];

    // =========================================================================
    // ROUTINE 1: diamond_takeoff
    // =========================================================================
    if (this.routineId === 'diamond_takeoff') {
      formationType = 'diamond';
      if (t < 20.0) {
        phaseName = '1〜4番機 ダイヤモンド離陸滑走 (5番機 待機中)';
        const progress = t / 20.0;
        const dist = -1100.0 + progress * 1600.0;
        airspeed = 35.0 + progress * 55.0;
        gear = 1.0;
        isSmoking = false;
        if (t < 12.0) {
          pos.set(fwd07X * dist, 2.5, fwd07Z * dist);
          pitch = 0.0;
        } else {
          const climbT = (t - 12.0) / 8.0;
          pos.set(fwd07X * dist, 2.5 + climbT * 180.0, fwd07Z * dist);
          pitch = 14.0 * Math.sin(climbT * Math.PI);
        }
        customOffsets = diamondOffsets;
      } else if (t < 52.0) {
        phaseName = '1〜4番機 ダーティーループ (5番機 単独ロールオン離陸)';
        gear = t < 42.0 ? 1.0 : Math.max(0, 1.0 - (t - 42.0) / 4.0);
        isSmoking = true;
        airspeed = 92.0;
        const loopT = (t - 20.0) / 32.0;
        const angle = loopT * Math.PI * 2.0;
        const loopRadius = 450.0;
        const loopCenterY = 182.5 + loopRadius;
        const posY = loopCenterY - loopRadius * Math.cos(angle);
        const distAlongRwy = 500.0 + loopRadius * Math.sin(angle) + loopT * 1350.0;
        pos.set(fwd07X * distAlongRwy, posY, fwd07Z * distAlongRwy);

        // Gimbal-lock-free Loop Orientation
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
        customOffsets = diamondOffsets;

      } else if (t < 72.0) {
        phaseName = t < 60.0 ? '5番機 空中合流アプローチ中' : '4番機・5番機 デルタ隊形展開 ＆ 空中合流';
        gear = 0.0;
        isSmoking = true;
        airspeed = 110.0;
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
        airspeed = 120.0;
        const turnT = (t - 72.0) / 26.0;
        const turnAngle = turnT * Math.PI * 2.0;
        const turnR = 1200.0;

        const posX = fwd07X * 4100.0 + perp07X * (turnR - turnR * Math.cos(turnAngle)) + fwd07X * (turnR * Math.sin(turnAngle));
        const posZ = fwd07Z * 4100.0 + perp07Z * (turnR - turnR * Math.cos(turnAngle)) + fwd07Z * (turnR * Math.sin(turnAngle));

        pos.set(posX, 350.0 + Math.sin(turnT * Math.PI) * 100.0, posZ);
        heading = rwyHdgDeg + (turnAngle * 180.0) / Math.PI;
        bank = 50.0 * Math.sin(turnT * Math.PI);
        pitch = 2.0;
        gForce = 1.6;
        customOffsets = deltaOffsets;
      } else {
        phaseName = '5機デルタ編隊 松島基地上空 高速フライパス';
        formationType = 'delta';
        gear = 0.0;
        isSmoking = true;
        airspeed = 145.0;
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
          p5Pitch = 2.0 + Math.sin(rollOnT * Math.PI) * 20.0;
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
    // ROUTINE 2: delta_loop
    // =========================================================================
    else if (this.routineId === 'delta_loop') {
      formationType = 'delta';
      customOffsets = deltaOffsets;
      gear = 0.0;
      airspeed = 100.0;

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
        airspeed = 105.0;
        const loopT = (t - 30.0) / 35.0;
        const angle = loopT * Math.PI * 2.0;
        const loopRadius = 500.0;
        const loopCenterY = 180.0 + loopRadius;
        const posY = loopCenterY - loopRadius * Math.cos(angle);
        const distAlongRwy = 500.0 + loopRadius * Math.sin(angle) + loopT * 1500.0;
        pos.set(fwd07X * distAlongRwy, posY, fwd07Z * distAlongRwy);

        // Gimbal-lock-free Loop Orientation
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
        gForce = 4.0 + Math.cos(angle) * 1.5;

      } else if (t < 90.0) {
        phaseName = '5機デルタ・ワイドバレルロール (Wide Barrel Roll)';
        isSmoking = true;
        const rT = (t - 65.0) / 25.0;
        const dist = 2000.0 + rT * 2400.0;
        pos.set(fwd07X * dist, 180.0 + Math.sin(rT * Math.PI) * 100.0, fwd07Z * dist);
        pitch = 3.0;
        bank = rT * 360.0;
        gForce = 1.4;
      } else {
        phaseName = '松島湾上空 5機大旋回 ＆ アフターバーナークライム';
        const tT = (t - 90.0) / 30.0;
        const turnAngle = tT * Math.PI * 1.5;
        const turnR = 1400.0;
        const startDist = 4400.0;
        const posX = fwd07X * startDist + perp07X * (turnR - turnR * Math.cos(turnAngle)) + fwd07X * (turnR * Math.sin(turnAngle));
        const posZ = fwd07Z * startDist + perp07Z * (turnR - turnR * Math.cos(turnAngle)) + fwd07Z * (turnR * Math.sin(turnAngle));
        pos.set(posX, 180.0 + tT * 400.0, posZ);
        heading = rwyHdgDeg + (turnAngle * 180.0) / Math.PI;
        bank = 55.0 * Math.sin(tT * Math.PI);
        pitch = 6.0;
        gForce = 1.8;
      }
    }

    // =========================================================================
    // ROUTINE 3: star_cross
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
        pitch = Math.sin(pT * Math.PI * 0.5) * 88.0 * (1.0 - Math.pow(pT, 8));
        gForce = 4.5;
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
    // ROUTINE 4: level_sunrise
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
    // ROUTINE 6: changeover (チェンジオーバーターン)
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
    // ROUTINE 7: corkscrew (コークスクリュー)
    // =========================================================================
    else if (this.routineId === 'corkscrew') {
      gear = 0.0;
      airspeed = 110.0;

      if (t < 75.0) {
        phaseName = '4機インライン直進 ＆ 5番機 螺旋コークスクリュー';
        formationType = 'trail';
        isSmoking = true;
        const cT = t / 75.0;
        const dist = -3200.0 + cT * 6000.0;
        pos.set(fwd07X * dist, 240.0, fwd07Z * dist);
        pitch = 0.0;
        customOffsets = trailOffsets;

        individualPlaneStates = new Array(5).fill(null);
        // 5 complete 360-degree helical revolutions
        const rotations = 5.0;
        const helixAngle = cT * Math.PI * 2.0 * rotations;
        const helixRadius = 38.0;

        const p5Pos = new THREE.Vector3(
          pos.x + perp07X * (Math.cos(helixAngle) * helixRadius),
          pos.y + Math.sin(helixAngle) * helixRadius,
          pos.z + perp07Z * (Math.cos(helixAngle) * helixRadius)
        );

        individualPlaneStates[4] = createPlaneState(p5Pos, fwd07, (helixAngle * 180.0) / Math.PI, 125.0, true);

      } else if (t < 100.0) {
        phaseName = '5機デルタ編隊へスムーズ再編隊 (Rejoining)';
        formationType = 'delta';
        isSmoking = true;
        const rT = (t - 75.0) / 25.0;
        const dist = 2800.0 + rT * 2600.0;
        pos.set(fwd07X * dist, 240.0 + rT * 100.0, fwd07Z * dist);
        pitch = 2.0;

        const ease = rT * rT * (3.0 - 2.0 * rT);
        customOffsets = [
          new THREE.Vector3(0, 0, 0),
          new THREE.Vector3().lerpVectors(trailOffsets[1], deltaOffsets[1], ease),
          new THREE.Vector3().lerpVectors(trailOffsets[2], deltaOffsets[2], ease),
          new THREE.Vector3().lerpVectors(trailOffsets[3], deltaOffsets[3], ease),
          deltaOffsets[4],
        ];

        individualPlaneStates = new Array(5).fill(null);
        const currentDist = 2800.0 + rT * 2600.0;
        const currentPosAtT = new THREE.Vector3(fwd07X * currentDist, 240.0 + rT * 100.0, fwd07Z * currentDist);

        const p5Start = new THREE.Vector3(currentPosAtT.x + perp07X * 38.0, currentPosAtT.y, currentPosAtT.z + perp07Z * 38.0);
        const p5End = new THREE.Vector3(currentPosAtT.x + perp07X * 32.0 - fwd07X * 32.0, currentPosAtT.y, currentPosAtT.z + perp07Z * 32.0 - fwd07Z * 32.0);
        const p5Pos = new THREE.Vector3().lerpVectors(p5Start, p5End, ease);

        individualPlaneStates[4] = createPlaneState(p5Pos, fwd07, 0.0, 120.0, true);

      } else {
        phaseName = '5機デルタ編隊 松島湾上空 大旋回';
        formationType = 'delta';
        customOffsets = deltaOffsets;
        isSmoking = true;
        const fT = (t - 100.0) / 20.0;
        const dist = 5400.0 + fT * 2600.0;
        pos.set(fwd07X * dist, 340.0 + fT * 100.0, fwd07Z * dist);
        heading = rwyHdgDeg;
        bank = 0.0;
        pitch = 2.0;
      }
    }

    // =========================================================================
    // ROUTINE 8: combat_pitch (コンバット・ピッチ)
    // =========================================================================
    else if (this.routineId === 'combat_pitch') {
      airspeed = 110.0;
      formationType = 'delta';
      customOffsets = deltaOffsets;

      if (t < 30.0) {
        phaseName = '滑走路07軸上 低空進入 (Runway 07 Low Approach)';
        isSmoking = true;
        const inT = t / 30.0;
        const dist = -3200.0 + inT * 3200.0;
        pos.set(fwd07X * dist, 250.0, fwd07Z * dist);
        pitch = 0.0;
        gear = 0.0;
      } else if (t < 70.0) {
        phaseName = '連続ローリング・コンバット・ピッチ (Sequential Pitch Break)';
        isSmoking = true;
        const bT = (t - 30.0) / 40.0;
        const breakAngle = bT * Math.PI;
        const breakR = 900.0;

        const posX = perp07X * (breakR - breakR * Math.cos(breakAngle)) + fwd07X * (bT * 2000.0 + breakR * Math.sin(breakAngle));
        const posZ = perp07Z * (breakR - breakR * Math.cos(breakAngle)) + fwd07Z * (bT * 2000.0 + breakR * Math.sin(breakAngle));

        pos.set(posX, 250.0 - bT * 100.0, posZ);
        heading = rwyHdgDeg + (breakAngle * 180.0) / Math.PI;
        bank = 60.0 * Math.sin(bT * Math.PI);
        pitch = 4.0;
        gForce = 2.8;

        const ease = bT * bT * (3.0 - 2.0 * bT);
        customOffsets = [
          new THREE.Vector3(0, 0, 0),
          new THREE.Vector3(-16.0 - ease * 40.0, ease * 15.0, 16.0),
          new THREE.Vector3(16.0 + ease * 40.0, -ease * 15.0, 16.0),
          new THREE.Vector3(-32.0 - ease * 60.0, ease * 25.0, 32.0),
          new THREE.Vector3(32.0, 0, 32.0 + ease * 40.0),
        ];
      } else if (t < 95.0) {
        phaseName = 'ダウンウィンド ＆ ベースレグ旋回進入 (Downwind to Base)';
        isSmoking = false;
        const dT = (t - 70.0) / 25.0;
        const baseAngle = Math.PI + dT * Math.PI;
        const breakR = 900.0;

        const posX = perp07X * (breakR - breakR * Math.cos(baseAngle)) + fwd07X * (2000.0 * (1.0 - dT) + breakR * Math.sin(baseAngle));
        const posZ = perp07Z * (breakR - breakR * Math.cos(baseAngle)) + fwd07Z * (2000.0 * (1.0 - dT) + breakR * Math.sin(baseAngle));

        pos.set(posX, 150.0 - dT * 90.0, posZ);
        heading = rwyHdgDeg + (baseAngle * 180.0) / Math.PI;
        bank = 45.0 * Math.sin(dT * Math.PI);
        pitch = 2.5;
        gear = 1.0;
        airspeed = 70.0;

        const ease = 1.0 - dT;
        customOffsets = [
          new THREE.Vector3(0, 0, 0),
          new THREE.Vector3(-16.0 - ease * 40.0, ease * 15.0, 16.0),
          new THREE.Vector3(16.0 + ease * 40.0, -ease * 15.0, 16.0),
          new THREE.Vector3(-32.0 - ease * 60.0, ease * 25.0, 32.0),
          new THREE.Vector3(32.0, 0, 32.0 + ease * 40.0),
        ];
      } else {
        phaseName = '最終進入 (Final) ＆ 滑走路07タッチダウン・減速滑走';
        isSmoking = false;
        const fT = (t - 95.0) / 25.0;
        const dist = fT * 1800.0;
        const alt = Math.max(2.5, 60.0 - fT * 60.0);
        pos.set(fwd07X * dist, alt, fwd07Z * dist);
        heading = rwyHdgDeg;
        bank = 0.0;
        pitch = alt > 3.0 ? 3.0 : 0.0;
        gear = 1.0;
        airbrake = alt <= 3.0 ? 1.0 : 0.0;
        airspeed = Math.max(0.0, 65.0 - fT * 45.0);
        customOffsets = deltaOffsets;
      }
    }

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

// Audit
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
const MAX_ALLOWED_STEP_DIST = 15.0;
const COLLISION_THRESHOLD = 6.5;

let totalAuditIssues = 0;

routines.forEach((rId) => {
  const routine = new SeamlessAerobaticRoutines(rId);
  console.log(`\n--- Auditing Seamless Routine: [${rId}] ---`);

  let maxStepDist = 0;
  let maxStepTime = 0;
  let maxStepPlane = 0;
  let prevPositions = null;
  let minPlaneDist = Infinity;
  let minPlaneTime = 0;
  let minPlanePair = [0, 0];

  const discontinuities = [];
  const collisions = [];

  for (let t = 0; t <= routine.totalDuration; t += dt) {
    const frame = routine.sample(t);
    const planePositions = [];

    const leaderPos = frame.position;
    const leaderQuat = frame.quaternion;

    for (let i = 0; i < 5; i++) {
      if (frame.individualPlaneStates && frame.individualPlaneStates[i]) {
        planePositions.push(frame.individualPlaneStates[i].position.clone());
      } else if (i === 0) {
        planePositions.push(leaderPos.clone());
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
      }
    }

    if (prevPositions) {
      for (let i = 0; i < 5; i++) {
        const d = prevPositions[i].distanceTo(planePositions[i]);
        if (d > maxStepDist) {
          maxStepDist = d;
          maxStepTime = t;
          maxStepPlane = i + 1;
        }
        if (d > MAX_ALLOWED_STEP_DIST) {
          discontinuities.push({
            time: t.toFixed(2),
            plane: i + 1,
            jumpDist: d.toFixed(1),
            fromPos: `(${prevPositions[i].x.toFixed(0)}, ${prevPositions[i].y.toFixed(0)}, ${prevPositions[i].z.toFixed(0)})`,
            toPos: `(${planePositions[i].x.toFixed(0)}, ${planePositions[i].y.toFixed(0)}, ${planePositions[i].z.toFixed(0)})`,
          });
        }
      }
    }
    prevPositions = planePositions;

    for (let i = 0; i < 5; i++) {
      for (let j = i + 1; j < 5; j++) {
        const dist = planePositions[i].distanceTo(planePositions[j]);
        if (dist < minPlaneDist && (planePositions[i].y > 5.0 || planePositions[j].y > 5.0)) {
          minPlaneDist = dist;
          minPlaneTime = t;
          minPlanePair = [i + 1, j + 1];
        }
        if (dist < COLLISION_THRESHOLD && (planePositions[i].y > 5.0 || planePositions[j].y > 5.0)) {
          if (collisions.length === 0 || Math.abs(t - collisions[collisions.length - 1].time) > 1.0) {
            collisions.push({
              time: t.toFixed(2),
              pair: `#${i + 1} & #${j + 1}`,
              dist: dist.toFixed(2),
            });
          }
        }
      }
    }
  }

  console.log(`  Max Step / 50ms: ${maxStepDist.toFixed(2)}m (Plane #${maxStepPlane} at t=${maxStepTime.toFixed(2)}s)`);
  console.log(`  Min Separation: ${minPlaneDist.toFixed(2)}m (#${minPlanePair[0]} ↔ #${minPlanePair[1]} at t=${minPlaneTime.toFixed(2)}s)`);

  if (discontinuities.length > 0) {
    console.log(`  ❌ DISCONTINUITIES FOUND (${discontinuities.length} occurrences):`);
    discontinuities.slice(0, 5).forEach((d) => {
      console.log(`     t=${d.time}s: Plane #${d.plane} jumped ${d.jumpDist}m from ${d.fromPos} to ${d.toPos}`);
    });
    totalAuditIssues += discontinuities.length;
  } else {
    console.log(`  ✅ Continuity: PERFECT (No teleports)`);
  }

  if (collisions.length > 0) {
    console.log(`  ⚠️ COLLISIONS FOUND (${collisions.length} occurrences):`);
    collisions.slice(0, 5).forEach((c) => {
      console.log(`     t=${c.time}s: Planes ${c.pair} closer than ${COLLISION_THRESHOLD}m (dist=${c.dist}m)`);
    });
    totalAuditIssues += collisions.length;
  } else {
    console.log(`  ✅ Separation: SAFE (No collisions)`);
  }
});

console.log(`\n========================================`);
console.log(`TOTAL ISSUES: ${totalAuditIssues}`);
