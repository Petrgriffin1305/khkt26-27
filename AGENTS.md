This repository contains Viễn Du: a React DOM + Vite web application, an
Electron desktop package, and a Fastify API. Use npm and Node.js >=22.13.

## Layout and commands

- `src/main.tsx` mounts `src/adventure/AdventureApp.tsx` directly.
- `src/adventure/` owns the UI, journey, focus rules, browser navigation, and local state.
- `src/services/` owns browser credentials, shared contracts, and API access.
- `backend/` owns authentication, quizzes, groups, storage, and the API.
- `desktop/` packages the same `dist/` web build into Electron.
- `npm start`, `npm run dev`, or `npm run web`: open Viễn Du at localhost:8084.
- `npm run lint`, `npm run typecheck`, `npm run test:web`: frontend checks.
- `npm run build:web`: production web build, PDF worker, and offline shell.
- `npm --prefix backend run dev:local`: local API + database.
- `npm --prefix desktop start`: Electron after building the web application.

Run lint and typecheck before declaring code changes complete. Use official,
current documentation before changing Vite, React, or Electron APIs.

## Invariants

Preserve owner-scoped local storage and the exclusive Web Lock. URL navigation
must keep the active workspace mounted and classify time away from focus.
Keep credential writes and account changes generation-safe. Private keys belong
in backend configuration; `VITE_API_URL` is public and embedded at build time.
Keep the same-origin PDF worker, offline shell, desktop API-origin configuration,
and sandboxed `viendu://app/` protocol working together.
