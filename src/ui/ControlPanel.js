/**
 * ControlPanel.js
 * Completely separated UI for 5-Ship Formation Mode vs 1-Ship Solo Mode.
 * Provides dedicated Cockpit View selection (#1 to #5) in Auto Spectator mode,
 * and Boarded Aircraft selection (#1 to #5) in Manual Piloting mode.
 * Optimized with collapsible accordions to prevent vertical overflow and ensure 100% readability.
 */

import { i18n } from '../i18n/translations.js';

export class ControlPanel {
  constructor(container, callbacks = {}) {
    this.container = container;
    this.callbacks = callbacks;

    // Primary State
    this.mainMode = '5_planes'; // '5_planes' or '1_plane'
    this.subMode = 'auto'; // 'auto' or 'manual'

    // 5-Planes Specific State
    this.selectedCockpitView = 'cockpit_1'; // 'cockpit_1' to 'cockpit_5'
    this.boardedAircraft = '1_lead'; // '1_lead', '2_wing', '3_wing', '4_slot', '5_solo'
    this.formationType = 'delta';
    this.routineId = 'diamond_takeoff';

    // 1-Plane Specific State
    this.soloSpectatorView = 'cockpit_1';

    // Aircraft Flight Hardware State
    this.gear = 1.0;
    this.airbrake = 0.0;

    // Shared State
    this.envMode = 'day';
    this.smokeOn = true;
    this.smokeDensity = 0.45; // 45% default
    this.smokeColor = 'white';
    this.manualPreset = 'runway_takeoff';
    this.showInstructions = true; // Instruction / Flight guidance ON by default
    this.pilotLivery = 'gold'; // 'gold', 'red', 'neon', 'stealth', 'sakura', 'standard'
    this.showPlayerMarker = true;
    this.uiScale = 0.85; // UI zoom scale
    this.isCollapsed = false;

    // Accordion State
    this.isLiveryOpen = false;
    this.isSettingsOpen = false;
    this.isHelpOpen = false;

    this.render();
  }

