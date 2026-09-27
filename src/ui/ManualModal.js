/**
 * ManualModal.js
 * In-App Interactive User Manual Modal (Lightweight & High-Performance).
 * Contains essential flight controls and mode guidance with bilingual (JA/EN) support.
 */

import { i18n } from '../i18n/translations.js';

export class ManualModal {
  constructor() {
    this.overlay = document.getElementById('manual-modal-overlay');
    this.modalBtn = document.getElementById('manual-modal-btn');
    this.closeBtn = document.getElementById('manual-close-btn');
    this.modalBody = document.getElementById('manual-modal-body');
    this.modalTitle = document.getElementById('manual-modal-heading');
    this.currentTab = 'quickstart';

    this.bindEvents();
    this.renderTab(this.currentTab);
  }

  bindEvents() {
    if (this.modalBtn) {
      this.modalBtn.addEventListener('click', () => this.open());
    }
    if (this.closeBtn) {
      this.closeBtn.addEventListener('click', () => this.close());
    }
    if (this.overlay) {
      this.overlay.addEventListener('click', (e) => {
        if (e.target === this.overlay) this.close();
      });
    }

    const tabBtns = document.querySelectorAll('.manual-tab-btn');
    tabBtns.forEach((btn) => {
      btn.addEventListener('click', () => {
        const tab = btn.dataset.manualTab;
        if (!tab) return;
        this.currentTab = tab;
        tabBtns.forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
        this.renderTab(tab);
      });
    });
  }

  open() {
    if (this.overlay) {
      this.overlay.style.display = 'flex';
      this.renderTab(this.currentTab);
    }
  }

  close() {
    if (this.overlay) {
      this.overlay.style.display = 'none';
    }
  }

  toggle() {
    if (!this.overlay) return;
    if (this.overlay.style.display === 'none' || !this.overlay.style.display) {
      this.open();
    } else {
      this.close();
    }
  }

