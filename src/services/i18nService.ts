import { useSyncExternalStore } from 'react'

// Simple i18n: language files live in <resources>/lang (packaged) or
// <projectRoot>/lang (dev) as <code>.json mapping English source -> localized.
// English is the source language, so 'en' needs no file.
// Local Edition is Japanese-only: the language is fixed to 'ja' and the
// picker is gone - this service only loads the dictionary.
const EVENT = 'teaspoon:language-changed'
const FIXED_LANGUAGE = 'ja'

class I18nService {
  private dict: Record<string, string> = {}
  private code = FIXED_LANGUAGE

  get language(): string {
    return this.code
  }

  // English key -> localized string (falls back to the key itself)
  t(key: string): string {
    return this.dict[key] ?? key
  }

  // Language is fixed to Japanese - the argument is ignored so stale
  // call sites (setLanguage IPC, Settings leftovers) stay harmless.
  async setLanguage(_code?: string): Promise<void> {
    this.code = FIXED_LANGUAGE
    window.electronAPI?.setLanguage?.(FIXED_LANGUAGE)
    const result = await window.electronAPI?.loadLanguage?.(FIXED_LANGUAGE)
    this.dict = result?.success && result.dict ? result.dict : {}
    window.dispatchEvent(new Event(EVENT))
  }

  async init(): Promise<void> {
    await this.setLanguage(FIXED_LANGUAGE)
  }

  subscribe(cb: () => void): () => void {
    window.addEventListener(EVENT, cb)
    return () => window.removeEventListener(EVENT, cb)
  }
}

export const i18nService = new I18nService()

// React hook: re-renders the component when the language changes
export function useT(): (key: string) => string {
  useSyncExternalStore(
    (cb) => i18nService.subscribe(cb),
    () => i18nService.language,
  )
  return (key: string) => i18nService.t(key)
}