  render() {
    const isJa = i18n.lang === 'ja';

    this.container.innerHTML = `
      <div class="panel-card ${this.isCollapsed ? 'collapsed' : ''}">
        <!-- Header with Squadron Title -->
        <div class="panel-header" title="コントロールパネルの折りたたみ / 展開">
          <div class="panel-title-group">
            <span class="panel-badge">JASDF T-4</span>
            <h2 class="panel-title">${i18n.t('squadronTitle')}</h2>
          </div>
          <button class="panel-toggle-btn" id="panel-collapse-btn" title="Toggle Panel">${this.isCollapsed ? '▶' : '◀'}</button>
        </div>

        <div class="panel-body">
          <!-- 1. Top Primary Mode Switcher: 5機編隊 vs 1機ソロ -->
          <div class="primary-mode-tabs">
            <button class="primary-tab-btn ${this.mainMode === '5_planes' ? 'active' : ''}" data-main-mode="5_planes">
              ${i18n.t('modeTab5Planes')}
            </button>
            <button class="primary-tab-btn ${this.mainMode === '1_plane' ? 'active' : ''}" data-main-mode="1_plane">
              ${i18n.t('modeTab1Plane')}
            </button>
          </div>

          <!-- 2. Operation Submode Switcher: 演目鑑賞 (Auto) vs 手動操縦 (Manual) -->
          <div class="submode-switch-grid">
            <button class="submode-btn ${this.subMode === 'auto' ? 'active' : ''}" data-sub-mode="auto">
              ${i18n.t('subModeAuto')}
            </button>
            <button class="submode-btn ${this.subMode === 'manual' ? 'active' : ''}" data-sub-mode="manual">
              ${i18n.t('subModeManual')}
            </button>
          </div>

          <!-- ========================================== -->
          <!-- 3A. 5-SHIP FORMATION MODE CONTENT          -->
          <!-- ========================================== -->
          ${this.mainMode === '5_planes' ? `
            <!-- Routine Selector -->
            <div class="control-group">
              <label class="group-label">${this.subMode === 'auto' ? (isJa ? '鑑賞する演目' : 'Display Routine') : (isJa ? '挑戦する演目' : 'Routine Maneuver')}</label>
              <select class="custom-select" id="routine-select">
                <option value="diamond_takeoff" ${this.routineId === 'diamond_takeoff' ? 'selected' : ''}>${i18n.t('routineDiamondTakeoff')}</option>
                <option value="delta_loop" ${this.routineId === 'delta_loop' ? 'selected' : ''}>${i18n.t('routineDeltaLoop')}</option>
                <option value="star_cross" ${this.routineId === 'star_cross' ? 'selected' : ''}>${i18n.t('routineStarCross')}</option>
                <option value="level_sunrise" ${this.routineId === 'level_sunrise' ? 'selected' : ''}>${i18n.t('routineLevelSunrise')}</option>
                <option value="changeover" ${this.routineId === 'changeover' ? 'selected' : ''}>${i18n.t('routineChangeover')}</option>
                <option value="corkscrew" ${this.routineId === 'corkscrew' ? 'selected' : ''}>${i18n.t('routineCorkscrew')}</option>
                <option value="combat_pitch" ${this.routineId === 'combat_pitch' ? 'selected' : ''}>${i18n.t('routineCombatPitch')}</option>
              </select>
            </div>

            ${this.subMode === 'auto' ? `
              <!-- 5-Ship AUTO SPECTATOR MODE -->
              <div class="control-group">
                <label class="group-label">${isJa ? '鑑賞コックピット視点' : 'Cockpit View'}</label>
                <div class="plane-select-grid">
                  <button class="plane-card-btn ${this.selectedCockpitView === 'cockpit_1' ? 'active' : ''}" data-cockpit="cockpit_1">
                    <span class="p-badge">👑 1番機</span>
                    <span class="p-role">編隊長</span>
                  </button>
                  <button class="plane-card-btn ${this.selectedCockpitView === 'cockpit_2' ? 'active' : ''}" data-cockpit="cockpit_2">
                    <span class="p-badge">🪶 2番機</span>
                    <span class="p-role">左翼機</span>
                  </button>
                  <button class="plane-card-btn ${this.selectedCockpitView === 'cockpit_3' ? 'active' : ''}" data-cockpit="cockpit_3">
                    <span class="p-badge">🪶 3番機</span>
                    <span class="p-role">右翼機</span>
                  </button>
                  <button class="plane-card-btn ${this.selectedCockpitView === 'cockpit_4' ? 'active' : ''}" data-cockpit="cockpit_4">
                    <span class="p-badge">🎯 4番機</span>
                    <span class="p-role">スロット</span>
                  </button>
                  <button class="plane-card-btn ${this.selectedCockpitView === 'cockpit_5' ? 'active' : ''}" data-cockpit="cockpit_5">
                    <span class="p-badge">⚡ 5番機</span>
                    <span class="p-role">ソロ機</span>
                  </button>
                </div>
                <div class="cockpit-desc-box" id="cockpit-desc-box">
                  ${this.getCockpitDescription(this.selectedCockpitView)}
                </div>
              </div>
            ` : `
              <!-- 5-Ship ROUTINE PILOT CHALLENGE MODE -->
              <div class="control-group">
                <label class="group-label">${isJa ? '操縦担当機 (搭乗する機体)' : 'Board Aircraft'}</label>
                <div class="plane-select-grid">
                  <button class="plane-card-btn ${this.boardedAircraft === '1_lead' ? 'active' : ''}" data-board="1_lead">
                    <span class="p-badge">👑 1番機</span>
                    <span class="p-role">編隊長リード</span>
                  </button>
                  <button class="plane-card-btn ${this.boardedAircraft === '2_wing' ? 'active' : ''}" data-board="2_wing">
                    <span class="p-badge">🪶 2番機</span>
                    <span class="p-role">左翼僚機</span>
                  </button>
                  <button class="plane-card-btn ${this.boardedAircraft === '3_wing' ? 'active' : ''}" data-board="3_wing">
                    <span class="p-badge">🪶 3番機</span>
                    <span class="p-role">右翼僚機</span>
                  </button>
                  <button class="plane-card-btn ${this.boardedAircraft === '4_slot' ? 'active' : ''}" data-board="4_slot">
                    <span class="p-badge">🎯 4番機</span>
                    <span class="p-role">スロット</span>
                  </button>
                  <button class="plane-card-btn ${this.boardedAircraft === '5_solo' ? 'active' : ''}" data-board="5_solo">
                    <span class="p-badge">⚡ 5番機</span>
                    <span class="p-role">ソロ機動</span>
                  </button>
                </div>
                <div class="board-desc-banner" id="board-desc-banner">
                  ${this.getBoardingDescription(this.boardedAircraft)}
                </div>
              </div>

              <!-- Manual Throttle & Action Buttons -->
              <div class="control-group">
                <div class="throttle-container">
                  <div class="throttle-label-row">
                    <span>${i18n.t('throttle')} (Throttle)</span>
                    <span id="throttle-val-text">60%</span>
                  </div>
                  <input type="range" min="0" max="100" value="60" class="throttle-slider" id="throttle-slider" />
                </div>

                <div class="cockpit-toggle-row">
                  <button class="cockpit-act-btn ${this.gear > 0.5 ? 'gear-active' : ''}" id="btn-toggle-gear" title="車輪(ギア)の格納・展開 [Gキー]">
                    <span class="btn-subtext">[G]</span>
                    <span class="gear-btn-label">${this.gear > 0.5 ? (isJa ? '車輪 (展開)' : 'Gear Down') : (isJa ? '車輪 (格納)' : 'Gear Up')}</span>
                  </button>
                  <button class="cockpit-act-btn ${this.airbrake > 0.5 ? 'brake-active' : ''}" id="btn-toggle-airbrake" title="エアブレーキの開閉 [Bキー]">
                    <span class="btn-subtext">[B]</span>
                    <span class="brake-btn-label">${this.airbrake > 0.5 ? (isJa ? 'ブレーキ (開)' : 'Brake (ON)') : (isJa ? 'ブレーキ (閉)' : 'Brake (OFF)')}</span>
                  </button>
                  <button class="cockpit-act-btn ${this.smokeOn ? 'smoke-active' : ''}" id="btn-manual-smoke" title="スモーク噴射切替 [Spaceキー]">
                    <span class="btn-subtext">[Space]</span>
                    <span class="smoke-btn-label">${this.smokeOn ? (isJa ? 'スモーク (ON)' : 'Smoke ON') : (isJa ? 'スモーク (OFF)' : 'Smoke OFF')}</span>
                  </button>
                </div>
              </div>
            `}
          ` : `
            <!-- ========================================== -->
            <!-- 3B. 1-PLANE SOLO MODE CONTENT              -->
            <!-- ========================================== -->
            <div class="control-group">
              <label class="group-label">${isJa ? 'ソロ 飛行演目・モード選択' : 'Solo Flight Mode'}</label>
              <select class="custom-select" id="routine-select">
                <option value="free_flight" ${this.routineId === 'free_flight' ? 'selected' : ''}>🕊️ 完全自由飛行 (フリーフライト・松島基地/松島湾)</option>
                <option value="delta_loop" ${this.routineId === 'delta_loop' ? 'selected' : ''}>1. 単独垂直大宙返り ＆ バレルロール (演技挑戦)</option>
                <option value="corkscrew" ${this.routineId === 'corkscrew' ? 'selected' : ''}>2. 連続スパイラルロール (コークスクリュー・演技挑戦)</option>
                <option value="diamond_takeoff" ${this.routineId === 'diamond_takeoff' ? 'selected' : ''}>3. 滑走路07 離陸 ＆ 急上昇クライム (離陸挑戦)</option>
                <option value="combat_pitch" ${this.routineId === 'combat_pitch' ? 'selected' : ''}>4. コンバットピッチ ＆ 滑走路着陸 (着陸挑戦)</option>
              </select>
            </div>

            ${this.subMode === 'manual' ? `
              <!-- Solo Spawn Position Presets -->
              <div class="control-group">
                <label class="group-label">${isJa ? '🛫 出現位置 / Start Position' : 'Start Position'}</label>
                <div class="btn-grid-3">
                  <button class="preset-btn ${this.manualPreset === 'runway_takeoff' ? 'active' : ''}" data-preset="runway_takeoff" title="滑走路07 離陸開始位置">
                    <span>🛫 滑走路07</span>
                  </button>
                  <button class="preset-btn ${this.manualPreset === 'airborne_bay' ? 'active' : ''}" data-preset="airborne_bay" title="松島湾上空 2,500ft 巡航">
                    <span>✈️ 上空2,500ft</span>
                  </button>
                  <button class="preset-btn ${this.manualPreset === 'final_approach' ? 'active' : ''}" data-preset="final_approach" title="滑走路07 最終進入 3km">
                    <span>🛬 着陸進入</span>
                  </button>
                </div>
              </div>

              <!-- Solo Manual Throttle & Controls -->
              <div class="control-group">
                <div class="throttle-container">
                  <div class="throttle-label-row">
                    <span>${i18n.t('throttle')} (Throttle)</span>
                    <span id="throttle-val-text">60%</span>
                  </div>
                  <input type="range" min="0" max="100" value="60" class="throttle-slider" id="throttle-slider" />
                </div>

                <div class="cockpit-toggle-row">
                  <button class="cockpit-act-btn ${this.gear > 0.5 ? 'gear-active' : ''}" id="btn-toggle-gear" title="車輪(ギア)の格納・展開 [Gキー]">
                    <span class="btn-subtext">[G]</span>
                    <span class="gear-btn-label">${this.gear > 0.5 ? (isJa ? '車輪 (展開)' : 'Gear Down') : (isJa ? '車輪 (格納)' : 'Gear Up')}</span>
                  </button>
                  <button class="cockpit-act-btn ${this.airbrake > 0.5 ? 'brake-active' : ''}" id="btn-toggle-airbrake" title="エアブレーキの開閉 [Bキー]">
                    <span class="btn-subtext">[B]</span>
                    <span class="brake-btn-label">${this.airbrake > 0.5 ? (isJa ? 'ブレーキ (開)' : 'Brake (ON)') : (isJa ? 'ブレーキ (閉)' : 'Brake (OFF)')}</span>
                  </button>
                  <button class="cockpit-act-btn ${this.smokeOn ? 'smoke-active' : ''}" id="btn-manual-smoke" title="スモーク噴射切替 [Spaceキー]">
                    <span class="btn-subtext">[Space]</span>
                    <span class="smoke-btn-label">${this.smokeOn ? (isJa ? 'スモーク (ON)' : 'Smoke ON') : (isJa ? 'スモーク (OFF)' : 'Smoke OFF')}</span>
                  </button>
                </div>
              </div>
            ` : ''}
          `}

          <!-- ========================================== -->
          <!-- 4. ACCORDION: 🎨 Pilot Livery & Marker    -->
          <!-- ========================================== -->
          ${this.subMode === 'manual' ? `
            <div class="panel-accordion">
              <div class="accordion-header" id="accordion-livery-header">
                <div class="accordion-title-row">
                  <span>🎨</span>
                  <span>${isJa ? '機体カラー' : 'Pilot Livery'}: <b style="color: var(--accent-cyan);">${this.getLiveryShortName(this.pilotLivery)}</b></span>
                </div>
                <span class="accordion-arrow">${this.isLiveryOpen ? '▲' : '▼'}</span>
              </div>
              ${this.isLiveryOpen ? `
                <div class="accordion-body">
                  <div class="livery-palette-grid">
                    <button class="livery-btn ${this.pilotLivery === 'gold' ? 'active' : ''}" data-livery="gold" title="ゴールド・リーダー">
                      <span class="livery-swatch gold-swatch"></span>
                      <span class="livery-btn-name">ゴールド</span>
                    </button>
                    <button class="livery-btn ${this.pilotLivery === 'red' ? 'active' : ''}" data-livery="red" title="クリムゾン・レッド">
                      <span class="livery-swatch red-swatch"></span>
                      <span class="livery-btn-name">レッド</span>
                    </button>
                    <button class="livery-btn ${this.pilotLivery === 'neon' ? 'active' : ''}" data-livery="neon" title="サイバー・ネオン">
                      <span class="livery-swatch neon-swatch"></span>
                      <span class="livery-btn-name">ネオン</span>
                    </button>
                    <button class="livery-btn ${this.pilotLivery === 'stealth' ? 'active' : ''}" data-livery="stealth" title="白＋ハイビズ・オレンジ">
                      <span class="livery-swatch stealth-swatch"></span>
                      <span class="livery-btn-name">オレンジ</span>
                    </button>
                    <button class="livery-btn ${this.pilotLivery === 'sakura' ? 'active' : ''}" data-livery="sakura" title="サクラ・ピンク">
                      <span class="livery-swatch sakura-swatch"></span>
                      <span class="livery-btn-name">サクラ</span>
                    </button>
                    <button class="livery-btn ${this.pilotLivery === 'standard' ? 'active' : ''}" data-livery="standard" title="標準ブルーインパルス">
                      <span class="livery-swatch standard-swatch"></span>
                      <span class="livery-btn-name">通常青白</span>
                    </button>
                  </div>
                  <div class="marker-toggle-row">
                    <button class="marker-toggle-btn ${this.showPlayerMarker ? 'active' : ''}" id="btn-marker-toggle">
                      <span class="marker-led ${this.showPlayerMarker ? 'on' : ''}"></span>
                      <span>👑 ${i18n.t('playerMarkerToggle')}</span>
                    </button>
                  </div>
                </div>
              ` : ''}
            </div>
          ` : ''}

          <!-- ========================================== -->
          <!-- 5. ACCORDION: ⚙️ Atmosphere & Settings    -->
          <!-- ========================================== -->
          <div class="panel-accordion">
            <div class="accordion-header" id="accordion-settings-header">
              <div class="accordion-title-row">
                <span>⚙️</span>
                <span>${isJa ? '環境・スモーク・表示設定' : 'Atmosphere & Settings'}</span>
              </div>
              <span class="accordion-arrow">${this.isSettingsOpen ? '▲' : '▼'}</span>
            </div>
            ${this.isSettingsOpen ? `
              <div class="accordion-body">
                <!-- Flight Instruction Guidance Toggle -->
                ${this.subMode === 'manual' ? `
                  <div class="control-group">
                    <div class="inst-label-header">
                      <label class="group-label">${isJa ? '指導バナー表示 [I]' : 'Guidance [I]'}</label>
                      <span class="inst-hotkey-badge">[I] Key</span>
                    </div>
                    <div class="btn-grid-2">
                      <button class="inst-toggle-btn ${this.showInstructions ? 'active' : ''}" data-instruction="true">
                        ${i18n.t('instructionOn')}
                      </button>
                      <button class="inst-toggle-btn ${!this.showInstructions ? 'active' : ''}" data-instruction="false">
                        ${i18n.t('instructionOff')}
                      </button>
                    </div>
                  </div>
                ` : ''}

                <!-- Smoke Controls -->
                <div class="control-group">
                  <div class="smoke-header-row">
                    <label class="group-label">${i18n.t('smokeLabel')}</label>
                    <span class="smoke-density-badge" id="smoke-density-badge">${Math.round(this.smokeDensity * 100)}%</span>
                  </div>
                  <div class="btn-grid-2">
                    <button class="smoke-toggle-btn ${this.smokeOn ? 'active' : ''}" data-smoke-state="true">
                      <span class="smoke-led ${this.smokeOn ? 'on' : ''}"></span>
                      ${i18n.t('smokeOn')}
                    </button>
                    <button class="smoke-toggle-btn ${!this.smokeOn ? 'active' : ''}" data-smoke-state="false">
                      ${i18n.t('smokeOff')}
                    </button>
                  </div>
                  <div class="smoke-slider-wrapper">
                    <input type="range" min="10" max="100" value="${Math.round(this.smokeDensity * 100)}" class="smoke-range-slider" id="smoke-density-slider" />
                    <div class="smoke-quick-preset-row">
                      <button class="smoke-preset-btn ${Math.round(this.smokeDensity * 100) === 25 ? 'active' : ''}" data-smoke-preset="25">薄(25%)</button>
                      <button class="smoke-preset-btn ${Math.round(this.smokeDensity * 100) === 45 ? 'active' : ''}" data-smoke-preset="45">標準(45%)</button>
                      <button class="smoke-preset-btn ${Math.round(this.smokeDensity * 100) === 75 ? 'active' : ''}" data-smoke-preset="75">濃(75%)</button>
                    </div>
                  </div>
                </div>

                <!-- Atmosphere -->
                <div class="control-group">
                  <label class="group-label">${isJa ? '環境・天候' : 'Atmosphere'}</label>
                  <div class="btn-grid-4">
                    <button class="env-btn ${this.envMode === 'day' ? 'active' : ''}" data-env="day">${i18n.t('envDay')}</button>
                    <button class="env-btn ${this.envMode === 'sunset' ? 'active' : ''}" data-env="sunset">${i18n.t('envSunset')}</button>
                    <button class="env-btn ${this.envMode === 'airshow' ? 'active' : ''}" data-env="airshow">${i18n.t('envAirshow')}</button>
                    <button class="env-btn ${this.envMode === 'night' ? 'active' : ''}" data-env="night">${i18n.t('envNight')}</button>
                  </div>
                </div>

                <!-- UI Scale -->
                <div class="control-group">
                  <div class="ui-scale-header-row">
                    <label class="group-label">🖥️ ${i18n.t('uiScaleLabel')}</label>
                    <span class="ui-scale-badge" id="ui-scale-badge">${Math.round(this.uiScale * 100)}%</span>
                  </div>
                  <div class="ui-scale-grid">
                    <button class="ui-scale-btn ${Math.abs(this.uiScale - 0.75) < 0.02 ? 'active' : ''}" data-scale="0.75">${i18n.t('uiScaleSmall')}</button>
                    <button class="ui-scale-btn ${Math.abs(this.uiScale - 0.85) < 0.02 ? 'active' : ''}" data-scale="0.85">${i18n.t('uiScaleMedium')}</button>
                    <button class="ui-scale-btn ${Math.abs(this.uiScale - 1.0) < 0.02 ? 'active' : ''}" data-scale="1.0">${i18n.t('uiScaleLarge')}</button>
                    <button class="ui-scale-btn ${Math.abs(this.uiScale - 1.15) < 0.02 ? 'active' : ''}" data-scale="1.15">${i18n.t('uiScaleXLarge')}</button>
                  </div>
                </div>
              </div>
            ` : ''}
          </div>

          <!-- ========================================== -->
          <!-- 6. ACCORDION: 🕹️ Flight Controls Guide    -->
          <!-- ========================================== -->
          <div class="panel-accordion">
            <div class="accordion-header" id="accordion-help-header">
              <div class="accordion-title-row">
                <span>🕹️</span>
                <span>${isJa ? '操縦キー一覧・ガイド' : 'Flight Controls Guide'}</span>
              </div>
              <span class="accordion-arrow">${this.isHelpOpen ? '▲' : '▼'}</span>
            </div>
            ${this.isHelpOpen ? `
              <div class="accordion-body">
                <div class="help-box" style="margin: 0;">
                  <div class="help-item"><b>${isJa ? '機首上げ/下げ' : 'Pitch Up/Down'}</b>: S / ↓ (引いて上昇), W / ↑ (倒して降下)</div>
                  <div class="help-item"><b>${isJa ? 'ロール(傾き)' : 'Roll'}</b>: A / D または ← / →</div>
                  <div class="help-item"><b>${isJa ? 'ラダー' : 'Rudder'}</b>: Q / E (左右旋回・ノーズホイール)</div>
                  <div class="help-item"><b>${isJa ? 'スロットル' : 'Throttle'}</b>: Shift (加速) / Ctrl (減速)</div>
                  <div class="help-item"><b>${isJa ? '車輪ブレーキ' : 'Brake'}</b>: Ctrl長押し または B (地上完全停止)</div>
                  <div class="help-item"><b>${isJa ? 'ギア / エアブレーキ' : 'Gear / Airbrake'}</b>: G (車輪) / B (空力減速)</div>
                  <div class="help-item"><b>${isJa ? 'スモーク' : 'Smoke'}</b>: Space キー</div>
                  <div class="help-item highlight-key"><b>${isJa ? '再開 / ガイド切替' : 'Restart / Guide'}</b>: R (リセット) / I (指導表示)</div>
                </div>
              </div>
            ` : ''}
          </div>
        </div>
      </div>
    `;

    this.bindEvents();
  }

