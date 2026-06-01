# Design System — Portable Reference

本ツール（BX本部 案件管理ツール）の UI トンマナを、別リポジトリへそのまま移植できる形でまとめたもの。
実装は `stylesheet.html` を正とし、`DESIGN.md` / `DESIGN_GUIDE.md` の古い記述より優先する。

---

## 1. クリエイティブ North Star

**"The Precision Arborist"（精密な樹木医）— B2B CRM 向けのエディトリアル・インテリジェンス。**

- 「SaaS テンプレ」的なフラットさを避け、**Tonal Layering（色相による階層）** で密度と権威性を表現する。
- 高密度なデータ表示と読みやすさを両立させる「ジャーナル的グリッド」を志向する。
- 緑〜ティールの "成長" を象徴する色をブランドとし、深いスレートの文字色で落ち着きを保つ。
- 数値・ID・コードは **JetBrains Mono** で扱い、「ツールとしての精度」を視覚化する。

### 三本柱
1. **No-Line Rule** — セクション区切りに 1px ボーダーを使わず、**背景色の段差**で境界を定義する。
2. **Ambient Lift** — ドロップシャドウではなく、**淡い背景の上に明るい面を置くこと**でカードを浮かせる。
3. **Editorial Density** — 余白を惜しまない（最小 12〜24px）一方で、テーブルは 11px 級の高密度で組む。

---

## 2. カラートークン（CSS Custom Properties）

`:root` にそのまま貼り付け可能。`color-mix()` を多用するため、対応ブラウザ前提（最新の Chromium/Firefox/Safari は OK）。

```css
:root {
  /* ===== Surface — Tonal Layering（6段階） ===== */
  /* 規則: ページ canvas は warm off-white、カードは pure white、ホバー/ネストは段階的に濃く */
  --surface-lowest:  #ffffff;  /* カード・モーダル（最高位） */
  --surface-low:     #f6f3f4;  /* セクション面 */
  --surface:         #fcf8f9;  /* ページ背景 — warm off-white */
  --surface-high:    #eae7e8;  /* ネスト要素・モーダルヘッダー */
  --surface-highest: #dedddd;  /* 最深ネスト・ポップオーバー */
  --surface-bright:  #d2d0d1;  /* ホバー時の背景 */

  /* ===== Brand — Teal Spectrum ===== */
  --primary:              #36A191;  /* メイン（ティール） */
  --on-primary:           #ffffff;
  --primary-dark:         #297A6E;  /* hover / pressed */
  --primary-light:        rgba(54,161,145,0.08);  /* 淡背景・選択行 */
  --primary-fixed:        #5BC8B8;  /* アクセント明 */
  --primary-fixed-dim:    #94DBD1;
  --primary-container:    #297A6E;
  --on-primary-container: #CDEEE9;
  --secondary:            #36A191;
  --secondary-container:  #CDEEE9;
  --on-secondary-container:#297A6E;
  --tertiary:             #b04c00;  /* 警告系のアクセント */

  /* ===== Typography Color ===== */
  --on-surface:           #1b1b1c;  /* 主要テキスト（純黒は使わない） */
  --on-surface-variant:   #5a6660;  /* 副次テキスト */

  /* ===== Ghost Border（No-Line Rule） ===== */
  /* 「見えるか見えないか」のラインのみ許可。セクション区切りには使わない */
  --outline:         #6e7a6f;                    /* input の下線等 */
  --outline-variant: #bdcabd;                    /* ghost border base */
  --ghost-border:    rgba(189,202,189,0.20);     /* 20% opacity が標準 */

  /* ===== Status ===== */
  --danger:        #ba1a1a;
  --danger-weak:   rgba(186, 26, 26, 0.14);
  --warning-bg:    rgba(188,114,0,0.08);
  --warning-border:#b07000;
  --warning-accent:#c88000;
  --warning-text:  #5e3e00;
  --success:       #36A191;        /* primary と同色（成長＝成功） */
  --success-weak:  rgba(54,161,145,0.14);
  --done-bg:       rgba(54,161,145,0.09);
  --done-text:     #297A6E;
  --delay-bg:      rgba(168,54,0,0.09);
  --delay-text:    #7e3000;

  /* ===== ファネル/パイプライン 6段階（淡 → 濃） ===== */
  --c-創注: #78CBCA;
  --c-D:    #5ABFC0;
  --c-C:    #46A9B8;
  --c-B:    #3890AE;
  --c-A:    #2878A4;
  --c-失注: #c5c4c5;

  /* ===== Radius ===== */
  --r-sm: 4px;   /* チップ・小さなボタン */
  --r:    6px;   /* 標準フォーム・ボタン */
  --r-lg: 8px;  /* カード・テーブル */
  --r-xl: 12px;  /* モーダル・ダッシュボードパネル */

  /* ===== Typography Scale ===== */
  --text-xs:   0.6875rem;  /* 11px — Label SM / メタ */
  --text-sm:   0.75rem;    /* 12px — Body SM */
  --text-base: 0.875rem;   /* 14px — Body MD（本文標準） */
  --text-md:   1.0rem;     /* 16px — Title SM */

  /* ===== Spacing（4px baseline grid） ===== */
  --sp-1: 4px;
  --sp-2: 8px;
  --sp-3: 12px;
  --sp-4: 16px;
  --sp-5: 24px;

  /* ===== Transitions ===== */
  --dur-fast: 0.1s;
  --dur-base: 0.18s;
  --dur-slow: 0.28s;

  /* ===== Elevation — Atmospheric Shadow（青みがかった淡い影） ===== */
  /* 通常のカードは shadow-sm。「浮遊」させたいときだけ shadow-md/lg/float */
  --shadow-sm:    0px 4px 12px  rgba(0,39,117,0.04);
  --shadow-md:    0px 12px 24px rgba(0,39,117,0.05);
  --shadow-lg:    0px 20px 40px rgba(0,39,117,0.06);
  --shadow-float: 0px 24px 48px rgba(0,39,117,0.06);

  /* ===== Mono Font ===== */
  --font-mono: "JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, monospace;
}
```

