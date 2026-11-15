import { me, services, projects } from '../data/site.js';
import { initCvLab } from './cvlab.ts';

const $ = <T extends Element = HTMLElement>(sel: string, root: ParentNode = document) => root.querySelector<T>(sel);
const $$ = <T extends Element = HTMLElement>(sel: string, root: ParentNode = document) => [...root.querySelectorAll<T>(sel)];
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ==================== typing line in the hero ==================== */
for (const el of $$('[data-type]')) {
  const text = el.dataset.type ?? '';
  if (reducedMotion) { el.textContent = text; continue; }
  let i = 0;
  const tick = () => {
    el.textContent = text.slice(0, i);
    i = i > text.length + 12 ? 0 : i + 1;
    setTimeout(tick, i === 0 ? 400 : i > text.length ? 120 : 110);
  };
  tick();
}

/* ==================== light / dark toggle ==================== */
// The page follows the system theme until the visitor picks one here.
const root = document.documentElement;
const systemDark = matchMedia('(prefers-color-scheme: dark)');
const isDark = () => (root.dataset.theme ? root.dataset.theme === 'dark' : systemDark.matches);
for (const b of $$('[data-theme-toggle]')) {
  b.addEventListener('click', () => {
    const next = isDark() ? 'light' : 'dark';
    root.dataset.theme = next;
    try { localStorage.setItem('theme', next); } catch {}
  });
}

/* ==================== service links prefill the issue form ==================== */
for (const a of $$<HTMLAnchorElement>('[data-service]')) {
  a.addEventListener('click', () => {
    const select = $<HTMLSelectElement>('[data-issue-form] select[name=label]');
    if (select) select.value = a.dataset.service ?? '';
    setTimeout(() => $<HTMLInputElement>('[data-issue-form] input[name=title]')?.focus({ preventScroll: true }), 500);
  });
}

