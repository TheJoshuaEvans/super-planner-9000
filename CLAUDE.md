# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

- `npm run dev` — start the Vite dev server (hot reload).
- `npm run build` — type-check (`tsc -b`) then build for production.
- `npm run preview` — serve the production build locally.
- `npm run lint` / `npm run lint:fix` — ESLint (flat config, typescript-eslint + react-hooks + react-refresh).
- `npm test` — run all unit tests once (Vitest, node environment).
- `npm run test -- path/to/file.test.ts` — run a single test file.
- `npm run test -- path/to/file.test.ts -t "test name"` — run a single test by name.
- `npm run check` — runs lint, test, and build; this is the same gate as CI (`.github/workflows/check.yml`) and should pass before handing off code.

Always confirm you're in the project directory before running these.

## Project Specs (readme/SPEC.md)

This is a personal daily-planner app, not a commercial product:

- Must work on both mobile and desktop, but **landscape-mode only** (no need to support screens taller than wide).
- All user data is persisted to **localStorage** as simple JSON — no backend.
- Must remain deployable as a static site (GitHub Pages).
- Favor simple implementations, DRY code, separation of concerns, and splitting code into focused files.
- All non-boilerplate functions get a concise JSDoc comment (inputs/outputs/side-effects).
- Functionality should be isolated into testable pure functions with unit tests.
- Colorblind accessibility must be fully supported.

## Architecture

### Stack
React 19 + TypeScript + Vite, Zustand for state, Tailwind + CSS variables for styling, Vitest for tests.

### Layered structure
- `src/store/*Store.ts` — Zustand stores (the only place `create`/`persist` live). Each store has a paired `*.types.ts` file for its public state/action types, and persists to localStorage under an `sp9000-*` key.
- `src/store/*Data.ts` / `*History.ts` — store-internal helper modules (cloning, equality, history wiring) kept separate from the store definition itself.
- `src/lib/*.ts` — pure, framework-free logic (formatting, validation, data transforms) used by stores and components. This is where most unit tests live (`*.test.ts` co-located with the source file).
- `src/components/<Feature>/<Feature>.tsx` — one folder per feature/component; components read state via Zustand selector hooks (`usePlannerStore((s) => s.x)`) and call store actions directly.
- `src/hooks/` — shared React hooks (e.g. keyboard shortcuts, clock ticks), each with a co-located test.

### Stores
- **`plannerStore`** (`sp9000-planner-state`): day-planner categories and per-date timeline segments (`segmentsByDate`, keyed by `YYYY-MM-DD`). Wraps edits in undo/redo history (`plannerStoreHistory.ts` + generic `lib/plannerHistory.ts`, capped at `DEFAULT_HISTORY_LIMIT`). Time is modeled as quarter-hour "slots" (`lib/timeline.ts`: `TOTAL_DAY_SLOTS = 96`).
- **`mealStore`** (`sp9000-meal-state`): meal "components" (ingredients) and "meals" (named groups of components with quantities), managed via `lib/mealData.ts`.
- **`toastStore`**: transient UI notifications shown via `ToastViewport`.
- **`mealCreatorFormStore`**: persisted form state for the in-progress Meal Creator UI.

### Cross-store import/export
`lib/plannerDataIO.ts` defines a versioned export envelope (`PLANNER_DATA_EXPORT_VERSION`) bundling planner + meal data, with full runtime validation on import (`parsePlannerDataImport`). Bump the version and update both the export builder and the validators together when the persisted shape changes.

### Tabs
`lib/appTabs.ts` is the single source of truth for top-level app tabs (`APP_TABS`). Adding a tab means adding an entry there and handling its `contentKind` in the branch in `App.tsx`.

### Styling
CSS variables in `src/index.css` define color/spacing/radius/shadow tokens; `tailwind.config.ts` maps Tailwind theme keys (`app.*`, spacing scale, etc.) onto those variables. See `readme/STYLING_PLAYBOOK.md` for the allowed spacing/typography scale and component patterns — update it as new patterns are introduced.

### Testing
Vitest runs in a `node` environment with a localStorage polyfill (`src/test/setup.ts`), so Zustand `persist` stores work in tests without a DOM.
