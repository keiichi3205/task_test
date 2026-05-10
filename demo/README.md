# AI駆動PM運用ハーネス — デモ環境構築手順書

> **目的**: OpenProject Cloud + Claude Code を組み合わせ、「議事録 → Work Package 起票 → 人間承認」の流れを最短1日でデモ可能な状態にする。

---

## 1. ゴールと非ゴール

### ゴール (MVP)
- Google Drive 上の議事録 Doc を自動で要約・Next Action 抽出
- 抽出結果を OpenProject の Work Package として **draft 状態** で起票
- Slack で PM に通知し、PM は OpenProject UI で承認するだけ
- Agent が常駐していることを ttyd 経由で観客にリアルタイム可視化

### 非ゴール (フェーズ2以降)
- WBS 自動更新
- 日報自動生成
- リスク自動検知
- 複数プロジェクト横断管理
- Subagent 階層化(幕府→将軍→…)

---

## 2. アーキテクチャ

```
┌──────────────────────────────────────────────────────────┐
│  外部入力                                                  │
│  Google Drive (議事録 Doc) / Slack (将来)                  │
└──────────────────────┬───────────────────────────────────┘
                       │ Drive API (polling) or Webhook
                       ▼
┌──────────────────────────────────────────────────────────┐
│  GCP Compute Engine (e2-small, asia-northeast1)           │
│  ┌──────────────────────────────────────────────────────┐ │
│  │ Docker Compose                                        │ │
│  │  ├── agent (Claude Code headless)                    │ │
│  │  │   ├── CLAUDE.md (行動ルール)                       │ │
│  │  │   ├── .claude/skills/giziroku/                    │ │
│  │  │   ├── .claude/settings.json (MCP設定)             │ │
│  │  │   └── トリガ: cron (1分ごと) or webhook           │ │
│  │  ├── mcp-openproject (Python, 自作)                  │ │
│  │  ├── mcp-drive (公式 or コミュニティ)                 │ │
│  │  ├── mcp-slack (公式)                                │ │
│  │  └── ttyd (ログ可視化)                                │ │
│  └──────────────────────────────────────────────────────┘ │
│  Cloudflare Tunnel (無料)                                  │
└──────────────────────┬───────────────────────────────────┘
                       │ REST API v3 (HTTPS)
                       ▼
┌──────────────────────────────────────────────────────────┐
│  OpenProject Cloud (SaaS, 14日無料トライアル)              │
│  - Work Packages (draft/open status)                      │
│  - Bot User: claude-pm-agent                              │
│  - Custom Fields: ai_proposed, ai_source                  │
└──────────────────────┬───────────────────────────────────┘
                       │ Webhook (承認時)
                       ▼
                  [Agent が承認検知 → Slack通知]
```

---

## 3. 技術選定の根拠

| 選定 | 理由 |
|---|---|
| **Claude Code を agent runtime に** | CLAUDE.md / Skills / Hooks / MCP / Subagents がネイティブ機能。独自フレームワーク不要。 |
| **OpenProject Cloud** | インフラ管理ゼロ、14日無料、デモ完結に最適。 |
| **GCP e2-small** | 月$13 で Agent 常駐に必要十分。 |
| **Cloudflare Tunnel** | 無料、HTTPS、認証付き、Webhook受信URL公開可。 |
| **ttyd** | ログをブラウザに流して "常駐感" を観客に可視化。 |
| **MCP 自作 (OpenProject)** | 公式 MCP がないため。Python 200行程度。 |
| **cron polling** | デモ用途には Webhook より単純で確実。1分粒度で十分。 |

---

## 4. 前提条件

### 必須アカウント
- [ ] Google Cloud プロジェクト(請求有効化済み)
- [ ] Cloudflare アカウント(無料)
- [ ] OpenProject Cloud アカウント(これから登録)
- [ ] Anthropic Console アカウント(Claude Code の認証用)
- [ ] Google Workspace アカウント(Drive 連携用)

### ローカルツール
- [ ] `gcloud` CLI 認証済み
- [ ] `docker`, `docker compose`
- [ ] `git`

### 必要な API キー / トークン
| 用途 | 取得元 | 環境変数名 |
|---|---|---|
| OpenProject API | OpenProject Cloud > 個人設定 > API Token | `OP_API_TOKEN` |
| OpenProject URL | テナントURL | `OP_BASE_URL` |
| Drive 認証 | GCP Service Account JSON | `GOOGLE_APPLICATION_CREDENTIALS` |
| Slack Bot | Slack App > OAuth Token | `SLACK_BOT_TOKEN` |
| Anthropic | console.anthropic.com | `ANTHROPIC_API_KEY` |
| Cloudflare Tunnel | Cloudflare Zero Trust | `CLOUDFLARE_TUNNEL_TOKEN` |

