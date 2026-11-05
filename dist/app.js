const drawings = {
    calculator: '<rect x="5" y="2" width="14" height="20" rx="2"/><path d="M8 6h8v4H8zM8 14h1m3 0h1m3 0h.1M8 18h1m3 0h1m3 0h.1"/>',
    snow: '<path d="M12 2v20M3.3 7l17.4 10M3.3 17L20.7 7M9 4l3 3 3-3M9 20l3-3 3 3M3 10l4-1-1-4M18 19l-1-4 4-1M3 14l4 1-1 4M18 5l-1 4 4 1"/>',
    file: '<path d="M14 3H5v18h14V8zM14 3v5h5M8 12h8M8 16h6"/>',
    chat: '<path d="M21 11.5a9 9 0 0 1-13 8L3 21l1.5-5a9 9 0 1 1 16.5-4.5Z"/><path d="M8 9c1 4 3 6 7 7l2-2-3-2-1 1-2-2 1-1-2-3Z"/>',
    building: '<path d="M3 21h18M5 21V6l8-3v18M13 10h6v11M8 8v2m0 3v2m0 3v1M16 13v2m0 3v1"/>',
    home: '<path d="m3 11 9-8 9 8M5 10v11h14V10M9 21v-7h6v7"/>',
    ac: '<rect x="2" y="4" width="20" height="10" rx="2"/><path d="M5 11h14M17 7h2M7 17v3M12 17v5M17 17v3"/>',
    chiller: '<rect x="3" y="4" width="18" height="15" rx="1"/><circle cx="8" cy="10" r="3"/><circle cx="16" cy="10" r="3"/><path d="M6 16h12M6 19v3M18 19v3"/>',
    cold: '<path d="M3 21V3h18v18zM9 3v18M6 11v3M15 7v10M12 9l6 6M12 15l6-6"/>',
    fan: '<circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="2"/><path d="M11 10C5 6 13 3 14 7l-1 3M14 12c6-3 5 5 1 5l-2-3M11 14c-1 6-7 1-5-2l4-1"/>',
    panel: '<rect x="4" y="2" width="16" height="20" rx="1"/><path d="M8 6h8M8 9h5M8 18h8M8 15h8M17 11v2"/>',
    check: '<path d="m5 12 4 4L19 6"/>',
    phone: '<path d="m4 3 4-1 3 6-3 2c2 4 3 5 6 6l2-3 6 3-1 4C12 24 0 12 4 3Z"/>'
};

document.querySelectorAll("[data-icon]").forEach(el => {
    el.innerHTML = `<svg class="icon" viewBox="0 0 24 24" aria-hidden="true">${drawings[el.dataset.icon] || drawings.snow}</svg>`;
});

const menu = document.querySelector(".menu-toggle"), nav = document.querySelector("#navigation");

function closeMenu() {
    menu.setAttribute("aria-expanded", "false");
    menu.setAttribute("aria-label", "Abrir menú");
    nav.classList.remove("open");
}

menu.addEventListener("click", () => {
    const open = menu.getAttribute("aria-expanded") !== "true";
    menu.setAttribute("aria-expanded", String(open));
    menu.setAttribute("aria-label", open ? "Cerrar menú" : "Abrir menú");
    nav.classList.toggle("open", open);
});

nav.querySelectorAll("a").forEach(a => a.addEventListener("click", closeMenu));

document.addEventListener("keydown", e => {
    if (e.key === "Escape" && nav.classList.contains("open")) {
        closeMenu();
        menu.focus();
    }
});

window.matchMedia("(min-width:761px)").addEventListener("change", closeMenu);

document.addEventListener("click", event => {
    if (nav.classList.contains("open") && !nav.contains(event.target) && !menu.contains(event.target)) closeMenu();
});

document.addEventListener("focusin", event => {
    if (nav.classList.contains("open") && !nav.contains(event.target) && event.target !== menu) closeMenu();
});

const form = document.querySelector("#quote-form"), equipment = form.elements.equipment, need = form.elements.need;

const catalogueCards = [ ...document.querySelectorAll("#service-list > .service") ];

let audienceContext = null, catalogueContext = null, equipmentTouched = false;

equipment.addEventListener("input", () => {
    equipmentTouched = true;
});

const scopes = {
    "Aire acondicionado": [ "Instalación", "Mantención" ],
    Chillers: [ "Instalación", "Mantención", "Reparación" ],
    "Cámaras de frío": [ "Fabricación", "Mantención" ],
    "Equipos evaporativos": [ "Instalación", "Mantención", "Reparación" ],
    "Enfriadores de tableros": [ "Instalación", "Mantención", "Reparación" ]
};