---

## 3. タイポグラフィ

### フォント
```css
body {
  font-family: 'Inter', 'Noto Sans JP', 'Hiragino Sans', sans-serif;
  font-size: var(--text-base);
  line-height: 1.6;
  color: var(--on-surface);
  background: var(--surface);
  -webkit-font-smoothing: antialiased;
}
h1, h2, h3, h4 { font-weight: 600; letter-spacing: -0.01em; }
```

Google Fonts:
```html
<link href="https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@400;500;700;900&family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet">
```

### スケール
| 役割 | サイズ | weight | 用途 |
|---|---|---|---|
| Display | 20px+ | 700 | ログインタイトル・指標数値 |
| Headline | 14–16px | 600–700 | セクションヘッダー・カードタイトル |
| Title | 13–14px | 600 | フォームラベル群の上のタイトル |
| Body | 13–14px | 400 | 本文 |
| Caption | 11–12px | 400–500 | メタ情報・補助テキスト |
| Eyebrow | 10–11px | 600–700 / **UPPERCASE** / letter-spacing 0.08–0.12em | カードのカテゴリラベル（`JetBrains Mono` 推奨） |
| Mono | 任意 | 400–600 | 数値・ID・コード（`tabular-nums` 併用） |

### 色運用
- 主要テキスト: `--on-surface`（#1b1b1c、純黒禁止）
- セカンダリ: `--on-surface-variant`（#5a6660）
- ミュート/メタ: `#8a968a` または `--text-muted`
- 数値カラム: `font-variant-numeric: tabular-nums;` を必ず付ける

---

## 4. レイアウト原則

### Spacing
- 4px ベースライングリッド（`--sp-1`〜`--sp-5`）。
- ダッシュボードグリッドの **gap は 12px**（密度を上げる）。
- カードの内部 padding は **14–20px**。
- フォーム要素間の gap は 14px。
- セクション間は最低 **24–28px** あける。