/* ==================== issue form -> email ==================== */
const form = $<HTMLFormElement>('[data-issue-form]');
form?.addEventListener('submit', (e) => {
  e.preventDefault();
  const data = new FormData(form);
  const subject = `[${data.get('label')}] ${data.get('title')}`;
  const body = `${data.get('body')}\n\n---\nReply to: ${data.get('from')}`;
  location.href = `mailto:${form.dataset.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
});

/* ==================== live GitHub feed ==================== */
const feed = $('[data-gh-feed]');
if (feed) {
  const ago = (iso: string) => {
    const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
    if (days < 1) return 'today';
    if (days < 30) return `${days}d ago`;
    if (days < 365) return `${Math.floor(days / 30)}mo ago`;
    return `${Math.floor(days / 365)}y ago`;
  };
  const esc = (s: string) => s.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
  // GitHub allows 60 anonymous API calls an hour per visitor, so keep the
  // answer for an hour. Storage can be blocked (private mode), hence the trys.
  const CACHE_KEY = 'gh-repos';
  const cached = (() => {
    try {
      const c = JSON.parse(localStorage.getItem(CACHE_KEY) ?? 'null');
      return c && Date.now() - c.at < 3600_000 ? c.repos : null;
    } catch { return null; }
  })();
  const repos: Promise<any[]> = cached
    ? Promise.resolve(cached)
    : fetch(`https://api.github.com/users/${feed.dataset.user}/repos?sort=pushed&per_page=8`)
      .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
      .then((list: any[]) => {
        const slim = list.map(({ name, html_url, language, pushed_at }) => ({ name, html_url, language, pushed_at }));
        try { localStorage.setItem(CACHE_KEY, JSON.stringify({ at: Date.now(), repos: slim })); } catch {}
        return slim;
      });
  repos
    .then((repos) => {
      feed.innerHTML = repos.slice(0, 6).map((r) => `
        <a class="gh-row" href="${esc(r.html_url)}" target="_blank" rel="noopener">
          <b>${esc(r.name)}</b>
          <span>${esc(r.language ?? '—')} · ${ago(r.pushed_at)}</span>
        </a>`).join('') +
        `<a class="gh-all" href="${me.github}" target="_blank" rel="noopener">all repos ↗</a>`;
    })
    .catch(() => {
      feed.innerHTML = `<p class="mono">GitHub didn't answer. <a href="${me.github}">See the profile ↗</a></p>`;
    });
}

/* ==================== spray mode ==================== */
const sprayCanvas = $<HTMLCanvasElement>('[data-spray-canvas]')!;
const sctx = sprayCanvas.getContext('2d', { willReadFrequently: true })!;
const dock = $('[data-spray-dock]')!;
let sprayColor = '#ff2e88';
let nozzle = 32;

// iOS Safari refuses canvases above ~16.7 million pixels, so long pages
// get a canvas that covers as much as it can from the top.
const MAX_CANVAS_PIXELS = 16_000_000;

function fitSprayCanvas() {
  const w = document.documentElement.scrollWidth;
  const h = Math.min(document.documentElement.scrollHeight, Math.floor(MAX_CANVAS_PIXELS / w));
  if (sprayCanvas.width === w && sprayCanvas.height === h) return;
  // Keep what's already painted when the page grows or the window resizes.
  const keep = sprayCanvas.width ? sctx.getImageData(0, 0, sprayCanvas.width, sprayCanvas.height) : null;
  sprayCanvas.width = w;
  sprayCanvas.height = h;
  sprayCanvas.style.width = `${w}px`;
  sprayCanvas.style.height = `${h}px`;
  if (keep) sctx.putImageData(keep, 0, 0);
}
// The page-sized canvas is only allocated once someone starts spraying.
const refitSpray = () => { if (sprayCanvas.width) fitSprayCanvas(); };
if ('ResizeObserver' in window) new ResizeObserver(refitSpray).observe(document.body);
else addEventListener('resize', refitSpray);

function toggleSpray(force?: boolean) {
  const on = force ?? !document.body.classList.contains('spraying');
  document.body.classList.toggle('spraying', on);
  dock.hidden = !on;
  if (on) fitSprayCanvas();
}
for (const b of $$('[data-toggle-spray]')) b.addEventListener('click', () => toggleSpray());

for (const sw of $$<HTMLButtonElement>('[data-color]')) {
  sw.addEventListener('click', () => {
    sprayColor = sw.dataset.color!;
    $$('.sw').forEach((s) => s.classList.toggle('on', s === sw));
  });
}
$<HTMLInputElement>('[data-spray-size]')?.addEventListener('input', (e) => {
  nozzle = +(e.target as HTMLInputElement).value;
});
$('[data-spray-clear]')?.addEventListener('click', () => sctx.clearRect(0, 0, sprayCanvas.width, sprayCanvas.height));

type Drip = { x: number; y: number; left: number; w: number; color: string };
const drips: Drip[] = [];
let painting = false;
let last = { x: 0, y: 0 };
let still = 0;

function puff(x: number, y: number) {
  sctx.fillStyle = sprayColor;
  // Dots cluster in the middle like a real nozzle: radius ~ r * random^2.
  const dots = nozzle * 3;
  for (let i = 0; i < dots; i++) {
    const a = Math.random() * Math.PI * 2;
    const r = nozzle * Math.random() ** 1.8;
    sctx.globalAlpha = 0.25 + Math.random() * 0.5;
    sctx.fillRect(x + Math.cos(a) * r, y + Math.sin(a) * r, 1.6, 1.6);
  }
  sctx.globalAlpha = 1;
}

function sprayAt(e: PointerEvent) {
  const x = e.pageX, y = e.pageY;
  const dist = Math.hypot(x - last.x, y - last.y);
  // Fill gaps on fast strokes so the line doesn't break into blobs.
  const steps = Math.max(1, Math.floor(dist / (nozzle / 3)));
  for (let s = 1; s <= steps; s++) puff(last.x + ((x - last.x) * s) / steps, last.y + ((y - last.y) * s) / steps);
  last = { x, y };
}

sprayCanvas.addEventListener('pointerdown', (e) => {
  painting = true;
  last = { x: e.pageX, y: e.pageY };
  sprayCanvas.setPointerCapture(e.pointerId);
  puff(last.x, last.y);
  startSprayLoop();
});
sprayCanvas.addEventListener('pointermove', (e) => { if (painting) { still = 0; sprayAt(e); } });
addEventListener('pointerup', () => { painting = false; });
addEventListener('pointercancel', () => { painting = false; });

// Holding the can still builds up paint until it drips. The loop only runs
// while painting or while drips are still running, to save battery.
let looping = false;
function startSprayLoop() {
  if (!looping) { looping = true; requestAnimationFrame(sprayLoop); }
}
function sprayLoop() {
  if (painting) {
    puff(last.x, last.y);
    if (++still % 45 === 0) {
      drips.push({ x: last.x + (Math.random() - 0.5) * nozzle * 0.6, y: last.y, left: 40 + Math.random() * 120, w: 2 + nozzle / 12, color: sprayColor });
    }
  }
  for (let i = drips.length - 1; i >= 0; i--) {
    const d = drips[i];
    sctx.fillStyle = d.color;
    sctx.beginPath();
    sctx.arc(d.x, d.y, d.w, 0, Math.PI * 2);
    sctx.fill();
    d.y += 1.4;
    d.w *= 0.996;
    if (--d.left <= 0) drips.splice(i, 1);
  }
  if (painting || drips.length) requestAnimationFrame(sprayLoop);
  else looping = false;
}

/* ==================== terminal ==================== */
const termWrap = $('[data-terminal]')!;
const termOut = $('[data-term-out]')!;
const termInput = $<HTMLInputElement>('[data-term-input]')!;
const history: string[] = [];
let histIdx = 0;

const print = (html: string) => {
  termOut.insertAdjacentHTML('beforeend', `<div>${html}</div>`);
  termOut.scrollTop = termOut.scrollHeight;
};

const commands: Record<string, (args: string[]) => string | void> = {
  help: () => [
    '<span class="y">commands</span>',
    '  whoami      who is this guy',
    '  services    what I can fix for you',
    '  projects    things I built',
    '  contact     how to reach me',
    '  github      open my GitHub',
    '  spray       tag the wall',
    '  hire        the important one',
    '  clear       clean the screen',
    '  exit        close the terminal',
  ].join('\n'),
  whoami: () => `<span class="c">${me.name}</span> (${me.handle})\n${me.about}`,
  services: () => services.map((s) => `<span class="p">[${s.code}]</span> <span class="c">${s.title}</span>\n          ${s.blurb}`).join('\n'),
  projects: () => projects.map((p) => `<span class="y">▸ ${p.name}</span> <span class="c">(${p.kind})</span>\n  ${p.stack.join(' · ')}`).join('\n'),
  contact: () => `email     <a href="mailto:${me.email}">${me.email}</a>\ngithub    <a href="${me.github}" target="_blank">${me.github}</a>\nlinkedin  <a href="${me.linkedin}" target="_blank">${me.linkedin}</a>`,
  github: () => { open(me.github, '_blank', 'noopener'); return 'opening github…'; },
  spray: () => { closeTerminal(); toggleSpray(true); },
  hire: () => { closeTerminal(); location.hash = 'contact'; },
  sudo: (args) => (args.join(' ') === 'hire-me' || args[0] === 'hire'
    ? (setTimeout(() => commands.hire([]), 700), '<span class="p">[sudo] password accepted. good choice.</span>')
    : `<span class="p">nice try.</span> you're not in the sudoers file. this incident will be reported.`),
  ls: () => 'services/  projects/  cv_lab/  bug_log/  secrets.txt',
  cat: (args) => (args[0] === 'secrets.txt' ? 'the real secret is reading the error message. all of it.' : `cat: ${args[0] ?? ''}: No such file`),
  'rm': () => '<span class="p">rm: refusing to delete my own portfolio</span>',
  clear: () => { termOut.innerHTML = ''; },
  exit: () => { closeTerminal(); },
};

function run(line: string) {
  print(`<span class="p">$</span> <span class="c">${line.replace(/</g, '&lt;')}</span>`);
  const [cmd, ...args] = line.trim().split(/\s+/);
  if (!cmd) return;
  const fn = commands[cmd.toLowerCase()];
  const out = fn ? fn(args) : `command not found: ${cmd.replace(/</g, '&lt;')}. try <span class="y">help</span>`;
  if (out) print(out);
}

function openTerminal() {
  termWrap.hidden = false;
  if (!termOut.childElementCount) print(`<span class="y">hex3961 shell v1.0</span> · type <span class="y">help</span> to start`);
  termInput.focus();
}
function closeTerminal() { termWrap.hidden = true; }

$$('[data-open-terminal]').forEach((b) => b.addEventListener('click', openTerminal));
$('[data-close-terminal]')?.addEventListener('click', closeTerminal);
termWrap.addEventListener('click', (e) => { if (e.target === termWrap) closeTerminal(); });
$<HTMLFormElement>('[data-term-form]')?.addEventListener('submit', (e) => {
  e.preventDefault();
  const line = termInput.value;
  if (line.trim()) { history.push(line); histIdx = history.length; }
  termInput.value = '';
  run(line);
});
termInput.addEventListener('keydown', (e) => {
  if (e.key === 'ArrowUp' && histIdx > 0) { termInput.value = history[--histIdx]; e.preventDefault(); }
  if (e.key === 'ArrowDown') { histIdx = Math.min(history.length, histIdx + 1); termInput.value = history[histIdx] ?? ''; }
  if (e.key === 'Tab') {
    e.preventDefault();
    const match = Object.keys(commands).find((c) => c.startsWith(termInput.value));
    if (match) termInput.value = match;
  }
});
addEventListener('keydown', (e) => {
  const typing = (e.target as HTMLElement).closest('input, textarea, select');
  if (e.key === '`' && !typing) { e.preventDefault(); termWrap.hidden ? openTerminal() : closeTerminal(); }
  if (e.key === 'Escape') { closeTerminal(); toggleSpray(false); }
});

/* ==================== CV lab ==================== */
initCvLab();
