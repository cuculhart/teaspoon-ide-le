export interface RecentProject {
  name: string
  path: string
  openCount: number
  lastOpenedAt: number
}

const RECENT_PROJECTS_KEY = 'recent_projects'
const MAX_RECENT_PROJECTS = 10

export type ThemeMode =
  'system' | 'dark' | 'light' | 'quiet' | 'heritage' | 'console'

// 'tree' = send only the file list (AI fetches contents via tools).
// 'full' = send scored file contents up to the token budget (legacy).
export type ContextMode = 'tree' | 'full'

// Ollama "think" field: boolean on/off, or an effort level for models
// that support levels (gpt-oss, qwen3, ...).
export type OllamaThink = boolean | 'low' | 'medium' | 'high'

// Chat mode: 'agent' may read/write files and run commands (approval
// gated); 'ask' is read-only - the AI can inspect the project but file
// changes, shell commands, and CLOSE_PROJECT are blocked.
export type ChatMode = 'agent' | 'ask'

// Local Edition has no credentials at all: the only backend is a local
// Ollama server, so every setting is plain localStorage. There is no
// secret store, no API key, no proxy, no managed mode.

// Config key -> persisted storage key
const STORAGE_KEYS: Record<string, string> = {
  THEME: 'theme',
  UI_FONT_FAMILY: 'ui_font_family',
  UI_FONT_SIZE: 'ui_font_size',
  CHAT_FONT_SIZE: 'chat_font_size',
  CONTEXT_MODE: 'context_mode',
  CONTEXT_MAX_FILES: 'context_max_files',
  OLLAMA_MODEL: 'ollama_model',
  OLLAMA_NUM_THREAD: 'ollama_num_thread',
  OLLAMA_NUM_CTX: 'ollama_num_ctx',
  OLLAMA_TEMPERATURE: 'ollama_temperature',
  OLLAMA_THINK: 'ollama_think',
  CHAT_MODE: 'chat_mode',
}

class ConfigService {
  private config: Map<string, string> = new Map()

  constructor() {
    this.loadConfig()
  }

  private writeStorage(storageKey: string, value: string): void {
    localStorage.setItem(storageKey, value)
  }

  private loadConfig() {
    const theme = localStorage.getItem('theme')
    const uiFontFamily = localStorage.getItem('ui_font_family')
    const uiFontSize = localStorage.getItem('ui_font_size')
    const chatFontSize = localStorage.getItem('chat_font_size')
    const contextMode = localStorage.getItem('context_mode')
    const contextMaxFiles = localStorage.getItem('context_max_files')
    const ollamaModel = localStorage.getItem('ollama_model')
    const ollamaNumThread = localStorage.getItem('ollama_num_thread')
    const ollamaNumCtx = localStorage.getItem('ollama_num_ctx')
    const ollamaTemperature = localStorage.getItem('ollama_temperature')
    const ollamaThink = localStorage.getItem('ollama_think')
    const chatMode = localStorage.getItem('chat_mode')

    if (theme) this.config.set('THEME', theme)
    if (uiFontFamily) this.config.set('UI_FONT_FAMILY', uiFontFamily)
    if (uiFontSize) this.config.set('UI_FONT_SIZE', uiFontSize)
    if (chatFontSize) this.config.set('CHAT_FONT_SIZE', chatFontSize)
    if (contextMode) this.config.set('CONTEXT_MODE', contextMode)
    if (contextMaxFiles) this.config.set('CONTEXT_MAX_FILES', contextMaxFiles)
    if (ollamaModel) this.config.set('OLLAMA_MODEL', ollamaModel)
    if (ollamaNumThread) this.config.set('OLLAMA_NUM_THREAD', ollamaNumThread)
    if (ollamaNumCtx) this.config.set('OLLAMA_NUM_CTX', ollamaNumCtx)
    if (ollamaTemperature) this.config.set('OLLAMA_TEMPERATURE', ollamaTemperature)
    if (ollamaThink) this.config.set('OLLAMA_THINK', ollamaThink)
    if (chatMode) this.config.set('CHAT_MODE', chatMode)
  }

  get(key: string): string | undefined {
    return this.config.get(key)
  }

  set(key: string, value: string): void {
    this.config.set(key, value)
    const storageKey = STORAGE_KEYS[key]
    if (storageKey) this.writeStorage(storageKey, value)
  }

  private remove(key: string, storageKey: string): void {
    this.config.delete(key)
    localStorage.removeItem(storageKey)
  }

  getTheme(): ThemeMode {
    const value = this.get('THEME')
    const modes: ThemeMode[] = ['system', 'dark', 'light', 'quiet', 'heritage', 'console']
    // 'silver' was replaced by 'console' - migrate stored selections.
    const normalized = value === 'silver' ? 'console' : value
    return modes.includes(normalized as ThemeMode) ? (normalized as ThemeMode) : 'light'
  }

