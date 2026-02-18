(function(){
  const btn = document.getElementById('menuButton');
  const drawer = document.getElementById('drawer');
  const closeBtn = document.getElementById('drawerClose');
  const scrim = document.getElementById('scrim');

  const focusableSelector = 'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])';
  let lastFocus = null;

  function openDrawer(){
    lastFocus = document.activeElement;
    drawer.classList.add('open');
    scrim.classList.add('open');
    drawer.setAttribute('aria-hidden', 'false');
    btn.setAttribute('aria-expanded', 'true');

    const firstLink = drawer.querySelector('.drawer-link');
    if (firstLink) firstLink.focus();
    document.body.style.overflow = 'hidden';
  }

  function closeDrawer(){
    drawer.classList.remove('open');
    scrim.classList.remove('open');
    drawer.setAttribute('aria-hidden', 'true');
    btn.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';

    if (lastFocus && typeof lastFocus.focus === 'function') lastFocus.focus();
  }

  btn.addEventListener('click', () => {
    const expanded = btn.getAttribute('aria-expanded') === 'true';
    expanded ? closeDrawer() : openDrawer();
  });

  if (closeBtn) closeBtn.addEventListener('click', closeDrawer);
  if (scrim) scrim.addEventListener('click', closeDrawer);

  // Close on ESC
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && drawer.classList.contains('open')) closeDrawer();
  });

  // Close after clicking a link
  drawer.querySelectorAll('a').forEach(a => a.addEventListener('click', closeDrawer));

  // Focus trap
  document.addEventListener('keydown', (e) => {
    if (!drawer.classList.contains('open')) return;
    if (e.key !== 'Tab') return;

    const focusables = drawer.querySelectorAll(focusableSelector);
    if (!focusables.length) return;

    const first = focusables[0];
    const last = focusables[focusables.length - 1];

    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  });

  // Footer year
  const y = document.getElementById('year');
  if (y) y.textContent = String(new Date().getFullYear());
})();

/* ===== Scrolling rails + accordions ===== */
(function(){
  function initRail(opts){
    const rail = document.querySelector(opts.railSel);
    const prev = document.querySelector(opts.prevSel);
    const next = document.querySelector(opts.nextSel);
    if (!rail) return;

    function step(){
      const card = rail.querySelector(opts.cardSel);
      if (!card) return 260;
      const gap = opts.gap ?? 12;
      return card.getBoundingClientRect().width + gap;
    }
    function update(){
      if (!prev || !next) return;
      const max = rail.scrollWidth - rail.clientWidth;
      const x = rail.scrollLeft;
      prev.disabled = x <= 2;
      next.disabled = x >= max - 2;
    }
    function scrollByDir(dir){
      rail.scrollBy({ left: dir * step(), behavior: "smooth" });
    }

    if (prev) prev.addEventListener("click", () => scrollByDir(-1));
    if (next) next.addEventListener("click", () => scrollByDir(1));

    rail.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    update();

    // Desktop nicety: wheel vertical scroll moves the rail horizontally
    rail.addEventListener("wheel", (e) => {
      if (!e.shiftKey && Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
        rail.scrollLeft += e.deltaY;
        e.preventDefault();
      }
    }, { passive: false });
  }

  // Project cards rail
  initRail({
    railSel: "[data-wg-rail]",
    prevSel: "[data-wg-scroll='prev']",
    nextSel: "[data-wg-scroll='next']",
    cardSel: ".wg-project-card",
    gap: 12
  });

  // Tool/Community/Platform rail
  initRail({
    railSel: "[data-tcp-rail]",
    prevSel: "[data-tcp-scroll='prev']",
    nextSel: "[data-tcp-scroll='next']",
    cardSel: ".tcp-card",
    gap: 12
  });

  // Attributions rail
  initRail({
    railSel: "[data-attr-rail]",
    prevSel: "[data-attr-scroll='prev']",
    nextSel: "[data-attr-scroll='next']",
    cardSel: ".attr-card",
    gap: 12
  });

  // Accordion behavior for project cards: only one <details> open at a time
  const detailsEls = Array.from(document.querySelectorAll(".wg-project-card__details"));
  detailsEls.forEach((d) => {
    d.addEventListener("toggle", () => {
      if (!d.open) return;
      detailsEls.forEach((other) => {
        if (other !== d) other.open = false;
      });
    });
  });
})();