### Container パターン
```css
/* ダッシュボードの典型グリッド: 2/3 + 1/3 の意図的非対称 */
.dashboard-grid {
  display: grid;
  grid-template-columns: 2fr 3fr;
  gap: 12px;
  align-items: stretch;
}
@media (max-width: 960px) {
  .dashboard-grid { grid-template-columns: 1fr; }
}
```

### Border Radius 運用
- チップ・ピル・小ボタン → `--r-sm` (4px)
- 標準入力・ボタン → `--r` (6px)
- カード本体・テーブル → `--r-lg` (8px)
- モーダル・大型パネル → `--r-xl` (12px)
- **0px の角は禁止**（柔らかさを担保）

---

## 5. コンポーネント

### 5.1 ボタン

```css
.btn {
  display: inline-flex; align-items: center; gap: 5px;
  padding: 7px 16px;
  border: none; border-radius: var(--r);
  font: 600 13px/1.4 'Inter', 'Noto Sans JP', sans-serif;
  letter-spacing: 0.01em;
  cursor: pointer;
  transition: background var(--dur-base), box-shadow var(--dur-base), transform 0.08s ease;
}
.btn:active { transform: scale(0.97); }
.btn:disabled { opacity: 0.45; cursor: not-allowed; pointer-events: none; }

/* Primary — フラット塗り（グラデは使わない） */
.btn-primary { background: var(--primary); color: var(--on-primary); }
.btn-primary:hover { background: var(--primary-dark); }
.btn-primary:focus-visible { outline: 2px solid var(--primary); outline-offset: 2px; }

/* Secondary / Outline — ニュートラル */
.btn-outline, .btn-secondary {
  background: var(--surface-lowest);
  color: var(--on-surface-variant);
  border: 1px solid var(--outline-variant);
}
.btn-outline:hover, .btn-secondary:hover {
  background: var(--surface-high);
  border-color: var(--outline);
}

/* Ghost — 透明 */
.btn-ghost {
  background: transparent;
  color: var(--on-surface-variant);
  border: 1px solid var(--ghost-border);
}
.btn-ghost:hover { background: var(--surface-high); }

/* Danger */
.btn-danger { background: var(--danger); color: #fff; }
.btn-danger:hover { background: color-mix(in srgb, var(--danger) 80%, black); }

/* Sizes */
.btn-sm { padding: 5px 12px; font-size: 11px; }
.btn-lg { padding: 11px 28px; font-size: 14px; font-weight: 700; width: 100%; justify-content: center; }
```

**運用ルール**
- グラデーション CTA は使わない（フラット塗りで "Technical Brutalism"）。
- ホバーは「より濃い同系色」または「色違いの背景」のみ。スケール/影は使わない（`active` の `scale(.97)` のみ）。
- アイコン併用時は SVG（12–16px、stroke-width 1.5–1.8）。emoji・アイコンライブラリは原則使わない。

### 5.2 カード / パネル

```css
.d-panel {
  background: var(--surface-lowest);
  border: 1px solid var(--ghost-border);
  border-radius: var(--r-xl);
  box-shadow: var(--shadow-sm);
  overflow: hidden;
  display: flex; flex-direction: column;
  transition: box-shadow 0.2s, transform 0.2s, border-color 0.2s;
}
.d-panel:hover {
  border-color: rgba(110,122,111,0.32);
  box-shadow: var(--shadow-md);
  transform: translateY(-1px);
}
.d-panel-hd {
  display: flex; align-items: center; justify-content: space-between;
  padding: 14px 16px 10px;
  background: var(--surface-lowest);
  border-bottom: 1px solid var(--ghost-border);
  gap: 8px 12px; min-height: 60px;
}
.d-panel-eyebrow {
  font: 600 10px/1 var(--font-mono);
  letter-spacing: 0.12em; text-transform: uppercase;
  color: var(--text-muted);
  margin-bottom: 1px;
}
.d-panel-title {
  font-size: 14px; font-weight: 600;
  color: var(--on-surface);
  letter-spacing: -0.01em; white-space: nowrap;
}
.d-panel-body { padding: 12px 14px; overflow: auto; flex: 1; min-height: 0; }
```