  setTheme(theme: ThemeMode): void {
    this.set('THEME', theme)
  }

  // Noto Sans JP is the product default for Japanese UI text. A stored
  // empty string means the user explicitly chose the system font.
  getUIFontFamily(): string | undefined {
    return this.get('UI_FONT_FAMILY') ?? 'Noto Sans JP'
  }

  setUIFontFamily(fontFamily: string): void {
    this.set('UI_FONT_FAMILY', fontFamily)
  }

  getUIFontSize(): number | undefined {
    const value = this.get('UI_FONT_SIZE')
    const size = value ? parseInt(value, 10) : NaN
    return Number.isFinite(size) && size > 0 ? size : undefined
  }

  setUIFontSize(fontSize: number): void {
    this.set('UI_FONT_SIZE', String(fontSize))
  }

  // Chat panel font size - separate from the UI/editor size so chat text
  // can be scaled on its own. 0/empty = the 13px CSS default.
  getChatFontSize(): number | undefined {
    const value = this.get('CHAT_FONT_SIZE')
    const size = value ? parseInt(value, 10) : NaN
    return Number.isFinite(size) && size > 0 ? size : undefined
  }

  setChatFontSize(fontSize: number): void {
    this.set('CHAT_FONT_SIZE', String(fontSize))
  }

  getRecentProjects(): RecentProject[] {
    try {
      const raw = localStorage.getItem(RECENT_PROJECTS_KEY)
      if (!raw) return []
      const list = JSON.parse(raw)
      return Array.isArray(list) ? list : []
    } catch {
      return []
    }
  }

  // Sorted by open count (most used first), then most recent
  addRecentProject(name: string, path: string): void {
    const list = this.getRecentProjects()
    const existing = list.find(p => p.path === path)
    if (existing) {
      existing.openCount += 1
      existing.lastOpenedAt = Date.now()
      existing.name = name
    } else {
      list.push({ name, path, openCount: 1, lastOpenedAt: Date.now() })
    }
    list.sort((a, b) => b.openCount - a.openCount || b.lastOpenedAt - a.lastOpenedAt)
    localStorage.setItem(RECENT_PROJECTS_KEY, JSON.stringify(list.slice(0, MAX_RECENT_PROJECTS)))
  }

  removeRecentProject(path: string): void {
    const list = this.getRecentProjects().filter(p => p.path !== path)
    localStorage.setItem(RECENT_PROJECTS_KEY, JSON.stringify(list))
  }

  // Chat focus mode: only the chat panel is visible, IDE panes hidden
  getChatFocus(): boolean {
    return localStorage.getItem('chat_focus') === '1'
  }

  setChatFocus(on: boolean): void {
    localStorage.setItem('chat_focus', on ? '1' : '0')
  }

  // Conversation active when no project is open - restored on the next
  // run so project-less chats survive restarts like project chats do.
  getLastNoProjectConv(): string | null {
    return localStorage.getItem('last_no_project_conv')
  }

  setLastNoProjectConv(id: string | null): void {
    if (id) {
      localStorage.setItem('last_no_project_conv', id)
    } else {
      localStorage.removeItem('last_no_project_conv')
    }
  }

  // Whether long conversations are compacted into a rolling summary.
  // The compaction costs one extra AI call per turn on long chats, so
  // it can be disabled to keep request counts identical to before.
  getAutoSummarize(): boolean {
    return localStorage.getItem('auto_summarize') !== '0'
  }

  setAutoSummarize(on: boolean): void {
    localStorage.setItem('auto_summarize', on ? '1' : '0')
  }

  getOllamaModel(): string {
    return this.get('OLLAMA_MODEL') || 'gemma4:e4b'
  }

  setOllamaModel(model: string): void {
    this.set('OLLAMA_MODEL', model)
  }

  // CPU threads passed to Ollama as options.num_thread. Product default
  // (unset) is logical processors - 1, leaving one core free so the PC
  // stays responsive while a local model generates.
  getOllamaNumThread(): number | undefined {
    const value = parseInt(this.get('OLLAMA_NUM_THREAD') || '', 10)
    if (Number.isFinite(value) && value > 0) return value
    const cores = typeof navigator !== 'undefined' ? navigator.hardwareConcurrency : 0
    return cores > 1 ? cores - 1 : undefined
  }

  setOllamaNumThread(threads: number | undefined): void {
    if (threads && threads > 0) {
      this.set('OLLAMA_NUM_THREAD', String(threads))
    } else {
      this.remove('OLLAMA_NUM_THREAD', 'ollama_num_thread')
    }
  }

