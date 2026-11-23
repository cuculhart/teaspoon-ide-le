// Plan-file driven mode helpers (v1.3.0, backlog L2/L3/L5).
// Pure functions only - kept dependency-free so e2e tests can bundle
// them with esbuild (same convention as toolFeedback.ts).
//
// A "plan file" is an ordinary markdown file (develop-plan.md, *-plan.md,
// TODO.md) the model reads/writes with the normal file commands. The
// harness never edits it - it only (a) injects a compact digest of the
// open items into every agent turn, (b) cross-checks "- [x]" completions
// against verified file changes, and (c) detects phase transitions so
// the user can approve them.

// Basenames treated as plan files: todo.md / plan.md / *-plan.md /
// *_plan.md (case-insensitive). Matches both basenames and full paths.
export function isPlanFileName(name: string): boolean {
  const base = name.replace(/\\/g, '/').split('/').pop()!.toLowerCase()
  return base === 'todo.md' || base === 'plan.md'
    || base.endsWith('-plan.md') || base.endsWith('_plan.md')
}

export interface PlanItem {
  // Item body after the checkbox, trimmed ("2.1 spawnStone() を実装").
  text: string
  checked: boolean
  // List indent depth; 0 = top-level entry.
  depth: number
  // Nearest preceding markdown heading, if any.
  heading: string | null
}

const HEADING_RE = /^\s{0,3}#{1,6}\s+(.+?)\s*#*\s*$/
const CHECK_RE = /^(\s*)[-*+]\s+\[( |x|X)\]\s+(.*)$/

export function parsePlanItems(content: string): PlanItem[] {
  const items: PlanItem[] = []
  let heading: string | null = null
  for (const line of content.split('\n')) {
    const h = HEADING_RE.exec(line)
    if (h) { heading = h[1].trim(); continue }
    const m = CHECK_RE.exec(line)
    if (!m) continue
    items.push({
      text: m[3].trim(),
      checked: m[2].toLowerCase() === 'x',
      depth: Math.floor(m[1].replace(/\t/g, '  ').length / 2),
      heading,
    })
  }
  return items
}

// Item text minus its leading numbering ("2.1", "1)", "3.") so a
// renumbered or reformatted entry still matches its earlier self.
export function normPlanItemText(text: string): string {
  return text
    .replace(/^\s*\d+(?:\.\d+)*[.)、]?\s*/, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase()
}

export interface PlanPhase {
  // Top-level item text (numbered plans) or heading text (heading plans).
  title: string
  items: PlanItem[]
}

// Group items into phases. Numbered plans keep one depth-0 item per
// phase (its nested items belong to it); plans without depth-0 checkbox
// items fall back to one phase per heading. A leading block of items
// before the first phase anchor is its own unnamed phase.
export function planPhases(items: PlanItem[]): PlanPhase[] {
  if (items.length === 0) return []
  const phases: PlanPhase[] = []
  if (items.some(i => i.depth === 0)) {
    let cur: PlanPhase | null = null
    for (const it of items) {
      if (it.depth === 0) {
        cur = { title: it.text, items: [it] }
        phases.push(cur)
      } else {
        if (!cur) { cur = { title: '', items: [] }; phases.push(cur) }
        cur.items.push(it)
      }
    }
  } else {
    let cur: PlanPhase | null = null
    for (const it of items) {
      if (!cur || cur.title !== (it.heading ?? '')) {
        cur = { title: it.heading ?? '', items: [] }
        phases.push(cur)
      }
      cur.items.push(it)
    }
  }
  return phases
}

const phaseDone = (p: PlanPhase) =>
  p.items.length > 0 && p.items.every(i => i.checked)
const phaseOpen = (p: PlanPhase) => p.items.some(i => !i.checked)

