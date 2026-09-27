/**
 * ManualModal.js
 * In-App Interactive User Manual Modal with 10 comprehensive tabs and full bilingual (JA/EN) support.
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
    window.__manualModal = this;
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

  setTab(tabId) {
    this.currentTab = tabId;
    const tabBtns = document.querySelectorAll('.manual-tab-btn');
    tabBtns.forEach((b) => {
      if (b.dataset.manualTab === tabId) {
        b.classList.add('active');
      } else {
        b.classList.remove('active');
      }
    });
    this.renderTab(tabId);
  }

  renderTab(tabId) {
    if (!this.modalBody) return;
    const isJa = i18n.lang === 'ja';

    switch (tabId) {
      case 'quickstart':
        this.modalBody.innerHTML = isJa ? this.getJaQuickstart() : this.getEnQuickstart();
        break;
      case 'controls':
        this.modalBody.innerHTML = isJa ? this.getJaControls() : this.getEnControls();
        break;
      case 'flightguide':
        this.modalBody.innerHTML = isJa ? this.getJaFlightGuide() : this.getEnFlightGuide();
        break;
      case 'modes':
        this.modalBody.innerHTML = isJa ? this.getJaModes() : this.getEnModes();
        break;
      case 'routines':
        this.modalBody.innerHTML = isJa ? this.getJaRoutines() : this.getEnRoutines();
        break;
      case 'cameras':
        this.modalBody.innerHTML = isJa ? this.getJaCameras() : this.getEnCameras();
        break;
      case 'systems':
        this.modalBody.innerHTML = isJa ? this.getJaSystems() : this.getEnSystems();
        break;
      case 'install':
        this.modalBody.innerHTML = isJa ? this.getJaInstall() : this.getEnInstall();
        break;
      case 'faq':
        this.modalBody.innerHTML = isJa ? this.getJaFaq() : this.getEnFaq();
        break;
      case 'fullmanual':
        this.modalBody.innerHTML = isJa ? this.getJaFullManual() : this.getEnFullManual();
        break;
      default:
        this.modalBody.innerHTML = isJa ? this.getJaQuickstart() : this.getEnQuickstart();
        break;
    }

    // Scroll body back to top on tab change
    this.modalBody.scrollTop = 0;
  }

  // --- JA CONTENT METHODS ---

  getJaQuickstart() {
    return `
      <h3>🚀 はじめに (クイックスタート)</h3>
      <p>航空自衛隊 松島基地 (RJST) を舞台に、実地形 DEM 標高データ（仙台・松島湾）と川崎重工 T-4 によるブルーインパルスの編隊飛行・アクロバット展示を体験できる 3D フライトシミュレーターです。</p>
      
      <div class="manual-note-box">
        💡 <b>キーボードショートカット</b>: <b>[M] キー</b> で本マニュアルの開閉、<b>[I] キー</b> で画面上部ガイダンスの表示/非表示を切り替えられます。
      </div>

      <h3>🎯 2つのメイン飛行モード</h3>
      <ul>
        <li><b>👥 5機編隊モード</b>: 1〜5番機によるダイナミックな編隊飛行。7大公式演目鑑賞、全コックピット視点切替、搭乗機選択による手動編隊飛行。</li>
        <li><b>🛩️ 1機ソロモード</b>: 余計な編隊UIのない、T-4 単独機でのダイナミックなソロ演目および自由なフリーフライト。</li>
      </ul>

      <h3>🕹️ 最初のフライト手順（手動離陸）</h3>
      <ol style="margin-left: 20px; line-height: 1.8;">
        <li>画面上部タブで<b>「5機編隊モード」</b>または<b>「1機ソロモード」</b>を選択。</li>
        <li>操作サブモードで<b>「手動操縦」</b>を選択（5機編隊では搭乗機 #1〜#5 を選択可能）。</li>
        <li><b>[Shift] または [Z] キー</b>（または [R] キー）でスロットルを <b>100% (フルスラスト)</b> へ前進。</li>
        <li>対気速度が <b>130 KT</b> を超えたら、<b>[S] または [↓] キー</b>（スティックを手前に引く）で機首を上げ離陸（ローテーション）。</li>
        <li>上昇を開始したら <b>[G] キー</b> で着陸脚（ギア）を格納。高度 2,000 ft まで上昇後、スロットルを <b>60%</b> に下げて水平巡航へ移行します。</li>
      </ol>

      <h3>🎮 主要キー操作一覧 (早見表)</h3>
      <table class="manual-table">
        <thead>
          <tr><th>機能</th><th>キー</th><th>動作</th></tr>
        </thead>
        <tbody>
          <tr><td><b>ピッチ (機首上げ/下げ)</b></td><td><span class="manual-key-badge">S</span> / <span class="manual-key-badge">W</span> または <span class="manual-key-badge">↓</span> / <span class="manual-key-badge">↑</span></td><td>S / ↓ で機首上げ (上昇) / W / ↑ で機首下げ (降下)</td></tr>
          <tr><td><b>ロール (左右傾き)</b></td><td><span class="manual-key-badge">A</span> / <span class="manual-key-badge">D</span> または <span class="manual-key-badge">←</span> / <span class="manual-key-badge">→</span></td><td>A / ← で左バンク / D / → で右バンク</td></tr>
          <tr><td><b>スロットル (推力)</b></td><td><span class="manual-key-badge">Shift</span> / <span class="manual-key-badge">Z</span> (増) <br><span class="manual-key-badge">Ctrl</span> / <span class="manual-key-badge">X</span> (減)</td><td>エンジン出力調整 (離陸100%, 巡航60%, 着陸0%)</td></tr>
          <tr><td><b>着陸脚 (ギア)</b></td><td><span class="manual-key-badge">G</span></td><td>車輪(ギア)の格納／展開</td></tr>
          <tr><td><b>車輪ブレーキ (完全停止)</b></td><td><span class="manual-key-badge">Ctrl</span> / <span class="manual-key-badge">X</span> (長押し) または <span class="manual-key-badge">B</span></td><td><b>着地接地中に長押しで強力ブレーキ（完全停止）</b></td></tr>
          <tr><td><b>スモーク噴射</b></td><td><span class="manual-key-badge">Space</span> または <span class="manual-key-badge">V</span></td><td>スモーク発生の ON / OFF 切替</td></tr>
          <tr><td><b>視点切替</b></td><td><span class="manual-key-badge">1</span> 〜 <span class="manual-key-badge">9</span></td><td>コックピット、追従、翼端、管制塔、観覧席など</td></tr>
        </tbody>
      </table>
    `;
  }

  getJaControls() {
    return `
      <h3>🕹️ フライト操縦キー一覧 (Flight Controls)</h3>
      <table class="manual-table">
        <thead>
          <tr><th>系統</th><th>機能</th><th>キー</th><th>説明</th></tr>
        </thead>
        <tbody>
          <tr><td><b>操縦翼面</b></td><td>機首上下 (ピッチ)</td><td><span class="manual-key-badge">S</span> / <span class="manual-key-badge">W</span><br><span class="manual-key-badge">↓</span> / <span class="manual-key-badge">↑</span></td><td><b>[S] または [↓] で機首上げ (上昇・手前に引く)</b><br><b>[W] または [↑] で機首下げ (降下・前に倒す)</b></td></tr>
          <tr><td><b>操縦翼面</b></td><td>左右傾き (ロール)</td><td><span class="manual-key-badge">A</span> / <span class="manual-key-badge">D</span><br><span class="manual-key-badge">←</span> / <span class="manual-key-badge">→</span></td><td><b>[A] または [←] で左バンク</b> / <b>[D] または [→] で右バンク</b></td></tr>
          <tr><td><b>操縦翼面</b></td><td>左右首振り (ラダー)</td><td><span class="manual-key-badge">Q</span> / <span class="manual-key-badge">E</span></td><td>方向舵による左右ヨーイング、地上走行時のノーズホイール操舵</td></tr>
          <tr><td><b>推進動力</b></td><td>スロットル推力</td><td><span class="manual-key-badge">Shift</span> / <span class="manual-key-badge">Z</span> (増)<br><span class="manual-key-badge">Ctrl</span> / <span class="manual-key-badge">X</span> (減)</td><td>エンジン出力調整 (離陸100%, 巡航60%, 着陸アイドル0%)</td></tr>
          <tr><td><b>脚・空力</b></td><td>着陸脚 (ギア)</td><td><span class="manual-key-badge">G</span></td><td>可動式三輪着陸脚の格納／展開</td></tr>
          <tr><td><b>脚・空力</b></td><td>スピードブレーキ</td><td><span class="manual-key-badge">B</span></td><td>胴体下面エアブレーキ展開で空中減速</td></tr>
          <tr><td><b>制動停止</b></td><td><b>車輪ブレーキ (完全停止)</b></td><td><span class="manual-key-badge">Ctrl</span> / <span class="manual-key-badge">X</span> (長押し)<br>または <span class="manual-key-badge">B</span></td><td><b>滑走路接地中に長押しすることで強力ホイールブレーキが作動し、確実に完全停止します。</b></td></tr>
          <tr><td><b>演出</b></td><td>スモークシステム</td><td><span class="manual-key-badge">Space</span> / <span class="manual-key-badge">V</span></td><td>排気ノズルからのアクロバット白スモーク噴射 ON / OFF</td></tr>
          <tr><td><b>案内</b></td><td>操縦指導ガイダンス</td><td><span class="manual-key-badge">I</span></td><td>画面上部リアルタイム操縦指示バナーの表示／非表示</td></tr>
          <tr><td><b>表示</b></td><td>HUD 折りたたみ</td><td><span class="manual-key-badge">H</span></td><td>左上 PFD (HUD計器) の折りたたみ／展開</td></tr>
          <tr><td><b>表示</b></td><td>計器・タイムライン</td><td><span class="manual-key-badge">T</span></td><td>下部 テレメトリ＆タイムラインの折りたたみ／展開</td></tr>
          <tr><td><b>表示</b></td><td>UI 縮尺ズーム</td><td><span class="manual-key-badge">[</span> / <span class="manual-key-badge">]</span> (0でリセット)</td><td>UI 全体のサイズを 5% 単位で拡大／縮小</td></tr>
          <tr><td><b>説明書</b></td><td>取扱説明書モーダル</td><td><span class="manual-key-badge">M</span></td><td>本マニュアルウィンドウの開閉</td></tr>
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
    `;
  }

  getJaFlightGuide() {
    return `
      <h3>🛫 離陸シークエンス手順（松島基地 RW07）</h3>
      <ol style="margin-left: 20px; line-height: 1.8;">
        <li><b>初期位置確認</b>: 松島基地メイン滑走路 07（滑走路端、磁方位 068°）に正対して整列します。</li>
        <li><b>スロットル全開</b>: <b>[Shift] または [Z] キー</b> でスロットルを 100% まで上げます。IHI F3 ターボファンエンジンの回転数が上昇し滑走が始まります。</li>
        <li><b>滑走路進行維持</b>: 偏風がある場合は <b>[Q] / [E] キー</b>（ラダー）で滑走路中心線を維持します。</li>
        <li><b>ローテーション（引き起こし）</b>: HUDの対気速度が <b>130 KT</b> に達したら、<b>[S] または [↓] キー</b> を静かに引いて機首を約 10° 上げます。</li>
        <li><b>リフトオフ＆ギア格納</b>: 機体が浮揚し上昇率がプラスになったら、<b>[G] キー</b> を押して着陸脚を格納します。</li>
        <li><b>巡航移行</b>: 目標高度（例: 2,000 ft）に達したら機首を水平に戻し、スロットルを <b>60%</b> に設定して巡航飛行に入ります。</li>
      </ol>

      <h3>✈️ 空中機動・編隊維持のテクニック</h3>
      <ul>
        <li><b>旋回時の高度維持</b>: 旋回でバンク（傾き）をつけると揚力が低下するため、<b>[S] または [↓] キー</b> でわずかに機首を引いて高度を維持します。</li>
        <li><b>速度管理</b>: 急激な機動を行うと対気速度が低下します。低速（110 KT以下）になると失速（STALL）の危険があるため、適宜スロットルを足してください。</li>
        <li><b>編隊追従のコツ</b>: 僚機との距離が開きすぎた場合はスロットルを少し上げ、近づきすぎた場合はスロットルを絞るか <b>[B] キー</b>（スピードブレーキ）を短時間展開します。</li>
      </ul>

      <h3>🛬 着陸アプローチ ＆ 完全停止ブレーキ手順</h3>
      <div class="manual-alert-box">
        ⚠️ <b>着陸完全停止の重要操作</b>: タッチダウン後は、<b>[Ctrl] または [X] を長押し</b>（または [B] キー長押し）することで強力なホイールブレーキが作動し、完全に停止できます。
      </div>
      <ol style="margin-left: 20px; line-height: 1.8;">
        <li><b>ダウンウィンド〜ベース進入</b>: 高度 1,000 ft、速度 160 KT で松島基地滑走路 07 へのファイナル進入コースに乗ります。</li>
        <li><b>ギア展開</b>: 滑走路手前 3km で <b>[G] キー</b> を押し着陸脚（ギア）を展開します。HUD の <b>GEAR: DOWN</b> 表示を確認します。</li>
        <li><b>進入速度と降下角の調整</b>: スロットルを 35〜45% に絞り、対気速度 <b>130〜140 KT</b>、降下角 3°（PAPI 灯火が白2・赤2）を維持して降下します。</li>
        <li><b>フレア操作（接地直前）</b>: 滑走路直前（高度 20 ft）でスロットルを <b>0%（アイドル）</b> に絞り、<b>[S] または [↓] キー</b> をわずかに引いて降下率を緩め、主脚から滑らかに接地（タッチダウン）させます。</li>
        <li><b>接地後の完全制動</b>:
          <ul>
            <li>接地後すぐに前輪を滑走路に下ろします。</li>
            <li><b>[Ctrl] または [X] キーを長押し</b>（または <b>[B] キー</b>）して強力ホイールブレーキを作動させます。</li>
            <li>スピードブレーキも連動し、機体は滑走路中心線上で安全に完全停止します。</li>
          </ul>
        </li>
      </ol>
    `;
  }

  getJaModes() {
    return `
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
        <li>単独垂直大宙返り、スパイラルロール、急上昇クライム、コンバットピッチなどのソロ演目を鑑賞・操縦。</li>
        <li>松島基地滑走路07からの離陸、松島湾上空周回、着陸を手動で満喫。</li>
      </ul>
    `;
  }

  getJaRoutines() {
    return `
      <h3>✈️ ブルーインパルス 7大公式アクロバット演目解説</h3>
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
    `;
  }

  getJaCameras() {
    return `
      <h3>🎥 カメラ視点と視界の特徴</h3>
      <p>多彩なカメラアングルをリアルタイムに切り替えて、臨場感あふれるフライトを楽しめます。</p>
      <table class="manual-table">
        <thead>
          <tr><th>視点番号</th><th>視点名</th><th>特徴と楽しみ方</th></tr>
        </thead>
        <tbody>
          <tr><td><b>1</b></td><td>🌐 5機全体俯瞰ビュー</td><td>編隊全体のフォーメーション変化やスモーク軌跡を大局的に鑑賞。マウスドラッグで自由旋回可能。</td></tr>
          <tr><td><b>2</b></td><td>👑 1番機コックピット</td><td>編隊長（リーダー）視点。目の前に広がる青空と松島湾、HUD計器のリアルタイム表示。</td></tr>
          <tr><td><b>3</b></td><td>🪶 2番機コックピット</td><td>左翼機視点。右斜め前方に1番機を見ながらの密着フライトを体感。</td></tr>
          <tr><td><b>4</b></td><td>🪶 3番機コックピット</td><td>右翼機視点。左斜め前方に1番機を捉える対称視界。</td></tr>
          <tr><td><b>5</b></td><td>🎯 4番機コックピット</td><td>スロット位置（編隊後方中央）。前方のダイヤモンド編隊を見上げる大迫力視界。</td></tr>
          <tr><td><b>6</b></td><td>⚡ 5番機コックピット</td><td>リードソロ視点。編隊の周囲を縦横無尽に旋回・ロールするダイナミック視界。</td></tr>
          <tr><td><b>7</b></td><td>🎥 後方追従カメラ</td><td>機体後方上方からのチェイスビュー。加速・旋回時の慣性カメラワーク。</td></tr>
          <tr><td><b>8</b></td><td>🗼 松島基地 管制塔</td><td>高さ45mの管制塔から、滑走路07の離着陸や進入アクロバットを見渡す定点視点。</td></tr>
          <tr><td><b>9</b></td><td>🎪 地上観覧席カメラ</td><td>航空祭の観客席から大空を見上げる大迫力の地上見学アングル。</td></tr>
        </tbody>
      </table>
    `;
  }

  getJaSystems() {
    return `
      <h3>🌤️ 環境・スモーク・音響・地形システム</h3>
      
      <h4>💨 スモーク流体パーティクル</h4>
      <p>T-4のジェット排気ノズルから噴射されるアクロバット用スモークは、風向・風速・機体対気速度に基づき大気中に拡散・滞留する物理パーティクルシステムを採用しています。</p>

      <h4>🌅 時間帯 ＆ 天候シミュレーション</h4>
      <ul>
        <li><b>快晴・青空 (Clear Day)</b>: 抜けるような青空と視程良好な松島湾の景観。</li>
        <li><b>夕焼け・ゴールデンアワー (Sunset)</b>: 美しい夕陽に染まる太平洋とドラマチックな機体リフレクション。</li>
        <li><b>薄曇り・霞 (Hazy)</b>: リアルな大気散乱と長距離霞。</li>
      </ul>

      <h4>🔊 物理音響合成システム</h4>
      <p>IHI F3-IHI-30 双発ターボファンエンジンの回転数にリアルタイム連動するジェット音、スロットル推力変化時のレスポンス音、高速通過時のドップラー効果、風切り音を物理合成しています。</p>

      <h4>🗺️ DEM 実地形 ＆ 松島基地モデリング</h4>
      <p>国土地理院の DEM 標高データと航空写真オルソモザイクにより、仙台平野、松島湾、牡鹿半島、奥羽山脈の起伏を再現。松島基地（メイン滑走路07/25、クロス滑走路15/33、エプロン、格納庫、管制塔）を精密配置しています。</p>
    `;
  }

  getJaInstall() {
    return `
      <h3>💻 動作環境と導入手順</h3>

      <h4>推奨システム要件</h4>
      <ul>
        <li><b>OS</b>: macOS 10.15 以降（Apple Silicon M1/M2/M3/M4 および Intel Mac 対応） / Windows 10 / 11 (64-bit)</li>
        <li><b>GPU</b>: WebGL 2.0 / DirectX 11 対応グラフィックス</li>
        <li><b>メモリ</b>: 4GB 以上の RAM（推奨 8GB 以上）</li>
        <li><b>入力</b>: キーボード（必須）、マウスまたはトラックパッド</li>
      </ul>

      <h4>macOS でのインストール手順</h4>
      <ol style="margin-left: 20px; line-height: 1.8;">
        <li><code>BlueImpulseSimulator_1.0.0_aarch64.dmg</code> をダブルクリックして開きます。</li>
        <li><b>BlueImpulseSimulator</b> アイコンを <b>Applications</b> フォルダへドラッグ＆ドロップします。</li>
      </ol>
      <div class="manual-note-box">
        💡 <b>初回起動時に警告が出た場合</b>: 「システム設定」➔「プライバシーとセキュリティ」を開き、「"BlueImpulseSimulator" は開発元を確認できないため開けませんでした」の横にある <b>「このまま開く」</b> をクリックしてください。
      </div>

      <h4>Windows でのインストール手順</h4>
      <ol style="margin-left: 20px; line-height: 1.8;">
        <li>インストーラー <code>BlueImpulseSimulator_1.0.0_x64-setup.exe</code> をダブルクリックします。</li>
        <li>画面の指示に従ってインストールを完了します（デスクトップにショートカットが作成されます）。</li>
      </ol>
      <div class="manual-note-box">
        💡 <b>Windows SmartScreen が表示された場合</b>: <b>「詳細情報」</b> をクリックし、<b>「実行」</b> を選択してください。
      </div>
    `;
  }

  getJaFaq() {
    return `
      <h3>❓ よくある質問 ＆ トラブルシューティング (FAQ)</h3>

      <h4>Q1: 動作が重い・フレームレートが低下する場合は？</h4>
      <p>A: 画面上部またはブラウザのハードウェアアクセラレーションが有効になっているかご確認ください。また、<b>[ [ ] / [ ] ] キー</b> で UI 縮尺を調整することで描画負荷を軽減できます。</p>

      <h4>Q2: キーボードの操縦キーが反応しない場合は？</h4>
      <p>A: シミュレーター画面内を一度マウスクリックしてフォーカスを当ててください。また、日本語入力 (IME) が ON の場合は英数半角入力に切り替えてください。</p>

      <h4>Q3: 着陸時に滑走路で止まらない・オーバーランする場合は？</h4>
      <p>A: タッチダウン後、スロットルを 0% に絞り、<b>[Ctrl] または [X] キーを長押し</b> してください。強力なホイールブレーキが作動して完全に停止します。</p>

      <h4>Q4: 手動操縦時に僚機と接触してすぐゲームオーバーになる場合は？</h4>
      <p>A: 僚機との距離が 6.5m 未満になると空中接触アウト判定となります。画面上部の操縦ガイダンス（[I]キー）の指示速度・高度に合わせて飛行してください。まずは「演目鑑賞 (オート)」で全体の飛行コースを確認することをお勧めします。</p>

      <h4>Q5: スモークが出ない場合は？</h4>
      <p>A: <b>[Space] キー</b> または <b>[V] キー</b> を押してスモーク噴射を ON にしてください。コントロールパネルの「スモーク」ボタンでもトグル可能です。</p>
    `;
  }

  getJaFullManual() {
    return `
      <h3>📄 航空自衛隊 松島基地 (RJST) ブルーインパルス 3D取扱説明書 総合全文</h3>
      <p>本デスクトップシミュレーターの全仕様および操作マニュアルの完全版です。上の各タブをクリックするか、本ページで全体を通覧できます。</p>

      <h4>📑 目次</h4>
      <ol style="margin-left: 20px; line-height: 1.8;">
        <li><a href="javascript:void(0)" onclick="window.__manualModal?.setTab('quickstart')">1. シミュレーター概要とクイックスタート</a></li>
        <li><a href="javascript:void(0)" onclick="window.__manualModal?.setTab('install')">2. 動作環境とインストール手順 (macOS / Windows)</a></li>
        <li><a href="javascript:void(0)" onclick="window.__manualModal?.setTab('controls')">3. 操縦方法・全キーボードショートカット一覧</a></li>
        <li><a href="javascript:void(0)" onclick="window.__manualModal?.setTab('flightguide')">4. フライト手順（離陸・機動・着陸完全停止）</a></li>
        <li><a href="javascript:void(0)" onclick="window.__manualModal?.setTab('modes')">5. 5機編隊・1機ソロモード・カラー識別リバリー・採点システム</a></li>
        <li><a href="javascript:void(0)" onclick="window.__manualModal?.setTab('routines')">6. ブルーインパルス 7大公式アクロバット演目詳細</a></li>
        <li><a href="javascript:void(0)" onclick="window.__manualModal?.setTab('cameras')">7. カメラ視点と視界の特徴 (1〜9番キー)</a></li>
        <li><a href="javascript:void(0)" onclick="window.__manualModal?.setTab('systems')">8. スモーク・天候・音響・DEM実地形システム</a></li>
        <li><a href="javascript:void(0)" onclick="window.__manualModal?.setTab('faq')">9. トラブルシューティング ＆ よくある質問 (FAQ)</a></li>
      </ol>
      <div class="manual-note-box">
        💡 各項目をクリックすると該当のタブにジャンプします。
      </div>
    `;
  }

  // --- EN CONTENT METHODS ---

  getEnQuickstart() {
    return `
      <h3>🚀 Quick Start Guide</h3>
      <p>High-fidelity 3D aerobatics flight simulator featuring JASDF Matsushima Air Base (RJST), authentic GeoTIFF terrain (Sendai Bay), and the Kawasaki T-4 Blue Impulse demonstration squadron.</p>
      
      <div class="manual-note-box">
        💡 <b>Keyboard Shortcuts</b>: Press <b>[M]</b> to open/close this manual anytime, and <b>[I]</b> to toggle on-screen HUD flight instructions.
      </div>

      <h3>🎯 Two Main Flight Modes</h3>
      <ul>
        <li><b>👥 5-Ship Formation Mode</b>: 5-jet diamond/delta aerobatics, 7 official routines, 5 cockpit camera views, and companion AI formation flight.</li>
        <li><b>🛩️ Solo 1-Jet Mode</b>: Streamlined single-jet flight with dedicated solo routines and unrestricted free flight around Matsushima.</li>
      </ul>

      <h3>🕹️ Your First Flight (Manual Takeoff)</h3>
      <ol style="margin-left: 20px; line-height: 1.8;">
        <li>Choose <b>5-Ship Formation</b> or <b>Solo 1-Jet</b> at the top.</li>
        <li>Select <b>Manual Piloting</b> (in 5-Ship mode, pick your jet #1 to #5).</li>
        <li>Advance throttle to <b>100% (Full Thrust)</b> with <b>[Shift] or [Z]</b> (or [R] key).</li>
        <li>At airspeed <b>130 KT</b>, pull stick back with <b>[S] or [↓]</b> to rotate and lift off.</li>
        <li>Retract landing gear with <b>[G]</b>, climb to 2,000 ft, and reduce throttle to <b>60%</b> for level cruise.</li>
      </ol>

      <h3>🎮 Quick Controls Cheatsheet</h3>
      <table class="manual-table">
        <thead>
          <tr><th>Control</th><th>Key</th><th>Description</th></tr>
        </thead>
        <tbody>
          <tr><td><b>Pitch (Elevator)</b></td><td><span class="manual-key-badge">S</span> / <span class="manual-key-badge">W</span> or <span class="manual-key-badge">↓</span> / <span class="manual-key-badge">↑</span></td><td>S / ↓: Pitch Up (Climb) / W / ↑: Pitch Down (Dive)</td></tr>
          <tr><td><b>Roll (Aileron)</b></td><td><span class="manual-key-badge">A</span> / <span class="manual-key-badge">D</span> or <span class="manual-key-badge">←</span> / <span class="manual-key-badge">→</span></td><td>A / ←: Bank Left / D / →: Bank Right</td></tr>
          <tr><td><b>Throttle</b></td><td><span class="manual-key-badge">Shift</span> / <span class="manual-key-badge">Z</span> (Up)<br><span class="manual-key-badge">Ctrl</span> / <span class="manual-key-badge">X</span> (Down)</td><td>Engine thrust (100% Takeoff, 60% Cruise, 0% Idle)</td></tr>
          <tr><td><b>Landing Gear</b></td><td><span class="manual-key-badge">G</span></td><td>Toggle landing gear extension / retraction</td></tr>
          <tr><td><b>Wheel Brakes (Full Stop)</b></td><td><span class="manual-key-badge">Ctrl</span> / <span class="manual-key-badge">X</span> (Hold) or <span class="manual-key-badge">B</span></td><td><b>Hold after touchdown to brake to a complete stop</b></td></tr>
          <tr><td><b>Smoke Generator</b></td><td><span class="manual-key-badge">Space</span> or <span class="manual-key-badge">V</span></td><td>Toggle aerobatic smoke ON / OFF</td></tr>
          <tr><td><b>Camera Views</b></td><td><span class="manual-key-badge">1</span> to <span class="manual-key-badge">9</span></td><td>Cockpit, Chase, Wingtip, Tower, Spectator, Orbit</td></tr>
        </tbody>
      </table>
    `;
  }

  getEnControls() {
    return `
      <h3>🕹️ Complete Flight Controls & Key Bindings</h3>
      <table class="manual-table">
        <thead>
          <tr><th>Category</th><th>Function</th><th>Key</th><th>Description</th></tr>
        </thead>
        <tbody>
          <tr><td><b>Flight Controls</b></td><td>Pitch (Elevator)</td><td><span class="manual-key-badge">S</span> / <span class="manual-key-badge">W</span><br><span class="manual-key-badge">↓</span> / <span class="manual-key-badge">↑</span></td><td><b>[S] / [↓]: Pitch Up (Pull Stick)</b><br><b>[W] / [↑]: Pitch Down (Push Stick)</b></td></tr>
          <tr><td><b>Flight Controls</b></td><td>Roll (Aileron)</td><td><span class="manual-key-badge">A</span> / <span class="manual-key-badge">D</span><br><span class="manual-key-badge">←</span> / <span class="manual-key-badge">→</span></td><td><b>[A] / [←]: Bank Left</b> / <b>[D] / [→]: Bank Right</b></td></tr>
          <tr><td><b>Flight Controls</b></td><td>Yaw (Rudder)</td><td><span class="manual-key-badge">Q</span> / <span class="manual-key-badge">E</span></td><td>Rudder left / right, ground nosewheel steering</td></tr>
          <tr><td><b>Propulsion</b></td><td>Throttle</td><td><span class="manual-key-badge">Shift</span> / <span class="manual-key-badge">Z</span> (Up)<br><span class="manual-key-badge">Ctrl</span> / <span class="manual-key-badge">X</span> (Down)</td><td>Engine thrust (100% Takeoff, 60% Cruise, 0% Idle)</td></tr>
          <tr><td><b>Gear & Aero</b></td><td>Landing Gear</td><td><span class="manual-key-badge">G</span></td><td>Extend / retract 3-wheel landing gear</td></tr>
          <tr><td><b>Gear & Aero</b></td><td>Speed Brake</td><td><span class="manual-key-badge">B</span></td><td>Extend fuselage airbrake for rapid deceleration</td></tr>
          <tr><td><b>Braking</b></td><td><b>Wheel Brakes (Full Stop)</b></td><td><span class="manual-key-badge">Ctrl</span> / <span class="manual-key-badge">X</span> (Hold)<br>or <span class="manual-key-badge">B</span></td><td><b>Hold after touchdown to apply maximum wheel braking for a complete stop.</b></td></tr>
          <tr><td><b>Visual FX</b></td><td>Smoke System</td><td><span class="manual-key-badge">Space</span> / <span class="manual-key-badge">V</span></td><td>Toggle aerobatics white smoke generator ON / OFF</td></tr>
          <tr><td><b>Guidance</b></td><td>Instruction Banner</td><td><span class="manual-key-badge">I</span></td><td>Toggle on-screen HUD flight instructions</td></tr>
          <tr><td><b>Display</b></td><td>Collapse HUD</td><td><span class="manual-key-badge">H</span></td><td>Toggle Top-Left PFD (HUD) collapse</td></tr>
          <tr><td><b>Display</b></td><td>Collapse Telemetry</td><td><span class="manual-key-badge">T</span></td><td>Toggle Bottom Telemetry & Timeline collapse</td></tr>
          <tr><td><b>Display</b></td><td>UI Scale Zoom</td><td><span class="manual-key-badge">[</span> / <span class="manual-key-badge">]</span> (0 Reset)</td><td>Adjust entire UI scale by 5% increments</td></tr>
          <tr><td><b>Manual</b></td><td>User Manual Modal</td><td><span class="manual-key-badge">M</span></td><td>Open / close this manual window</td></tr>
        </tbody>
      </table>

      <h3>🎥 Camera View Shortcuts</h3>
      <table class="manual-table">
        <thead>
          <tr><th>Key</th><th>5-Ship Formation Mode</th><th>Solo 1-Jet Mode</th></tr>
        </thead>
        <tbody>
          <tr><td><span class="manual-key-badge">1</span></td><td>🌐 5-Ship Formation Overview</td><td>✈️ Cockpit View</td></tr>
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
  }

  getEnFlightGuide() {
    return `
      <h3>🛫 Takeoff Sequence Guide (Matsushima RW07)</h3>
      <ol style="margin-left: 20px; line-height: 1.8;">
        <li><b>Line Up</b>: Position on Runway 07 threshold aligned with magnetic heading 068°.</li>
        <li><b>Full Power</b>: Advance throttle to 100% using <b>[Shift] or [Z]</b>. Twin IHI F3 engines spool up for takeoff roll.</li>
        <li><b>Centerline Tracking</b>: Use <b>[Q] / [E]</b> (rudder) to correct for crosswinds.</li>
        <li><b>Rotation</b>: At airspeed <b>130 KT</b>, pull stick back gently with <b>[S] or [↓]</b> to pitch up 10°.</li>
        <li><b>Liftoff & Gear Up</b>: With positive climb rate established, press <b>[G]</b> to retract landing gear.</li>
        <li><b>Cruise Transition</b>: Level off at cruise altitude (2,000 ft) and reduce throttle to <b>60%</b>.</li>
      </ol>

      <h3>✈️ Aerobatics & Formation Flying Tips</h3>
      <ul>
        <li><b>Altitude in Turns</b>: Banking reduces vertical lift. Pull back slightly on stick [S / ↓] during turns to maintain level altitude.</li>
        <li><b>Airspeed Control</b>: Sharp maneuvers bleed airspeed. If speed drops below 110 KT, increase throttle to avoid aerodynamic stall.</li>
        <li><b>Station Keeping</b>: Use fine throttle adjustments (±5%) and quick speedbrake taps [B] to maintain exact formation spacing.</li>
      </ul>

      <h3>🛬 Approach & Landing Full Stop Braking Procedure</h3>
      <div class="manual-alert-box">
        ⚠️ <b>Crucial Braking Technique</b>: After main gear touchdown, <b>hold [Ctrl] or [X] down</b> (or hold [B]) to apply heavy wheel brakes until reaching a full, complete stop.
      </div>
      <ol style="margin-left: 20px; line-height: 1.8;">
        <li><b>Downwind to Final</b>: Turn onto Runway 07 final approach at 1,000 ft, 160 KT.</li>
        <li><b>Gear Down</b>: 3 km from threshold, press <b>[G]</b> to extend landing gear. Verify <b>GEAR: DOWN</b> on HUD.</li>
        <li><b>Glideslope & Speed</b>: Maintain <b>130–140 KT</b> on a 3° glideslope (PAPI 2 white / 2 red).</li>
        <li><b>Flare</b>: At 20 ft above threshold, pull throttle to <b>0% (Idle)</b> and ease back on stick to cushion touchdown on main gear.</li>
        <li><b>Full Stop Braking</b>:
          <ul>
            <li>Lower nosewheel onto runway smoothly.</li>
            <li><b>Hold [Ctrl] or [X]</b> to apply maximum wheel brakes.</li>
            <li>Airbrake deploys automatically to bring the aircraft to a safe complete stop on centerline.</li>
          </ul>
        </li>
      </ol>
    `;
  }

  getEnModes() {
    return `
      <h3>👥 5-Ship Formation Mode</h3>
      <p>Experience authentic Japanese aerobatics with 5 Kawasaki T-4 jets in tight formation.</p>
      <ul>
        <li><b>Selectable Cockpit Views (Auto Replay)</b>:
          <br>Switch between #1 Lead, #2 Left Wing, #3 Right Wing, #4 Slot, and #5 Lead Solo cockpits.
        </li>
        <li><b>Boarded Aircraft Selection (Manual Piloting)</b>:
          <br>Choose which plane to pilot (#1 to #5). Fly as #1 Lead with AI wingmen following, or as #5 Lead Solo performing dynamic aerobatics around the formation.
        </li>
        <li><b>🎨 Distinct Pilot Jet Livery</b>:
          <br>Your manually controlled jet is rendered in distinct livery (Special Gold, Crimson Red, Cyber Neon, Stealth Carbon, Sakura Pink) with a 3D player badge so viewers can immediately identify your manual piloting skills!
        </li>
        <li><b>💥 Mid-Air Collision Out Detection</b>:
          <br>Colliding with fellow wingmen within 6.5m triggers a mid-air collision termination with proximity alerts when near.
        </li>
        <li><b>🏆 Formation Synchronicity Score</b>:
          <br>Real-time precision tracking scoring your adherence to the official maneuver route (Rank S: 92%+, Rank A: 82%+).
        </li>
      </ul>

      <h3>🛩️ Solo 1-Jet Mode</h3>
      <p>A pure, distraction-free single jet simulation designed for unrestricted free flight and solo aerobatics.</p>
    `;
  }

  getEnRoutines() {
    return `
      <h3>✈️ 7 Official Display Routines</h3>
      <ol style="margin-left: 20px; line-height: 1.8;">
        <li><b>1. 4-Ship Diamond Takeoff & Solo Roll-on Join-up</b>: Authentic simultaneous 4-ship liftoff followed by #5 solo roll-on takeoff and aerial join-up.</li>
        <li><b>2. Delta Loop & Roll</b>: 350 KT vertical 4G loop with barrel roll in tight delta formation.</li>
        <li><b>3. Star Cross</b>: 5-way vertical fan break carving a giant 5-pointed star in the sky.</li>
        <li><b>4. Level Sunrise</b>: Low-altitude level delta fan break opening in 5 directions.</li>
        <li><b>5. Changeover Turn</b>: Morphing from Trail to Diamond and Delta during turning.</li>
        <li><b>6. Corkscrew</b>: 4-ship straight smoke pocket spiraled by #5 solo barrel roll.</li>
        <li><b>7. Rolling Combat Pitch & Landing</b>: Pitch break recovery into Runway 07 touchdown.</li>
      </ol>
    `;
  }

  getEnCameras() {
    return `
      <h3>🎥 Camera Views & Characteristics</h3>
      <table class="manual-table">
        <thead>
          <tr><th>Key</th><th>Camera Name</th><th>Description</th></tr>
        </thead>
        <tbody>
          <tr><td><b>1</b></td><td>🌐 5-Ship Overview</td><td>Bird's-eye view of all 5 jets and smoke trails with 360° mouse orbit.</td></tr>
          <tr><td><b>2</b></td><td>👑 #1 Lead Cockpit</td><td>Flight leader view with forward HUD instruments and Matsushima scenery.</td></tr>
          <tr><td><b>3</b></td><td>🪶 #2 Left Wing Cockpit</td><td>Left wingman view looking right toward #1 Lead.</td></tr>
          <tr><td><b>4</b></td><td>🪶 #3 Right Wing Cockpit</td><td>Right wingman view looking left toward #1 Lead.</td></tr>
          <tr><td><b>5</b></td><td>🎯 #4 Slot Cockpit</td><td>Slot position looking up into the diamond pocket.</td></tr>
          <tr><td><b>6</b></td><td>⚡ #5 Lead Solo Cockpit</td><td>Solo jet cockpit performing dynamic maneuvers around formation.</td></tr>
          <tr><td><b>7</b></td><td>🎥 Dynamic Chase Cam</td><td>Third-person chase camera with velocity-coupled inertia.</td></tr>
          <tr><td><b>8</b></td><td>🗼 RJST Control Tower</td><td>45m ATC tower fixed observation camera.</td></tr>
          <tr><td><b>9</b></td><td>🎪 Airshow Spectator Cam</td><td>Spectator flight-line ground camera gazing up into the sky.</td></tr>
        </tbody>
      </table>
    `;
  }

  getEnSystems() {
    return `
      <h3>🌤️ Environmental, Smoke & Sound Systems</h3>
      <h4>💨 Smoke Particle Physics</h4>
      <p>Aerobatic white smoke rendered using fluid particles subject to real-time wind vectors, turbulence dissipation, and airspeed expansion.</p>

      <h4>🌅 Time & Lighting Simulation</h4>
      <ul>
        <li><b>Clear Sky</b>: Crystal clear blue skies with high visibility across Sendai Bay.</li>
        <li><b>Sunset Golden Hour</b>: Atmospheric golden sunset reflections across the Pacific coast.</li>
        <li><b>Hazy</b>: Realistic atmospheric scattering and horizon haze.</li>
      </ul>

      <h4>🔊 Synthesized Audio Engine</h4>
      <p>Procedural dual-turbofan jet acoustics synthesized from real IHI F3 engine RPM profiles, complete with Doppler flyby effects and slipstream wind noise.</p>
    `;
  }

  getEnInstall() {
    return `
      <h3>💻 System Requirements & Installation</h3>
      <h4>Requirements</h4>
      <ul>
        <li><b>OS</b>: macOS 10.15+ (Apple Silicon & Intel) / Windows 10 / 11 (64-bit)</li>
        <li><b>GPU</b>: WebGL 2.0 / DirectX 11 compatible</li>
        <li><b>RAM</b>: 4 GB minimum (8 GB recommended)</li>
      </ul>

      <h4>macOS Installation</h4>
      <ol style="margin-left: 20px; line-height: 1.8;">
        <li>Open <code>BlueImpulseSimulator_1.0.0_aarch64.dmg</code>.</li>
        <li>Drag <b>BlueImpulseSimulator</b> into <b>Applications</b>.</li>
      </ol>
      <div class="manual-note-box">
        💡 <b>Gatekeeper prompt on macOS</b>: Open <i>System Settings ➔ Privacy & Security</i> and click <b>"Open Anyway"</b> next to BlueImpulseSimulator.
      </div>

      <h4>Windows Installation</h4>
      <ol style="margin-left: 20px; line-height: 1.8;">
        <li>Run <code>BlueImpulseSimulator_1.0.0_x64-setup.exe</code> and follow installer prompts.</li>
      </ol>
      <div class="manual-note-box">
        💡 <b>Windows SmartScreen prompt</b>: Click <i>"More info"</i> and choose <b>"Run anyway"</b>.
      </div>
    `;
  }

  getEnFaq() {
    return `
      <h3>❓ FAQ & Troubleshooting</h3>
      <h4>Q1: Low framerate or stuttering?</h4>
      <p>A: Verify hardware acceleration is enabled in your graphics driver/browser. Adjust UI scale with <b>[ [ ] / [ ] ]</b> keys.</p>

      <h4>Q2: Controls are not responding?</h4>
      <p>A: Click inside the simulator window to regain focus. Ensure keyboard IME is set to direct English input.</p>

      <h4>Q3: Plane won't stop on landing runway?</h4>
      <p>A: After touchdown, pull throttle to 0% and <b>hold [Ctrl] or [X] down</b>. Heavy wheel brakes will engage to stop completely.</p>

      <h4>Q4: Instant collision game over in formation mode?</h4>
      <p>A: Flying closer than 6.5m to AI wingmen causes a collision out. Follow the green HUD guidance box to maintain proper separation.</p>
    `;
  }

  getEnFullManual() {
    return `
      <h3>📄 Blue Impulse 3D Simulator Comprehensive Manual</h3>
      <p>Complete documentation for all simulator features and flight operations. Click tabs above or use the table of contents below.</p>

      <h4>📑 Table of Contents</h4>
      <ol style="margin-left: 20px; line-height: 1.8;">
        <li><a href="javascript:void(0)" onclick="window.__manualModal?.setTab('quickstart')">1. Overview & Quick Start</a></li>
        <li><a href="javascript:void(0)" onclick="window.__manualModal?.setTab('install')">2. Installation & Setup (macOS / Windows)</a></li>
        <li><a href="javascript:void(0)" onclick="window.__manualModal?.setTab('controls')">3. Controls & Key Shortcuts</a></li>
        <li><a href="javascript:void(0)" onclick="window.__manualModal?.setTab('flightguide')">4. Flight Guide (Takeoff, Maneuvers, Braking)</a></li>
        <li><a href="javascript:void(0)" onclick="window.__manualModal?.setTab('modes')">5. Flight Modes, Liveries & Scoring</a></li>
        <li><a href="javascript:void(0)" onclick="window.__manualModal?.setTab('routines')">6. 7 Official Display Routines</a></li>
        <li><a href="javascript:void(0)" onclick="window.__manualModal?.setTab('cameras')">7. Camera Views (Keys 1–9)</a></li>
        <li><a href="javascript:void(0)" onclick="window.__manualModal?.setTab('systems')">8. Environmental, Smoke & Audio Systems</a></li>
        <li><a href="javascript:void(0)" onclick="window.__manualModal?.setTab('faq')">9. FAQ & Troubleshooting</a></li>
      </ol>
    `;
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
    const tabLabelsJa = [
      '🚀 クイックスタート',
      '🕹️ 操縦・キー一覧',
      '🛫 離陸・着陸手順',
      '👥 5機/1機モード&採点',
      '✈️ 7大公式演目',
      '🎥 カメラ視点',
      '🌤️ 環境・スモーク・音響',
      '💻 動作環境・導入',
      '❓ FAQ・トラブル',
      '📄 マニュアル全文'
    ];
    const tabLabelsEn = [
      '🚀 Quick Start',
      '🕹️ Controls & Keys',
      '🛫 Flight & Landing',
      '👥 Modes & Scoring',
      '✈️ Routines',
      '🎥 Cameras',
      '🌤️ Environment & Audio',
      '💻 Installation',
      '❓ FAQ & Help',
      '📄 Full Manual'
    ];

    tabBtns.forEach((tabBtn, idx) => {
      if (isJa && tabLabelsJa[idx]) {
        tabBtn.textContent = tabLabelsJa[idx];
      } else if (!isJa && tabLabelsEn[idx]) {
        tabBtn.textContent = tabLabelsEn[idx];
      }
    });

    this.renderTab(this.currentTab);
  }
}
