// Same "strip filesystem-unsafe characters" rule used by moodle-toolkit's
// downloader.js, so files stay identically safe on Windows/macOS/Linux.
export function sanitize(text) {
    return text.replace(/[\\/:*?"<>|]/g, "_").trim();
}

export function teachingFilename(teaching) {
    const label = typeof teaching.annoCorso === "number" ? `${teaching.annoCorso}° anno - ` : "";
    return `${label}${sanitize(teaching.nome)}.pdf`;
}