---

## 5. セットアップ手順 (Day 1 午前 / 約2時間)

### 5.1 OpenProject Cloud 登録 (10分)

1. https://www.openproject.org/ → "Try free for 14 days"
2. テナント名を決める(例: `mycompany-demo`)→ URL は `https://mycompany-demo.openproject.com`
3. 管理者アカウント作成
4. デモ用プロジェクトを1つ作成(例: `Demo Project`、Identifier: `demo`)

### 5.2 OpenProject 内の準備 (15分)

**Bot User 作成:**
- Administration > Users and permissions > Users > New user
- Login: `claude-pm-agent` / Email: `bot@example.com`
- Demo Project に Member として追加、Role: `Member` (作成権限あり)

**API Token 発行:**
- claude-pm-agent でログイン → My Account > Access tokens > Generate
- → `OP_API_TOKEN` として控える

**Custom Fields 追加** (Administration > Work packages > Custom fields):
- `ai_proposed` (Boolean) - AI起票フラグ
- `ai_source` (Text) - 起票元の議事録ファイルID
- `ai_confidence` (Float) - 確信度 (0.0-1.0)

これらを Demo Project の Work Package Type に紐付け。

### 5.3 GCP VM 作成 (15分)

```bash
# プロジェクトと認証
gcloud config set project YOUR_PROJECT_ID
gcloud auth login

# VM 作成 (Container-Optimized OS)
gcloud compute instances create pm-agent-demo \
  --zone=asia-northeast1-a \
  --machine-type=e2-small \
  --image-family=cos-stable \
  --image-project=cos-cloud \
  --boot-disk-size=20GB \
  --boot-disk-type=pd-balanced \
  --tags=pm-agent

# SSH 確認
gcloud compute ssh pm-agent-demo --zone=asia-northeast1-a
```

**月額目安: 約 $13 (新規アカウントは $300 クレジット内で実質無料)**

### 5.4 Cloudflare Tunnel 設定 (15分)

1. Cloudflare Zero Trust ダッシュボード > Networks > Tunnels > Create tunnel
2. 名前: `pm-agent-demo`
3. トークンをコピー → `CLOUDFLARE_TUNNEL_TOKEN`
4. Public hostnames を追加:
   - `terminal.demo.example.com` → `http://localhost:7681` (ttyd)
   - `agent-webhook.demo.example.com` → `http://localhost:8080` (将来用)
5. Cloudflare Access (無料) でメール認証を有効化:
   - Application > Add → Self-hosted → 上記ドメインを保護
   - Identity provider: One-time PIN で `@yourcompany.com` のみ許可

### 5.5 Anthropic API Key (5分)

1. console.anthropic.com → Settings > API Keys
2. デモ用 Key を発行 → `ANTHROPIC_API_KEY`
3. **Workspace を分けて月額上限を $50 程度に設定**(暴走対策)

### 5.6 Drive Service Account (15分)

1. GCP Console > IAM > Service Accounts > Create
2. 名前: `pm-agent-drive`
3. JSON キーをダウンロード
4. Drive 上で議事録フォルダを **このサービスアカウントのメール**に共有(編集権限)
5. JSON ファイルパスを `GOOGLE_APPLICATION_CREDENTIALS` に設定

### 5.7 Slack Bot (15分)

1. https://api.slack.com/apps > Create New App > From scratch
2. Bot Token Scopes: `chat:write`, `chat:write.public`
3. Install to Workspace → Bot User OAuth Token (`xoxb-...`) を取得 → `SLACK_BOT_TOKEN`
4. デモ用チャンネル `#pm-agent-demo` を作成、Botを招待

---

## 6. 実装するコンポーネント (Day 1 午後 / 約2時間)

> **本READMEはコード skeleton まで。実コードは別タスクで実装。**

### 6.1 ディレクトリ構成