/* ===== Shared Calendar (event cards) ===== */
(function(){
  const rail = document.querySelector('[data-cal-rail]');
  if(!rail) return;

  // Enable rail arrows (reuse initRail pattern)
  (function initRail(){
    const prev = document.querySelector('[data-cal-scroll="prev"]');
    const next = document.querySelector('[data-cal-scroll="next"]');
    const cardSel = '.wg-project-card';
    const gap = 12;

    function step(){
      const card = rail.querySelector(cardSel);
      if (!card) return 260;
      return card.getBoundingClientRect().width + gap;
    }
    function update(){
      if(!prev || !next) return;
      const max = rail.scrollWidth - rail.clientWidth;
      const x = rail.scrollLeft;
      prev.disabled = x <= 2;
      next.disabled = x >= max - 2;
    }
    window.__calRailUpdate = update;
    function scrollByDir(dir){
      rail.scrollBy({ left: dir * step(), behavior: 'smooth' });
      // refresh after layout settles
      window.setTimeout(update, 250);
    }

    if(prev) prev.addEventListener('click', ()=> scrollByDir(-1));
    if(next) next.addEventListener('click', ()=> scrollByDir(1));
    rail.addEventListener('scroll', update, { passive:true });
    window.addEventListener('resize', update);
    update();

    rail.addEventListener('wheel', (e)=>{
      if(!e.shiftKey && Math.abs(e.deltaY) > Math.abs(e.deltaX)){
        rail.scrollLeft += e.deltaY;
        e.preventDefault();
      }
    }, { passive:false });
  })();

  const sourceChips = document.getElementById('calSourceChips');
  const tagChips = document.getElementById('calTagChips');
  const meta = document.getElementById('calMeta');

  const SOURCE = {
    GOAT:  { label:'GOAT',  icon:'https://www.google.com/s2/favicons?domain=goatech.org&sz=64' },
    GIAA:  { label:'GIAA',  icon:'https://www.google.com/s2/favicons?domain=gia-agroecology.org&sz=64' },
    AKC:   { label:'Ag Knowledge Concordance', icon:'https://www.google.com/s2/favicons?domain=agricultural-knowledge-concordance.github.io&sz=64' },
    FARMHACK: { label:'Farm Hack', icon:'https://www.google.com/s2/favicons?domain=farmhack.org&sz=64' }
  };

  const state = { source:'', tag:'' };
  let data = [];

  function escapeHtml(s){
    return (s ?? '').toString()
      .replaceAll('&','&amp;')
      .replaceAll('<','&lt;')
      .replaceAll('>','&gt;')
      .replaceAll('"','&quot;')
      .replaceAll("'",'&#039;');
  }

  function fmtRange(startIso, endIso){
    const start = new Date(startIso);
    const end = new Date(endIso || startIso);
    if (Number.isNaN(start.getTime())) return '';
    const optsDate = { weekday:'short', month:'short', day:'numeric', year:'numeric' };
    const optsTime = { hour:'2-digit', minute:'2-digit' };
    const sameDay = start.toDateString() === end.toDateString();
    const d = start.toLocaleDateString(undefined, optsDate);
    const t1 = start.toLocaleTimeString(undefined, optsTime);
    const t2 = endIso ? end.toLocaleTimeString(undefined, optsTime) : '';
    return sameDay ? `${d} • ${t1}${t2 ? '–' + t2 : ''}` : `${d} • ${t1} → ${end.toLocaleDateString(undefined, optsDate)} • ${t2}`;
  }

  function monthKey(iso){
    const d = new Date(iso);
    return d.toLocaleString(undefined, { month:'short', year:'numeric' });
  }

  function makeChip(label, onClick){
    const b = document.createElement('button');
    b.className = 'cal-chip';
    b.type = 'button';
    b.textContent = label;
    b.setAttribute('aria-pressed','false');
    b.addEventListener('click', onClick);
    return b;
  }

  function updateChips(){
    document.querySelectorAll('.cal-chip').forEach(ch => {
      const txt = ch.textContent || '';
      let pressed = false;
      if (txt === 'All sources') pressed = state.source === '';
      if (txt === 'All tags') pressed = state.tag === '';
      for (const k of Object.keys(SOURCE)){
        if (txt === SOURCE[k].label) pressed = state.source === k;
      }
      if (state.tag && txt === state.tag) pressed = true;
      ch.setAttribute('aria-pressed', pressed ? 'true' : 'false');
    });
  }

  function matches(ev){
    if (state.source && ev.source !== state.source) return false;
    if (state.tag && !(ev.tags || []).includes(state.tag)) return false;
    const now = Date.now();
    const end = new Date(ev.end || ev.start).getTime();
    return end >= now - 365*24*3600*1000; // show ~last year + upcoming
  }

  function card(ev){
    const src = SOURCE[ev.source] || { label: ev.source || 'Event', icon:'' };
    const tags = (ev.tags || []).filter(t => t !== ev.source).slice(0,3)
      .map(t => `<span class="ev-tag">${escapeHtml(t)}</span>`).join('');
    const startDate = new Date(ev.start);
    const endDate = ev.end ? new Date(ev.end) : null;
    const isMultiDay = endDate && startDate.toDateString() !== endDate.toDateString();
    const dateFmt = { weekday:'short', month:'short', day:'numeric' };
    const startStr = Number.isNaN(startDate.getTime()) ? '' : startDate.toLocaleDateString(undefined, dateFmt);
    const endStr = isMultiDay ? endDate.toLocaleDateString(undefined, dateFmt) : '';
    const dateRange = isMultiDay ? `${startStr} – ${endStr}` : startStr;
    const where = ev.location ? ev.location : '';

    return `
<article class="event-card">
  <div class="event-card__head">
    <div class="event-card__date-block">
      <div class="event-card__month">${startDate.toLocaleDateString(undefined,{month:'short'})}</div>
      <div class="event-card__day">${startDate.getDate()}</div>
    </div>
    <div class="event-card__body">
      <div class="event-card__src-row">
        ${src.icon ? `<img class="event-card__src-icon" src="${src.icon}" alt="" loading="lazy" />` : ''}
        <span class="event-card__src-label">${escapeHtml(src.label)}</span>
      </div>
      <h4 class="event-card__title">${escapeHtml(ev.title || 'Untitled event')}</h4>
      ${isMultiDay ? `<div class="event-card__range">${escapeHtml(dateRange)}</div>` : ''}
      ${where ? `<div class="event-card__where">${escapeHtml(where)}</div>` : ''}
      <div class="event-card__tags">${tags}</div>
    </div>
  </div>
  <div class="event-card__foot">
    ${ev.url ? `<a class="event-card__link" href="${escapeHtml(ev.url)}" target="_blank" rel="noopener">Event info ↗</a>` : ''}
    <a class="event-card__link event-card__link--cal" href="calendar.html">Calendar ↗</a>
  </div>
</article>`;
  }

  function render(){
    updateChips();

    const list = data.filter(matches).sort((a,b)=> new Date(a.start).getTime() - new Date(b.start).getTime());

    meta.textContent = `${list.length} upcoming events shown` + (state.source ? ` • ${SOURCE[state.source]?.label || state.source}` : '') + (state.tag ? ` • ${state.tag}` : '');

    // For this homepage rail, show the next ~18 events (still scrollable)
    const subset = list.slice(0, 18);
    rail.innerHTML = subset.map(card).join('') || `<div class="muted" style="padding: 10px 6px;">No upcoming events match your filters.</div>`;
    if (window.__calRailUpdate) window.__calRailUpdate();

    // No expand/collapse in new card design
  }

  function buildFilters(){
    const sources = [...new Set(data.map(e=>e.source).filter(Boolean))];
    const tags = [...new Set(data.flatMap(e=>e.tags || []))].sort();

    sourceChips.innerHTML = '';
    tagChips.innerHTML = '';

    sourceChips.appendChild(makeChip('All sources', ()=>{ state.source = ''; render(); }));
    sources.forEach(s => {
      const label = SOURCE[s]?.label || s;
      sourceChips.appendChild(makeChip(label, ()=>{ state.source = (state.source===s) ? '' : s; render(); }));
    });

    tagChips.appendChild(makeChip('All tags', ()=>{ state.tag = ''; render(); }));
    tags.slice(0, 10).forEach(t => {
      tagChips.appendChild(makeChip(t, ()=>{ state.tag = (state.tag===t) ? '' : t; render(); }));
    });
  }

  fetch('data/events.json', { cache:'no-store' })
    .then(r => r.ok ? r.json() : Promise.reject(new Error('events.json not found')))
    .then(json => {
      data = Array.isArray(json) ? json : (json.items || []);
      buildFilters();
      render();
    })
    .catch(err => {
      console.error(err);
      if (meta) meta.textContent = 'Events feed could not be loaded yet.';
    });
})();
