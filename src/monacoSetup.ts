// Bundle Monaco locally instead of loading it from cdn.jsdelivr.net.
// @monaco-editor/react's loader would otherwise fetch it from the CDN,
// which breaks offline use and widens the CSP.
import * as monaco from 'monaco-editor'
import { loader } from '@monaco-editor/react'
// monaco-editor >=0.52 exports map "."/* to ./esm/vs/*.js, so drop the
// esm/vs prefix from worker paths.
import editorWorker from 'monaco-editor/editor/editor.worker?worker'
import tsWorker from 'monaco-editor/language/typescript/ts.worker?worker'
import jsonWorker from 'monaco-editor/language/json/json.worker.js?worker'
import cssWorker from 'monaco-editor/language/css/css.worker?worker'
import htmlWorker from 'monaco-editor/language/html/html.worker?worker'

self.MonacoEnvironment = {
  getWorker(_workerId: string, label: string) {
    switch (label) {
      case 'typescript':
      case 'javascript':
        return new tsWorker()
      case 'json':
        return new jsonWorker()
      case 'css':
      case 'scss':
      case 'less':
        return new cssWorker()
      case 'html':
      case 'handlebars':
      case 'razor':
        return new htmlWorker()
      default:
        return new editorWorker()
    }
  },
}

loader.config({ monaco })

// Organic Light editor theme - matches the muted warm-paper UI palette in
// index.css ([data-theme='quiet'])
monaco.editor.defineTheme('teaspoon-quiet', {
  base: 'vs',
  inherit: true,
  rules: [],
  colors: {
    'editor.background': '#f7f3ea',
    'editor.foreground': '#4a463c',
    'editorLineNumber.foreground': '#a29a86',
    'editorLineNumber.activeForeground': '#6f695a',
    'editor.lineHighlightBackground': '#ede7d6',
    'editor.selectionBackground': '#d5e0d8',
    'editor.inactiveSelectionBackground': '#e2ddcd',
    'editorCursor.foreground': '#4a463c',
    'editorWhitespace.foreground': '#d9cfba',
    'editorWidget.background': '#efe9dc',
    'editorWidget.border': '#d9cfba',
    'minimap.background': '#f5f1e8',
    'diffEditor.insertedTextBackground': '#4e8a5533',
    'diffEditor.removedTextBackground': '#b3504033',
  },
})

// Heritage editor theme - pale woodgrain, reddish-black groove text
// ([data-theme='heritage'])
monaco.editor.defineTheme('teaspoon-heritage', {
  base: 'vs',
  inherit: true,
  rules: [
    { token: 'keyword', foreground: '7a4a2b' },
    { token: 'string', foreground: '6b5a34' },
    { token: 'number', foreground: '8a5a3a' },
    { token: 'comment', foreground: '8a7a66', fontStyle: 'italic' },
    { token: 'type', foreground: '4f3d2c' },
    { token: 'identifier.function', foreground: '5a4632' },
  ],
  colors: {
    'editor.background': '#e6d7bd',
    'editor.foreground': '#2b1d17',
    'editorLineNumber.foreground': '#a3937d',
    'editorLineNumber.activeForeground': '#8a7a66',
    'editor.lineHighlightBackground': '#dccdb0',
    'editor.selectionBackground': '#cdbb97',
    'editor.inactiveSelectionBackground': '#d6c7a9',
    'editorCursor.foreground': '#2b1d17',
    'editorWhitespace.foreground': '#b8a486',
    'editorWidget.background': '#dccdb0',
    'editorWidget.border': '#b8a486',
    'minimap.background': '#dccdb0',
    'diffEditor.insertedTextBackground': '#4e7a4533',
    'diffEditor.removedTextBackground': '#a0453533',
  },
})

// Ancient Console editor theme - green-phosphor palette
// ([data-theme='console'])
monaco.editor.defineTheme('teaspoon-console', {
  base: 'vs-dark',
  inherit: true,
  rules: [
    { token: 'keyword', foreground: 'b0cf9e' },
    { token: 'string', foreground: 'c9b98a' },
    { token: 'number', foreground: 'd0a878' },
    { token: 'comment', foreground: '57745a', fontStyle: 'italic' },
    { token: 'type', foreground: '8fbf9f' },
    { token: 'identifier.function', foreground: 'a3c9a8' },
  ],
  colors: {
    'editor.background': '#0c2214',
    'editor.foreground': '#93b494',
    'editorLineNumber.foreground': '#47614a',
    'editorLineNumber.activeForeground': '#57745a',
    'editor.lineHighlightBackground': '#16301d',
    'editor.selectionBackground': '#1f4228',
    'editor.inactiveSelectionBackground': '#14301c',
    'editorCursor.foreground': '#93b494',
    'editorWhitespace.foreground': '#1e3823',
    'editorWidget.background': '#0d1a10',
    'editorWidget.border': '#1e3823',
    'minimap.background': '#0d1a10',
    'diffEditor.insertedTextBackground': '#7fae7233',
    'diffEditor.removedTextBackground': '#d08a6a33',
  },
})

// Resolved app theme -> Monaco theme name. Custom themes are registered
// above; light/dark fall back to Monaco's built-ins.
export const MONACO_THEME: Record<string, string> = {
  dark: 'vs-dark',
  light: 'vs',
  quiet: 'teaspoon-quiet',
  heritage: 'teaspoon-heritage',
  console: 'teaspoon-console',
}
