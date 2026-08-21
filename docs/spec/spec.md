# Ride Analysis

## 1. プロジェクト概要

Strava APIからユーザー自身のアクティビティ情報を取得し、Strava標準画面では確認しにくい独自の統計・分析を行う個人用Webアプリケーションを構築する。

本アプリケーションは一般公開を前提とせず、必要なときにローカル環境で起動して使用する。

MVPでは以下を実現する。

1. Strava OAuthによるログイン
2. ログイン状態の維持
3. 基本的な統計情報を表示するダッシュボード
4. 登録している機材の取得
5. 「期間 × 機材」を指定した走行距離集計

将来的には分析機能をタイル形式で追加できる構造とする。

---

# 2. 技術構成

## フレームワーク

* Next.js
* TypeScript
* App Router

## UI

* React
* Tailwind CSS

UIライブラリは必須ではない。

スタイリングはTailwind CSSとCSSで実装する。大規模なUIフレームワーク（Material Design 3のフルコンポーネントライブラリ等）は導入しない。

過度な独自コンポーネントを作るより、保守しやすく単純な構造を優先する。

## データベース

* SQLite
* Prisma ORM

用途は主として以下。

* OAuth Tokenの保存
* Strava Athlete ID
* OAuth Scope
* Token有効期限

MVP段階ではStravaのActivityデータそのものを永続保存しない。

## パッケージマネージャー

pnpm

## 実行環境

Node.js LTS

ローカル実行:

```bash
pnpm dev
```

想定URL:

```text
http://localhost:3000
```

---

# 3. 基本アーキテクチャ

アプリケーションはNext.js単体で完結させる。

```text
Browser
   ↓
Next.js
   ├─ UI
   ├─ Route Handler / Server Action
   ├─ Authentication
   ├─ Strava API Client
   └─ Prisma
        ↓
      SQLite

Next.js Server
   ↓
Strava API
```

ブラウザから直接Strava APIを呼び出してはいけない。

以下は必ずサーバー側で管理する。

* STRAVA_CLIENT_SECRET
* Access Token
* Refresh Token
* Token Refresh処理

---

# 4. 環境変数

`.env.local` を使用する。

```env
STRAVA_CLIENT_ID=
STRAVA_CLIENT_SECRET=
STRAVA_REDIRECT_URI=http://localhost:3000/api/auth/strava/callback

DATABASE_URL="file:./dev.db"

SESSION_SECRET=
```

`.env.local` はGit管理対象外とする。

`.env.example` を用意する。

```env
STRAVA_CLIENT_ID=
STRAVA_CLIENT_SECRET=
STRAVA_REDIRECT_URI=http://localhost:3000/api/auth/strava/callback
DATABASE_URL="file:./dev.db"
SESSION_SECRET=
```

---

# 5. Strava OAuth

## ログイン方式

Strava OAuth 2.0 Authorization Code Flowを利用する。

ログイン画面に

「Connect with Strava」

ボタンを表示する。

クリックするとStrava OAuth認証画面へ遷移する。

## OAuth Scope

基本的には以下を要求する。

```text
read
activity:read_all
```

理由:

`activity:read_all` を使用することで、ユーザー自身のOnly You設定のアクティビティも分析対象にできる。

書き込み権限は必要ないため要求しない。

以下は要求しない。

```text
activity:write
profile:write
```

最小権限を維持する。

---

# 6. OAuthフロー

```text
/login

↓

Connect with Strava

↓

Strava OAuth

↓

/api/auth/strava/callback

↓

Authorization Code受信

↓

Strava Token Endpoint

↓

Access Token
Refresh Token
expires_at
Athlete

↓

SQLiteへ保存

↓

Session生成

↓

/

Dashboard
```

OAuth `state` を利用し、CSRF対策を行う。

---

# 7. Token管理

Strava Access Tokenには有効期限がある。

APIアクセス前に必ず