  // Context window passed to Ollama as options.num_ctx. Product default
  // (unset) is 8192: Ollama's own default (4096) is too small for agent
  // loops - the system prompt + file reads + reasoning can exhaust it
  // mid-generation and surface as an empty reply.
  getOllamaNumCtx(): number | undefined {
    const value = parseInt(this.get('OLLAMA_NUM_CTX') || '', 10)
    return Number.isFinite(value) && value > 0 ? value : 8192
  }

  setOllamaNumCtx(ctx: number | undefined): void {
    if (ctx && ctx > 0) {
      this.set('OLLAMA_NUM_CTX', String(ctx))
    } else {
      this.remove('OLLAMA_NUM_CTX', 'ollama_num_ctx')
    }
  }

  // Sampling temperature passed to Ollama as options.temperature. Product
  // default (unset) is 0.2 - measured runs showed the model-default ~1.0
  // causes language drift and hallucinated details in agent loops.
  getOllamaTemperature(): number | undefined {
    const value = parseFloat(this.get('OLLAMA_TEMPERATURE') || '')
    return Number.isFinite(value) && value >= 0 && value <= 2 ? value : 0.2
  }

  setOllamaTemperature(temperature: number | undefined): void {
    if (temperature !== undefined && temperature >= 0 && temperature <= 2) {
      this.set('OLLAMA_TEMPERATURE', String(temperature))
    } else {
      this.remove('OLLAMA_TEMPERATURE', 'ollama_temperature')
    }
  }

  // Thinking control for reasoning models (qwen3.5, gpt-oss, ...), sent
  // as the "think" field of /api/chat: boolean on/off, or an effort level
  // for models that accept one. gpt-oss cannot fully disable thinking -
  // "low" is its minimum. Product default (unset) is "low": much faster
  // replies on slow hardware. The stored value "default" explicitly means
  // "let the model decide" (mapped to undefined here).
  getOllamaThink(): OllamaThink | undefined {
    const value = this.get('OLLAMA_THINK')
    if (value === '1') return true
    if (value === '0') return false
    if (value === 'low' || value === 'medium' || value === 'high') return value
    if (value === 'default') return undefined
    return 'low'
  }

  // 'default' (or undefined) stores the explicit "model decides" sentinel
  // so it stays distinguishable from "never configured" (= product
  // default "low").
  setOllamaThink(think: OllamaThink | 'default' | undefined): void {
    if (think === undefined || think === 'default') {
      this.set('OLLAMA_THINK', 'default')
    } else {
      this.set('OLLAMA_THINK', think === true ? '1' : think === false ? '0' : think)
    }
  }

  // 'agent' (default) keeps the full tool set; 'ask' restricts the AI to
  // read-only inspection commands - enforced in the agent loop, not just
  // by prompt.
  getChatMode(): ChatMode {
    return this.get('CHAT_MODE') === 'ask' ? 'ask' : 'agent'
  }

  setChatMode(mode: ChatMode): void {
    this.set('CHAT_MODE', mode)
  }

  // Japanese-only edition: the UI language is fixed. The key stays so
  // call sites keep working; there is no language picker.
  getLanguage(): string {
    return 'ja'
  }

  setLanguage(_code: string): void {
    // no-op - language is fixed to Japanese
  }

  getContextMode(): ContextMode {
    return this.get('CONTEXT_MODE') === 'full' ? 'full' : 'tree'
  }

  setContextMode(mode: ContextMode): void {
    this.set('CONTEXT_MODE', mode)
  }

  getContextMaxFiles(): number {
    const value = parseInt(this.get('CONTEXT_MAX_FILES') || '', 10)
    return Number.isFinite(value) && value > 0 ? value : 2000
  }

  setContextMaxFiles(maxFiles: number): void {
    this.set('CONTEXT_MAX_FILES', String(maxFiles))
  }

  // Clears the Recent Projects list shown in the Explorer
  clearRecentProjects(): void {
    localStorage.removeItem(RECENT_PROJECTS_KEY)
  }

  // Session restore: reopen the last project/file after a reload
  getLastProjectPath(): string | undefined {
    return localStorage.getItem('last_project_path') || undefined
  }

  setLastProjectPath(path: string): void {
    if (path) {
      localStorage.setItem('last_project_path', path)
    } else {
      localStorage.removeItem('last_project_path')
    }
  }

  getLastOpenFile(): string | undefined {
    return localStorage.getItem('last_open_file') || undefined
  }

  setLastOpenFile(path: string): void {
    if (path) {
      localStorage.setItem('last_open_file', path)
    } else {
      localStorage.removeItem('last_open_file')
    }
  }

}

export const configService = new ConfigService()
