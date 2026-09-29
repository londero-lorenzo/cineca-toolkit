// Parses Cineca course-catalogue URLs (https://{ateneo}.coursecatalogue.cineca.it/…)
// into the pieces needed to call its JSON API. Two page shapes are recognised:
//   course page:   /corsi/{anno}/{cdsId}/insegnamenti/{pdsId}
//   teaching page: /corsi/{anno}/{cdsId}/insegnamenti/{annoOfferta}/{cod}/{ordinamentoAa}/{afPercorso}
export function parseCatalogueUrl(href) {
    const url = new URL(href);
    const segments = url.pathname.split("/").filter(Boolean);

    if (segments[0] !== "corsi" || segments[3] !== "insegnamenti") {
        return null;
    }

    const [, , cdsId] = segments;
    const rest = segments.slice(4);

    if (rest.length === 1) {
        return {
            type: "course",
            origin: url.origin,
            anno: segments[1],
            cdsId,
            pdsId: rest[0],
            schemaId: url.searchParams.get("schemaid") || undefined
        };
    }

    if (rest.length === 4) {
        const [annoOfferta, cod, ordinamentoAa, afPercorso] = rest;
        return {
            type: "teaching",
            origin: url.origin,
            // The URL's own segments are always a valid API context for this
            // specific page — unlike a synthesized context (see catalogue.js)
            anno: annoOfferta,
            cdsId,
            cod,
            ordinamentoAa,
            afPercorso,
            schemaId: url.searchParams.get("schemaid") || undefined,
            coorte: url.searchParams.get("coorte") || undefined
        };
    }

    return null;
}
