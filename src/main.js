/**
 * main.js
 * Master orchestrator for Blue Impulse Matsushima Air Base (RJST) Flight Simulator.
 * Features completely separated 5-Ship Formation mode vs 1-Ship Solo mode,
 * selectable Cockpit Views (#1 to #5) in Auto Spectator, and Boarded Aircraft selection (#1 to #5) in Manual Flight.
 */

import * as THREE from 'three';
import { AerobaticRoutines } from './sim/AerobaticRoutines.js';
import { FreeFlightSim } from './sim/FreeFlightSim.js';
import { FlightAudio } from './sim/FlightAudio.js';
import { FlightInstruments } from './sim/FlightInstruments.js';
import { AirportScene } from './scene/AirportScene.js';
import { CameraController } from './scene/CameraController.js';
import { ControlPanel } from './ui/ControlPanel.js';
import { TelemetryUI } from './ui/TelemetryUI.js';
import { ViewSelector } from './ui/ViewSelector.js';
import { i18n } from './i18n/translations.js';

class BlueImpulseApp {
  constructor() {
    this.container = document.getElementById('viewport-container');
    this.pfdCanvas = document.getElementById('pfd-canvas');
    this.langToggleBtn = document.getElementById('lang-toggle-btn');
    this.crashOverlay = document.getElementById('crash-overlay');
    this.crashRestartBtn = document.getElementById('crash-restart-btn');

    // Primary State
    this.mainMode = '5_planes'; // '5_planes' or '1_plane'
    this.flightMode = 'auto'; // 'auto' (演目鑑賞) or 'manual' (手動操縦)
    this.planeCount = 5;
    this.boardedAircraft = '1_lead'; // '1_lead', '2_wing', '3_wing', '4_slot', '5_solo'
    this.showInstructions = true; // Flight instruction overlay enabled by default
    this.pilotLivery = 'gold'; // 'gold', 'red', 'neon', 'stealth', 'sakura', 'standard'
    this.showPlayerMarker = true;
    this.isCrashed = false;
    this.lastCrashData = null;

    this.flightSurvivalTime = 0;
    this.formationSyncScore = 100;
    this.avgSyncScore = 100;
    this.syncScoreSamples = 0;

    this.flightInstructionContainer = document.getElementById('flight-instruction-container');
    this.proximityWarningBadge = document.getElementById('proximity-warning-badge');

    this.currentTime = 0;
    this.isPlaying = true;
    this.playbackSpeed = 1.0;
    this.isLooping = true;
    this.keysDown = {};

    // UI Scale Management
    this.uiScale = parseFloat(localStorage.getItem('blue_impulse_ui_scale') || '0.85');
    this.uiLayer = document.getElementById('ui-layer');
    this.uiScaleIndicator = document.getElementById('ui-scale-indicator');
    this.uiScaleDecBtn = document.getElementById('ui-scale-dec-btn');
    this.uiScaleIncBtn = document.getElementById('ui-scale-inc-btn');
    this.uiScaleResetBtn = document.getElementById('ui-scale-reset-btn');

    // UI Tile Collapse State
    this.isPfdCollapsed = false;

    this.initSimulation();
    this.initScene();
    this.initUI();
    this.initAudio();

    if (this.uiScaleDecBtn) {
      this.uiScaleDecBtn.addEventListener('click', () => this.adjustUiScale(-0.05));
    }
    if (this.uiScaleIncBtn) {
      this.uiScaleIncBtn.addEventListener('click', () => this.adjustUiScale(0.05));
    }
    if (this.uiScaleResetBtn) {
      this.uiScaleResetBtn.addEventListener('click', () => this.setUiScale(0.85));
    }

    if (this.crashRestartBtn) {
      this.crashRestartBtn.addEventListener('click', () => this.resetFlight());
    }

    if (this.langToggleBtn) {
      this.langToggleBtn.addEventListener('click', () => {
        i18n.toggleLang();
        this.updateAppLanguage();
      });
    }

    this.setUiScale(this.uiScale, false);
    this.updateAppLanguage();

    this.lastTimestamp = performance.now();
    this.animate = this.animate.bind(this);
    requestAnimationFrame(this.animate);

    window.addEventListener('resize', () => this.onWindowResize());
    window.addEventListener('keydown', (e) => this.onKeyDown(e));
    window.addEventListener('keyup', (e) => this.onKeyUp(e));
  }

  initSimulation() {
    this.routine = new AerobaticRoutines('diamond_takeoff');
    this.freeFlightSim = new FreeFlightSim();
  }

  initScene() {
    this.airportScene = new AirportScene(this.container);
    this.cameraController = new CameraController(this.container);
  }

  initUI() {
    // 1. Primary Flight Display Canvas HUD
    this.pfd = new FlightInstruments(this.pfdCanvas);
    this.pfd.resize();

    // 2. Camera View Selector Toolbar
    const viewContainer = document.getElementById('view-selector-container');
    this.viewSelector = new ViewSelector(viewContainer, {
      onViewChange: (viewId) => {
        this.cameraController.setMode(viewId);
      },
    });

    // 3. Right Control Panel
    const controlContainer = document.getElementById('control-panel-container');
    this.controlPanel = new ControlPanel(controlContainer, {
      onMainModeChange: (mode) => {
        this.mainMode = mode;
        this.planeCount = mode === '5_planes' ? 5 : 1;
        this.airportScene.formationManager.setCount(this.planeCount);
        this.viewSelector.setModeType(mode);
        this.resetFlight();
      },
      onSubModeChange: (sub) => {
        this.setFlightMode(sub);
      },
      onCockpitViewChange: (cockpitId) => {
        this.cameraController.setMode(cockpitId);
        this.viewSelector.setActive(cockpitId);
      },
      onBoardedAircraftChange: (boardId) => {
        this.boardedAircraft = boardId;
        const roleMap = {
          '1_lead': { cam: 'cockpit_1', idx: 0 },
          '2_wing': { cam: 'cockpit_2', idx: 1 },
          '3_wing': { cam: 'cockpit_3', idx: 2 },
          '4_slot': { cam: 'cockpit_4', idx: 3 },
          '5_solo': { cam: 'cockpit_5', idx: 4 },
        };
        const r = roleMap[boardId] || roleMap['1_lead'];
        this.cameraController.setMode(r.cam, r.idx);
        this.viewSelector.setActive(r.cam);
        this.resetFlight();
      },
      onRoutineChange: (routineId) => {
        this.routine.setRoutine(routineId);
        this.resetFlight();
      },
      onFormationChange: (formationId) => {
        this.airportScene.formationManager.setFormation(formationId);
      },
      onSmokeToggle: (smokeState) => {
        this.airportScene.smokeSystem.toggleSmoke(smokeState);
        this.freeFlightSim.isSmoking = smokeState;
      },
      onSmokeDensityChange: (density) => {
        this.airportScene.smokeSystem.setDensity(density);
      },
      onSmokeColorChange: (colorMode) => {
        this.airportScene.smokeSystem.setColorMode(colorMode);
      },
      onInstructionToggle: (show) => {
        this.showInstructions = show;
        this.updateInstructionBanner(this.freeFlightSim.getLeaderState());
      },
      onManualPresetChange: (preset) => {
        this.freeFlightSim.reset(preset);
        this.resetFlight();
      },
      onEnvChange: (envMode) => {
        this.airportScene.setEnvironmentMode(envMode);
      },
      onManualInputChange: (inputs) => {
        if (inputs.throttle !== undefined) this.freeFlightSim.setThrottle(inputs.throttle * 100);
        if (inputs.toggleGear) {
          const g = this.freeFlightSim.toggleGear();
          this.controlPanel.updateFlightControls({ gear: g });
        }
        if (inputs.toggleAirbrake) {
          const b = this.freeFlightSim.toggleAirbrake();
          this.controlPanel.updateFlightControls({ airbrake: b });
        }
        if (inputs.toggleSmoke) {
          const s = this.freeFlightSim.toggleSmoke();
          this.airportScene.smokeSystem.toggleSmoke(s);
          this.controlPanel.setSmokeState(s);
          this.controlPanel.updateFlightControls({ smoke: s });
        }
      },
      onPilotLiveryChange: (liveryId) => {
        this.pilotLivery = liveryId;
        this.applyPlayerAircraftCustomization();
      },
      onPlayerMarkerToggle: (showMarker) => {
        this.showPlayerMarker = showMarker;
        this.applyPlayerAircraftCustomization();
      },
      onUiScaleChange: (scale) => {
        this.setUiScale(scale);
      },
    });

    // 4. Bottom Telemetry & Timeline Dock
    const telemetryContainer = document.getElementById('telemetry-container');
    this.telemetryUI = new TelemetryUI(telemetryContainer, {
      onPlayPause: (playing) => {
        this.isPlaying = playing;
      },
      onSpeedChange: (speed) => {
        this.playbackSpeed = speed;
      },
      onAudioToggle: () => {
        this.audio.toggleMute();
      },
      onSeek: (progressRatio) => {
        if (this.flightMode === 'auto') {
          this.currentTime = progressRatio * (this.routine.totalDuration || 1);
        }
      },
      onReplay: () => {
        this.currentTime = 0;
        this.isPlaying = true;
        const playBtn = document.getElementById('btn-play-pause');
        if (playBtn) playBtn.textContent = '⏸';
      },
    });

    // 5. Primary Flight Display (PFD HUD) Collapse Handler
    this.initPfdCollapse();

    // 7. Instruction Banner Click Events (Hide / Resume toggle)
    this.initInstructionBannerEvents();
  }