  renderTab(tabId) {
    if (!this.modalBody) return;
    const isJa = i18n.lang === 'ja';

    if (tabId === 'quickstart') {
      this.modalBody.innerHTML = isJa
        ? `
        <h3>🚀 はじめに (クイックスタート)</h3>
        <p>航空自衛隊 松島基地 (RJST) を舞台に、実地形データ（仙台・松島湾）と川崎重工 T-4 によるブルーインパルスの編隊飛行・アクロバット展示を体験できる3Dフライトシミュレーターです。</p>
        
        <h3>🎯 2つのメインモード</h3>
        <ul>
          <li><b>👥 5機編隊モード</b>: 1〜5番機による編隊飛行、7大公式演目鑑賞、各コックピット視点切替、搭乗機選択による手動編隊飛行。</li>
          <li><b>🛩️ 1機ソロモード</b>: 余計な編隊UIのない、単独アクロバット演目および自由なフリーフライト。</li>
        </ul>

        <h3>🕹️ 最初のフライト手順</h3>
        <ol style="margin-left: 20px; line-height: 1.8;">
          <li>画面上部タブで<b>「5機編隊モード」</b>または<b>「1機ソロモード」</b>を選択。</li>
          <li><b>「演目鑑賞 (オート)」</b>で公式アクロバットを鑑賞するか、<b>「手動操縦」</b>で自分で操縦。</li>
          <li>手動操縦時はスロットル100%（<b>Shift/Z/Rキー</b>）➔ 130KTで機首を引き（<b>S/↓キー</b>）離陸！</li>
          <li><b>[I] キー</b>で操縦指導の表示/非表示、<b>[M] キー</b>で本マニュアルをいつでも開閉できます。</li>
        </ol>

        <div class="manual-note-box">
          📖 <b>詳細マニュアルについて</b>: インストール手順、詳細な飛行力学、FAQ等の完全版は同梱の <code>MANUAL_JA.md</code> / <code>MANUAL_EN.md</code> をご覧ください。
        </div>
      `
        : `
        <h3>🚀 Quick Start</h3>
        <p>High-fidelity 3D aerobatics flight simulator featuring JASDF Matsushima Air Base (RJST), real terrain, and the Kawasaki T-4 Blue Impulse demonstration squadron.</p>
        
        <h3>🎯 Two Main Flight Modes</h3>
        <ul>
          <li><b>👥 5-Ship Formation Mode</b>: 5-jet diamond/delta routines, 5 selectable cockpits, and companion AI pilot boarding.</li>
          <li><b>🛩️ Solo 1-Jet Mode</b>: Streamlined single-jet flight with dedicated solo aerobatics and unrestricted free flight.</li>
        </ul>

        <h3>🕹️ Your First Flight</h3>
        <ol style="margin-left: 20px; line-height: 1.8;">
          <li>Choose <b>5-Ship Formation</b> or <b>Solo 1-Jet</b> at the top.</li>
          <li>Select <b>Auto Display</b> to watch aerobatics, or <b>Manual Piloting</b> to fly.</li>
          <li>In Manual mode: throttle 100% (<b>Shift/Z/R key</b>) ➔ pull stick (<b>S/↓ key</b>) at 130 KT to liftoff!</li>
          <li>Press <b>[I]</b> to toggle flight guidance, <b>[M]</b> to open this manual anytime.</li>
        </ol>

        <div class="manual-note-box">
          📖 <b>Comprehensive Manual</b>: For detailed aerodynamics, installation guide, and full FAQs, please refer to <code>MANUAL_EN.md</code> / <code>MANUAL_JA.md</code> included with the application.
        </div>
      `;
    } else if (tabId === 'controls') {
      this.modalBody.innerHTML = isJa
        ? `
        <h3>🕹️ フライト操縦キー一覧 (Manual Flight Keys)</h3>
        <table class="manual-table">
          <thead>
            <tr><th>機能</th><th>キー</th><th>説明</th></tr>
          </thead>
          <tbody>
            <tr><td><b>機首の上下 (ピッチ)</b></td><td><span class="manual-key-badge">S</span> / <span class="manual-key-badge">W</span> または <span class="manual-key-badge">↓</span> / <span class="manual-key-badge">↑</span></td><td><b>[S] または [↓] で機首上げ (上昇・手前に引く)</b> / <b>[W] または [↑] で機首下げ (降下・前に倒す)</b></td></tr>
            <tr><td><b>左右の傾き (ロール)</b></td><td><span class="manual-key-badge">A</span> / <span class="manual-key-badge">D</span> または <span class="manual-key-badge">←</span> / <span class="manual-key-badge">→</span></td><td><b>[A] または [←] で左に傾く</b> / <b>[D] または [→] で右に傾く</b></td></tr>
            <tr><td><b>左右首振り (ラダー)</b></td><td><span class="manual-key-badge">Q</span> / <span class="manual-key-badge">E</span></td><td>左右ラダー旋回・地上ノーズホイール操舵</td></tr>
            <tr><td><b>スロットル (エンジン推力)</b></td><td><span class="manual-key-badge">Shift</span> / <span class="manual-key-badge">Z</span> (増) <br><span class="manual-key-badge">Ctrl</span> / <span class="manual-key-badge">X</span> (減)</td><td>エンジン出力調整 (離陸100%, 巡航60%, 着陸アイドル0%)</td></tr>
            <tr><td><b>着陸脚 (車輪・ギア)</b></td><td><span class="manual-key-badge">G</span></td><td>車輪(ギア)の格納／展開</td></tr>
            <tr><td><b>スピードブレーキ</b></td><td><span class="manual-key-badge">B</span></td><td>空力エアブレーキ展開で空中減速</td></tr>
            <tr><td><b>車輪ブレーキ (完全停止)</b></td><td><span class="manual-key-badge">Ctrl</span> / <span class="manual-key-badge">X</span> (長押し) または <span class="manual-key-badge">B</span></td><td><b>着地接地中に長押しで強力ブレーキ（完全停止）</b></td></tr>
            <tr><td><b>スモーク切替</b></td><td><span class="manual-key-badge">Space</span> または <span class="manual-key-badge">V</span></td><td>スモーク発生の ON / OFF 切替</td></tr>
            <tr><td><b>操縦指導切替</b></td><td><span class="manual-key-badge">I</span></td><td>画面上部フライト指示バナーの ON / OFF</td></tr>
            <tr><td><b>HUD折りたたみ</b></td><td><span class="manual-key-badge">H</span></td><td>左上 PFD HUD の折りたたみ / 展開</td></tr>
            <tr><td><b>計器・タイムライン</b></td><td><span class="manual-key-badge">T</span></td><td>下部 計器＆タイムラインドックの折りたたみ / 展開</td></tr>
            <tr><td><b>UI縮尺ズーム</b></td><td><span class="manual-key-badge">[</span> / <span class="manual-key-badge">]</span> (0でリセット)</td><td>画面UIサイズを5%単位で拡大・縮小</td></tr>
            <tr><td><b>マニュアル表示</b></td><td><span class="manual-key-badge">M</span></td><td>本取扱説明書モーダルの開閉</td></tr>
          </tbody>
        </table>

        <h3>🎥 カメラ視点切替キー</h3>
        <table class="manual-table">
          <thead>
            <tr><th>キー</th><th>5機編隊モード時の視点</th><th>1機ソロモード時の視点</th></tr>
          </thead>
          <tbody>
            <tr><td><span class="manual-key-badge">1</span></td><td>🌐 5機全体俯瞰ビュー</td><td>✈️ コックピット視点</td></tr>
            <tr><td><span class="manual-key-badge">2</span></td><td>👑 1番機コックピット (編隊長)</td><td>🎥 後方追従カメラ</td></tr>
            <tr><td><span class="manual-key-badge">3</span></td><td>🪶 2番機コックピット (左翼機)</td><td>🪶 翼端カメラ</td></tr>
            <tr><td><span class="manual-key-badge">4</span></td><td>🪶 3番機コックピット (右翼機)</td><td>🗼 松島基地 管制塔</td></tr>
            <tr><td><span class="manual-key-badge">5</span></td><td>🎯 4番機コックピット (スロット)</td><td>🎪 地上観覧席カメラ</td></tr>
            <tr><td><span class="manual-key-badge">6</span></td><td>⚡ 5番機コックピット (ソロ機)</td><td>🔄 360° 自由旋回カメラ</td></tr>
            <tr><td><span class="manual-key-badge">7</span></td><td>🎥 後方追従カメラ</td><td>—</td></tr>
            <tr><td><span class="manual-key-badge">8</span></td><td>🗼 松島基地 管制塔カメラ</td><td>—</td></tr>
            <tr><td><span class="manual-key-badge">9</span></td><td>🎪 地上観覧席カメラ</td><td>—</td></tr>
          </tbody>
        </table>
      `
        : `
        <h3>🕹️ Flight Controls Guide</h3>
        <table class="manual-table">
          <thead>
            <tr><th>Control</th><th>Key</th><th>Description</th></tr>
          </thead>
          <tbody>
            <tr><td><b>Pitch (Elevator)</b></td><td><span class="manual-key-badge">S</span> / <span class="manual-key-badge">W</span> or <span class="manual-key-badge">↓</span> / <span class="manual-key-badge">↑</span></td><td><b>Pitch Up (S / ↓ - Pull Stick)</b> / <b>Pitch Down (W / ↑ - Push Stick)</b></td></tr>
            <tr><td><b>Roll (Aileron)</b></td><td><span class="manual-key-badge">A</span> / <span class="manual-key-badge">D</span> or <span class="manual-key-badge">←</span> / <span class="manual-key-badge">→</span></td><td>Bank Left (A / ←) / Bank Right (D / →)</td></tr>
            <tr><td><b>Yaw (Rudder)</b></td><td><span class="manual-key-badge">Q</span> / <span class="manual-key-badge">E</span></td><td>Rudder left / right, Nosewheel steering</td></tr>
            <tr><td><b>Throttle</b></td><td><span class="manual-key-badge">Shift</span> / <span class="manual-key-badge">Z</span> (Up) <br><span class="manual-key-badge">Ctrl</span> / <span class="manual-key-badge">X</span> (Down)</td><td>Engine thrust (100% Takeoff, 60% Cruise, 0% Idle)</td></tr>
            <tr><td><b>Landing Gear</b></td><td><span class="manual-key-badge">G</span></td><td>Toggle landing gear retraction / extension</td></tr>
            <tr><td><b>Speed Brake</b></td><td><span class="manual-key-badge">B</span></td><td>Toggle fuselage aerodynamic airbrake</td></tr>
            <tr><td><b>Wheel Brakes (Full Stop)</b></td><td><span class="manual-key-badge">Ctrl</span> / <span class="manual-key-badge">X</span> (Hold) or <span class="manual-key-badge">B</span></td><td><b>Hold after touchdown to brake to a complete stop</b></td></tr>
            <tr><td><b>Smoke System</b></td><td><span class="manual-key-badge">Space</span> or <span class="manual-key-badge">V</span></td><td>Toggle smoke generator ON / OFF</td></tr>
            <tr><td><b>Guidance Toggle</b></td><td><span class="manual-key-badge">I</span></td><td>Toggle on-screen directive HUD banner</td></tr>
            <tr><td><b>Collapse HUD</b></td><td><span class="manual-key-badge">H</span></td><td>Toggle Top-Left PFD HUD collapse</td></tr>
            <tr><td><b>Collapse Telemetry</b></td><td><span class="manual-key-badge">T</span></td><td>Toggle Bottom Telemetry & Timeline collapse</td></tr>
            <tr><td><b>UI Scale Zoom</b></td><td><span class="manual-key-badge">[</span> / <span class="manual-key-badge">]</span> (0 Reset)</td><td>Adjust UI scale by 5% increments</td></tr>
            <tr><td><b>Manual Modal</b></td><td><span class="manual-key-badge">M</span></td><td>Open / close this manual</td></tr>
          </tbody>
        </table>

        <h3>🎥 Camera View Shortcuts</h3>
        <table class="manual-table">
          <thead>
            <tr><th>Key</th><th>5-Ship Formation Mode</th><th>Solo 1-Jet Mode</th></tr>
          </thead>
          <tbody>
            <tr><td><span class="manual-key-badge">1</span></td><td>🌐 5-Ship Overview</td><td>✈️ Cockpit View</td></tr>
            <tr><td><span class="manual-key-badge">2</span></td><td>👑 #1 Lead Cockpit</td><td>🎥 Chase Cam</td></tr>
            <tr><td><span class="manual-key-badge">3</span></td><td>🪶 #2 Left Wing Cockpit</td><td>🪶 Wingtip Cam</td></tr>
            <tr><td><span class="manual-key-badge">4</span></td><td>🪶 #3 Right Wing Cockpit</td><td>🗼 RJST Control Tower</td></tr>
            <tr><td><span class="manual-key-badge">5</span></td><td>🎯 #4 Slot Cockpit</td><td>🎪 Airshow Spectator Cam</td></tr>
            <tr><td><span class="manual-key-badge">6</span></td><td>⚡ #5 Lead Solo Cockpit</td><td>🔄 360° Free Orbit Cam</td></tr>
            <tr><td><span class="manual-key-badge">7</span></td><td>🎥 Dynamic Chase Cam</td><td>—</td></tr>
            <tr><td><span class="manual-key-badge">8</span></td><td>🗼 RJST Control Tower Cam</td><td>—</td></tr>
            <tr><td><span class="manual-key-badge">9</span></td><td>🎪 Airshow Spectator Cam</td><td>—</td></tr>
          </tbody>
        </table>
      `;
    } else if (tabId === 'modes') {
      this.modalBody.innerHTML = isJa
        ? `
        <h3>👥 5機編隊モード (5-Ship Formation Mode)</h3>
        <p>実機さながらの5機編隊によるダイナミックなアクロバットと緊密な編隊飛行を楽しめます。</p>
        <ul>
          <li><b>コックピット視点切替 (演目鑑賞時)</b>:
            <br>1番機(編隊長)、2番機(左翼)、3番機(右翼)、4番機(スロット)、5番機(ソロ)の視点をワンクリックで切り替え。
          </li>
          <li><b>搭乗機選択 (演目操縦時)</b>:
            <br>担当する機体（1〜5番機）を選択。画面指示に従いAI僚機たちと一緒に演技を完成させます。
          </li>
          <li><b>🎨 パイロット特別リバリー</b>:
            <br>手動操縦機は特別カラー（ゴールド、クリムゾンレッド、サイバーネオン等）と3Dマーカーで識別可能。
          </li>
          <li><b>💥 空中接触判定 ＆ 🏆 シンクロ率スコア</b>:
            <br>僚機と6.5m未満で接触するとアウト判定。演技の同調精度をリアルタイム採点（Rank S: 92%+, A: 82%+）。
          </li>
        </ul>

        <h3>🛩️ 1機ソロモード (Solo Mode)</h3>
        <p>川崎 T-4 の高性能な運動性能を存分に楽しめる単独飛行専用モードです。ソロ演目鑑賞や松島湾フリーフライトを満喫できます。</p>
      `
        : `
        <h3>👥 5-Ship Formation Mode</h3>
        <p>Experience authentic Japanese aerobatics with 5 Kawasaki T-4 jets in tight formation.</p>
        <ul>
          <li><b>Selectable Cockpits</b>: Switch between #1 Lead, #2 Left Wing, #3 Right Wing, #4 Slot, and #5 Lead Solo views.</li>
          <li><b>Boarded Aircraft</b>: Choose which plane to pilot (#1 to #5) alongside AI wingmen.</li>
          <li><b>🎨 Distinct Livery</b>: Your piloted jet features unique custom colors and a 3D pilot indicator.</li>
          <li><b>💥 Collision Out & 🏆 Sync Scoring</b>: 6.5m proximity boundary detection and real-time synchronicity scoring.</li>
        </ul>

        <h3>🛩️ Solo 1-Jet Mode</h3>
        <p>A pure single-jet flight experience designed for unrestricted free flight and dynamic solo aerobatics.</p>
      `;
    } else if (tabId === 'routines') {
      this.modalBody.innerHTML = isJa
        ? `
        <h3>✈️ ブルーインパルス 7大公式アクロバット演目</h3>
        <ol style="margin-left: 20px; line-height: 1.8;">
          <li><b>1. 4機ダイヤモンド離陸 ＆ 5番機ロールオン空中合流</b>: 1〜4番機同時離陸＋5番機ロール離陸・合流。</li>
          <li><b>2. デルタループ ＆ ロール</b>: 5機密集デルタ隊形のまま 350KT で進入し 4G の垂直大宙返り。</li>
          <li><b>3. スタークロス</b>: 垂直上昇から5機が扇状に散開し、大空に巨大な五芒星を描く名物演目。</li>
          <li><b>4. レベルサンライズ</b>: 超密集デルタから、5機が一斉に左右上下へ大開花ブレイク。</li>
          <li><b>5. チェンジオーバー・ターン</b>: トレイル隊形からダイヤモンド、デルタへと流麗に変形旋回。</li>
          <li><b>6. コークスクリュー</b>: 4機の直線白スモークの周囲を5番機が連続バレルロール螺旋。</li>
          <li><b>7. ローリング・コンバット・ピッチ ＆ 編隊着陸</b>: 低空通過から順次ブレイク旋回し滑走路へ整然と着陸。</li>
        </ol>
      `
        : `
        <h3>✈️ Official Display Routines</h3>
        <ol style="margin-left: 20px; line-height: 1.8;">
          <li><b>1. 4-Ship Diamond Takeoff & Solo Roll-on Join-up</b>: 4-ship simultaneous liftoff followed by #5 solo roll-on.</li>
          <li><b>2. Delta Loop & Roll</b>: 350 KT vertical 4G loop with barrel roll in tight delta.</li>
          <li><b>3. Star Cross</b>: 5-way vertical fan break carving a giant 5-pointed star in the sky.</li>
          <li><b>4. Level Sunrise</b>: Low-altitude level delta fan break opening in 5 directions.</li>
          <li><b>5. Changeover Turn</b>: Morphing from Trail to Diamond and Delta during turning.</li>
          <li><b>6. Corkscrew</b>: 4-ship straight smoke pocket spiraled by #5 solo barrel roll.</li>
          <li><b>7. Rolling Combat Pitch & Landing</b>: Pitch break recovery into Runway 07 touchdown.</li>
        </ol>
      `;
    }
  }

  updateLanguage() {
    const isJa = i18n.lang === 'ja';
    const btn = document.getElementById('manual-modal-btn');
    if (btn) btn.textContent = isJa ? '📖 マニュアル' : '📖 Manual';

    const heading = document.getElementById('manual-modal-heading');
    if (heading) heading.textContent = isJa
      ? 'ブルーインパルス 3Dフライトシミュレーター 取扱説明書'
      : 'Blue Impulse 3D Simulator User Manual';

    const tabBtns = document.querySelectorAll('.manual-tab-btn');
    if (tabBtns.length >= 4) {
      tabBtns[0].textContent = isJa ? '🚀 クイックスタート' : '🚀 Quick Start';
      tabBtns[1].textContent = isJa ? '🕹️ 操縦・キー操作' : '🕹️ Flight Controls';
      tabBtns[2].textContent = isJa ? '👥 5機 / 1機モード' : '👥 Flight Modes';
      tabBtns[3].textContent = isJa ? '✈️ 7大公式演目' : '✈️ Routines';
    }

    this.renderTab(this.currentTab);
  }
}