```text
expires_at
```

を確認する。

有効期限が十分残っている場合:

```text
既存Access Token使用
```

期限切れ、または期限切れが近い場合:

```text
Refresh Token
↓
Strava Token Endpoint
↓
新Access Token
↓
新Refresh Token
↓
SQLite更新
```

Refresh Tokenについては、更新レスポンスに含まれた最新のRefresh Tokenを必ず保存する。

---

# 8. ログイン状態

ブラウザにはStrava Access Token / Refresh Tokenを保存しない。

ブラウザ側にはランダムなSession IDのみを保持する。

Cookie:

```text
HttpOnly
SameSite=Lax
```

を使用する。

ログイン済みSessionが有効である場合、

```text
/login
```

を表示せず、

```text
/
```

へ直接遷移する。

---

# 9. 画面構成

MVPでは以下の2ページを作る。

```text
/login
/
```

OAuth callback:

```text
/api/auth/strava/callback
```

はAPI Routeとして実装する。

---

# 10. Loginページ

## URL

```text
/login
```

## レイアウト

画面中央にカードを配置。

内容:

```text
Ride Analysis

自分のStravaデータを
もっと自由に分析する。

[ Connect with Strava ]
```

その下に小さく

```text
Your Strava credentials are never stored.
```

などの説明を置いてもよい。

ただし実際にはOAuth Tokenを保存するため、

「Stravaのパスワードを保存しません」

という意味になるよう表現する。

---

# 11. Dashboard

## URL

```text
/
```

縦スクロール型のダッシュボードとする。

構成:

```text
Header

Welcome / Athlete

Overview Statistics

Analytics

  ├─ Gear Distance
  └─ 将来のAnalysis Tile
```

---

# 12. Header

左:

```text
Ride Analysis
```

右:

```text
Athlete Avatar
Athlete Name
```

必要ならDropdownで

```text
Logout
Reconnect Strava
```

を提供する。

---

# 13. Overview

ページ上部に簡易統計カードを表示する。

MVPでは情報量を増やしすぎない。

推奨:

### 今月の距離

```text
245.8 km
```

### 今月のアクティビティ

```text
14
```

### 今月の運動時間

```text
12h 38m
```

### 今年の距離

```text
2,381 km
```

基本的にはActivity一覧から算出する。

特定スポーツだけではなく全アクティビティを対象とするかはデータ内容に応じて実装し、距離が存在するActivityを距離統計へ含める。

将来的に

```text
Ride
Run
Walk
```

などを分類表示できる構造にしておく。

---

# 14. Analyticsセクション

見出し:

```text
Analytics
```

その下に分析機能をカード／タイル形式で並べる。

PC:

```text
2〜3列
```

Mobile:

```text
1列
```

MVPでは1つだけ実装する。

```text
Gear Distance
```

将来的には

```text
Monthly Trends
Activity Comparison
Weekly Volume
Personal Records
Gear Usage
Year Comparison
Training Load
```

などを同じタイル構造で追加できるようにする。

---

# 15. Gear Distance

MVPの中心機能。

## UI

カードタイトル:

```text
Gear Distance
```

説明:

```text
指定した期間に、選択した機材で走った距離を確認します。
```

フォーム:

```text
From
[ 2026/08/01 ]

To
[ 2026/08/31 ]

Gear
[ Bianchi Oltre Race ▼ ]

[ Calculate ]
```

---

# 16. Date Presets

操作性向上のためプリセットを用意する。

```text
This Month
Last Month
This Year
Last 30 Days
Custom
```

プリセットを選択するとFrom / Toを自動更新する。

初期値:

```text
This Month
```

---

# 17. Gear選択

Stravaに登録されているGearを取得する。

表示例:

```text
All Gear
Bianchi Oltre Race
TREK FX3
Nike Pegasus
```

内部的にはStrava Gear IDを保持する。

例:

