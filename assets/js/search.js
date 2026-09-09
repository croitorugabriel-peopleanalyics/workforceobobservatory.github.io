(() => {
  const renderArticleCard = item => `
    <a class="article-card" href="${item.url}" data-topic="${item.topicSlug}" data-search="${[item.title, item.summary, item.topic, ...(item.keywords || [])].join(' ').toLowerCase()}">
      <p class="eyebrow">${item.topic}</p>
      <h3>${item.title}</h3>
      <p>${item.summary}</p>
      <div class="article-card__meta">
        <span>${item.readingMinutes} min read</span>
        <span>${item.publishLabel}</span>
      </div>
    </a>`;

  const libraryRoot = document.querySelector('[data-library]');
  if (libraryRoot) {
    const cards = [...libraryRoot.querySelectorAll('[data-filter-items] [data-topic]')];
    const empty = libraryRoot.querySelector('[data-library-empty]');
    const buttons = [...libraryRoot.querySelectorAll('[data-topic-filter]')];
    const applyFilter = topic => {
      let visible = 0;
      cards.forEach(card => {
        const match = topic === 'all' || card.dataset.topic === topic;
        card.classList.toggle('hidden', !match);
        if (match) visible += 1;
      });
      if (empty) empty.classList.toggle('is-visible', visible === 0);
      buttons.forEach(button => button.classList.toggle('is-active', button.dataset.topicFilter === topic));
    };
    buttons.forEach(button => button.addEventListener('click', () => applyFilter(button.dataset.topicFilter)));
    applyFilter('all');
  }

  const searchPage = document.querySelector('[data-search-page]');
  if (!searchPage) return;
  const input = document.getElementById('search-input');
  const meta = document.getElementById('search-meta');
  const resultsNode = document.getElementById('search-results');
  const empty = document.getElementById('search-empty');
  fetch('/data/search-index.json')
    .then(response => response.json())
    .then(items => {
      const render = query => {
        const normalized = query.trim().toLowerCase();
        const matches = normalized
          ? items.filter(item => item.searchText.includes(normalized))
          : [];
        resultsNode.innerHTML = matches.map(item => `
          <a class="search-result" href="${item.url}">
            <p class="eyebrow">${item.topic}</p>
            <h2>${item.title}</h2>
            <p>${item.summary}</p>
            <div class="search-result__meta">${item.readingMinutes} min read · ${item.publishLabel}</div>
          </a>`).join('');
        meta.textContent = normalized ? `${matches.length} published result${matches.length === 1 ? '' : 's'} for “${query}”.` : 'Start typing to search the published library.';
        empty.classList.toggle('is-visible', matches.length === 0);
      };
      input.addEventListener('input', event => render(event.target.value));
      render(input.value || '');
    })
    .catch(() => {
      meta.textContent = 'Search index unavailable.';
      empty.classList.add('is-visible');
    });
})();
