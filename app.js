const $ = s => document.querySelector(s);
const el = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; };
const CFG = window.PORTFOLIO_CONFIG || {};
let P = null;

// Theme toggle
$('#theme').onclick = () => { const t = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark'; document.documentElement.dataset.theme = t; localStorage.setItem('theme', t); };

fetch('profile.json').then(r => r.json()).then(p => { P = p; render(p); }).catch(() => { $('#name').textContent = 'Profile could not be loaded'; });

function render(p) {
  document.title = `${p.name} | Portfolio`;
  $('#brand').textContent = p.name; $('#name').textContent = p.name; $('#foot-name').textContent = p.name;
  $('#headline').textContent = p.headline; $('#location').textContent = p.location || ''; renderAbout(p);
  $('#year').textContent = new Date().getFullYear();
  p.skills.forEach(g => { const c = el('div', 'card'); c.append(el('h3', null, g.group)); const u = el('ul', 'tags'); g.items.forEach(i => { if (typeof i === 'string') return u.append(el('li', null, i)); const li = el('li', null, i.name); if (i.years) li.append(el('span', 'yrs', ` · ${i.years} yrs`)); u.append(li); }); c.append(u); $('#skills-list').append(c); });
  p.experience.forEach(x => { const li = el('li'); li.append(el('h3', null, `${x.role} · ${x.company}`), el('p', 'muted', x.period), el('p', null, x.summary)); $('#timeline').append(li); });
  p.projects.forEach(x => { const c = el('article', 'card'); c.append(el('h3', null, x.name), el('p', null, x.description)); const u = el('ul', 'tags'); (x.tech || []).forEach(t => u.append(el('li', null, t))); c.append(u);
    if (x.link) { const a = el('a', null, 'View project →'); a.href = x.link; a.rel = 'noopener'; c.append(a); } $('#projects-list').append(c); });
  p.education.forEach(x => { const c = el('div', 'edu'); const t = el('div', 'edu-logo');
    const ini = () => { t.textContent = x.institution.split(/[\s,]+/).filter(w => /^[A-Z]/.test(w)).slice(0, 2).map(w => w[0]).join(''); t.classList.add('ini'); };
    if (x.logo) { const i = el('img'); i.src = x.logo; i.alt = `${x.institution} logo`; i.loading = 'lazy'; i.onerror = () => { i.remove(); ini(); }; t.append(i); } else ini();
    const b = el('div', 'edu-body'); b.append(el('h3', null, x.institution), el('p', null, x.degree));
    if (x.period) b.append(el('p', 'muted', x.period)); if (x.grade) b.append(el('p', 'edu-grade', `Grade: ${x.grade}`));
    c.append(t, b); $('#edu-list').append(c); });
  const em = (p.contact.email || '').replace(/^\[PLACEHOLDER\]\s*/, ''); const m = $('#email'); m.textContent = em; m.href = `mailto:${em}`;
  const short = u => u.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '');
  [['github', '#gh', '#row-github'], ['linkedin', '#li', '#row-linkedin']].forEach(([k, a, r]) => { const v = p.social?.[k]; if (v) { $(a).href = v; $(a).textContent = short(v); $(r).hidden = false; } });
}

// ---- Chat widget ----
const chat = $('#chat'), log = $('#chat-log'), fab = $('#chat-fab');
const history = [];
function add(cls, text) { const m = el('div', 'msg ' + cls, text); log.append(m); log.scrollTop = log.scrollHeight; return m; }
function fallback() { const e = P?.contact?.email?.replace(/^\[PLACEHOLDER\]\s*/, '') || 'email'; return `Sorry, my assistant isn't available right now. Please browse the sections above or reach me directly at ${e}.`; }
function openChat() { chat.hidden = false; fab.setAttribute('aria-expanded', 'true'); if (!log.children.length) add('bot', `Hi! I'm ${P?.name || 'Uday'}'s assistant. Ask me about my experience, skills or projects.`); $('#chat-input').focus(); }
fab.onclick = () => chat.hidden ? openChat() : ($('#chat-close').click());
$('#hero-chat').onclick = openChat;
$('#chat-close').onclick = () => { chat.hidden = true; fab.setAttribute('aria-expanded', 'false'); fab.focus(); };
document.addEventListener('keydown', e => { if (e.key === 'Escape' && !chat.hidden) $('#chat-close').click(); });

$('#chat-form').onsubmit = async e => {
  e.preventDefault(); const inp = $('#chat-input'); const q = inp.value.trim(); if (!q) return; inp.value = ''; add('user', q);
  const url = (CFG.CHAT_API_URL || '').replace(/\/$/, '');
  if (!url) { const e = P?.contact?.email?.replace(/^\[PLACEHOLDER\]\s*/, '') || 'email'; add('bot', `My AI assistant is coming soon! Meanwhile, feel free to email me at ${e}.`); return; }
  const status = add('status', 'Thinking…');
  const wake = setTimeout(() => status.textContent = '☕ The assistant is waking up (free servers sleep when idle). This can take up to a minute…', 6000);
  const ctrl = new AbortController(); const kill = setTimeout(() => ctrl.abort(), CFG.REQUEST_TIMEOUT_MS || 90000);
  try {
    const r = await fetch(url + '/api/chat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ message: q, history: history.slice(-6) }), signal: ctrl.signal });
    if (!r.ok) throw new Error(r.status);
    const d = await r.json(); status.remove(); add('bot', d.reply); history.push({ role: 'user', content: q }, { role: 'assistant', content: d.reply });
  } catch { status.remove(); add('bot', fallback()); }
  finally { clearTimeout(wake); clearTimeout(kill); }
};

$('#ct-chat').onclick = openChat;

function renderAbout(p) {
  const box = $('#about-text'), text = p.about || '', terms = (p.aboutHighlights || []).filter(Boolean).sort((x, y) => y.length - x.length);
  box.textContent = '';
  if (!terms.length) { box.textContent = text; return; }
  const esc = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const re = new RegExp(`(?<![\\w.])(${terms.map(esc).join('|')})(?![\\w])`, 'g');
  let last = 0;
  for (const m of text.matchAll(re)) { box.append(document.createTextNode(text.slice(last, m.index)), el('mark', 'hl', m[0])); last = m.index + m[0].length; }
  box.append(document.createTextNode(text.slice(last)));
}
