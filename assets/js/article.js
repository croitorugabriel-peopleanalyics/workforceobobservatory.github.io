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
    }, { rootMargin: '-20% 0px -60% 0px', threshold: 0 });
    sections.forEach(section => active.observe(section));
  }

  document.querySelectorAll('[data-viz-root]').forEach(root => {
    const tabs = [...root.querySelectorAll('[data-viz-tab]')];
    const panels = [...root.querySelectorAll('[data-viz-panel]')];
    const activate = index => {
      tabs.forEach(tab => {
        const selected = Number(tab.dataset.vizTab) === index;
        tab.classList.toggle('is-active', selected);
        tab.setAttribute('aria-pressed', selected ? 'true' : 'false');
      });
      panels.forEach(panel => {
        panel.classList.toggle('is-active', Number(panel.dataset.vizPanel) === index);
      });
    };
    tabs.forEach(tab => tab.addEventListener('click', () => activate(Number(tab.dataset.vizTab))));
    activate(0);
  });

  document.querySelectorAll('[data-share="copy"]').forEach(button => {
    button.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(window.location.href);
        button.textContent = 'Link copied';
        window.setTimeout(() => {
          button.textContent = 'Copy article link';
        }, 1800);
      } catch {
        button.textContent = 'Copy failed';
      }
    });
  });
})();