```
demo-pm-agent/
├── README.md
├── docker-compose.yml
├── .env.example
├── agent/
│   ├── Dockerfile
│   ├── CLAUDE.md                   ← Agent行動ルール (重要)
│   ├── .claude/
│   │   ├── settings.json           ← MCP/Hooks 設定
│   │   ├── skills/
│   │   │   └── giziroku/
│   │   │       └── SKILL.md        ← 議事録処理スキル
│   │   └── agents/                 ← (将来) Subagent定義
│   └── trigger.sh                  ← cron から呼ばれるエントリポイント
├── mcp_servers/
│   └── openproject/
│       ├── Dockerfile
│       ├── server.py               ← OpenProject MCP (自作)
│       └── requirements.txt
├── cloudflared/
│   └── config.yml
└── scripts/
    ├── setup_gcp.sh
    └── deploy.sh
```

### 6.2 docker-compose.yml (概要)

```yaml
version: "3.9"
services:
  agent:
    build: ./agent
    env_file: .env
    volumes:
      - ./agent:/workspace
      - ./agent/CLAUDE.md:/workspace/CLAUDE.md
    restart: always
    # cron は Dockerfile 内で起動

  mcp-openproject:
    build: ./mcp_servers/openproject
    env_file: .env
    expose: ["3001"]

  ttyd:
    image: tsl0922/ttyd:latest
    command: ["ttyd", "-R", "docker", "logs", "-f", "--tail=200", "demo-pm-agent-agent-1"]
    volumes: ["/var/run/docker.sock:/var/run/docker.sock"]
    ports: ["127.0.0.1:7681:7681"]

  cloudflared:
    image: cloudflare/cloudflared:latest
    command: tunnel --no-autoupdate run --token ${CLOUDFLARE_TUNNEL_TOKEN}
    restart: always
```

### 6.3 CLAUDE.md (Agent の振る舞いルール)

```markdown
# PM Agent - 行動ルール

## 役割
あなたは PM 業務支援エージェントです。Drive 上の議事録を読み、
OpenProject に Next Action を Work Package として draft 起票します。

## 鉄則
1. **ユーザー判断を尊重**: 起票は必ず draft 状態。承認は人間が行う。
2. **不確実性を明示**: 確信度が 0.7 未満の項目は起票せず、保留として記録。
3. **冪等性**: 同じ議事録を再処理しても重複起票しない (ai_source で判定)。
4. **最小権限**: OpenProject の操作は Demo Project に限定。

## ワークフロー
1. Drive で `meetings/` フォルダ配下の未処理 Doc を検索
2. 各 Doc を read_file_content で取得
3. Next Action を抽出 (担当者・期日・内容)
4. OpenProject MCP で create_work_package を呼ぶ
   - status: "New" (draft 相当)
   - assignee: 抽出した担当者 (ユーザーが見つかれば)
   - custom_field ai_proposed: true
   - custom_field ai_source: <Drive File ID>
5. Slack #pm-agent-demo に「N件の提案があります」と通知

## 使えるスキル
- @skills/giziroku - 議事録から Next Action を抽出する手順
```

### 6.4 .claude/settings.json (MCP 設定)

```json
{
  "mcpServers": {
    "openproject": {
      "command": "python",
      "args": ["/workspace/mcp_servers/openproject/server.py"],
      "env": {
        "OP_BASE_URL": "${OP_BASE_URL}",
        "OP_API_TOKEN": "${OP_API_TOKEN}"
      }
    },
    "drive": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-google-drive"],
      "env": {
        "GOOGLE_APPLICATION_CREDENTIALS": "/secrets/drive-sa.json"
      }
    },
    "slack": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-slack"],
      "env": {
        "SLACK_BOT_TOKEN": "${SLACK_BOT_TOKEN}"
      }
    }
  },
  "permissions": {
    "allow": [
      "mcp__openproject__*",
      "mcp__drive__read_file_content",
      "mcp__drive__search_files",
      "mcp__slack__chat_postMessage"
    ],
    "deny": [
      "mcp__openproject__delete_*",
      "Bash(rm:*)"
    ]
  }
}
```

### 6.5 .claude/skills/giziroku/SKILL.md