function updateNeeds() {
    const previous = need.value;
    need.replaceChildren(new Option("Selecciona una opción", ""));
    [ ...scopes[equipment.value] || [ "Instalación", "Mantención", "Reparación", "Fabricación" ], "Necesito orientación" ].forEach(value => need.add(new Option(value, value)));
    if ([ ...need.options ].some(o => o.value === previous)) need.value = previous;
    clearError(need);
}

equipment.addEventListener("change", updateNeeds);

function updateAudience() {
    const home = form.elements.audience.value === "Hogar";
    audienceContext = form.elements.audience.value;
    if (home && !equipmentTouched && !equipment.value && !need.value) {
        equipment.value = "Aire acondicionado";
        updateNeeds();
        clearError(equipment);
    }
    const note = document.querySelector("#audience-note");
    note.textContent = home ? equipment.value && equipment.value !== "Aire acondicionado" ? "Conservamos el equipo y el trabajo que elegiste. Consulta su atención residencial y la cobertura en tu comuna." : "Consulta la cobertura y disponibilidad residencial para tu comuna. Puedes adjuntar fotos en WhatsApp." : "Si tienes fotos o la placa del equipo, puedes adjuntarlas en WhatsApp.";
    animateChange(note);
}

function renderCatalogue(context) {
    catalogueContext = context;
    if (context === "Hogar" && document.documentElement.dataset.campaign !== "summer") document.querySelector("#btu-tool").open = true;
    window.SIEMCampaign?.syncAudience(context);
    catalogueCards.forEach(card => {
        card.hidden = context === "Hogar" && card.dataset.service !== "Aire acondicionado";
    });
    document.querySelector("#service-list").classList.toggle("home-view", context === "Hogar");
    document.querySelectorAll("[data-audience]").forEach(link => {
        if (context === link.dataset.audience) link.setAttribute("aria-current", "true"); else link.removeAttribute("aria-current");
    });
    document.querySelector("#services-eyebrow").textContent = context === "Hogar" ? "CLIMATIZACIÓN DEL HOGAR" : context === "Empresa" ? "SOLUCIONES PARA EMPRESAS" : "CINCO ESPECIALIDADES DE FRÍO";
    document.querySelector("#services-title").textContent = context === "Hogar" ? "Aire acondicionado para tu espacio." : "¿Qué equipo necesitas atender?";
    document.querySelector("#services-description").textContent = context === "Hogar" ? "Instalación y mantención. Consulta la atención disponible para tu vivienda y comuna." : "Conoce nuestras especialidades y el alcance de cada servicio.";
    document.querySelector(".catalogue-toolbar").hidden = false;
    document.querySelector("#catalogue-status").textContent = context === "Hogar" ? "Hogar · 1 especialidad para consultar" : context === "Empresa" ? "Empresas · 5 especialidades disponibles para consultar" : `Mostrando los 5 servicios${audienceContext ? ". Tu consulta sigue dirigida a: " + audienceContext : ""}.`;
    scheduleNavigationUpdate();
}

form.querySelectorAll("[name=audience]").forEach(radio => radio.addEventListener("change", () => {
    const top = form.getBoundingClientRect().top;
    updateAudience();
    if (catalogueContext) {
        renderCatalogue(audienceContext);
        const shift = form.getBoundingClientRect().top - top;
        if (shift) window.scrollBy({
            top: shift,
            behavior: "instant"
        });
    }
}));

equipment.addEventListener("change", () => {
    if (audienceContext) updateAudience();
});

document.querySelectorAll("[data-audience]").forEach(link => link.addEventListener("click", () => {
    form.elements.audience.value = link.dataset.audience;
    updateAudience();
    renderCatalogue(link.dataset.audience);
}));

document.querySelector("#show-all").addEventListener("click", () => renderCatalogue(null));

const requiredFields = [ equipment, need, form.elements.commune ];

const errors = {
    equipment: "Selecciona el equipo o elige «Necesito orientación».",
    need: "Indica el trabajo que necesitas o solicita orientación.",
    commune: "Escribe la comuna de la instalación."
};

requiredFields.forEach(field => {
    const error = document.createElement("span");
    error.className = "field-error";
    error.id = field.name + "-error";
    field.insertAdjacentElement("afterend", error);
    field.addEventListener("input", () => clearError(field));
    field.addEventListener("change", () => clearError(field));
});

