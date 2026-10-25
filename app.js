'use strict';

/* ============================================================
   Home Base: a personal homepage built from spaces and checklists.
   Data lives in localStorage on this device. No server, no build.
   ============================================================ */

const STORE_KEY = 'homebase.v1';

/* ---------- tiny helpers ---------- */
const $ = (s, e = document) => e.querySelector(s);
const uid = () => Math.random().toString(36).slice(2, 9);
const pad = n => String(n).padStart(2, '0');
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const dkey = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const parse = k => { const [y, m, d] = k.split('-').map(Number); return new Date(y, m - 1, d); };
const addDays = (k, n) => { const d = parse(k); d.setDate(d.getDate() + n); return dkey(d); };
const weekStart = k => addDays(k, -((parse(k).getDay() + 6) % 7)); // Monday
const todayKey = () => dkey(new Date());
const fmt = (k, o) => parse(k).toLocaleDateString(undefined, o);
const DAY_LETTERS = [['M', 1], ['T', 2], ['W', 3], ['T', 4], ['F', 5], ['S', 6], ['S', 0]];
const DAY_NAMES = { 0: 'Sun', 1: 'Mon', 2: 'Tue', 3: 'Wed', 4: 'Thu', 5: 'Fri', 6: 'Sat' };

/* ---------- icons (line icons, inherit text color) ---------- */
const ICON_PATHS = {
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
  calendar: '<rect x="3" y="5" width="18" height="16" rx="3"/><path d="M3 10h18M8 3v4M16 3v4"/>',
  sliders: '<path d="M4 7h9M19 7h1M4 17h1M11 17h9"/><circle cx="16" cy="7" r="2.2"/><circle cx="8" cy="17" r="2.2"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  briefcase: '<rect x="3" y="7" width="18" height="13" rx="2.5"/><path d="M9 7V5.5A1.5 1.5 0 0110.5 4h3A1.5 1.5 0 0115 5.5V7M3 13h18"/>',
  home: '<path d="M3 11l9-8 9 8M5 9.5V20h14V9.5"/>',
  leaf: '<path d="M5 19C5 9 10 5 20 5c0 10-4 14-13 14M5 19c1.5-4 4-7 8-9"/>',
  heart: '<path d="M12 20s-7.5-4.6-7.5-10.2A4.3 4.3 0 0112 7.3a4.3 4.3 0 017.5 2.5C19.5 15.4 12 20 12 20z"/>',
  book: '<path d="M5 4h13v16H7.5A2.5 2.5 0 015 17.5V4zM9 8h5"/>',
  star: '<path d="M12 3l2.8 5.9 6.2.8-4.6 4.3 1.2 6.3L12 17.2 6.4 20.3l1.2-6.3L3 9.7l6.2-.8z"/>',
  bolt: '<path d="M13 3L5 14h6l-1 7 8-11h-6z"/>',
  target: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1"/>',
  image: '<rect x="3" y="4" width="18" height="16" rx="3"/><circle cx="9" cy="10" r="1.8"/><path d="M4 18l5-5 4 4 3-3 4 4"/>',
  move: '<path d="M12 3v18M3 12h18M12 3l-3 3M12 3l3 3M12 21l-3-3M12 21l3-3M3 12l3-3M3 12l3 3M21 12l-3-3M21 12l-3 3"/>',
  gear: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 00.3 1.8l.1.1a2 2 0 11-2.8 2.8l-.1-.1a1.7 1.7 0 00-1.8-.3 1.7 1.7 0 00-1 1.5V21a2 2 0 11-4 0v-.1a1.7 1.7 0 00-1.1-1.5 1.7 1.7 0 00-1.8.3l-.1.1a2 2 0 11-2.8-2.8l.1-.1a1.7 1.7 0 00.3-1.8 1.7 1.7 0 00-1.5-1H3a2 2 0 110-4h.1a1.7 1.7 0 001.5-1.1 1.7 1.7 0 00-.3-1.8l-.1-.1a2 2 0 112.8-2.8l.1.1a1.7 1.7 0 001.8.3H9a1.7 1.7 0 001-1.5V3a2 2 0 114 0v.1a1.7 1.7 0 001 1.5 1.7 1.7 0 001.8-.3l.1-.1a2 2 0 112.8 2.8l-.1.1a1.7 1.7 0 00-.3 1.8V9a1.7 1.7 0 001.5 1H21a2 2 0 110 4h-.1a1.7 1.7 0 00-1.5 1z"/>',
  sparkle: '<path d="M12 3v5M12 16v5M3 12h5M16 12h5M6 6l3 3M15 15l3 3M18 6l-3 3M9 15l-3 3"/>',
};
const SPACE_COLORS = ['#7c8cff', '#2dffb2', '#ff4fd8', '#ffd23f', '#38d9ff', '#ff8a3d']; // neon, six clearly different hues
const COLOR_PRESETS = SPACE_COLORS;
const spaceColor = sp => sp.color || SPACE_COLORS[Math.max(0, state.spaces.indexOf(sp)) % SPACE_COLORS.length];
const SPACE_ICONS = ['briefcase', 'home', 'leaf', 'heart', 'book', 'star', 'bolt', 'target', 'sun', 'sparkle'];
const EMOJI_TO_ICON = { '💼': 'briefcase', '🌿': 'leaf', '🌤️': 'sun', '☀️': 'sun', '🧺': 'home', '🏡': 'home', '💪': 'bolt', '✨': 'sparkle', '❤️': 'heart', '📚': 'book' };
const ico = (name, size = 20) => `<svg class="i" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICON_PATHS[name] || ICON_PATHS.star}</svg>`;
const iconName = s => ICON_PATHS[s.icon] ? s.icon : (EMOJI_TO_ICON[s.emoji] || 'star');

/* ---------- templates (also the format used for sharing) ---------- */
const L = (name, cadence, items, askNote = false) => ({ name, cadence, askNote, items: items.map(i => typeof i === 'string' ? { text: i } : i) });

const TEMPLATES = [
  {
    id: 'pm', name: 'Work', icon: 'briefcase',
    desc: 'Morning kickoff, through-the-day follow-ups, shutdown, plus a weekly rhythm.',
    lists: [
      L('Morning kickoff', 'daily', [
        'Triage Slack and email (flag anything blocking)',
        "Review today's calendar and prep for meetings",
        'Scan the board: blockers, overdue, unassigned',
        "Pick today's top 3 priorities",
        'Post or prep standup update',
      ], true),
      L('Through the day', 'daily', [
        'Follow up on open questions and blockers',
        'Update ticket statuses and due dates',
        'Respond to stakeholder requests',
        { text: 'Check in with the team (dev, design, client)', optional: true },
      ], true),
      L('Shutdown', 'daily', [
        'Update project tracker and status',
        'Log decisions, risks and scope changes',
        'Clear inbox and Slack mentions',
        "Write tomorrow's top 3",
        'Send end-of-day update',
      ], true),
      L('Rhythm of the week', 'daily', [
        { text: 'Weekly planning: scope the week, confirm capacity', days: [1] },
        { text: 'Mid-week risk and blocker check', days: [3] },
        { text: 'Send weekly status report', days: [5] },
        { text: 'Retro notes and wins for the week', days: [5], optional: true },
      ], true),
      L('Weekly PM checks', 'weekly', [
        'Review risk register',
        'Check budget and hours against plan',
        'Stakeholder or client check-in',
        'Groom the backlog',
        'Update roadmap and timelines',
      ], true),
    ],
  },
  {
    id: 'morning', name: 'Morning and evening routine', icon: 'sun',
    desc: 'A simple bookend for the day.',
    lists: [
      L('Morning', 'daily', ['Water and a real breakfast', 'Move for 20+ minutes', { text: '10 quiet minutes: plan the day', optional: true }]),
      L('Evening', 'daily', ['Reset the kitchen', 'Prep tomorrow (clothes, bag, first task)', 'Screens off, wind down']),
    ],
  },
  {
    id: 'reset', name: 'Weekly reset', icon: 'home',
    desc: 'The life-admin pass that keeps the week from running you.',
    lists: [
      L('Weekly reset', 'weekly', ['Groceries', 'Laundry', 'Review finances', 'Plan the week ahead', { text: 'Reach out to someone I care about', optional: true }]),
    ],
  },
  {
    id: 'health', name: 'Health and training', icon: 'bolt',
    desc: 'Daily basics plus a weekly training target.',
    lists: [
      L('Daily basics', 'daily', ['Water (8 glasses)', 'Protein with every meal', 'Steps goal', 'Sleep by 10:30']),
      L('This week', 'weekly', ['Strength session 1', 'Strength session 2', 'Cardio session', 'Mobility or stretch', 'Meal prep']),
    ],
  },
  {
    id: 'blank', name: 'Blank space', icon: 'sparkle',
    desc: 'Start empty and build it your way.',
    lists: [],
  },
];

/* ---------- liquid glass refraction (Chromium) ----------
   Real glass bends light at its rim. For each glass element we paint a
   displacement map for its exact size and corner radius, then hand it to an SVG
   feDisplacementMap used as a backdrop-filter. Content scrolling underneath warps
   as it passes the edge. Browsers without SVG backdrop filters (Safari, Firefox)
   get the frosted fallback in CSS. */
const REFRACT = /Chrome\//.test(navigator.userAgent) && !/Firefox\/|FxiOS/.test(navigator.userAgent);
const Glass = (() => {
  const defs = document.getElementById('glass-defs');
  const cache = new Map();
  let n = 0;

  function mapURL(w, h, r, bezel) {
    const k = w * h > 160000 ? 0.5 : 1;
    const mw = Math.max(2, Math.round(w * k)), mh = Math.max(2, Math.round(h * k));
    const hx = mw / 2, hy = mh / 2, rr = Math.min(r * k, hx, hy), bz = Math.max(1, bezel * k);
    const c = document.createElement('canvas'); c.width = mw; c.height = mh;
    const g = c.getContext('2d'), img = g.createImageData(mw, mh), d = img.data;
    for (let y = 0; y < mh; y++) for (let x = 0; x < mw; x++) {
      const px = x + 0.5 - hx, py = y + 0.5 - hy;
      const qx = Math.abs(px) - (hx - rr), qy = Math.abs(py) - (hy - rr);
      let sd, gx, gy; // signed distance to the rounded rect, and its outward normal
      if (qx > 0 && qy > 0) { const l = Math.hypot(qx, qy); sd = l - rr; gx = qx / l * Math.sign(px); gy = qy / l * Math.sign(py); }
      else if (qx > qy) { sd = qx - rr; gx = Math.sign(px); gy = 0; }
      else { sd = qy - rr; gx = 0; gy = Math.sign(py); }
      const depth = Math.max(0, -sd);
      let mag = 0;
      if (depth < bz) { const t = 1 - depth / bz; mag = 1 - Math.sqrt(1 - t * t); } // convex lens profile
      const i = (y * mw + x) * 4;
      d[i] = 128 - gx * mag * 127; d[i + 1] = 128 - gy * mag * 127; d[i + 2] = 128; d[i + 3] = 255;
    }
    g.putImageData(img, 0, 0);
    return c.toDataURL('image/png');
  }

  function filterFor(w, h, r, bezel, scale) {
    const key = [w, h, r, bezel, scale].join('x');
    if (cache.has(key)) return cache.get(key);
    const id = 'lg' + n++;
    defs.insertAdjacentHTML('beforeend',
      `<filter id="${id}" filterUnits="userSpaceOnUse" x="0" y="0" width="${w}" height="${h}" color-interpolation-filters="sRGB">` +
      `<feImage href="${mapURL(w, h, r, bezel)}" x="0" y="0" width="${w}" height="${h}" preserveAspectRatio="none" result="m"/>` +
      `<feDisplacementMap in="SourceGraphic" in2="m" scale="${scale}" xChannelSelector="R" yChannelSelector="G"/></filter>`);
    cache.set(key, id);
    return id;
  }

  function refresh() {
    const on = document.documentElement.classList.contains('refract');
    if (cache.size > 150) { cache.clear(); defs.innerHTML = ''; }
    document.querySelectorAll('[data-glass]').forEach(el => {
      if (el.dataset.gblur) el.style.setProperty('--gblur', el.dataset.gblur + 'px');
      if (!on) { el.style.removeProperty('--glass-filter'); return; }
      const w = el.offsetWidth, h = el.offsetHeight;
      if (!w || !h) return;
      const r = Math.min(parseFloat(getComputedStyle(el).borderTopLeftRadius) || 0, w / 2, h / 2);
      const bezel = Math.min(+el.dataset.bezel || 20, Math.min(w, h) / 2);
      el.style.setProperty('--glass-filter', `url(#${filterFor(w, h, Math.round(r), Math.round(bezel), +el.dataset.scale || 40)})`);
    });
  }
  let t; window.addEventListener('resize', () => { clearTimeout(t); t = setTimeout(refresh, 150); });
  return { refresh };
})();

