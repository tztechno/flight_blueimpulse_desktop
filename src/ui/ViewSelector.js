/**
 * ViewSelector.js
 * Camera view selector toolbar adapted dynamically for 5-Ship Formation mode vs 1-Ship Solo mode.
 */

import { i18n } from '../i18n/translations.js';

export class ViewSelector {
  constructor(container, callbacks = {}) {
    this.container = container;
    this.callbacks = callbacks;
    this.modeType = '5_planes'; // '5_planes' or '1_plane'
    this.flightMode = 'auto';
    this.boardedAircraft = '1_lead';
    this.currentView = 'formation_global';

    this.render();
  }

  updateFlightState(flightMode, boardedAircraft) {
    this.flightMode = flightMode;
    this.boardedAircraft = boardedAircraft;
    this.render();
  }

  setModeType(modeType) {
    this.modeType = modeType;
    if (modeType === '1_plane' && (this.currentView.startsWith('cockpit_') || this.currentView === 'formation_global')) {
      this.currentView = 'cockpit_1';
    }
    this.render();
  }

  render() {
    this.container.innerHTML = '';
    const wrapper = document.createElement('div');
    wrapper.className = 'view-selector-wrapper';

    if (this.modeType === '5_planes') {
      // 5-Planes Formation Camera Bar
      // Section 1: Cockpit Switcher (#1 to #5)
      const cockpitGroup = document.createElement('div');
      cockpitGroup.className = 'view-group cockpit-group';

      const cockpitList = [
        { id: 'cockpit_1', planeIdx: 0, boardKey: '1_lead', nameKey: 'cockpit1Short', title: '1番機コックピット (編隊長)' },
        { id: 'cockpit_2', planeIdx: 1, boardKey: '2_wing', nameKey: 'cockpit2Short', title: '2番機コックピット (左翼)' },
        { id: 'cockpit_3', planeIdx: 2, boardKey: '3_wing', nameKey: 'cockpit3Short', title: '3番機コックピット (右翼)' },
        { id: 'cockpit_4', planeIdx: 3, boardKey: '4_slot', nameKey: 'cockpit4Short', title: '4番機コックピット (スロット)' },
        { id: 'cockpit_5', planeIdx: 4, boardKey: '5_solo', nameKey: 'cockpit5Short', title: '5番機コックピット (ソロ)' },
      ];

      cockpitList.forEach((v, idx) => {
        const isBoarded = this.flightMode === 'manual' && this.boardedAircraft === v.boardKey;
        const btn = document.createElement('button');
        btn.className = `view-btn ${v.id === this.currentView ? 'active' : ''} ${isBoarded ? 'boarded-active' : ''}`;
        btn.id = `view-btn-${v.id}`;
        btn.title = isBoarded ? `👑 あなたが手動操縦中の機体 (${v.title})` : v.title;
        btn.innerHTML = `<span class="view-label">${i18n.t(v.nameKey)}${isBoarded ? ' <small style="color:#ffd700;font-weight:900;">👑操縦中</small>' : ''}</span>`;
        btn.addEventListener('click', () => {
          this.setActive(v.id);
          if (this.callbacks.onViewChange) {
            this.callbacks.onViewChange(v.id);
          }
        });
        cockpitGroup.appendChild(btn);
      });

      // Section 2: External Spectator Views
      const extGroup = document.createElement('div');
      extGroup.className = 'view-group ext-group';

      const extList = [
        { id: 'formation_global', nameKey: 'viewGlobal5', shortKey: 'viewGlobal5Short', title: '5機全体ビュー [1]' },
        { id: 'chase', nameKey: 'viewChase', shortKey: 'viewChaseShort', title: '後方追従 [6]' },
        { id: 'tower', nameKey: 'viewTower', shortKey: 'viewTowerShort', title: '松島管制塔 [7]' },
        { id: 'ground', nameKey: 'viewGround', shortKey: 'viewGroundShort', title: '地上観覧席 [8]' },
        { id: 'orbit', nameKey: 'viewOrbit', shortKey: 'viewOrbitShort', title: '360°旋回' },
      ];

      extList.forEach((v) => {
        const btn = document.createElement('button');
        btn.className = `view-btn ${v.id === this.currentView ? 'active' : ''}`;
        btn.id = `view-btn-${v.id}`;
        btn.title = v.title;
        btn.innerHTML = `<span class="view-label">${i18n.t(v.shortKey || v.nameKey)}</span>`;
        btn.addEventListener('click', () => {
          this.setActive(v.id);
          if (this.callbacks.onViewChange) {
            this.callbacks.onViewChange(v.id);
          }
        });
        extGroup.appendChild(btn);
      });

      wrapper.appendChild(cockpitGroup);
      wrapper.appendChild(extGroup);

    } else {
      // 1-Plane Solo Camera Bar
      const soloGroup = document.createElement('div');
      soloGroup.className = 'view-group solo-group';

      const soloList = [
        { id: 'cockpit_1', nameKey: 'cockpit1Short', shortKey: 'cockpit1Short', title: '操縦席コックピット視点 [1]' },
        { id: 'chase', nameKey: 'viewChase', shortKey: 'viewChaseShort', title: '後方追従カメラ [2]' },
        { id: 'wing', nameKey: 'viewWing', shortKey: 'viewWingShort', title: '翼端カメラ [3]' },
        { id: 'tower', nameKey: 'viewTower', shortKey: 'viewTowerShort', title: '管制塔カメラ [4]' },
        { id: 'ground', nameKey: 'viewGround', shortKey: 'viewGroundShort', title: 'エプロン地上観覧席 [5]' },
        { id: 'orbit', nameKey: 'viewOrbit', shortKey: 'viewOrbitShort', title: '自由旋回カメラ [6]' },
      ];

      soloList.forEach((v) => {
        const btn = document.createElement('button');
        btn.className = `view-btn ${v.id === this.currentView ? 'active' : ''}`;
        btn.id = `view-btn-${v.id}`;
        btn.title = v.title;
        btn.innerHTML = `<span class="view-label">${i18n.t(v.shortKey || v.nameKey)}</span>`;
        btn.addEventListener('click', () => {
          this.setActive(v.id);
          if (this.callbacks.onViewChange) {
            this.callbacks.onViewChange(v.id);
          }
        });
        soloGroup.appendChild(btn);
      });

      wrapper.appendChild(soloGroup);
    }

    this.container.appendChild(wrapper);
  }

  setActive(viewId) {
    this.currentView = viewId;
    const btns = this.container.querySelectorAll('.view-btn');
    btns.forEach((b) => b.classList.remove('active'));
    const target = this.container.querySelector(`#view-btn-${viewId}`);
    if (target) target.classList.add('active');
  }

  updateLanguage() {
    this.render();
  }
}
