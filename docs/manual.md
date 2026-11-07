# Teaspoon IDE Local Edition リファレンスマニュアル

Teaspoon IDE Local Edition（Teaspoon LE）のクリックリファレンスです。
Ollama の導入からモデル取得、動作確認、Teaspoon LE の設定までを順番に説明します。

---

## 1. Ollama とは

**Ollama** は、ローカルPC上で大規模言語モデル（LLM）を実行するためのソフトウェアです。
Teaspoon LE は Ollama を AI エンジンとして利用します。プロンプトやコードが外部に送信されることはありません。

- 公式サイト: https://ollama.com
- ライセンス: MIT
- Teaspoon LE は `http://localhost:11434` の Ollama サーバーにのみ接続します

---

## 2. Ollama のインストール（Windows）

### 2.1 インストーラーの入手

1. ブラウザで https://ollama.com/download を開きます
2. **Windows** 用のインストーラー（`OllamaSetup.exe`）をダウンロードします
3. ダウンロードした `OllamaSetup.exe` を実行し、指示に従ってインストールします

インストールが完了すると、Ollama はトレイ（通知領域）に常駐します。
トレイアイコンを右クリックすると `Quit Ollama` / `Open Console` などのメニューが表示されます。

### 2.1a インストーラー以外のインストール方法

公式サイトのダウンロードページ（https://ollama.com/download）が
「本当に公式か分からない」という場合や、既にパッケージ管理ツールを
使っている場合は、次の方法でもインストールできます。

**winget（Windows 標準のパッケージマネージャー）**

PowerShell またはコマンドプロンプトで：

```powershell
winget install Ollama.Ollama
```

winget は Windows 10 1809 以降 / Windows 11 に標準搭載されています。
アプリストア版の検索結果ではなく、Microsoft が管理する
パッケージリポジトリから取得されるため、公式サイトと同等の
信頼性があります。

**その他のパッケージマネージャー**

```powershell
choco install ollama   # Chocolatey を使っている場合
scoop install ollama   # Scoop を使っている場合
```

**公式インストールスクリプト（PowerShell）**

```powershell
irm https://ollama.com/install.ps1 | iex
```

URL が `ollama.com` ドメインであることを確認した上で実行してください。

> **どの方法でも結果は同じです**
> いずれの方法でも `ollama` コマンドが PATH に追加され、
> `http://localhost:11434` で API サーバーが起動します。
> Teaspoon LE から見た動作に違いはありません。
>
> Teaspoon LE のターミナルパネル（本物のシェル）からも
> これらのコマンドは実行できます。ただし初回インストールは
> UAC の昇格確認や長時間のダウンロードを伴うため、
> 手動での実行を推奨します。

> **社内・オフライン環境の場合**
> インストールには一度だけインターネット接続が必要です。
> 完全にオフラインの環境へ配布する場合は、接続可能なマシンで
> インストーラーとモデルを入手し、社内ファイル共有等で配布してください
> （手順は「5. オフライン環境への配備」を参照）。

### 2.2 コマンドラインからの確認

Ollama をインストールすると `ollama` コマンドが使えます。
コマンドプロンプトまたは PowerShell で確認します：

```bat
ollama --version
```

バージョン番号が表示されればインストール成功です。

サーバーが動作しているかは、ブラウザで次のURLを開いて確認できます：

```
http://localhost:11434
```

`Ollama is running` と表示されればOKです。

---

## 3. モデルの取得（gemma4:e4b）

Teaspoon LE の既定モデルは **gemma4:e4b** です。
Ollama のコマンドでモデルをダウンロードします：

```bat
ollama pull gemma4:e4b
```

ダウンロードには数GBの通信とディスク容量が必要です。
完了したら、インストール済みモデルを確認します：

```bat
ollama list
```

`gemma4:e4b` が一覧に表示されていれば準備完了です。

> **補足**: `gemma4:e4b` 以外のモデル（`ollama list` で確認できるもの）も
> Teaspoon LE の設定画面で選択できます。小型モデルは動作が速い一方、
> エージェント機能（ファイル操作の自動実行）の精度が下がる場合があります。

### 3.1 モデルの動作確認（「こんにちは」テスト）

コマンドラインで直接モデルに話しかけてみましょう：

```bat
ollama run gemma4:e4b
```

プロンプトが表示されたら、次を入力して Enter：

```
こんにちは
```

日本語で応答が返ってくれば、モデルは正常に動作しています。
終了するには `Ctrl+D` または `/bye` を入力します。

---

## 4. Teaspoon IDE Local Edition の設定

### 4.1 起動

- **配布版**: `Teaspoon IDE Local Edition.exe` をダブルクリック
- **開発版**: プロジェクトフォルダで `npm run dev`

### 4.2 設定画面の開き方

チャット画面右上の **⚙️（歯車アイコン）** をクリックします。

### 4.3 設定項目一覧

#### 外観（Appearance）

