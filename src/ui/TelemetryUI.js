/**
 * TelemetryUI.js
 * Bottom HUD dock containing timeline scrubber, playback controls, and live telemetry gauges.
 * Features collapsible dock bar with real-time summary indicators.
 */

import { i18n } from '../i18n/translations.js';

export class TelemetryUI {
  constructor(container, callbacks = {}) {
    this.container = container;
    this.callbacks = callbacks;
    this.isPlaying = true;
    this.speed = 1.0;
    this.isMuted = false;
    this.isCollapsed = false;

    this.render();
  }

  render() {
    this.container.innerHTML = `
      <div class="telemetry-dock ${this.isCollapsed ? 'collapsed' : ''}" id="telemetry-dock">
        <!-- 1. Telemetry Header Bar (with Collapse Toggle & Mini Readout) -->
        <div class="telemetry-header" id="telemetry-header" title="${this.isCollapsed ? (i18n.t('expandTelemetry') || '計器・タイムラインを展開 [T]') : (i18n.t('collapseTelemetry') || '計器・タイムラインを折りたたむ [T]')}">
          <div class="tele-title-group">
            <span class="tele-badge">${i18n.t('telemetryDockTitle') || 'TELEMETRY & FLIGHT DOCK'}</span>
            <div class="tele-mini-stats" id="tele-mini-stats">
              <span class="tms-item" id="tms-spd">180 KT</span>
              <span class="tms-sep">•</span>
              <span class="tms-item" id="tms-alt">1,200 FT</span>
              <span class="tms-sep">•</span>
              <span class="tms-item" id="tms-g">+1.0 G</span>
              <span class="tms-sep">•</span>
              <span class="tms-item" id="tms-phase">${i18n.lang === 'ja' ? '離陸滑走' : 'Takeoff Roll'}</span>
            </div>
          </div>
          <button class="tele-toggle-btn" id="telemetry-collapse-btn" title="${this.isCollapsed ? (i18n.t('expandTelemetry') || '計器・タイムラインを展開 [T]') : (i18n.t('collapseTelemetry') || '計器・タイムラインを折りたたむ [T]')}">
            ${this.isCollapsed ? '▲' : '▼'}
          </button>
        </div>

        <!-- 2. Telemetry Dock Body (Timeline & Gauges Grid) -->
        <div class="telemetry-body" id="telemetry-body">
          <!-- Timeline & Playback Row (Top) -->
          <div class="timeline-row">
            <button class="tele-ctrl-btn" id="btn-play-pause" title="Play/Pause">${this.isPlaying ? '⏸' : '▶'}</button>
            <button class="tele-ctrl-btn" id="btn-replay" title="Replay">⏮</button>

            <!-- Timeline Slider -->
            <div class="timeline-track-wrapper">
              <input type="range" min="0" max="1000" value="0" class="timeline-slider" id="timeline-slider" />
              <div class="timeline-progress-bar" id="timeline-progress-bar"></div>
            </div>

            <span class="time-display" id="time-display">00:00 / 00:55</span>

            <!-- Playback Speed -->
            <div class="speed-selector">
              <button class="speed-btn ${this.speed === 0.5 ? 'active' : ''}" data-speed="0.5">0.5x</button>
              <button class="speed-btn ${this.speed === 1.0 ? 'active' : ''}" data-speed="1.0">1.0x</button>
              <button class="speed-btn ${this.speed === 2.0 ? 'active' : ''}" data-speed="2.0">2.0x</button>
              <button class="speed-btn ${this.speed === 4.0 ? 'active' : ''}" data-speed="4.0">4.0x</button>
            </div>

            <button class="tele-ctrl-btn" id="btn-audio-mute" title="Mute Audio">${this.isMuted ? '🔇' : '🔊'}</button>
          </div>

          <!-- Live Telemetry Readout Gauges (Bottom) -->
          <div class="gauges-row">
            <!-- Airspeed -->
            <div class="gauge-card">
              <div class="gauge-label">${i18n.t('airspeed')}</div>
              <div class="gauge-value" id="val-airspeed">180 <span class="gauge-unit">KT</span></div>
              <div class="gauge-sub" id="val-mach">M 0.28</div>
            </div>

            <!-- Altitude -->
            <div class="gauge-card">
              <div class="gauge-label">${i18n.t('altitude')}</div>
              <div class="gauge-value" id="val-altitude">1,200 <span class="gauge-unit">FT</span></div>
              <div class="gauge-sub" id="val-alt-m">365 M</div>
            </div>

            <!-- G-Force -->
            <div class="gauge-card">
              <div class="gauge-label">${i18n.t('gForce')}</div>
              <div class="gauge-value" id="val-gforce">+1.0 <span class="gauge-unit">G</span></div>
              <div class="g-bar-wrapper">
                <div class="g-bar-fill" id="g-bar-fill" style="width: 20%;"></div>
              </div>
            </div>

            <!-- Heading -->
            <div class="gauge-card">
              <div class="gauge-label">${i18n.t('heading')}</div>
              <div class="gauge-value" id="val-heading">068°</div>
              <div class="gauge-sub">RWY 07 AXIS</div>
            </div>

            <!-- Attitude Pitch / Bank -->
            <div class="gauge-card">
              <div class="gauge-label">${i18n.t('attitudeLabel') || (i18n.lang === 'ja' ? '姿勢 (P / B)' : 'Attitude (P / B)')}</div>
              <div class="gauge-value" id="val-attitude">+0° / 0°</div>
              <div class="gauge-sub" id="val-gear-status">GEAR UP</div>
            </div>

            <!-- Status Badge -->
            <div class="gauge-card status-card">
              <div class="gauge-label">${i18n.t('routinePhaseLabel') || (i18n.lang === 'ja' ? '演目進行フェーズ' : 'Routine Phase')}</div>
              <div class="status-badge" id="val-status-badge">${i18n.lang === 'ja' ? '離陸滑走' : 'Takeoff Roll'}</div>
            </div>
          </div>
        </div>
      </div>
    `;

    this.bindEvents();
  }