  getCockpitDescription(cockpitId) {
    if (cockpitId === 'cockpit_1') return '👑 <b>1番機 (編隊長)</b>: 先頭から滑走路や空を見渡し、後方に2〜5番機を従えます。';
    if (cockpitId === 'cockpit_2') return '🪶 <b>2番機 (左翼)</b>: 右前方に1番機、右隣に4番機を見ながら編隊飛行します。';
    if (cockpitId === 'cockpit_3') return '🪶 <b>3番機 (右翼)</b>: 左前方に1番機、左隣に4番機を見ながら編隊飛行します。';
    if (cockpitId === 'cockpit_4') return '🎯 <b>4番機 (スロット)</b>: 前方の1番機、左右の2・3番機の直後から見上げます。';
    return '⚡ <b>5番機 (ソロ)</b>: 4機編隊を見ながら単独離陸・合流・アクロバットを行います。';
  }

  getBoardingDescription(boardId) {
    if (boardId === '1_lead') return '👑 <b>1番機 (編隊長) に搭乗中</b>: あなたが操縦し、2〜5番機(AI)が追従します。';
    if (boardId === '2_wing') return '🪶 <b>2番機 (左翼) に搭乗中</b>: 1番機(AI)に合わせて左翼位置で操縦します。';
    if (boardId === '3_wing') return '🪶 <b>3番機 (右翼) に搭乗中</b>: 1番機(AI)に合わせて右翼位置で操縦します。';
    if (boardId === '4_slot') return '🎯 <b>4番機 (スロット) に搭乗中</b>: 1〜3番機(AI)の直後スロット位置で操縦します。';
    return '⚡ <b>5番機 (ソロ機) に搭乗中</b>: 1〜4番機(AI)の編隊を見ながら自由にアクロバット機動できます。';
  }

