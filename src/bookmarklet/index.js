import { parseCatalogueUrl } from "../core/url.js";
import { getCorso, getInsegnamento, fetchInsegnamentoPdf } from "../core/api.js";
import { listTeachings } from "../core/catalogue.js";
import { teachingFilename, sanitize } from "../core/filename.js";
import { renderTeachingSelector, renderProgress } from "./ui.js";
import { createZip } from "./zip.js";
import { saveBlob } from "./utils.js";

async function downloadTeachings(origin, teachings, onProgress) {
    const results = [];

    for (const teaching of teachings) {
        try {
            const insegnamento = await getInsegnamento(origin, teaching.params);
            const buffer = await fetchInsegnamentoPdf(origin, insegnamento._id);
            results.push({
                ...teaching,
                filename: teachingFilename(teaching),
                blob: new Blob([buffer], { type: "application/pdf" })
            });
        } catch (error) {
            results.push({ ...teaching, error });
        }
        onProgress?.(results.length, teachings.length);
    }

    return results;
}

async function handleSelection(context, corso, selected) {
    if (selected.length === 0) {
        return;
    }

    const progress = renderProgress(selected.length);
    const downloaded = await downloadTeachings(context.origin, selected, completed => progress.update(completed));
    const { blob, failed } = await createZip(downloaded);

    progress.close();
    saveBlob(blob, `${sanitize(corso.des_it)} ${corso.aa}.zip`);

    if (failed.length > 0) {
        const names = failed.map(f => `- ${f.nome}`).join("\n");
        alert(`${failed.length} PDF non scaricati:\n${names}`);
    }
}

// Returns whether ownership of the busy flag was handed off to the
// selector's own onConfirm/onCancel callbacks (true), so the caller knows
// whether it still needs to clear the flag itself.
async function handleCoursePage(context) {
    const corso = await getCorso(context.origin, context.anno, context.cdsId);
    // A course-page URL only carries ?schemaid= when a specific piano tab was
    // selected; without it, listTeachings falls back to deduping across all
    // piani (same default the CLI uses without --percorso)
    const teachings = listTeachings(corso, { schemaId: context.schemaId });

    if (teachings.length === 0) {
        alert("Nessun insegnamento trovato per questo corso.");
        return false;
    }

    renderTeachingSelector(teachings, {
        onConfirm: selected => handleSelection(context, corso, selected).finally(() => {
            window.__cinecaToolkitBusy = false;
        }),
        onCancel: () => {
            window.__cinecaToolkitBusy = false;
        }
    });
    return true;
}

async function handleTeachingPage(context) {
    const insegnamento = await getInsegnamento(context.origin, { ...context, corsoCod: context.cdsId });
    const buffer = await fetchInsegnamentoPdf(context.origin, insegnamento._id);
    saveBlob(new Blob([buffer], { type: "application/pdf" }), teachingFilename({ nome: insegnamento.des_it }));
    return false; // a single-file download has already finished, nothing to hand off to
}

function main() {
    // Each bookmarklet click re-injects and re-runs this whole bundle from
    // scratch, so a window flag is the only way to detect an overlapping run
    if (window.__cinecaToolkitBusy) {
        alert("Un download è già in corso — attendi che finisca.");
        return;
    }

    const context = parseCatalogueUrl(location.href);
    if (!context) {
        alert("Questa pagina non è una pagina di corso o insegnamento del catalogo Cineca.");
        return;
    }

    window.__cinecaToolkitBusy = true;

    const run = context.type === "course" ? handleCoursePage(context) : handleTeachingPage(context);
    run
        .then(handedOff => {
            if (!handedOff) window.__cinecaToolkitBusy = false;
        })
        .catch(error => {
            alert(`Errore: ${error.message}`);
            window.__cinecaToolkitBusy = false;
        });
}

main();
