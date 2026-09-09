(() => {
  const libraryRoot = document.querySelector('[data-library]');
  if (libraryRoot) {
    const cards = [...libraryRoot.querySelectorAll('[data-filter-items] [data-topic]')];
    const empty = libraryRoot.querySelector('[data-library-empty]');
    const buttons = [...libraryRoot.querySelectorAll('[data-topic-filter]')];
    const summary = libraryRoot.querySelector('[data-filter-summary]');
    const params = new URLSearchParams(window.location.search);
    const initialTopic = params.get('topic') || 'all';
    const applyFilter = (topic, syncUrl = true) => {
      let visible = 0;
      cards.forEach(card => {
        const match = topic === 'all' || card.dataset.topic === topic;
        card.classList.toggle('hidden', !match);
        if (match) visible += 1;
      });
      if (summary) summary.textContent = `${visible} item${visible === 1 ? '' : 's'} visible${topic === 'all' ? '.' : ` in ${buttons.find(button => button.dataset.topicFilter === topic)?.textContent || 'selected topic'}.`}`;
      if (empty) empty.classList.toggle('is-visible', visible === 0);
      buttons.forEach(button => button.classList.toggle('is-active', button.dataset.topicFilter === topic));
      if (syncUrl) {
        if (topic === 'all') params.delete('topic');
        else params.set('topic', topic);
        history.replaceState({}, '', `${window.location.pathname}${params.toString() ? `?${params}` : ''}`);
      }
    };
    buttons.forEach(button => button.addEventListener('click', () => applyFilter(button.dataset.topicFilter)));
    applyFilter(buttons.some(button => button.dataset.topicFilter === initialTopic) ? initialTopic : 'all', false);
  }

  const searchPage = document.querySelector('[data-search-page]');
  if (!searchPage) return;
  const input = document.getElementById('search-input');
  const meta = document.getElementById('search-meta');
  const resultsNode = document.getElementById('search-results');
  const empty = document.getElementById('search-empty');
  const topicButtons = [...searchPage.querySelectorAll('[data-search-topic]')];
  const params = new URLSearchParams(window.location.search);
  let activeTopic = params.get('topic') || 'all';
  input.value = params.get('q') || '';

  fetch('/data/search-index.json')
    .then(response => response.json())
    .then(items => {
      const render = () => {
        const query = input.value;
        const normalized = query.trim().toLowerCase();
        const matches = items.filter(item => {
          const topicMatch = activeTopic === 'all' || item.topicSlug === activeTopic;
          const queryMatch = !normalized || item.searchText.includes(normalized);
          return topicMatch && queryMatch;
        });
        const contentLabel = item => item.contentType === 'carousel' ? 'Carousel' : 'Article';
        const actionLabel = item => item.contentType === 'carousel' ? 'Open curiosity layer' : 'Open article';
        resultsNode.innerHTML = matches.map(item => `
          <a class="search-result reveal is-visible" href="${item.url}">
            <span class="content-tag">${contentLabel(item)}</span>
            <p class="eyebrow">${item.topic}</p>
            <h2>${item.title}</h2>
            <p>${item.summary}</p>
            <div class="search-result__meta">${item.metaLabel}</div>
            <span class="card-action">${actionLabel(item)}</span>
          </a>`).join('');
        const stateLabel = normalized ? ` for “${query}”` : '';
        const topicLabel = activeTopic === 'all' ? '' : ` in ${topicButtons.find(button => button.dataset.searchTopic === activeTopic)?.textContent || 'selected topic'}`;
        meta.textContent = `${matches.length} published item${matches.length === 1 ? '' : 's'}${stateLabel}${topicLabel}.`;
        empty.classList.toggle('is-visible', matches.length === 0);
        topicButtons.forEach(button => button.classList.toggle('is-active', button.dataset.searchTopic === activeTopic));
        if (normalized) params.set('q', query); else params.delete('q');
        if (activeTopic === 'all') params.delete('topic'); else params.set('topic', activeTopic);
        history.replaceState({}, '', `${window.location.pathname}${params.toString() ? `?${params}` : ''}`);
      };

      topicButtons.forEach(button => {
        button.addEventListener('click', () => {
          activeTopic = button.dataset.searchTopic;
          render();
        });
      });
      input.addEventListener('input', render);
      if (!topicButtons.some(button => button.dataset.searchTopic === activeTopic)) activeTopic = 'all';
      render();
    })
    .catch(() => {
      meta.textContent = 'Search index unavailable.';
      empty.classList.add('is-visible');
    });
})();
