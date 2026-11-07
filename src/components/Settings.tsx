import React, { useState, useEffect } from 'react'
import { configService, ThemeMode, ContextMode } from '../services/configService'
import { ollamaService } from '../services/ollamaService'
import { themeService } from '../services/themeService'
import { chatHistoryService } from '../services/chatHistoryService'
import { useT } from '../services/i18nService'
import './Settings.css'

interface SettingsProps {
  onClose: () => void
}

type SettingsGroupId = 'appearance' | 'aiContext' | 'ollama' | 'history'

const SETTINGS_GROUPS_KEY = 'settings_groups'

const DEFAULT_OPEN_GROUPS: Record<SettingsGroupId, boolean> = {
  appearance: true,
  aiContext: true,
  ollama: true,
  history: false,
}

const loadOpenGroups = (): Record<SettingsGroupId, boolean> => {
  try {
    const saved = JSON.parse(localStorage.getItem(SETTINGS_GROUPS_KEY) || '{}')
    return { ...DEFAULT_OPEN_GROUPS, ...saved }
  } catch {
    return DEFAULT_OPEN_GROUPS
  }
}

interface SettingsGroupProps {
  title: string
  open: boolean
  onToggle: () => void
  children: React.ReactNode
}

const SettingsGroup: React.FC<SettingsGroupProps> = ({ title, open, onToggle, children }) => (
  <section className="settings-group">
    <button type="button" className="settings-group-header" onClick={onToggle} aria-expanded={open}>
      <span className={`settings-group-chevron${open ? ' open' : ''}`}>▸</span>
      <span className="settings-group-title">{title}</span>
    </button>
    {open && <div className="settings-group-body">{children}</div>}
  </section>
)

