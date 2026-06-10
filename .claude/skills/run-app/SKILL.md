---
name: run-app
description: Launch and drive Super Planner 9000 in a headless browser to verify UI changes. Use when asked to start the app, take a screenshot of it, or check that a UI change renders/behaves correctly.
---

Super Planner 9000 is a Vite + React app. For agent/automated use, drive it
via the Playwright REPL at `.claude/skills/run-app/driver.mjs` against the
running dev server.

All paths below are relative to the repo root
(`/root/dev/tje/super-planner-9000`).

## Prerequisites

Dev server must be running (it usually already is, via PM2):

```bash
npm run pm2 -- status   # check; "online" means it's already up
npm run pm2 -- start    # if not running
```

Playwright + Chromium must be installed (one-time):

```bash
npm install -D playwright
npx playwright install chromium
```

## Run (agent path)

```bash
tmux new-session -d -s app -x 200 -y 50
tmux send-keys -t app 'node /root/dev/tje/super-planner-9000/.claude/skills/run-app/driver.mjs' Enter
timeout 15 bash -c 'until tmux capture-pane -t app -p | grep -q "driver>"; do sleep 0.2; done'
tmux send-keys -t app 'launch' Enter
timeout 30 bash -c 'until tmux capture-pane -t app -p | tail -3 | grep -q launched; do sleep 0.5; done'
tmux send-keys -t app 'nav' Enter
tmux send-keys -t app 'wait-for text=Super Planner 9000' Enter
tmux send-keys -t app 'screenshot 01-landing' Enter
tmux capture-pane -t app -p
```

Then view `/tmp/shots/01-landing.png` (override location with
`SCREENSHOT_DIR`). **Always look at the screenshot** — a blank/dark frame
usually means the page didn't finish loading.

When done: `tmux send-keys -t app 'quit' Enter && tmux kill-session -t app`.

### Commands

| command | what it does |
|---|---|
| `launch` | start headless Chromium |
| `nav [url]` | go to `$APP_URL` (default `http://localhost:5173/super-planner-9000/`) or a given url |
| `wait-for <css-sel>` / `wait-for text=<text>` | wait up to 10s for an element/text |
| `screenshot [name]` | full-page screenshot → `/tmp/shots/<name>.png` |
| `screenshot-element <sel> [name]` | crop screenshot to one element |
| `click <sel>` | click first match |
| `click-text <text>` | click first button/link/etc. containing text |
| `fill <sel> <value>` | fill an input/textarea |
| `type <text>` / `press <key>` | keyboard input |
| `text [sel]` | print `innerText` (defaults to `document.body`) |
| `eval <js-expr>` | evaluate JS in the page, print JSON result |
| `console` / `console --errors` | print captured console messages, optionally errors only |
| `quit` | close the browser |

## Run (human path)

```bash
npm run dev   # or it's already up under PM2 — see above
```
Then open `http://localhost:5173/super-planner-9000/` in a real browser.

## Gotchas

- **tmux sessions start in `~`, not the repo.** Use the absolute path to
  `driver.mjs` (as in the run command above) — a relative path fails with
  `MODULE_NOT_FOUND`.
- **Fresh browser = empty localStorage.** Each `launch` is a clean Chromium
  profile, so the planner/meal stores start empty (no categories beyond
  defaults, no saved meals). That's expected — it's not the same data as the
  user's real browser. Use `eval` to seed `localStorage` directly if a test
  needs existing data.
- **React controlled inputs**: use `fill`/`type`, not `eval`-based
  `el.value = ...` (won't fire React's onChange).
- This app is **landscape-only** — the default 200x50 character tmux window
  maps to a wide viewport, which matches the supported layout.
