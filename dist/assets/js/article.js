(() => {
  const body = document.body;
  if (body.dataset.page !== 'article') return;

  const progressBar = document.querySelector('.reading-progress__bar');
  const updateProgress = () => {
    if (!progressBar) return;
    const doc = document.documentElement;
    const max = doc.scrollHeight - window.innerHeight;
    const ratio = max > 0 ? window.scrollY / max : 0;
    progressBar.style.width = `${Math.max(0, Math.min(1, ratio)) * 100}%`;
  };
  updateProgress();
  window.addEventListener('scroll', updateProgress, { passive: true });
  window.addEventListener('resize', updateProgress);

  const reveals = document.querySelectorAll('.reveal');
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

  const flowTargets = document.querySelectorAll('[data-flow]');
  flowTargets.forEach(target => {
    const steps = (target.dataset.flow || '').split('|').filter(Boolean);
    target.innerHTML = steps.map((step, index) => {
      const node = `<span class="flow-node">${step}</span>`;
      return index < steps.length - 1 ? `${node}<span class="flow-arrow">→</span>` : node;
    }).join('');
  });

  const sections = [...document.querySelectorAll('.article-main [id]')];
  const tocLinks = [...document.querySelectorAll('.toc a')];
  if (sections.length && tocLinks.length && 'IntersectionObserver' in window) {
    const active = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        tocLinks.forEach(link => link.classList.toggle('is-active', link.getAttribute('href') === `#${entry.target.id}`));
      });
    }, { rootMargin: '-25% 0px -60% 0px', threshold: 0 });
    sections.forEach(section => active.observe(section));
  }

  document.querySelectorAll('[data-share="copy"]').forEach(button => {
    button.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(window.location.href);
        button.textContent = 'Link copied';
      } catch {
        button.textContent = 'Copy failed';
      }
    });
  });
})();
