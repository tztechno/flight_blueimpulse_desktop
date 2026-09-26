/**
 * AircraftModel.js
 * Builds and animates an authentic 3D Kawasaki T-4 Blue Impulse jet trainer.
 * Features realistic Blue Impulse white/cobalt-blue livery, tandem cockpit canopy with pilot,
 * twin IHI F3 engine exhaust nozzles with dynamic afterburner heat/thrust glow,
 * landing gears, animated ailerons, elevators, rudder, speedbrake, nav/strobe lights,
 * and customizable aircraft number (#1 through #6).
 */

import * as THREE from 'three';

export class AircraftModel {
  constructor(aircraftNumber = 1) {
    this.aircraftNumber = aircraftNumber;
    this.mesh = new THREE.Group();
    this.mesh.name = `BlueImpulse_T4_No${aircraftNumber}`;

    this.gearGroup = new THREE.Group();
    this.speedBrake = null;
    this.aileronLeft = null;
    this.aileronRight = null;
    this.elevatorLeft = null;
    this.elevatorRight = null;
    this.rudder = null;

    this.exhaustGlows = [];
    this.navLights = [];
    this.strobeLights = [];

    // Local coordinates for smoke nozzle emission points (twin engines)
    this.smokeNozzleLeft = new THREE.Vector3(-0.45, 0.05, 5.2);
    this.smokeNozzleRight = new THREE.Vector3(0.45, 0.05, 5.2);

    this.currentLivery = 'standard';
    this.isPlayer = false;
    this.playerMarker = null;

    // Collision boundary radius (meters) for Kawasaki T-4 (Length: 13.0m, Wingspan: 9.9m)
    this.collisionRadius = 5.2;

    this.build();
  }

