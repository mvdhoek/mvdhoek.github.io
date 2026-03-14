document.addEventListener("DOMContentLoaded", () => {
  const sliders = document.querySelectorAll("[data-image-slider]");

  sliders.forEach((slider) => {
    const slides = Array.from(slider.querySelectorAll("[data-slide]"));
    const dots = Array.from(slider.querySelectorAll("[data-dot]"));
    const prevButton = slider.querySelector("[data-prev]");
    const nextButton = slider.querySelector("[data-next]");
    const autoplay = slider.dataset.autoplay === "true";
    const interval = Number(slider.dataset.interval || 5000);

    if (slides.length === 0) return;

    let activeIndex = 0;
    let autoplayId = null;

    const setActiveSlide = (index) => {
      activeIndex = (index + slides.length) % slides.length;

      slides.forEach((slide, slideIndex) => {
        const isActive = slideIndex === activeIndex;
        slide.classList.toggle("is-active", isActive);
        slide.setAttribute("aria-hidden", String(!isActive));
      });

      dots.forEach((dot, dotIndex) => {
        const isActive = dotIndex === activeIndex;
        dot.classList.toggle("is-active", isActive);
        dot.setAttribute("aria-pressed", String(isActive));
      });
    };

    const resetAutoplay = () => {
      if (!autoplay || slides.length < 2) return;
      window.clearInterval(autoplayId);
      autoplayId = window.setInterval(() => {
        setActiveSlide(activeIndex + 1);
      }, interval);
    };

    const step = (direction) => {
      setActiveSlide(activeIndex + direction);
      resetAutoplay();
    };

    prevButton?.addEventListener("click", () => step(-1));
    nextButton?.addEventListener("click", () => step(1));

    dots.forEach((dot, index) => {
      dot.addEventListener("click", () => {
        setActiveSlide(index);
        resetAutoplay();
      });
    });

    slider.addEventListener("keydown", (event) => {
      if (event.key === "ArrowLeft") step(-1);
      if (event.key === "ArrowRight") step(1);
    });

    setActiveSlide(0);
    resetAutoplay();
  });
});
