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
2. Set its **URL** (not its name) to the entire contents of [`bookmarklets/download-zip.js`](bookmarklets/download-zip.js) — a single long `javascript:...` line. Copy the whole thing; most browsers' bookmark-edit URL field accepts arbitrarily long text.
3. Name it something memorable, e.g. "Download Cineca PDFs".
4. Open any course or teaching page on a Cineca course catalogue and click the bookmark:
   - on a **course page**, pick the teachings you want and confirm — a ZIP downloads;
   - on a **teaching page**, the PDF downloads immediately.

Unlike moodle-toolkit, this bookmarklet can't be a small loader that fetches the real code from jsDelivr at click-time: the catalogue's own Content-Security-Policy (`default-src 'self' 'unsafe-inline' *.cineca.it`) blocks loading *any* external script or `fetch()` — the whole bundle has to be inline in the bookmark already. Its own calls to the catalogue's API (`*.cineca.it`) are unaffected, since that's within the allowed origin.

This means the bookmark doesn't auto-update: after changing `src/bookmarklet/`, rebuild and **reinstall the bookmark** with the new contents of `bookmarklets/download-zip.js`.

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
├── bookmarklets/       # Generated: bookmarklet.min.js wrapped as a pasteable javascript: URI
├── dist/               # Generated: built/minified bookmarklet bundle
├── scripts/            # Build helper that wraps dist/ into bookmarklets/
├── package.json
├── LICENSE
└── .gitignore
```

## Development

After changing anything under `src/bookmarklet/` or `src/core/`, rebuild both generated files and commit them (nothing serves them at runtime — `bookmarklets/download-zip.js` only exists so it can be pasted straight into a bookmark):

```bash
npm run build
git add dist/bookmarklet.min.js bookmarklets/download-zip.js
```
