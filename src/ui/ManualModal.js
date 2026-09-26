/**
 * ManualModal.js
 * In-App Interactive User Manual Modal with multi-tab layout and bilingual support.
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

        <h3>🕹️ 最初のフライト</h3>
        <ol style="margin-left: 20px; line-height: 1.8;">
          <li>画面上部タブで<b>「5機編隊モード」</b>または<b>「1機ソロモード」</b>を選択。</li>
          <li><b>「演目鑑賞 (オート)」</b>で公式アクロバットを鑑賞するか、<b>「手動操縦」</b>で自分で操縦。</li>
          <li>手動操縦時は、画面上部ガイダンスの指示に従いスロットル100% (Rキー) ➔ 130KTでWキーを引き離陸！</li>
          <li><b>[I] キー</b>で操縦指導の表示/非表示、<b>[M] キー</b>で本マニュアルをいつでも開閉できます。</li>
        </ol>
      `
        : `
        <h3>🚀 Quick Start</h3>
        <p>High-fidelity 3D aerobatics flight simulator featuring JASDF Matsushima Air Base (RJST), real GeoTIFF terrain, and the Kawasaki T-4 Blue Impulse demonstration squadron.</p>
        
        <h3>🎯 Two Main Flight Modes</h3>
        <ul>
          <li><b>👥 5-Ship Formation Mode</b>: 5-jet diamond/delta routines, 5 selectable cockpits, and companion AI pilot boarding.</li>
          <li><b>🛩️ Solo 1-Jet Mode</b>: Streamlined single-jet flight with dedicated solo aerobatics.</li>
        </ul>

        <h3>🕹️ Your First Flight</h3>
        <ol style="margin-left: 20px; line-height: 1.8;">
          <li>Choose <b>5-Ship Formation</b> or <b>Solo 1-Jet</b> at the top.</li>
          <li>Select <b>Auto Display</b> to watch aerobatics, or <b>Manual Piloting</b> to fly.</li>
          <li>In Manual mode, follow on-screen HUD directives: advance throttle to 100% [R key], pull stick [W key] at 130 KT to rotate!</li>
          <li>Press <b>[I]</b> to toggle flight guidance, <b>[M]</b> to open this manual anytime.</li>
        </ol>
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
            <tr><td><b>スピードブレーキ (空中減速)</b></td><td><span class="manual-key-badge">B</span></td><td>空力エアブレーキ展開で急速減速</td></tr>
            <tr><td><b>車輪ブレーキ (地上完全停止)</b></td><td><span class="manual-key-badge">Ctrl</span> / <span class="manual-key-badge">X</span> (長押し) または <span class="manual-key-badge">B</span></td><td><b>着地接地中に長押しで強力ブレーキ（完全停止）</b></td></tr>
            <tr><td><b>スモーク切替</b></td><td><span class="manual-key-badge">Space</span> または <span class="manual-key-badge">V</span></td><td>スモーク発生の ON / OFF 切替</td></tr>
            <tr><td><b>操縦指導切替</b></td><td><span class="manual-key-badge">I</span></td><td>画面上部フライト指示バナーの ON / OFF</td></tr>
            <tr><td><b>HUD折りたたみ</b></td><td><span class="manual-key-badge">H</span> または タイルヘッダー</td><td>左上 PFD HUD の折りたたみ / 展開</td></tr>
            <tr><td><b>計器・タイムライン</b></td><td><span class="manual-key-badge">T</span> または ドックヘッダー</td><td>下部 計器＆タイムラインドックの折りたたみ / 展開</td></tr>
            <tr><td><b>コントロールパネル</b></td><td><span class="manual-key-badge">◀ / ▶</span> ボタン</td><td>右側 フライト設定パネルの折りたたみ / 展開</td></tr>
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
            <tr><td><b>Collapse HUD</b></td><td><span class="manual-key-badge">H</span> or Header</td><td>Toggle Top-Left PFD HUD collapse</td></tr>
            <tr><td><b>Collapse Telemetry</b></td><td><span class="manual-key-badge">T</span> or Header</td><td>Toggle Bottom Telemetry & Timeline collapse</td></tr>
            <tr><td><b>Collapse Panel</b></td><td><span class="manual-key-badge">◀ / ▶</span> Button</td><td>Toggle Right Control Panel collapse</td></tr>
            <tr><td><b>UI Scale Zoom</b></td><td><span class="manual-key-badge">[</span> / <span class="manual-key-badge">]</span> (0 Reset)</td><td>Adjust UI scale by 5% increments</td></tr>
            <tr><td><b>Manual Modal</b></td><td><span class="manual-key-badge">M</span></td><td>Open / close this manual</td></tr>
          </tbody>
        </table>
      `;
    } else if (tabId === 'modes') {
      this.modalBody.innerHTML = isJa
        ? `
        <h3>👥 5機編隊モード (5-Ship Formation Mode)</h3>
        <p>実機さながらの5機編隊によるダイナミックなアクロバットと緊密な編隊飛行を楽しめます。</p>
        <ul>
          <li><b>どのコックピットから見るか (演目鑑賞時)</b>:
            <br>1番機(編隊長)、2番機(左翼)、3番機(右翼)、4番機(スロット)、5番機(ソロ)の視点をワンクリックで切り替え。僚機を見渡すリアルな視界を体験できます。
          </li>
          <li><b>どの機体に乗るか (演目操縦時)</b>:
            <br>自分が担当する機体（1〜5番機）を選択。AI僚機たちが公式演目を演じる中で、画面のナビゲーション指示に従って一緒に演技を完成させます（1番機で編隊をリード、2〜4番機で僚機追従、5番機でソロ機動）。
          </li>
          <li><b>🎨 手動操縦機のカラー識別システム (腕前証明)</b>:
            <br>手動操縦に参加した機体は、他の標準ブルーインパルス機(青白)と区別できるように<b>「🏆 ゴールド・リーダー」「🔥 クリムゾン・レッド」「⚡ サイバー・ネオン」「🥋 ステルス・ブラック」「🌸 サクラ・ピンク」</b>などの特別リバリーや3Dマーカーが適用されます。動画撮影や配信、スクリーンショットで手動操縦の巧さを証明できます！
          </li>
          <li><b>💥 僚機との空中接触・衝突判定 (アウト判定)</b>:
            <br>手動操縦中に他の編隊僚機と接触（6.5m未満）すると即座に<b>「MID-AIR COLLISION / アウト」</b>となります。近接時には警告アラートが点滅します。
          </li>
          <li><b>🏆 編隊シンクロ率スコア (コンテスト採点)</b>:
            <br>公式演目の理想位置・姿勢・速度との同調精度をリアルタイム採点（RANK S: 92%+, RANK A: 82%+）。接触せずに高得点を維持して演技を完遂しましょう！
          </li>
        </ul>

        <h3>🛩️ 1機ソロモード (Solo Mode)</h3>
        <p>余計な編隊設定や他機切り替えを排除し、川崎 T-4 の高性能な運動性能を存分に楽しめる単独飛行専用モードです。</p>
        <ul>
          <li>単独垂直大宙返り、スパイラルロール、急上昇クライム、コンバットピッチなどのソロ演目を鑑賞。</li>
          <li>松島基地滑走路07からの離陸、松島湾上空周回、着陸を手動で満喫。</li>
        </ul>
      `
        : `
        <h3>👥 5-Ship Formation Mode</h3>
        <p>Experience authentic Japanese aerobatics with 5 Kawasaki T-4 jets in tight formation.</p>
        <ul>
          <li><b>Selectable Cockpit Views (Auto Replay)</b>:
            <br>Switch between #1 Lead, #2 Left Wing, #3 Right Wing, #4 Slot, and #5 Lead Solo cockpits.
          </li>
          <li><b>Boarded Aircraft Selection (Manual Piloting)</b>:
            <br>Choose which plane to pilot. Fly as #1 Lead with AI wingmen following, or as #5 Lead Solo performing dynamic aerobatics around the formation.
          </li>
          <li><b>🎨 Distinct Pilot Jet Livery</b>:
            <br>Your manually controlled jet is rendered in distinct livery (Special Gold, Crimson Red, Cyber Neon, Stealth Carbon, Sakura Pink) with a 3D player badge so viewers can immediately identify your manual piloting skills!
          </li>
          <li><b>💥 Mid-Air Collision Out Detection</b>:
            <br>Colliding with fellow wingmen within 6.5m triggers a mid-air collision termination with proximity alerts when near.
          </li>
          <li><b>🏆 Formation Synchronicity Score</b>:
            <br>Real-time precision tracking scoring your adherence to the official maneuver route (Rank S, A, B, C).
          </li>
        </ul>

        <h3>🛩️ Solo 1-Jet Mode</h3>
        <p>A pure, distraction-free single jet simulation designed for unrestricted free flight and solo aerobatics.</p>
      `;
    } else if (tabId === 'routines') {
      this.modalBody.innerHTML = isJa
        ? `
        <h3>✈️ ブルーインパルス 7大公式アクロバット演目</h3>
        <ol style="margin-left: 20px; line-height: 1.8;">
          <li><b>1. 4機ダイヤモンド離陸 ＆ 5番機ロールオン空中合流</b>:
            <br>実機さながらに1〜4番機がダイヤモンド隊形で同時離陸。滑走路待機した5番機が低角ロール離陸で急上昇し空中で合流。
          </li>
          <li><b>2. デルタループ ＆ ロール</b>:
            <br>5機密集デルタ隊形のまま 350KT で進入し、4G の巨大な垂直大宙返りとバレルロールを実施。
          </li>
          <li><b>3. スタークロス</b>:
            <br>垂直上昇から5機が四方八方へ扇状に散開し、大空いっぱいに巨大な五芒星を描く名物演目。
          </li>
          <li><b>4. レベルサンライズ</b>:
            <br>超密集デルタから、合図とともに5機が一斉に左右上下へ扇状に大開花ブレイク。
          </li>
          <li><b>5. チェンジオーバー・ターン</b>:
            <br>縦一列トレイル隊形で進入し、大半径旋回を行いながらダイヤモンド、デルタへと流麗に変形。
          </li>
          <li><b>6. コークスクリュー</b>:
            <br>4機の直線白スモークの周囲を、5番機が連続バレルロールで螺旋状に包み込む。
          </li>
          <li><b>7. ローリング・コンバット・ピッチ ＆ 編隊着陸</b>:
            <br>松島基地滑走路07上空を低空通過後、順次ブレイク旋回し滑走路へ整然と着陸。
          </li>
        </ol>
      `
        : `
        <h3>✈️ Official Display Routines</h3>
        <ol style="margin-left: 20px; line-height: 1.8;">
          <li><b>1. 4-Ship Diamond Takeoff & Solo Roll-on Join-up</b>: Authentic simultaneous 4-ship liftoff followed by #5 solo roll-on takeoff and aerial join-up.</li>
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