  build() {
    // 1. Textures & Materials
    this.whiteMat = new THREE.MeshStandardMaterial({
      color: 0xfafcff,
      roughness: 0.25,
      metalness: 0.15,
    });

    this.blueMat = new THREE.MeshStandardMaterial({
      color: 0x003f9e, // JASDF Blue Impulse deep ultramarine
      roughness: 0.2,
      metalness: 0.25,
    });

    this.glassMat = new THREE.MeshStandardMaterial({
      color: 0x112838,
      roughness: 0.1,
      metalness: 0.85,
      transparent: true,
      opacity: 0.75,
    });

    this.metalMat = new THREE.MeshStandardMaterial({
      color: 0x22262c,
      roughness: 0.4,
      metalness: 0.8,
    });

    this.pilotSuitMat = new THREE.MeshStandardMaterial({ color: 0x002e6b, roughness: 0.6 });
    this.pilotHelmetMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.3 });
    this.pilotVisorMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.1, metalness: 0.9 });

    // Aircraft Number Texture Canvas (Dynamic procedural decal for #1 to #6)
    this.numberTex = this.createNumberTexture(this.aircraftNumber);
    this.numberMat = new THREE.MeshBasicMaterial({
      map: this.numberTex,
      transparent: true,
    });

    // 2. Main Fuselage (Kawasaki T-4: Length 13.0m)
    // Forward-to-aft cylinder and nose cone. In local coords: -Z is Forward (Nose), +Z is Aft (Tail)
    const bodyGeo = new THREE.CylinderGeometry(0.72, 0.68, 7.5, 20);
    bodyGeo.rotateX(Math.PI / 2);
    this.bodyMesh = new THREE.Mesh(bodyGeo, this.whiteMat);
    this.bodyMesh.castShadow = true;
    this.bodyMesh.receiveShadow = true;
    this.bodyMesh.position.set(0, 0, 0.5);
    this.mesh.add(this.bodyMesh);

    // Aerodynamic Nose Cone (T-4 pointed radome nose with pitot tube)
    const noseGeo = new THREE.ConeGeometry(0.72, 4.2, 20);
    noseGeo.rotateX(-Math.PI / 2);
    this.noseMesh = new THREE.Mesh(noseGeo, this.whiteMat);
    this.noseMesh.position.set(0, -0.05, -5.3);
    this.mesh.add(this.noseMesh);

    // Pitot Tube (Nose needle)
    const pitotGeo = new THREE.CylinderGeometry(0.015, 0.02, 1.2, 8);
    pitotGeo.rotateX(Math.PI / 2);
    const pitotMesh = new THREE.Mesh(pitotGeo, this.metalMat);
    pitotMesh.position.set(0, -0.05, -7.8);
    this.mesh.add(pitotMesh);

    // Fuselage Blue Stripe Accent (Vibrant Blue Impulse Swoosh)
    const blueStripeGeo = new THREE.CylinderGeometry(0.73, 0.69, 7.2, 20, 1, true, -Math.PI / 3, (2 * Math.PI) / 3);
    blueStripeGeo.rotateX(Math.PI / 2);
    this.blueStripeMesh = new THREE.Mesh(blueStripeGeo, this.blueMat);
    this.blueStripeMesh.position.set(0, -0.02, 0.5);
    this.mesh.add(this.blueStripeMesh);

    // 3. Tandem Cockpit Canopy (2-Seater: Front Pilot & Rear Pilot/Instructor)
    const canopyGeo = new THREE.CylinderGeometry(0.55, 0.68, 3.8, 16);
    canopyGeo.rotateX(Math.PI / 2);
    canopyGeo.scale(0.85, 1.0, 1.0);
    this.canopyMesh = new THREE.Mesh(canopyGeo, this.glassMat);
    this.canopyMesh.position.set(0, 0.55, -2.4);
    this.mesh.add(this.canopyMesh);

    // Canopy Frame (White arch)
    const archGeo = new THREE.TorusGeometry(0.6, 0.04, 8, 16, Math.PI);
    archGeo.rotateY(Math.PI / 2);
    this.archMesh = new THREE.Mesh(archGeo, this.whiteMat);
    this.archMesh.position.set(0, 0.55, -2.4);
    this.mesh.add(this.archMesh);

    // Pilot 1 (Front Pilot - Local position for cockpit FPV)
    const pilot1Group = new THREE.Group();
    pilot1Group.position.set(0, 0.35, -3.2);
    const p1Body = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.45, 0.3), this.pilotSuitMat);
    this.p1Head = new THREE.Mesh(new THREE.SphereGeometry(0.18, 12, 12), this.pilotHelmetMat);
    this.p1Head.position.set(0, 0.32, 0);
    const p1Visor = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.1, 0.16), this.pilotVisorMat);
    p1Visor.position.set(0, 0.33, -0.1);
    pilot1Group.add(p1Body, this.p1Head, p1Visor);
    this.mesh.add(pilot1Group);

    // Pilot 2 (Rear Seat)
    const pilot2Group = pilot1Group.clone();
    pilot2Group.position.set(0, 0.5, -1.8);
    this.mesh.add(pilot2Group);

    // 4. Twin Air Intakes (Left & Right fuselage sides)
    const intakeGeo = new THREE.BoxGeometry(0.35, 0.55, 1.8);
    this.intakeL = new THREE.Mesh(intakeGeo, this.blueMat);
    this.intakeL.position.set(-0.75, 0.05, -0.6);
    this.intakeL.rotation.y = -0.08;
    this.mesh.add(this.intakeL);

    this.intakeR = new THREE.Mesh(intakeGeo, this.blueMat);
    this.intakeR.position.set(0.75, 0.05, -0.6);
    this.intakeR.rotation.y = 0.08;
    this.mesh.add(this.intakeR);

    // 5. Main Swept Wings (Wingspan 9.9m)
    // T-4 high-subsonic swept wing with 7° anhedral droop
    const wingShape = new THREE.Shape();
    wingShape.moveTo(0, -1.8);
    wingShape.lineTo(4.95, 0.8);
    wingShape.lineTo(4.85, 1.4);
    wingShape.lineTo(0, 1.1);
    wingShape.closePath();

    const wingExtrude = { depth: 0.14, bevelEnabled: true, bevelSegments: 2, steps: 1, bevelSize: 0.03, bevelThickness: 0.03 };
    const wingGeo = new THREE.ExtrudeGeometry(wingShape, wingExtrude);
    wingGeo.rotateX(Math.PI / 2);

    // Right Wing (+X)
    this.rightWingMesh = new THREE.Mesh(wingGeo, this.whiteMat);
    this.rightWingMesh.position.set(0, 0.1, 0.2);
    this.rightWingMesh.rotation.z = 0.06; // 7° anhedral droop
    this.mesh.add(this.rightWingMesh);

    // Left Wing (-X)
    const leftWingGeo = wingGeo.clone();
    leftWingGeo.scale(-1, 1, 1);
    this.leftWingMesh = new THREE.Mesh(leftWingGeo, this.whiteMat);
    this.leftWingMesh.position.set(0, 0.1, 0.2);
    this.leftWingMesh.rotation.z = -0.06;
    this.mesh.add(this.leftWingMesh);

    // Wing Top Blue Graphics / Chevrons
    const wingGraphicGeo = new THREE.PlaneGeometry(3.5, 0.8);
    wingGraphicGeo.rotateX(-Math.PI / 2);
    this.wingGraphicR = new THREE.Mesh(wingGraphicGeo, this.blueMat);
    this.wingGraphicR.position.set(2.4, 0.21, 0.6);
    this.wingGraphicR.rotation.y = -0.42;
    this.wingGraphicR.rotation.z = 0.06;
    this.mesh.add(this.wingGraphicR);

    this.wingGraphicL = new THREE.Mesh(wingGraphicGeo, this.blueMat);
    this.wingGraphicL.position.set(-2.4, 0.21, 0.6);
    this.wingGraphicL.rotation.y = 0.42;
    this.wingGraphicL.rotation.z = -0.06;
    this.mesh.add(this.wingGraphicL);

    // Wingtip Smoke / Missile Pods
    const tipPodGeo = new THREE.CylinderGeometry(0.08, 0.08, 1.4, 10);
    tipPodGeo.rotateX(Math.PI / 2);
    this.tipPodL = new THREE.Mesh(tipPodGeo, this.blueMat);
    this.tipPodL.position.set(-4.95, -0.22, 1.1);
    this.mesh.add(this.tipPodL);

    this.tipPodR = new THREE.Mesh(tipPodGeo, this.blueMat);
    this.tipPodR.position.set(4.95, -0.22, 1.1);
    this.mesh.add(this.tipPodR);

    // 6. Hinomaru Roundels (Red sun discs on wings)
    const hinomaruGeo = new THREE.CircleGeometry(0.35, 20);
    hinomaruGeo.rotateX(-Math.PI / 2);
    this.hinomaruMat = new THREE.MeshBasicMaterial({ color: 0xd9001b });
    this.hinoL = new THREE.Mesh(hinomaruGeo, this.hinomaruMat);
    this.hinoL.position.set(-3.2, 0.22, 0.3);
    this.hinoL.rotation.z = -0.06;
    this.mesh.add(this.hinoL);

    this.hinoR = new THREE.Mesh(hinomaruGeo, this.hinomaruMat);
    this.hinoR.position.set(3.2, 0.22, 0.3);
    this.hinoR.rotation.z = 0.06;
    this.mesh.add(this.hinoR);

    // 7. Vertical Stabilizer (Tail Fin) with Aircraft Number (#1-#6)
    const finShape = new THREE.Shape();
    finShape.moveTo(0, 0);
    finShape.lineTo(2.4, 3.2);
    finShape.lineTo(3.3, 3.0);
    finShape.lineTo(2.8, 0);
    finShape.closePath();

    const finGeo = new THREE.ExtrudeGeometry(finShape, { depth: 0.12, bevelEnabled: false });
    this.finMesh = new THREE.Mesh(finGeo, this.blueMat);
    this.finMesh.rotation.y = -Math.PI / 2;
    this.finMesh.position.set(0.06, 0.55, 2.2);
    this.finMesh.castShadow = true;
    this.mesh.add(this.finMesh);

    // Aircraft Number Decal on both sides of tail fin
    const numDecalGeo = new THREE.PlaneGeometry(0.8, 0.8);
    numDecalGeo.rotateY(Math.PI / 2);
    this.numDecalR = new THREE.Mesh(numDecalGeo, this.numberMat);
    this.numDecalR.position.set(0.07, 2.4, 3.6);
    this.mesh.add(this.numDecalR);

    this.numDecalL = new THREE.Mesh(numDecalGeo, this.numberMat);
    this.numDecalL.position.set(-0.07, 2.4, 3.6);
    this.numDecalL.rotation.y = Math.PI;
    this.mesh.add(this.numDecalL);

    // 8. Horizontal Tailerons / Elevators (Anhedral sweep)
    const hStabGeo = new THREE.BoxGeometry(3.6, 0.08, 1.2);
    this.elevatorLeft = new THREE.Mesh(hStabGeo, this.whiteMat);
    this.elevatorLeft.position.set(0, 0.2, 4.2);
    this.elevatorLeft.rotation.z = 0.08;
    this.mesh.add(this.elevatorLeft);

    // 9. Twin IHI F3 Turbofan Engine Exhausts
    const nozzleGeo = new THREE.CylinderGeometry(0.32, 0.34, 0.8, 16);
    nozzleGeo.rotateX(Math.PI / 2);

    const nozzleL = new THREE.Mesh(nozzleGeo, this.metalMat);
    nozzleL.position.set(-0.45, 0.05, 4.8);
    this.mesh.add(nozzleL);

    const nozzleR = new THREE.Mesh(nozzleGeo, this.metalMat);
    nozzleR.position.set(0.45, 0.05, 4.8);
    this.mesh.add(nozzleR);

    // Exhaust Thrust Core Fire / Heat Glow (Inner cylinders)
    const glowGeo = new THREE.CylinderGeometry(0.24, 0.28, 0.4, 16);
    glowGeo.rotateX(Math.PI / 2);
    const glowMat = new THREE.MeshBasicMaterial({ color: 0xffaa44, transparent: true, opacity: 0.85 });

    const glowL = new THREE.Mesh(glowGeo, glowMat);
    glowL.position.set(-0.45, 0.05, 5.05);
    this.mesh.add(glowL);
    this.exhaustGlows.push(glowL);

    const glowR = new THREE.Mesh(glowGeo, glowMat);
    glowR.position.set(0.45, 0.05, 5.05);
    this.mesh.add(glowR);
    this.exhaustGlows.push(glowR);

    // 10. Speed Brake (Dorsal fuselage door)
    const brakeGeo = new THREE.BoxGeometry(0.65, 0.08, 1.4);
    this.speedBrake = new THREE.Mesh(brakeGeo, this.blueMat);
    this.speedBrake.position.set(0, 0.72, 1.4);
    this.mesh.add(this.speedBrake);

    // 11. Landing Gears
    this.buildLandingGears();
    this.mesh.add(this.gearGroup);

    // 12. Navigation Lights & Strobes
    this.buildLights();

    // 13. 3D Player Indicator Marker (YOU / MANUAL PILOT)
    this.buildPlayerMarker();
  }

  buildPlayerMarker() {
    this.playerMarkerGroup = new THREE.Group();
    this.playerMarkerGroup.position.set(0, 3.8, -0.5);
    this.playerMarkerGroup.visible = false;

    // Glowing Halo Ring above Jet
    const ringGeo = new THREE.TorusGeometry(1.6, 0.08, 12, 32);
    ringGeo.rotateX(Math.PI / 2);
    this.markerRingMat = new THREE.MeshBasicMaterial({
      color: 0xffd700,
      transparent: true,
      opacity: 0.9,
    });
    const ringMesh = new THREE.Mesh(ringGeo, this.markerRingMat);
    this.playerMarkerGroup.add(ringMesh);

    // Glowing Downward Pointer Arrow
    const pointerGeo = new THREE.ConeGeometry(0.4, 0.9, 16);
    pointerGeo.rotateX(Math.PI);
    this.markerPointerMat = new THREE.MeshBasicMaterial({
      color: 0xffe066,
      transparent: true,
      opacity: 0.95,
    });
    const pointerMesh = new THREE.Mesh(pointerGeo, this.markerPointerMat);
    pointerMesh.position.set(0, -0.5, 0);
    this.playerMarkerGroup.add(pointerMesh);

    // Procedural "👑 YOU (MANUAL)" floating billboard badge
    this.badgeTex = this.createPlayerBadgeTexture();
    const badgeGeo = new THREE.PlaneGeometry(3.6, 0.9);
    this.badgeMat = new THREE.MeshBasicMaterial({
      map: this.badgeTex,
      transparent: true,
      side: THREE.DoubleSide,
      depthTest: false,
    });
    this.badgeMesh = new THREE.Mesh(badgeGeo, this.badgeMat);
    this.badgeMesh.position.set(0, 1.2, 0);
    this.playerMarkerGroup.add(this.badgeMesh);

    this.mesh.add(this.playerMarkerGroup);
  }

  createPlayerBadgeTexture(cfg = null) {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, 512, 128);

    const borderColor = cfg ? (cfg.textColor || '#ffd700') : '#ffd700';

    // Rounded Pill Badge Background
    ctx.fillStyle = 'rgba(8, 14, 28, 0.92)';
    ctx.strokeStyle = borderColor;
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.roundRect(8, 8, 496, 112, 32);
    ctx.fill();
    ctx.stroke();

    // Text: 👑 YOU (#1 MANUAL)
    ctx.fillStyle = borderColor;
    ctx.font = '900 44px "Outfit", "Arial Black", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowColor = '#000000';
    ctx.shadowBlur = 10;
    ctx.fillText(`👑 YOU (手動操縦 #${this.aircraftNumber})`, 256, 64);

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    return texture;
  }

  setPlayerStatus(isPlayer, liveryId = 'gold', showMarker = true) {
    this.isPlayer = isPlayer;
    if (this.playerMarkerGroup) {
      this.playerMarkerGroup.visible = isPlayer && showMarker;
    }
    if (isPlayer) {
      this.setLivery(liveryId);
    } else {
      this.setLivery('standard');
    }
  }

  setLivery(liveryId = 'standard') {
    this.currentLivery = liveryId;

    const LIVERIES = {
      standard: {
        white: 0xffffff, // Crisp Clean White
        accent: 0x003f9e, // JASDF Cobalt Blue
        glass: 0x112838,
        glassOpacity: 0.75,
        roughness: 0.2,
        metalness: 0.1,
        helmet: 0xffffff,
        suit: 0x002e6b,
        markerColor: 0x00d2ff,
        textColor: '#003f9e',
        textBg: '#ffffff',
      },
      gold: {
        white: 0xffffff, // Crisp Clean White Base
        accent: 0xf5a623, // Bright Radiant Gold Accent
        glass: 0x112838,
        glassOpacity: 0.75,
        roughness: 0.18,
        metalness: 0.25,
        helmet: 0xffd700, // Gold Pilot Helmet
        suit: 0x002e6b,
        markerColor: 0xffb700,
        textColor: '#e59400',
        textBg: '#ffffff',
      },
      red: {
        white: 0xffffff, // Crisp Clean White Base
        accent: 0xe60012, // Bright Acro Crimson Red Accent
        glass: 0x112838,
        glassOpacity: 0.75,
        roughness: 0.18,
        metalness: 0.15,
        helmet: 0xe60012, // Red Helmet
        suit: 0x8a0c14,
        markerColor: 0xff3344,
        textColor: '#e60012',
        textBg: '#ffffff',
      },
      neon: {
        white: 0xffffff, // Crisp Clean White Base
        accent: 0x00a8e8, // Vivid Cyan Blue Accent
        glass: 0x112838,
        glassOpacity: 0.75,
        roughness: 0.18,
        metalness: 0.2,
        helmet: 0x00c8ff,
        suit: 0x052a42,
        markerColor: 0x00c8ff,
        textColor: '#0088cc',
        textBg: '#ffffff',
      },
      stealth: {
        white: 0xffffff, // Crisp Clean White Base
        accent: 0xff6b00, // Bright High-Vis Aerobatic Orange Accent
        glass: 0x112838,
        glassOpacity: 0.75,
        roughness: 0.18,
        metalness: 0.15,
        helmet: 0xff6b00,
        suit: 0x222222,
        markerColor: 0xff7700,
        textColor: '#ff6600',
        textBg: '#ffffff',
      },
      sakura: {
        white: 0xffffff, // Crisp Clean White Base
        accent: 0xff3388, // Vivid Sakura Pink Accent
        glass: 0x112838,
        glassOpacity: 0.75,
        roughness: 0.18,
        metalness: 0.15,
        helmet: 0xff3388,
        suit: 0x4a1830,
        markerColor: 0xff4081,
        textColor: '#ff3388',
        textBg: '#ffffff',
      },
    };

    const cfg = LIVERIES[liveryId] || LIVERIES.standard;

    // Apply colors to materials
    if (this.whiteMat) {
      this.whiteMat.color.setHex(cfg.white);
      this.whiteMat.roughness = cfg.roughness;
      this.whiteMat.metalness = cfg.metalness;
    }
    if (this.blueMat) {
      this.blueMat.color.setHex(cfg.accent);
      this.blueMat.roughness = cfg.roughness;
      this.blueMat.metalness = cfg.metalness;
    }
    if (this.glassMat) {
      this.glassMat.color.setHex(cfg.glass);
      this.glassMat.opacity = cfg.glassOpacity;
    }
    if (this.pilotHelmetMat) {
      this.pilotHelmetMat.color.setHex(cfg.helmet);
    }
    if (this.pilotSuitMat) {
      this.pilotSuitMat.color.setHex(cfg.suit);
    }
    if (this.markerRingMat) {
      this.markerRingMat.color.setHex(cfg.markerColor);
    }
    if (this.markerPointerMat) {
      this.markerPointerMat.color.setHex(cfg.markerColor);
    }

    // Refresh tail decal with matching style
    this.updateNumberDecal(cfg);

    // Refresh player badge texture with matching livery border/text
    if (this.badgeMesh) {
      const newBadgeTex = this.createPlayerBadgeTexture(cfg);
      this.badgeMesh.material.map = newBadgeTex;
      this.badgeMesh.material.needsUpdate = true;
    }
  }

  updateNumberDecal(cfg) {
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, 128, 128);

    ctx.fillStyle = cfg.textColor || '#ffffff';
    ctx.font = 'bold 96px "Outfit", "Arial Black", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowColor = '#000000';
    ctx.shadowBlur = 8;
    ctx.fillText(`${this.aircraftNumber}`, 64, 64);

    if (this.numberTex) {
      this.numberTex.image = canvas;
      this.numberTex.needsUpdate = true;
    }
  }

  createNumberTexture(number) {
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, 128, 128);

    // Crisp bold number in yellow/white with drop shadow
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 96px "Outfit", "Arial Black", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowColor = '#000000';
    ctx.shadowBlur = 8;
    ctx.fillText(`${number}`, 64, 64);

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    return texture;
  }

  buildLandingGears() {
    const strutMat = new THREE.MeshStandardMaterial({ color: 0x88929b, metalness: 0.85, roughness: 0.2 });
    const tireMat = new THREE.MeshStandardMaterial({ color: 0x1a1a1c, roughness: 0.9 });

    const strutGeo = new THREE.CylinderGeometry(0.06, 0.06, 1.3, 10);
    const tireGeo = new THREE.CylinderGeometry(0.24, 0.24, 0.16, 14);
    tireGeo.rotateZ(Math.PI / 2);

    // Nose Gear (Forward at z = -4.0)
    const noseStrut = new THREE.Mesh(strutGeo, strutMat);
    noseStrut.position.set(0, -0.9, -3.8);
    const noseTire = new THREE.Mesh(tireGeo, tireMat);
    noseTire.position.set(0, -1.45, -3.8);
    this.gearGroup.add(noseStrut, noseTire);

    // Main Left Gear (x = -1.2, z = 0.8)
    const mainLStrut = new THREE.Mesh(strutGeo, strutMat);
    mainLStrut.position.set(-1.2, -0.9, 0.8);
    const mainLTire = new THREE.Mesh(tireGeo, tireMat);
    mainLTire.position.set(-1.2, -1.45, 0.8);
    this.gearGroup.add(mainLStrut, mainLTire);

    // Main Right Gear (x = 1.2, z = 0.8)
    const mainRStrut = new THREE.Mesh(strutGeo, strutMat);
    mainRStrut.position.set(1.2, -0.9, 0.8);
    const mainRTire = new THREE.Mesh(tireGeo, tireMat);
    mainRTire.position.set(1.2, -1.45, 0.8);
    this.gearGroup.add(mainRStrut, mainRTire);
  }

  buildLights() {
    // Wingtip Nav Lights: Left Red, Right Green
    const redLight = new THREE.PointLight(0xff0022, 2.0, 30);
    redLight.position.set(-4.95, -0.22, 1.1);
    this.mesh.add(redLight);
    this.navLights.push(redLight);

    const greenLight = new THREE.PointLight(0x00ff44, 2.0, 30);
    greenLight.position.set(4.95, -0.22, 1.1);
    this.mesh.add(greenLight);
    this.navLights.push(greenLight);

    // Formation Belly & Tail Strobes (Bright white)
    const strobe = new THREE.PointLight(0xffffff, 4.0, 50);
    strobe.position.set(0, 3.4, 4.5);
    this.mesh.add(strobe);
    this.strobeLights.push(strobe);
  }

  getSmokeWorldPositions() {
    const pL = this.smokeNozzleLeft.clone();
    const pR = this.smokeNozzleRight.clone();
    pL.applyMatrix4(this.mesh.matrixWorld);
    pR.applyMatrix4(this.mesh.matrixWorld);
    return [pL, pR];
  }

  getWorldPosition() {
    const pos = new THREE.Vector3();
    this.mesh.getWorldPosition(pos);
    return pos;
  }

  updateAnimation(state = {}, camera = null) {
    // 1. Gear Deploy / Retract
    const gearRatio = state.gear !== undefined ? state.gear : 1.0;
    this.gearGroup.position.y = (gearRatio - 1.0) * 1.5;
    this.gearGroup.visible = gearRatio > 0.05;

    // 2. Speed Brake (Dorsal airbrake opens up to 55°)
    const brakeVal = state.airbrake || 0.0;
    if (this.speedBrake) {
      this.speedBrake.rotation.x = (brakeVal * 55.0 * Math.PI) / 180.0;
    }

    // 3. Throttle & Afterburner Glow Intensity
    const throttle = state.throttle !== undefined ? state.throttle : 0.6;
    const glowScale = 0.5 + throttle * 0.9;
    const glowColor = throttle > 0.85 ? 0x66bbff : (throttle > 0.5 ? 0xffaa44 : 0xff5511);
    this.exhaustGlows.forEach(g => {
      g.scale.set(glowScale, glowScale, 1.0 + throttle * 0.8);
      g.material.color.setHex(glowColor);
      g.material.opacity = 0.4 + throttle * 0.55;
    });

    // 4. Strobe Blinking
    const time = performance.now() * 0.001;
    const strobeOn = Math.floor(time * 2.0) % 2 === 0;
    this.strobeLights.forEach(l => (l.intensity = strobeOn ? 4.0 : 0.0));

    // 5. Player Marker Ring Pulse / Spin & Billboard Badge
    if (this.playerMarkerGroup && this.playerMarkerGroup.visible) {
      const ringMesh = this.playerMarkerGroup.children[0];
      if (ringMesh) {
        ringMesh.rotation.z = time * 1.5;
        const scale = 1.0 + Math.sin(time * 4.0) * 0.08;
        ringMesh.scale.set(scale, scale, scale);
      }

      if (this.badgeMesh && camera) {
        // Orient badge towards active camera
        this.badgeMesh.quaternion.copy(camera.quaternion);
        // Cancel out parent mesh rotation
        const invParent = this.mesh.quaternion.clone().invert();
        this.badgeMesh.quaternion.premultiply(invParent);
      }
    }
  }
}
