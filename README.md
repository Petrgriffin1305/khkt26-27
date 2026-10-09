# Viễn Du

Viễn Du is a web learning adventure with a cartoon 3D train journey, personal progress, asynchronous study groups, a journal, and optional quizzes. The browser app is the primary experience; Electron packages the same web app for Windows.

## Run locally

Use Node.js 24 LTS and npm 11, matching GitHub Actions. npm 10 may reject the lockfile while resolving peer dependencies.

```bash
npm ci
npm --prefix backend ci
npm --prefix backend run db:generate
npm start
```

`npm start` starts the local API/database and the web app at `http://localhost:8084` together. `npm run dev` and `npm run web` do the same thing. Healthy existing Viễn Du services are reused; occupied unrelated ports produce an actionable error. Keep the terminal open while the server runs. Guest mode works offline. Create a backend account to try sync, groups, and AI questions. To generate quizzes from documents with AI, set `GEMINI_API_KEY` in `backend/.env` and restart the backend; the key stays on the server. Documents are read on the device, and only extracted text is sent when choosing an AI quiz.

Each departure is counted once as a distraction; returning resumes immediately. **Lịch sử chuyến đi** automatically shows every saved trip, including trips ended early, with a unique anonymous trip code, start/end times, a short goal summary, duration, distraction count, device category, and the server-graded question score. The category (PC, iOS, Android, iPad/Tablet, or unknown) is captured at trip start and preserved through offline storage and synchronization; older trips display **Chưa ghi nhận**. Raw browser identifiers are not stored. Account trips appear after synchronization; guest trips upload automatically when connected, keeping their local progress separate. Emails, account identifiers, and study documents are not published. CSV exports the latest 10,000 trips for experiments.

## Scanned documents and exploration

Import scanned PDFs or PNG/JPG/WebP/BMP images to recognize Vietnamese and English text with local OCR. Selectable PDF text is preserved; pages with little usable text are recognized individually. OCR workers, language data, and WebAssembly are bundled with the app and served from the same origin. Files are processed on the device; only the extracted study text is sent when the learner explicitly chooses AI questions. Progress and page indicators are shown during import. Cancelling, leaving the ticket, or switching accounts discards the unfinished import.

Imports allow 20 MB per file, 10 files per trip, and 50,000 text characters. Images are limited to 20 megapixels. PDF reading is limited to 100 pages, with at most 20 pages using OCR and a 120-second OCR budget per file; partial results identify the limit reached. Clear, upright scans give better recognition results. Unsupported or unreadable files still show their name and status.

The 2D journey map covers unexplored terrain and future stations with fog. Valid focus time gradually opens a corridor around the train; visited stations and the route already travelled remain visible from saved journey progress. Personal trips preview active focus time and retain pending offline progress; group maps open terrain only after the server confirms the contribution and daily allowance. Time away does not open new terrain. Unopened station names and stories remain hidden on the map.

## AI questions and learning journal

Choose **Tạo câu hỏi bằng AI** after a saved trip and select 1–30 questions. Questions use the trip topic, goal, and any locally extracted study text. There is no prebuilt question bank in the learning flow. Draft questions and answers stay in owner-scoped browser storage. The first submitted score and detailed answer feedback are saved by the server; reopening the journal restores the assessment.

Wrong answers identify **Kiến thức cần ôn** from the concepts tested in that question set. **Ôn lại trong một phiên mới** opens a new ticket with those concepts and the previous material; the learner chooses when to start. A perfect score only describes this set of questions. Older score-only assessments cannot reconstruct knowledge gaps.

The journal shows distractions, valid focus time as a percentage of actual elapsed trip time, and the question score separately. Focus labels use descriptive thresholds: at least 80%, 50–79%, and below 50%; they are not a clinical assessment or a combined academic grade. **Kinh nghiệm toa** is accumulated valid study time: 60 seconds = 1 XP, with remaining seconds carried forward. Quiz scores and distraction counts do not directly add or subtract XP; time away from focus earns no XP.

## Preview a production web build

The preview server also requires port 8084. Stop the development server before starting it.

```bash
npm run build:web
npm run preview
```

The production files are written to `dist/`. See [web and Windows operations](docs/WEB_DESKTOP.md) for production hosting details.

For a single-service Railway deployment that serves both the web app and API, follow the [Railway setup guide](docs/RAILWAY.md).

## Package the Windows app

```bash
npm run build:web
npm --prefix desktop ci
npm --prefix desktop run package:win
```

The Windows installer is in `desktop/release/`. For a local desktop build, set `VITE_API_URL` in the root `.env` or build environment for an online backend. GitHub Actions defaults to `https://viendu.up.railway.app/api/v1`; the repository variable `VITE_API_URL` can override it. Actions builds the installer and a ZIP of the web app on pushes to `main`; download them from the `Vien-Du-Windows` artifact in the **Build Windows app** workflow.

To launch the desktop build locally after creating `dist/` and installing desktop dependencies, run this separately. It stays open until you close the Electron app:

```bash
npm --prefix desktop start
```

See [web and Windows operations](docs/WEB_DESKTOP.md) for backend deployment and cross-packaging from macOS.