```markdown
---
name: giziroku
description: 議事録Docから Next Action を抽出し OpenProject に起票する
---

# 議事録処理スキル

## 入力
- Drive File ID (議事録 Doc)

## 処理手順
1. mcp__drive__read_file_content で本文取得
2. 以下のフォーマットで Next Action を抽出:
   - 担当者 (発言者から推定)
   - 期日 (相対表現は会議日付から計算)
   - タスク内容 (1行サマリ + 詳細)
   - 確信度 (0.0-1.0)
3. 確信度 0.7 以上のみ採用
4. mcp__openproject__create_work_package で起票:
   ```
   project_id: "demo"
   subject: <タスク内容の1行サマリ>
   description: <詳細 + "Source: Meeting on YYYY-MM-DD">
   assignee_login: <担当者>
   due_date: <期日>
   custom_fields:
     ai_proposed: true
     ai_source: <Drive File ID>
     ai_confidence: <値>
   status: "New"
   ```
5. mcp__slack__chat_postMessage で通知:
   - channel: "#pm-agent-demo"
   - text: "{N}件のタスク提案があります: {OpenProject URL}"

## 冪等性
処理開始前に mcp__openproject__list_work_packages で
ai_source = <File ID> の WP が既にあれば skip。
```

### 6.6 mcp_servers/openproject/server.py (skeleton)

```python
"""OpenProject MCP Server - 最小実装"""
import os
from mcp.server import Server
from mcp.types import Tool
import httpx

server = Server("openproject")
client = httpx.Client(
    base_url=os.environ["OP_BASE_URL"] + "/api/v3",
    auth=("apikey", os.environ["OP_API_TOKEN"]),
    timeout=30.0,
)

@server.tool()
def create_work_package(
    project_id: str,
    subject: str,
    description: str = "",
    assignee_login: str | None = None,
    due_date: str | None = None,
    custom_fields: dict | None = None,
    status: str = "New",
) -> dict:
    """OpenProject に Work Package を起票する"""
    payload = {
        "subject": subject,
        "description": {"raw": description, "format": "markdown"},
    }
    # ... assignee解決, custom_field変換, status link 等
    r = client.post(f"/projects/{project_id}/work_packages", json=payload)
    r.raise_for_status()
    return r.json()

@server.tool()
def list_work_packages(project_id: str, filters: dict | None = None) -> list:
    """Work Package 一覧取得 (冪等性チェック用)"""
    # ...

@server.tool()
def get_user_by_login(login: str) -> dict | None:
    """assignee 解決用"""
    # ...

if __name__ == "__main__":
    server.run()
```

### 6.7 trigger.sh (cron エントリポイント)

```bash
#!/bin/bash
# cron から1分ごとに実行される
cd /workspace
claude -p "@CLAUDE.md 新規の議事録があれば giziroku skill で処理してください" \
  --output-format json \
  >> /var/log/agent.log 2>&1
```

Dockerfile 側で:
```dockerfile
RUN echo "* * * * * /workspace/trigger.sh" | crontab -
CMD ["cron", "-f"]
```

---

## 7. デモシナリオ (本番 7分)

### 事前準備
- [ ] ttyd を別ブラウザで開いておく (`https://terminal.demo.example.com`)
- [ ] OpenProject の Demo Project Boards 画面を開いておく
- [ ] Slack `#pm-agent-demo` チャンネルを開いておく
- [ ] Google Docs で空の議事録テンプレートを開いておく

### スクリプト

| 時刻 | 操作 | 観客視点 |
|---|---|---|
| 0:00 | 「今日はAIエージェントを使った議事録自動化のデモです」 | アーキ図スライド |
| 0:30 | 「これは VS Code 上の Agent ルール (CLAUDE.md) です」 | コード表示 |
| 1:30 | 「右の画面が Agent のリアルタイムログです (ttyd)」 | 💚 alive ログが流れている |
| 2:00 | 「では実際に議事録を投入してみます」Google Docs に内容貼り付け→保存 | Doc が更新される |
| 2:30 | 「Agent が検知したログが流れます」 | `[giziroku] new file detected...` |
| 3:00 | 「Next Action を3件抽出しました」 | `extracted 3 actions` |
| 3:30 | 「OpenProject に draft 起票しています」 | `creating WP #1234, #1235, #1236` |
| 4:00 | OpenProject 画面リロード | Boards に新しいカードが3枚 |
| 4:30 | Slack を見せる | 「3件の提案があります」通知 |
| 5:00 | 「PM はこの通知を見て、UIで承認します」 | Boards でカードを Open に移動 |
| 5:30 | Agent ログを見せる | `[approval detected] WP #1234 -> Open` |
| 6:00 | 「人間は判断と承認だけ。収集・整理・記録は AI が担います」 | サマリスライド |
| 6:30 | 質疑応答へ | |

---

## 8. 運用メモ

