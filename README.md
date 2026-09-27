# 航空自衛隊 松島基地 (RJST) ブルーインパルス 3Dフライトシミュレーター Desktop (Tauri)
# JASDF Matsushima Air Base (RJST) Blue Impulse 3D Flight Simulator Desktop (Tauri)

Tauri 2.0 + Three.js による Kawasaki T-4 ブルーインパルス 3D フライトシミュレーターのデスクトップアプリケーション（macOS / Windows）です。

---

## 📖 取扱説明書・操作マニュアル / User Manuals
- 🇯🇵 **[日本語版 操作マニュアル (MANUAL_JA.md)](./MANUAL_JA.md)**
- 🇺🇸 **[English User Manual (MANUAL_EN.md)](./MANUAL_EN.md)**

---

## 📦 配布用ビルド済みパッケージ (Pre-built Installers)

- **macOS Apple Silicon (M1/M2/M3/M4)**:
  `src-tauri/target/release/bundle/dmg/BlueImpulseSimulator_1.0.0_aarch64.dmg`
- **macOS Application Bundle**:
  `src-tauri/target/release/bundle/macos/BlueImpulseSimulator.app`
- **Windows (x64 Setup)**:
  `../BlueImpulseSimulator_1.0.0_x64-setup.exe` (または `dist_windows/`)

---

## 🚀 開発・起動コマンド (Development & Build Commands)

### 1. デスクトップアプリの開発モード起動 (Launch Dev Mode)
```bash
npm run dev:desktop
# または
npx tauri dev
```

### 2. Mac用 DMG / .app の再ビルド (Build macOS DMG / App)
```bash
npm run build:desktop
# または
npx tauri build
```

---

## 🕹️ 主な機能 (Key Features)
- **5機編隊モード / 1機ソロモード**の完全分離 (5-Ship Formation & Solo 1-Jet modes)
- **手動操縦機（自機）の特別リバリー**（ゴールド、レッド、ネオン、ステルス、サクラ等）と3D識別マーカー
- **編隊僚機との空中接触・衝突判定** (MID-AIR COLLISION Detection < 6.5m)
- **リアルタイム編隊シンクロ率スコア** (Real-time Synchronicity Scoring: RANK S / A / B / C)
- **7大公式アクロバット演目**（4機離陸合流、デルタループ、スタークロス、レベルサンライズ、チェンジオーバーターン、コークスクリュー、コンバットピッチ）
- **松島基地 (RJST) 実地形 GeoTIFF データ** ＆ 1〜5番機コックピット視点 / 全体 / 管制塔 / 観覧席カメラ
- **航空標準フライト操作体系**（S/↓: 機首上げ上昇、W/↑: 機首下げ降下、Ctrl/X: 地上完全停止ブレーキ）
