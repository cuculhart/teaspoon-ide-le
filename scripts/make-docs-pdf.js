// Generates docs/*.pdf from docs/*.md using Electron's printToPDF.
// Run: npm run docs:pdf   (i.e. electron scripts/make-docs-pdf.js)
// Requires `npm install` first (marked + electron).

const { app, BrowserWindow } = require('electron')
const path = require('path')
const fs = require('fs')

const marked = require('marked')
const parseMd = typeof marked.parse === 'function' ? marked.parse.bind(marked) : marked

const ROOT = path.resolve(__dirname, '..')
const DOCS = ['manual', 'hands-on']

const CSS = `
  @page { size: A4; margin: 18mm 16mm; }
  body {
    font-family: "Noto Sans JP", "Yu Gothic", "Meiryo", sans-serif;
    font-size: 10.5pt; line-height: 1.7; color: #222;
    max-width: 100%;
  }
  h1 { font-size: 20pt; border-bottom: 2px solid #444; padding-bottom: 6px; }
  h2 { font-size: 15pt; border-bottom: 1px solid #ccc; padding-bottom: 4px; margin-top: 1.6em; }
  h3 { font-size: 12.5pt; margin-top: 1.4em; }
  table { border-collapse: collapse; width: 100%; margin: 0.8em 0; font-size: 9.5pt; }
  th, td { border: 1px solid #bbb; padding: 5px 8px; text-align: left; vertical-align: top; }
  th { background: #f0f0f0; }
  code { background: #f4f4f4; padding: 1px 4px; border-radius: 3px; font-size: 9pt; }
  pre { background: #f6f6f6; border: 1px solid #ddd; border-radius: 4px;
        padding: 10px 12px; overflow-x: auto; font-size: 9pt; line-height: 1.5; }
  pre code { background: none; padding: 0; }
  blockquote { border-left: 4px solid #ccc; margin: 0.8em 0; padding: 4px 12px;
               color: #555; background: #fafafa; }
  hr { border: none; border-top: 1px solid #ddd; margin: 1.6em 0; }
  ul, ol { padding-left: 1.6em; }
`

function pageHtml(title, bodyHtml) {
  return `<!DOCTYPE html><html lang="ja"><head><meta charset="utf-8">
<title>${title}</title><style>${CSS}</style></head>
<body>${bodyHtml}</body></html>`
}

app.whenReady().then(async () => {
  const win = new BrowserWindow({
    show: false,
    webPreferences: { sandbox: true },
  })
  try {
    for (const name of DOCS) {
      const mdPath = path.join(DOCS_DIR(), `${name}.md`)
      const md = fs.readFileSync(mdPath, 'utf-8')
      const body = await parseMd(md, { gfm: true, breaks: false })
      const html = pageHtml(`Teaspoon LE - ${name}`, body)
      const tmp = path.join(app.getPath('temp'), `teaspoon-doc-${name}.html`)
      fs.writeFileSync(tmp, html, 'utf-8')
      await win.loadFile(tmp)
      // Let web fonts/layout settle before printing.
      await new Promise((r) => setTimeout(r, 300))
      const pdf = await win.webContents.printToPDF({
        printBackground: true,
        pageSize: 'A4',
        margins: { marginType: 'custom', top: 0, bottom: 0, left: 0, right: 0 },
      })
      const out = path.join(DOCS_DIR(), `${name}.pdf`)
      fs.writeFileSync(out, pdf)
      console.log(`wrote ${out} (${(pdf.length / 1024).toFixed(0)} KB)`)
    }
  } finally {
    win.destroy()
    app.quit()
  }
})

function DOCS_DIR() {
  return path.join(ROOT, 'docs')
}
