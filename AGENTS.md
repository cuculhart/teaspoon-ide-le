# Project conventions

Teaspoon IDE Local Edition - a Japanese-only, offline/local-only fork of
teaspoon-ide. The only AI backend is Ollama on `localhost:11434`.

## Writing

- `CHANGELOG.md` and `readme.md` are Japanese. There is no separate
  `README.ja.md` - `readme.md` is the single documentation file.

## Verification

- `npx tsc --noEmit -p .` — type check
- `npm run build:vite` — production build (large-chunk warning is expected)
