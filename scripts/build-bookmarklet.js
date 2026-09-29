// Wraps the compiled bundle as a ready-to-paste `javascript:` bookmarklet.
//
// Unlike moodle-toolkit, this can't be a small loader that fetches the real
// bundle from jsDelivr at click-time: the catalogue's own CSP is
// `default-src 'self' 'unsafe-inline' *.cineca.it` with no separate
// script-src/connect-src, so it blocks both a <script src=jsdelivr...> and a
// fetch() to jsdelivr — anything outside 'self'/*.cineca.it. The bookmarklet
// itself (a javascript: URI the user clicks) isn't subject to page CSP, only
// what it does afterwards is — so the whole bundle has to be inline already.
import { readFileSync, writeFileSync } from "node:fs";

const bundle = readFileSync(new URL("../dist/bookmarklet.min.js", import.meta.url), "utf8").trim();
const bookmarklet = `javascript:${encodeURIComponent(bundle)}`;

writeFileSync(new URL("../bookmarklets/download-zip.js", import.meta.url), bookmarklet + "\n");
console.log(`Wrote bookmarklets/download-zip.js (${bookmarklet.length} chars)`);
