// Light interaction layer: progress bar, active nav, scroll reveal, card spotlight, rotating role text.
(() => {
  const RM = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const bar = document.getElementById('progress');
  const onScroll = () => { const h = document.documentElement; const max = h.scrollHeight - innerHeight; bar.style.transform = `scaleX(${max > 0 ? h.scrollTop / max : 0})`; };
  addEventListener('scroll', onScroll, { passive: true }); onScroll();

  // Active nav link
  const links = [...document.querySelectorAll('.nav ul a')];
  const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) links.forEach(a => a.classList.toggle('active', a.getAttribute('href') === '#' + e.target.id)); }), { rootMargin: '-45% 0px -50% 0px' });
  links.forEach(a => { const s = document.querySelector(a.getAttribute('href')); if (s) io.observe(s); });

  // Scroll reveal (applied after content renders)
  const rio = RM ? null : new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); e.target.querySelector(':scope > h2.reveal')?.classList.add('in'); rio.unobserve(e.target); } }), { threshold: .12 });
  const reveal = () => document.querySelectorAll('main section > h2, #about-text, .card, .edu, .timeline li, .ct-head, .ct-card').forEach((el, i) => {
    if (el.classList.contains('reveal')) return; if (RM) return; el.classList.add('reveal'); el.style.transitionDelay = `${(i % 3) * 60}ms`; rio.observe(el.tagName === 'H2' ? el.parentElement : el); });
  new MutationObserver(reveal).observe(document.getElementById('main'), { childList: true, subtree: true }); reveal();

  // Cursor-follow spotlight
  document.addEventListener('pointermove', e => { const c = e.target.closest?.('.card,.edu,.ct-card'); if (!c) return; const r = c.getBoundingClientRect();
    c.style.setProperty('--mx', `${e.clientX - r.left}px`); c.style.setProperty('--my', `${e.clientY - r.top}px`); }, { passive: true });

  // Rotating role text (typed)
  const out = document.getElementById('role'); const roles = (window.PORTFOLIO_CONFIG?.ROLES) || ['Software Engineer', 'Technical Lead'];
  if (RM) { out.textContent = roles.join(' · '); return; }
  let r = 0, i = 0, del = false;
  (function tick() { const w = roles[r]; out.textContent = w.slice(0, i); let d = del ? 45 : 85;
    if (!del && i === w.length) { del = true; d = 1800; } else if (del && i === 0) { del = false; r = (r + 1) % roles.length; d = 350; } else i += del ? -1 : 1;
    setTimeout(tick, d); })();
})();
