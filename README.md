# Strava Analysis

Strava APIから自分のアクティビティ情報を取得し、Strava標準画面では確認しにくい独自の統計・分析を行う**個人用Webアプリケーション**です。

一般公開を前提とせず、必要なときにローカル環境で起動して使用します。

## 機能概要（MVP）

- Strava OAuthによるログイン（`/login`）
- ログイン状態の維持（再起動後も再ログイン不要）
- 基本的な統計情報を表示するダッシュボード（`/`）
- 登録している機材（Gear）の取得
- 「期間 × 機材」を指定した走行距離集計（Gear Distance）

## 必要環境（Requirements）

| 項目 | 内容 |
| --- | --- |
| Node.js | LTS（このリポジトリは `.nvmrc` で `24.19.0` を指定） |
| pnpm | 11.x（`11.22.0` で動作確認） |
| Stravaアカウント | ログインに必要 |
| Strava API Application | Client ID / Client Secret の取得に必要 |

### 現在のバージョン

- Node.js: `24.19.0`（`.nvmrc` に固定）
- pnpm: `11.22.0`

`nvm` を使用している場合は、リポジトリ直下で以下を実行すると `.nvmrc` のバージョンが適用されます。

```bash
nvm use
```

## 技術構成

- Next.js（App Router）+ TypeScript
- React / Tailwind CSS
- SQLite + Prisma ORM
- パッケージマネージャー: pnpm

## セットアップ手順

### 1. Strava API Applicationの作成

1. [Strava Developers](https://www.strava.com/settings/api) にアクセスし、Stravaアカウントでログインします。
2. 「Create Your App」からアプリケーションを作成します。
3. 以下の設定を行います。

| 設定項目 | 値 |
| --- | --- |
| Authorization Callback Domain | `localhost` |
| Redirect URI（アプリ側で使用） | `http://localhost:3000/api/auth/strava/callback` |

> **注意**: コールバックドメインは `localhost` を指定してください。`127.0.0.1` やポート番号付きの値では、リダイレクトURIの検証に失敗する場合があります。

4. 作成後、アプリケーション詳細画面に表示される **Client ID** と **Client Secret** を控えます。

### 2. 環境変数の設定

`.env.example` をコピーして `.env.local` を作成します。

```bash
cp .env.example .env.local
```

`.env.local` に以下の値を設定します。

| 環境変数 | 説明 | 例 |
| --- | --- | --- |
| `STRAVA_CLIENT_ID` | Strava API ApplicationのClient ID | `12345` |
| `STRAVA_CLIENT_SECRET` | Strava API ApplicationのClient Secret | `xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx` |
| `STRAVA_REDIRECT_URI` | OAuthコールバックURL | `http://localhost:3000/api/auth/strava/callback` |
| `DATABASE_URL` | SQLiteデータベースの接続文字列 | `file:./dev.db` |
| `SESSION_SECRET` | セッション署名用のランダムな文字列 | 下記のコマンドで生成 |

`SESSION_SECRET` は以下のコマンドで生成できます。

```bash
openssl rand -base64 32
```

> **注意**: `.env.local` はGit管理対象外です。実在のClient Secretや生成したSecretをコミットしないでください。

### 3. 依存パッケージのインストール

```bash
pnpm install
```

### 4. データベースのマイグレーション

```bash
pnpm prisma migrate dev
pnpm prisma generate
```

ローカルのSQLiteデータベース（プロジェクトルート直下の `dev.db`）が作成され、テーブルが構築されます。`DATABASE_URL` を `.env.local` に設定していない場合は `file:./dev.db`（ルート直下）が使用されます。

`pnpm install` 時にもPrisma Clientは自動生成されます。スキーマを変更した場合は、マイグレーション後に `pnpm prisma generate` を実行してください。

### 5. 開発サーバーの起動

```bash
pnpm dev
```

ブラウザで <http://localhost:3000> にアクセスします。

## ログイン

1. <http://localhost:3000/login> にアクセスします。
2. 「Connect with Strava」ボタンをクリックします。
3. Stravaの認証画面でアクセス許可を行います。
4. コールバック（`/api/auth/strava/callback`）でOAuth TokenがSQLiteへ保存され、セッションが生成されます。
5. ダッシュボード（`/`）へ遷移します。

要求するOAuth Scopeは最小限の `read` と `activity:read_all` のみです（書き込み権限は要求しません）。

## トラブルシューティング

| 症状 | 対処 |
| --- | --- |
| OAuthエラー `redirect_uri mismatch` | Strava Developersの「Authorization Callback Domain」が `localhost` になっているか確認してください。 |
| ログイン後に `http://localhost:3000/api/auth/strava/callback` へ遷移しない | `STRAVA_REDIRECT_URI` が上記の値と一致しているか確認してください。 |
| ポート3000が使用中 | 他のプロセスを停止するか、`PORT` 環境変数で別ポートを指定してください。 |
| マイグレーションに失敗する | ルート直下の `dev.db` を削除して `pnpm prisma migrate dev` を再実行してください。 |
| 「Stravaとの接続が切れています」と表示される | Access Tokenの自動更新に失敗しています。「Reconnect Strava」から再接続してください。 |
| 「Strava APIの利用制限に達しました」と表示される | Strava APIのRate Limitに達しています。時間を空けて再度試してください。 |
| Node.jsのバージョンエラー | `nvm use` で `.nvmrc` のバージョン（`24.19.0`）に切り替えてください。 |

## セキュリティ上の注意

- **Client Secretはサーバー側のみ**で使用します。Client Componentへ渡さないでください。
- **OAuth Tokenをブラウザ（localStorage等）へ保存しません**。ブラウザにはランダムなSession IDのみ保持します。
- **Refresh Tokenをブラウザへ返しません**。
- セッションCookieは `HttpOnly` / `SameSite=Lax` を使用します。
- OAuth `state` を検証し、CSRF対策を行います。
- `.env.local` はGit管理対象外です。
- TokenやClient Secretをログへ出力しないでください。

## MVPの制約（対象外機能）

本プロジェクトは**単一ユーザーのローカル利用**を前提としたMVPです。以下は現段階では実装しません。

- Activity詳細画面 / 編集 / アップロード
- GPS Map / Segment分析 / Heart Rate分析 / Power分析
- Training Load / AI分析
- 他ユーザーとの比較 / SNS機能
- Stravaへの書き込み
- Webhook
- Docker / Cloud deployment
- PostgreSQL / Redis
- Background Job

また、MVP段階では**Activityデータそのものを永続保存しません**（OAuth Token・Athlete ID・Scope・Token有効期限のみSQLiteへ保存します）。

## 参考

- 仕様: [docs/spec/spec.md](docs/spec/spec.md)
- Strava API: <https://developers.strava.com/>
