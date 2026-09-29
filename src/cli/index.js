#!/usr/bin/env node
import { parseArgs } from "node:util";
import { mkdir, writeFile, access } from "node:fs/promises";
import path from "node:path";

import { parseCatalogueUrl } from "../core/url.js";
import { getCorso, getInsegnamento, fetchInsegnamentoPdf } from "../core/api.js";
import { listTeachings } from "../core/catalogue.js";
import { teachingFilename, sanitize } from "../core/filename.js";

function printUsage() {
    console.log(`Usage: cineca-toolkit <course-or-teaching-url> [options]

Downloads course-plan PDFs from a Cineca university course catalogue
(coursecatalogue.cineca.it). Accepts either a course page (downloads every
teaching's PDF) or a single teaching's detail page (downloads just that one).

Options:
  --out <dir>        Output directory (default: derived from the course name)
  --percorso <id>     Only download teachings from this study-plan schema id
  --dry-run           List the teachings that would be downloaded, without downloading
  --help              Show this help
`);
}

async function fileExists(filePath) {
    try {
        await access(filePath);
        return true;
    } catch {
        return false;
    }
}

async function downloadCourse(context, { outDir, schemaId, dryRun }) {
    const corso = await getCorso(context.origin, context.anno, context.cdsId);
    const teachings = listTeachings(corso, { schemaId });

    if (teachings.length === 0) {
        const scope = schemaId ? ` (schema ${schemaId})` : "";
        console.error(`No teachings found for this course${scope}.`);
        process.exitCode = 1;
        return;
    }

    console.log(`Found ${teachings.length} teaching(s) in "${corso.des_it}".`);

    if (dryRun) {
        for (const teaching of teachings) {
            const yearLabel = typeof teaching.annoCorso === "number" ? `year ${teaching.annoCorso}` : "extra";
            console.log(`  [${yearLabel}] ${teaching.nome} (${teaching.cod})`);
        }
        return;
    }

    const dir = outDir || sanitize(`${corso.des_it} ${corso.aa}`);
    await mkdir(dir, { recursive: true });

    let failed = 0;
    for (let i = 0; i < teachings.length; i++) {
        const teaching = teachings[i];
        const filePath = path.join(dir, teachingFilename(teaching));
        const progress = `[${i + 1}/${teachings.length}]`;

        if (await fileExists(filePath)) {
            console.log(`${progress} skip (already downloaded): ${teaching.nome}`);
            continue;
        }

        try {
            const insegnamento = await getInsegnamento(context.origin, teaching.params);
            const pdf = await fetchInsegnamentoPdf(context.origin, insegnamento._id);
            await writeFile(filePath, Buffer.from(pdf));
            console.log(`${progress} downloaded: ${teaching.nome}`);
        } catch (error) {
            failed++;
            console.error(`${progress} FAILED: ${teaching.nome} — ${error.message}`);
        }

        // Small pause between requests so we don't hammer the server
        await new Promise(resolve => setTimeout(resolve, 300));
    }

    if (failed > 0) {
        console.error(`\n${failed} file(s) failed to download.`);
        process.exitCode = 1;
    }
}

async function downloadTeaching(context, { outDir }) {
    const insegnamento = await getInsegnamento(context.origin, {
        anno: context.anno,
        cod: context.cod,
        ordinamentoAa: context.ordinamentoAa,
        afPercorso: context.afPercorso,
        corsoCod: context.cdsId,
        schemaId: context.schemaId,
        coorte: context.coorte
    });

    const dir = outDir || ".";
    await mkdir(dir, { recursive: true });
    const filePath = path.join(dir, teachingFilename({ nome: insegnamento.des_it }));

    const pdf = await fetchInsegnamentoPdf(context.origin, insegnamento._id);
    await writeFile(filePath, Buffer.from(pdf));
    console.log(`Downloaded: ${filePath}`);
}

async function main() {
    const { values, positionals } = parseArgs({
        options: {
            out: { type: "string" },
            percorso: { type: "string" },
            "dry-run": { type: "boolean", default: false },
            help: { type: "boolean", default: false }
        },
        allowPositionals: true
    });

    if (values.help || positionals.length === 0) {
        printUsage();
        process.exitCode = values.help ? 0 : 1;
        return;
    }

    const context = parseCatalogueUrl(positionals[0]);
    if (!context) {
        console.error("Unrecognised URL. Expected a Cineca course-catalogue course or teaching page.");
        process.exitCode = 1;
        return;
    }

    if (context.type === "course") {
        await downloadCourse(context, { outDir: values.out, schemaId: values.percorso, dryRun: values["dry-run"] });
    } else {
        await downloadTeaching(context, { outDir: values.out });
    }
}

main().catch(error => {
    console.error(error.message);
    process.exitCode = 1;
});