**パネルヘッダーの典型構造**
```html
<div class="d-panel">
  <div class="d-panel-hd">
    <div>
      <div class="d-panel-eyebrow">PIPELINE</div>
      <span class="d-panel-title">案件確度</span>
    </div>
    <!-- 右側: タブ/フィルタ -->
  </div>
  <div class="d-panel-body">...</div>
</div>
```

### 5.3 モーダル

```css
.modal {
  position: fixed; inset: 0; z-index: 1000;
  display: flex; align-items: flex-start; justify-content: center;
  padding: 24px 16px; overflow-y: auto;
}
.modal-overlay {
  position: fixed; inset: 0; z-index: -1;
  background: rgba(0,0,0,.65);
  backdrop-filter: blur(6px);
  -webkit-backdrop-filter: blur(6px);
}
.modal-content {
  background: var(--surface-lowest);
  border-radius: var(--r-xl);
  box-shadow: var(--shadow-float);
  width: 100%; min-width: 500px;
  max-width: min(960px, 95vw);
  max-height: 90vh;
  display: flex; flex-direction: column; overflow: hidden;
}
.modal-header {
  padding: 16px 24px;
  background: var(--surface-high);      /* 本文との段差を背景色で作る */
  border-bottom: 1px solid var(--ghost-border);
  display: flex; align-items: center; justify-content: space-between;
}
.modal-body { padding: 20px; flex: 1; overflow-y: auto; min-height: 0; }
```

オーバーレイは **半透明黒 + backdrop-filter blur** で「すりガラス」風（重要）。

### 5.4 フォーム

```css
.form-control {
  width: 100%;
  padding: 6px 10px;
  border: 1px solid var(--outline-variant);
  border-radius: var(--r);
  background: var(--surface-lowest);
  color: var(--on-surface);
  font: 13px 'Inter', 'Noto Sans JP', sans-serif;
  transition: border-color var(--dur-base), box-shadow var(--dur-base);
}
.form-control:focus {
  outline: none;
  border-color: var(--primary);
  box-shadow: 0 0 0 3px rgba(0,104,58,0.12);  /* 緑のフォーカスリング */
}
.form-control:disabled  { color: var(--text-muted); opacity: 0.6; cursor: not-allowed; }
.form-control[readonly] { background: var(--surface-high); color: var(--text-muted); }
input[type="number"].form-control { text-align: right; font-variant-numeric: tabular-nums; }

.form-group { display: flex; flex-direction: column; gap: 4px; }
.form-group label {
  font-size: 11px; font-weight: 700;
  color: var(--on-surface-variant);
}
.form-group.required label::after { content: ' *'; color: var(--danger); }
.form-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 14px; }

/* セクション区切り（フォーム内）: 左ボーダーアクセント */
.form-section h3 {
  font-size: 11px; font-weight: 700;
  color: var(--primary);
  margin-bottom: 12px;
  padding-left: 8px;
  border-left: 3px solid var(--primary);
  text-transform: uppercase; letter-spacing: .5px;
}
```

### 5.5 テーブル（高密度）

```css
.table-wrap {
  background: var(--surface-lowest);
  border-radius: var(--r-lg);
  overflow-x: auto;
  box-shadow: var(--shadow-sm);
}
.data-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 11px;             /* 高密度（11px）*/
  table-layout: fixed;
}
.data-table th {
  background: transparent;
  padding: 9px 24px 9px 12px;
  font-size: 11px; font-weight: 500;
  color: var(--text-muted);
  border-bottom: 1px solid var(--ghost-border);
  position: sticky; top: 0; z-index: 1;
  white-space: nowrap;
}
.data-table td {
  padding: 11px 12px;
  border-bottom: 1px solid var(--ghost-border);
  vertical-align: middle;
}
.data-table tr { transition: background .12s; }
.data-table tr:hover td { background: var(--primary-light); }
.td-amount { text-align: right; font-variant-numeric: tabular-nums; }
.td-sub    { color: var(--text-muted); font-size: var(--text-xs); }
```

### 5.6 バッジ / チップ