  getLiveryShortName(liveryId) {
    const names = {
      gold: 'ゴールド',
      red: 'レッド',
      neon: 'ネオン',
      stealth: 'オレンジ',
      sakura: 'サクラ',
      standard: '通常青白',
    };
    return names[liveryId] || 'ゴールド';
  }

  getLiveryName(liveryId) {
    const isJa = i18n.lang === 'ja';
    const names = {
      gold: isJa ? '🏆 白＋ゴールド・リーダー' : '🏆 White & Gold Lead',
      red: isJa ? '🔥 白＋クリムゾン・レッド' : '🔥 White & Crimson Red',
      neon: isJa ? '⚡ 白＋サイバー・シアン' : '⚡ White & Cyber Cyan',
      stealth: isJa ? '🔶 白＋ハイビズ・オレンジ' : '🔶 White & Hi-Vis Orange',
      sakura: isJa ? '🌸 白＋サクラ・ピンク' : '🌸 White & Sakura Pink',
      standard: isJa ? '⚪ 白＋標準ブルー' : '⚪ White & Standard Blue',
    };
    return names[liveryId] || names.gold;
  }

  bindEvents() {
    // Panel Collapse
    const collapseBtn = this.container.querySelector('#panel-collapse-btn');
    const panelCard = this.container.querySelector('.panel-card');
    const panelHeader = this.container.querySelector('.panel-header');

    const togglePanel = () => {
      this.isCollapsed = !this.isCollapsed;
      if (panelCard) panelCard.classList.toggle('collapsed', this.isCollapsed);
      if (collapseBtn) collapseBtn.textContent = this.isCollapsed ? '▶' : '◀';
    };

    if (collapseBtn) {
      collapseBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        togglePanel();
      });
    }

    if (panelHeader) {
      panelHeader.addEventListener('click', (e) => {
        if (e.target !== collapseBtn && panelCard && panelCard.classList.contains('collapsed')) {
          togglePanel();
        }
      });
    }

    // Accordions Toggle Events
    const liveryAccHeader = this.container.querySelector('#accordion-livery-header');
    if (liveryAccHeader) {
      liveryAccHeader.addEventListener('click', () => {
        this.isLiveryOpen = !this.isLiveryOpen;
        this.render();
      });
    }

    const settingsAccHeader = this.container.querySelector('#accordion-settings-header');
    if (settingsAccHeader) {
      settingsAccHeader.addEventListener('click', () => {
        this.isSettingsOpen = !this.isSettingsOpen;
        this.render();
      });
    }

    const helpAccHeader = this.container.querySelector('#accordion-help-header');
    if (helpAccHeader) {
      helpAccHeader.addEventListener('click', () => {
        this.isHelpOpen = !this.isHelpOpen;
        this.render();
      });
    }

    // 1. Primary Mode Tabs: 5_planes vs 1_plane
    const mainTabs = this.container.querySelectorAll('.primary-tab-btn');
    mainTabs.forEach((tab) => {
      tab.addEventListener('click', () => {
        const mode = tab.dataset.mainMode;
        if (this.mainMode !== mode) {
          this.mainMode = mode;
          this.render();
          if (this.callbacks.onMainModeChange) {
            this.callbacks.onMainModeChange(mode);
          }
        }
      });
    });

    // 2. Submode Buttons: auto vs manual
    const subBtns = this.container.querySelectorAll('.submode-btn');
    subBtns.forEach((btn) => {
      btn.addEventListener('click', () => {
        const sub = btn.dataset.subMode;
        if (this.subMode !== sub) {
          this.subMode = sub;
          this.render();
          if (this.callbacks.onSubModeChange) {
            this.callbacks.onSubModeChange(sub);
          }
        }
      });
    });

    // 3. Cockpit View Selection (In 5-Planes Auto Mode)
    const cockpitBtns = this.container.querySelectorAll('.plane-card-btn[data-cockpit]');
    cockpitBtns.forEach((btn) => {
      btn.addEventListener('click', () => {
        const cId = btn.dataset.cockpit;
        this.selectedCockpitView = cId;
        cockpitBtns.forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');

        const descBox = this.container.querySelector('#cockpit-desc-box');
        if (descBox) descBox.innerHTML = this.getCockpitDescription(cId);

        if (this.callbacks.onCockpitViewChange) {
          this.callbacks.onCockpitViewChange(cId);
        }
      });
    });

    // 4. Boarded Aircraft Selection (In 5-Planes Manual Mode)
    const boardBtns = this.container.querySelectorAll('.plane-card-btn[data-board]');
    boardBtns.forEach((btn) => {
      btn.addEventListener('click', () => {
        const bId = btn.dataset.board;
        this.boardedAircraft = bId;
        boardBtns.forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');

        const banner = this.container.querySelector('#board-desc-banner');
        if (banner) banner.innerHTML = this.getBoardingDescription(bId);

        if (this.callbacks.onBoardedAircraftChange) {
          this.callbacks.onBoardedAircraftChange(bId);
        }
      });
    });

    // Routine Select
    const routineSelect = this.container.querySelector('#routine-select');
    if (routineSelect) {
      routineSelect.addEventListener('change', (e) => {
        this.routineId = e.target.value;
        if (this.callbacks.onRoutineChange) {
          this.callbacks.onRoutineChange(this.routineId);
        }
      });
    }

    // Throttle Slider
    const throttleSlider = this.container.querySelector('#throttle-slider');
    const throttleText = this.container.querySelector('#throttle-val-text');
    if (throttleSlider) {
      throttleSlider.addEventListener('input', (e) => {
        const val = parseInt(e.target.value, 10);
        if (throttleText) throttleText.textContent = `${val}%`;
        if (this.callbacks.onManualInputChange) {
          this.callbacks.onManualInputChange({ throttle: val / 100 });
        }
      });
    }

    // Quick Action Toggles (Support both 5-planes & 1-plane buttons)
    const gearBtns = this.container.querySelectorAll('#btn-toggle-gear');
    gearBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        if (this.callbacks.onManualInputChange) {
          this.callbacks.onManualInputChange({ toggleGear: true });
        }
      });
    });

    const brakeBtns = this.container.querySelectorAll('#btn-toggle-airbrake');
    brakeBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        if (this.callbacks.onManualInputChange) {
          this.callbacks.onManualInputChange({ toggleAirbrake: true });
        }
      });
    });

    const manualSmokeBtns = this.container.querySelectorAll('#btn-manual-smoke');
    manualSmokeBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        if (this.callbacks.onManualInputChange) {
          this.callbacks.onManualInputChange({ toggleSmoke: true });
        }
      });
    });

    // Spawn Position Presets
    const presetBtns = this.container.querySelectorAll('.preset-btn');
    presetBtns.forEach((btn) => {
      btn.addEventListener('click', () => {
        const preset = btn.dataset.preset;
        this.manualPreset = preset;
        presetBtns.forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
        if (this.callbacks.onManualPresetChange) {
          this.callbacks.onManualPresetChange(preset);
        }
      });
    });

    // Smoke Toggle Buttons (ON / OFF)
    const smokeBtns = this.container.querySelectorAll('.smoke-toggle-btn[data-smoke-state]');
    smokeBtns.forEach((btn) => {
      btn.addEventListener('click', () => {
        const isTrue = btn.dataset.smokeState === 'true';
        this.setSmokeState(isTrue);
        if (this.callbacks.onSmokeToggle) {
          this.callbacks.onSmokeToggle(isTrue);
        }
      });
    });

    // Smoke Density Slider & Presets
    const smokeDensitySlider = this.container.querySelector('#smoke-density-slider');
    const smokeDensityBadge = this.container.querySelector('#smoke-density-badge');
    const smokePresetBtns = this.container.querySelectorAll('.smoke-preset-btn');

    const updateDensity = (val) => {
      this.smokeDensity = val / 100;
      if (smokeDensitySlider) smokeDensitySlider.value = val;
      if (smokeDensityBadge) smokeDensityBadge.textContent = `${val}%`;
      smokePresetBtns.forEach((b) => {
        b.classList.toggle('active', parseInt(b.dataset.smokePreset, 10) === val);
      });
      if (this.callbacks.onSmokeDensityChange) {
        this.callbacks.onSmokeDensityChange(this.smokeDensity);
      }
    };

    if (smokeDensitySlider) {
      smokeDensitySlider.addEventListener('input', (e) => {
        const val = parseInt(e.target.value, 10);
        updateDensity(val);
      });
    }

    smokePresetBtns.forEach((btn) => {
      btn.addEventListener('click', () => {
        const val = parseInt(btn.dataset.smokePreset, 10);
        updateDensity(val);
      });
    });

    // Environment Presets
    const envBtns = this.container.querySelectorAll('.env-btn');
    envBtns.forEach((btn) => {
      btn.addEventListener('click', () => {
        const env = btn.dataset.env;
        this.envMode = env;
        envBtns.forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
        if (this.callbacks.onEnvChange) {
          this.callbacks.onEnvChange(env);
        }
      });
    });

    // Flight Instruction Toggle (ON / OFF)
    const instBtns = this.container.querySelectorAll('.inst-toggle-btn');
    instBtns.forEach((btn) => {
      btn.addEventListener('click', () => {
        const show = btn.dataset.instruction === 'true';
        this.showInstructions = show;
        this.render();
        if (this.callbacks.onInstructionToggle) {
          this.callbacks.onInstructionToggle(show);
        }
      });
    });

    // Pilot Jet Livery Selection
    const liveryBtns = this.container.querySelectorAll('.livery-btn[data-livery]');
    liveryBtns.forEach((btn) => {
      btn.addEventListener('click', () => {
        const liv = btn.dataset.livery;
        this.pilotLivery = liv;
        liveryBtns.forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');

        if (this.callbacks.onPilotLiveryChange) {
          this.callbacks.onPilotLiveryChange(liv);
        }
      });
    });

    // 3D Player Marker Toggle
    const markerToggleBtn = this.container.querySelector('#btn-marker-toggle');
    if (markerToggleBtn) {
      markerToggleBtn.addEventListener('click', () => {
        this.showPlayerMarker = !this.showPlayerMarker;
        markerToggleBtn.classList.toggle('active', this.showPlayerMarker);
        const led = markerToggleBtn.querySelector('.marker-led');
        if (led) led.classList.toggle('on', this.showPlayerMarker);

        if (this.callbacks.onPlayerMarkerToggle) {
          this.callbacks.onPlayerMarkerToggle(this.showPlayerMarker);
        }
      });
    }

    // UI Scale Selection
    const scaleBtns = this.container.querySelectorAll('.ui-scale-btn[data-scale]');
    scaleBtns.forEach((btn) => {
      btn.addEventListener('click', () => {
        const scale = parseFloat(btn.dataset.scale);
        this.uiScale = scale;
        scaleBtns.forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
        const badge = this.container.querySelector('#ui-scale-badge');
        if (badge) badge.textContent = `${Math.round(scale * 100)}%`;
        if (this.callbacks.onUiScaleChange) {
          this.callbacks.onUiScaleChange(scale);
        }
      });
    });
  }

  updateFlightControls(status = {}) {
    const isJa = i18n.lang === 'ja';
    if (status.gear !== undefined) this.gear = status.gear;
    if (status.airbrake !== undefined) this.airbrake = status.airbrake;
    if (status.smoke !== undefined) this.smokeOn = status.smoke;

    const gearBtns = this.container.querySelectorAll('#btn-toggle-gear');
    gearBtns.forEach(btn => {
      btn.classList.toggle('gear-active', this.gear > 0.5);
      const lbl = btn.querySelector('.gear-btn-label');
      if (lbl) lbl.textContent = this.gear > 0.5 ? (isJa ? '車輪 (展開)' : 'Gear Down') : (isJa ? '車輪 (格納)' : 'Gear Up');
    });

    const brakeBtns = this.container.querySelectorAll('#btn-toggle-airbrake');
    brakeBtns.forEach(btn => {
      btn.classList.toggle('brake-active', this.airbrake > 0.5);
      const lbl = btn.querySelector('.brake-btn-label');
      if (lbl) lbl.textContent = this.airbrake > 0.5 ? (isJa ? 'ブレーキ (開)' : 'Brake (ON)') : (isJa ? 'ブレーキ (閉)' : 'Brake (OFF)');
    });

    const smokeBtns = this.container.querySelectorAll('#btn-manual-smoke');
    smokeBtns.forEach(btn => {
      btn.classList.toggle('smoke-active', this.smokeOn);
      const lbl = btn.querySelector('.smoke-btn-label');
      if (lbl) lbl.textContent = this.smokeOn ? (isJa ? 'スモーク (ON)' : 'Smoke ON') : (isJa ? 'スモーク (OFF)' : 'Smoke OFF');
    });
  }

  setInstructions(show) {
    if (this.showInstructions !== show) {
      this.showInstructions = show;
      this.render();
    }
  }

  setUiScale(scale) {
    this.uiScale = scale;
    const badge = this.container.querySelector('#ui-scale-badge');
    if (badge) badge.textContent = `${Math.round(scale * 100)}%`;
    const scaleBtns = this.container.querySelectorAll('.ui-scale-btn[data-scale]');
    scaleBtns.forEach((b) => {
      b.classList.toggle('active', Math.abs(parseFloat(b.dataset.scale) - scale) < 0.02);
    });
  }

  setSmokeState(isOn) {
    this.smokeOn = isOn;
    const smokeBtns = this.container.querySelectorAll('.smoke-toggle-btn[data-smoke-state]');
    smokeBtns.forEach((btn) => {
      const isTrue = btn.dataset.smokeState === 'true';
      btn.classList.toggle('active', isTrue === isOn);
      const led = btn.querySelector('.smoke-led');
      if (led) led.classList.toggle('on', isOn);
    });

    const manualSmokeBtns = this.container.querySelectorAll('#btn-manual-smoke');
    manualSmokeBtns.forEach(btn => {
      btn.classList.toggle('smoke-active', isOn);
      const lbl = btn.querySelector('.smoke-btn-label');
      if (lbl) lbl.textContent = isOn ? (i18n.lang === 'ja' ? 'スモーク (ON)' : 'Smoke ON') : (i18n.lang === 'ja' ? 'スモーク (OFF)' : 'Smoke OFF');
    });
  }

  updateLanguage() {
    this.render();
  }
}
