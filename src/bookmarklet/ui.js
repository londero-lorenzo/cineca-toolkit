const OVERLAY_ID = "cineca-toolkit-overlay";

function buildStyles() {
    const style = document.createElement("style");
    style.textContent = `
        #${OVERLAY_ID} {
            position: fixed;
            inset: 0;
            background: rgba(0, 0, 0, 0.5);
            z-index: 999999;
            display: flex;
            align-items: center;
            justify-content: center;
            font-family: Arial, sans-serif;
        }
        #${OVERLAY_ID} .panel {
            background: white;
            border-radius: 8px;
            padding: 20px;
            width: 480px;
            max-height: 80vh;
            display: flex;
            flex-direction: column;
        }
        #${OVERLAY_ID} h2 { margin: 0 0 12px; }
        #${OVERLAY_ID} .list { overflow-y: auto; flex: 1; margin-bottom: 12px; }
        #${OVERLAY_ID} .group-title {
            margin: 12px 0 4px;
            font-size: 13px;
            font-weight: bold;
            color: #666;
            text-transform: uppercase;
        }
        #${OVERLAY_ID} .group-title:first-child { margin-top: 0; }
        #${OVERLAY_ID} .item {
            display: flex;
            align-items: center;
            gap: 8px;
            padding: 6px 0;
            border-bottom: 1px solid #eee;
        }
        #${OVERLAY_ID} .actions { display: flex; justify-content: space-between; }
        #${OVERLAY_ID} button { cursor: pointer; padding: 8px 14px; border: none; border-radius: 4px; }
        #${OVERLAY_ID} .confirm { background: #1976d2; color: white; }
        #${OVERLAY_ID} .cancel { background: #eee; }
        #${OVERLAY_ID} .progress-status { margin: 0 0 8px; color: #555; }
        #${OVERLAY_ID} .progress-track {
            background: #eee;
            border-radius: 4px;
            height: 10px;
            overflow: hidden;
        }
        #${OVERLAY_ID} .progress-fill {
            background: #1976d2;
            height: 100%;
            width: 0%;
            transition: width 0.2s ease;
        }
    `;
    return style;
}

function buildOverlay() {
    // Replace any previous instance instead of stacking overlays
    document.getElementById(OVERLAY_ID)?.remove();

    const overlay = document.createElement("div");
    overlay.id = OVERLAY_ID;
    overlay.appendChild(buildStyles());

    const panel = document.createElement("div");
    panel.className = "panel";
    overlay.appendChild(panel);

    document.body.appendChild(overlay);
    return { overlay, panel };
}

function buildItem(teaching, index) {
    const item = document.createElement("label");
    item.className = "item";

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = true;
    checkbox.dataset.index = index;

    const text = document.createElement("span");
    text.textContent = teaching.nome;

    item.append(checkbox, text);
    return item;
}

function groupLabel(annoCorso) {
    return typeof annoCorso === "number" ? `${annoCorso}° anno` : "Altre attività";
}

export function renderTeachingSelector(teachings, { onConfirm, onCancel }) {
    const { overlay, panel } = buildOverlay();

    const title = document.createElement("h2");
    title.textContent = `${teachings.length} insegnamento/i trovato/i`;

    const list = document.createElement("div");
    list.className = "list";

    let lastGroup;
    teachings.forEach((teaching, index) => {
        const group = groupLabel(teaching.annoCorso);
        if (group !== lastGroup) {
            const heading = document.createElement("div");
            heading.className = "group-title";
            heading.textContent = group;
            list.appendChild(heading);
            lastGroup = group;
        }
        list.appendChild(buildItem(teaching, index));
    });

    const cancelBtn = document.createElement("button");
    cancelBtn.className = "cancel";
    cancelBtn.textContent = "Annulla";
    cancelBtn.addEventListener("click", () => {
        overlay.remove();
        onCancel?.();
    });

    const confirmBtn = document.createElement("button");
    confirmBtn.className = "confirm";
    confirmBtn.textContent = "Scarica selezionati";
    confirmBtn.addEventListener("click", () => {
        const selected = [...list.querySelectorAll("input:checked")]
            .map(cb => teachings[cb.dataset.index]);
        // Left visible on purpose: the caller swaps it for a progress view
        // instead of leaving the user without feedback while downloads run
        onConfirm(selected);
    });

    const actions = document.createElement("div");
    actions.className = "actions";
    actions.append(cancelBtn, confirmBtn);

    panel.append(title, list, actions);
}

export function renderProgress(total) {
    const { overlay, panel } = buildOverlay();

    const title = document.createElement("h2");
    title.textContent = "Download in corso...";

    const status = document.createElement("p");
    status.className = "progress-status";

    const track = document.createElement("div");
    track.className = "progress-track";
    const fill = document.createElement("div");
    fill.className = "progress-fill";
    track.appendChild(fill);

    panel.append(title, status, track);

    const update = (completed) => {
        status.textContent = `${completed} / ${total}`;
        fill.style.width = `${(completed / total) * 100}%`;
    };
    update(0);

    return { update, close: () => overlay.remove() };
}