```css
.badge {
  display: inline-block;
  padding: 2px 4px;
  border-radius: var(--r-sm);
  font-size: 11px; font-weight: 700;
  white-space: nowrap;
  min-width: 47px; width: 47px; text-align: center;
}
```

**ステータスチップ** は「ソリッドカラー」ではなく `color-mix()` で **淡い同系色 + 同系の濃いめテキスト** の組み合わせを推奨:

```css
.chip-success { background: var(--done-bg); color: var(--done-text); }
.chip-warn    { background: var(--warning-bg); color: var(--warning-text); }
.chip-danger  { background: var(--danger-weak); color: var(--danger); }
```

### 5.7 タブ

```css
.tab-nav {
  background: var(--surface-lowest);
  border-bottom: 1px solid var(--ghost-border);
  padding: 0 20px; height: 40px;
  display: flex; align-items: center;
}
.tab-btn {
  height: 40px; padding: 0 14px;
  border: none; background: none; cursor: pointer;
  font-size: 12.5px; font-weight: 500;
  color: var(--on-surface-variant);
  position: relative;
  transition: color var(--dur-base);
}
.tab-btn:hover  { color: var(--on-surface); }
.tab-btn.active { color: var(--on-surface); font-weight: 600; }
.tab-btn.active::after {
  content: "";
  position: absolute;
  left: 10px; right: 10px; bottom: -1px;
  height: 2px;
  background: var(--primary);
  border-radius: 2px 2px 0 0;
}
```

タブのアクティブ表現は **下線 2px のみ**。背景塗りや影は使わない。

### 5.8 ヘッダー（Topbar）

```css
header {
  background: var(--surface-lowest);
  border-bottom: 1px solid var(--ghost-border);
  height: 48px;
  display: flex; align-items: center; gap: 16px;
  padding: 0 20px;
  position: sticky; top: 0; z-index: 100;
}
.brand { font-size: 13px; font-weight: 600; letter-spacing: -0.01em; }

/* アバター（イニシャル表示） */
.topbar-avatar {
  width: 26px; height: 26px; border-radius: 50%;
  background: linear-gradient(135deg, var(--c-B), var(--c-A));  /* ティールの斜めグラデのみ可 */
  color: #fff; font: 700 10px sans-serif;
  display: grid; place-items: center;
  letter-spacing: -0.02em;
  cursor: pointer;
}
```

### 5.9 ローディング

```css
.spinner {
  width: 36px; height: 36px;
  border: 2px solid var(--ghost-border);
  border-top-color: var(--primary);
  border-radius: 50%;
  animation: spin .7s linear infinite;
  margin: 0 auto 12px;
}
@keyframes spin { to { transform: rotate(360deg); } }
```

---

## 6. アイコン

- **方針**: アイコンライブラリ（Font Awesome / Material Icons 等）は使わない。
- **SVG をインライン**で記述（`stroke="currentColor" stroke-width="1.5-1.8"`、`fill="none"`、サイズは 12–18px）。
- **絵文字（emoji）は装飾用途では使わない**。注意喚起の `⚠` など、テキスト中のシンボルとしてのみ可。

例:
```html
<svg width="14" height="14" viewBox="0 0 20 20" fill="none"
     stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
  <path d="M4 17c0-3.3 2.7-6 6-6s6 2.7 6 6"/>
  <circle cx="10" cy="7" r="3"/>
</svg>
```

---

## 7. アニメーション

- 標準 transition: **`var(--dur-base)` (0.18s)**。マイクロインタラクション（ホバー等）は `--dur-fast` (0.1s)。
- メニュー開閉等は `--dur-slow` (0.28s) まで。
- **`prefers-reduced-motion: reduce`** に必ず対応する:
  ```css
  @media (prefers-reduced-motion: reduce) {
    .your-animated-element { animation: none !important; }
  }
  ```
- ボタンの `:active` は `transform: scale(0.97)` のみ。ホバーで浮かせない（影アニメ禁止）。

---

## 8. Do's & Don'ts