```ts
{
  id: "b123456",
  name: "Bianchi Oltre Race"
}
```

表示にはIDではなくGear Nameを使用する。

MVPではBike / Shoesの双方に対応可能な設計とする。

---

# 18. Gear Distance 集計ロジック

ユーザー入力:

```text
from
to
gearId
```

Strava APIから指定期間のActivityを取得。

`From` と `To` はStravaアカウントに設定されたタイムゾーンの暦日として扱う。開始日はその日の00:00:00から、終了日は翌日の00:00:00より前までを含める。タイムゾーン情報を取得できない場合のみUTCをフォールバックとして使用する。

概念的には:

```text
GET /athlete/activities

after = 開始日時
before = 終了日時
```

期間はUnix timestampへ変換する。

---

# 19. Pagination

Strava Activity APIはページングされるため、

```text
page
per_page
```

を利用する。

`per_page` は可能な範囲で大きめにする。

例:

```text
per_page=100
```

結果件数が `per_page` より少なくなるまで取得する。

疑似処理:

```text
activities = []

page = 1

while true:
    result = fetchActivities(page)

    activities += result

    if result.length < perPage:
        break

    page++
```

無限ループ防止を実装する。

---

# 20. Gear Filter

取得したActivityについて

```text
activity.gear_id
```

を比較する。

指定Gear:

```text
activity.gear_id === selectedGearId
```

の場合のみ集計。

All Gearの場合はGear Filterを行わない。

---

# 21. Distance

StravaのActivity `distance` はmeter単位として扱う。

集計:

```text
totalMeters = Σ activity.distance
```

表示:

```text
totalKilometers = totalMeters / 1000
```

表示は原則

```text
123.4 km
```

のように小数点1桁。

---

# 22. Gear Distance 結果表示

Calculate後はカード内に結果を表示。

例:

```text
Bianchi Oltre Race

Aug 1 — Aug 31, 2026

342.7 km

12 activities
```

補助情報:

```text
Average
28.6 km / activity
```

も表示する。

つまり結果には最低限:

* 合計距離
* Activity数
* Activity平均距離

を含める。

---

# 23. 空データ

条件に該当するActivityがない場合:

```text
No activities found

この期間・機材に一致するアクティビティはありません。
```

エラー扱いにはしない。

---

# 24. Loading

API取得中はCalculateを無効化する。

例:

```text
[ Calculating... ]
```

SkeletonまたはSpinnerを表示してもよい。

---

# 25. Error Handling

以下を区別する。

### Authentication Error

```text
Stravaとの接続が切れています。
再接続してください。
```

### Rate Limit

```text
Strava APIの利用制限に達しました。
時間を空けて再度試してください。
```

### Network Error

```text
Stravaからデータを取得できませんでした。
```

### Unknown Error

```text
予期しないエラーが発生しました。
```

開発環境では詳細をconsole/server logへ出力する。

Access Token / Refresh Token / Client Secretはログへ出力しない。

---

# 26. Strava API Client

APIアクセスを各画面から直接実装しない。

専用モジュールを作成する。

例:

```text
src/lib/strava/
    client.ts
    auth.ts
    activities.ts
    athlete.ts
    gear.ts
    types.ts
```

責務を分離する。

---

# 27. API Base URL

API Base URLは各ファイルへ直接書かず、一箇所へ集約する。

例:

```env
STRAVA_API_BASE_URL=
```

または

```text
src/lib/strava/config.ts
```

に定義する。

Strava APIの仕様変更へ簡単に追従できる構造にする。

---

# 28. 内部API

UIから直接Strava APIを呼ばず、Next.jsのサーバー層を経由する。

候補:

```text
GET /api/me

GET /api/dashboard

GET /api/gears

GET /api/analytics/gear-distance
```

Gear Distance:

```text
GET /api/analytics/gear-distance
    ?from=2026-08-01
    &to=2026-08-31
    &gearId=b123456
```

