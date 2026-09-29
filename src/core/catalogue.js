// Flattens the nested `corso` JSON (percorsi -> anni -> insegnamenti ->
// attivita) into a flat, deduplicated list of teachings.

function collectAttivita(corso) {
    const items = [];
    for (const percorso of corso.percorsi || []) {
        for (const anno of percorso.anni || []) {
            // "altreAttivita" is a catch-all bucket with no real teaching content
            if (anno.anno === "altreAttivita") continue;
            for (const insegnamento of anno.insegnamenti || []) {
                for (const attivita of insegnamento.attivita || []) {
                    items.push({ attivita, annoCorso: anno.anno, percorsoDes: percorso.des_it });
                }
            }
        }
    }
    return items;
}

export function listTeachings(corso, { schemaId } = {}) {
    const seen = new Map();

    for (const { attivita, annoCorso, percorsoDes } of collectAttivita(corso)) {
        if (schemaId && String(attivita.schemaId) !== String(schemaId)) continue;

        // The same elective can appear under more than one study-plan year
        // (e.g. offered to both 1st- and 2nd-year students). Keep the first
        // occurrence: its "aa" is the teaching's own native offering year,
        // the only one the /insegnamento API reliably accepts for it — the
        // other year's group annoOfferta can 404 for a shared elective.
        const key = `${attivita.cod}|${attivita.aa}`;
        if (seen.has(key)) continue;

        seen.set(key, {
            cod: attivita.cod,
            nome: attivita.des_it,
            annoCorso,
            percorso: percorsoDes,
            schemaId: attivita.schemaId,
            params: {
                anno: attivita.aa,
                cod: attivita.cod,
                ordinamentoAa: attivita.ordinamento_aa,
                afPercorso: attivita.corso_percorso_id,
                corsoCod: attivita.corso_cod,
                schemaId: attivita.schemaId
            }
        });
    }

    return [...seen.values()];
}