  toggleCollapse() {
    this.isCollapsed = !this.isCollapsed;
    const teleDock = this.container.querySelector('#telemetry-dock');
    const collapseBtn = this.container.querySelector('#telemetry-collapse-btn');
    const teleHeader = this.container.querySelector('#telemetry-header');

    if (teleDock) {
      teleDock.classList.toggle('collapsed', this.isCollapsed);
    }
    if (collapseBtn) {
      collapseBtn.textContent = this.isCollapsed ? '▲' : '▼';
      const tip = this.isCollapsed
        ? (i18n.t('expandTelemetry') || '計器・タイムラインを展開 [T]')
        : (i18n.t('collapseTelemetry') || '計器・タイムラインを折りたたむ [T]');
      collapseBtn.title = tip;
      if (teleHeader) teleHeader.title = tip;
    }
  }

  bindEvents() {
    // Collapse / Expand toggle
    const collapseBtn = this.container.querySelector('#telemetry-collapse-btn');
    const teleHeader = this.container.querySelector('#telemetry-header');

    if (collapseBtn) {
      collapseBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.toggleCollapse();
      });
    }

    if (teleHeader) {
      teleHeader.addEventListener('click', (e) => {
        if (e.target !== collapseBtn) {
          this.toggleCollapse();
        }
      });
    }

    // Play/Pause
    const playBtn = this.container.querySelector('#btn-play-pause');
    if (playBtn) {
      playBtn.addEventListener('click', () => {
        this.isPlaying = !this.isPlaying;
        playBtn.textContent = this.isPlaying ? '⏸' : '▶';
        if (this.callbacks.onPlayPause) {
          this.callbacks.onPlayPause(this.isPlaying);
        }
      });
    }

    // Replay
    const replayBtn = this.container.querySelector('#btn-replay');
    if (replayBtn) {
      replayBtn.addEventListener('click', () => {
        if (this.callbacks.onReplay) {
          this.callbacks.onReplay();
        }
      });
    }

    // Timeline Slider
    const slider = this.container.querySelector('#timeline-slider');
    if (slider) {
      slider.addEventListener('input', (e) => {
        const ratio = parseFloat(e.target.value) / 1000.0;
        if (this.callbacks.onSeek) {
          this.callbacks.onSeek(ratio);
        }
      });
    }

    // Speed Buttons
    const speedBtns = this.container.querySelectorAll('.speed-btn');
    speedBtns.forEach((btn) => {
      btn.addEventListener('click', () => {
        const spd = parseFloat(btn.dataset.speed);
        this.speed = spd;
        speedBtns.forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
        if (this.callbacks.onSpeedChange) {
          this.callbacks.onSpeedChange(spd);
        }
      });
    });

    // Mute Audio
    const muteBtn = this.container.querySelector('#btn-audio-mute');
    if (muteBtn) {
      muteBtn.addEventListener('click', () => {
        this.isMuted = !this.isMuted;
        muteBtn.textContent = this.isMuted ? '🔇' : '🔊';
        if (this.callbacks.onAudioToggle) {
          this.callbacks.onAudioToggle();
        }
      });
    }
  }

  update(telemetry = {}) {
    const isJa = i18n.lang === 'ja';
    const spdKt = Math.round(telemetry.airspeedKt || 0);
    const altFt = Math.round(telemetry.altitudeFt || 0);
    const altM = Math.round(altFt / 3.28084);
    const mach = (telemetry.mach || 0.45).toFixed(2);
    const gForce = (telemetry.gForce || 1.0).toFixed(1);
    const hdg = Math.round(telemetry.headingDeg || 0).toString().padStart(3, '0');
    const pitch = Math.round(telemetry.pitchDeg || 0);
    const bank = Math.round(telemetry.bankDeg || 0);
    const curTime = telemetry.currentTime || 0;
    const totalTime = telemetry.totalTime || 55;
    const resolvedPhase = isJa ? telemetry.phaseName : (telemetry.phaseNameEn || telemetry.phaseName);
    const phaseName = resolvedPhase || (telemetry.isManual ? (isJa ? '手動操縦中' : 'Manual Flight') : (isJa ? 'アクロバット飛行' : 'Display Aerobatics'));

    // Update live mini stats in header (visible when collapsed or expanded)
    const tmsSpd = this.container.querySelector('#tms-spd');
    if (tmsSpd) tmsSpd.textContent = `${spdKt} KT`;

    const tmsAlt = this.container.querySelector('#tms-alt');
    if (tmsAlt) tmsAlt.textContent = `${altFt.toLocaleString()} FT`;

    const tmsG = this.container.querySelector('#tms-g');
    if (tmsG) tmsG.textContent = `${parseFloat(gForce) > 0 ? '+' : ''}${gForce} G`;

    const tmsPhase = this.container.querySelector('#tms-phase');
    if (tmsPhase) tmsPhase.textContent = phaseName;

    // Update full gauges
    const spdEl = this.container.querySelector('#val-airspeed');
    if (spdEl) spdEl.innerHTML = `${spdKt} <span class="gauge-unit">KT</span>`;

    const machEl = this.container.querySelector('#val-mach');
    if (machEl) machEl.textContent = `M ${mach}`;

    const altEl = this.container.querySelector('#val-altitude');
    if (altEl) altEl.innerHTML = `${altFt.toLocaleString()} <span class="gauge-unit">FT</span>`;

    const altMEl = this.container.querySelector('#val-alt-m');
    if (altMEl) altMEl.textContent = `${altM.toLocaleString()} M`;

    const gEl = this.container.querySelector('#val-gforce');
    const gBar = this.container.querySelector('#g-bar-fill');
    if (gEl) gEl.innerHTML = `${parseFloat(gForce) > 0 ? '+' : ''}${gForce} <span class="gauge-unit">G</span>`;
    if (gBar) {
      const gRatio = Math.max(0, Math.min(100, (parseFloat(gForce) / 8.0) * 100));
      gBar.style.width = `${gRatio}%`;
      gBar.style.backgroundColor = parseFloat(gForce) > 5.5 ? '#ff3344' : (parseFloat(gForce) > 3.5 ? '#ffaa00' : '#00f0ff');
    }

    const hdgEl = this.container.querySelector('#val-heading');
    if (hdgEl) hdgEl.textContent = `${hdg}°`;

    const attEl = this.container.querySelector('#val-attitude');
    if (attEl) attEl.textContent = `${pitch > 0 ? '+' : ''}${pitch}° / ${bank}°`;

    const gearEl = this.container.querySelector('#val-gear-status');
    if (gearEl) gearEl.textContent = (telemetry.gear || 0) > 0.5 ? 'GEAR DOWN' : 'CLEAN';

    const statusEl = this.container.querySelector('#val-status-badge');
    if (statusEl) statusEl.textContent = phaseName;

    // Timeline update
    const slider = this.container.querySelector('#timeline-slider');
    const progBar = this.container.querySelector('#timeline-progress-bar');
    const timeDisp = this.container.querySelector('#time-display');

    if (totalTime === Infinity || telemetry.isFreeFlight) {
      if (slider) {
        slider.disabled = true;
        slider.value = 1000;
      }
      if (progBar) {
        progBar.style.width = '100%';
        progBar.style.background = 'linear-gradient(90deg, #00f0ff, #00ff88)';
      }
      if (timeDisp) {
        const cMin = Math.floor(curTime / 60).toString().padStart(2, '0');
        const cSec = Math.floor(curTime % 60).toString().padStart(2, '0');
        timeDisp.textContent = `${cMin}:${cSec} / ∞ (${i18n.lang === 'ja' ? '無制限' : 'Unlimited'})`;
      }
    } else if (totalTime > 0) {
      const ratio = Math.max(0, Math.min(1, curTime / totalTime));
      if (slider) {
        slider.disabled = false;
        if (!slider.matches(':active')) {
          slider.value = Math.round(ratio * 1000);
        }
      }
      if (progBar) {
        progBar.style.width = `${ratio * 100}%`;
        progBar.style.background = '';
      }
      if (timeDisp) {
        const cMin = Math.floor(curTime / 60).toString().padStart(2, '0');
        const cSec = Math.floor(curTime % 60).toString().padStart(2, '0');
        const tMin = Math.floor(totalTime / 60).toString().padStart(2, '0');
        const tSec = Math.floor(totalTime % 60).toString().padStart(2, '0');
        timeDisp.textContent = `${cMin}:${cSec} / ${tMin}:${tSec}`;
      }
    }
  }

  updateLanguage() {
    this.render();
  }
}