レスポンス例:

```json
{
  "gear": {
    "id": "b123456",
    "name": "Bianchi Oltre Race"
  },
  "period": {
    "from": "2026-08-01",
    "to": "2026-08-31"
  },
  "distanceMeters": 342700,
  "distanceKilometers": 342.7,
  "activityCount": 12,
  "averageDistanceKilometers": 28.6
}
```

---

# 29. ディレクトリ設計

一例:

```text
src/
├─ app/
│  ├─ login/
│  │  └─ page.tsx
│  │
│  ├─ api/
│  │  ├─ auth/
│  │  │  └─ strava/
│  │  │     ├─ login/
│  │  │     └─ callback/
│  │  │
│  │  ├─ dashboard/
│  │  ├─ gears/
│  │  └─ analytics/
│  │     └─ gear-distance/
│  │
│  ├─ layout.tsx
│  └─ page.tsx
│
├─ components/
│  ├─ dashboard/
│  ├─ analytics/
│  └─ ui/
│
├─ lib/
│  ├─ auth/
│  ├─ strava/
│  └─ db/
│
└─ types/
```

実装時にNext.jsの最新ベストプラクティスに合わせて変更してよい。

---

# 30. Prismaモデル

MVPでは過剰なDB設計を避ける。

概念的には:

```text
StravaAccount
- id
- athleteId
- accessToken
- refreshToken
- expiresAt
- scopes
- createdAt
- updatedAt

Session
- id
- stravaAccountId
- expiresAt
- createdAt
```

単一ユーザー利用を想定する。

ただし将来複数ユーザーへ拡張可能な形を壊さない。

---

# 31. セキュリティ

必須:

* Client SecretをClient Componentへ渡さない
* OAuth TokenをlocalStorageへ保存しない
* Refresh Tokenをブラウザへ返さない
* Session CookieはHttpOnly
* OAuth state検証
* `.env.local` をGit管理しない
* Tokenをログへ出力しない
* API Routeの入力値検証
* 日付範囲の妥当性検証

MVPでは個人ローカル用途であるため、過剰なEnterprise向けセキュリティ機構は不要。

---

# 32. UIデザイン

UIはGoogleのMaterial Design 3（M3）に沿った、控えめでクリーンなビジュアル言語を採用する。

方向性:

```text
Material Design 3
Google-like
Restrained
Minimal
```

ただしStrava本体のコピーUIにはしない。

## カラー

M3のセマンティックカラーロール／トークンに従う。

```text
Primary
On-primary
Primary-container
On-primary-container
Secondary
Secondary-container
On-secondary-container
Surface
Surface-container-low
Surface-container
Surface-container-high
On-surface
On-surface-variant
Outline
Outline-variant
Error
On-error
```

Strava OrangeはOAuthログインやStrava連携の文脈でのみ使用する。ダッシュボード全体のアクセントカラーには使用しない。

## タイポグラフィ

Robotoを基本とし、利用できない場合はシステムフォントへフォールバックする。

数値は大きく見せる。

例:

```text
342.7
km
```

見出し・本文・ラベルで明確な階層を保つ。

## シェイプ・エレベーション・状態レイヤー

M3のトークンに従う。

* シェイプ: カードやボタンに適切な角丸（例: 12〜16px）
* エレベーション: 控えめなシャドウ
* 状態レイヤー: Hover / Active / Pressed / Disabled などの状態を明示する

## レスポンシブ／アダプティブ

Desktopを主用途とするがResponsive対応する。

```text
Desktop: Overview 4 columns / Analytics 2〜3 columns
Tablet:  Overview 2 columns
Mobile:  1 column
```

Gear DistanceフォームもMobileでは縦並びにする。

## アクセシビリティ

* 十分なコントラストを確保する
* キーボード操作とフォーカス表示を保証する
* 状態を色だけでなくテキストやアイコンでも伝える

## Loading / Empty / Error 状態