// Local Edition: the only AI backend is a local Ollama server. There is
// no API key, no provider picker, no proxy, no organization sign-in -
// every setting here applies immediately.
const Settings: React.FC<SettingsProps> = ({ onClose }) => {
  const [theme, setTheme] = useState<ThemeMode>('light')
  const [fontFamily, setFontFamily] = useState('')
  const [systemFonts, setSystemFonts] = useState<string[]>([])
  const [fontSize, setFontSize] = useState('')
  const [chatFontSize, setChatFontSize] = useState('')
  const [historyCleared, setHistoryCleared] = useState(false)
  const [confirmClearChatHistory, setConfirmClearChatHistory] = useState(false)
  const [contextMode, setContextMode] = useState<ContextMode>('tree')
  const [contextMaxFiles, setContextMaxFiles] = useState('2000')
  const [autoSummarize, setAutoSummarize] = useState(true)
  const [ollamaModel, setOllamaModel] = useState('gemma4:e4b')
  const [ollamaNumThread, setOllamaNumThread] = useState('')
  const [ollamaNumCtx, setOllamaNumCtx] = useState('')
  const [ollamaTemperature, setOllamaTemperature] = useState('')
  const [ollamaThink, setOllamaThink] = useState<'default' | 'on' | 'off' | 'low' | 'medium' | 'high'>('default')
  const [ollamaModels, setOllamaModels] = useState<string[]>([])
  const [ollamaReachable, setOllamaReachable] = useState<boolean | null>(null)
  const [openGroups, setOpenGroups] = useState<Record<SettingsGroupId, boolean>>(loadOpenGroups)
  const t = useT()
  // Logical processor count of this machine - the upper bound for
  // Ollama's num_thread option.
  const maxThreads = navigator.hardwareConcurrency || 0

  const toggleGroup = (id: SettingsGroupId) => {
    setOpenGroups(prev => {
      const next = { ...prev, [id]: !prev[id] }
      localStorage.setItem(SETTINGS_GROUPS_KEY, JSON.stringify(next))
      return next
    })
  }

  useEffect(() => {
    setTheme(configService.getTheme())
    setFontFamily(configService.getUIFontFamily() || '')
    const savedFontSize = configService.getUIFontSize()
    setFontSize(savedFontSize ? String(savedFontSize) : '')
    const savedChatFontSize = configService.getChatFontSize()
    setChatFontSize(savedChatFontSize ? String(savedChatFontSize) : '')
    setContextMode(configService.getContextMode())
    setContextMaxFiles(String(configService.getContextMaxFiles()))
    setAutoSummarize(configService.getAutoSummarize())
    setOllamaModel(configService.getOllamaModel())
    const nt = configService.getOllamaNumThread()
    setOllamaNumThread(nt ? String(nt) : '')
    const nc = configService.getOllamaNumCtx()
    setOllamaNumCtx(nc ? String(nc) : '')
    const temp = configService.getOllamaTemperature()
    setOllamaTemperature(temp !== undefined ? String(temp) : '')
    const think = configService.getOllamaThink()
    setOllamaThink(
      think === undefined ? 'default'
        : think === true ? 'on'
        : think === false ? 'off'
        : think
    )
    refreshOllamaModels()
  }, [])

  // Enumerate installed fonts via Chromium's Font Access API to feed the
  // Font Family datalist. If it is unavailable or denied (some platforms
  // / permission setups), the field silently stays a plain text input.
  useEffect(() => {
    let cancelled = false
    const query = (window as { queryLocalFonts?: () => Promise<{ family: string }[]> })
      .queryLocalFonts
    if (!query) return
    query.call(window).then((faces) => {
      if (cancelled) return
      const families = [...new Set(faces.map((f) => f.family))]
        .sort((a, b) => a.localeCompare(b))
      setSystemFonts(families)
    }).catch(() => {})
    return () => { cancelled = true }
  }, [])

  // List models installed in the local Ollama server.
  const refreshOllamaModels = async () => {
    setOllamaReachable(null)
    const models = await ollamaService.listModels()
    setOllamaModels(models)
    setOllamaReachable(models.length > 0)
  }

  // Appearance settings apply immediately (no Save required)
  const handleThemeChange = (value: ThemeMode) => {
    setTheme(value)
    themeService.setMode(value)
  }

  const handleFontFamilyChange = (value: string) => {
    setFontFamily(value)
    configService.setUIFontFamily(value.trim())
    themeService.applyFont()
  }

  const handleFontSizeChange = (value: string) => {
    setFontSize(value)
    const size = parseInt(value, 10)
    configService.setUIFontSize(Number.isFinite(size) && size > 0 ? size : 0)
    themeService.applyFont()
  }

  const handleChatFontSizeChange = (value: string) => {
    setChatFontSize(value)
    const size = parseInt(value, 10)
    configService.setChatFontSize(Number.isFinite(size) && size > 0 ? size : 0)
    themeService.applyFont()
  }

  // AI context settings apply on the next chat message
  const handleContextModeChange = (value: ContextMode) => {
    setContextMode(value)
    configService.setContextMode(value)
    window.dispatchEvent(new Event('teaspoon:context-changed'))
  }

  const handleContextMaxFilesChange = (value: string) => {
    setContextMaxFiles(value)
    const n = parseInt(value, 10)
    if (Number.isFinite(n) && n > 0) {
      configService.setContextMaxFiles(n)
      window.dispatchEvent(new Event('teaspoon:context-changed'))
    }
  }

  const handleAutoSummarizeChange = (on: boolean) => {
    setAutoSummarize(on)
    configService.setAutoSummarize(on)
  }

  const notifyLlmChanged = () => {
    window.dispatchEvent(new Event('teaspoon:llm-changed'))
  }

  const handleOllamaModelChange = (value: string) => {
    const changed = value.trim() !== configService.getOllamaModel()
    setOllamaModel(value)
    if (value.trim()) {
      configService.setOllamaModel(value.trim())
      // A context size tuned for one model is not necessarily right for
      // another, so switching models resets it to Ollama's default.
      if (changed) {
        configService.setOllamaNumCtx(undefined)
        setOllamaNumCtx('')
      }
      notifyLlmChanged()
    }
  }

  const handleOllamaNumThreadChange = (value: string) => {
    setOllamaNumThread(value)
    const n = parseInt(value, 10)
    configService.setOllamaNumThread(Number.isFinite(n) && n > 0 ? n : undefined)
  }

  const handleOllamaNumCtxChange = (value: string) => {
    setOllamaNumCtx(value)
    const n = parseInt(value, 10)
    configService.setOllamaNumCtx(Number.isFinite(n) && n > 0 ? n : undefined)
  }

  const handleOllamaTemperatureChange = (value: string) => {
    setOllamaTemperature(value)
    const n = parseFloat(value)
    configService.setOllamaTemperature(Number.isFinite(n) && n >= 0 && n <= 2 ? n : undefined)
  }

  const handleOllamaThinkChange = (value: 'default' | 'on' | 'off' | 'low' | 'medium' | 'high') => {
    setOllamaThink(value)
    configService.setOllamaThink(
      value === 'default' ? undefined
        : value === 'on' ? true
        : value === 'off' ? false
        : value
    )
  }

  // Clears Recent Projects (Explorer) and the Quick Open recent-files list.
  // Project files, chats, and settings are untouched.
  const handleClearHistory = () => {
    configService.clearRecentProjects()
    window.dispatchEvent(new Event('teaspoon:clear-file-history'))
    window.dispatchEvent(new Event('teaspoon:recents-cleared'))
    setHistoryCleared(true)
    setTimeout(() => setHistoryCleared(false), 2000)
  }

  const handleClearChatHistory = () => {
    void chatHistoryService.clearAll()
    window.dispatchEvent(new Event('teaspoon:chat-history-cleared'))
    setConfirmClearChatHistory(false)
    setChatHistoryCleared(true)
    setTimeout(() => setChatHistoryCleared(false), 2000)
  }

  const [chatHistoryCleared, setChatHistoryCleared] = useState(false)

  return (
    <div className="settings-overlay">
      <div className="settings-modal">
        <div className="settings-header">
          <h2>{t('Settings')}</h2>
          <button className="close-button" onClick={onClose}>×</button>
        </div>

        <div className="settings-content">
          <SettingsGroup title={t('Appearance')} open={openGroups.appearance} onToggle={() => toggleGroup('appearance')}>
            <p className="setting-description">
              {t('Changes apply immediately and are saved automatically.')}
            </p>

            <div className="appearance-row">
              <label htmlFor="theme-select">{t('Theme')}</label>
              <select
                id="theme-select"
                value={theme}
                onChange={(e) => handleThemeChange(e.target.value as ThemeMode)}
                className="model-dropdown"
              >
                <option value="system">{t('System')}</option>
                <option value="dark">{t('Dark')}</option>
                <option value="light">{t('Light')}</option>
                <option value="quiet">{t('Organic Light')}</option>
                <option value="heritage">{t('Heritage')}</option>
                <option value="silver">{t('Silver Screen')}</option>
              </select>
            </div>

            <div className="appearance-row">
              <label htmlFor="font-family-input">{t('Font Family')}</label>
              <input
                id="font-family-input"
                type="text"
                value={fontFamily}
                onChange={(e) => handleFontFamilyChange(e.target.value)}
                placeholder={t('Default (system font)')}
                className="proxy-url-field"
              />
            </div>

            {systemFonts.length > 0 && (
              <div className="appearance-row">
                <label htmlFor="font-family-picker">{t('Installed Fonts')}</label>
                <select
                  id="font-family-picker"
                  value=""
                  onChange={(e) => {
                    if (e.target.value) handleFontFamilyChange(e.target.value)
                  }}
                  className="model-dropdown"
                >
                  <option value="">{t('Choose a font...')}</option>
                  {systemFonts.map((name) => (
                    <option key={name} value={name}>{name}</option>
                  ))}
                </select>
              </div>
            )}

            <div className="appearance-row">
              <label htmlFor="font-size-input">{t('Font Size')}</label>
              <input
                id="font-size-input"
                type="number"
                min="8"
                max="32"
                value={fontSize}
                onChange={(e) => handleFontSizeChange(e.target.value)}
                placeholder="13"
                className="font-size-field"
              />
              <span className="appearance-unit">px</span>
            </div>

            <div className="appearance-row">
              <label htmlFor="chat-font-size-input">{t('Chat Font Size')}</label>
              <input
                id="chat-font-size-input"
                type="number"
                min="8"
                max="32"
                value={chatFontSize}
                onChange={(e) => handleChatFontSizeChange(e.target.value)}
                placeholder="13"
                className="font-size-field"
              />
              <span className="appearance-unit">px</span>
            </div>
          </SettingsGroup>

          <SettingsGroup title={t('AI Context')} open={openGroups.aiContext} onToggle={() => toggleGroup('aiContext')}>
            <p className="setting-description">
              {t('What the app sends to the AI as project context on each message. Applies immediately; changes apply on the next message.')}
            </p>

            <div className="appearance-row">
              <label htmlFor="context-mode-select">{t('Context Mode')}</label>
              <select
                id="context-mode-select"
                value={contextMode}
                onChange={(e) => handleContextModeChange(e.target.value as ContextMode)}
                className="model-dropdown"
              >
                <option value="tree">{t('File tree only (low tokens, recommended)')}</option>
                <option value="full">{t('Full file contents (expensive)')}</option>
              </select>
            </div>

            {contextMode === 'tree' && (
              <div className="appearance-row">
                <label htmlFor="context-max-files">{t('Max Files')}</label>
                <input
                  id="context-max-files"
                  type="number"
                  min="10"
                  max="20000"
                  value={contextMaxFiles}
                  onChange={(e) => handleContextMaxFilesChange(e.target.value)}
                  placeholder="2000"
                  className="font-size-field"
                />
                <span className="appearance-unit">{t('paths')}</span>
              </div>
            )}

            <div className="proxy-toggle">
              <label className="toggle-label">
                <input
                  type="checkbox"
                  checked={autoSummarize}
                  onChange={(e) => handleAutoSummarizeChange(e.target.checked)}
                />
                <span>{t('Summarize long conversations (one extra AI request per turn)')}</span>
              </label>
            </div>
          </SettingsGroup>

          <SettingsGroup title={t('Ollama (local AI)')} open={openGroups.ollama} onToggle={() => toggleGroup('ollama')}>
            <p className="setting-description">
              {t('All AI requests go to the Ollama server on this machine (localhost:11434). Nothing leaves the computer.')}
            </p>

            <div className="appearance-row">
              <label htmlFor="ollama-model">{t('Model')}</label>
              {ollamaModels.length > 0 ? (
                <select
                  id="ollama-model"
                  value={ollamaModel}
                  onChange={(e) => handleOllamaModelChange(e.target.value)}
                  className="model-dropdown"
                >
                  {!ollamaModels.includes(ollamaModel) && (
                    <option value={ollamaModel}>{ollamaModel}</option>
                  )}
                  {ollamaModels.map(m => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              ) : (
                <input
                  id="ollama-model"
                  type="text"
                  value={ollamaModel}
                  onChange={(e) => handleOllamaModelChange(e.target.value)}
                  placeholder="gemma4:e4b"
                  className="proxy-url-field"
                />
              )}
            </div>

            <div className="appearance-row">
              <label htmlFor="ollama-num-thread">{t('CPU Threads')}</label>
              <input
                id="ollama-num-thread"
                type="number"
                min="1"
                max={maxThreads || undefined}
                value={ollamaNumThread}
                onChange={(e) => handleOllamaNumThreadChange(e.target.value)}
                placeholder={maxThreads ? String(maxThreads) : ''}
                className="font-size-field"
              />
              {maxThreads > 0 && (
                <span className="appearance-unit">/ {maxThreads}</span>
              )}
            </div>
            <p className="setting-description">
              {t("Threads Ollama may use for inference. Empty = Ollama's own default (varies by version); a lower number keeps the PC responsive during generation.")}
            </p>

            <div className="appearance-row">
              <label htmlFor="ollama-num-ctx">{t('Context Size')}</label>
              <input
                id="ollama-num-ctx"
                type="number"
                min="512"
                step="1024"
                value={ollamaNumCtx}
                onChange={(e) => handleOllamaNumCtxChange(e.target.value)}
                placeholder="4096"
                className="font-size-field"
              />
            </div>
            <p className="setting-description">
              {t("Context window sent to Ollama as num_ctx. Empty = Ollama's default (4096), which agent loops can exhaust mid-reply and surface as an empty response - 8192 or more is recommended.")}
            </p>

            <div className="appearance-row">
              <label htmlFor="ollama-temperature">{t('Temperature')}</label>
              <input
                id="ollama-temperature"
                type="number"
                min="0"
                max="2"
                step="0.1"
                value={ollamaTemperature}
                onChange={(e) => handleOllamaTemperatureChange(e.target.value)}
                className="font-size-field"
              />
            </div>
            <p className="setting-description">
              {t('Sampling temperature sent to Ollama. Empty = model default (often ~1.0). Agent loops automatically use 0.2 when this is unset - measured runs showed the high default causes drift and hallucinated details. Lower = more deterministic.')}
            </p>

            <div className="appearance-row">
              <label htmlFor="ollama-think">{t('Thinking')}</label>
              <select
                id="ollama-think"
                value={ollamaThink}
                onChange={(e) => handleOllamaThinkChange(e.target.value as 'default' | 'on' | 'off' | 'low' | 'medium' | 'high')}
                className="model-dropdown"
              >
                <option value="default">{t('Model default')}</option>
                <option value="on">{t('On')}</option>
                <option value="off">{t('Off')}</option>
                <option value="low">{t('Low')}</option>
                <option value="medium">{t('Medium')}</option>
                <option value="high">{t('High')}</option>
              </select>
            </div>
            <p className="setting-description">
              {t('Force reasoning on/off, or pick an effort level, for models that support it (qwen3.5, gpt-oss, gemma4, ...). Off/Low = much faster replies on slow hardware. gpt-oss and gemma4 cannot fully disable thinking - use Low for them.')}
            </p>

            <p className="setting-description">
              {ollamaReachable === null && t('Checking Ollama...')}
              {ollamaReachable === true && `${t('Connected')} - ${ollamaModels.length} ${t('model(s) installed.')}`}
              {ollamaReachable === false && t('Cannot reach Ollama. Start it (ollama serve / tray app) and re-open Settings or change the endpoint.')}
            </p>
          </SettingsGroup>

          <SettingsGroup title={t('History')} open={openGroups.history} onToggle={() => toggleGroup('history')}>
            <p className="setting-description">
              {t('Clear the Recent Projects list (Explorer) and recently opened files (Quick Open). Projects, chats, and settings are kept.')}
            </p>
            <button
              className="clear-button"
              onClick={handleClearHistory}
            >
              {historyCleared ? `✓ ${t('Cleared')}` : t('Clear Recent History')}
            </button>
            <p className="setting-description">
              {t('Delete saved AI chat conversations for all projects. Project files and settings are kept.')}
            </p>
            {confirmClearChatHistory ? (
              <div className="setting-actions">
                <button className="clear-button" onClick={handleClearChatHistory}>
                  {t('Confirm Clear')}
                </button>
                <button className="clear-button" onClick={() => setConfirmClearChatHistory(false)}>
                  {t('Cancel')}
                </button>
              </div>
            ) : (
              <button
                className="clear-button"
                onClick={() => setConfirmClearChatHistory(true)}
              >
                {chatHistoryCleared ? `✓ ${t('Cleared')}` : t('Clear All Chat History')}
              </button>
            )}
          </SettingsGroup>
        </div>
      </div>
    </div>
  )
}

export default Settings