/* ---------- appearance ---------- */
const THEMES = [
  { id: 'glassnight', name: 'Dark Glass', swatch: 'linear-gradient(135deg,#2a1d52,#0f5d8f 55%,#7a2a62)' },
  { id: 'glass', name: 'Light Glass', swatch: 'linear-gradient(135deg,#ffc2e2,#b9e4ff 50%,#d3c4ff)' },
  { id: 'auto', name: 'Auto', swatch: 'linear-gradient(90deg,#f5f5f7 50%,#000 50%)' },
  { id: 'ink', name: 'Ink', swatch: '#000' },
];
const ACCENTS = ['#4f46e5', '#0ea5e9', '#14b8a6', '#16a34a', '#f59e0b', '#ef4444', '#ec4899', '#a855f7', '#1f1d1a'];
const FONTS = {
  system: ['System', '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif'],
  rounded: ['Rounded', 'ui-rounded, "SF Pro Rounded", "Nunito", "Varela Round", system-ui, sans-serif'],
  serif: ['Serif', 'ui-serif, "New York", Georgia, "Times New Roman", serif'],
  mono: ['Mono', 'ui-monospace, "SF Mono", Menlo, Consolas, monospace'],
  helvetica: ['Helvetica', '"Helvetica Neue", Helvetica, "Nimbus Sans", Arial, sans-serif'],
  humanist: ['Humanist', '"Avenir Next", Avenir, "Gill Sans", "Trebuchet MS", Candara, sans-serif'],
};
const WALLPAPERS = {
  aurora: 'radial-gradient(42% 46% at 16% 20%, #14b8a6 0%, transparent 100%), radial-gradient(36% 42% at 84% 16%, #7c3aed 0%, transparent 100%), radial-gradient(44% 48% at 68% 88%, #db2777 0%, transparent 100%), radial-gradient(32% 36% at 8% 88%, #2563eb 0%, transparent 100%), linear-gradient(#070816, #070816)',
  nebula: 'radial-gradient(44% 46% at 22% 24%, #c026d3 0%, transparent 100%), radial-gradient(42% 46% at 86% 34%, #4f46e5 0%, transparent 100%), radial-gradient(46% 40% at 40% 96%, #0284c7 0%, transparent 100%), linear-gradient(#0a0518, #0a0518)',
  ocean: 'radial-gradient(44% 40% at 82% 8%, #06b6d4 0%, transparent 100%), radial-gradient(50% 50% at 8% 70%, #1d4ed8 0%, transparent 100%), radial-gradient(40% 40% at 70% 100%, #0d9488 0%, transparent 100%), linear-gradient(#03101c, #03101c)',
  ember: 'radial-gradient(46% 42% at 14% 14%, #ea580c 0%, transparent 100%), radial-gradient(42% 46% at 90% 40%, #be123c 0%, transparent 100%), radial-gradient(48% 40% at 40% 100%, #d97706 0%, transparent 100%), linear-gradient(#14080a, #14080a)',
  graphite: 'radial-gradient(50% 44% at 20% 10%, #3b3f4a 0%, transparent 100%), radial-gradient(50% 50% at 90% 90%, #2c313d 0%, transparent 100%), linear-gradient(#0b0c10, #0b0c10)',
};
const BG_KEY = 'homebase.bgimg';
const bgCss = t => t.bg === 'image' ? (localStorage.getItem(BG_KEY) ? `url("${localStorage.getItem(BG_KEY)}")` : '') : (WALLPAPERS[t.bg] || '');

// Downscale an uploaded picture so it fits comfortably in browser storage.
function loadBackgroundFile(file) {
  return new Promise((resolve, reject) => {
    const img = new Image(), url = URL.createObjectURL(file);
    img.onload = () => {
      const k = Math.min(1, 1920 / Math.max(img.width, img.height));
      const c = document.createElement('canvas');
      c.width = Math.round(img.width * k); c.height = Math.round(img.height * k);
      c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
      // Brightness of the picture's lighter areas (90th percentile) drives the readability guard.
      const t = document.createElement('canvas'); t.width = t.height = 48;
      const tg = t.getContext('2d'); tg.drawImage(c, 0, 0, 48, 48);
      const px = tg.getImageData(0, 0, 48, 48).data, lum = [];
      for (let i = 0; i < px.length; i += 4) lum.push((0.2126 * px[i] + 0.7152 * px[i + 1] + 0.0722 * px[i + 2]) / 255);
      lum.sort((a, b) => a - b);
      URL.revokeObjectURL(url);
      resolve({ data: c.toDataURL('image/jpeg', 0.82), luma: lum[Math.floor(lum.length * 0.9)] });
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('That file is not an image the browser can read.')); };
    img.src = url;
  });
}

const DEFAULT_THEME = { preset: 'glassnight', accent: '', font: 'system', corners: 'soft', density: 'cozy', bg: 'aurora', dim: 12, bgblur: 0, autodim: 'true', refract: 'true', imgLuma: null };

const sysDark = window.matchMedia('(prefers-color-scheme: dark)');
function readableOn(hex) {
  const n = parseInt(hex.slice(1), 16), r = n >> 16, g = (n >> 8) & 255, b = n & 255;
  return (0.299 * r + 0.587 * g + 0.114 * b) > 160 ? '#111111' : '#ffffff';
}
function applyTheme() {
  const t = { ...DEFAULT_THEME, ...state.theme };
  if (!THEMES.some(x => x.id === t.preset)) t.preset = 'glassnight';
  const root = document.documentElement;
  root.dataset.theme = t.preset;
  root.classList.toggle('sys-dark', sysDark.matches);
  root.dataset.corners = t.corners;
  root.dataset.density = t.density;
  root.dataset.font = t.font;
  root.style.setProperty('--font', FONTS[t.font]?.[1] || FONTS.system[1]);
  if (t.accent) { root.style.setProperty('--accent', t.accent); root.style.setProperty('--on-accent', readableOn(t.accent)); }
  else { root.style.removeProperty('--accent'); root.style.removeProperty('--on-accent'); }
  if (t.preset === 'mono' && !t.accent) root.style.setProperty('--on-accent', '#ffffff');
  const bg = bgCss(t), bgEl = $('#bg');
  root.classList.toggle('has-bg', !!bg);
  bgEl.style.backgroundImage = bg;
  bgEl.style.filter = t.bgblur ? `blur(${t.bgblur}px)` : '';
  root.classList.toggle('refract', REFRACT && t.refract !== 'false');
  // Readability guard: darken (or lighten, on light themes) enough that text clears the picture's brightest areas.
  let dim = t.dim / 100;
  const dark = getComputedStyle(root).colorScheme.includes('dark');
  if (t.autodim !== 'false' && t.bg === 'image' && t.imgLuma != null) {
    const L = t.imgLuma;
    if (dark && L > 0.3) dim = Math.max(dim, 1 - 0.3 / L);
    if (!dark && L < 0.78) dim = Math.max(dim, (0.78 - L) / (1 - L));
  }
  root.style.setProperty('--dim', Math.min(dim, 0.9));
  // Text that sits straight on the background follows the background's brightness, not the theme's.
  let tone = '';
  if (bg) {
    const base = t.bg === 'image' ? (t.imgLuma ?? 0.5) : 0.15, d = Math.min(dim, 0.9);
    tone = (dark ? base * (1 - d) : base + (1 - base) * d) < 0.5 ? 'dark' : 'light';
  }
  root.dataset.bgTone = tone;
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.content = getComputedStyle(root).getPropertyValue('--bg').trim() || '#4f46e5';
}
sysDark.addEventListener('change', applyTheme);

/* ---------- state ---------- */
let state = load();
const ui = { view: 'today', arg: null, date: todayKey(), editing: false, openNotes: new Set(), focus: null };

function instantiateLists(spaceId, tplLists) {
  return tplLists.map(l => ({
    id: uid(), spaceId, name: l.name, cadence: l.cadence, askNote: !!l.askNote,
    items: l.items.map(i => ({ id: uid(), text: i.text, ...(i.days ? { days: [...i.days] } : {}), ...(i.optional ? { optional: true } : {}), ...(i.time ? { time: i.time, dur: i.dur || 30 } : {}) })),
  }));
}

function seed() {
  const work = { id: uid(), name: 'Work', icon: 'briefcase', goal: 80 };
  const life = { id: uid(), name: 'Life', icon: 'leaf', goal: 80 };
  const pm = TEMPLATES.find(t => t.id === 'pm'), mo = TEMPLATES.find(t => t.id === 'morning'), rs = TEMPLATES.find(t => t.id === 'reset');
  return {
    v: 3, name: '', created: todayKey(),
    spaces: [work, life],
    lists: [...instantiateLists(work.id, pm.lists), ...instantiateLists(life.id, [...mo.lists, ...rs.lists])],
    log: {}, theme: { ...DEFAULT_THEME }, home: { upNext: true, pulse: true },
  };
}

function ensureInbox(s) {
  if (!s.v || s.v < 3) { // v3: dark liquid glass over a wallpaper is the default look
    const t = s.theme || {};
    s.theme = { ...t, preset: 'glassnight' };
    if (!t.bg || t.bg === 'none') { s.theme.bg = 'aurora'; s.theme.dim = 12; }
    s.v = 3;
  }
  s.theme = { ...DEFAULT_THEME, ...s.theme };
  s.home = { upNext: true, pulse: true, photo: true, photoPos: { x: 50, y: 50 }, photoCaption: '', ...s.home };
  s.spaces.forEach(sp => { sp.icon = iconName(sp); delete sp.emoji; sp.links ??= []; });
  if (!s.created) {
    const days = Object.keys(s.log || {}).filter(k => k.startsWith('d:')).map(k => k.slice(2)).sort();
    s.created = days[0] || todayKey();
  }
  if (!s.lists.some(l => l.id === 'inbox')) s.lists.push({ id: 'inbox', spaceId: null, name: 'Quick tasks', cadence: 'once', askNote: false, items: [] });
  return s;
}

function load() {
  const raw = localStorage.getItem(STORE_KEY);
  if (!raw) return ensureInbox(seed());
  try {
    return ensureInbox(JSON.parse(raw));
  } catch (err) {
    // Never silently discard user data: park the unreadable copy before starting fresh.
    localStorage.setItem(STORE_KEY + '.corrupt.' + Date.now(), raw);
    console.error('Home Base: saved data was unreadable, backed up and reset.', err);
    return ensureInbox(seed());
  }
}
function save() { localStorage.setItem(STORE_KEY, JSON.stringify(state)); }

/* ---------- domain logic ---------- */
const listById = id => state.lists.find(l => l.id === id);
const spaceById = id => state.spaces.find(s => s.id === id);
const periodKey = (list, date) => list.cadence === 'daily' ? 'd:' + date : list.cadence === 'weekly' ? 'w:' + weekStart(date) : 'once';

function itemsFor(list, date) {
  if (list.cadence !== 'daily') return list.items;
  const dow = parse(date).getDay();
  return list.items.filter(i => !i.days?.length || i.days.includes(dow));
}
const entry = (list, item, date) => state.log[periodKey(list, date)]?.[item.id];

function setEntry(list, item, date, patch) {
  const pk = periodKey(list, date);
  const bucket = (state.log[pk] ??= {});
  const e = (bucket[item.id] ??= {});
  Object.assign(e, patch);
  if (!e.done && !e.note) delete bucket[item.id];
  save();
}

function listStats(list, date) {
  const items = itemsFor(list, date);
  const req = items.filter(i => !i.optional), opt = items.filter(i => i.optional);
  const done = a => a.filter(i => entry(list, i, date)?.done).length;
  return { total: req.length, done: done(req), optTotal: opt.length, optDone: done(opt) };
}
const goalOf = sp => sp?.goal ?? 80;

// Only required items count toward a percentage. Optional ones are bonus.
function spaceDay(spaceId, date) {
  const t = { done: 0, total: 0, optDone: 0, optTotal: 0 };
  for (const l of state.lists) {
    if (l.cadence !== 'daily' || !l.spaceId || (spaceId && l.spaceId !== spaceId) || (!spaceId && spaceById(l.spaceId)?.hidden)) continue;
    const s = listStats(l, date);
    t.done += s.done; t.total += s.total; t.optDone += s.optDone; t.optTotal += s.optTotal;
  }
  t.pct = t.total ? Math.round(t.done / t.total * 100) : null;
  return t;
}
function dayStats(date) {
  const s = spaceDay(null, date);
  return { done: s.done, total: s.total, pct: s.pct ?? 0 };
}

// Last n days (ending today): daily percentages, their average, and the current streak of goal-hitting days.
function trend(spaceId, n = 7) {
  const today = todayKey(), goal = goalOf(spaceId && spaceById(spaceId)), created = state.created || today;
  const days = Array.from({ length: n }, (_, i) => addDays(today, i - (n - 1)));
  const series = days.map(d => d < created ? null : spaceDay(spaceId, d).pct);
  const vals = series.filter(v => v !== null);
  const avg = vals.length ? Math.round(vals.reduce((a, b) => a + b, 0) / vals.length) : null;
  let streak = 0;
  for (let i = 0; i < 400; i++) {
    const d = addDays(today, -i);
    if (d < created) break;
    const p = spaceDay(spaceId, d).pct;
    if (p === null) continue;
    if (p >= goal) streak++;
    else if (i > 0) break; // today may still be in progress
  }
  return { days, series, avg, streak, goal };
}