### コスト
| 項目 | 月額 |
|---|---|
| GCP e2-small | $13 |
| GCP ディスク 20GB | $2 |
| OpenProject Cloud (14日後) | $5.95 × ユーザー数 |
| Cloudflare Tunnel + Access | $0 (無料枠) |
| Anthropic API (デモ規模) | $5-30 |
| **合計 (デモ期間中)** | **約 $20-50** |

### 監視
- ヘルスチェック: Agent から5分ごとに Slack に `💚 alive` 投稿
- 失敗検知: Cloud Logging で ERROR レベルを Slack 通知
- コスト監視: Anthropic Console の月額上限設定 + GCP 予算アラート

### セキュリティ
- ttyd は read-only モード (`-R`) で起動
- Cloudflare Access のメール認証必須
- OpenProject API Token は Bot User 専用 (人間アカウント流用しない)
- API Token は Secret Manager で管理 (将来)
- ログにシークレットが出ないよう sanitize

### 既知のリスク・回避策
| リスク | 回避策 |
|---|---|
| Agent 暴走で WP 大量起票 | CLAUDE.md で「1回の処理で5件まで」制限 + permissions で delete禁止 |
| 同じ議事録を二重処理 | ai_source カスタムフィールドで冪等性チェック |
| OpenProject API レート制限 | 1分粒度の cron + リトライ実装 |
| Anthropic API 月額超過 | Workspace 月額上限設定 |
| ttyd 経由の侵入 | Cloudflare Access + read-only モード |
| Spot VM 停止 | デモ前は通常VMに切り替え |

---

## 9. デモ後のアップグレードパス

```
[Phase 1: デモ] ← 現在
  GCP e2-small + OpenProject Cloud + cron polling
       ↓ デモ反応OK
[Phase 2: 社内パイロット (1-3ヶ月)]
  - Webhook化 (cron→event-driven)
  - WBS更新 skill 追加
  - 日報生成 skill 追加
  - Subagent 階層化 (orchestrator + specialist)
  - GCP e2-medium に増強
       ↓ 全社展開判断
[Phase 3: 本番運用]
  - OpenProject セルフホスト移行 (Cloud→GKE)
  - Cloud SQL HA
  - VPC Service Controls
  - 監査ログ別DB保管
  - 承認ワークフローを Slack ボタン化
```

---

## 10. 次のアクション

1. [ ] **本READMEのレビュー**(技術選定・スコープ確認)
2. [ ] アカウント類の準備(セクション 4 のチェックリスト)
3. [ ] コード実装タスクの起票:
   - [ ] `mcp_servers/openproject/server.py` 実装
   - [ ] `agent/CLAUDE.md` 実装
   - [ ] `agent/.claude/skills/giziroku/SKILL.md` 実装
   - [ ] `docker-compose.yml` + `Dockerfile` 実装
   - [ ] `scripts/setup_gcp.sh` 実装
4. [ ] デモ用 Google Docs テンプレート準備
5. [ ] デモシナリオのリハーサル枠を確保

---

## 付録 A: 想定 Q&A

**Q. なぜ OpenProject を改造しないのか?**
A. 改造はアップグレード追従の負債になる。Bot User + Custom Field + REST API で十分実現可能。

**Q. なぜ Claude Code を agent runtime に?**
A. CLAUDE.md / Skills / Hooks / MCP / Subagents が標準機能。独自フレームワーク構築コストがゼロ。

**Q. なぜ OpenProject Cloud (SaaS) を選んだ?**
A. デモ最速のため。継続運用するならセルフホスト移行を検討。

**Q. Agent が間違って大量起票したら?**
A. permissions で delete 禁止 + 1回の処理上限 + draft 状態起票なので、人が承認しなければ確定しない。

**Q. データはどこに?**
A. OpenProject Cloud は EU(独)ホスティング。機密データを扱う場合はセルフホスト移行必須。

**Q. 議事録以外のスキルを追加したい**
A. `.claude/skills/` 配下に SKILL.md を追加するだけ。CLAUDE.md でルーティングを記述。

---

## 付録 B: 参考リンク

- OpenProject API v3: https://www.openproject.org/docs/api/
- OpenProject Cloud: https://www.openproject.org/hosting/
- Claude Code Skills: https://docs.claude.com/en/docs/claude-code/skills
- Claude Code Hooks: https://docs.claude.com/en/docs/claude-code/hooks
- Claude Code MCP: https://docs.claude.com/en/docs/claude-code/mcp
- Cloudflare Tunnel: https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/
- ttyd: https://github.com/tsl0922/ttyd
