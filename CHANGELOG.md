# Changelog

Teaspoon IDE Local Edition（Teaspoon LE）の変更履歴です。

本プロジェクトは **teaspoon-ide v1.7.2 をフォーク**した独立製品であり、
上流のバージョン履歴は引き継いでいません（v1.7.2 以前の変更履歴は
このファイルには記載しません）。

フォーク元には **2026年10月末までに公開されているセキュリティ対策が
すべて取り込まれています**（Electron 44.10.0 / Node.js 24.22.1 など、
teaspoon-ide v1.7.2 時点の最新のセキュリティ修正を含みます）。

## [Unreleased]

### Changed

- アプリアイコンを Teaspoon LE 用のものに差し替え、favicon を追加。
- 設定の初期値を製品向けに調整（未設定時のみ適用、ユーザー設定は維持）:
  - フォント: Noto Sans JP
  - CPUスレッド数: 論理プロセッサ数 - 1
  - コンテキストサイズ: 8192
  - 温度: 0.2
  - 思考モード: 低
- Ollama 未起動時にチャット画面へ案内バー（起動方法と再確認ボタン）を
  表示するようにした。

## [1.0.0] - 2026-11-06

### Changed

- teaspoon-ide v1.7.2 から **Teaspoon IDE Local Edition**（Teaspoon LE）
  としてフォーク。v1.0.0 から独立してバージョン管理。上流追従なし。

### Removed

- Gemini API プロバイダー、LiteLLM プロキシ、BYOK／APIキー関連の
  すべて（設定画面、キー保存、OSキーチェーンのシークレットストア、
  メインプロセスの LLM リレー IPC）。
- 組織（マネージド）モード、そのサインインゲート、予算使用量 UI。
- リモート／カスタムの Ollama 接続先設定 — 接続先は
  `http://localhost:11434` に固定。
- UI言語選択と英語辞書。製品は日本語のみで、エージェントプロンプトも
  日本語応答を指示。
- テーマを System / Dark / Light / Organic Light / Heritage /
  Silver Screen に縮小。既定テーマは Light。

### Added

- ローカル Ollama 単独バックエンド（`/api/chat`、`/api/tags`）。
  モデル選択はローカルにインストール済みのモデルから行い、既定は
  `gemma4:e4b`。CPU Threads、Context Size、Temperature、Thinking の
  設定を維持。
- 日本語 UI 辞書とプロンプト（lang/ja.json）、日本語のみの
  メニュー／ダイアログ、日本語応答を要求するシステムプロンプト。