// A phase transition worth a user gate: a phase that still had open
// items is now fully checked AND a later phase still has open items.
// Returns the titles for the approval prompt; null when no transition
// (or when the whole plan just finished - nothing left to gate on).
export function justCompletedPhase(
  oldContent: string,
  newContent: string,
): { done: string; next: string } | null {
  const oldPhases = planPhases(parsePlanItems(oldContent))
  const newPhases = planPhases(parsePlanItems(newContent))
  for (let i = 0; i < newPhases.length; i++) {
    const np = newPhases[i]
    const op = oldPhases.find(p => p.title === np.title)
    if (!op) continue
    if (!phaseDone(op) && phaseDone(np)) {
      const next = newPhases.slice(i + 1).find(phaseOpen)
      if (next) return { done: np.title, next: next.title }
    }
  }
  return null
}

// Items that flipped "- [ ]" -> "- [x]" between two versions of the
// plan. Matched by normalized text so renumbering does not lose them;
// duplicates settle positionally via the delete-once multiset.
export function newlyCheckedItems(
  oldContent: string,
  newContent: string,
): PlanItem[] {
  const open = new Map<string, PlanItem>()
  for (const it of parsePlanItems(oldContent)) {
    if (!it.checked) open.set(normPlanItemText(it.text), it)
  }
  const out: PlanItem[] = []
  for (const it of parsePlanItems(newContent)) {
    if (it.checked && open.delete(normPlanItemText(it.text))) out.push(it)
  }
  return out
}

// File references a plan item mentions ("fix script.js", "update
// src/util/helper.ts"). Used to tie a completion mark to a verified
// change on disk - deliberately coarse: basename or relative path.
export function itemFileRefs(text: string): string[] {
  const refs = new Set<string>()
  const re = /[\w./\\-]+\.(?:jsx?|tsx?|mjs|cjs|json|html?|css|py|md|txt|rs|go|java|c|cc|cpp|h|hpp|cs|rb|php|yml|yaml|toml|xml|sh|bat|ps1|sql|vue|svelte)/gi
  for (const m of text.matchAll(re)) refs.add(m[0].replace(/\\/g, '/'))
  return [...refs]
}

// True when `ref` (from a plan item) points at `relPath` (a file the
// harness verified a change on, relative to the project root). Match is
// suffix-based so "script.js" matches "src/script.js".
export function refMatchesPath(ref: string, relPath: string): boolean {
  const r = ref.replace(/\\/g, '/').replace(/^\.?\//, '').toLowerCase()
  const p = relPath.replace(/\\/g, '/').toLowerCase()
  return p === r || p.endsWith('/' + r)
}

// Compact "current position" section injected into every agent turn:
// headings plus OPEN items only - completed items collapse to a count.
// The point is a few hundred tokens, not the full plan: huge plans fall
// back to per-heading open counts.
export function formatPlanDigest(
  relPath: string,
  content: string,
  maxChars = 1200,
): string {
  const items = parsePlanItems(content)
  if (items.length === 0) return ''
  const done = items.filter(i => i.checked).length
  const header = `[PLAN] ${relPath} - ${done} of ${items.length} items done. Open items:`
  const lines: string[] = [header]
  let lastHeading: string | null = null
  let emitted = 0
  for (const it of items) {
    if (it.checked) continue
    if (it.heading && it.heading !== lastHeading) {
      lines.push(`## ${it.heading}`)
      lastHeading = it.heading
    }
    const text = it.text.length > 100 ? it.text.slice(0, 97) + '...' : it.text
    lines.push(`${'  '.repeat(Math.min(it.depth, 3))}- [ ] ${text}`)
    emitted++
  }
  let body = lines.join('\n')
  if (body.length <= maxChars || emitted === 0) return body + '\n'
  // Over budget: collapse to per-heading open counts.
  const groups = planPhases(items)
    .filter(phaseOpen)
    .map(p => `${p.title || '(no heading)'}: ${p.items.filter(i => !i.checked).length} open`)
  body = `${header}\n${groups.join('; ')}\n(plan too large for full digest - emit "// READ_FILE: ${relPath}" for details)`
  return body + '\n'
}
