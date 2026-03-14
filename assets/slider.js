function initImageSliders() {
  const parseDmsPart = (part) => {
    if (!part) return null;

    const match = part.trim().match(/(\d+(?:\.\d+)?)°\s*(\d+(?:\.\d+)?)'\s*(\d+(?:\.\d+)?)"\s*([NSEW])/i);
    if (!match) return null;

    const degrees = Number(match[1]);
    const minutes = Number(match[2]);
    const seconds = Number(match[3]);
    const hemisphere = match[4].toUpperCase();

    let decimal = degrees + minutes / 60 + seconds / 3600;
    if (hemisphere === "S" || hemisphere === "W") decimal *= -1;
    return decimal;
  };

  const parseCoordinatePair = (value) => {
    if (!value) return null;

    const parts = value.match(/\d+(?:\.\d+)?°\s*\d+(?:\.\d+)?'\s*\d+(?:\.\d+)?"\s*[NSEW]/gi);
    if (!parts || parts.length < 2) return null;

    const lat = parseDmsPart(parts[0]);
    const lng = parseDmsPart(parts[1]);

    if (lat === null || lng === null) return null;
    return { lat, lng };
  };

  const sliders = document.querySelectorAll("[data-image-slider]");

  sliders.forEach((slider) => {
    if (slider.dataset.ready === "true") return;
    slider.dataset.ready = "true";

    const slides = Array.from(slider.querySelectorAll("[data-slide]"));
    const dots = Array.from(slider.querySelectorAll("[data-dot]"));
    const metaToggles = Array.from(slider.querySelectorAll("[data-meta-toggle]"));
    const mapToggles = Array.from(slider.querySelectorAll("[data-map-toggle]"));
    const prevButton = slider.querySelector("[data-prev]");
    const nextButton = slider.querySelector("[data-next]");
    const autoplay = slider.dataset.autoplay === "true";
    const showMeta = slider.dataset.showMeta !== "false";
    const showLocationMap = slider.dataset.showLocationMap !== "false";
    const interval = Number(slider.dataset.interval || 5000);

    if (slides.length === 0) return;

    let activeIndex = 0;
    let autoplayId = null;

    const closeAllPanels = () => {
      metaToggles.forEach((toggle) => {
        toggle.setAttribute("aria-expanded", "false");
      });
      slider.querySelectorAll("[data-meta-panel]").forEach((panel) => {
        panel.hidden = true;
      });
      mapToggles.forEach((toggle) => {
        toggle.setAttribute("aria-expanded", "false");
      });
      slider.querySelectorAll("[data-map-panel]").forEach((panel) => {
        panel.hidden = true;
      });
    };

    const stopAutoplay = () => {
      window.clearInterval(autoplayId);
      autoplayId = null;
    };

    const hasOpenPanels = () =>
      Boolean(slider.querySelector('[data-meta-toggle][aria-expanded="true"], [data-map-toggle][aria-expanded="true"]'));

    const ensureMap = (panel) => {
      const canvas = panel?.querySelector("[data-map-canvas]");
      if (!canvas || !window.L) return null;
      if (canvas._leaflet_map_instance) return canvas._leaflet_map_instance;

      const coords = parseCoordinatePair(canvas.dataset.coords);
      if (!coords) return null;

      const { lat, lng } = coords;
      const zoom = Number(canvas.dataset.zoom || 11);

      const map = window.L.map(canvas, {
        zoomControl: false,
        attributionControl: true,
        dragging: true,
        scrollWheelZoom: true,
        doubleClickZoom: true,
        boxZoom: false,
        keyboard: false,
        tap: false,
        touchZoom: true
      }).setView([lat, lng], zoom);

      window.L.tileLayer("https://tile.openmaps.fr/opentopomap/{z}/{x}/{y}.png", {
        attribution:
          '&copy; <a href="https://github.com/sletuffe/OpenTopoMap">OpenTopoMap-R</a> <a href="https://openmaps.fr/donate">Donation</a> &copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 17
      }).addTo(map);

      canvas._leaflet_map_instance = map;
      return map;
    };

    const openMapPanel = (toggle, panel) => {
      panel.hidden = false;
      toggle.setAttribute("aria-expanded", "true");
      const map = ensureMap(panel);
      if (map) {
        window.setTimeout(() => {
          map.invalidateSize();
        }, 20);
      }
    };

    const setActiveSlide = (index) => {
      activeIndex = (index + slides.length) % slides.length;

      slides.forEach((slide, slideIndex) => {
        const isActive = slideIndex === activeIndex;
        slide.classList.toggle("is-active", isActive);
        slide.setAttribute("aria-hidden", String(!isActive));
        if (!isActive) {
          const metaToggle = slide.querySelector("[data-meta-toggle]");
          const metaPanel = slide.querySelector("[data-meta-panel]");
          const mapToggle = slide.querySelector("[data-map-toggle]");
          const mapPanel = slide.querySelector("[data-map-panel]");
          if (metaToggle) metaToggle.setAttribute("aria-expanded", "false");
          if (metaPanel) metaPanel.hidden = true;
          if (mapToggle) mapToggle.setAttribute("aria-expanded", "false");
          if (mapPanel) mapPanel.hidden = true;
        }
      });

      dots.forEach((dot, dotIndex) => {
        const isActive = dotIndex === activeIndex;
        dot.classList.toggle("is-active", isActive);
        dot.setAttribute("aria-pressed", String(isActive));
      });
    };

    const resetAutoplay = () => {
      if (!autoplay || slides.length < 2) return;
      if (hasOpenPanels()) return;
      stopAutoplay();
      autoplayId = window.setInterval(() => {
        setActiveSlide(activeIndex + 1);
      }, interval);
    };

    const step = (direction) => {
      setActiveSlide(activeIndex + direction);
      resetAutoplay();
    };

    if (prevButton) {
      prevButton.addEventListener("click", () => step(-1));
    }

    if (nextButton) {
      nextButton.addEventListener("click", () => step(1));
    }

    dots.forEach((dot, index) => {
      dot.addEventListener("click", () => {
        setActiveSlide(index);
        resetAutoplay();
      });
    });

    if (showMeta) {
      metaToggles.forEach((toggle) => {
        toggle.addEventListener("click", () => {
          const slide = toggle.closest("[data-slide]");
          const panel = slide?.querySelector("[data-meta-panel]");
          if (!panel) return;

          const nextState = toggle.getAttribute("aria-expanded") !== "true";

          if (nextState) {
            toggle.setAttribute("aria-expanded", "true");
            panel.hidden = false;
            stopAutoplay();
          } else {
            toggle.setAttribute("aria-expanded", "false");
            panel.hidden = true;
            resetAutoplay();
          }
        });
      });
    }

    if (showLocationMap) {
      mapToggles.forEach((toggle) => {
        toggle.addEventListener("click", () => {
          const slide = toggle.closest("[data-slide]");
          const panel = slide?.querySelector("[data-map-panel]");
          if (!panel) return;

          const nextState = toggle.getAttribute("aria-expanded") !== "true";

          if (nextState) {
            openMapPanel(toggle, panel);
            stopAutoplay();
          } else {
            toggle.setAttribute("aria-expanded", "false");
            panel.hidden = true;
            resetAutoplay();
          }
        });
      });
    }

    slider.addEventListener("keydown", (event) => {
      if (event.key === "ArrowLeft") step(-1);
      if (event.key === "ArrowRight") step(1);
    });

    slider.addEventListener("contextmenu", (event) => {
      if (event.target.closest("[data-protected-slide]")) {
        event.preventDefault();
      }
    });

    slider.addEventListener("dragstart", (event) => {
      if (event.target.closest("[data-protected-slide]")) {
        event.preventDefault();
      }
    });

    document.addEventListener("click", (event) => {
      if (event.target.closest("[data-image-slider]") === slider) return;
      const hadOpenPanel = slider.querySelector('[aria-expanded="true"]');
      closeAllPanels();
      if (hadOpenPanel) resetAutoplay();
    });

    setActiveSlide(0);
    resetAutoplay();
  });
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initImageSliders);
} else {
  initImageSliders();
}
