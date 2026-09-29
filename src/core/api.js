// Client for the public JSON API behind coursecatalogue.cineca.it. No
// authentication is required — the catalogue is public — so this works
// equally from Node (the CLI) and from the page itself (the bookmarklet).

async function apiFetch(url, options) {
    const response = await fetch(url, options);
    if (!response.ok) {
        throw new Error(`HTTP ${response.status} for ${url}`);
    }
    return response;
}

export async function getCorso(origin, anno, cdsId) {
    const response = await apiFetch(`${origin}/api/v1/corso/${anno}/${cdsId}`);
    const data = await response.json();
    return Array.isArray(data) ? data[0] : data;
}

// `params` identifies one teaching activity: cod, ordinamentoAa, afPercorso,
// corsoCod plus the offering year it belongs to (anno) and optionally
// schemaId/coorte, whichever the source (course JSON or page URL) provided.
export async function getInsegnamento(origin, params) {
    const query = new URLSearchParams({
        anno: params.anno,
        insegnamento: params.cod,
        ordinamento_aa: params.ordinamentoAa,
        af_percorso: params.afPercorso,
        corso_cod: params.corsoCod
    });
    if (params.schemaId) query.set("schemaid", params.schemaId);
    if (params.coorte) query.set("coorte", params.coorte);

    const response = await apiFetch(`${origin}/api/v1/insegnamento?${query}`);
    const data = await response.json();
    return Array.isArray(data) ? data[0] : data;
}

export async function fetchInsegnamentoPdf(origin, id) {
    const response = await apiFetch(`${origin}/api/v1/insegnamentoPdf/${id}`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json; charset=UTF-8",
            // Literal value used by the catalogue's own frontend, not a real credential
            "Authorization": "reportBasicAuth",
            "Accept": "application/pdf"
        },
        body: "{}"
    });

    const buffer = await response.arrayBuffer();

    // This endpoint never sends a Content-Type header (unlike Moodle), so the
    // only reliable check is the file's own magic bytes
    const header = new Uint8Array(buffer.slice(0, 5));
    const isPdf = header.length === 5 && String.fromCharCode(...header) === "%PDF-";
    if (!isPdf) {
        throw new Error("Response was not a PDF file");
    }

    return buffer;
}