function clearError(field) {
    field.removeAttribute("aria-invalid");
    const error = document.getElementById(field.name + "-error");
    if (error) error.textContent = "";
}

form.noValidate = true;

form.addEventListener("submit", event => {
    event.preventDefault();
    const invalid = requiredFields.filter(field => !field.value.trim() || !field.validity.valid);
    requiredFields.forEach(clearError);
    if (invalid.length) {
        invalid.forEach(field => {
            field.setAttribute("aria-invalid", "true");
            document.getElementById(field.name + "-error").textContent = errors[field.name];
        });
        document.querySelector("#form-status").textContent = "Completa los campos indicados para preparar tu consulta.";
        invalid[0].focus();
        return;
    }
    const commune = form.elements.commune.value.trim(), details = form.elements.details.value.trim();
    const message = `Hola SIEM, quisiera consultar por un servicio.\n\nPara: ${form.elements.audience.value}\nEquipo: ${equipment.value}\nNecesidad: ${need.value}\nComuna: ${commune}${details ? "\nDetalles: " + details : ""}\n\n¿Podrían confirmar cobertura, disponibilidad y alcance?`;
    const url = "https://wa.me/56976567936?text=" + encodeURIComponent(message);
    window.open(url, "_blank", "noopener,noreferrer");
    const status = document.querySelector("#form-status");
    status.replaceChildren(document.createTextNode("Tu consulta está preparada. Revisa el mensaje en WhatsApp antes de enviarlo. Si no se abrió, "));
    const fallback = document.createElement("a");
    fallback.href = url;
    fallback.textContent = "abre tu consulta aquí";
    fallback.target = "_blank";
    fallback.rel = "noopener noreferrer";
    status.append(fallback);
    animateChange(status);
});

form.addEventListener("input", () => {
    document.querySelector("#form-status").replaceChildren();
});

const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

function animateChange(element) {
    if (reducedMotion.matches || !element.animate) return;
    element.getAnimations().forEach(animation => animation.cancel());
    element.animate([ {
        opacity: .4,
        transform: "translateY(4px)"
    }, {
        opacity: 1,
        transform: "none"
    } ], {
        duration: 200,
        easing: "ease-out"
    });
}

reducedMotion.addEventListener("change", () => {
    if (reducedMotion.matches) document.getAnimations().forEach(animation => animation.cancel());
});

document.querySelectorAll('a[href^="#"]').forEach(link => link.addEventListener("click", event => {
    const target = document.querySelector(link.getAttribute("href"));
    if (!target) return;
    event.preventDefault();
    closeMenu();
    target.setAttribute("tabindex", "-1");
    target.focus({
        preventScroll: true
    });
    target.scrollIntoView({
        behavior: reducedMotion.matches ? "instant" : "smooth",
        block: "start"
    });
    history.replaceState(null, "", link.getAttribute("href"));
}));

let navigationFrame = 0;

function updateNavigation() {
    navigationFrame = 0;
    const readingLine = document.querySelector(".header").getBoundingClientRect().bottom + 28, atBottom = scrollY + innerHeight >= document.documentElement.scrollHeight - 2;
    document.querySelectorAll("nav a,.header-contact").forEach(link => {
        const section = document.querySelector(link.hash), rect = section.getBoundingClientRect();
        if (!atBottom && rect.top <= readingLine && rect.bottom > readingLine) link.setAttribute("aria-current", "location"); else link.removeAttribute("aria-current");
    });
}

function scheduleNavigationUpdate() {
    if (!navigationFrame) navigationFrame = requestAnimationFrame(updateNavigation);
}

window.addEventListener("scroll", scheduleNavigationUpdate, {
    passive: true
});

window.addEventListener("resize", scheduleNavigationUpdate);

window.addEventListener("load", scheduleNavigationUpdate);

document.fonts.ready.then(scheduleNavigationUpdate);

scheduleNavigationUpdate();

if ("IntersectionObserver" in window) {
    const entranceObserver = new IntersectionObserver(entries => entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        entranceObserver.unobserve(entry.target);
        if (!reducedMotion.matches && entry.target.animate) entry.target.animate([ {
            opacity: .6,
            transform: "translateY(8px)"
        }, {
            opacity: 1,
            transform: "none"
        } ], {
            duration: 280,
            easing: "ease-out"
        });
    }), {
        threshold: .12
    });
    document.querySelectorAll(".section-head,.field-copy,.report-grid").forEach(element => {
        if (element.getBoundingClientRect().top > innerHeight) entranceObserver.observe(element);
    });
}
