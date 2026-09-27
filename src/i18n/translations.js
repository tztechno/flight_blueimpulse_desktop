/**
 * translations.js
 * Comprehensive Japanese / English dictionary for Blue Impulse Simulator.
 */

export const translations = {
  ja: {
    appTitle: 'ブルーインパルス 松島基地 航空祭 3Dフライトシミュレーター',
    airportTitle: '航空自衛隊 松島基地 (RJST)',
    squadronTitle: '第4航空団 第11飛行隊「ブルーインパルス」',
    runwayTag: 'Runway 07/25 (2,700m) & 15/33',

    // Top Level Mode Selection
    modeTab5Planes: '✈️ 5機編隊モード',
    modeTab1Plane: '🛩️ 1機ソロモード',

    // Sub-mode (Auto vs Manual)
    subModeAuto: '👀 演目鑑賞 (オート)',
    subModeManual: '🕹️ 演目操縦 (パイロット搭乗)',

    // View categories
    viewCategoryCockpit: 'コックピット視点 (搭乗機選択)',
    viewCategoryExternal: '外部・スペクテーター視点',

    // Cockpit View / Boarding Selection (1 to 5)
    cockpit1: '1番機 (編隊長・リーダー)',
    cockpit2: '2番機 (左翼・レフトウイング)',
    cockpit3: '3番機 (右翼・ライトウイング)',
    cockpit4: '4番機 (スロット・後方中央)',
    cockpit5: '5番機 (リードソロ・単独機)',

    cockpit1Short: '👑 1番機',
    cockpit2Short: '🪶 2番機',
    cockpit3Short: '🪶 3番機',
    cockpit4Short: '🎯 4番機',
    cockpit5Short: '⚡ 5番機',

    cockpit1Desc: '編隊長機。前方に滑走路や空が広がり、左右・後方に2〜5番機を従えます',
    cockpit2Desc: '左翼機。右前方に1番機、右隣に4番機を見ながら飛行します',
    cockpit3Desc: '右翼機。左前方に1番機、左隣に4番機を見ながら飛行します',
    cockpit4Desc: '後方中央スロット機。前方の1番機、左右の2・3番機の直後から見上げます',
    cockpit5Desc: 'リードソロ機。4機編隊の機動を見ながら単独離陸・合流・アクロバットを行います',

    // External Views
    viewGlobal5: '🌐 5機全体ビュー',
    viewChase: '🎥 後方追従 (Chase)',
    viewWing: '🪶 翼端・僚機カメラ',
    viewTower: '🗼 松島基地 管制塔',
    viewGround: '🎪 エプロン地上観覧席',
    viewOrbit: '🔄 360° 自由旋回',

    viewGlobal5Short: '🌐 全体',
    viewChaseShort: '🎥 追従',
    viewWingShort: '🪶 翼端',
    viewTowerShort: '🗼 管制塔',
    viewGroundShort: '🎪 観覧席',
    viewOrbitShort: '🔄 旋回',

    // Formations
    formDelta: 'デルタ (Delta)',
    formDiamond: 'ダイヤモンド (Diamond)',
    formArrowhead: 'アローヘッド (Swan)',
    formTrail: 'トレイル (Trail 縦列)',
    formEchelon: 'エシュロン (Echelon 斜列)',
    formLine: 'ライン・アブレスト (Line 横列)',

    // Aerobatic Routines (5-Ship)
    routineFreeFlight: '🕊️ 完全自由飛行 (フリーフライト・松島基地/松島湾)',
    routineDiamondTakeoff: '1. 4機ダイヤモンド離陸 ＆ 5番機ロールオン空中合流',
    routineDeltaLoop: '2. デルタループ ＆ ロール (5機編隊大宙返り)',
    routineStarCross: '3. スタークロス (5機大空の巨大星)',
    routineLevelSunrise: '4. レベルサンライズ (5機扇状大開花ブレイク)',
    routineChangeover: '5. チェンジオーバー・ターン (隊形変換旋回)',
    routineCorkscrew: '6. コークスクリュー (4機直進＆5番機螺旋バレルロール)',
    routineCombatPitch: '7. ローリング・コンバット・ピッチ ＆ 編隊着陸',

    // Solo Flight Mode Routines (1-Ship)
    routineSoloFreeFlight: '🕊️ 完全自由飛行 (フリーフライト・松島基地/松島湾)',
    routineSoloLoop: '1. 単独垂直大宙返り ＆ バレルロール (演技挑戦)',
    routineSoloCorkscrew: '2. 連続スパイラルロール (コークスクリュー・演技挑戦)',
    routineSoloTakeoff: '3. 滑走路07 離陸 ＆ 急上昇クライム (離陸挑戦)',
    routineSoloLanding: '4. コンバットピッチ ＆ 滑走路着陸 (着陸挑戦)',

    // Routine & Maneuver Headers
    displayRoutineLabel: '鑑賞する演目',
    routineManeuverLabel: '挑戦する演目',
    soloFlightModeLabel: 'ソロ 飛行演目・モード選択',
    cockpitViewLabel: '鑑賞コックピット視点',
    boardAircraftLabel: '操縦担当機 (搭乗する機体)',

    // Cockpit Roles (Short Badges)
    roleLeader: '編隊長',
    roleLeftWing: '左翼機',
    roleRightWing: '右翼機',
    roleSlot: 'スロット',
    roleSolo: 'ソロ機',

    // Boarding Roles (Manual Flight Short Badges)
    roleBoardLeader: '編隊長リード',
    roleBoardLeftWing: '左翼僚機',
    roleBoardRightWing: '右翼僚機',
    roleBoardSlot: 'スロット',
    roleBoardSolo: 'ソロ機動',

    // Start Position Presets (Solo Mode)
    startPositionLabel: '出現位置 / Start Position',
    presetRunway: '🛫 滑走路07',
    presetAirborne: '✈️ 上空2,500ft',
    presetApproach: '🛬 着陸進入',
    presetRunwayTip: '滑走路07 離陸開始位置',
    presetAirborneTip: '松島湾上空 2,500ft 巡航',
    presetApproachTip: '滑走路07 最終進入 3km',

    // Environment
    envDay: '青空 (晴天)',
    envSunset: '夕景 (ゴールデンアワー)',
    envAirshow: '航空祭 (薄曇り/スモーク映え)',
    envNight: 'ナイトフライト',

    // Smoke
    smokeLabel: 'スモーク発生装置',
    smokeOn: 'スモーク ON',
    smokeOff: 'スモーク OFF',
    smokeDensityLabel: 'スモーク量 / 濃度',
    smokeDensityPercent: '濃度',
    smokeWhite: '白スモーク (標準)',
    smokePresetLight: '薄 (25%)',
    smokePresetMid: '標準 (45%)',
    smokePresetDense: '濃 (75%)',

    // Telemetry & Instruments
    airspeed: '対気速度',
    altitude: '高度',
    verticalSpeed: '昇降率',
    heading: '方位',
    pitch: 'ピッチ',
    bank: 'バンク',
    gForce: 'G負荷',
    throttle: 'スロットル',
    mach: 'マッハ数',
    gear: '着陸脚',
    airbrake: 'エアブレーキ',
    attitudeLabel: '姿勢 (P / B)',
    routinePhaseLabel: '演目進行フェーズ',
    collapseHud: 'PFD HUDを折りたたむ [H]',
    expandHud: 'PFD HUDを展開する [H]',
    collapseTelemetry: '計器・タイムラインを折りたたむ [T]',
    expandTelemetry: '計器・タイムラインを展開する [T]',
    telemetryDockTitle: '計器・タイムラインドック',

    // Manual controls guidance & instructions
    instructionLabel: '操縦ガイダンス / 指示 (Instruction)',
    instructionOn: '📖 指導表示 ON',
    instructionOff: '🕶️ 指導非表示 OFF (プロモード)',
    instructionToggleTip: '指示・ガイド表示のON/OFF切替 [Iキー]',

    controlsHelpTitle: '操縦・キー操作ガイド',
    controlsPitchRoll: '機首上げ(上昇): S / ↓ (手前に引く)、機首下げ(降下): W / ↑ (前に倒す)、左右ロール: A / D または ← / →',
    controlsYaw: 'ラダー (水平首振り): Q / E',
    controlsThrottle: 'スロットル (エンジン加速/減速): Shift (加速) / Ctrl (減速) または スライダー',
    controlsSmoke: 'スモークON/OFF: Space キー',
    controlsAirbrake: 'エアブレーキ (減速): B キー',
    controlsGear: '車輪・ギア格納/展開: G キー',
    controlsCamera: '視点切替: 1〜8 キー',
    controlsRestart: 'リセット / 再挑戦: R キー',
    controlsInstToggle: '操縦指示バナー表示切替: I キー',

    // Livery & Jet Customization
    pilotLiveryLabel: '手動機カラー / Pilot Jet Livery',
    liveryGold: '🏆 ゴールド・リーダー (Special Gold)',
    liveryRed: '🔥 クリムゾン・レッド (Acro Red)',
    liveryNeon: '⚡ ネオン・サイバー (Cyber Cyan)',
    liveryStealth: '🥋 ステルス・ブラック (Carbon Stealth)',
    liverySakura: '🌸 サクラ・ピンク (Cherry Blossom)',
    liveryStandard: '⚪ 標準ブルーインパルス (Standard Blue)',
    liveryShortGold: 'ゴールド',
    liveryShortRed: 'レッド',
    liveryShortNeon: 'ネオン',
    liveryShortStealth: 'オレンジ',
    liveryShortSakura: 'サクラ',
    liveryShortStandard: '通常青白',
    playerMarkerToggle: '自機 3Dマーカー表示',

    // Formation Synchronicity & Contest Score
    formationSyncLabel: '編隊シンクロ率 (Sync)',
    syncScoreTitle: '手動編隊飛行シンクロ度',
    syncRatingS: '👑 神業編隊 S (95%+)',
    syncRatingA: '⭐ 優秀追従 A (85%+)',
    syncRatingB: '🛫 良好維持 B (70%+)',
    // UI Scale & Display Sizing
    uiScaleLabel: '画面・UI縮尺 (Scale)',
    uiScaleTip: 'UI縮尺変更 [ / ] キー',
    uiScaleSmall: '小 (75%)',
    uiScaleMedium: '標準 (85%)',
    uiScaleLarge: '大 (100%)',
    uiScaleXLarge: '特大 (115%)',

    callSmokeOn: 'スモーク・オン！',
    callSmokeOff: 'スモーク・オフ！',

    // Crash Modal
    crash: {
      titleTerrain: 'TERRAIN CRASH',
      subTerrain: '山岳・地形激突 / FLIGHT TERMINATED',
      titleSea: 'OCEAN CRASH',
      subSea: '海面墜落 / DITCHING CRASH',
      titleBelly: 'BELLY LANDING CRASH',
      subBelly: '着陸脚未展開・胴体着陸激突',
      titleHard: 'HARD IMPACT CRASH',
      subHard: '過大降下率激突 / HARD LANDING',
      titleAttitude: 'ATTITUDE CRASH',
      subAttitude: '姿勢異常激突 / STALL & IMPACT',
      titleCollision: 'MID-AIR COLLISION',
      subCollision: '編隊僚機との空中接触・衝突 / OUT!',
      speed: '激突・衝突速度',
      elev: '衝突標高 / 高度',
      loc: '衝突エリア / 相手機',
      locMountain: '松島湾沿岸山岳・宮城丘陵地帯',
      locUrban: '松島基地周辺・地上平野部',
      locSea: '松島湾海面 / 水面激突',
      locAirfield: '松島基地 滑走路・エプロン敷地',
      hitOtherPlane: '僚機と空中接触: ',
      relativeSpeed: '相対速度',
      survivalTime: 'フライト維持時間',
      finalSync: '最終編隊シンクロ率',
      restart: 'フライト再開 [R]',
    },
  },
  en: {
    appTitle: 'Blue Impulse Matsushima Air Base 3D Flight Simulator',
    airportTitle: 'JASDF Matsushima Air Base (RJST)',
    squadronTitle: '11th Squadron "Blue Impulse" (Kawasaki T-4)',
    runwayTag: 'Runway 07/25 (2,700m) & 15/33',

    // Top Level Mode Selection
    modeTab5Planes: '✈️ 5-Ship Formation Mode',
    modeTab1Plane: '🛩️ Solo 1-Jet Mode',

    // Sub-mode
    subModeAuto: '👀 Auto Display Replay',
    subModeManual: '🕹️ Pilot Challenge (Fly in Display)',

    // View categories
    viewCategoryCockpit: 'Cockpit View Selection',
    viewCategoryExternal: 'External Spectator Views',

    // Cockpit View / Boarding Selection
    cockpit1: '#1 Lead (Formation Leader)',
    cockpit2: '#2 Left Wing (Wingman)',
    cockpit3: '#3 Right Wing (Wingman)',
    cockpit4: '#4 Slot (Trailing Center)',
    cockpit5: '#5 Lead Solo (Solo Jet)',

    cockpit1Short: '👑 #1 Lead',
    cockpit2Short: '🪶 #2 Wing',
    cockpit3Short: '🪶 #3 Wing',
    cockpit4Short: '🎯 #4 Slot',
    cockpit5Short: '⚡ #5 Solo',

    cockpit1Desc: 'Leader jet. Command the formation with #2-#5 trailing behind.',
    cockpit2Desc: 'Left wing jet. Fly close formation looking at #1 Lead to your right.',
    cockpit3Desc: 'Right wing jet. Fly close formation looking at #1 Lead to your left.',
    cockpit4Desc: 'Slot jet. Look straight up into the diamond pocket behind #1-#3.',
    cockpit5Desc: 'Lead solo jet. Perform solo takeoff, join-up, and aerobatics.',

    // External Views
    viewGlobal5: '🌐 5-Ship Global View',
    viewChase: '🎥 Chase Cam',
    viewWing: '🪶 Wingman Cam',
    viewTower: '🗼 Matsushima Tower',
    viewGround: '🎪 Flight Line Spectator',
    viewOrbit: '🔄 360° Free Orbit',

    viewGlobal5Short: '🌐 Global',
    viewChaseShort: '🎥 Chase',
    viewWingShort: '🪶 Wing',
    viewTowerShort: '🗼 Tower',
    viewGroundShort: '🎪 Ground',
    viewOrbitShort: '🔄 Orbit',

    // Formations
    formDelta: 'Delta Formation',
    formDiamond: 'Diamond Formation',
    formArrowhead: 'Arrowhead (Swan)',
    formTrail: 'Trail Formation',
    formEchelon: 'Echelon Formation',
    formLine: 'Line Abreast',

    // Aerobatic Routines (5-Ship)
    routineFreeFlight: '🕊️ Free Flight (Unrestricted Solo Aerobatics)',
    routineDiamondTakeoff: '1. 4-Ship Diamond Takeoff & Solo Roll-on Join-up',
    routineDeltaLoop: '2. Delta Loop & Roll (5-Ship Loop)',
    routineStarCross: '3. Star Cross (Giant Star in Sky)',
    routineLevelSunrise: '4. Level Sunrise (5-Ray Fan Break)',
    routineChangeover: '5. Changeover Turn (Formation Morphing)',
    routineCorkscrew: '6. Corkscrew (4-Ship Level & Solo Spiral)',
    routineCombatPitch: '7. Rolling Combat Pitch & Formation Landing',

    // Solo Flight Mode Routines (1-Ship)
    routineSoloFreeFlight: '🕊️ Free Flight (Matsushima Base & Bay)',
    routineSoloLoop: '1. Solo Vertical Loop & Barrel Roll (Maneuver Challenge)',
    routineSoloCorkscrew: '2. Continuous Spiral Roll (Corkscrew Challenge)',
    routineSoloTakeoff: '3. Runway 07 Takeoff & High-G Climb (Takeoff Challenge)',
    routineSoloLanding: '4. Combat Pitch & Runway Landing (Landing Challenge)',

    // Routine & Maneuver Headers
    displayRoutineLabel: 'Display Routine',
    routineManeuverLabel: 'Routine Maneuver',
    soloFlightModeLabel: 'Solo Flight Mode',
    cockpitViewLabel: 'Cockpit View',
    boardAircraftLabel: 'Board Aircraft',

    // Cockpit Roles (Short Badges)
    roleLeader: 'Leader',
    roleLeftWing: 'Left Wing',
    roleRightWing: 'Right Wing',
    roleSlot: 'Slot',
    roleSolo: 'Solo',

    // Boarding Roles (Manual Flight Short Badges)
    roleBoardLeader: 'Lead Pilot',
    roleBoardLeftWing: 'Left Wingman',
    roleBoardRightWing: 'Right Wingman',
    roleBoardSlot: 'Slot Pocket',
    roleBoardSolo: 'Solo Acro',

    // Start Position Presets (Solo Mode)
    startPositionLabel: 'Start Position',
    presetRunway: '🛫 Runway 07',
    presetAirborne: '✈️ 2,500ft Bay',
    presetApproach: '🛬 Final Approach',
    presetRunwayTip: 'Runway 07 Takeoff Starting Position',
    presetAirborneTip: 'Matsushima Bay Airborne 2,500ft Cruise',
    presetApproachTip: 'Runway 07 Final Approach 3km',

    // Environment
    envDay: 'Blue Sky Day',
    envSunset: 'Golden Sunset',
    envAirshow: 'Airshow Sky (High Contrast)',
    envNight: 'Night Flight',

    // Smoke
    smokeLabel: 'Smoke Generation System',
    smokeOn: 'Smoke ON',
    smokeOff: 'Smoke OFF',
    smokeDensityLabel: 'Smoke Density / Volume',
    smokeDensityPercent: 'Density',
    smokeWhite: 'Standard White Smoke',
    smokePresetLight: 'Light (25%)',
    smokePresetMid: 'Mid (45%)',
    smokePresetDense: 'Dense (75%)',

    // Telemetry & Instruments
    airspeed: 'Airspeed',
    altitude: 'Altitude',
    verticalSpeed: 'Vertical Speed',
    heading: 'Heading',
    pitch: 'Pitch',
    bank: 'Bank',
    gForce: 'G-Force',
    throttle: 'Throttle',
    mach: 'Mach',
    gear: 'Landing Gear',
    airbrake: 'Speed Brake',
    attitudeLabel: 'Attitude (P / B)',
    routinePhaseLabel: 'Routine Phase',
    collapseHud: 'Collapse PFD HUD [H]',
    expandHud: 'Expand PFD HUD [H]',
    collapseTelemetry: 'Collapse Telemetry & Timeline [T]',
    expandTelemetry: 'Expand Telemetry & Timeline [T]',
    telemetryDockTitle: 'Telemetry & Flight Dock',

    // Manual controls guidance & instructions
    instructionLabel: 'Flight Guidance / Instruction',
    instructionOn: '📖 Guidance ON',
    instructionOff: '🕶️ Guidance OFF (Pro Mode)',
    instructionToggleTip: 'Toggle Flight Guidance / Instructions [I key]',

    controlsHelpTitle: 'Flight Controls Guide',
    controlsPitchRoll: 'Pitch: S / ↓ (Pull Up), W / ↑ (Push Down) | Roll: A / D or ← / →',
    controlsYaw: 'Rudder (Yaw): Q / E',
    controlsThrottle: 'Throttle: Shift / Z (Up) / Ctrl / X (Down) or Slider',
    controlsSmoke: 'Toggle Smoke: Space or V Key',
    controlsAirbrake: 'Speed Brake: B Key',
    controlsGear: 'Gear: G Key',
    controlsCamera: 'Cameras: 1 - 8 Keys',
    controlsRestart: 'Reset / Restart: R Key',
    controlsInstToggle: 'Guidance Toggle: I Key',

    // Livery & Customization
    pilotLiveryLabel: 'Pilot Jet Livery / Color',
    liveryGold: '🏆 Special Gold & Navy',
    liveryRed: '🔥 Acro Crimson Red',
    liveryNeon: '⚡ Cyber Neon Cyan',
    liveryStealth: '🥋 Stealth Matte Carbon',
    liverySakura: '🌸 Cherry Blossom Pink',
    liveryStandard: '⚪ Standard Blue Impulse',
    liveryShortGold: 'Gold',
    liveryShortRed: 'Red',
    liveryShortNeon: 'Neon',
    liveryShortStealth: 'Orange',
    liveryShortSakura: 'Sakura',
    liveryShortStandard: 'Standard',
    playerMarkerToggle: 'Show 3D Player Marker',

    // Environment
    envDay: 'Blue Sky Day',
    envSunset: 'Golden Sunset',
    envAirshow: 'Airshow Sky (High Contrast)',
    envNight: 'Night Flight',

    // Smoke
    smokeLabel: 'Smoke Generation System',
    smokeOn: 'Smoke ON',
    smokeOff: 'Smoke OFF',
    smokeDensityLabel: 'Smoke Density / Volume',
    smokeDensityPercent: 'Density',
    smokeWhite: 'Standard White Smoke',

    // Telemetry & Instruments
    airspeed: 'Airspeed',
    altitude: 'Altitude',
    verticalSpeed: 'Vertical Speed',
    heading: 'Heading',
    pitch: 'Pitch',
    bank: 'Bank',
    gForce: 'G-Force',
    throttle: 'Throttle',
    mach: 'Mach',
    gear: 'Landing Gear',
    airbrake: 'Speed Brake',
    collapseHud: 'Collapse PFD HUD [H]',
    expandHud: 'Expand PFD HUD [H]',
    collapseTelemetry: 'Collapse Telemetry & Timeline [T]',
    expandTelemetry: 'Expand Telemetry & Timeline [T]',
    telemetryDockTitle: 'Telemetry & Flight Dock',

    // Manual controls guidance & instructions
    instructionLabel: 'Flight Guidance / Instruction',
    instructionOn: '📖 Guidance ON',
    instructionOff: '🕶️ Guidance OFF (Pro Mode)',
    instructionToggleTip: 'Toggle Flight Guidance / Instructions [I key]',

    controlsHelpTitle: 'Flight Controls Guide',
    controlsPitchRoll: 'Pitch: S / ↓ (Pull Up), W / ↑ (Push Down) | Roll: A / D or ← / →',
    controlsYaw: 'Rudder (Yaw): Q / E',
    controlsThrottle: 'Throttle: Shift / Z (Up) / Ctrl / X (Down) or Slider',
    controlsSmoke: 'Toggle Smoke: Space or V Key',
    controlsAirbrake: 'Speed Brake: B Key',
    controlsGear: 'Gear: G Key',
    controlsCamera: 'Cameras: 1 - 8 Keys',
    controlsRestart: 'Reset / Restart: R Key',
    controlsInstToggle: 'Guidance Toggle: I Key',

    // Livery & Customization
    pilotLiveryLabel: 'Pilot Jet Livery / Color',
    liveryGold: '🏆 Special Gold & Navy',
    liveryRed: '🔥 Acro Crimson Red',
    liveryNeon: '⚡ Cyber Neon Cyan',
    liveryStealth: '🥋 Stealth Matte Carbon',
    liverySakura: '🌸 Cherry Blossom Pink',
    liveryStandard: '⚪ Standard Blue Impulse',
    playerMarkerToggle: 'Show 3D Player Marker',

    // Formation Synchronicity & Contest Score
    formationSyncLabel: 'Formation Sync',
    syncScoreTitle: 'Formation Synchronicity Score',
    syncRatingS: '👑 Master Precision S (95%+)',
    syncRatingA: '⭐ Excellent Wingman A (85%+)',
    syncRatingB: '🛫 Good B (70%+)',
    syncRatingC: '⚠️ Displaced C (<70%)',
    proxAlertBadge: '⚠️ PROXIMITY WARNING',

    // UI Scale & Display Sizing
    uiScaleLabel: 'UI Scale / Size',
    uiScaleTip: 'Change UI scale [ / ] keys',
    uiScaleSmall: 'Small (75%)',
    uiScaleMedium: 'Default (85%)',
    uiScaleLarge: 'Large (100%)',
    uiScaleXLarge: 'X-Large (115%)',

    callSmokeOn: 'Smoke ON!',
    callSmokeOff: 'Smoke OFF!',

    // Crash Modal
    crash: {
      titleTerrain: 'TERRAIN CRASH',
      subTerrain: 'Mountain Impact / FLIGHT TERMINATED',
      titleSea: 'OCEAN CRASH',
      subSea: 'Water Impact / DITCHING CRASH',
      titleBelly: 'BELLY LANDING CRASH',
      subBelly: 'Gear Up Impact / Belly Landing Crash',
      titleHard: 'HARD IMPACT CRASH',
      subHard: 'Excessive Descent Rate / HARD IMPACT',
      titleAttitude: 'ATTITUDE CRASH',
      subAttitude: 'Loss of Control & Stall Impact',
      titleCollision: 'MID-AIR COLLISION',
      subCollision: 'Wingman Jet Collision / OUT!',
      speed: 'Impact Speed',
      elev: 'Elevation / Altitude',
      loc: 'Impact Area / Aircraft',
      locMountain: 'Matsushima Bay Coastal Mountains / Hills',
      locUrban: 'Matsushima Base Vicinity / Ground',
      locSea: 'Matsushima Bay Water Impact',
      locAirfield: 'Matsushima Base Runway / Airfield Grounds',
      hitOtherPlane: 'Collided with Wingman: ',
      relativeSpeed: 'Relative Speed',
      survivalTime: 'Flight Duration',
      finalSync: 'Formation Sync Score',
      restart: 'Restart Flight [R]',
    },
  }
};

class I18nManager {
  constructor() {
    this.lang = 'ja';
  }

  setLang(lang) {
    if (translations[lang]) {
      this.lang = lang;
    }
  }

  toggleLang() {
    this.lang = this.lang === 'ja' ? 'en' : 'ja';
    return this.lang;
  }

  isJa() {
    return this.lang === 'ja';
  }

  t(key) {
    const dict = translations[this.lang] || translations.ja;
    if (dict[key] !== undefined) return dict[key];

    // Support dot-separated nested keys e.g. 'crash.title'
    if (key.includes('.')) {
      const parts = key.split('.');
      let cur = dict;
      for (const p of parts) {
        if (cur && cur[p] !== undefined) {
          cur = cur[p];
        } else {
          cur = null;
          break;
        }
      }
      if (cur !== null && cur !== undefined) return cur;

      // Fallback to ja
      let jaCur = translations.ja;
      for (const p of parts) {
        if (jaCur && jaCur[p] !== undefined) {
          jaCur = jaCur[p];
        } else {
          jaCur = null;
          break;
        }
      }
      if (jaCur !== null && jaCur !== undefined) return jaCur;
    }

    return translations.ja[key] || key;
  }
}

export const i18n = new I18nManager();
