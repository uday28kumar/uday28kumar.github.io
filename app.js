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
  $('#headline').textContent = p.headline; $('#location').textContent = p.location || ''; $('#about-text').textContent = p.about;
  $('#year').textContent = new Date().getFullYear();
  p.skills.forEach(g => { const c = el('div', 'card'); c.append(el('h3', null, g.group)); const u = el('ul', 'tags'); g.items.forEach(i => u.append(el('li', null, i))); c.append(u); $('#skills-list').append(c); });
  p.experience.forEach(x => { const li = el('li'); li.append(el('h3', null, `${x.role} · ${x.company}`), el('p', 'muted', x.period), el('p', null, x.summary)); $('#timeline').append(li); });
  p.projects.forEach(x => { const c = el('article', 'card'); c.append(el('h3', null, x.name), el('p', null, x.description)); const u = el('ul', 'tags'); (x.tech || []).forEach(t => u.append(el('li', null, t))); c.append(u);
    if (x.link) { const a = el('a', null, 'View project →'); a.href = x.link; a.rel = 'noopener'; c.append(a); } $('#projects-list').append(c); });
  p.education.forEach(x => { const c = el('div', 'card'); c.append(el('h3', null, x.degree), el('p', 'muted', `${x.institution} · ${x.period}`)); $('#edu-list').append(c); });
  $('#availability').textContent = p.contact.availability || '';
  const m = $('#email'); m.textContent = `Email ${p.contact.email}`; m.href = `mailto:${p.contact.email.replace(/^\[PLACEHOLDER\]\s*/, '')}`;
  Object.entries(p.social || {}).forEach(([k, v]) => { if (!v) return; const li = el('li'); const a = el('a', null, k[0].toUpperCase() + k.slice(1)); a.href = v; a.rel = 'noopener'; li.append(a); $('#social').append(li); });
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
