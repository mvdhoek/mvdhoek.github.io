document.addEventListener("DOMContentLoaded", () => {
  const slider = document.querySelector("[data-slider]");
  if (!slider) return;

  const slides = Array.from(slider.querySelectorAll("[data-slide]"));
  const dots = Array.from(slider.querySelectorAll("[data-dot]"));
  const currentLabel = slider.querySelector("[data-slide-current]");
  const prevButton = slider.querySelector("[data-prev]");
  const nextButton = slider.querySelector("[data-next]");

  if (slides.length < 2) return;

  let activeIndex = 0;
  let wheelLocked = false;
  let touchStartY = null;

  const formatIndex = (value) => String(value + 1).padStart(2, "0");

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

    if (currentLabel) currentLabel.textContent = formatIndex(activeIndex);
  };

  const step = (direction) => setActiveSlide(activeIndex + direction);

  prevButton?.addEventListener("click", () => step(-1));
  nextButton?.addEventListener("click", () => step(1));

  dots.forEach((dot, index) => {
    dot.addEventListener("click", () => setActiveSlide(index));
  });

  window.addEventListener("keydown", (event) => {
    if (event.key === "ArrowUp" || event.key === "ArrowLeft") step(-1);
    if (event.key === "ArrowDown" || event.key === "ArrowRight") step(1);
  });

  slider.addEventListener(
    "wheel",
    (event) => {
      if (wheelLocked || Math.abs(event.deltaY) < 12) return;
      wheelLocked = true;
      step(event.deltaY > 0 ? 1 : -1);
      window.setTimeout(() => {
        wheelLocked = false;
      }, 700);
    },
    { passive: true }
  );

  slider.addEventListener("touchstart", (event) => {
    touchStartY = event.changedTouches[0]?.clientY ?? null;
  });

  slider.addEventListener("touchend", (event) => {
    const touchEndY = event.changedTouches[0]?.clientY ?? null;
    if (touchStartY === null || touchEndY === null) return;
    const delta = touchStartY - touchEndY;
    if (Math.abs(delta) > 48) step(delta > 0 ? 1 : -1);
    touchStartY = null;
  });

  setActiveSlide(0);
});
