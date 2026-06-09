# Super Planner 9000
A daily planner made just for me! If you don't like it you can just, like, use something else idk get off my back

## Getting Started

### Prerequisites
- Node.js 20+ recommended
- npm 10+ recommended

### Install Dependencies
```bash
npm install
```

### Run In Development
```bash
npm run dev
```

Vite will print a local URL (usually http://localhost:5173) where you can view the site in a developer context with hot reload.

### Run Development With PM2
Use PM2 when you want the dev server to stay up and auto-restart if the process crashes.
The PM2 scripts use `ecosystem.config.cjs`.

Start:
```bash
npm run pm2:start
```

Check status:
```bash
npm run pm2:status
```

View logs:
```bash
npm run pm2:logs
```

Restart, stop, or remove:
```bash
npm run pm2:restart
npm run pm2:stop
npm run pm2:delete
```

The PM2 app runs Vite with `--host 0.0.0.0 --port 5173`, so the dev server is reachable from outside localhost when needed.

### Debugging Recommendation
This is a static frontend app. In normal development, debug app behavior in the browser (DevTools or VS Code browser debugging), not by attaching to PM2.

PM2 is mainly used here to keep the Vite dev server running and auto-restart it if needed.

To restore PM2 processes after reboot on your machine:
```bash
pm2 save
pm2 startup
```

### Production Build Check
```bash
npm run build
npm run preview
```

Use preview to verify the static production output locally before hosting.

### Run Linting
```bash
npm run lint
```

To apply auto-fixable lint changes:

```bash
npm run lint:fix
```

### Run Unit Tests
```bash
npm test
```

For watch mode while developing tests:

```bash
npm run test:watch
```