  initInstructionBannerEvents() {
    if (!this.flightInstructionContainer) return;
    const handleToggle = (e) => {
      const closeBtn = e.target.closest('#btn-banner-hide-inst') || e.target.closest('.inst-banner-close-btn') || e.target.closest('.inst-toggle-hint');
      if (closeBtn) {
        e.preventDefault();
        e.stopPropagation();
        this.showInstructions = false;
        this.controlPanel.setInstructions(false);
        this.updateInstructionBanner(this.freeFlightSim.getLeaderState());
        return;
      }

      const resumeBtn = e.target.closest('#btn-banner-resume-inst') || e.target.closest('.inst-mini-resume-btn');
      if (resumeBtn) {
        e.preventDefault();
        e.stopPropagation();
        this.showInstructions = true;
        this.controlPanel.setInstructions(true);
        this.updateInstructionBanner(this.freeFlightSim.getLeaderState());
        return;
      }
    };

    this.flightInstructionContainer.addEventListener('click', handleToggle);
  }

  initPfdCollapse() {
    const pfdContainer = document.getElementById('pfd-container');
    const pfdToggleBtn = document.getElementById('pfd-collapse-btn');
    const pfdHeader = document.getElementById('pfd-header');
    if (!pfdContainer || !pfdToggleBtn) return;

    const togglePfd = () => {
      this.isPfdCollapsed = !this.isPfdCollapsed;
      pfdContainer.classList.toggle('collapsed', this.isPfdCollapsed);
      pfdToggleBtn.textContent = this.isPfdCollapsed ? '▶' : '◀';
      const tip = this.isPfdCollapsed
        ? (i18n.t('expandHud') || 'PFD HUDを展開する [H]')
        : (i18n.t('collapseHud') || 'PFD HUDを折りたたむ [H]');
      pfdToggleBtn.title = tip;
      if (pfdHeader) pfdHeader.title = tip;
    };

    pfdToggleBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      togglePfd();
    });

    if (pfdHeader) {
      pfdHeader.addEventListener('click', (e) => {
        if (e.target !== pfdToggleBtn && pfdContainer.classList.contains('collapsed')) {
          togglePfd();
        }
      });
    }
  }

  initAudio() {
    this.audio = new FlightAudio();
    const initAudioHandler = () => {
      this.audio.init();
      window.removeEventListener('click', initAudioHandler);
      window.removeEventListener('keydown', initAudioHandler);
    };
    window.addEventListener('click', initAudioHandler);
    window.addEventListener('keydown', initAudioHandler);
  }

  initPlayerStateForRoutine() {
    const frame0 = this.routine.sample(0);
    const boardMap = {
      '1_lead': 0,
      '2_wing': 1,
      '3_wing': 2,
      '4_slot': 3,
      '5_solo': 4,
    };
    const pIdx = this.mainMode === '5_planes' ? (boardMap[this.boardedAircraft] || 0) : 0;

    let initPos = frame0.position.clone();
    let initQuat = frame0.quaternion.clone();
    let initSpeed = (frame0.airspeedKt || 80.0) / 1.94384;
    let initGear = frame0.gear !== undefined ? frame0.gear : 1.0;
    let initThrottle = frame0.throttle !== undefined ? frame0.throttle : 0.6;
    let initSmoking = frame0.isSmoking || false;

    if (this.mainMode === '5_planes' && pIdx > 0) {
      if (frame0.individualPlaneStates && frame0.individualPlaneStates[pIdx]) {
        initPos = frame0.individualPlaneStates[pIdx].position.clone();
        if (frame0.individualPlaneStates[pIdx].quaternion) {
          initQuat = frame0.individualPlaneStates[pIdx].quaternion.clone();
        }
      } else {
        const offsets = [
          new THREE.Vector3(0, 0, 0),
          new THREE.Vector3(-18, 0, 18),
          new THREE.Vector3(18, 0, 18),
          new THREE.Vector3(0, -2, 36),
          new THREE.Vector3(0, 4, 54),
        ];
        const off = (frame0.customOffsets && frame0.customOffsets[pIdx]) || offsets[pIdx] || new THREE.Vector3();
        initPos.add(off.clone().applyQuaternion(initQuat));
      }
    }

    const euler = new THREE.Euler().setFromQuaternion(initQuat, 'YXZ');
    this.freeFlightSim.syncState({
      position: initPos,
      heading: ((-euler.y * 180.0) / Math.PI + 360.0) % 360.0,
      pitch: (euler.x * 180.0) / Math.PI,
      bank: (-euler.z * 180.0) / Math.PI,
      speed: Math.max(0.0, initSpeed),
      gear: initGear,
      throttle: initThrottle,
      isSmoking: initSmoking,
    });
  }

  setFlightMode(mode) {
    this.flightMode = mode;
    this.resetFlight();
  }

  applyPlayerAircraftCustomization() {
    const boardMap = {
      '1_lead': 0,
      '2_wing': 1,
      '3_wing': 2,
      '4_slot': 3,
      '5_solo': 4,
    };
    if (this.flightMode === 'manual') {
      const pIdx = this.mainMode === '5_planes' ? (boardMap[this.boardedAircraft] || 0) : 0;
      this.airportScene.formationManager.setPlayerPlane(pIdx, this.pilotLivery, this.showPlayerMarker);
    } else {
      // Auto Spectator: all standard JASDF Blue Impulse livery
      this.airportScene.formationManager.setPlayerPlane(-1, 'standard', false);
    }

    if (this.viewSelector) {
      this.viewSelector.updateFlightState(this.flightMode, this.boardedAircraft);
    }
  }

  resetFlight() {
    this.currentTime = 0;
    this.isPlaying = true;
    this.isCrashed = false;
    this.lastCrashData = null;
    this.flightSurvivalTime = 0;
    this.formationSyncScore = 100;
    this.avgSyncScore = 100;
    this.syncScoreSamples = 0;
    this.airportScene.smokeSystem.clear();

    if (this.proximityWarningBadge) {
      this.proximityWarningBadge.classList.add('hidden');
    }

    if (this.crashOverlay) {
      this.crashOverlay.classList.add('hidden');
    }

    if (this.flightMode !== 'auto') {
      this.initPlayerStateForRoutine();
    }

    this.applyPlayerAircraftCustomization();

    const playBtn = document.getElementById('btn-play-pause');
    if (playBtn) playBtn.textContent = '⏸';
  }

  checkTerrainCollision(flightState, planeX, planeY, planeZ) {
    if (this.isCrashed || this.flightMode !== 'manual') return;

    // Real elevation from terrain generator
    const groundElev = this.airportScene.terrain.getElevationAt(planeX, planeZ);

    // Matsushima Airfield Grounds (2.2km x 1.8km boundary around runways & apron)
    const onAirfieldGrounds = Math.abs(planeX) < 2200 && Math.abs(planeZ) < 1800;

    // 1. Mountain / Hills Collision Check (Elevation >= 15m)
    const isMountain = groundElev >= 15.0;
    if (isMountain && planeY <= groundElev + 3.5) {
      this.triggerCrash(flightState, groundElev, 'mountain');
      return;
    }

    // 2. Off-Airport Crash into Ocean or Urban Ground
    const isSea = groundElev < 3.0;
    if (!onAirfieldGrounds && planeY <= groundElev + 2.5) {
      this.triggerCrash(flightState, groundElev, isSea ? 'sea' : 'urban');
      return;
    }

    // 3. Airfield Grounds Crash Check (Only active AFTER plane has safely climbed to altitude)
    if (onAirfieldGrounds) {
      // While on runway or taking off before reaching safe altitude, NEVER trigger accidental crash!
      if (!flightState.hasEverTakenOff) {
        return;
      }

      const isTouchingGround = planeY <= groundElev + 0.6 || flightState.isGrounded;
      if (isTouchingGround) {
        // Gear not down (Belly landing)
        if (flightState.gear !== undefined && flightState.gear < 0.5) {
          this.triggerCrash(flightState, groundElev, 'belly');
          return;
        }

        // Hard impact (Excessive descent rate > 8.5 m/s, ~1700 fpm)
        if (flightState.verticalSpeed !== undefined && flightState.verticalSpeed < -8.5) {
          this.triggerCrash(flightState, groundElev, 'hard');
          return;
        }

        // Extreme attitude at touchdown (Excessive bank > 28° or extreme pitch)
        const bankAbs = Math.abs(flightState.bank || 0);
        const pitchVal = flightState.pitch || 0;
        if (bankAbs > 28.0 || pitchVal < -12.0 || pitchVal > 24.0) {
          this.triggerCrash(flightState, groundElev, 'attitude');
          return;
        }

        // Overspeed impact at touchdown (> 210 KT)
        if ((flightState.airspeedKt || flightState.speed * 1.94) > 210.0) {
          this.triggerCrash(flightState, groundElev, 'hard');
          return;
        }
      }
    }
  }

  triggerCrash(flightState, groundElev, reason = 'mountain') {
    this.isCrashed = true;
    this.freeFlightSim.isCrashed = true;
    this.lastCrashData = { isMidAir: false, flightState, groundElev, reason };
    this.audio.playCrashSound();

    if (this.proximityWarningBadge) {
      this.proximityWarningBadge.classList.add('hidden');
    }

    const titleEl = document.getElementById('crash-title-text');
    const subEl = document.getElementById('crash-subtitle-text');
    const speedEl = document.getElementById('crash-speed');
    const elevEl = document.getElementById('crash-elev');
    const locEl = document.getElementById('crash-loc');
    const syncEl = document.getElementById('crash-sync');
    const timeEl = document.getElementById('crash-time');
    const roleEl = document.getElementById('crash-role');

    if (reason === 'mountain') {
      if (titleEl) titleEl.textContent = i18n.t('crash.titleTerrain');
      if (subEl) subEl.textContent = i18n.t('crash.subTerrain');
      if (locEl) locEl.textContent = i18n.t('crash.locMountain');
    } else if (reason === 'sea') {
      if (titleEl) titleEl.textContent = i18n.t('crash.titleSea');
      if (subEl) subEl.textContent = i18n.t('crash.subSea');
      if (locEl) locEl.textContent = i18n.t('crash.locSea');
    } else if (reason === 'belly') {
      if (titleEl) titleEl.textContent = i18n.t('crash.titleBelly');
      if (subEl) subEl.textContent = i18n.t('crash.subBelly');
      if (locEl) locEl.textContent = i18n.t('crash.locAirfield');
    } else if (reason === 'hard') {
      if (titleEl) titleEl.textContent = i18n.t('crash.titleHard');
      if (subEl) subEl.textContent = i18n.t('crash.subHard');
      if (locEl) locEl.textContent = i18n.t('crash.locAirfield');
    } else if (reason === 'attitude') {
      if (titleEl) titleEl.textContent = i18n.t('crash.titleAttitude');
      if (subEl) subEl.textContent = i18n.t('crash.subAttitude');
      if (locEl) locEl.textContent = i18n.t('crash.locAirfield');
    } else {
      if (titleEl) titleEl.textContent = i18n.t('crash.titleTerrain');
      if (subEl) subEl.textContent = i18n.t('crash.subTerrain');
      if (locEl) locEl.textContent = i18n.t('crash.locUrban');
    }

    if (speedEl) speedEl.textContent = `${Math.round(flightState.airspeedKt || flightState.speed * 1.94)} KT`;
    if (elevEl) elevEl.textContent = `${Math.round(groundElev)} M (高度 ${Math.round(flightState.altitudeFt || 0)} FT)`;
    if (syncEl) syncEl.textContent = `${Math.round(this.avgSyncScore || this.formationSyncScore)}% (${this.getSyncRank(this.avgSyncScore).rank})`;
    if (timeEl) timeEl.textContent = `${this.flightSurvivalTime.toFixed(1)}s`;
    if (roleEl) roleEl.textContent = this.mainMode === '5_planes' ? `${this.boardedAircraft.replace('_', ' ')}` : 'SOLO';

    if (this.crashOverlay) {
      this.crashOverlay.classList.remove('hidden');
    }
  }

  checkMidAirCollision(curBoardIdx, playerState, demoFrame = null) {
    if (this.isCrashed || this.planeCount <= 1) {
      if (this.proximityWarningBadge) this.proximityWarningBadge.classList.add('hidden');
      return;
    }

    if (this.flightMode === 'manual') {
      const colResult = this.airportScene.formationManager.checkPlayerCollision(curBoardIdx);
      if (!colResult) return;

      if (colResult.collided) {
        this.triggerMidAirCollision(colResult, playerState, curBoardIdx);
        if (this.proximityWarningBadge) this.proximityWarningBadge.classList.add('hidden');
        return;
      }

      // Near-Miss / Proximity Alert (within 13m airborne)
      if (colResult.isNearMiss && colResult.closestDistance < 13.0 && playerState && !playerState.isGrounded) {
        if (this.proximityWarningBadge) {
          this.proximityWarningBadge.classList.remove('hidden');
          const isJa = i18n.lang === 'ja';
          const otherNum = colResult.closestAircraftNumber;
          const distStr = colResult.closestDistance.toFixed(1);
          this.proximityWarningBadge.textContent = isJa
            ? `⚠️ 僚機近接警告: #${otherNum}番機と間隔 ${distStr}m！`
            : `⚠️ PROXIMITY ALERT: #${otherNum} Jet at ${distStr}m!`;
        }
      } else {
        if (this.proximityWarningBadge) {
          this.proximityWarningBadge.classList.add('hidden');
        }
      }
    } else {
      // Auto (Demo) Flight Mode: Check collisions among all active demo planes
      const colResult = this.airportScene.formationManager.checkAllPlanesCollision();
      if (!colResult) return;

      if (colResult.collided) {
        this.triggerDemoMidAirCollision(colResult, demoFrame);
        if (this.proximityWarningBadge) this.proximityWarningBadge.classList.add('hidden');
        return;
      }

      // Proximity Alert in Auto Mode (within 13m airborne)
      if (colResult.isNearMiss && colResult.closestDistance < 13.0 && demoFrame && demoFrame.gear < 0.5) {
        if (this.proximityWarningBadge) {
          this.proximityWarningBadge.classList.remove('hidden');
          const isJa = i18n.lang === 'ja';
          const distStr = colResult.closestDistance.toFixed(1);
          this.proximityWarningBadge.textContent = isJa
            ? `⚠️ デモ機近接注意: #${colResult.planeANumber}番機 ↔ #${colResult.planeBNumber}番機 (間隔 ${distStr}m)`
            : `⚠️ PROXIMITY: #${colResult.planeANumber} ↔ #${colResult.planeBNumber} (${distStr}m)`;
        }
      } else {
        if (this.proximityWarningBadge) {
          this.proximityWarningBadge.classList.add('hidden');
        }
      }
    }
  }

  triggerDemoMidAirCollision(colResult, frame) {
    this.isCrashed = true;
    this.audio.playCrashSound();

    const roleNamesJa = ['#1 編隊長リード機', '#2 左翼僚機', '#3 右翼僚機', '#4 スロット機', '#5 ソロ機'];
    const roleNamesEn = ['#1 Formation Lead', '#2 Left Wing', '#3 Right Wing', '#4 Slot Jet', '#5 Solo Jet'];
    const isJa = i18n.lang === 'ja';
    const roleA = isJa ? roleNamesJa[colResult.planeAIndex] : roleNamesEn[colResult.planeAIndex];
    const roleB = isJa ? roleNamesJa[colResult.planeBIndex] : roleNamesEn[colResult.planeBIndex];

    const titleEl = document.getElementById('crash-title-text');
    const subEl = document.getElementById('crash-subtitle-text');
    const speedEl = document.getElementById('crash-speed');
    const elevEl = document.getElementById('crash-elev');
    const locEl = document.getElementById('crash-loc');
    const syncEl = document.getElementById('crash-sync');
    const timeEl = document.getElementById('crash-time');
    const roleEl = document.getElementById('crash-role');

    if (titleEl) titleEl.textContent = isJa ? '💥 デモ機 空中接触・衝突' : '💥 MID-AIR COLLISION DETECTED';
    if (subEl) subEl.textContent = isJa ? `${roleA} と ${roleB} が接触しました` : `${roleA} collided with ${roleB}`;
    if (speedEl) speedEl.textContent = `${Math.round(frame ? frame.airspeedKt : 180)} KT`;
    if (elevEl) elevEl.textContent = `高度 ${Math.round(frame ? frame.altitudeFt : 0)} FT / 間隔 ${colResult.distance.toFixed(1)}m`;
    if (locEl) locEl.textContent = `${roleB}`;
    if (syncEl) syncEl.textContent = isJa ? '演目鑑賞 (オートモード)' : 'Display Demo Mode';
    if (timeEl) timeEl.textContent = `${this.currentTime.toFixed(1)}s`;
    if (roleEl) roleEl.textContent = `${roleA}`;

    if (this.crashOverlay) {
      this.crashOverlay.classList.remove('hidden');
    }
  }

  triggerMidAirCollision(colResult, playerState, playerIdx) {
    this.isCrashed = true;
    this.freeFlightSim.isCrashed = true;
    this.audio.playCrashSound();

    const roleNamesJa = ['#1 編隊長リード機', '#2 左翼僚機', '#3 右翼僚機', '#4 スロット機', '#5 ソロ機'];
    const roleNamesEn = ['#1 Formation Lead', '#2 Left Wing', '#3 Right Wing', '#4 Slot Jet', '#5 Solo Jet'];
    const isJa = i18n.lang === 'ja';
    const otherRole = isJa ? roleNamesJa[colResult.otherIndex] : roleNamesEn[colResult.otherIndex];
    const myRole = isJa ? roleNamesJa[playerIdx] : roleNamesEn[playerIdx];

    this.lastCrashData = {
      isMidAir: true,
      otherRole,
      myRole,
      otherIndex: colResult.otherIndex,
      playerIdx,
      distance: colResult.distance,
      flightState: playerState,
      survivalTime: this.flightSurvivalTime,
      syncScore: Math.round(this.avgSyncScore || this.formationSyncScore),
    };

    const titleEl = document.getElementById('crash-title-text');
    const subEl = document.getElementById('crash-subtitle-text');
    const speedEl = document.getElementById('crash-speed');
    const elevEl = document.getElementById('crash-elev');
    const locEl = document.getElementById('crash-loc');
    const syncEl = document.getElementById('crash-sync');
    const timeEl = document.getElementById('crash-time');
    const roleEl = document.getElementById('crash-role');

    if (titleEl) titleEl.textContent = i18n.t('crash.titleCollision');
    if (subEl) subEl.textContent = i18n.t('crash.subCollision');
    if (speedEl) speedEl.textContent = `${Math.round(playerState.airspeedKt || playerState.speed * 1.94)} KT`;
    if (elevEl) elevEl.textContent = `高度 ${Math.round(playerState.altitudeFt || 0)} FT / 間隔 ${colResult.distance.toFixed(1)}m`;
    if (locEl) locEl.textContent = `${otherRole || `#${colResult.otherAircraftNumber} 僚機`}`;
    if (syncEl) syncEl.textContent = `${Math.round(this.avgSyncScore || this.formationSyncScore)}% (${this.getSyncRank(this.avgSyncScore).rank})`;
    if (timeEl) timeEl.textContent = `${this.flightSurvivalTime.toFixed(1)}s`;
    if (roleEl) roleEl.textContent = `${myRole || `自機 (#${playerIdx + 1})`}`;

    if (this.crashOverlay) {
      this.crashOverlay.classList.remove('hidden');
    }
  }

  calculateFormationSync(playerState, idealFrame, curBoardIdx) {
    if (!idealFrame || playerState.isGrounded) {
      this.formationSyncScore = 100;
      return;
    }

    let idealTargetPos = idealFrame.position.clone();
    if (curBoardIdx > 0) {
      if (idealFrame.individualPlaneStates && idealFrame.individualPlaneStates[curBoardIdx]) {
        idealTargetPos = idealFrame.individualPlaneStates[curBoardIdx].position.clone();
      } else {
        const offsets = [
          new THREE.Vector3(0, 0, 0),
          new THREE.Vector3(-18, 0, 18),
          new THREE.Vector3(18, 0, 18),
          new THREE.Vector3(0, -2, 36),
          new THREE.Vector3(0, 4, 54),
        ];
        const off = (idealFrame.customOffsets && idealFrame.customOffsets[curBoardIdx]) || offsets[curBoardIdx] || new THREE.Vector3();
        idealTargetPos.add(off.clone().applyQuaternion(idealFrame.quaternion));
      }
    }

    const distDiff = playerState.position.distanceTo(idealTargetPos);
    const posScore = Math.max(0, 100 - (distDiff / 0.35));

    const speedDiff = Math.abs((playerState.airspeedKt || 0) - (idealFrame.airspeedKt || 0));
    const speedScore = Math.max(0, 100 - speedDiff * 1.8);

    const frameSync = Math.round(posScore * 0.75 + speedScore * 0.25);
    this.formationSyncScore = THREE.MathUtils.lerp(this.formationSyncScore, frameSync, 0.1);

    this.syncScoreSamples++;
    this.avgSyncScore = THREE.MathUtils.lerp(this.avgSyncScore, this.formationSyncScore, 0.04);
  }

  getSyncRank(score) {
    const isJa = i18n.lang === 'ja';
    if (score >= 92) return { rank: isJa ? 'RANK S (神業)' : 'RANK S (Master)', class: 'rank-s' };
    if (score >= 82) return { rank: isJa ? 'RANK A (優秀)' : 'RANK A (Excellent)', class: 'rank-a' };
    if (score >= 68) return { rank: isJa ? 'RANK B (良好)' : 'RANK B (Good)', class: 'rank-b' };
    return { rank: isJa ? 'RANK C (離脱)' : 'RANK C (Displaced)', class: 'rank-c' };
  }

  onKeyDown(e) {
    this.keysDown[e.code] = true;

    // UI Scaling Hotkeys: [ (Decrease), ] (Increase), 0 (Reset)
    if (e.code === 'BracketLeft') {
      this.adjustUiScale(-0.05);
      return;
    }
    if (e.code === 'BracketRight') {
      this.adjustUiScale(0.05);
      return;
    }
    if (e.code === 'Digit0' && (e.altKey || e.ctrlKey || e.metaKey)) {
      this.setUiScale(0.85);
      return;
    }

    // [R] Key: Instant Flight Restart / Reset
    if (e.code === 'KeyR' && !e.ctrlKey && !e.metaKey) {
      this.resetFlight();
      return;
    }

    // [H] Key: Toggle PFD HUD collapse
    if (e.code === 'KeyH' && !e.ctrlKey && !e.metaKey && !e.altKey) {
      const pfdToggleBtn = document.getElementById('pfd-collapse-btn');
      if (pfdToggleBtn) pfdToggleBtn.click();
      return;
    }

    // [T] Key: Toggle Telemetry & Timeline dock collapse
    if (e.code === 'KeyT' && !e.ctrlKey && !e.metaKey && !e.altKey) {
      if (this.telemetryUI) this.telemetryUI.toggleCollapse();
      return;
    }

    // View Hotkeys
    if (this.mainMode === '5_planes') {
      const viewKeys5 = {
        Digit1: 'formation_global',
        Digit2: 'cockpit_1',
        Digit3: 'cockpit_2',
        Digit4: 'cockpit_3',
        Digit5: 'cockpit_4',
        Digit6: 'cockpit_5',
        Digit7: 'chase',
        Digit8: 'tower',
        Digit9: 'ground',
      };
      if (viewKeys5[e.code]) {
        this.setCameraView(viewKeys5[e.code]);
      }
    } else {
      const viewKeys1 = {
        Digit1: 'cockpit_1',
        Digit2: 'chase',
        Digit3: 'wing',
        Digit4: 'tower',
        Digit5: 'ground',
        Digit6: 'orbit',
      };
      if (viewKeys1[e.code]) {
        this.setCameraView(viewKeys1[e.code]);
      }
    }

    // Space / KeyV: Smoke toggle
    if (e.code === 'Space' || e.code === 'KeyV') {
      if (this.flightMode === 'auto') {
        this.isPlaying = !this.isPlaying;
        const btn = document.getElementById('btn-play-pause');
        if (btn) btn.textContent = this.isPlaying ? '⏸' : '▶';
      } else if (!this.isCrashed) {
        const s = this.freeFlightSim.toggleSmoke();
        this.airportScene.smokeSystem.toggleSmoke(s);
        this.controlPanel.setSmokeState(s);
        this.controlPanel.updateFlightControls({ smoke: s });
      }
    }

    // Manual Flight Hotkeys
    if (this.flightMode !== 'auto' && !this.isCrashed) {
      if (e.code === 'KeyG') {
        const g = this.freeFlightSim.toggleGear();
        this.controlPanel.updateFlightControls({ gear: g });
      }
      if (e.code === 'KeyB') {
        const b = this.freeFlightSim.toggleAirbrake();
        this.controlPanel.updateFlightControls({ airbrake: b });
      }
      if (e.code === 'KeyI' || e.key === 'i' || e.key === 'I') {
        this.showInstructions = !this.showInstructions;
        this.controlPanel.setInstructions(this.showInstructions);
        this.updateInstructionBanner(this.freeFlightSim.getLeaderState());
      }
    }
  }

  onKeyUp(e) {
    this.keysDown[e.code] = false;
  }

  setUiScale(scale, save = true) {
    this.uiScale = Math.max(0.65, Math.min(1.30, Math.round(scale * 100) / 100));
    document.documentElement.style.setProperty('--ui-scale', this.uiScale.toString());
    if (this.uiLayer) {
      this.uiLayer.style.width = `calc(100vw / ${this.uiScale})`;
      this.uiLayer.style.height = `calc(100vh / ${this.uiScale})`;
      this.uiLayer.style.transform = `scale(${this.uiScale})`;
    }
    if (this.uiScaleIndicator) {
      this.uiScaleIndicator.textContent = `${Math.round(this.uiScale * 100)}%`;
    }
    if (this.controlPanel) {
      this.controlPanel.setUiScale(this.uiScale);
    }
    if (save) {
      localStorage.setItem('blue_impulse_ui_scale', this.uiScale.toString());
    }
  }

  adjustUiScale(delta) {
    this.setUiScale(this.uiScale + delta, true);
  }

  setCameraView(viewId) {
    this.cameraController.setMode(viewId);
    this.viewSelector.setActive(viewId);
  }

  updateAppLanguage() {
    const rwyTag = document.getElementById('header-runway-tag');
    if (rwyTag) rwyTag.textContent = i18n.t('runwayTag');

    const brandTitle = document.getElementById('header-title');
    if (brandTitle) brandTitle.textContent = i18n.t('airportTitle');

    if (this.viewSelector) this.viewSelector.updateLanguage();
    if (this.controlPanel) this.controlPanel.updateLanguage();
    if (this.telemetryUI) this.telemetryUI.updateLanguage();

    const pfdToggleBtn = document.getElementById('pfd-collapse-btn');
    const pfdHeader = document.getElementById('pfd-header');
    if (pfdToggleBtn) {
      const tip = this.isPfdCollapsed
        ? (i18n.t('expandHud') || 'PFD HUDを展開する [H]')
        : (i18n.t('collapseHud') || 'PFD HUDを折りたたむ [H]');
      pfdToggleBtn.title = tip;
      if (pfdHeader) pfdHeader.title = tip;
    }

    // Crash Modal Text
    const crashTitle = document.getElementById('crash-title-text');
    const crashSub = document.getElementById('crash-subtitle-text');
    const lblSpeed = document.getElementById('crash-lbl-speed');
    const lblElev = document.getElementById('crash-lbl-elev');
    const lblLoc = document.getElementById('crash-lbl-loc');
    const lblSync = document.getElementById('crash-lbl-sync');
    const lblTime = document.getElementById('crash-lbl-time');
    const lblRole = document.getElementById('crash-lbl-role');
    const restartText = document.getElementById('crash-restart-text');

    if (this.lastCrashData && this.lastCrashData.isMidAir) {
      if (crashTitle) crashTitle.textContent = i18n.t('crash.titleCollision');
      if (crashSub) crashSub.textContent = i18n.t('crash.subCollision');
    } else if (this.lastCrashData && this.lastCrashData.reason) {
      const r = this.lastCrashData.reason;
      if (r === 'mountain') {
        if (crashTitle) crashTitle.textContent = i18n.t('crash.titleTerrain');
        if (crashSub) crashSub.textContent = i18n.t('crash.subTerrain');
      } else if (r === 'sea') {
        if (crashTitle) crashTitle.textContent = i18n.t('crash.titleSea');
        if (crashSub) crashSub.textContent = i18n.t('crash.subSea');
      } else if (r === 'belly') {
        if (crashTitle) crashTitle.textContent = i18n.t('crash.titleBelly');
        if (crashSub) crashSub.textContent = i18n.t('crash.subBelly');
      } else if (r === 'hard') {
        if (crashTitle) crashTitle.textContent = i18n.t('crash.titleHard');
        if (crashSub) crashSub.textContent = i18n.t('crash.subHard');
      } else if (r === 'attitude') {
        if (crashTitle) crashTitle.textContent = i18n.t('crash.titleAttitude');
        if (crashSub) crashSub.textContent = i18n.t('crash.subAttitude');
      } else {
        if (crashTitle) crashTitle.textContent = i18n.t('crash.titleTerrain');
        if (crashSub) crashSub.textContent = i18n.t('crash.subTerrain');
      }
    } else {
      if (crashTitle) crashTitle.textContent = i18n.t('crash.titleTerrain');
      if (crashSub) crashSub.textContent = i18n.t('crash.subTerrain');
    }

    if (lblSpeed) lblSpeed.textContent = i18n.t('crash.speed');
    if (lblElev) lblElev.textContent = i18n.t('crash.elev');
    if (lblLoc) lblLoc.textContent = i18n.t('crash.loc');
    if (lblSync) lblSync.textContent = i18n.t('crash.finalSync');
    if (lblTime) lblTime.textContent = i18n.t('crash.survivalTime');

    if (restartText) restartText.textContent = i18n.t('crash.restart');

    if (this.lastCrashData) {
      const locEl = document.getElementById('crash-loc');
      if (locEl) {
        if (this.lastCrashData.isMidAir) {
          locEl.textContent = this.lastCrashData.otherRole;
        } else {
          const r = this.lastCrashData.reason;
          if (r === 'mountain') locEl.textContent = i18n.t('crash.locMountain');
          else if (r === 'sea') locEl.textContent = i18n.t('crash.locSea');
          else if (r === 'belly' || r === 'hard' || r === 'attitude') locEl.textContent = i18n.t('crash.locAirfield');
          else locEl.textContent = i18n.t('crash.locUrban');
        }
      }
    }

    if (this.flightMode === 'manual') {
      this.updateInstructionBanner(this.freeFlightSim.getLeaderState());
    }
  }

  onWindowResize() {
    const w = this.container.clientWidth;
    const h = this.container.clientHeight;
    this.airportScene.resize(w, h);
    this.cameraController.resize(w, h);
    this.pfd.resize();
  }

  updateInstructionBanner(playerState, idealFrame = null, curBoard = null) {
    if (!this.flightInstructionContainer) return;

    if (this.flightMode !== 'manual') {
      if (this.flightInstructionContainer.innerHTML !== '') {
        this.flightInstructionContainer.innerHTML = '';
        this.flightInstructionContainer.style.display = 'none';
        this.lastInstructionMode = 'none';
      }
      return;
    }

    if (!this.showInstructions) {
      this.flightInstructionContainer.style.display = 'block';
      if (this.lastInstructionMode !== 'hidden') {
        this.lastInstructionMode = 'hidden';
        const isJa = i18n.lang === 'ja';
        this.flightInstructionContainer.innerHTML = `
          <button class="inst-mini-resume-btn" id="btn-banner-resume-inst" title="${isJa ? '操縦指導を表示 (キー: I)' : 'Show Guide (Key: I)'}">
            💡 <span>${isJa ? '操縦指導を表示 [I]' : 'Show Flight Guide [I]'}</span>
          </button>
        `;
      }
      return;
    }

    this.flightInstructionContainer.style.display = 'block';

    const state = playerState || this.freeFlightSim.getLeaderState();
    const isJa = i18n.lang === 'ja';
    let icon = '🛫';
    let badgeText = isJa ? '演目操縦指示' : 'ROUTINE DIRECTIVE';
    let stepText = '';
    let detailText = '';
    let keyHints = [];

    const routineId = this.routine ? this.routine.routineId : 'free_flight';
    const isSoloFreeFlight = (this.mainMode === '1_plane' && routineId === 'free_flight');

    const liveryNames = {
      gold: isJa ? '🏆 白＋ゴールド' : '🏆 Special Gold',
      red: isJa ? '🔥 白＋レッド' : '🔥 Crimson Red',
      neon: isJa ? '⚡ 白＋ネオン' : '⚡ Cyber Neon',
      stealth: isJa ? '🔶 白＋オレンジ' : '🔶 Hi-Vis Orange',
      sakura: isJa ? '🌸 白＋サクラ' : '🌸 Sakura Pink',
      standard: isJa ? '⚪ 白＋標準ブルー' : '⚪ Standard Blue',
    };
    const liveryBadge = liveryNames[this.pilotLivery] || (isJa ? '🏆 白＋ゴールド' : '🏆 Special Gold');

    // 1. Solo Free Flight Mode (Always consistent, never flickers on ground vs airborne)
    if (isSoloFreeFlight) {
      icon = '🕊️';
      badgeText = isJa ? '🕊️ 完全自由飛行 (フリーフライト)' : '🕊️ FREE FLIGHT SOLO';
      stepText = isJa
        ? '【自由飛行モード】 規定の演目にとらわれず、好きな高度・速度で松島基地＆松島湾の大空を自由自在にフライト！'
        : '[Free Flight] Fly freely at any altitude & speed across Matsushima Base & Bay without restrictions!';
      detailText = isJa
        ? '[S]キーで上昇、[W]キーで降下、[A/D]で傾き、[Space]でスモーク、[Shift/Ctrl]でスピード加減速。'
        : 'Fly freely with stick [S/W/A/D], throttle [Shift/Ctrl], and smoke [Space].';
      keyHints = [
        { key: 'S / ↓ (手前)', label: isJa ? '機首上げ (上昇)' : 'Pitch Up' },
        { key: 'W / ↑ (前倒)', label: isJa ? '機首下げ (降下)' : 'Pitch Down' },
        { key: 'A / D', label: isJa ? '左/右ロール (傾き)' : 'Bank Left/Right' },
        { key: 'Shift / Ctrl', label: isJa ? 'スピード加速/減速' : 'Throttle' },
      ];
    } else if (state.isGrounded && this.mainMode === '5_planes') {
      const roleName = curBoard ? curBoard.name : 'パイロット操縦';
      const phase = idealFrame ? idealFrame.phaseName : '滑走・離陸待機';
      if (state.airspeedKt < 100) {
        icon = '🛫';
        badgeText = isJa ? `離陸滑走 [${roleName}]` : `TAKEOFF ROLL [${roleName}]`;
        stepText = isJa
          ? `【演目: ${phase}】 スロットルを100% (Shiftキー) まで上げて滑走加速！`
          : `[${phase}] Advance Throttle to 100% [Shift] to accelerate!`;
        detailText = isJa
          ? '速度130KTに達したら [S]キー（または↓キー）を手前に引くように長押しして離陸します。'
          : 'Reach 130 KT then hold [S] (or Down Arrow) to pull up and liftoff.';
        keyHints = [
          { key: 'Shift / スライダー', label: isJa ? 'スロットル100%' : 'Full Throttle' },
          { key: 'S / ↓ (長押し)', label: isJa ? '機首上げ・離陸' : 'Pull Up / Liftoff' },
        ];
      } else {
        icon = '🛫';
        badgeText = isJa ? `ローテーション (離陸) [${roleName}]` : `ROTATE [${roleName}]`;
        stepText = isJa
          ? '[S]キー（または↓キー）を長押しして機首を引き起こし、大空へ離陸！'
          : 'Hold [S] (or Down Arrow) to pitch up for liftoff!';
        detailText = isJa
          ? '離陸後、[G]キー で車輪（ギア）を格納。[Space]キー でスモークを展開！'
          : 'Retract gear [G]. Press [Space] to deploy smoke for display!';
        keyHints = [
          { key: 'S / ↓ (長押し)', label: isJa ? '機首上げ (上昇)' : 'Pitch Up' },
          { key: 'G', label: isJa ? '車輪・ギア格納' : 'Gear Up' },
          { key: 'Space', label: isJa ? 'スモークON' : 'Smoke ON' },
        ];
      }
    } else {
      // Airborne Routine Guidance or Solo Challenge Maneuvers
      const phase = idealFrame ? idealFrame.phaseName : (state.isGrounded ? '滑走・離陸待機' : 'アクロバット飛行');
      icon = '🛩️';
      badgeText = isJa ? `演目中: ${phase}` : `Maneuver: ${phase}`;

      if (this.mainMode === '5_planes') {
        const pIdx = curBoard ? curBoard.idx : 0;
        if (pIdx === 0) {
          icon = '👑';
          stepText = isJa
            ? `【1番機・編隊長】 演目軌道をリード！[S/W]キーで上下、[A/D]キーで左右に旋回して先導してください。`
            : `[#1 Lead] Guide the flight! Maneuver with [S/W] (Pitch) and [A/D] (Roll).`;
          detailText = isJa
            ? '後ろの2〜5番機(AI)があなたの機体姿勢に合わせて完璧に追従します。'
            : 'AI wingmen #2-#5 are actively matching your formation lead.';
        } else if (pIdx === 1 || pIdx === 2) {
          icon = '🪶';
          stepText = isJa
            ? `【${pIdx === 1 ? '2番機(左翼)' : '3番機(右翼)'}】 前方の1番機(AI)に合わせて編隊間隔をキープ！僚機接触に注意！`
            : `[Wingman] Maintain formation station beside #1 Lead (AI)! Avoid mid-air collision!`;
          detailText = isJa
            ? '[A/D]で機体を傾け、[S/W]で上下を微調整。接触するとアウトになります。'
            : 'Fine-tune roll [A/D] and pitch [S/W] to match #1 Lead. Avoid collision.';
        } else if (pIdx === 3) {
          icon = '🎯';
          stepText = isJa
            ? '【4番機(スロット)】 1〜3番機の直後スロット位置に入って編隊飛行をキープ！接触注意！'
            : '[#4 Slot] Hold slot station right behind the lead diamond formation! Avoid collision!';
          detailText = isJa
            ? '前方のダイヤモンド編隊を見上げながら、スロットルと [S/W] で同調します。'
            : 'Look up into the pocket and match airspeed with formation.';
        } else {
          icon = '⚡';
          stepText = isJa
            ? '【5番機(ソロ機)】 4機編隊の周囲でスパイラルロールや急上昇・アクロバットを実施！'
            : '[#5 Solo] Perform high-G barrel rolls and vertical breaks around formation!';
          detailText = isJa
            ? '[A/D]キーで回転ロール、[S]キーで急上昇を行い、観客を魅了してください。'
            : 'Deploy white smoke [Space] and roll around the formation path with [A/D] & [S]!';
        }
      } else {
        // 1-Plane Solo Maneuver Challenge (Loop, Corkscrew, Takeoff, Landing)
        if (routineId === 'delta_loop') {
          icon = '🔄';
          badgeText = isJa ? '🎯 演目挑戦: 単独垂直大宙返り (ループ)' : '🎯 CHALLENGE: VERTICAL LOOP';
          stepText = isJa
            ? '【ループ挑戦】 速度180KT以上で [S]キー（または↓キー）を押し続けて機首をぐっと引き上げ、天頂へ垂直ループ！'
            : '[Vertical Loop] Accelerate past 180KT, hold [S] (or Down Arrow) to pull up through the apex!';
          detailText = isJa
            ? 'PFD水平儀を見ながら天頂で背面飛行を通過し、後半は [S]キーを離して機首を水平に戻します。'
            : 'Track horizon on PFD HUD. Invert smoothly at apex then release [S] to level out.';
        } else if (routineId === 'corkscrew') {
          icon = '🌀';
          badgeText = isJa ? '🎯 演目挑戦: 連続スパイラルロール (コークスクリュー)' : '🎯 CHALLENGE: CORKSCREW ROLL';
          stepText = isJa
            ? '【コークスクリュー挑戦】 [D]キー（右傾き）を押し続けながら、[S]キー（機首上げ）を軽く押して螺旋を描く！'
            : '[Corkscrew Roll] Hold [D] for right roll while gently tapping [S] to trace a spiral helix!';
          detailText = isJa
            ? '白スモーク [Space] を展開し、PFDのバンク角インジケータ（BANK: R°）に合わせて回転を維持。'
            : 'Deploy white smoke [Space]. Monitor PFD bank indicator to maintain continuous roll.';
        } else if (routineId === 'diamond_takeoff') {
          icon = '🛫';
          badgeText = isJa ? '🎯 演目挑戦: 滑走路07 離陸 ＆ 急上昇クライム' : '🎯 CHALLENGE: RUNWAY 07 TAKEOFF';
          stepText = isJa
            ? '【離陸挑戦】 スロットル100%で加速、130KTで [S]キー を長押しして機首を引き起こし、急上昇クライム！'
            : '[Takeoff Challenge] Advance Throttle to 100%, hold [S] at 130KT to climb out!';
          detailText = isJa
            ? '離陸後 [G]キー で車輪格納、[Space]キー でスモーク展開して上空2,500ftへ上昇。'
            : 'Retract gear [G] after liftoff, deploy smoke [Space], climb out to 2,500ft.';
        } else if (routineId === 'combat_pitch') {
          icon = '🛬';
          badgeText = isJa ? '🎯 演目挑戦: 滑走路07 アプローチ ＆ 着陸' : '🎯 CHALLENGE: RUNWAY 07 LANDING';
          if (state.isGrounded && this.freeFlightSim.hasEverTakenOff) {
            stepText = isJa
              ? '【着地成功！】 [Ctrl]長押し または [B]キー でブレーキをかけて滑走路上に完全停止！'
              : '[Touchdown Safe!] Hold [Ctrl] or tap [B] to apply brakes and bring jet to a full stop!';
            detailText = isJa
              ? 'スロットルを0%（アイドル）にすると車輪ブレーキが作動し、滑走路上でスムーズに完全停止します。'
              : 'Idle throttle to 0% to engage wheel brakes for a smooth full stop on runway.';
            keyHints = [
              { key: 'Ctrl (長押し)', label: isJa ? 'ブレーキ・完全停止' : 'Wheel Brakes' },
              { key: 'B', label: isJa ? 'エアブレーキ' : 'Airbrake' },
              { key: 'Q / E', label: isJa ? '滑走路直進ラダー' : 'Rudder' },
            ];
          } else {
            stepText = isJa
              ? '【着陸挑戦】 速度130〜140KT・降下角3°を維持して滑走路07手前へアプローチ！'
              : '[Landing Challenge] Maintain 130-140KT on 3° glideslope towards Runway 07 threshold!';
            detailText = isJa
              ? '車輪を出す [G]、エアブレーキ [B] で減速。接地直前に [S]キー で機首を少し上げふわりと着地後、[Ctrl]長押しで完全停止。'
              : 'Gear down [G], airbrake [B] to slow down. Flare with [S] gently before touchdown, hold [Ctrl] to stop.';
          }
        }
      }

      if (!keyHints || keyHints.length === 0) {
        keyHints = [
          { key: 'S / ↓ (手前)', label: isJa ? '機首上げ (上昇)' : 'Pitch Up' },
          { key: 'W / ↑ (前倒)', label: isJa ? '機首下げ (降下)' : 'Pitch Down' },
          { key: 'A / D', label: isJa ? '左/右ロール (傾き)' : 'Bank Left/Right' },
          { key: 'Shift / Ctrl', label: isJa ? 'スピード加速/減速' : 'Throttle' },
        ];
      }
    }

    // Ensure DOM structure exists
    let bannerEl = document.getElementById('flight-instruction-card');
    if (!bannerEl || this.lastInstructionMode !== 'shown') {
      this.lastInstructionMode = 'shown';
      this.flightInstructionContainer.innerHTML = `
        <div class="flight-instruction-banner" id="flight-instruction-card">
          <div class="inst-banner-header">
            <span class="inst-banner-icon" id="inst-banner-icon">${icon}</span>
            <span class="inst-banner-badge" id="inst-banner-badge">${badgeText}</span>
            <span class="inst-banner-badge livery-badge" id="inst-banner-livery" style="background: rgba(255,215,0,0.2); border: 1px solid #ffd700; color: #ffd700;">${liveryBadge}</span>
            <div class="sync-score-badge" id="inst-sync-badge" style="display: none;">
              <span id="inst-sync-val">🏆 SYNC: 100%</span>
              <span class="sync-rank-pill" id="inst-sync-rank">EXCELLENT (S)</span>
            </div>
            <button class="inst-banner-close-btn" id="btn-banner-hide-inst" title="${isJa ? '指導バナーを非表示にする (キー: I)' : 'Hide Guide (Key: I)'}">
              [I] ${isJa ? '指導非表示 ✖' : 'Hide ✖'}
            </button>
          </div>
          <div class="inst-banner-body">
            <div class="inst-step-text" id="inst-step-text">${stepText}</div>
            <div class="inst-detail-text" id="inst-detail-text">${detailText}</div>
          </div>
          <div class="inst-key-bar" id="inst-key-bar"></div>
        </div>
      `;
      bannerEl = document.getElementById('flight-instruction-card');
    }

    // Update dynamic fields without destroying the button or banner DOM
    const iconEl = document.getElementById('inst-banner-icon');
    if (iconEl && iconEl.textContent !== icon) iconEl.textContent = icon;

    const badgeEl = document.getElementById('inst-banner-badge');
    if (badgeEl && badgeEl.textContent !== badgeText) badgeEl.textContent = badgeText;

    const liveryEl = document.getElementById('inst-banner-livery');
    if (liveryEl && liveryEl.textContent !== liveryBadge) liveryEl.textContent = liveryBadge;

    const stepEl = document.getElementById('inst-step-text');
    if (stepEl && stepEl.textContent !== stepText) stepEl.textContent = stepText;

    const detailEl = document.getElementById('inst-detail-text');
    if (detailEl && detailEl.textContent !== detailText) detailEl.textContent = detailText;

    const syncBadge = document.getElementById('inst-sync-badge');
    if (syncBadge) {
      if (this.mainMode === '5_planes' && !state.isGrounded) {
        syncBadge.style.display = 'inline-flex';
        const rankInfo = this.getSyncRank(this.formationSyncScore);
        const syncVal = document.getElementById('inst-sync-val');
        if (syncVal) syncVal.textContent = `🏆 SYNC: ${Math.round(this.formationSyncScore)}%`;
        const syncRank = document.getElementById('inst-sync-rank');
        if (syncRank) {
          syncRank.className = `sync-rank-pill ${rankInfo.class}`;
          syncRank.textContent = rankInfo.rank;
        }
      } else {
        syncBadge.style.display = 'none';
      }
    }

    const keyBar = document.getElementById('inst-key-bar');
    if (keyBar) {
      const keyHintsHtml = keyHints
        .map(
          (h) => `
        <span class="inst-pill">
          <span class="inst-pill-key">${h.key}</span>
          <span class="inst-pill-lbl">${h.label}</span>
        </span>
      `
        )
        .join('');
      if (keyBar.dataset.cachedHtml !== keyHintsHtml) {
        keyBar.dataset.cachedHtml = keyHintsHtml;
        keyBar.innerHTML = keyHintsHtml;
      }
    }
  }

  animate(now) {
    requestAnimationFrame(this.animate);

    const dt = Math.min(0.1, (now - this.lastTimestamp) * 0.001);
    this.lastTimestamp = now;

    let telemetryData = {};

    if (this.flightMode === 'auto') {
      // 1. Auto Aerobatic Routine Trajectory
      if (this.isPlaying) {
        this.currentTime += dt * this.playbackSpeed;
        if (this.currentTime >= this.routine.totalDuration) {
          if (this.isLooping) {
            this.currentTime = 0;
            this.airportScene.smokeSystem.clear();
          } else {
            this.currentTime = this.routine.totalDuration;
            this.isPlaying = false;
            const playBtn = document.getElementById('btn-play-pause');
            if (playBtn) playBtn.textContent = '▶';
          }
        }
      }

      const frame = this.routine.sample(this.currentTime);
      if (frame) {
        if (frame.formationType) {
          this.airportScene.formationManager.setFormation(frame.formationType);
        }

        // Update Scene & Formation
        this.airportScene.update(dt, {
          position: frame.position,
          quaternion: frame.quaternion,
          forward: frame.forward,
          velocity: frame.velocity,
          gear: frame.gear,
          airbrake: frame.airbrake,
          throttle: frame.throttle,
          isSmoking: frame.isSmoking,
        }, frame.customOffsets, frame.individualPlaneStates, this.cameraController.camera);

        // Check mid-air collision among all active demo planes in Auto mode
        this.checkMidAirCollision(-1, null, frame);

        // Update Camera
        this.cameraController.update(this.airportScene.formationManager);

        let camText = 'CAM: 5-SHIP GLOBAL';
        if (this.cameraController.mode === 'cockpit_1') camText = 'CAM: #1 LEAD FPV';
        else if (this.cameraController.mode === 'cockpit_2') camText = 'CAM: #2 WING FPV';
        else if (this.cameraController.mode === 'cockpit_3') camText = 'CAM: #3 WING FPV';
        else if (this.cameraController.mode === 'cockpit_4') camText = 'CAM: #4 SLOT FPV';
        else if (this.cameraController.mode === 'cockpit_5') camText = 'CAM: #5 SOLO FPV';

        telemetryData = {
          altitudeFt: frame.altitudeFt,
          airspeedKt: frame.airspeedKt,
          mach: frame.mach,
          headingDeg: frame.headingDeg,
          pitchDeg: frame.pitchDeg,
          bankDeg: frame.bankDeg,
          gForce: frame.gForce,
          gear: frame.gear,
          airbrake: frame.airbrake,
          throttle: frame.throttle,
          isSmoking: frame.isSmoking,
          currentTime: this.currentTime,
          totalTime: this.routine.totalDuration,
          phaseName: isJa ? frame.phaseName : (frame.phaseNameEn || frame.phaseName),
          phaseNameEn: frame.phaseNameEn,
          pilotRoleText: camText,
          isManual: false,
        };
      }

      // Hide instruction banner in auto mode
      this.updateInstructionBanner(null);

    } else {
      // 2. Routine Pilot Challenge (Manual Flight in Display Routine)
      const isSoloFreeFlight = (this.mainMode === '1_plane' && this.routine.routineId === 'free_flight');

      if (this.isPlaying && !this.isCrashed) {
        this.flightSurvivalTime += dt;
        this.currentTime += dt * this.playbackSpeed;
        if (!isSoloFreeFlight && this.currentTime >= this.routine.totalDuration) {
          if (this.isLooping) {
            this.currentTime = 0;
            this.airportScene.smokeSystem.clear();
            this.initPlayerStateForRoutine();
          } else {
            this.currentTime = this.routine.totalDuration;
            this.isPlaying = false;
            const playBtn = document.getElementById('btn-play-pause');
            if (playBtn) playBtn.textContent = '▶';
          }
        }
      }

      const idealFrame = this.routine.sample(this.currentTime);

      // Player 6-DOF controls (Standard Aviation Flight Controls: S/Down = Pull up, W/Up = Push down)
      let elev = 0, ail = 0, rud = 0;
      if (this.keysDown['KeyS'] || this.keysDown['ArrowDown']) elev += 1.0; // Pull Stick -> Pitch Up (Ascend)
      if (this.keysDown['KeyW'] || this.keysDown['ArrowUp']) elev -= 1.0;   // Push Stick -> Pitch Down (Descend)
      if (this.keysDown['KeyA'] || this.keysDown['ArrowLeft']) ail -= 1.0;  // Roll Left
      if (this.keysDown['KeyD'] || this.keysDown['ArrowRight']) ail += 1.0; // Roll Right
      if (this.keysDown['KeyQ']) rud -= 1.0;                                // Rudder Left
      if (this.keysDown['KeyE']) rud += 1.0;                                // Rudder Right

      // Throttle Input: Shift / Z (Up), Ctrl / X / F (Down)
      let deltaThrottle = 0;
      if (this.keysDown['ShiftLeft'] || this.keysDown['ShiftRight'] || this.keysDown['KeyZ']) {
        deltaThrottle += 0.35 * dt;
      }
      if (this.keysDown['ControlLeft'] || this.keysDown['ControlRight'] || this.keysDown['KeyX'] || this.keysDown['KeyF']) {
        deltaThrottle -= 0.45 * dt;
      }
      if (deltaThrottle !== 0) {
        this.freeFlightSim.setThrottle((this.freeFlightSim.throttle + deltaThrottle) * 100.0);
      }

      // Terrain elevation lookup
      const terrainElev = this.airportScene.terrain.getElevationAt(
        this.freeFlightSim.position.x,
        this.freeFlightSim.position.z
      );

      // Wheel brake condition (Ground rollout braking)
      const isBraking = Boolean(
        this.keysDown['KeyB'] ||
        this.keysDown['ControlLeft'] ||
        this.keysDown['ControlRight'] ||
        this.keysDown['KeyX'] ||
        this.keysDown['KeyF'] ||
        this.freeFlightSim.airbrake > 0.5 ||
        this.freeFlightSim.throttle <= 0.05
      );

      this.freeFlightSim.update(dt, {
        elevator: elev,
        aileron: ail,
        rudder: rud,
        wheelBrakes: isBraking,
      }, terrainElev);

      const playerState = this.freeFlightSim.getLeaderState();

      // Check terrain / mountain collision
      this.checkTerrainCollision(
        playerState,
        this.freeFlightSim.position.x,
        this.freeFlightSim.position.y,
        this.freeFlightSim.position.z
      );

      // Boarded role mapping
      const isJa = i18n.lang === 'ja';
      const boardMap = {
        '1_lead': { idx: 0, badge: 'PILOT: #1 LEAD [👑]', name: isJa ? '1番機(編隊長) 操縦中' : '#1 Lead Piloting' },
        '2_wing': { idx: 1, badge: 'PILOT: #2 WING [🪶]', name: isJa ? '2番機(左翼) 僚機操縦中' : '#2 Left Wing Piloting' },
        '3_wing': { idx: 2, badge: 'PILOT: #3 WING [🪶]', name: isJa ? '3番機(右翼) 僚機操縦中' : '#3 Right Wing Piloting' },
        '4_slot': { idx: 3, badge: 'PILOT: #4 SLOT [🎯]', name: isJa ? '4番機(スロット) 操縦中' : '#4 Slot Piloting' },
        '5_solo': { idx: 4, badge: 'PILOT: #5 SOLO [⚡]', name: isJa ? '5番機(ソロ機) アクロバット操縦中' : '#5 Solo Aerobatics' },
      };
      const curBoard = this.mainMode === '5_planes' ? (boardMap[this.boardedAircraft] || boardMap['1_lead']) : { idx: 0, badge: 'SOLO PILOT [🛩️]', name: isJa ? '単独ソロ操縦' : 'Solo Flight' };

      // Calculate Formation Synchronicity Score
      this.calculateFormationSync(playerState, idealFrame, curBoard.idx);

      if (this.planeCount === 1) {
        // Solo Routine Pilot
        this.airportScene.update(dt, playerState, null, null, this.cameraController.camera);
        this.cameraController.update(this.airportScene.formationManager, 0);

      } else {
        // 5-Ship Routine Pilot
        if (curBoard.idx === 0) {
          // Player is #1 Lead -> AI wingmen #2-#5 follow player in routine formation
          if (idealFrame && idealFrame.formationType) {
            this.airportScene.formationManager.setFormation(idealFrame.formationType);
          }
          this.airportScene.update(dt, playerState, idealFrame ? idealFrame.customOffsets : null, null, this.cameraController.camera);
          this.cameraController.update(this.airportScene.formationManager, 0);

        } else {
          // AI flies official routine trajectory, player controls their specific jet (#2-#5)
          const indStates = new Array(6).fill(null);
          indStates[curBoard.idx] = {
            position: playerState.position,
            quaternion: playerState.quaternion,
            forward: playerState.forward,
            velocity: playerState.velocity,
            gear: playerState.gear,
            airbrake: playerState.airbrake,
            throttle: playerState.throttle,
            isSmoking: playerState.isSmoking,
          };

          if (idealFrame) {
            this.airportScene.update(dt, {
              position: idealFrame.position,
              quaternion: idealFrame.quaternion,
              forward: idealFrame.forward,
              velocity: idealFrame.velocity,
              gear: idealFrame.gear,
              airbrake: idealFrame.airbrake,
              throttle: idealFrame.throttle,
              isSmoking: idealFrame.isSmoking,
            }, idealFrame.customOffsets, indStates, this.cameraController.camera);
          }

          this.cameraController.update(this.airportScene.formationManager, curBoard.idx);
        }

        // Check Mid-Air Collision with fellow wingmen in 5-ship flight
        this.checkMidAirCollision(curBoard.idx, playerState);
      }

      // Update guidance banner with idealFrame, playerState, and sync score
      this.updateInstructionBanner(playerState, idealFrame, curBoard);

      // Sync control panel buttons (gear, airbrake, smoke) with live player state
      this.controlPanel.updateFlightControls({
        gear: playerState.gear,
        airbrake: playerState.airbrake,
        smoke: playerState.isSmoking,
        isGrounded: playerState.isGrounded,
      });

      const currentPhaseName = isSoloFreeFlight
        ? (isJa ? '🕊️ 完全自由飛行 (時間無制限)' : '🕊️ Free Flight (Unlimited)')
        : (idealFrame ? (isJa ? idealFrame.phaseName : (idealFrame.phaseNameEn || idealFrame.phaseName)) : curBoard.name);

      telemetryData = {
        altitudeFt: playerState.altitudeFt,
        airspeedKt: playerState.airspeedKt,
        mach: playerState.mach,
        headingDeg: playerState.heading,
        pitchDeg: playerState.pitch,
        bankDeg: playerState.bank,
        gForce: playerState.gForce,
        gear: playerState.gear,
        airbrake: playerState.airbrake,
        throttle: playerState.throttle,
        isSmoking: playerState.isSmoking,
        currentTime: this.currentTime,
        totalTime: isSoloFreeFlight ? Infinity : this.routine.totalDuration,
        isFreeFlight: isSoloFreeFlight,
        phaseName: currentPhaseName,
        phaseNameEn: isSoloFreeFlight ? '🕊️ Free Flight (Unlimited)' : (idealFrame ? idealFrame.phaseNameEn : curBoard.name),
        pilotRoleText: isSoloFreeFlight ? 'SOLO FREE FLIGHT' : `${curBoard.badge} [${this.pilotLivery.toUpperCase()}]`,
        isManual: true,
      };
    }

    // Update HUD canvas
    this.pfd.render(telemetryData);

    // Update Telemetry dock
    this.telemetryUI.update(telemetryData);

    // Update Audio engine
    this.audio.update(telemetryData);

    // Render 3D Scene
    this.airportScene.render(this.cameraController.camera);
  }
}

window.addEventListener('DOMContentLoaded', () => {
  new BlueImpulseApp();
});
