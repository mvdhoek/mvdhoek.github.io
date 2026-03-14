function initImageSliders() {
  const sliders = document.querySelectorAll("[data-image-slider]");

  sliders.forEach((slider) => {
    if (slider.dataset.ready === "true") return;
    slider.dataset.ready = "true";

    const slides = Array.from(slider.querySelectorAll("[data-slide]"));
    const dots = Array.from(slider.querySelectorAll("[data-dot]"));
    const metaToggles = Array.from(slider.querySelectorAll("[data-meta-toggle]"));
    const prevButton = slider.querySelector("[data-prev]");
    const nextButton = slider.querySelector("[data-next]");
    const autoplay = slider.dataset.autoplay === "true";
    const showMeta = slider.dataset.showMeta !== "false";
    const interval = Number(slider.dataset.interval || 5000);

    if (slides.length === 0) return;

    let activeIndex = 0;
    let autoplayId = null;

    const closeAllMetaPanels = () => {
      metaToggles.forEach((toggle) => {
        toggle.setAttribute("aria-expanded", "false");
      });
      slider.querySelectorAll("[data-meta-panel]").forEach((panel) => {
        panel.hidden = true;
      });
    };

    const stopAutoplay = () => {
      window.clearInterval(autoplayId);
      autoplayId = null;
    };

    const setActiveSlide = (index) => {
      activeIndex = (index + slides.length) % slides.length;

      slides.forEach((slide, slideIndex) => {
        const isActive = slideIndex === activeIndex;
        slide.classList.toggle("is-active", isActive);
        slide.setAttribute("aria-hidden", String(!isActive));
        if (!isActive) {
          const toggle = slide.querySelector("[data-meta-toggle]");
          const panel = slide.querySelector("[data-meta-panel]");
          if (toggle) toggle.setAttribute("aria-expanded", "false");
          if (panel) panel.hidden = true;
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

          closeAllMetaPanels();

          if (nextState) {
            toggle.setAttribute("aria-expanded", "true");
            panel.hidden = false;
            stopAutoplay();
          } else {
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
      const hadOpenPanel = slider.querySelector('[data-meta-toggle][aria-expanded="true"]');
      closeAllMetaPanels();
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
