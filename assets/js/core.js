(() => {
  document.documentElement.classList.add('js');
  const yearTarget = document.querySelector('[data-current-year]');
  if (yearTarget) yearTarget.textContent = new Date().getFullYear();

  const reveals = [...document.querySelectorAll('.reveal')];
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) entry.target.classList.add('is-visible');
      });
    }, { threshold: 0.18 });
    reveals.forEach(node => observer.observe(node));
  } else {
    reveals.forEach(node => node.classList.add('is-visible'));
  }

  const motionAllowed = !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const parallaxNodes = motionAllowed ? [...document.querySelectorAll('[data-parallax]')] : [];
  if (parallaxNodes.length) {
    const updateParallax = () => {
      const scrollTop = Math.min(window.scrollY, 480);
      parallaxNodes.forEach(node => {
        const factor = Number(node.dataset.parallax || 0);
        node.style.transform = `translateY(${scrollTop * factor}px)`;
      });
    };
    updateParallax();
    window.addEventListener('scroll', updateParallax, { passive: true });
  }
})();
