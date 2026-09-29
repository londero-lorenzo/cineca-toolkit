# cineca-toolkit

> Download course-plan PDFs from Cineca's university course catalogue (`coursecatalogue.cineca.it`) — as a CLI or as a bookmarklet.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

## What is this?

Many Italian universities publish their course catalogues through Cineca's `coursecatalogue.cineca.it` (Angular-based, e.g. `uniud.coursecatalogue.cineca.it`). Each teaching's official programme can be exported as a PDF, one click at a time. `cineca-toolkit` talks directly to the catalogue's public JSON API (no login required) to fetch every teaching's PDF at once.

Two ways to use it, sharing the same core logic:

- **CLI** — give it a course URL, get a folder full of PDFs.
- **Bookmarklet** — click it while browsing the catalogue: on a course page it lets you pick which teachings to download and bundles them into a ZIP; on a single teaching's page it downloads just that PDF.

## Why not scrape the page?

The catalogue is an Angular app — the page is empty until the framework hydrates it, which is why naive scripts that click buttons or scrape the DOM are flaky (they can fire before the page is ready, or scrape stale/duplicate entries). Both the course listing and each teaching's PDF are available directly from the catalogue's own JSON API, so this toolkit skips the DOM entirely and talks to the API straight from the URL you give it.

## CLI usage

```bash
npm install
node src/cli/index.js <course-or-teaching-url> [options]
```

Accepts either:
- a **course page**, e.g. `https://uniud.coursecatalogue.cineca.it/corsi/2026/10958/insegnamenti/9999` — downloads every teaching's PDF into a folder;
- a **single teaching's page**, e.g. `.../insegnamenti/2026/19085/2026/9999?schemaid=13602` — downloads just that PDF.

Options:

| Flag | Description |
| --- | --- |
| `--out <dir>` | Output directory (default: derived from the course name) |
| `--percorso <schemaId>` | Only download teachings belonging to that study-plan schema id |
| `--dry-run` | List what would be downloaded, without downloading |

Re-running the same command skips PDFs already present in the output folder.

## Bookmarklet usage

1. Create a new bookmark (any bookmarks bar works).
2. Set its **URL** (not its name) to:

   ```
   javascript:(()%3D%3E%7Bconst%20e%3D%22https%3A%2F%2Fcdn.jsdelivr.net%2Fgh%2Flondero-lorenzo%2Fcineca-toolkit%40main%2Fdist%2Fbookmarklet.min.js%22%2Ct%3Ddocument.createElement(%22script%22)%3Bt.src%3D%60%24%7Be%7D%3Ft%3D%24%7BDate.now()%7D%60%2Cdocument.body.appendChild(t)%7D)()%3B
   ```

3. Name it something memorable, e.g. "Download Cineca PDFs".
4. Open any course or teaching page on a Cineca course catalogue and click the bookmark:
   - on a **course page**, pick the teachings you want and confirm — a ZIP downloads;
   - on a **teaching page**, the PDF downloads immediately.

The bookmark itself only injects a small loader script; the actual logic lives in `dist/bookmarklet.min.js`, hosted via jsDelivr and tracking the `main` branch. Project updates take effect automatically — no need to reinstall the bookmark after a `git pull`.

## How it works

Everything needed — the course's list of teachings, and each teaching's PDF — comes from the catalogue's own JSON API:

1. `GET /api/v1/corso/{anno}/{cdsId}` — the whole course, including every teaching under every study plan (`percorsi[].anni[].insegnamenti[].attivita[]`).
2. `GET /api/v1/insegnamento?...` — resolves a teaching's internal id.
3. `POST /api/v1/insegnamentoPdf/{id}` — returns the generated PDF.

All parameters needed for steps 2–3 come straight from a teaching's entry in step 1's response (or, for the bookmarklet on a teaching's own page, from that page's URL) — no DOM scraping, no waiting for Angular to render.

## Project structure

```
cineca-toolkit/
├── src/
│   ├── core/          # Shared logic: URL parsing, API client, teaching list, filenames
│   ├── cli/           # CLI entry point
│   └── bookmarklet/   # Bookmarklet entry point, UI overlay, ZIP bundling
├── bookmarklets/       # Ready-to-use bookmarklet source
├── dist/               # Built/minified bookmarklet output
├── package.json
├── LICENSE
└── .gitignore
```

## Development

After changing anything under `src/bookmarklet/` or `src/core/`, rebuild the bundle and commit the output — jsDelivr serves the committed file directly, there's no build step on their end:

```bash
npm run build
git add dist/bookmarklet.min.js
```
