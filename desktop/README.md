# Viễn Du Desktop

Viễn Du Desktop is the Electron build of the same Vite web app served in a browser. It packages the root `dist/` output and opens it through the `viendu://app` protocol.

## Run the browser app

From the repository root, `npm start` serves Viễn Du at `http://localhost:8084` and requires that exact port. `npm run dev` and `npm run web` are equivalent commands. Keep the terminal open while the server runs.

## Preview the production web build

The preview server also uses strict port 8084, so stop any running development server first.

```bash
npm run build:web
npm run preview
```

## Build the Windows app

Run these commands from the repository root:

```bash
npm ci
npm run build:web
npm --prefix desktop ci
npm --prefix desktop run package:win
```

The Windows installer is written to `desktop/release/`. Set `VITE_API_URL` in the root `.env` or build environment when the packaged app should connect to an online API.

To launch the Electron app locally after building the web bundle and installing desktop dependencies, run this separately. It stays open until you close the app:

```bash
npm --prefix desktop start
```

See [web and Windows operations](../docs/WEB_DESKTOP.md) for deployment, backend setup, and release details.