/* ---------- calendar ---------- */
// Per-task time blocks and the Add to Google Calendar button. Switched off for now; set to true to bring it back.
const CALENDAR = false;
const fmtTime = hhmm => { const [h, m] = hhmm.split(':').map(Number); return new Date(2000, 0, 1, h, m).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' }); };

// Prefilled Google Calendar event. Daily tasks become a repeating event that matches the task's days.
function gcalUrl(list, item, date) {
  const [h, m] = item.time.split(':').map(Number), dur = item.dur || 30;
  let day = date;
  if (list.cadence === 'daily' && item.days?.length) { // first occurrence must land on one of the task's days
    for (let i = 0; i < 7 && !item.days.includes(parse(day).getDay()); i++) day = addDays(day, 1);
  }
  const start = parse(day); start.setHours(h, m, 0, 0);
  const end = new Date(start.getTime() + dur * 60000);
  const f = d => `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}T${pad(d.getHours())}${pad(d.getMinutes())}00`;
  const space = spaceById(list.spaceId), note = entry(list, item, date)?.note;
  const q = new URLSearchParams({
    action: 'TEMPLATE', text: item.text, dates: `${f(start)}/${f(end)}`,
    details: [`${space ? space.name + ' · ' : ''}${list.name}`, note].filter(Boolean).join('\n'),
  });
  if (list.cadence === 'daily') {
    const by = item.days?.length ? item.days.map(d => ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'][d]).join(',') : '';
    q.set('recur', by ? `RRULE:FREQ=WEEKLY;BYDAY=${by}` : 'RRULE:FREQ=DAILY');
  }
  return 'https://calendar.google.com/calendar/render?' + q;
}

/* ---------- quick links (per space; never included when sharing a setup) ---------- */
const LINK_SUGGESTIONS = [['Slack', 'https://app.slack.com'], ['Gmail', 'https://mail.google.com'], ['Calendar', 'https://calendar.google.com'], ['Drive', 'https://drive.google.com'],
  ['Jira', 'https://www.atlassian.com/software/jira'], ['Asana', 'https://app.asana.com'], ['Notion', 'https://www.notion.so'], ['Linear', 'https://linear.app'],
  ['Figma', 'https://www.figma.com'], ['Zoom', 'https://zoom.us'], ['Trello', 'https://trello.com'], ['ClickUp', 'https://app.clickup.com']];

// Accept "slack.com" as well as full addresses, but only ever web links.
function normUrl(raw) {
  let t = String(raw).trim();
  if (!t) return null;
  if (!/^[a-z][a-z0-9+.-]*:/i.test(t)) t = 'https://' + t;
  try { const u = new URL(t); return /^https?:$/.test(u.protocol) && u.hostname.includes('.') ? u.href : null; } catch { return null; }
}
function addLink(spaceId, title, rawUrl) {
  const url = normUrl(rawUrl);
  if (!url) { toast('Enter a valid web address, like slack.com'); return false; }
  const sp = spaceById(spaceId);
  (sp.links ??= []).push({ id: uid(), title: title.trim() || new URL(url).hostname.replace(/^www\./, ''), url });
  save(); ui.focus = '#ql-title'; render();
  return true;
}
function linksView(sp) {
  if (!sp.links?.length) return '';
  const c = spaceColor(sp);
  return `<div class="qlinks" aria-label="Quick links">${sp.links.map(l => `<a class="qlink glass" href="${esc(l.url)}" target="_blank" rel="noopener noreferrer"><span class="qdot" style="background:${c};color:${readableOn(c)}">${esc((l.title[0] || '•').toUpperCase())}</span>${esc(l.title)}<span class="qarrow" aria-hidden="true">↗</span></a>`).join('')}</div>`;
}
function linksEditor(sp) {
  sp.links ??= [];
  const have = new Set(sp.links.map(l => l.title.toLowerCase()));
  return `<section class="card"><div class="card-head"><h3>Quick links</h3><span class="badge">Open in a new tab from this page</span></div>
    ${sp.links.map(l => `<div class="ql-row">
      <input class="txt-in" data-f="linkTitle" data-space="${sp.id}" data-link="${l.id}" value="${esc(l.title)}" aria-label="Link title" style="max-width:180px">
      <input class="txt-in" data-f="linkUrl" data-space="${sp.id}" data-link="${l.id}" value="${esc(l.url)}" aria-label="Link address" inputmode="url">
      <button class="icon-btn" data-act="linkMove" data-space="${sp.id}" data-link="${l.id}" data-n="-1" title="Up" aria-label="Move up">↑</button>
      <button class="icon-btn" data-act="linkMove" data-space="${sp.id}" data-link="${l.id}" data-n="1" title="Down" aria-label="Move down">↓</button>
      <button class="icon-btn danger" data-act="linkDel" data-space="${sp.id}" data-link="${l.id}" title="Delete" aria-label="Delete link">✕</button></div>`).join('')}
    <div class="ql-row"><input class="txt-in" id="ql-title" data-f="newLinkTitle" data-space="${sp.id}" placeholder="Name" style="max-width:180px" aria-label="New link name"><input class="txt-in" id="ql-url" data-f="newLinkUrl" data-space="${sp.id}" placeholder="Address, like slack.com" aria-label="New link address" inputmode="url"><button class="btn small" data-act="linkAdd" data-space="${sp.id}">Add</button></div>
    <div class="ql-sugg"><span class="ql-sugg-label">Quick add</span>${LINK_SUGGESTIONS.filter(([n]) => !have.has(n.toLowerCase())).map(([n, u]) => `<button class="chip small" data-act="linkSuggest" data-space="${sp.id}" data-t="${esc(n)}" data-u="${esc(u)}">${esc(n)}</button>`).join('')}</div>
  </section>`;
}

/* ---------- sharing ---------- */
const enc = o => btoa(unescape(encodeURIComponent(JSON.stringify(o)))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const dec = s => JSON.parse(decodeURIComponent(escape(atob(s.replace(/-/g, '+').replace(/_/g, '/')))));

function buildShare(spaceIds) {
  const spaces = state.spaces.filter(s => !spaceIds || spaceIds.includes(s.id));
  const ids = new Set(spaces.map(s => s.id));
  const lists = state.lists.filter(l => ids.has(l.spaceId)).map(({ id, spaceId, name, cadence, askNote, items }) => ({
    id, spaceId, name, cadence, askNote,
    items: items.map(({ text, days, optional, time, dur }) => ({ text, ...(days?.length ? { days } : {}), ...(optional ? { optional: true } : {}), ...(time ? { time, dur: dur || 30 } : {}) })),
  }));
  return { app: 'homebase', v: 1, spaces: spaces.map(({ id, name, icon, goal }) => ({ id, name, icon, goal })), lists };
}

function importShare(payload, mode) {
  if (payload?.app !== 'homebase' || !Array.isArray(payload.spaces) || !Array.isArray(payload.lists)) throw new Error('That does not look like a Home Base setup.');
  const map = {};
  const spaces = payload.spaces.map(s => { const id = uid(); map[s.id] = id; return { id, name: String(s.name || 'Space'), icon: iconName(s), goal: Number(s.goal) || 80, links: [] }; });
  const lists = instantiateLists(null, []).concat(payload.lists.filter(l => map[l.spaceId]).flatMap(l => instantiateLists(map[l.spaceId], [l])));
  if (mode === 'replace') {
    const inbox = state.lists.find(l => l.id === 'inbox');
    state.spaces = spaces; state.lists = [inbox, ...lists]; state.log = {};
  } else {
    state.spaces.push(...spaces); state.lists.push(...lists);
  }
  save();
}

/* ---------- rendering ---------- */
function render() {
  renderNav();
  let html;
  try {
    switch (ui.view) {
      case 'week': html = viewWeek(); break;
      case 'today': html = viewToday(); break;
      case 'settings': html = viewSettings(); break;
      case 'space': if (spaceById(ui.arg)) { html = viewSpace(spaceById(ui.arg)); break; }
      // falls through: unknown space goes home
      default: ui.view = 'home'; html = viewHome();
    }
  } catch (err) {
    // Never leave a half-drawn page with dead buttons: say what broke, then let it surface in the console.
    toast('Something went wrong drawing this page: ' + err.message);
    throw err;
  }
  $('#main').innerHTML = html;
  $('#main').dataset.view = ui.view;
  $('#main').classList.toggle('arranging', !!ui.arrange && ui.view === 'home');
  Glass.refresh();
  Motion.apply();
  if (ui.focus) { const el = $(ui.focus); if (el) el.focus(); ui.focus = null; }
}

function renderNav() {
  const on = v => (ui.view === v || (v === 'home' && ui.view === 'space')) ? ' active' : '';
  const link = (v, label, icon) => `<a class="nav-link${on(v)}" href="#/${v}">${ico(icon, 20)}<span>${label}</span></a>`;
  $('#nav').innerHTML = link('home', 'Home', 'home') + link('today', 'Today', 'sun') + link('week', 'Week', 'calendar')
    + `<span class="nav-sep"></span><a class="nav-link icon-only${on('settings')}" href="#/settings" aria-label="Settings" title="Settings">${ico('gear', 20)}</a>`;
}

function ring(pct) {
  const c = 2 * Math.PI * 26;
  return `<div class="ring"><svg width="64" height="64" viewBox="0 0 64 64"><circle class="bg" cx="32" cy="32" r="26"/><circle class="fg" cx="32" cy="32" r="26" stroke-dasharray="${c.toFixed(1)}" stroke-dashoffset="${(c * (1 - pct / 100)).toFixed(1)}"/></svg><div class="pct">${pct}%</div></div>`;
}

function greeting() {
  const h = new Date().getHours();
  const g = h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening';
  return state.name ? `${g}, ${esc(state.name)}` : g;
}

function dateNav(weekly) {
  const step = weekly ? 7 : 1;
  const isNow = weekly ? weekStart(ui.date) === weekStart(todayKey()) : ui.date === todayKey();
  return `<div class="datenav">
    <button class="chip" data-act="shift" data-n="${-step}" aria-label="Previous">‹</button>
    <button class="chip${isNow ? ' on' : ''}" data-act="goToday">${weekly ? 'This week' : 'Today'}</button>
    <button class="chip" data-act="shift" data-n="${step}" aria-label="Next">›</button>
  </div>`;
}

function pastBanner() {
  return ui.date !== todayKey() ? `<div class="banner">Viewing ${esc(fmt(ui.date, { weekday: 'long', month: 'short', day: 'numeric' }))}. You can still check things off.</div>` : '';
}

function renderItem(list, item, date) {
  const e = entry(list, item, date);
  const done = !!e?.done;
  const open = ui.openNotes.has(item.id);
  const tag = (list.cadence === 'daily' && item.days?.length ? `<span class="tag">${item.days.map(d => DAY_NAMES[d]).join(', ')}</span>` : '')
    + (item.optional ? '<span class="tag opt">Optional</span>' : '')
    + (CALENDAR && item.time ? `<span class="tag">${esc(fmtTime(item.time))} · ${item.dur || 30}m</span>` : '');
  return `<div class="item${done ? ' done' : ''}">
    <button class="check" data-act="toggle" data-list="${list.id}" data-item="${item.id}" aria-label="${done ? 'Uncheck' : 'Check'} ${esc(item.text)}" aria-pressed="${done}">✓</button>
    <div class="body">
      <div class="txt" data-act="note" data-item="${item.id}">${esc(item.text)}${tag}</div>
      ${open
        ? `<textarea class="notebox" data-f="note" data-list="${list.id}" data-item="${item.id}" placeholder="What are you doing, what did you decide, who needs to know?">${esc(e?.note || '')}</textarea><button class="btn small danger del-task" data-act="delTask" data-list="${list.id}" data-item="${item.id}">Delete task</button>`
        : e?.note ? `<div class="note">${esc(e.note)}</div>` : ''}
    </div>
    ${CALENDAR && item.time ? `<button class="icon-btn" data-act="gcal" data-list="${list.id}" data-item="${item.id}" title="Add to Google Calendar" aria-label="Add to Google Calendar">${ico('calendar', 16)}</button>` : ''}
    <button class="icon-btn" data-act="note" data-item="${item.id}" title="Add a note" aria-label="Note">✎</button>
    ${list.id === 'inbox' ? `<button class="icon-btn danger" data-act="delTask" data-list="inbox" data-item="${item.id}" title="Delete" aria-label="Delete ${esc(item.text)}">✕</button>` : ''}
  </div>`;
}

function renderListCard(list, date, prefix = '') {
  const items = itemsFor(list, date);
  const st = listStats(list, date);
  const when = list.cadence === 'weekly' ? ' · resets Monday' : '';
  return `<section class="card">
    <div class="card-head"><h3>${prefix}${esc(list.name)}<span style="color:var(--muted);font-weight:400;font-size:14px">${when}</span></h3>
      ${st.optTotal ? `<span class="badge">${st.optDone}/${st.optTotal} optional</span>` : ''}
      ${st.total ? `<span class="badge${st.done === st.total ? ' full' : ''}">${st.done}/${st.total}</span>` : ''}</div>
    ${items.length ? items.map(i => renderItem(list, i, date)).join('') : '<div class="empty">Nothing scheduled here today.</div>'}
  </section>`;
}

/* ----- Home ----- */
// Glass-tube neon rings: dark groove, glass walls, a gradient core with shade and sheen for depth,
// a glowing end cap, and a glint that travels along the lit arc (driven by Motion on scroll/swipe/pointer).
// More than three spaces: one liquid neon tube per space instead of concentric rings.
function barsHTML(rows, all) {
  const bars = rows.map(({ sp, td, color }) => `<a class="lbar" href="#/space/${sp.id}" style="--c:${color}">
      <span class="lbar-top"><span class="ln">${esc(sp.name)}</span><span class="lc">${td.done}/${td.total}</span><b>${td.pct}%</b></span>
      <span class="lbar-tube"><i style="width:${Math.max(td.pct, td.pct ? 4 : 0)}%"></i></span>
    </a>`).join('');
  return `<div class="score-bars" role="img" aria-label="Overall score ${all.pct ?? 0} percent">
    <div class="bars-total"><b>${all.pct === null ? '–' : all.pct}<small>%</small></b><span>Today</span></div>${bars}</div>`;
}

function ringsSVG(ringRows) {
  const tint = (hex, to, amt) => { const n = parseInt(hex.slice(1), 16); return '#' + [n >> 16, (n >> 8) & 255, n & 255].map(v => Math.round(v + (to - v) * amt).toString(16).padStart(2, '0')).join(''); };
  // One tube per ring, drawn as a single object: dark glass channel, a lit fill, one specular line, one soft halo.
  let defs = '<filter id="rg-halo" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="4"/></filter>'
    + '<filter id="rg-soft" x="-40%" y="-40%" width="180%" height="180%"><feGaussianBlur stdDeviation="1.2"/></filter>';
  let body = '';
  ringRows.forEach(({ td, color }, i) => {
    const r = 111 - i * 24, p = td.pct || 0;
    const arc = (rr, anim = true) => { const len = 2 * Math.PI * rr; return `cx="120" cy="120" r="${rr}" stroke-dasharray="${len.toFixed(1)}" stroke-dashoffset="${(len * (1 - p / 100)).toFixed(1)}"${anim ? ` style="--c:${len.toFixed(1)}"` : ''}`; };
    body += `<circle class="chan" cx="120" cy="120" r="${r}" stroke-width="15"/><circle class="chan-in" cx="120" cy="120" r="${r - 6.5}" stroke-width="1"/>`;
    if (!p) return;
    const glintLen = 2 * Math.PI * r;
    defs += `<linearGradient id="rgg${i}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${tint(color, 255, .35)}"/><stop offset=".6" stop-color="${color}"/><stop offset="1" stop-color="${tint(color, 0, .18)}"/></linearGradient>`
      + `<mask id="rgm${i}" maskUnits="userSpaceOnUse" x="0" y="0" width="240" height="240"><g transform="rotate(-90 120 120)"><circle ${arc(r, false)} fill="none" stroke="#fff" stroke-width="13" stroke-linecap="round"/></g></mask>`;
    body += `<g transform="rotate(-90 120 120)">`
      + `<circle class="ra halo" ${arc(r)} stroke="${color}" stroke-width="13" filter="url(#rg-halo)"/>`
      + `<circle class="ra" ${arc(r)} stroke="url(#rgg${i})" stroke-width="13"/>`
      + `<circle class="ra" ${arc(r - 3)} stroke="#fff" stroke-opacity=".4" stroke-width="2"/>`
      + `</g>`
      + `<g mask="url(#rgm${i})"><g class="gscroll" style="--spd:${[1, -1.4, 1.9, -2.4][i]}"><circle class="glint" cx="120" cy="120" r="${r}" stroke="#fff" stroke-width="8" stroke-linecap="round" stroke-dasharray="${(glintLen * .05).toFixed(1)} ${glintLen.toFixed(1)}" filter="url(#rg-soft)" style="animation-duration:${14 + i * 5}s"/></g></g>`;
  });
  return `<defs>${defs}</defs>${body}`;
}

const PHOTO_KEY = 'homebase.photo';
// Photo in a glass pane. 3:2 crop with a movable focal point (Reposition), so faces and horizons stay in frame.
function photoWidget() {
  if (!state.home.photo) return '';
  const data = localStorage.getItem(PHOTO_KEY);
  const pick = '<input type="file" id="photo-file" accept="image/*" data-f="photoFile" hidden>';
  if (!data) return `<section class="photo glass empty" data-glass data-bezel="28" data-scale="56" data-gblur="5">
    <button class="photo-add" data-act="photoPick">${ico('image', 26)}<b>Add a photo</b><span>A person, a place, a reminder of why.</span></button>${pick}</section>`;
  const pos = state.home.photoPos || { x: 50, y: 50 };
  return `<section class="photo glass" data-glass data-bezel="28" data-scale="56" data-gblur="5">
    <div class="photo-frame${ui.reposition ? ' repo' : ''}">
      <img class="photo-img" src="${data}" alt="${esc(state.home.photoCaption || 'Your photo')}" draggable="false" style="object-position:${pos.x}% ${pos.y}%">
      <div class="photo-sheen"></div>
      ${ui.reposition ? '<div class="photo-hint">Drag to reposition</div>' : ''}
    </div>
    <div class="photo-bar">
      <input class="photo-cap" data-f="photoCaption" value="${esc(state.home.photoCaption || '')}" placeholder="Add a caption" aria-label="Caption">
      <button class="icon-btn${ui.reposition ? ' on' : ''}" data-act="photoRepo" title="${ui.reposition ? 'Done' : 'Reposition'}" aria-label="Reposition">${ico('move', 16)}</button>
      <button class="icon-btn" data-act="photoPick" title="Change photo" aria-label="Change photo">${ico('image', 16)}</button>
      <button class="icon-btn danger" data-act="photoRemove" title="Remove photo" aria-label="Remove photo">✕</button>
    </div>${pick}</section>`;
}

const hasDaily = spaceId => state.lists.some(l => l.spaceId === spaceId && l.cadence === 'daily' && l.items.length);

function viewHome() {
  const date = todayKey();
  const all = spaceDay(null, date), tr = trend(null);
  const vis = state.spaces.filter(sp => !sp.hidden);
  const colorOf = i => spaceColor(vis[i]);
  const tiles = vis.map((sp, idx) => {
    const td = spaceDay(sp.id, date), t = trend(sp.id), goal = goalOf(sp), pct = td.pct;
    return `<a class="tile glass" data-sort="${sp.id}" style="--sc:${colorOf(idx)}" data-glass data-bezel="30" data-scale="64" data-gblur="5" href="#/space/${sp.id}">
      <div class="tile-top"><span class="tile-ico">${ico(iconName(sp), 20)}</span>${esc(sp.name)}<span class="tile-go">›</span></div>
      <div><div class="big">${pct === null ? '–' : pct + '<small>%</small>'}</div>
        <div class="cap">${td.total ? `${td.done} of ${td.total} required done today` : 'Nothing required today'}</div></div>
      <div class="meter" role="img" aria-label="${pct || 0} percent of today's required tasks, goal ${goal} percent"><i style="width:${pct || 0}%"></i><u style="left:${goal}%"></u></div>
      <div class="minibars" aria-hidden="true">${t.series.map((v, i) => `<i class="${v !== null && v >= goal ? 'hit' : ''}${i === t.series.length - 1 ? ' now' : ''}" style="height:${v === null ? 4 : Math.max(8, v)}%"></i>`).join('')}</div>
      <div class="tile-foot"><span><b>${t.avg === null ? '–' : t.avg + '%'}</b> 7-day avg</span><span><b>${t.streak}</b> day streak</span>${td.optTotal ? `<span><b>${td.optDone}/${td.optTotal}</b> optional</span>` : ''}<span>Goal ${goal}%</span></div>
    </a>`;
  }).join('');

  // Overall score: one ring per space that has daily tasks (outermost first), combined percentage in the middle.
  const rows = vis.map((sp, i) => ({ sp, td: spaceDay(sp.id, date), color: colorOf(i) }));
  const active = rows.filter(r => r.td.total > 0), useBars = active.length > 3, ringRows = active;
  const score = vis.length ? `<section class="score glass" data-glass data-bezel="32" data-scale="64" data-gblur="5">
    ${useBars ? barsHTML(active, all) : `<div class="score-ring n${ringRows.length}" style="--ring0:${ringRows[0]?.color || 'var(--accent)'}">
      <svg viewBox="0 0 240 240" role="img" aria-label="Overall score ${all.pct ?? 0} percent">${ringsSVG(ringRows)}</svg>
      <div class="score-center"><b>${all.pct === null ? '–' : all.pct}<small>%</small></b><span>Today</span></div>
    </div>`}
    <div class="score-side">
      <div class="score-title">Today's score</div>
      <div class="score-sub">${all.total ? `${all.done} of ${all.total} required tasks` : 'No required tasks yet'}</div>
      ${useBars ? '' : `<div class="legend">${rows.filter(r => r.td.total > 0).map(({ sp, td, color }) => `<a class="legend-row" href="#/space/${sp.id}"><span class="dot" style="background:${color};color:${color}"></span><span class="ln">${esc(sp.name)}</span><span class="lc">${td.done}/${td.total}</span><b>${td.pct}%</b></a>`).join('')}</div>`}
      <div class="score-foot"><span><b>${tr.avg === null ? '–' : tr.avg + '%'}</b> 7-day avg</span><span><b>${tr.streak}</b> day streak</span></div>
    </div>
  </section>` : '';

  const next = [];
  for (const l of state.lists) {
    if (l.cadence !== 'daily' || !l.spaceId || spaceById(l.spaceId)?.hidden) continue;
    for (const i of itemsFor(l, date)) if (!i.optional && !entry(l, i, date)?.done) next.push([l, i]);
  }
  // A space with no daily tasks is just things the user wants done sometime, so its open tasks show here too.
  for (const l of state.lists) {
    if (l.cadence === 'daily' || !l.spaceId || spaceById(l.spaceId)?.hidden || hasDaily(l.spaceId)) continue;
    for (const i of l.items) if (!i.optional && !entry(l, i, date)?.done) next.push([l, i]);
  }
  const upNext = state.home.upNext ? `<section class="card upnext">
    <div class="card-head"><h3>Up next</h3><span class="badge">${next.length} left</span></div>
    ${next.length ? next.slice(0, 5).map(([l, i]) => renderItem(l, i, date)).join('')
      : `<div class="empty">${all.total ? 'Every required task is done. Anything optional is a bonus.' : 'No required tasks yet. Open a space to add some.'}</div>`}
  </section>` : '';

  const letters = tr.days.map(d => fmt(d, { weekday: 'narrow' }));
  const pulse = state.home.pulse ? `<section class="card pulse">
    <div class="pulse-head"><h3>Last 7 days</h3><span><b>${tr.avg === null ? '–' : tr.avg + '%'}</b>average</span></div>
    <div class="pcols">${tr.series.map((v, i) => `<div class="pcol${i === 6 ? ' now' : ''}"><div class="b"><i class="${v !== null && v >= tr.goal ? 'hit' : ''}" style="height:${v || 0}%"></i></div><span>${letters[i]}</span></div>`).join('')}</div>
  </section>` : '';

  return `
    <div class="hero">
      <div class="eyebrow">${esc(fmt(date, { weekday: 'long', month: 'long', day: 'numeric' }))}</div>
      <h1>${greeting()}</h1>
      <p>${all.total ? `<b>${all.done} of ${all.total}</b> required tasks done today${all.pct !== null ? `, <b>${all.pct}%</b>` : ''}.` : 'Add your first tasks to get started.'}</p>
    </div>
    <div class="home-grid">${homeSections({
      score,
      tiles: `<div class="tiles">${tiles}<button class="tile ghost" data-act="newSpace">${ico('plus', 22)}&nbsp;New space</button></div>`,
      upnext: upNext, photo: photoWidget(), pulse,
    })}</div>
    ${ui.arrange ? '<button class="btn primary arrange-done" data-act="arrangeDone">Done</button>' : ''}`;
}

// Home sections in the order the user arranged them. Anything new or never arranged goes at the end.
function homeSections(secs) {
  const saved = (state.home.order || []).filter(k => k in secs);
  return [...saved, ...Object.keys(secs).filter(k => !saved.includes(k))]
    .filter(k => secs[k]).map(k => `<div class="sec" data-sort="${k}">${secs[k]}</div>`).join('');
}

/* ----- Today ----- */
function viewToday() {
  const date = ui.date;
  const st = dayStats(date);
  const inbox = listById('inbox');
  const isToday = date === todayKey();
  let body = '';
  for (const sp of state.spaces) {
    const lists = state.lists.filter(l => l.spaceId === sp.id && l.cadence === 'daily' && itemsFor(l, date).length);
    if (!lists.length) continue;
    body += `<div class="group-title"><a href="#/space/${sp.id}">${ico(iconName(sp), 15)} ${esc(sp.name)}</a></div><div class="lists">${lists.map(l => renderListCard(l, date)).join('')}</div>`;
  }
  if (!body) body = `<div class="card"><div class="empty">No daily lists yet. Open a space and add one, or pick a template from Settings.</div></div>`;

  const weekly = state.lists.filter(l => l.cadence === 'weekly');
  const wTotals = weekly.reduce((a, l) => { const s = listStats(l, date); return [a[0] + s.done, a[1] + s.total]; }, [0, 0]);
  const weekCard = weekly.length ? `<a class="card" href="#/week" style="display:block;text-decoration:none;color:inherit"><div class="card-head"><h3>This week's lists</h3><span class="badge">${wTotals[0]}/${wTotals[1]}</span></div><div class="empty">Weekly checklists reset every Monday. Open the Week view to work through them.</div></a>` : '';

  return `
    <div class="head">
      <div class="grow"><h1>${isToday ? greeting() : esc(fmt(date, { weekday: 'long' }))}</h1><div class="sub">${esc(fmt(date, { weekday: 'long', month: 'long', day: 'numeric' }))} · ${st.done} of ${st.total} required done</div></div>
      ${ring(st.pct)}
    </div>
    ${dateNav(false)}${pastBanner()}
    <div class="quick"><input class="txt-in" data-f="quickAdd" placeholder="Quick task. Press Enter to add" aria-label="Quick task"></div>
    ${inbox.items.length ? `<section class="card">
      <div class="card-head"><h3>Quick tasks</h3>${inbox.items.some(i => entry(inbox, i, date)?.done) ? '<button class="btn small" data-act="clearInbox">Clear done</button>' : ''}</div>
      ${inbox.items.map(i => renderItem(inbox, i, date)).join('')}
    </section>` : ''}
    ${body}
    ${weekCard}`;
}

/* ----- Week ----- */
function viewWeek() {
  const ws = weekStart(ui.date);
  const days = Array.from({ length: 7 }, (_, i) => addDays(ws, i));
  const grid = days.map(d => {
    const s = dayStats(d);
    return `<button class="daycell${d === todayKey() ? ' today' : ''}" data-act="openDay" data-date="${d}">
      <div class="dn">${esc(fmt(d, { weekday: 'short' }))}</div><div class="dd">${parse(d).getDate()}</div>
      <div class="bar"><i style="height:${s.pct}%"></i></div><div class="p">${s.total ? s.pct + '%' : '–'}</div></button>`;
  }).join('');
  const weekly = state.lists.filter(l => l.cadence === 'weekly');
  let wl = '';
  for (const sp of state.spaces) {
    const ls = weekly.filter(l => l.spaceId === sp.id);
    if (ls.length) wl += `<div class="group-title"><a href="#/space/${sp.id}">${ico(iconName(sp), 15)} ${esc(sp.name)}</a></div><div class="lists">${ls.map(l => renderListCard(l, ws)).join('')}</div>`;
  }
  const label = `${fmt(ws, { month: 'short', day: 'numeric' })} to ${fmt(addDays(ws, 6), { month: 'short', day: 'numeric' })}`;
  return `
    <div class="head"><div class="grow"><h1>Week</h1><div class="sub">${esc(label)}</div></div><button class="btn" data-act="weekSummary">Copy week summary</button></div>
    ${dateNav(true)}
    <div class="weekgrid">${grid}</div>
    ${wl || '<div class="card"><div class="empty">No weekly lists yet. Add one in any space and set it to "Weekly".</div></div>'}`;
}

/* ----- Space ----- */
function viewSpace(sp) {
  const lists = state.lists.filter(l => l.spaceId === sp.id);
  const ed = ui.editing, goal = goalOf(sp);
  const tr = trend(sp.id), td = spaceDay(sp.id, ui.date);
  const head = ed
    ? `<div class="head"><div class="icon-wrap"><button class="icon-now" style="--sc:${spaceColor(sp)}" data-act="iconMenu" aria-haspopup="true" aria-expanded="${!!ui.iconMenu}" aria-label="Change icon" title="Change icon">${ico(iconName(sp), 26)}</button>
         ${ui.iconMenu ? `<div class="icon-pop glass" data-glass data-bezel="18" data-scale="34" data-gblur="10" role="radiogroup" aria-label="Icon">${SPACE_ICONS.map(n => `<button class="icon-opt${iconName(sp) === n ? ' on' : ''}" data-act="setIcon" data-space="${sp.id}" data-v="${n}" role="radio" aria-checked="${iconName(sp) === n}" aria-label="${n}" title="${n}">${ico(n, 20)}</button>`).join('')}<div class="pop-color swatches"><span>Color</span>${COLOR_PRESETS.map(c => `<button class="swatch${spaceColor(sp).toLowerCase() === c ? ' on' : ''}" style="--sw:${c}" data-act="setColor" data-space="${sp.id}" data-v="${c}" aria-label="Color ${c}" title="${c}"></button>`).join('')}</div><div class="pop-color custom"><span>Custom</span>${sp.color ? `<button class="icon-btn" data-act="colorReset" data-space="${sp.id}" title="Back to the default color" aria-label="Reset color">↺</button>` : ''}<input type="color" class="color-in" data-f="spaceColor" data-space="${sp.id}" value="${spaceColor(sp)}" aria-label="${esc(sp.name)} ring color" title="Ring color"></div></div>` : ''}</div>
         <input class="txt-in" style="font-size:24px;font-weight:700" data-f="spaceName" data-space="${sp.id}" value="${esc(sp.name)}" aria-label="Space name"></div>
       <div class="row" style="margin-bottom:16px"><label class="field-inline">Daily goal <select class="sel" data-f="spaceGoal" data-space="${sp.id}">${[50, 60, 70, 80, 90, 100].map(g => `<option value="${g}"${g === goal ? ' selected' : ''}>${g}%</option>`).join('')}</select></label><span class="badge">Mark items Optional and they will not count against your goal</span></div>`
    : `<a class="back" href="#/home">‹ Home</a>
       <div class="head"><div class="grow"><h1 class="with-icon">${ico(iconName(sp), 36)}${esc(sp.name)}</h1><div class="sub">${esc(fmt(ui.date, { weekday: 'long', month: 'long', day: 'numeric' }))}</div></div></div>
       <div class="stats">
         <div class="card stat"><b>${td.pct === null ? '–' : td.pct + '%'}</b><span>${ui.date === todayKey() ? 'today' : esc(fmt(ui.date, { month: 'short', day: 'numeric' }))} · goal ${goal}%</span></div>
         <div class="card stat"><b>${tr.avg === null ? '–' : tr.avg + '%'}</b><span>7-day average</span></div>
         <div class="card stat"><b>${tr.streak}</b><span>day streak</span></div>
       </div>`;
  const actions = `<div class="row" style="margin-bottom:16px">
    <button class="btn${ed ? ' primary' : ''}" data-act="toggleEdit">${ed ? 'Done editing' : 'Edit'}</button>
    ${ed ? `<button class="btn" data-act="addList" data-space="${sp.id}">New list</button><button class="btn" data-act="templates" data-space="${sp.id}">Add template</button><button class="btn danger" data-act="delSpace" data-space="${sp.id}">Delete space</button>`
         : `<button class="btn" data-act="summary" data-space="${sp.id}">Copy day summary</button><button class="btn" data-act="shareSpace" data-space="${sp.id}">Share</button>`}
  </div>`;
  const body = lists.length
    ? (ed ? lists.map(renderListEditor).join('') : `<div class="lists">${lists.map(l => renderListCard(l, ui.date)).join('')}</div>`)
    : `<div class="card"><div class="empty" style="padding-top:18px">Empty space. Hit Edit, then add a list or start from a template.</div></div>`;
  return head + (ed ? '' : linksView(sp) + dateNav(false) + pastBanner()) + actions + (ed ? linksEditor(sp) : '') + body;
}

function renderListEditor(list) {
  const idx = state.lists.filter(l => l.spaceId === list.spaceId).indexOf(list);
  return `<section class="card">
    <div class="edit-head">
      <input class="txt-in" data-f="listName" data-list="${list.id}" value="${esc(list.name)}" aria-label="List name">
      <select class="sel" data-f="cadence" data-list="${list.id}" aria-label="Resets">
        <option value="daily"${list.cadence === 'daily' ? ' selected' : ''}>Resets daily</option>
        <option value="weekly"${list.cadence === 'weekly' ? ' selected' : ''}>Resets weekly</option>
        <option value="once"${list.cadence === 'once' ? ' selected' : ''}>Never resets</option>
      </select>
      <label><input type="checkbox" data-f="askNote" data-list="${list.id}"${list.askNote ? ' checked' : ''}> Ask for details on check</label>
      <button class="icon-btn" data-act="moveList" data-list="${list.id}" data-n="-1" title="Move up">↑</button>
      <button class="icon-btn" data-act="moveList" data-list="${list.id}" data-n="1" title="Move down">↓</button>
      <button class="icon-btn danger" data-act="delList" data-list="${list.id}" title="Delete list">🗑</button>
    </div>
    ${list.items.map(i => `<div class="edit-item">
      <input class="txt-in" data-f="itemText" data-list="${list.id}" data-item="${i.id}" value="${esc(i.text)}" aria-label="Item text">
      <button class="icon-btn" data-act="moveItem" data-list="${list.id}" data-item="${i.id}" data-n="-1" title="Up">↑</button>
      <button class="icon-btn" data-act="moveItem" data-list="${list.id}" data-item="${i.id}" data-n="1" title="Down">↓</button>
      <button class="icon-btn danger" data-act="delItem" data-list="${list.id}" data-item="${i.id}" title="Delete">✕</button>
      <button class="chip small${i.optional ? ' on' : ''}" data-act="toggleOptional" data-list="${list.id}" data-item="${i.id}" title="Optional tasks do not count toward your goal">${i.optional ? 'Optional' : 'Required'}</button>
      ${CALENDAR ? `<input type="time" class="txt-in time-in" data-f="itemTime" data-list="${list.id}" data-item="${i.id}" value="${i.time || ''}" aria-label="Start time" title="Optional. Set a time to enable Add to Google Calendar">
      <select class="sel" data-f="itemDur" data-list="${list.id}" data-item="${i.id}" aria-label="Duration"${i.time ? '' : ' hidden'}>${[15, 30, 45, 60, 90, 120].map(n => `<option value="${n}"${(i.dur || 30) === n ? ' selected' : ''}>${n} min</option>`).join('')}</select>` : ''}
      ${list.cadence === 'daily' ? `<div class="days" title="Leave all off for every day">${DAY_LETTERS.map(([ch, n]) => `<button class="day${i.days?.includes(n) ? ' on' : ''}" data-act="toggleDay" data-list="${list.id}" data-item="${i.id}" data-d="${n}" aria-label="${DAY_NAMES[n]}">${ch}</button>`).join('')}</div>` : ''}
    </div>`).join('')}
    <div class="add-row"><input class="txt-in" id="add-${list.id}" data-f="newItem" data-list="${list.id}" placeholder="Add an item. Press Enter"></div>
  </section>`;
}

function appearanceHTML() {
  return `
    <section class="card">
      <div class="card-head"><h3>Appearance</h3></div>
      <div class="setting">
        <h4>Background picture</h4><p>Works with any theme, and looks best behind the glass ones. Uploaded pictures stay on this device.</p>
        <div class="themes">
          <button class="theme-tile${state.theme.bg === 'none' ? ' on' : ''}" data-act="setTheme" data-k="bg" data-v="none"><i style="background:var(--surface-2)"></i>Theme default</button>
          ${Object.entries(WALLPAPERS).map(([k, g]) => `<button class="theme-tile${state.theme.bg === k ? ' on' : ''}" data-act="setTheme" data-k="bg" data-v="${k}"><i style="background:${g}"></i>${k[0].toUpperCase() + k.slice(1)}</button>`).join('')}
          ${localStorage.getItem(BG_KEY) ? `<button class="theme-tile${state.theme.bg === 'image' ? ' on' : ''}" data-act="setTheme" data-k="bg" data-v="image"><i style="background:url('${localStorage.getItem(BG_KEY)}') center/cover"></i>Your picture</button>` : ''}
        </div>
        <div class="row" style="margin-top:10px"><label class="btn" style="cursor:pointer">Upload a picture<input type="file" accept="image/*" data-f="bgFile" hidden></label>${localStorage.getItem(BG_KEY) ? '<button class="btn danger" data-act="removeBg">Remove my picture</button>' : ''}</div>
        <span class="field-label">Darken <b>${state.theme.dim}%</b></span>
        <input type="range" min="0" max="80" value="${state.theme.dim}" data-f="dim" aria-label="Darken">
        <span class="field-label">Blur <b>${state.theme.bgblur}px</b></span>
        <input type="range" min="0" max="24" value="${state.theme.bgblur}" data-f="bgblur" aria-label="Blur background">
        <span class="field-label">Keep text readable</span>
        <div class="opt-row"><button class="chip${state.theme.autodim !== 'false' ? ' on' : ''}" data-act="setTheme" data-k="autodim" data-v="true">Auto</button><button class="chip${state.theme.autodim === 'false' ? ' on' : ''}" data-act="setTheme" data-k="autodim" data-v="false">Manual</button></div>
      </div>
      <div class="setting">
        <h4>Theme</h4><p>Pick a look. Liquid Glass blurs and layers everything over a soft gradient.</p>
        <div class="themes">${THEMES.map(t => `<button class="theme-tile${state.theme.preset === t.id ? ' on' : ''}" data-act="setTheme" data-k="preset" data-v="${t.id}"><i style="background:${t.swatch}"></i>${t.name}</button>`).join('')}</div>
        <span class="field-label">Glass warping${REFRACT ? '' : ' (needs Chrome, Edge or Arc)'}</span>
        <div class="opt-row"><button class="chip${state.theme.refract !== 'false' ? ' on' : ''}" data-act="setTheme" data-k="refract" data-v="true">On</button><button class="chip${state.theme.refract === 'false' ? ' on' : ''}" data-act="setTheme" data-k="refract" data-v="false">Off</button></div>
        <span class="field-label">Accent color</span>
        <div class="swatches">
          <button class="chip${state.theme.accent ? '' : ' on'}" data-act="setTheme" data-k="accent" data-v="">Theme default</button>
          ${ACCENTS.map(c => `<button class="swatch${state.theme.accent === c ? ' on' : ''}" style="background:${c}" data-act="setTheme" data-k="accent" data-v="${c}" aria-label="Accent ${c}"></button>`).join('')}
          <input type="color" data-f="accentCustom" value="${state.theme.accent || '#4f46e5'}" aria-label="Custom accent color" title="Custom color">
        </div>
        <span class="field-label">Font</span>
        <div class="opt-row">${Object.entries(FONTS).map(([k, [n, f]]) => `<button class="chip${state.theme.font === k ? ' on' : ''}" style="font-family:${f}" data-act="setTheme" data-k="font" data-v="${k}">${n}</button>`).join('')}</div>
        <span class="field-label">Corners</span>
        <div class="opt-row">${[['sharp', 'Sharp'], ['soft', 'Soft'], ['round', 'Round']].map(([k, n]) => `<button class="chip${state.theme.corners === k ? ' on' : ''}" data-act="setTheme" data-k="corners" data-v="${k}">${n}</button>`).join('')}</div>
        <span class="field-label">Density</span>
        <div class="opt-row">${[['compact', 'Compact'], ['cozy', 'Cozy'], ['roomy', 'Roomy']].map(([k, n]) => `<button class="chip${state.theme.density === k ? ' on' : ''}" data-act="setTheme" data-k="density" data-v="${k}">${n}</button>`).join('')}</div>
      </div>
    </section>`;
}

function customizeHTML() {
  return `<h2>Style</h2><p>Arrange Home and choose how everything looks.</p>
    <h4 class="sheet-h">Spaces on Home</h4>
    ${state.spaces.map((sp, i) => `<div class="sheet-row">${ico(iconName(sp), 18)}<span class="grow">${esc(sp.name)}</span>
      <button class="icon-btn" data-act="moveSpace" data-space="${sp.id}" data-n="-1" aria-label="Move up"${i === 0 ? ' disabled' : ''}>↑</button>
      <button class="icon-btn" data-act="moveSpace" data-space="${sp.id}" data-n="1" aria-label="Move down"${i === state.spaces.length - 1 ? ' disabled' : ''}>↓</button>
      <button class="chip small${sp.hidden ? '' : ' on'}" data-act="toggleSpace" data-space="${sp.id}">${sp.hidden ? 'Hidden' : 'Shown'}</button>
      <button class="icon-btn danger" data-act="delSpace" data-space="${sp.id}" title="Delete space" aria-label="Delete ${esc(sp.name)}">✕</button></div>`).join('')}
    <h4 class="sheet-h">Widgets</h4>
    <div class="opt-row"><button class="chip${state.home.upNext ? ' on' : ''}" data-act="toggleWidget" data-k="upNext">Up next</button><button class="chip${state.home.pulse ? ' on' : ''}" data-act="toggleWidget" data-k="pulse">Last 7 days</button><button class="chip${state.home.photo ? ' on' : ''}" data-act="toggleWidget" data-k="photo">Photo</button></div>
    <h4 class="sheet-h">Look</h4>
    ${appearanceHTML()}
    <div class="row" style="justify-content:flex-end;margin-top:18px"><button class="btn primary" data-act="closeModal">Done</button></div>`;
}
function openCustomize() { modal(customizeHTML()); $('.modal').dataset.sheet = '1'; $('.modal').scrollTop = 0; }
function refreshSheet() {
  const m = $('.modal[data-sheet]'); if (!m) return;
  const y = m.scrollTop; m.innerHTML = customizeHTML(); m.scrollTop = y; Glass.refresh();
}

/* ----- Settings ----- */
function viewSettings() {
  return `
    <div class="head"><div class="grow"><h1>Settings</h1><div class="sub">Make it yours, then share it.</div></div></div>
    <section class="card">
      <div class="setting"><h4>Your name</h4><p>Used in the greeting.</p><input class="txt-in" style="max-width:280px;width:100%" data-f="name" value="${esc(state.name)}" placeholder="Name"></div>
      <div class="setting"><h4>Style</h4><p>Theme, background, font, accent color, plus which spaces and widgets show on Home.</p><button class="btn primary" data-act="style">Open Style</button></div>
      <div class="setting"><h4>Spaces and templates</h4><p>Spin up a new space from a template, or start blank.</p><button class="btn" data-act="newSpace">＋ New space</button></div>
    </section>
    <section class="card">
      <div class="setting"><h4>Share your setup</h4><p>Creates a link or text that lets someone else get your spaces and lists as their own starting point. Your checked items and notes are never included.</p><button class="btn primary" data-act="shareAll">Share my setup</button> <button class="btn" data-act="importOpen">Import a setup</button></div>
      <div class="setting"><h4>Backup</h4><p>Everything is stored on this device only. Export a backup to move it to another device or keep it safe.</p><button class="btn" data-act="exportAll">Export backup</button> <button class="btn" data-act="restoreOpen">Restore backup</button></div>
    </section>
    <section class="card">
      <div class="setting"><h4>Reset</h4><p>Erase everything on this device and start from the default setup.</p><button class="btn danger" data-act="resetAll">Erase and start over</button></div>
    </section>`;
}

/* ---------- modal + toast ---------- */
function modal(html) {
  closeModal();
  const o = document.createElement('div');
  o.className = 'overlay';
  o.innerHTML = `<div class="modal glass" data-glass data-bezel="26" data-scale="46" data-gblur="8" role="dialog" aria-modal="true">${html}</div>`;
  o.addEventListener('mousedown', e => { if (e.target === o) closeModal(); });
  $('#modal-root').appendChild(o);
  Glass.refresh();
  const first = o.querySelector('input[type=text],input:not([type]),textarea'); if (first) first.focus();
}
function closeModal() { $('#modal-root').innerHTML = ''; }
function toast(msg) {
  const t = document.createElement('div'); t.className = 'toast'; t.textContent = msg; document.body.appendChild(t);
  setTimeout(() => t.remove(), 2200);
}
async function copyText(text) {
  try { await navigator.clipboard.writeText(text); toast('Copied'); } catch { toast('Select the text and copy it manually'); }
}

function templatePicker(spaceId) {
  modal(`<h2>${spaceId ? 'Add a template' : 'New space'}</h2><p>${spaceId ? 'Its lists get added to this space.' : 'Pick a starting point. You can change everything afterward.'}</p>
    ${TEMPLATES.filter(t => spaceId ? t.id !== 'blank' : true).map(t => `<button class="tpl" data-act="useTemplate" data-tpl="${t.id}" data-space="${spaceId || ''}"><span class="e">${ico(t.icon, 24)}</span><span><b>${esc(t.name)}</b><span>${esc(t.desc)}</span></span></button>`).join('')}
    <div class="row" style="justify-content:flex-end"><button class="btn" data-act="closeModal">Cancel</button></div>`);
}

function shareModal(spaceIds, title) {
  const payload = buildShare(spaceIds);
  const json = JSON.stringify(payload);
  const url = location.origin + location.pathname + '#share=' + enc(payload);
  const local = /^(localhost|127\.|\[::1\])/.test(location.hostname) || location.protocol === 'file:';
  modal(`<h2>${esc(title)}</h2>
    <p>${local ? 'This app is running only on your computer right now, so the link below will not work for other people until you host it. The setup text always works: they paste it into Settings, Import.' : 'Send this link. When they open it, they can add your setup to their own Home Base.'}</p>
    <label style="font-size:13px;color:var(--muted)">Link</label><textarea id="share-url" readonly style="min-height:70px">${esc(url)}</textarea>
    <div class="row" style="margin:8px 0 14px"><button class="btn primary" data-act="copyEl" data-el="share-url">Copy link</button></div>
    <label style="font-size:13px;color:var(--muted)">Setup text</label><textarea id="share-json" readonly>${esc(json)}</textarea>
    <div class="row" style="margin-top:8px;justify-content:space-between"><button class="btn" data-act="copyEl" data-el="share-json">Copy text</button><button class="btn" data-act="closeModal">Close</button></div>`);
}

function importModal(prefill = '') {
  modal(`<h2>Import a setup</h2><p>Paste a Home Base link or setup text.</p>
    <textarea id="import-text" placeholder="Paste here">${esc(prefill)}</textarea>
    <div class="row" style="margin-top:10px;justify-content:flex-end"><button class="btn" data-act="closeModal">Cancel</button><button class="btn" data-act="doImport" data-mode="replace">Replace mine</button><button class="btn primary" data-act="doImport" data-mode="add">Add to mine</button></div>`);
}

function readSetupText(text) {
  const t = text.trim();
  const m = t.match(/#share=([A-Za-z0-9_-]+)/);
  return m ? dec(m[1]) : JSON.parse(t);
}

function summaryFor(spaceId, date) {
  const sp = spaceById(spaceId);
  const lines = [`${sp.name} update, ${fmt(date, { weekday: 'long', month: 'short', day: 'numeric' })}`, '', 'Done:'];
  const open = [];
  for (const l of state.lists.filter(x => x.spaceId === spaceId)) {
    if (l.cadence === 'weekly') continue;
    for (const i of itemsFor(l, date)) {
      const e = entry(l, i, date);
      if (e?.done) lines.push(`- ${i.text}${e.note ? ': ' + e.note.replace(/\n+/g, ' ') : ''}`);
      else open.push(`- ${i.text}${e?.note ? ' (' + e.note.replace(/\n+/g, ' ') + ')' : ''}`);
    }
  }
  if (lines.length === 3) lines.push('- (nothing checked off yet)');
  lines.push('', 'Still open:', ...(open.length ? open : ['- nothing']));
  return lines.join('\n');
}

// Week summary. Sections are every visible space, each switchable, so new spaces show up here automatically.
ui.wsOff = new Set();
const weekSections = () => state.spaces.filter(s => !s.hidden).map(s => ({ id: s.id, name: s.name }));
const oneLine = t => t.replace(/\n+/g, ' ');
function weekSummary(ws, off) {
  const days = Array.from({ length: 7 }, (_, i) => addDays(ws, i)), created = state.created || todayKey();
  const out = [`Week of ${fmt(ws, { month: 'short', day: 'numeric' })} to ${fmt(addDays(ws, 6), { month: 'short', day: 'numeric' })}`];
  for (const sp of state.spaces.filter(x => !x.hidden && !off.has(x.id))) {
    const pcts = days.filter(d => d >= created).map(d => spaceDay(sp.id, d).pct).filter(v => v !== null);
    const avg = pcts.length ? Math.round(pcts.reduce((a, b) => a + b, 0) / pcts.length) : null;
    out.push('', `${sp.name.toUpperCase()}${avg === null ? '' : ` (${avg}% daily average, goal ${goalOf(sp)}%)`}`);
    const done = [], open = [];
    for (const l of state.lists.filter(x => x.spaceId === sp.id && x.cadence !== 'once')) {
      if (l.cadence === 'weekly') {
        for (const i of l.items) {
          const e = entry(l, i, ws);
          (e?.done ? done : open).push(`- ${i.text}${e?.note ? ': ' + oneLine(e.note) : ''}`);
        }
        continue;
      }
      for (const i of l.items) {
        const hits = days.filter(d => itemsFor(l, d).includes(i) && entry(l, i, d)?.done);
        if (!hits.length) continue;
        const notes = hits.filter(d => entry(l, i, d).note).map(d => `${fmt(d, { weekday: 'short' })}: ${oneLine(entry(l, i, d).note)}`);
        done.push(`- ${i.text} (${hits.length}/${days.filter(d => itemsFor(l, d).includes(i)).length} days)${notes.length ? ' ' + notes.join('; ') : ''}`);
      }
    }
    out.push('Done:', ...(done.length ? done : ['- nothing checked off']));
    if (open.length) out.push('Weekly items still open:', ...open);
  }
  return out.join('\n');
}
function weekSummaryModal() {
  const ws = weekStart(ui.date);
  modal(`<h2>Week summary</h2><p>Choose what to include, then copy it into your weekly update.</p>
    <div class="opt-row" id="ws-chips" style="margin-bottom:12px">${weekSections().map(x => `<button class="chip${ui.wsOff.has(x.id) ? '' : ' on'}" data-act="wsToggle" data-id="${esc(x.id)}" aria-pressed="${!ui.wsOff.has(x.id)}">${esc(x.name)}</button>`).join('')}</div>
    <textarea id="wsum-text" readonly style="font-family:inherit;font-size:14px;min-height:280px">${esc(weekSummary(ws, ui.wsOff))}</textarea>
    <div class="row" style="margin-top:10px;justify-content:flex-end"><button class="btn" data-act="closeModal">Close</button><button class="btn primary" data-act="copyEl" data-el="wsum-text">Copy</button></div>`);
}

/* ---------- events ---------- */
function moveIn(arr, idx, n) {
  const j = idx + n;
  if (idx < 0 || j < 0 || j >= arr.length) return false;
  [arr[idx], arr[j]] = [arr[j], arr[idx]];
  return true;
}

document.addEventListener('click', e => {
  // Tapping anywhere outside the icon menu closes it.
  if (ui.iconMenu && !e.target.closest('.icon-pop, [data-act="iconMenu"]')) { ui.iconMenu = false; render(); }
  const el = e.target.closest('[data-act]');
  if (!el) return;
  const d = el.dataset;
  const list = d.list && listById(d.list);
  const item = list && d.item ? list.items.find(i => i.id === d.item) : null;
  switch (d.act) {
    case 'toggle': {
      const now = !entry(list, item, ui.date)?.done;
      setEntry(list, item, ui.date, { done: now, ...(now ? { t: Date.now() } : {}) });
      if (now && list.askNote && !entry(list, item, ui.date)?.note) { ui.openNotes.add(item.id); ui.focus = `textarea[data-item="${item.id}"]`; }
      render(); break;
    }
    case 'note': {
      // The inbox has no list id on the pencil target, so find the item wherever it lives.
      const id = d.item;
      if (ui.openNotes.has(id)) ui.openNotes.delete(id); else { ui.openNotes.add(id); ui.focus = `textarea[data-item="${id}"]`; }
      render(); break;
    }
    case 'setTheme': state.theme[d.k] = d.v; save(); applyTheme(); render(); refreshSheet(); break;
    case 'removeBg': localStorage.removeItem(BG_KEY); if (state.theme.bg === 'image') state.theme.bg = 'none'; state.theme.imgLuma = null; save(); applyTheme(); render(); refreshSheet(); break;
    case 'toggleOptional': if (item.optional) delete item.optional; else item.optional = true; save(); render(); break;
    case 'style': openCustomize(); break;
    case 'arrangeDone': ui.arrange = false; render(); break;
    case 'iconMenu': ui.iconMenu = !ui.iconMenu; render(); break;
    case 'setIcon': spaceById(d.space).icon = d.v; ui.iconMenu = false; save(); render(); break;
    case 'linkAdd': if (addLink(d.space, $('#ql-title').value, $('#ql-url').value)) break; break;
    case 'linkSuggest': addLink(d.space, d.t, d.u); break;
    case 'linkDel': { const sp = spaceById(d.space); sp.links = sp.links.filter(l => l.id !== d.link); save(); render(); break; }
    case 'linkMove': { const sp = spaceById(d.space); moveIn(sp.links, sp.links.findIndex(l => l.id === d.link), Number(d.n)); save(); render(); break; }
    case 'setColor': spaceById(d.space).color = d.v; save(); render(); break;
    case 'colorReset': delete spaceById(d.space).color; save(); render(); refreshSheet(); break;
    case 'moveSpace': moveIn(state.spaces, state.spaces.findIndex(x => x.id === d.space), Number(d.n)); save(); render(); refreshSheet(); break;
    case 'toggleSpace': { const sp = spaceById(d.space); if (sp.hidden) delete sp.hidden; else sp.hidden = true; save(); render(); refreshSheet(); break; }
    case 'toggleWidget': state.home[d.k] = !state.home[d.k]; save(); render(); refreshSheet(); break;
    case 'photoPick': $('#photo-file').click(); break;
    case 'photoRepo': ui.reposition = !ui.reposition; render(); break;
    case 'photoRemove': if (confirm('Remove this photo?')) { localStorage.removeItem(PHOTO_KEY); ui.reposition = false; render(); } break;
    case 'gcal': window.open(gcalUrl(list, item, ui.date), '_blank', 'noopener'); break;
    case 'shift': ui.date = addDays(ui.date, Number(d.n)); render(); break;
    case 'goToday': ui.date = todayKey(); render(); break;
    case 'openDay': ui.date = d.date; location.hash = '#/today'; break;
    case 'clearInbox': {
      const inbox = listById('inbox');
      inbox.items = inbox.items.filter(i => !entry(inbox, i, ui.date)?.done);
      save(); render(); break;
    }
    case 'toggleEdit': ui.editing = !ui.editing; render(); break;
    case 'toggleDay': {
      const days = new Set(item.days || []);
      days.has(Number(d.d)) ? days.delete(Number(d.d)) : days.add(Number(d.d));
      if (days.size) item.days = [...days]; else delete item.days;
      save(); render(); break;
    }
    case 'delTask': list.items = list.items.filter(i => i.id !== item.id); ui.openNotes.delete(item.id); save(); render(); toast('Task deleted'); break;
    case 'delItem': list.items = list.items.filter(i => i.id !== item.id); save(); render(); break;
    case 'moveItem': moveIn(list.items, list.items.indexOf(item), Number(d.n)); save(); render(); break;
    case 'addList': {
      const l = { id: uid(), spaceId: d.space, name: 'New list', cadence: 'daily', askNote: false, items: [] };
      state.lists.push(l); save(); ui.focus = `input[data-f="listName"][data-list="${l.id}"]`; render(); break;
    }
    case 'delList':
      if (confirm(`Delete the list "${list.name}"?`)) { state.lists = state.lists.filter(l => l.id !== list.id); save(); render(); }
      break;
    case 'moveList': {
      const sibs = state.lists.filter(l => l.spaceId === list.spaceId);
      const other = sibs[sibs.indexOf(list) + Number(d.n)];
      if (other) { const a = state.lists.indexOf(list), b = state.lists.indexOf(other); [state.lists[a], state.lists[b]] = [state.lists[b], state.lists[a]]; save(); render(); }
      break;
    }
    case 'newSpace': templatePicker(null); break;
    case 'templates': templatePicker(d.space); break;
    case 'useTemplate': {
      const t = TEMPLATES.find(x => x.id === d.tpl);
      let sid = d.space;
      if (!sid) {
        // A new space gets the first ring color nobody else is using, so it never matches an existing space.
        const used = new Set(state.spaces.map(spaceColor));
        sid = uid();
        state.spaces.push({ id: sid, name: t.id === 'blank' ? 'New space' : t.name, icon: t.icon, links: [], color: SPACE_COLORS.find(c => !used.has(c)) || SPACE_COLORS[state.spaces.length % SPACE_COLORS.length] });
      }
      state.lists.push(...instantiateLists(sid, t.lists));
      save(); closeModal();
      if (d.space) render(); else { ui.editNext = t.id === 'blank' ? sid : null; location.hash = '#/space/' + sid; }
      break;
    }
    case 'delSpace': {
      const sp = spaceById(d.space);
      if (confirm(`Delete "${sp.name}" and all its lists? This cannot be undone.`)) {
        state.spaces = state.spaces.filter(s => s.id !== sp.id);
        state.lists = state.lists.filter(l => l.spaceId !== sp.id);
        save(); ui.editing = false;
        if (location.hash.includes(sp.id)) location.hash = '#/home'; else { render(); refreshSheet(); }
      }
      break;
    }
    case 'summary': modal(`<h2>Day summary</h2><p>Paste it into your standup or end-of-day message.</p><textarea id="sum-text" readonly style="font-family:inherit;font-size:14px;min-height:240px">${esc(summaryFor(d.space, ui.date))}</textarea><div class="row" style="margin-top:10px;justify-content:flex-end"><button class="btn" data-act="closeModal">Close</button><button class="btn primary" data-act="copyEl" data-el="sum-text">Copy</button></div>`); break;
    case 'shareSpace': shareModal([d.space], `Share "${spaceById(d.space).name}"`); break;
    case 'shareAll': shareModal(null, 'Share your setup'); break;
    case 'importOpen': importModal(); break;
    case 'doImport':
      try { importShare(readSetupText($('#import-text').value), d.mode); closeModal(); toast('Imported'); render(); }
      catch (err) { toast(err.message || 'Could not read that'); }
      break;
    case 'exportAll': {
      const a = document.createElement('a');
      a.href = URL.createObjectURL(new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' }));
      a.download = `home-base-backup-${todayKey()}.json`; a.click(); URL.revokeObjectURL(a.href); break;
    }
    case 'restoreOpen': modal(`<h2>Restore backup</h2><p>Choose a backup file. This replaces everything on this device.</p><input type="file" id="restore-file" accept="application/json"><div class="row" style="margin-top:14px;justify-content:flex-end"><button class="btn" data-act="closeModal">Cancel</button></div>`); $('#restore-file').addEventListener('change', restoreFile); break;
    case 'resetAll':
      if (confirm('Erase everything on this device? This cannot be undone. Export a backup first if you are unsure.')) { state = ensureInbox(seed()); save(); applyTheme(); toast('Reset'); render(); }
      break;
    case 'copyEl': copyText($('#' + d.el).value); break;
    case 'weekSummary': weekSummaryModal(); break;
    case 'wsToggle': {
      if (ui.wsOff.has(d.id)) ui.wsOff.delete(d.id); else ui.wsOff.add(d.id);
      const on = !ui.wsOff.has(d.id); el.classList.toggle('on', on); el.setAttribute('aria-pressed', on);
      $('#wsum-text').value = weekSummary(weekStart(ui.date), ui.wsOff); break;
    }
    case 'closeModal': closeModal(); break;
  }
});

async function restoreFile(e) {
  const f = e.target.files[0]; if (!f) return;
  try {
    const next = JSON.parse(await f.text());
    if (!Array.isArray(next.spaces) || !Array.isArray(next.lists) || typeof next.log !== 'object') throw new Error('Not a Home Base backup.');
    state = ensureInbox(next); save(); applyTheme(); closeModal(); toast('Restored'); render();
  } catch (err) { toast(err.message || 'Could not read that file'); }
}

document.addEventListener('input', e => {
  const t = e.target, d = t.dataset;
  if (!d.f) return;
  const list = d.list && listById(d.list);
  switch (d.f) {
    case 'note': {
      const item = list.items.find(i => i.id === d.item);
      setEntry(list, item, ui.date, { note: t.value.trim() ? t.value : '' }); break;
    }
    case 'photoCaption': state.home.photoCaption = t.value; save(); break;
    case 'dim': state.theme.dim = +t.value; save(); applyTheme(); t.previousElementSibling.querySelector('b').textContent = t.value + '%'; break;
    case 'bgblur': state.theme.bgblur = +t.value; save(); applyTheme(); t.previousElementSibling.querySelector('b').textContent = t.value + 'px'; break;
    case 'accentCustom': state.theme.accent = t.value; save(); applyTheme(); break;
    case 'name': state.name = t.value.trim(); save(); break;
    case 'linkTitle': spaceById(d.space).links.find(l => l.id === d.link).title = t.value; save(); break;
    case 'linkUrl': { const u = normUrl(t.value); t.setAttribute('aria-invalid', u ? 'false' : 'true'); if (u) { spaceById(d.space).links.find(l => l.id === d.link).url = u; save(); } break; }
    case 'spaceColor': spaceById(d.space).color = t.value; save(); if (!t.closest('main')) render(); else $('.icon-now')?.style.setProperty('--sc', t.value); break; // in the icon popover, keep it open and tint the icon live
    case 'spaceName': spaceById(d.space).name = t.value; save(); break;
    case 'listName': list.name = t.value; save(); break;
    case 'itemText': list.items.find(i => i.id === d.item).text = t.value; save(); break;
    case 'itemTime': {
      const it = list.items.find(i => i.id === d.item);
      if (t.value) { it.time = t.value; it.dur ||= 30; } else { delete it.time; delete it.dur; }
      t.nextElementSibling.hidden = !t.value; save(); break;
    }
    case 'itemDur': list.items.find(i => i.id === d.item).dur = Number(t.value); save(); break;
  }
});

document.addEventListener('change', e => {
  const t = e.target, d = t.dataset;
  const list = d.list && listById(d.list);
  if (d.f === 'photoFile' && t.files[0]) {
    loadBackgroundFile(t.files[0]).then(({ data }) => {
      localStorage.setItem(PHOTO_KEY, data); state.home.photoPos = { x: 50, y: 50 }; save(); render(); toast('Photo added');
    }).catch(err => toast(err.name === 'QuotaExceededError' ? 'That photo is too big to store on this device' : err.message));
  }
  if (d.f === 'bgFile' && t.files[0]) {
    loadBackgroundFile(t.files[0]).then(({ data, luma }) => {
      localStorage.setItem(BG_KEY, data); state.theme.bg = 'image'; state.theme.imgLuma = luma; save(); applyTheme(); render(); refreshSheet(); toast('Background set');
    }).catch(err => toast(err.name === 'QuotaExceededError' ? 'That picture is too big to store on this device' : err.message));
  }
  if (d.f === 'cadence') { list.cadence = t.value; save(); render(); }
  if (d.f === 'askNote') { list.askNote = t.checked; save(); }
  if (d.f === 'spaceColor') { render(); refreshSheet(); }
  if (d.f === 'spaceGoal') { spaceById(d.space).goal = Number(t.value); save(); }
  if (d.f === 'spaceName') renderNav();
  if (d.f === 'spaceIcon') { spaceById(d.space).icon = t.value; save(); renderNav(); }
});

document.addEventListener('keydown', e => {
  const t = e.target, d = t.dataset;
  if (e.key === 'Escape') { if ($('.overlay')) closeModal(); else if (d.f === 'note') { ui.openNotes.delete(d.item); render(); } return; }
  if (e.key !== 'Enter' || e.isComposing) return;
  if (d.f === 'quickAdd' && t.value.trim()) {
    const inbox = listById('inbox');
    inbox.items.push({ id: uid(), text: t.value.trim() }); save(); render();
    ui.focus = 'input[data-f="quickAdd"]'; $(ui.focus).focus(); ui.focus = null;
  }
  if ((d.f === 'newLinkTitle' || d.f === 'newLinkUrl') && $('#ql-url').value.trim()) { e.preventDefault(); addLink(d.space, $('#ql-title').value, $('#ql-url').value); return; }
  if (d.f === 'newItem' && t.value.trim()) {
    listById(d.list).items.push({ id: uid(), text: t.value.trim() }); save();
    ui.focus = `#add-${d.list}`; render();
  }
});

/* ---------- Motion ----------
   Scrolling, swiping and pointer movement push light around the score rings: the glints travel along the
   tubes with inertia, the glow shifts like a light source, and on pointer devices the card tilts. */
const Motion = (() => {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  let px = 0, py = 0, tx = 0, ty = 0, rot = 0, vel = 0, lastY = window.scrollY, touchX = null, raf = 0;
  function apply() {
    document.querySelectorAll('.score, .photo').forEach(el => {
      el.style.setProperty('--px', px.toFixed(3)); el.style.setProperty('--py', py.toFixed(3)); el.style.setProperty('--rot', rot.toFixed(1));
      el.style.setProperty('--gl', Math.sin(rot * 0.015).toFixed(3));
    });
  }
  function frame() {
    raf = 0;
    px += (tx - px) * 0.09; py += (ty - py) * 0.09;
    rot += vel; vel *= 0.93;
    apply();
    if (Math.abs(tx - px) > 0.003 || Math.abs(ty - py) > 0.003 || Math.abs(vel) > 0.03) raf = requestAnimationFrame(frame);
  }
  const kick = () => { if (!raf && !reduce) raf = requestAnimationFrame(frame); };
  window.addEventListener('scroll', () => { const y = window.scrollY; vel = clamp(vel + (y - lastY) * 0.1, -16, 16); lastY = y; kick(); }, { passive: true });
  window.addEventListener('pointermove', e => {
    if (e.pointerType === 'touch') return;
    tx = e.clientX / innerWidth * 2 - 1; ty = e.clientY / innerHeight * 2 - 1; kick();
  }, { passive: true });
  window.addEventListener('touchmove', e => {
    const x = e.touches[0].clientX;
    if (touchX !== null) { vel = clamp(vel + (x - touchX) * 0.35, -16, 16); tx = clamp((x / innerWidth) * 2 - 1, -1, 1); }
    touchX = x; kick();
  }, { passive: true });
  window.addEventListener('touchend', () => { touchX = null; }, { passive: true });
  return { apply, kick };
})();

/* Reposition the photo crop by dragging: the picture follows the pointer. */
let photoDrag = null;
document.addEventListener('pointerdown', e => {
  const f = e.target.closest('.photo-frame.repo'); if (!f) return;
  const img = f.querySelector('img'), p = state.home.photoPos || { x: 50, y: 50 };
  const sc = Math.max(f.clientWidth / img.naturalWidth, f.clientHeight / img.naturalHeight);
  photoDrag = { x: e.clientX, y: e.clientY, px: p.x, py: p.y, img, ox: img.naturalWidth * sc - f.clientWidth, oy: img.naturalHeight * sc - f.clientHeight };
  f.setPointerCapture?.(e.pointerId); e.preventDefault();
});
document.addEventListener('pointermove', e => {
  if (!photoDrag) return;
  const c = v => Math.max(0, Math.min(100, v)), d = photoDrag;
  const nx = d.ox > 1 ? c(d.px - (e.clientX - d.x) / d.ox * 100) : d.px, ny = d.oy > 1 ? c(d.py - (e.clientY - d.y) / d.oy * 100) : d.py;
  d.img.style.objectPosition = `${nx}% ${ny}%`; d.nx = nx; d.ny = ny;
});
document.addEventListener('pointerup', () => {
  if (photoDrag?.nx !== undefined) { state.home.photoPos = { x: photoDrag.nx, y: photoDrag.ny }; save(); }
  photoDrag = null;
});

/* Arrange Home like an iPhone home screen. Hold a section or a space tile to make everything jiggle, then
   drag to reorder. While arranging, a press drags straight away and taps do nothing until Done. */
const Arrange = (() => {
  const HOLD = 450, SLOP = 8;
  let press = null, drag = null, swallowClick = false;
  const blocked = t => t.closest('input, textarea, select, [contenteditable], .photo-frame.repo, .arrange-done');
  const enter = () => { ui.arrange = true; $('#main').classList.add('arranging'); if (!$('.arrange-done')) $('#main').insertAdjacentHTML('beforeend', '<button class="btn primary arrange-done" data-act="arrangeDone">Done</button>'); navigator.vibrate?.(12); };

  function start(item, e) {
    const r = item.getBoundingClientRect();
    drag = { item, offX: e.clientX - r.left, offY: e.clientY - r.top, lastSwap: -Infinity };
    item.classList.add('dragging');
    move(e);
  }
  function follow(e) {
    const { item } = drag;
    item.style.transform = '';
    const r = item.getBoundingClientRect();
    item.style.transform = `translate(${e.clientX - drag.offX - r.left}px, ${e.clientY - drag.offY - r.top}px) scale(1.03)`;
  }
  // Slide displaced pieces from where they visibly are to their new spot (FLIP). Any slide still in flight is
  // cancelled first, so a quick second swap continues from the current position instead of jumping.
  function slide(box, before) {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    for (const el of box.children) {
      const b = before.get(el); if (!b || el === drag?.item) continue;
      const a = el.getBoundingClientRect(), dx = b.left - a.left, dy = b.top - a.top;
      if (Math.abs(dx) < 1 && Math.abs(dy) < 1) continue;
      // 'add' layers the slide on top of the jiggle instead of replacing it
      el._slide = el.animate([{ transform: `translate(${dx}px, ${dy}px)` }, { transform: 'translate(0, 0)' }],
        { duration: 420, easing: 'cubic-bezier(.22,.8,.3,1)', composite: 'add' });
    }
  }
  function move(e) {
    const { item } = drag;
    follow(e);
    if (e.timeStamp - drag.lastSwap < 280) return; // let the last swap settle so pieces never flip back and forth
    // Find the piece under the finger at the same level as the one being moved (a section, or a tile among tiles).
    let over = document.elementFromPoint(e.clientX, e.clientY)?.closest('[data-sort]');
    while (over && over.parentElement !== item.parentElement) over = over.parentElement?.closest('[data-sort]');
    if (over && over !== item) {
      const box = item.parentElement, sibs = [...box.children];
      const before = new Map(sibs.map(el => [el, el.getBoundingClientRect()]));
      sibs.forEach(el => el._slide?.cancel());
      box.insertBefore(item, sibs.indexOf(over) > sibs.indexOf(item) ? over.nextSibling : over);
      slide(box, before);
      drag.lastSwap = e.timeStamp;
      follow(e);
    }
  }
  function commit() {
    const { item } = drag, box = item.parentElement;
    item.classList.remove('dragging'); item.style.transform = '';
    const keys = [...box.querySelectorAll(':scope > [data-sort]')].map(x => x.dataset.sort);
    if (box.classList.contains('home-grid')) state.home.order = keys;
    else { // space tiles: visible spaces take the new order, hidden ones keep their place after them
      const byId = Object.fromEntries(state.spaces.map(s => [s.id, s]));
      state.spaces = [...keys.map(k => byId[k]), ...state.spaces.filter(s => !keys.includes(s.id))];
    }
    save(); drag = null;
  }

  document.addEventListener('pointerdown', e => {
    if (ui.view !== 'home' || e.button > 0 || blocked(e.target)) return;
    const item = e.target.closest('#main [data-sort]'); if (!item) return;
    if (ui.arrange) { e.preventDefault(); swallowClick = true; start(item, e); return; }
    press = { item, x: e.clientX, y: e.clientY, timer: setTimeout(() => { swallowClick = true; enter(); start(item, { clientX: press.x, clientY: press.y }); press = null; }, HOLD) };
  });
  document.addEventListener('pointermove', e => {
    if (press && Math.hypot(e.clientX - press.x, e.clientY - press.y) > SLOP) { clearTimeout(press.timer); press = null; }
    if (press) { press.x = e.clientX; press.y = e.clientY; }
    if (drag) move(e);
  });
  const end = () => { if (press) { clearTimeout(press.timer); press = null; } if (drag) commit(); };
  document.addEventListener('pointerup', end);
  document.addEventListener('pointercancel', end);
  // Once a drag is live on a phone, the page must not scroll under the finger.
  document.addEventListener('touchmove', e => { if (drag) e.preventDefault(); }, { passive: false });
  document.addEventListener('contextmenu', e => { if (press || drag || ui.arrange) e.preventDefault(); });
  // Taps never open a tile or press a button while arranging, or right after a hold.
  document.addEventListener('click', e => {
    if (e.target.closest('.arrange-done')) { swallowClick = false; return; }
    if (swallowClick || ui.arrange) { e.preventDefault(); e.stopImmediatePropagation(); swallowClick = false; }
  }, true);
})();

/* ---------- routing + boot ---------- */
function route() {
  const h = location.hash.replace(/^#\/?/, '') || 'home';
  const [view, arg] = h.split('/');
  if (view === 'space' && ui.editNext === arg) ui.editing = true; // a brand-new blank space opens ready to edit
  else if (view !== 'space' || ui.arg !== arg) ui.editing = false;
  ui.editNext = null; ui.iconMenu = false; ui.arrange = false;
  ui.view = view; ui.arg = arg || null;
  if (view === 'home') ui.date = todayKey();
  render();
  const m = $('#main'); m.classList.remove('enter'); void m.offsetWidth; m.classList.add('enter');
  clearTimeout(ui.enterTimer); ui.enterTimer = setTimeout(() => m.classList.remove('enter'), 1000); // animate on navigation only, never on re-render
  window.scrollTo(0, 0);
}
window.addEventListener('hashchange', () => { if (!handleShareHash()) route(); });

function handleShareHash() {
  const m = location.hash.match(/^#share=([A-Za-z0-9_-]+)/);
  if (!m) return false;
  try {
    const payload = dec(m[1]);
    history.replaceState(null, '', location.pathname + '#/home');
    route();
    const names = payload.spaces.map(s => s.name).join(', ');
    modal(`<h2>Someone shared a setup with you</h2><p>It includes: ${esc(names)}. You can add it alongside what you have, or replace your current setup.</p>
      <div class="row" style="justify-content:flex-end"><button class="btn" data-act="closeModal">Not now</button><button class="btn" data-act="doImportShared" data-mode="replace">Replace mine</button><button class="btn primary" data-act="doImportShared" data-mode="add">Add to mine</button></div>`);
    window.__pendingShare = payload;
  } catch {
    history.replaceState(null, '', location.pathname + '#/home');
    route(); toast('That share link could not be read');
  }
  return true;
}
document.addEventListener('click', e => {
  const el = e.target.closest('[data-act="doImportShared"]');
  if (!el) return;
  try { importShare(window.__pendingShare, el.dataset.mode); closeModal(); toast('Imported'); render(); }
  catch (err) { toast(err.message); }
});

applyTheme();
if (!handleShareHash()) route();

if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
  navigator.serviceWorker.register('sw.js').catch(err => console.error('Service worker failed to register', err));
}
// Roll the view over at midnight if the app is left open.
setInterval(() => { const t = todayKey(); if (ui.date !== t && ui.date === (ui.lastToday || t)) ui.date = t; ui.lastToday = t; }, 60000);
