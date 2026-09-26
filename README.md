# 航空自衛隊 松島基地 (RJST) ブルーインパルス 3Dフライトシミュレーター Desktop (Tauri)

Tauri 2.0 + Three.js による Kawasaki T-4 ブルーインパルス 3D フライトシミュレーターの macOS デスクトップアプリケーションです。

---

## 📦 ビルド済みパッケージ (Mac用)

- **DMG インストーラー**:
  `src-tauri/target/release/bundle/dmg/BlueImpulseSimulator_1.0.0_aarch64.dmg`
- **macOS アプリケーション (.app)**:
  `src-tauri/target/release/bundle/macos/BlueImpulseSimulator.app`

---

## 🚀 開発・起動コマンド

### 1. デスクトップアプリの開発モード起動
```bash
npm run dev:desktop
# または
npx tauri dev
```

### 2. Mac用 DMG / .app の再ビルド
```bash
npm run build:desktop
# または
npx tauri build
```

---

## 🕹️ 主な機能
- **5機編隊モード / 1機ソロモード**の完全分離
- **手動操縦機（自機）の特別リバリー（ゴールド、レッド、ネオン、ステルス、サクラ等）**と3D識別マーカー
- **編隊僚機との空中接触・衝突判定 (MID-AIR COLLISION)**
- **リアルタイム編隊シンクロ率スコア (RANK S / A / B / C)**
- **7大公式アクロバット演目**（デルタループ、スタークロス、レベルサンライズ等）
- **松島基地 (RJST) 実地形データ** & コックピット視点 / 全体視点