| 項目 | 説明 | 初期値 |
|---|---|---|
| Theme | UIテーマ。System/Dark/Light/Organic Light/Heritage/Silver Screen | Light |
| Font Family | UIフォント。インストール済みフォントからも選択可 | Noto Sans JP |
| Installed Fonts | PCにインストールされたフォント一覧 | — |
| Font Size | UI全体の文字サイズ（px） | 13 |
| Chat Font Size | チャット欄だけの文字サイズ（px） | 13 |

#### AI Context

| 項目 | 説明 | 初期値 |
|---|---|---|
| Context Mode | `File tree only` はファイル一覧のみ送信（低トークン・推奨）。`Full file contents` はファイル全文を送信（高コスト） | File tree only |
| Max Files | ツリー送信時の最大ファイル数 | 2000 |
| Summarize long conversations | 長い会話を自動要約（1ターンごとにAIリクエスト1回追加） | ON |

#### Ollama（ローカル AI）

| 項目 | 説明 | 初期値 |
|---|---|---|
| Model | ローカルにインストール済みのモデルから選択 | gemma4:e4b |
| CPU Threads | 推論に使うスレッド数。空欄=論理プロセッサ数-1 | MAX-1 |
| Context Size | コンテキストウィンドウ（num_ctx）。小さいと応答が空になることがある | 8192 |
| Temperature | サンプリング温度。低いほど決定的 | 0.2 |
| Thinking | 推論トレースの強制ON/OFF・強度。低いほど高速 | Low |

#### 履歴（History）

| 項目 | 説明 |
|---|---|
| Clear Recent History | エクスプローラーの最近のプロジェクトとクイックオープン履歴を削除 |
| Clear All Chat History | 保存済みのAIチャット履歴をすべて削除 |

> **接続確認**: 設定画面の Ollama 欄に「接続済み - N 個のモデルがインストールされています」と
> 表示されれば、Teaspoon LE と Ollama の接続は正常です。
> 「Cannot reach Ollama」と出る場合は、Ollama が起動していないか、
> モデルが未取得です。

---

## 5. オフライン環境への配備

社内LANに接続できない環境へ配備する場合の手順です。

### 5.1 インストールメディアの準備（接続可能なマシンで実施）

1. Ollama インストーラー（`OllamaSetup.exe`）を入手
2. `ollama pull gemma4:e4b` でモデルを取得
3. `%USERPROFILE%\.ollama\models` フォルダをまるごとコピー
   （これがモデル本体です。数GBあります）

### 5.2 対象マシンへの導入

1. Ollama をインストールし、一度起動してトレイに常駐させる
2. `%USERPROFILE%\.ollama\models` にモデルフォルダをコピー
3. `ollama list` で `gemma4:e4b` が見えることを確認
4. Teaspoon IDE Local Edition をインストール

### 5.3 強化する場合（任意）

- Ollama サービスの環境変数に `OLLAMA_NO_CLOUD=1` を設定すると、
  Ollama のクラウド関連通信を無効化できます
- ファイアウォールで Ollama（`ollama.exe` / ポート11434）の
  アウトバウンド通信をブロックすることも可能です
  ※ 11434 は localhost 宛のみ許可し、LAN への公開はしないでください

---

## 6. 用語集

| 用語 | 説明 |
|---|---|
| **Teaspoon LE** | Teaspoon IDE Local Edition の略称。本製品 |
| **Ollama** | ローカルPCでLLMを実行するソフトウェア。`localhost:11434` でAPIを提供 |
| **モデル** | AIの「頭脳」にあたるファイル。`gemma4:e4b` など |
| **gemma4:e4b** | Google Gemma 4 系の軽量モデル。Teaspoon LE の既定モデル |
| **プロンプト** | AIに送る指示文。コードや質問を含む |
| **コンテキスト（num_ctx）** | AIが一度に覚えておける量。小さいと長い会話や大きなファイルで応答が途切れる |
| **トークン** | AIがテキストを処理する単位。日本語は英語より多く消費する傾向 |
| **Temperature** | 応答のランダム性。0に近いほど毎回同じ答え、高いほど創造的だが不安定 |
| **Thinking（思考モード）** | 回答前にAIが内部で「考える」機能。OFF/低にすると速いが精度が下がる場合あり |
| **エージェント** | AIがファイルの読み書き・コマンド実行を自律的に行うモード。各操作はユーザー承認制 |
| **WRITE_FILE / EDIT_FILE** | AIがファイルを作成・編集するためのコマンド形式 |
| **READ_FILE / GREP / FIND_FILES** | AIがファイル内容を読む・検索するコマンド形式 |
| **RUN_COMMAND** | AIがシェルコマンドを実行するコマンド形式。必ずユーザー承認が必要 |
| **IDE** | Integrated Development Environment。エディタ・ターミナル・Git等を統合した開発環境 |
| **BYOK** | Bring Your Own Key。ユーザーが自分のAPIキーを持ち込む方式。Teaspoon LE では不採用 |
| **オフライン** | ネットワーク未接続でも動作すること。Teaspoon LE の中核要件 |
| **localhost** | 自分のPC自身を指すアドレス（127.0.0.1）。外部からはアクセス不可 |
