# Jeopardy

A Jeopardy game built with TypeScript, Vite, Svelte 5, and a small Node WebSocket server.

## Requirements

- Node `24.13.0`
- npm

## Scripts

- `npm run dev` starts the Vite client and the Node server together
- `npm run dev:client` starts only the Vite client
- `npm run dev:server` starts only the Node server
- `npm run build` builds the frontend and compiles the server
- `npm run build:client` builds only the frontend
- `npm run build:server` compiles only the server
- `npm run build:pages` builds the GitHub Pages frontend bundle and adds the `404.html` SPA fallback
- `npm run preview` previews the frontend build
- `npm run test` runs Vitest
- `npm run typecheck` runs TypeScript checks for the frontend and server
- `npm run lint` runs Oxlint
- `npm run format` formats supported files with Oxfmt
- `npm run format:check` checks formatting without writing

## Local Flow

1. Run `npm run dev`.
2. Open the host screen at `http://<your-ip>:5173/`.
3. Build the board, choose `LAN` or `Internet`, and create the lobby.
4. Share the join link shown on the host screen with players.
5. Players open the join route, enter a display name, and continue to the lobby.
6. The host opens a clue, players buzz with the button or the spacebar, and the host marks the answer correct, incorrect, or rebound.

## Board Memory

- The editor autosaves the current draft in IndexedDB.
- Refreshing the page restores the latest draft automatically.
- Boards can be saved to a local browser library, loaded again later, deleted, exported to JSON, and imported back from JSON.

## Environment Variables

- `VITE_PUBLIC_SERVER_URL`
  Used by the frontend when the host chooses `Internet` mode. Set this to the public Render backend URL, for example `https://jeopardy-server.onrender.com`.

## GitHub Pages Deployment

1. Enable GitHub Pages for this repository and choose GitHub Actions as the source.
2. Add a repository variable named `VITE_PUBLIC_SERVER_URL` that points at the deployed Render backend.
3. Push to `master`.
4. The workflow in `.github/workflows/deploy-pages.yml` will run tests, typecheck, lint, build the Pages bundle, and deploy `dist/`.

Notes:

- `npm run build:pages` uses the `/jeopardy/` base path.
- It also copies `dist/index.html` to `dist/404.html` so clean routes like `/jeopardy/join` and `/jeopardy/player` keep working on GitHub Pages.
- If the repository name changes, update the hardcoded `/jeopardy/` base path in `package.json`.

## Render Deployment

1. Create a new Render Blueprint or Web Service from this repository.
2. Use `render.yaml` or copy its values into the Render dashboard.
3. Render builds the server with `npm run build:server`.
4. Render starts the WebSocket server with `node dist-server/server/index.js`.

Notes:

- The server now reads `PORT` from the environment, which Render injects automatically.
- The health endpoint is `/health`.

## Commit Hooks

Pre-commit hooks run:

- `npm run format`
- `npm run lint`

This means formatting and linting run before each commit once Husky is active on your machine.

## Current Limits

- The live game session is still stored in memory only on the backend.
- There is only one active session at a time.
- Player identity is just a temporary display name.
- Image support currently uses in-browser data URLs for simplicity.
- Audio, video, and timers are still not implemented.
