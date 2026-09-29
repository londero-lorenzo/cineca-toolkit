import JSZip from "jszip";

function uniqueName(usedNames, filename) {
    if (!usedNames.has(filename)) {
        usedNames.add(filename);
        return filename;
    }
    // Same filename derived twice — disambiguate instead of overwriting
    const dot = filename.lastIndexOf(".");
    const base = dot === -1 ? filename : filename.slice(0, dot);
    const ext = dot === -1 ? "" : filename.slice(dot);
    let counter = 2;
    let candidate = `${base} (${counter})${ext}`;
    while (usedNames.has(candidate)) {
        counter++;
        candidate = `${base} (${counter})${ext}`;
    }
    usedNames.add(candidate);
    return candidate;
}

export async function createZip(files) {
    const zip = new JSZip();
    const usedNames = new Set();
    const failed = files.filter(f => f.error);

    for (const file of files) {
        if (file.error) continue;
        zip.file(uniqueName(usedNames, file.filename), file.blob);
    }

    const blob = await zip.generateAsync({ type: "blob" });
    return { blob, failed };
}
