(function() {
    "use strict";
    const gallery = document.getElementById("work-gallery");
    if (!gallery) return;
    const stage = document.getElementById("gallery-stage"), slides = [ ...gallery.querySelectorAll(".gallery-slide") ], thumbs = [ ...gallery.querySelectorAll(".gallery-thumb") ];
    const play = document.getElementById("gallery-play"), count = document.getElementById("gallery-count"), caption = document.getElementById("gallery-caption"), live = document.getElementById("gallery-live");
    const motion = matchMedia("(prefers-reduced-motion: reduce)"), interval = 6500;
    let current = 0, wantsPlay = !motion.matches, inView = false, hovered = false, timer = 0, busy = false, queued = null, pointer = null, animations = [], playIntent = null;
    gallery.querySelector(".gallery-controls").hidden = false;
    gallery.querySelector(".gallery-thumbnails").hidden = false;
    function updatePlay() {
        const active = wantsPlay && !motion.matches;
        document.getElementById("gallery-play-label").textContent = active ? "Pausar" : "Reproducir";
        document.getElementById("gallery-play-icon").textContent = active ? "Ⅱ" : "▶";
        play.setAttribute("aria-label", active ? "Pausar el avance automático" : "Iniciar el avance automático");
        play.disabled = motion.matches;
        document.getElementById("gallery-help").textContent = motion.matches ? "El avance automático está desactivado por tu preferencia de movimiento reducido. Usa las flechas o elige una imagen." : active ? "Las fotos avanzan automáticamente. Puedes pausarlas o elegir una imagen." : "La galería está en pausa. Usa las flechas, elige una imagen o pulsa Reproducir.";
    }
    function schedule() {
        clearTimeout(timer);
        timer = 0;
        if (wantsPlay && !motion.matches && inView && !hovered && !document.hidden && !busy) timer = setTimeout(() => show((current + 1) % slides.length, 1, false), interval);
    }
    function pause() {
        wantsPlay = false;
        updatePlay();
        schedule();
    }
    function updateSelection(manual) {
        count.textContent = String(current + 1).padStart(2, "0") + " / " + slides.length;
        count.setAttribute("aria-label", "Foto " + (current + 1) + " de " + slides.length);
        caption.textContent = slides[current].dataset.title;
        thumbs.forEach((thumb, i) => {
            if (i === current) thumb.setAttribute("aria-current", "true"); else thumb.removeAttribute("aria-current");
        });
        const strip = gallery.querySelector(".gallery-thumbnails"), thumb = thumbs[current];
        const left = strip.scrollLeft + thumb.getBoundingClientRect().left - strip.getBoundingClientRect().left - (strip.clientWidth - thumb.clientWidth) / 2;
        strip.scrollTo({
            left: left,
            behavior: motion.matches ? "instant" : "smooth"
        });
        if (manual) live.textContent = "Foto " + (current + 1) + " de " + slides.length + ": " + slides[current].dataset.title;
    }
    async function show(index, direction = 1, manual = true) {
        index = (index + slides.length) % slides.length;
        if (manual) pause();
        if (busy) {
            queued = {
                index: index,
                direction: direction,
                manual: manual
            };
            return;
        }
        if (index === current) {
            schedule();
            return;
        }
        clearTimeout(timer);
        timer = 0;
        busy = true;
        const previous = slides[current], next = slides[index];
        current = index;
        previous.setAttribute("aria-hidden", "true");
        next.hidden = false;
        next.removeAttribute("aria-hidden");
        updateSelection(manual);
        if (!motion.matches && next.animate) {
            const options = {
                duration: 620,
                easing: "cubic-bezier(.22,.61,.36,1)",
                fill: "both"
            };
            animations = [ previous.animate([ {
                transform: "translateX(0)"
            }, {
                transform: `translateX(${-direction * 100}%)`
            } ], options), next.animate([ {
                transform: `translateX(${direction * 100}%)`
            }, {
                transform: "translateX(0)"
            } ], options) ];
            await Promise.allSettled(animations.map(a => a.finished));
        }
        previous.hidden = true;
        previous.removeAttribute("aria-hidden");
        animations.forEach(a => a.cancel());
        animations = [];
        busy = false;
        if (queued) {
            const request = queued;
            queued = null;
            show(request.index, request.direction, request.manual);
        } else schedule();
    }
    const step = direction => show((queued?.index ?? current) + direction, direction, true);
    document.getElementById("gallery-prev").addEventListener("click", () => step(-1));
    document.getElementById("gallery-next").addEventListener("click", () => step(1));
    thumbs.forEach((thumb, i) => thumb.addEventListener("click", () => show(i, i < current ? -1 : 1, true)));
    play.addEventListener("pointerdown", () => {
        playIntent = !wantsPlay;
    });
    play.addEventListener("pointercancel", () => {
        playIntent = null;
    });
    play.addEventListener("keydown", () => {
        playIntent = null;
    });
    play.addEventListener("blur", () => {
        playIntent = null;
    });
    play.addEventListener("click", () => {
        if (motion.matches) return;
        wantsPlay = playIntent ?? !wantsPlay;
        playIntent = null;
        updatePlay();
        schedule();
    });
    gallery.addEventListener("keydown", event => {
        if (event.altKey || event.ctrlKey || event.metaKey) return;
        if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
            event.preventDefault();
            step(event.key === "ArrowLeft" ? -1 : 1);
        }
    });
    gallery.addEventListener("focusin", pause);
    gallery.addEventListener("pointerenter", event => {
        if (event.pointerType === "mouse") {
            hovered = true;
            schedule();
        }
    });
    gallery.addEventListener("pointerleave", event => {
        if (event.pointerType === "mouse") {
            hovered = false;
            schedule();
        }
    });
    stage.addEventListener("pointerdown", event => {
        if (event.button !== 0 || !event.isPrimary) return;
        pointer = {
            id: event.pointerId,
            x: event.clientX,
            y: event.clientY
        };
        stage.setPointerCapture(event.pointerId);
    });
    stage.addEventListener("pointerup", event => {
        if (!pointer || event.pointerId !== pointer.id) return;
        const dx = event.clientX - pointer.x, dy = event.clientY - pointer.y;
        pointer = null;
        if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy) * 1.3) step(dx < 0 ? 1 : -1);
    });
    stage.addEventListener("pointercancel", () => {
        pointer = null;
    });
    stage.addEventListener("dragstart", event => event.preventDefault());
    document.addEventListener("visibilitychange", () => {
        if (document.hidden) animations.forEach(a => a.finish());
        schedule();
    });
    motion.addEventListener("change", () => {
        if (motion.matches) {
            wantsPlay = false;
            animations.forEach(a => a.finish());
        }
        updatePlay();
        schedule();
    });
    if ("IntersectionObserver" in window) new IntersectionObserver(entries => {
        inView = entries[0].isIntersecting && entries[0].intersectionRatio >= .25;
        schedule();
    }, {
        threshold: [ 0, .25 ]
    }).observe(stage); else inView = true;
    updatePlay();
    schedule();
})();
