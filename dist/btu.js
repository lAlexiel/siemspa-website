(function() {
    "use strict";
    const config = Object.freeze({
        version: "preliminar-1",
        base: 600,
        referenceHeight: 2.4,
        extraPerson: 600,
        rounding: 500,
        minArea: 9,
        maxArea: 60,
        minHeight: 2,
        maxHeight: 3,
        maxPeople: 6
    });
    function decimal(value) {
        const text = String(value).trim();
        return /^(?:\d+(?:[.,]\d+)?|[.,]\d+)$/.test(text) ? Number(text.replace(",", ".")) : NaN;
    }
    function estimate({area: area, height: height, people: people, conditions: conditions = []}) {
        if (![ area, height, people ].every(Number.isFinite) || area <= 0 || height <= 0 || people < 1 || !Number.isInteger(people)) return {
            state: "invalid"
        };
        const reasons = [];
        if (area < config.minArea || area > config.maxArea) reasons.push("La superficie está fuera del intervalo de 9 a 60 m² de esta herramienta.");
        if (height < config.minHeight || height > config.maxHeight) reasons.push("La altura está fuera del intervalo de 2 a 3 m de esta herramienta.");
        if (people > config.maxPeople) reasons.push("La ocupación supera las 6 personas contempladas en esta referencia.");
        if (conditions.length) reasons.push("Las condiciones que indicas requieren revisar las cargas de calor y el uso del espacio.");
        if (reasons.length) return {
            state: "assessment",
            reasons: reasons
        };
        const raw = area * config.base * (height / config.referenceHeight) + Math.max(0, people - 2) * config.extraPerson;
        return {
            state: "estimated",
            capacity: Math.round(raw / config.rounding) * config.rounding
        };
    }
    if (typeof module !== "undefined" && module.exports) {
        module.exports = {
            decimal: decimal,
            estimate: estimate,
            config: config
        };
        return;
    }
    const byId = id => document.getElementById(id), form = byId("btu-form");
    if (!form) return;
    const fields = {
        area: byId("btu-area"),
        length: byId("btu-length"),
        width: byId("btu-width"),
        height: byId("btu-height"),
        people: byId("btu-people")
    };
    const result = byId("btu-result"), link = byId("btu-consult"), tool = byId("btu-tool"), touched = new Set;
    const conditionLabels = {
        sun: "Sol directo intenso o grandes ventanales",
        heat: "Cocina abierta u otras fuentes intensas de calor",
        other: "Varias habitaciones o uso comercial / industrial"
    };
    let dimensions = false, announcementTimer = 0, lastAnnouncement = "";
    const format = n => n.toLocaleString("es-CL", {
        maximumFractionDigits: 2
    });
    Object.entries(fields).forEach(([key, field]) => {
        const allowed = value => (key === "people" ? /^\d*$/ : /^\d*(?:[.,]\d*)?$/).test(value);
        let accepted = field.value, caret = accepted.length;
        const replacement = text => field.value.slice(0, field.selectionStart) + text + field.value.slice(field.selectionEnd);
        const reject = () => announce(key === "people" ? "Usa solo números enteros para las personas." : "Usa solo números y un punto o una coma decimal.");
        field.spellcheck = false;
        field.addEventListener("beforeinput", event => {
            if (event.isComposing || !event.inputType.startsWith("insert") || event.data === null) return;
            if (!allowed(replacement(event.data))) {
                event.preventDefault();
                reject();
            }
        });
        field.addEventListener("paste", event => {
            if (!event.clipboardData) return;
            event.preventDefault();
            const text = event.clipboardData.getData("text/plain").trim();
            if (!allowed(replacement(text))) {
                reject();
                return;
            }
            field.setRangeText(text, field.selectionStart, field.selectionEnd, "end");
            field.dispatchEvent(new Event("input", {
                bubbles: true
            }));
        });
        field.addEventListener("input", () => {
            if (!allowed(field.value)) {
                field.value = accepted;
                field.setSelectionRange(caret, caret);
                reject();
            } else {
                accepted = field.value;
                caret = field.selectionStart ?? accepted.length;
            }
        });
    });
    function inputError(key, message) {
        const field = fields[key], shown = message && touched.has(key);
        byId("btu-" + key + "-error").textContent = shown ? message : "";
        if (shown) field.setAttribute("aria-invalid", "true"); else field.removeAttribute("aria-invalid");
    }
    function announce(message) {
        clearTimeout(announcementTimer);
        announcementTimer = setTimeout(() => {
            if (message !== lastAnnouncement) {
                byId("btu-live").textContent = message;
                lastAnnouncement = message;
            }
        }, 550);
    }
    function render() {
        const selectedHeight = form.elements.heightChoice.value;
        const activeKeys = [ ...dimensions ? [ "length", "width" ] : [ "area" ], "people", ...selectedHeight === "custom" ? [ "height" ] : [] ];
        const values = {}, invalid = [];
        Object.keys(fields).forEach(key => {
            values[key] = decimal(fields[key].value);
            let error = "";
            if (activeKeys.includes(key)) {
                if (!Number.isFinite(values[key]) || values[key] <= 0) error = key === "people" ? "Indica una cantidad entera de personas mayor que cero." : "Escribe un número mayor que cero, con coma o punto decimal."; else if (key === "people" && !Number.isInteger(values[key])) error = "Indica una cantidad entera de personas.";
                if (error) invalid.push(key);
            }
            inputError(key, error);
        });
        const area = dimensions ? values.length * values.width : values.area;
        const height = selectedHeight === "custom" ? values.height : Number(selectedHeight), people = values.people;
        const conditions = Object.keys(conditionLabels).filter(key => form.elements[key].checked).map(key => conditionLabels[key]);
        const outcome = invalid.length ? {
            state: "invalid"
        } : estimate({
            area: area,
            height: height,
            people: people,
            conditions: conditions
        });
        const firstEmpty = !touched.size && !fields.area.value && !fields.length.value && !fields.width.value;
        const state = outcome.state === "invalid" && firstEmpty ? "empty" : outcome.state;
        const oldState = result.dataset.state;
        result.dataset.state = state;
        link.hidden = true;
        link.removeAttribute("href");
        byId("btu-send-note").hidden = true;
        byId("btu-number").hidden = true;
        byId("btu-number").textContent = "";
        byId("btu-summary").hidden = true;
        let title, copy;
        if (state === "empty" || state === "invalid") {
            title = state === "empty" ? "Comienza por los m²." : "Completa las medidas.";
            copy = state === "empty" ? "Introduce la superficie o usa el largo y el ancho. Tu referencia aparecerá aquí." : "Revisa los campos para obtener una nueva referencia. No se conserva una estimación con datos incompletos.";
        } else {
            byId("btu-summary").hidden = false;
            byId("btu-summary-area").textContent = format(area) + " m²";
            byId("btu-summary-use").textContent = format(height) + " m · " + format(people) + (people === 1 ? " persona" : " personas");
            if (state === "estimated") {
                title = "Una primera referencia.";
                byId("btu-number").hidden = false;
                byId("btu-number").textContent = "≈ " + format(outcome.capacity) + " BTU/h";
                copy = "Capacidad aproximada para enfriar este ambiente. SIEM debe revisar el lugar antes de definir el equipo adecuado.";
            } else {
                title = "Tu espacio necesita una evaluación.";
                copy = outcome.reasons.join(" ");
            }
            byId("btu-consult-label").textContent = state === "estimated" ? "Consultar esta estimación" : "Consultar sobre mi espacio";
            const message = [ "Hola SIEM, quisiera orientación para climatizar un espacio.", "", "Superficie: " + format(area) + " m²" + (dimensions ? " (largo " + format(values.length) + " m × ancho " + format(values.width) + " m)" : ""), "Altura: " + format(height) + " m", "Ocupantes habituales: " + format(people), "Condiciones: " + (conditions.length ? conditions.join("; ") : "Referencia de un dormitorio o sala cerrada, sin grandes ventanales ni fuentes intensas de calor; por confirmar."), state === "estimated" ? "Estimación preliminar: aproximadamente " + format(outcome.capacity) + " BTU/h. No es una selección de equipo." : "La calculadora indica que se requiere evaluación: " + outcome.reasons.join(" "), "Método orientativo " + config.version + "; no incorpora clima local ni aislación.", "", "¿Podrían confirmar la capacidad, la cobertura en mi comuna y el alcance del servicio?" ].join("\n");
            link.href = "https://wa.me/56976567936?text=" + encodeURIComponent(message);
            link.hidden = false;
            byId("btu-send-note").hidden = false;
        }
        byId("btu-result-title").textContent = title;
        byId("btu-result-copy").textContent = copy;
        if (touched.size) announce(state === "estimated" ? "Estimación orientativa: " + format(outcome.capacity) + " BTU por hora." : title);
        if (oldState !== state && !matchMedia("(prefers-reduced-motion: reduce)").matches && result.animate) {
            result.getAnimations().forEach(a => a.cancel());
            result.animate([ {
                opacity: .75
            }, {
                opacity: 1
            } ], {
                duration: 180,
                easing: "ease-out"
            });
        }
    }
    byId("btu-mode").addEventListener("click", () => {
        dimensions = !dimensions;
        byId("btu-mode").setAttribute("aria-expanded", String(dimensions));
        byId("btu-mode").textContent = dimensions ? "Ya conozco la superficie en m²" : "No sé los m²: usar largo y ancho ↗";
        byId("btu-area-group").hidden = dimensions;
        fields.area.disabled = dimensions;
        byId("btu-dimensions").hidden = !dimensions;
        fields.length.disabled = fields.width.disabled = !dimensions;
        render();
    });
    form.addEventListener("input", event => {
        const key = Object.keys(fields).find(k => fields[k] === event.target);
        if (key) touched.add(key);
        if (event.target.name === "heightChoice") {
            const custom = event.target.value === "custom";
            byId("btu-custom-height").hidden = !custom;
            fields.height.disabled = !custom;
        }
        render();
    });
    form.addEventListener("focusout", event => {
        const key = Object.keys(fields).find(k => fields[k] === event.target);
        if (key) {
            touched.add(key);
            render();
        }
    });
    form.addEventListener("submit", event => {
        event.preventDefault();
        Object.keys(fields).forEach(k => {
            if (!fields[k].disabled) touched.add(k);
        });
        render();
        form.querySelector("[aria-invalid=true]")?.focus();
    });
    tool.addEventListener("toggle", () => {
        byId("btu-tool").querySelector(".btu-open-label").textContent = tool.open ? "Cerrar calculadora" : "Abrir calculadora BTU";
    });
    render();
})();
