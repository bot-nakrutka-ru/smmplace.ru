/* Standalone SMMplace: no WordPress/PHP, no external libraries. */
(() => {
  'use strict';
  const root = document;
  const norm = s => String(s || '').toLocaleLowerCase('ru-RU').replace(/ё/g, 'е').trim();
  const mobile = root.querySelector('[data-mobile-toggle]');
  const nav = root.querySelector('#main-nav');
  if (mobile && nav) mobile.addEventListener('click', () => {
    const open = nav.classList.toggle('is-open');
    mobile.setAttribute('aria-expanded', String(open));
    mobile.querySelector('span:first-child').textContent = open ? '✕' : '☰';
  });
  root.addEventListener('click', ev => {
    for (const dd of root.querySelectorAll('.nav-menu[open]')) {
      if (!dd.contains(ev.target)) dd.removeAttribute('open');
    }
  });
  const dialog = root.querySelector('#add-service-modal');
  root.querySelectorAll('[data-open-modal]').forEach(button => button.addEventListener('click', () => {
    if (dialog && typeof dialog.showModal === 'function') dialog.showModal();
  }));
  if (dialog) {
    dialog.querySelector('[data-close-modal]')?.addEventListener('click', () => dialog.close());
    dialog.addEventListener('click', event => { if (event.target === dialog) dialog.close(); });
    dialog.querySelector('form')?.addEventListener('submit', event => {
      event.preventDefault();
      const notice = dialog.querySelector('.form-notice');
      if (notice) notice.hidden = false;
    });
  }
  root.querySelectorAll('[data-tabs]').forEach(tabs => {
    const controls = Array.from(tabs.querySelectorAll('[data-tab]'));
    const panels = Array.from(tabs.querySelectorAll('[data-panel]'));
    controls.forEach((button, i) => {
      const panel = panels.find(p => Number(p.dataset.panel) === Number(button.dataset.tab));
      if (panel) {
        const id = `smm-tab-${Math.random().toString(36).slice(2)}`;
        button.id = id;
        panel.setAttribute('aria-labelledby', id);
      }
      button.addEventListener('click', () => {
        controls.forEach(b => { const active = b === button; b.classList.toggle('is-active', active); b.setAttribute('aria-selected', String(active)); });
        panels.forEach(p => p.classList.toggle('is-active', Number(p.dataset.panel) === Number(button.dataset.tab)));
      });
      button.addEventListener('keydown', ev => {
        if (ev.key === 'ArrowLeft' || ev.key === 'ArrowRight') {
          ev.preventDefault();
          const delta = ev.key === 'ArrowRight' ? 1 : -1;
          const next = controls[(i + delta + controls.length) % controls.length];
          next.focus(); next.click();
        }
      });
    });
  });
  root.querySelectorAll('[data-local-review]').forEach(form => {
    form.addEventListener('submit', event => {
      event.preventDefault();
      const notice = form.querySelector('.form-notice');
      if (notice) notice.hidden = false;
    });
  });
  root.querySelectorAll('[data-catalog]').forEach(catalog => {
    const grid = catalog.querySelector('[data-card-container]');
    const cards = Array.from(grid?.querySelectorAll('.service-tile') || []);
    const search = catalog.querySelector('[data-search-input]');
    const tag = catalog.querySelector('[data-tag-filter]');
    const sort = catalog.querySelector('[data-sort-filter]');
    const count = catalog.querySelector('[data-result-count]');
    const empty = catalog.querySelector('[data-empty]');
    const catButtons = Array.from(catalog.querySelectorAll('[data-category-button]'));
    let category = catalog.dataset.fixedCat || '';
    const fixedTag = catalog.dataset.fixedTag || '';
    const urlParams = new URLSearchParams(window.location.search);
    if (search) search.value = urlParams.get('q') || urlParams.get('s') || '';
    let activeSearch = norm(search?.value);
    let raf;
    function apply() {
      const selectedTag = tag?.value || fixedTag;
      const order = sort?.value || 'rating';
      let visible = cards.filter(card => {
        const text = norm(card.dataset.search);
        return (!activeSearch || text.includes(activeSearch)) &&
          (!selectedTag || card.dataset.tags?.includes('|' + selectedTag + '|')) &&
          (!category || card.dataset.cat?.includes('|' + category + '|'));
      });
      if (order === 'free') visible = visible.filter(c => c.dataset.free === '1');
      if (order === 'trial') visible = visible.filter(c => c.dataset.demo === '1');
      if (order === 'choice') visible = visible.filter(c => c.dataset.choice === '1');
      visible.sort((a,b) => {
        if (order === 'popular') return Number(b.dataset.views) - Number(a.dataset.views) || Number(b.dataset.rating) - Number(a.dataset.rating);
        return Number(b.dataset.rating) - Number(a.dataset.rating) || Number(b.dataset.views) - Number(a.dataset.views);
      });
      const selected = new Set(visible);
      cards.forEach(c => { c.hidden = !selected.has(c); });
      visible.forEach(c => grid.appendChild(c));
      if (count) count.textContent = String(visible.length);
      if (empty) empty.hidden = visible.length !== 0;
    }
    search?.addEventListener('input', () => {
      activeSearch = norm(search.value);
      window.cancelAnimationFrame(raf);
      raf = window.requestAnimationFrame(apply);
    });
    catalog.querySelector('[data-live-search]')?.addEventListener('submit', e => { e.preventDefault(); activeSearch = norm(search?.value); apply(); });
    tag?.addEventListener('change',apply);
    sort?.addEventListener('change',apply);
    catButtons.forEach(btn => btn.addEventListener('click', () => {
      category = btn.dataset.categoryButton || '';
      catButtons.forEach(b => b.classList.toggle('is-active', b === btn));
      apply();
    }));
    catalog.querySelector('[data-reset-filter]')?.addEventListener('click', () => {
      if (search) search.value = '';
      if (tag) tag.value = '';
      if (sort) sort.value = 'rating';
      activeSearch = ''; category = catalog.dataset.fixedCat || '';
      catButtons.forEach(b => b.classList.toggle('is-active', (b.dataset.categoryButton || '') === category));
      apply();
    });
    apply();
  });
})();
