(() => {
    "use strict";
    const config = window.SIEM_SUMMER_CAMPAIGN;
    if (!config) return;
    const root = document.documentElement;
    const hero = document.querySelector("#inicio");
    const eyebrow = hero.querySelector(".eyebrow");
    const title = hero.querySelector("h1");
    const description = hero.querySelector(".hero-description");
    const secondary = hero.querySelector(".hero-direct");
    const business = document.querySelector(".business .audience-copy > span");
    const home = document.querySelector(".home .audience-copy > span");
    const routes = document.querySelector("#summer-home-routes");
    const originals = new Map([ eyebrow, title, description, secondary, business, home ].map(element => [ element, element.innerHTML ]));
    const originalHref = secondary.getAttribute("href");
    let state = "original";
    let timer;
    function phase(now) {
        const start = Date.parse(config.startsAt);
        const summer = Date.parse(config.summerAt);
        const end = Date.parse(config.endsAt);
        if (config.enabled !== true || ![ now, start, summer, end ].every(Number.isFinite) || !(start < summer && summer < end) || now < start || now >= end) return "original";
        return now < summer ? "preparation" : "summer";
    }
    function syncAudience(context) {
        const selected = context === void 0 ? document.querySelector('[data-audience][aria-current="true"]')?.dataset.audience : context;
        routes.hidden = state === "original" || selected !== "Hogar";
    }
    function apply(next) {
        if (next === state) return;
        state = next;
        if (state === "original") {
            originals.forEach((html, element) => {
                element.innerHTML = html;
            });
            secondary.setAttribute("href", originalHref);
            root.removeAttribute("data-campaign");
        } else {
            const copy = config[state];
            root.dataset.campaign = "summer";
            const sun = document.createElement("span");
            sun.className = "campaign-sun";
            sun.setAttribute("aria-hidden", "true");
            sun.textContent = "☀";
            eyebrow.replaceChildren(sun, document.createTextNode(copy.eyebrow));
            const support = document.createElement("em");
            support.textContent = config.support;
            title.replaceChildren(document.createTextNode(copy.headline), support);
            description.textContent = config.description;
            business.textContent = copy.business;
            home.textContent = config.home;
            secondary.textContent = config.calculatorLabel + " ↓";
            secondary.setAttribute("href", "#calculadora-btu");
        }
        syncAudience();
    }
    function refresh() {
        clearTimeout(timer);
        const now = Date.now();
        apply(phase(now));
        const upcoming = [ config.startsAt, config.summerAt, config.endsAt ].map(Date.parse).filter(time => time > now);
        const delay = Math.min(6e4, ...upcoming.map(time => time - now));
        timer = setTimeout(refresh, Math.max(1, delay));
    }
    function jumpToCalculator(event) {
        if (state === "original" || event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
        event.preventDefault();
        event.stopImmediatePropagation();
        document.querySelector("#btu-tool").open = true;
        const section = document.querySelector("#calculadora-btu");
        section.setAttribute("tabindex", "-1");
        section.focus({
            preventScroll: true
        });
        section.scrollIntoView({
            behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth",
            block: "start"
        });
        history.replaceState(null, "", "#calculadora-btu");
    }
    secondary.addEventListener("click", jumpToCalculator, true);
    routes.querySelector('[href="#calculadora-btu"]').addEventListener("click", jumpToCalculator, true);
    routes.querySelector('[href="#cotizar"]').addEventListener("click", () => {
        if (state === "original") return;
        const form = document.querySelector("#quote-form");
        const equipment = form.elements.equipment;
        const need = form.elements.need;
        if (!equipment.value) {
            equipment.value = "Aire acondicionado";
            equipment.dispatchEvent(new Event("change", {
                bubbles: true
            }));
        }
        if (equipment.value === "Aire acondicionado" && !need.value) {
            need.value = "Mantención";
            need.dispatchEvent(new Event("change", {
                bubbles: true
            }));
        }
    });
    function resume() {
        refresh();
        if (state !== "original" && location.hash === "#calculadora-btu") document.querySelector("#btu-tool").open = true;
    }
    window.SIEMCampaign = {
        refresh: refresh,
        syncAudience: syncAudience,
        get state() {
            return state;
        }
    };
    document.addEventListener("visibilitychange", () => {
        if (!document.hidden) resume();
    });
    window.addEventListener("pageshow", resume);
    window.addEventListener("focus", refresh);
    window.addEventListener("hashchange", resume);
    resume();
})();