### Do
- **意図的な非対称**を使う（2/3 + 1/3 グリッド等）。
- **背景色の段差で境界を作る**（`surface-lowest` を `surface` の上に置く）。
- カードホバーは **border 色 + shadow 一段アップ + translateY(-1px)** のセット。
- 数値・ID には **`var(--font-mono)` + `tabular-nums`**。
- フォーカスリングは **緑の柔らかい 3px グロー**（`box-shadow: 0 0 0 3px rgba(0,104,58,0.12)`）。
- ghost-border は **20% opacity** が標準。
- `color-mix(in srgb, var(--primary) NN%, transparent)` でホバー色を都度作る。

### Don't
- **純黒 (#000) を使わない** — 必ず `--on-surface` (#1b1b1c)。
- **シャドウで階層を表現しない** — 背景色の段差で表現する（Tonal Lift）。
- **0px の角を作らない** — 最小 4px。
- **セクション境界に 1px ボーダーを使わない** — `--ghost-border` または背景色差で。
- **アイコンライブラリを導入しない** — インライン SVG で対応。
- **emoji を装飾に使わない** — UI には記号・テキスト・SVG のみ。
- **プライマリボタンにグラデを使わない** — フラット塗りでホバー時に `--primary-dark`。
- **警告系で常に赤を使わない** — 改善余地レベルなら `--tertiary` (#b04c00) を活用。

---

## 9. アクセシビリティ最低ライン

- フォーカス可視化: `:focus-visible { outline: 2px solid var(--primary); outline-offset: 1-2px; }` を全インタラクティブ要素に。
- コントラスト: `--on-surface` × `--surface-lowest` で WCAG AAA 級。ミュート色 (`#8a968a`) は装飾的補助のみ。
- `prefers-reduced-motion` への対応必須。
- アイコンのみのボタンには必ず `aria-label` / `title` を付ける。

---

## 10. 移植チェックリスト

別リポジトリへ移植する場合のミニマム手順:

1. **Google Fonts を `<head>` に追加**（Inter / Noto Sans JP / JetBrains Mono）。
2. **§2 のカラートークン全部**を `:root` に貼る。
3. **`body` の基本スタイル**を §3 から貼る。
4. 必要なコンポーネントだけ §5 から抜粋して持っていく。
5. 既存コードを以下の順で置き換える:
   - 純黒 `#000`・`black` → `var(--on-surface)`
   - 1px ボーダー → `var(--ghost-border)` または背景色差
   - `box-shadow: 0 2px 4px rgba(0,0,0,.1)` 等 → `var(--shadow-sm/md/lg)`
   - `border-radius` 直書き → `var(--r-sm/r/r-lg/r-xl)`
6. ホバー色は全部 `color-mix()` 経由か `--primary-light` に統一する。
7. `prefers-reduced-motion` 対応をアニメ要素に追加。

---

## 11. 参考: 最小スターターテンプレ

```html
<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>App</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@400;500;700;900&family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet">
  <style>
    /* §2 のカラートークン全部をここに貼る */
    :root { /* ... */ }

    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Inter', 'Noto Sans JP', 'Hiragino Sans', sans-serif;
      background: var(--surface);
      color: var(--on-surface);
      font-size: var(--text-base);
      line-height: 1.6;
      -webkit-font-smoothing: antialiased;
    }
    h1, h2, h3, h4 { font-weight: 600; letter-spacing: -0.01em; }
  </style>
</head>
<body>
  <!-- ... -->
</body>
</html>
```

---

## 付録: 既存ドキュメントとの差分メモ

- **`DESIGN_GUIDE.md`**: `#35B597` のミントグリーンが書かれているが、実装は `#36A191` のティール（ほぼ同じだが微差）。本書を正とする。
- **`DESIGN.md`**: "Editorial Intelligence" コンセプトの記述あり。配色は本実装で「Teal Spectrum」に発展している。哲学（No-Line / Tonal Layering / Ambient Lift）は同じ。
- **アイコンルール**: `DESIGN_GUIDE.md` は Unicode 記号 (`⌂` `≡` `＋`) の使用を許可しているが、実装はほぼ全面的にインライン SVG。本書はインライン SVG を推奨とする。
