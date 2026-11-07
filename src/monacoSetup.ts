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

// Muted Ocean editor theme - deep-sea palette in index.css ([data-theme='ocean'])

// Ancient Console editor theme - green-phosphor palette ([data-theme='console'])

// Walnut editor theme - dark wood with silvery nail-bright text
// ([data-theme='walnut'])

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

// Rich Wine editor theme - wine-dark bg, silvery text, copper keywords
// and golds; mauve functions keep red out of the code ([data-theme='wine'])

// Violet Fizz editor theme - violet-cocktail bg, neon-blue keywords,
// moon-yellow strings ([data-theme='fizz'])

// Otegami editor theme - washi paper, soot-ink text, vermilion accents
// ([data-theme='otegami'])

// Soda Float editor theme - mid sky-blue soda with ink text and pale
// foam colors ([data-theme='float'])

// Modern Syntax eXtensible (MSX) editor theme - saturated MSX-blue with
// white text and modernized 16-color brights ([data-theme='msx'])

// Chaya editor theme - tea-field green, new-leaf keywords, jade
// functions, plum-blossom numbers ([data-theme='chaya'])

// Coquette editor theme - pale blush, plum-chocolate text, satin-rose
// keywords ([data-theme='coquette'])

// Silver Screen editor theme - mid-gray #555 screen, achromatic tokens:
// ink keywords (bold) and chalk-white functions separate by luminance
// and weight instead of hue ([data-theme='silver'])
monaco.editor.defineTheme('teaspoon-silver', {
  base: 'vs-dark',
  inherit: true,
  rules: [
    { token: 'keyword', foreground: '161616', fontStyle: 'bold' },
    { token: 'string', foreground: 'd0d0d0' },
    { token: 'number', foreground: '2a2a2a' },
    { token: 'comment', foreground: '8a8a8a', fontStyle: 'italic' },
    { token: 'type', foreground: 'b0b0b0' },
    { token: 'identifier.function', foreground: 'ffffff' },
  ],
  colors: {
    'editor.background': '#555555',
    'editor.foreground': '#e6e6e6',
    'editorLineNumber.foreground': '#9a9a9a',
    'editorLineNumber.activeForeground': '#c8c8c8',
    'editor.lineHighlightBackground': '#4c4c4c',
    'editor.selectionBackground': '#636363',
    'editor.inactiveSelectionBackground': '#4a4a4a',
    'editorCursor.foreground': '#e6e6e6',
    'editorWhitespace.foreground': '#6e6e6e',
    'editorWidget.background': '#4a4a4a',
    'editorWidget.border': '#6e6e6e',
    'minimap.background': '#4a4a4a',
    'diffEditor.insertedTextBackground': '#8a9a7a33',
    'diffEditor.removedTextBackground': '#b87a6a33',
  },
})

// Resolved app theme -> Monaco theme name. Custom themes are registered
// above; light/dark fall back to Monaco's built-ins.
export const MONACO_THEME: Record<string, string> = {
  dark: 'vs-dark',
  light: 'vs',
  quiet: 'teaspoon-quiet',
  heritage: 'teaspoon-heritage',
  silver: 'teaspoon-silver',
}
