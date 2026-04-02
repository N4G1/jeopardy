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
- `npm run preview` previews the frontend build
- `npm run test` runs Vitest
- `npm run typecheck` runs TypeScript checks for the frontend and server
- `npm run lint` runs Oxlint
- `npm run format` formats supported files with Oxfmt
- `npm run format:check` checks formatting without writing

## Current MVP Flow

1. Run `npm run dev`.
2. Open the host screen at `http://<your-ip>:5173/#/`.
3. Build the board, then start the session.
4. Share the join link shown on the host screen with players.
5. Players open the join route, enter a display name, and continue to the player screen.
6. The host opens a clue, players buzz with the button or the spacebar, and the host marks the answer correct or incorrect.

## Commit Hooks

Pre-commit hooks run:

- `npm run format`
- `npm run lint`

This means formatting and linting run before each commit once Husky is active on your machine.

## Current MVP Limits

- The game session is stored in memory only.
- There is only one active session at a time.
- Player identity is just a temporary display name.
- Image support currently uses in-browser data URLs for simplicity.
- Audio, video, timers, and persistence are not implemented yet.