各状態を明示的にデザインする。

* Loading: SkeletonまたはSpinner
* Empty: 該当データがない場合の表示
* Error: エラー種別に応じた表示

## フェイク分析カードを作らない

実データを表示しない装飾的なAnalyticsカードは作らない。

## デザインシステムの整理

色・タイポグラフィ・シェイプ・エレベーションなどのトークンを一箇所に集約し、将来Analytics Tileが増えても統一感が出る構造にする。

---

# 33. Responsive

Desktopを主用途とするがResponsive対応する。

Desktop:

```text
Overview: 4 columns
Analytics: 2〜3 columns
```

Tablet:

```text
Overview: 2 columns
```

Mobile:

```text
1 column
```

Gear DistanceフォームもMobileでは縦並びにする。

---

# 34. キャッシュ

MVPでは複雑な永続キャッシュを実装しない。

同一ページ表示中など明らかに同じデータを短時間で再要求する場合は、Next.js側または簡易メモリキャッシュを利用してもよい。

ただし実装を複雑にする場合は行わない。

優先順位:

```text
Correctness
↓
Simplicity
↓
Rate Limit
↓
Performance
```

---

# 35. Webhook

MVPでは実装しない。

理由:

* 個人ローカル用途
* サーバーを常時公開しない
* リアルタイム同期不要
* ActivityをローカルDBへ永続同期しない

将来サーバーへ常時デプロイした場合にWebhook対応を検討する。

---

# 36. テスト

最低限以下をテストする。

## Unit Test

* meter → kilometer変換
* Gear Filter
* Activity distance集計
* Date range
* Average distance

## Integration

* Token Refresh
* Pagination
* Gear Distance API

Strava API自体はMockする。

---

# 37. README

以下を必ず記載する。

## Requirements

```text
Node.js
pnpm
Strava Account
Strava API Application
```

## Setup

```bash
pnpm install
cp .env.example .env.local
pnpm prisma migrate dev
pnpm dev
```

## Strava API Setup

Strava Developer settingsで

```text
Authorization Callback Domain:
localhost
```

Callback:

```text
http://localhost:3000/api/auth/strava/callback
```

を利用するために必要な設定を説明する。

Client ID / Client Secret取得方法も説明する。

---

# 38. MVP完了条件

以下をすべて満たせばMVP完成とする。

* `/login` が存在する
* Strava OAuthでログインできる
* ログイン状態が保持される
* 再起動後でも再ログイン不要
* Access Tokenが自動更新される
* Dashboardが表示される
* 基本統計が表示される
* Stravaに登録したGearを選択できる
* From / Toを指定できる
* Date Presetが使える
* Gear Distanceを計算できる
* 合計距離がkmで表示される
* Activity数が表示される
* 平均距離が表示される
* Paginationに対応する
* Only You Activityを含められる
* Loading表示がある
* Empty Stateがある
* API Errorが適切に表示される
* Client Secret / Tokenがブラウザへ露出しない
* READMEだけでセットアップできる

---

# 39. MVP対象外

以下は現段階では実装しない。

* Activity詳細画面
* Activity編集
* Activityアップロード
* GPS Map
* Segment分析
* Heart Rate分析
* Power分析
* Training Load
* AI分析
* 他ユーザーとの比較
* SNS機能
* Stravaへの書き込み
* Webhook
* Docker
* Cloud deployment
* PostgreSQL
* Redis
* Background Job

将来追加できる構造のみ確保する。

---

# 40. 設計思想

このプロジェクトでは、

```text
「まず自分が見たい数字を簡単に出せる」
```

ことを最優先する。

Enterprise向けシステムのような過剰設計は避ける。

一方で、

```text
Analytics Tile
```

を増やすだけで、

```text
Gear Distance
Monthly Trends
Year Comparison
Bike Comparison
Weekly Volume
```

などへ徐々に拡張できる構造にする。
