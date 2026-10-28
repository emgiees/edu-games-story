/* ============================================================
   THE RETRACTION ROOM - game logic
   ------------------------------------------------------------
   Plain JavaScript, no build step. Content comes from content.js,
   settings from config.js. Data is stored in Firebase Realtime
   Database (classroom mode) or in this browser (test mode).

   Data layout under ROOT_KEY:
     cohorts/{code}              name, createdAt, archived, rooms/{roomId}/open
     teams/{code}/{teamId}       name, createdAt, rooms/{roomId}/{startedAt, finishedAt, current, locks[]}
     tests/{code}/{roomId}/{id}  name, answers[], score, at
   ============================================================ */
(function () {
'use strict';

const W = window;
const C = W.RR_CONTENT;
const CFG = W.RR_CONFIG || { ROOT_KEY: 'retraction-room', INSTRUCTOR_PIN: '0000' };
const M = C.meta;
const ROOMS = C.rooms;
const roomById = id => ROOMS.find(r => r.id === id);

/* ================= STORAGE ================= */
const params = new URLSearchParams(location.search);
const IS_LOCAL = !!W.RR_FORCE_LOCAL || params.has('local') || typeof W.firebase === 'undefined' ||
  !W.FIREBASE_CONFIG || !/^https:/.test(W.FIREBASE_CONFIG.databaseURL || '');
const PREVIEW = !!W.RR_PREVIEW;

function splitPath(p) { return String(p).split('/').filter(Boolean); }
function makeLocalStore() {
  const KEY = 'rr-local-db-' + CFG.ROOT_KEY;
  let tree = {};
  try { tree = JSON.parse(localStorage.getItem(KEY)) || {}; } catch (e) { tree = {}; }
  const subs = [];
  const clone = v => (v === undefined ? null : JSON.parse(JSON.stringify(v)));
  function getAt(path) { let n = tree; for (const k of splitPath(path)) { if (n == null || typeof n !== 'object') return null; n = n[k]; } return n === undefined ? null : clone(n); }
  function setAt(path, val) {
    const ks = splitPath(path); if (!ks.length) { tree = val || {}; return; }
    let n = tree; for (let i = 0; i < ks.length - 1; i++) { if (n[ks[i]] == null || typeof n[ks[i]] !== 'object') n[ks[i]] = {}; n = n[ks[i]]; }
    if (val === null || val === undefined) delete n[ks[ks.length - 1]]; else n[ks[ks.length - 1]] = clone(val);
  }
  function persist() { try { localStorage.setItem(KEY, JSON.stringify(tree)); } catch (e) {} }
  function notify(path) { subs.forEach(s => { if (path.indexOf(s.path) === 0 || s.path.indexOf(path) === 0) s.cb(getAt(s.path)); }); }
  W.addEventListener('storage', e => { if (e.key !== KEY) return; try { tree = JSON.parse(e.newValue) || {}; } catch (er) { tree = {}; } subs.forEach(s => s.cb(getAt(s.path))); });
  return {
    local: true,
    get: p => Promise.resolve(getAt(p)),
    set: (p, v) => { setAt(p, v); persist(); notify(p); return Promise.resolve(); },
    update: (p, o) => { Object.keys(o).forEach(k => setAt(p + '/' + k, o[k])); persist(); notify(p); return Promise.resolve(); },
    sub: (p, cb) => { const s = { path: p, cb }; subs.push(s); cb(getAt(p)); return () => { const i = subs.indexOf(s); if (i >= 0) subs.splice(i, 1); }; }
  };
}
function makeFirebaseStore() {
  W.firebase.initializeApp(W.FIREBASE_CONFIG);
  const db = W.firebase.database();
  const R = p => db.ref(CFG.ROOT_KEY + '/' + p);
  // every write reports failure on screen instead of failing silently
  const guard = (promise) => {
    let settled = false;
    const slow = setTimeout(() => { if (!settled) storeError({ code: 'timeout' }); }, 8000);
    return promise.then(v => { settled = true; clearTimeout(slow); storeOk(); return v; }, err => { settled = true; clearTimeout(slow); storeError(err); throw err; });
  };
  return {
    local: false,
    get: p => guard(R(p).once('value').then(s => s.val())),
    set: (p, v) => guard(R(p).set(v === undefined ? null : v)),
    update: (p, o) => guard(R(p).update(o)),
    sub: (p, cb) => { const ref = R(p); const h = ref.on('value', s => { storeOk(); cb(s.val()); }, err => { storeError(err); cb(null); }); return () => ref.off('value', h); }
  };
}
let storeProblem = '';
function storeError(err) {
  const code = String((err && (err.code || err.message)) || 'unknown error');
  storeProblem = /permission/i.test(code)
    ? `The database refused to save (permission denied). In the Firebase console, open Realtime Database → Rules and allow the branch "${CFG.ROOT_KEY}", as described in README.md.`
    : code === 'timeout' ? 'The database is not answering. Check the internet connection; your last action will be saved when the connection is back.'
    : `The database reported an error: ${code}.`;
  scheduleRender();
}
function storeOk() { if (storeProblem) { storeProblem = ''; scheduleRender(); } }
const STORE = IS_LOCAL ? makeLocalStore() : makeFirebaseStore();

/* ================= HELPERS ================= */
const $ = s => document.querySelector(s);
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const norm = s => String(s).toUpperCase().replace(/[\s,.'%]/g, '').replace(/^\+/, '').replace(/K$/, '000');
const slug = s => String(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/ß/g, 'ss').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 32) || 'team';
const toArr = v => (Array.isArray(v) ? v : v && typeof v === 'object' ? Object.keys(v).sort((a, b) => a - b).map(k => v[k]) : []);
const fmtTime = sec => { const neg = sec < 0; sec = Math.abs(Math.round(sec)); return (neg ? '+' : '') + String(Math.floor(sec / 60)).padStart(2, '0') + ':' + String(sec % 60).padStart(2, '0'); };
const fmtDate = t => (t ? new Date(t).toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '');
const isoDate = t => (t ? new Date(t).toISOString() : '');
const CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
function newCode(existing) { let c; do { c = Array.from({ length: 5 }, () => CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)]).join(''); } while (existing && existing[c]); return c; }

function blankRoom() { return { startedAt: Date.now(), finishedAt: null, current: 0, locks: [0, 0, 0, 0, 0].map(() => ({ done: false, hints: 0, wrong: 0, points: 0, at: null })) }; }
function roomState(team, rid) { const r = team && team.rooms && team.rooms[rid]; if (!r) return null; return Object.assign({}, r, { locks: toArr(r.locks).map(l => Object.assign({ done: false, hints: 0, wrong: 0, points: 0 }, l)) }); }
function lockPoints(l) { const cost = M.hintCost.slice(0, l.hints || 0).reduce((a, b) => a + b, 0); return Math.max(M.minPoints, M.lockPoints - (l.wrong || 0) * M.wrongCost - cost); }
function roomScore(rs) { return rs ? rs.locks.filter(l => l.done).reduce((a, l) => a + (l.points || 0), 0) : 0; }
function roomSolved(rs) { return rs ? rs.locks.filter(l => l.done).length : 0; }
function seriesScore(team) { return ROOMS.reduce((a, r) => a + roomScore(roomState(team, r.id)), 0); }
function roomElapsed(rs) { return rs ? ((rs.finishedAt || Date.now()) - rs.startedAt) / 1000 : 0; }
function testScore(room, answers) { const a = toArr(answers); return room.test.filter((q, k) => a[k] === q.a).length; }
function isOpen(cohort, rid) { return !!(cohort && cohort.rooms && cohort.rooms[rid] && cohort.rooms[rid].open); }

/* ================= SESSION ================= */
const SKEY = 'rr-session';
let S = { view: 'landing' };
try { S = Object.assign(S, JSON.parse(sessionStorage.getItem(SKEY)) || {}); } catch (e) {}
function saveSession() { try { sessionStorage.setItem(SKEY, JSON.stringify(S)); } catch (e) {} }
function go(view, extra) { S = Object.assign(S, extra || {}, { view }); saveSession(); flash = ''; render(); W.scrollTo(0, 0); }
let flash = '';

/* ================= SUBSCRIPTIONS ================= */
const data = {};
let active = {};
function wantPaths() {
  const p = [];
  if (['team', 'room', 'projector'].includes(S.view) && S.code) p.push('cohorts/' + S.code, 'teams/' + S.code);
  if (S.view === 'test' && S.testCode) p.push('cohorts/' + S.testCode);
  if (S.view === 'console' && S.consoleOpen) { p.push('cohorts'); if (S.cCode) p.push('teams/' + S.cCode, 'tests/' + S.cCode); }
  return p;
}
function syncSubs() {
  const want = wantPaths(), next = {};
  want.forEach(p => { if (active[p]) { next[p] = active[p]; delete active[p]; } else { next[p] = STORE.sub(p, v => { data[p] = v; scheduleRender(); }); } });
  Object.keys(active).forEach(p => { active[p](); delete data[p]; });
  active = next;
}
let pending = false;
function scheduleRender() { if (pending) return; pending = true; Promise.resolve().then(() => { pending = false; render(true); }); }

/* ================= CHARTS ================= */
function rng(seed) { let s = seed >>> 0; return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; }
function gamma(r, k, theta) { let sum = 0; for (let i = 0; i < k; i++) sum += -Math.log(1 - r()); return sum * theta; }
const BIN = 5000, NBINS = 15;
function histCounts(kind) {
  const c = new Array(NBINS).fill(0);
  if (kind === 'fake') { const r = rng(98); for (let i = 0; i < 13488; i++) c[Math.floor(r() * 50000 / BIN)]++; }
  else { const r = rng(7); for (let i = 0; i < 13488; i++) c[Math.min(NBINS - 1, Math.floor(gamma(r, 3, 7600) / BIN))]++; }
  return c;
}
function histogram(counts, color, label) {
  const Wd = 340, H = 210, L = 44, R = 10, T = 12, B = 40, max = Math.max(...counts), top = Math.ceil(max / 500) * 500, bw = (Wd - L - R) / counts.length;
  const y = v => T + (H - T - B) * (1 - v / top);
  let g = '';
  for (let t = 0; t <= top; t += top / 4) g += `<line x1="${L}" x2="${Wd - R}" y1="${y(t)}" y2="${y(t)}" stroke="var(--grid)"/><text x="${L - 6}" y="${y(t) + 4}" text-anchor="end" font-size="10" fill="var(--muted)">${Math.round(t).toLocaleString('en')}</text>`;
  counts.forEach((v, i) => { g += `<rect x="${L + i * bw + 1}" y="${y(v)}" width="${bw - 2}" height="${y(0) - y(v)}" fill="${color}" rx="1.5"/>`; });
  [0, 25000, 50000, 75000].forEach(m => { const x = L + (m / BIN) * bw; g += `<line x1="${x}" x2="${x}" y1="${y(0)}" y2="${y(0) + 4}" stroke="var(--muted)"/><text x="${x}" y="${y(0) + 16}" text-anchor="middle" font-size="10" fill="var(--muted)">${m / 1000}k</text>`; });
  g += `<text x="${(L + Wd - R) / 2}" y="${H - 4}" text-anchor="middle" font-size="10.5" fill="var(--muted)">miles driven between the two readings</text>`;
  return `<svg viewBox="0 0 ${Wd} ${H}" role="img" aria-label="${label}">${g}</svg>`;
}
function roundingChart() {
  const Wd = 340, H = 200, L = 120, R = 46, T = 10, rows = [
    ['Time 1, ends in 000', 18, 'var(--bar-b)'], ['Time 2, ends in 000', 0.1, 'var(--bar-a)'],
    ['Time 1, ends in 00*', 27, 'var(--bar-b)'], ['Time 2, ends in 00*', 1.0, 'var(--bar-a)'],
    ['Chance level, 000', 0.1, 'var(--muted)'], ['Chance level, 00*', 1.0, 'var(--muted)']];
  const rh = (H - T * 2) / rows.length, x = v => L + (Wd - L - R) * v / 30;
  let g = '';
  rows.forEach(([k, v, c], i) => {
    const yy = T + i * rh;
    g += `<text x="${L - 8}" y="${yy + rh / 2 + 4}" text-anchor="end" font-size="10.5" fill="var(--text)">${k}</text><rect x="${L}" y="${yy + 5}" width="${Math.max(2, x(v) - L)}" height="${rh - 10}" fill="${c}" rx="2"/><text x="${Math.max(L + 2, x(v)) + 6}" y="${yy + rh / 2 + 4}" font-size="10.5" fill="var(--muted)">${v}%</text>`;
  });
  return `<svg viewBox="0 0 ${Wd} ${H}" role="img" aria-label="Share of rounded odometer readings">${g}</svg>`;
}
function meansChart() {
  const groups = [['High-power pose', 4.9, 'var(--bar-a)'], ['No pose (control)', 4.5, 'var(--muted)'], ['Low-power pose', 4.1, 'var(--bar-b)']];
  const Wd = 340, H = 190, L = 34, R = 10, T = 14, B = 34, x0 = v => T + (H - T - B) * (1 - (v - 1) / 6), bw = (Wd - L - R) / 3;
  let g = '';
  for (let t = 1; t <= 7; t++) g += `<line x1="${L}" x2="${Wd - R}" y1="${x0(t)}" y2="${x0(t)}" stroke="var(--grid)"/><text x="${L - 6}" y="${x0(t) + 4}" text-anchor="end" font-size="10" fill="var(--muted)">${t}</text>`;
  groups.forEach(([k, v, c], i) => {
    const x = L + i * bw + bw * 0.2, w = bw * 0.6;
    g += `<rect x="${x}" y="${x0(v)}" width="${w}" height="${x0(1) - x0(v)}" fill="${c}" rx="2"/><text x="${x + w / 2}" y="${x0(v) - 5}" text-anchor="middle" font-size="11" font-weight="700" fill="var(--text)">${v.toFixed(1)}</text><text x="${x + w / 2}" y="${H - 12}" text-anchor="middle" font-size="10" fill="var(--muted)">${k}</text>`;
  });
  return `<figure><svg viewBox="0 0 ${Wd} ${H}" role="img" aria-label="Mean confidence by group">${g}</svg><figcaption>Mean self-rated confidence (1–7), 30 people per group (illustrative)</figcaption></figure>`;
}
function legendChart() {
  const test = [100, 106, 112, 117, 121, 125, 129, 133], ctrl = [100, 103, 106, 109, 112, 114, 117, 120], light = ['normal', 'brighter', 'brighter', 'brightest', 'dimmer', 'dimmer', 'dim', 'very dim'];
  const Wd = 360, H = 236, L = 38, R = 26, T = 34, B = 48, lo = 95, hi = 135;
  const x = i => L + i * (Wd - L - R) / 7, y = v => T + (H - T - B) * (1 - (v - lo) / (hi - lo));
  let g = '';
  [100, 110, 120, 130].forEach(t => { g += `<line x1="${L}" x2="${Wd - R}" y1="${y(t)}" y2="${y(t)}" stroke="var(--grid)"/><text x="${L - 6}" y="${y(t) + 4}" text-anchor="end" font-size="10" fill="var(--muted)">${t}</text>`; });
  const line = (arr, c) => `<polyline fill="none" stroke="${c}" stroke-width="2.5" points="${arr.map((v, i) => x(i) + ',' + y(v)).join(' ')}"/>` + arr.map((v, i) => `<circle cx="${x(i)}" cy="${y(v)}" r="3" fill="${c}"/>`).join('');
  g += line(ctrl, 'var(--bar-b)') + line(test, 'var(--bar-a)');
  light.forEach((l, i) => { g += `<text x="${x(i)}" y="${H - 30}" text-anchor="middle" font-size="9" fill="var(--muted)">${l}</text>`; });
  g += `<text x="${(L + Wd - R) / 2}" y="${H - 12}" text-anchor="middle" font-size="10" fill="var(--muted)">light level in the test room, period by period</text>`;
  g += `<rect x="${L}" y="6" width="12" height="4" fill="var(--bar-a)"/><text x="${L + 16}" y="12" font-size="10.5" fill="var(--text)">test group</text><rect x="${L + 90}" y="6" width="12" height="4" fill="var(--bar-b)"/><text x="${L + 106}" y="12" font-size="10.5" fill="var(--text)">control group (constant light)</text>`;
  g += `<text x="${L}" y="${T - 8}" font-size="10" fill="var(--muted)">output index (start = 100)</text>`;
  return `<svg viewBox="0 0 ${Wd} ${H}" role="img" aria-label="Legend version: output rises in both groups">${g}</svg>`;
}
const CHARTS = {
  'r1-real': () => histogram(histCounts('real'), 'var(--bar-b)', 'Right-skewed histogram of real mileage'),
  'r1-fake': () => histogram(histCounts('fake'), 'var(--bar-a)', 'Flat histogram that stops at 50,000 miles'),
  'r1-rounding': roundingChart,
  'r2-means': meansChart,
  'r3-legend': legendChart
};
const fillCharts = html => html.replace(/\{\{chart:([\w-]+)\}\}/g, (m, id) => (CHARTS[id] ? CHARTS[id]() : ''));

/* ================= VIEWS ================= */
function modeNote() {
  return IS_LOCAL ? `<p class="proto">${PREVIEW ? 'Preview' : 'Test mode'}: everything is saved in this browser only. ${PREVIEW ? 'The classroom version on GitHub Pages syncs all teams and cohorts through Firebase.' : 'Remove ?local=1 from the address to use the shared classroom database.'}</p>` : '';
}

function vLanding() {
  return `<section class="hero">
    <span class="stamp">RETRACTED</span>
    <p class="eyebrow">${esc(M.course)} · ${esc(M.institution)}</p>
    <h1>The Retraction <span>Room</span></h1>
    <p class="lede">A data scandal has hit the <i>${esc(M.journal)}</i>. You are its emergency review board. Over four sessions you will decide which famous studies to keep, correct or retract, and the only way out of each room is to understand the evidence.</p>
  </section>
  ${flash ? `<p class="feedback bad">${flash}</p>` : ''}
  <section class="modes">
    <form class="card stack" id="joinForm">
      <span class="eyebrow">Teams</span><h3>Join your team</h3>
      <label class="field" for="joinCode">Cohort code<input type="text" id="joinCode" class="code-input" maxlength="12" autocomplete="off" required value="${esc(S.code || '')}"></label>
      <label class="field" for="joinTeam">Team name<input type="text" id="joinTeam" maxlength="30" required placeholder="e.g. Team Gallup" value="${esc(S.teamName || '')}"></label>
      <button class="btn">Enter the archive</button>
      <p class="muted small">Use the same team name every session. Your progress and score carry over.</p>
    </form>
    <div class="card stack">
      <span class="eyebrow">Before each session</span><h3>Study guides</h3>
      <p class="muted small">About 25 minutes of reading per room, with worked examples and a short self-check.</p>
      <div class="stack tight">${ROOMS.map(r => `<button class="btn ghost left" data-go="guide" data-room="${r.id}">Room ${r.number}: ${esc(r.title)}<span class="muted small"> · ${esc(r.methods)}</span></button>`).join('')}</div>
    </div>
    <div class="card stack">
      <span class="eyebrow">Individual</span><h3>Exit test</h3>
      <p class="muted small">At the end of each session, 8 questions under your own name. It is not graded.</p>
      <button class="btn ghost" data-go="test" data-reset-test="1">Take the exit test</button>
      <span class="eyebrow">Instructor</span>
      <button class="btn ghost" data-go="console">Open the console</button>
    </div>
  </section>
  ${modeNote()}`;
}

function vTeam() {
  const cohort = data['cohorts/' + S.code], teams = data['teams/' + S.code] || {}, team = teams[S.tid];
  if (cohort === undefined) return `<p class="muted">Loading…</p>`;
  if (!cohort || !team) return `<section class="card stack"><h2>Team not found</h2><p>Check the cohort code with your instructor.</p><button class="btn" data-go="landing">Back</button></section>`;
  const board = Object.keys(teams).map(k => ({ name: teams[k].name, score: seriesScore(teams[k]), me: k === S.tid })).sort((a, b) => b.score - a.score);
  return `<section class="stack">
    <p class="eyebrow">${esc(cohort.name)} · cohort ${esc(S.code)}</p>
    <h1 class="h1-sm">${esc(team.name)}</h1>
    <p class="lede">Series score: <b class="accent">${seriesScore(team)}</b> of ${ROOMS.length * 5 * M.lockPoints}</p>
  </section>
  ${flash ? `<p class="feedback bad">${flash}</p>` : ''}
  <section class="rooms">${ROOMS.map(r => {
    const rs = roomState(team, r.id), open = isOpen(cohort, r.id), solved = roomSolved(rs), done = rs && rs.finishedAt;
    const status = done ? `<span class="chip good">Cleared · ${roomScore(rs)} pts</span>` : rs ? `<span class="chip warn">In progress · ${solved}/5</span>` : open ? `<span class="chip">Open</span>` : `<span class="chip off">Locked by instructor</span>`;
    return `<article class="card stack room-card${open ? '' : ' dim'}">
      <div class="file-head"><span class="eyebrow">Room ${r.number}</span>${status}</div>
      <h3>${esc(r.title)}</h3><p class="muted small">${esc(r.methods)}</p>
      <div class="row">${open && !done ? `<button class="btn" data-enter="${r.id}">${rs ? 'Continue' : 'Enter room'}</button>` : ''}<button class="btn ghost" data-go="guide" data-room="${r.id}">Study guide</button></div>
    </article>`;
  }).join('')}</section>
  <section class="card stack">
    <h2>Cohort leaderboard</h2>
    <div class="tbl-wrap"><table><thead><tr><th>#</th><th>Team</th><th>Series score</th></tr></thead><tbody>
    ${board.map((b, i) => `<tr class="${b.me ? 'me' : ''}"><td>${i + 1}</td><td>${esc(b.name)}</td><td>${b.score}</td></tr>`).join('')}
    </tbody></table></div>
  </section>
  <div class="row"><button class="btn ghost" data-go="landing">Leave</button></div>`;
}

function vRoom() {
  const cohort = data['cohorts/' + S.code], teams = data['teams/' + S.code] || {}, team = teams[S.tid];
  if (cohort === undefined) return `<p class="muted">Loading…</p>`;
  const room = roomById(S.rid), rs = roomState(team, S.rid);
  if (!room || !rs) return `<p class="muted">Loading…</p>`;
  if (S.reveal != null && S.reveal < room.locks.length) {
    const L = room.locks[S.reveal], st = rs.locks[S.reveal];
    return `<article class="card reveal pop stack">
      <p class="eyebrow">Lock ${S.reveal + 1} opened · +${st.points || 0} points</p>
      <h2>${esc(L.title)}</h2>${L.reveal}
      <div class="row"><button class="btn" id="nextBtn">${S.reveal + 1 < room.locks.length ? 'On to lock ' + (S.reveal + 2) : 'Leave the room'}</button></div>
    </article>`;
  }
  if (rs.current >= room.locks.length) {
    return `<section class="card stack reveal">
      <p class="eyebrow">Room ${room.number} cleared</p>
      <h2>${esc(team.name)} escaped ${esc(room.title)}</h2>
      <div class="score-big">${roomScore(rs)} <span class="small muted">/ ${room.locks.length * M.lockPoints}</span></div>
      <p>Time: ${fmtTime(roomElapsed(rs))}. Wait for your instructor's debrief, then everyone takes the exit test on their own.</p>
      <div class="row"><button class="btn" data-go="test" data-test-room="${room.id}">Start the exit test</button><button class="btn ghost" data-go="team">Back to your rooms</button></div>
    </section>`;
  }
  if (!isOpen(cohort, room.id)) return `<section class="card stack"><h2>Paused</h2><p>Your instructor has closed this room for now. Your progress is saved.</p><button class="btn" data-go="team">Back to your rooms</button></section>`;
  const i = rs.current, L = room.locks[i], st = rs.locks[i];
  const hints = L.hints.slice(0, st.hints).map((h, k) => `<div class="hint"><b>Hint ${k + 1}:</b> ${h}</div>`).join('');
  return `${i === 0 && !st.wrong && !st.hints ? `<section class="card stack story"><p class="eyebrow">Room ${room.number} · ${esc(room.methods)}</p><p>${room.story}</p></section>` : ''}
  <article class="card pop">
    <div class="file-head"><div><p class="eyebrow">Lock ${i + 1} of ${room.locks.length} · ${esc(L.tag)}</p><h2>${esc(L.title)}</h2></div><button class="btn ghost small-btn" data-go="guide" data-room="${room.id}" data-from-room="1">Study guide: ${esc(L.guide)}</button></div>
    ${fillCharts(L.intro)}
    <div class="task"><span class="eyebrow">To open the lock</span>${L.task}
      <form id="codeForm" class="row"><input type="text" id="code" class="code-input" autocomplete="off" placeholder="····" aria-label="Code"><button class="btn">Try code</button><span class="muted small">${esc(L.format)}</span></form>
      <div id="fb" class="feedback" aria-live="polite"></div>
    </div>
    <div class="hints">${hints}${st.hints < L.hints.length ? `<div class="row"><button class="btn ghost" id="hintBtn">Take hint ${st.hints + 1} (−${M.hintCost[st.hints]} points)</button><span class="muted small">Wrong codes cost ${M.wrongCost} points each.</span></div>` : ''}</div>
  </article>`;
}

function renderBar() {
  const bar = $('#bar');
  const team = (data['teams/' + S.code] || {})[S.tid], room = roomById(S.rid), rs = roomState(team, S.rid);
  if (S.view !== 'room' || !team || !room || !rs) { bar.hidden = true; return; }
  bar.hidden = false;
  const left = M.roomMinutes * 60 - roomElapsed(rs);
  bar.innerHTML = `<div class="inner"><span class="stat">${esc(team.name)} · Room ${room.number}</span>
    <span class="locks">${rs.locks.map((l, i) => `<span class="pip ${l.done ? 'done' : (i === rs.current ? 'now' : '')}">${l.done ? '✓' : i + 1}</span>`).join('')}</span>
    <span class="stat">${left >= 0 ? 'Time left' : 'Overtime'} <b>${fmtTime(left)}</b></span><span class="stat">Score <b>${roomScore(rs)}</b></span></div>`;
}

function vGuide() {
  const room = roomById(S.gRoom) || ROOMS[0], g = room.guide, sc = S.selfCheck && S.selfCheck[room.id] || {};
  return `<nav class="tabs" aria-label="Rooms">${ROOMS.map(r => `<button class="tab${r.id === room.id ? ' on' : ''}" data-go="guide" data-room="${r.id}">Room ${r.number}</button>`).join('')}</nav>
  <article class="guide stack">
    <header class="stack">
      <p class="eyebrow">Study guide · Room ${room.number} · about ${g.minutes} minutes</p>
      <h1 class="h1-sm">${esc(room.title)}: ${esc(room.methods)}</h1>
      <div class="card stack goals"><b>After this guide you can:</b><ul>${g.goals.map(x => `<li>${esc(x)}</li>`).join('')}</ul></div>
      <nav class="toc">${g.sections.map((s, i) => `<a href="#g-${i}">${esc(s.h)}</a>`).join('')}<a href="#g-check">Self-check</a></nav>
    </header>
    ${g.sections.map((s, i) => `<section class="gsec" id="g-${i}"><h2>${esc(s.h)}</h2>${s.html}</section>`).join('')}
    <section class="gsec" id="g-check"><h2>Self-check</h2><p class="muted small">Not saved and not graded. Click an answer to see if it is right.</p>
    ${g.selfCheck.map((q, k) => { const pick = sc[k]; return `<div class="q"><b>${k + 1}. ${esc(q.q)}</b>${q.o.map((o, j) => `<button class="qopt${pick != null ? (j === q.a ? ' right' : j === pick ? ' wrong' : '') : ''}" data-check="${room.id}:${k}:${j}" ${pick != null ? 'disabled' : ''}>${esc(o)}</button>`).join('')}${pick != null ? `<p class="small ${pick === q.a ? 'good-t' : 'bad-t'}">${pick === q.a ? 'Correct. ' : 'Not quite. '}${esc(q.why)}</p>` : ''}</div>`; }).join('')}
    </section>
    <section class="gsec"><h2>Sources and further reading</h2><ul>${g.sources.map(s => `<li><a href="${esc(s.url)}" target="_blank" rel="noopener">${esc(s.label)}</a></li>`).join('')}</ul></section>
    <div class="row">${S.fromRoom ? `<button class="btn" data-back-room="1">Back to the lock</button>` : ''}${!PREVIEW ? `<button class="btn ghost" id="printBtn">Print this guide</button>` : ''}<button class="btn ghost" data-go="${S.tid && S.code ? 'team' : 'landing'}">${S.tid && S.code ? 'Back to your rooms' : 'Home'}</button></div>
  </article>`;
}

function vTest() {
  const t = S.testState || {};
  if (t.done) {
    const room = roomById(t.rid), score = testScore(room, t.answers);
    return `<section class="card stack">
      <p class="eyebrow">Exit test · Room ${room.number}</p><h2>Thanks, ${esc(t.name)}</h2>
      <div class="score-big">${score} <span class="small muted">/ ${room.test.length}</span></div>
      ${room.test.map((q, k) => `<div class="q"><b>${k + 1}. ${esc(q.q)}</b>${q.o.map((o, j) => `<div class="qopt static${j === q.a ? ' right' : (j === t.answers[k] ? ' wrong' : '')}">${j === q.a ? '✓ ' : (j === t.answers[k] ? '✗ ' : '')}${esc(o)}</div>`).join('')}</div>`).join('')}
      <div class="row"><button class="btn" data-go="test" data-reset-test="1" data-keep-code="1">Next student on this laptop</button><button class="btn ghost" data-go="landing">Home</button></div>
    </section>`;
  }
  if (!S.testCode) {
    return `<section class="card stack">
      <p class="eyebrow">Exit test · individual · not graded</p><h2>Which cohort are you in?</h2>
      ${flash ? `<p class="feedback bad">${flash}</p>` : ''}
      <form id="testCodeForm" class="row"><input type="text" id="testCode" class="code-input" maxlength="12" required aria-label="Cohort code" value="${esc(S.code || '')}"><button class="btn">Continue</button></form>
      <button class="btn ghost" data-go="landing">Back</button></section>`;
  }
  const cohort = data['cohorts/' + S.testCode];
  if (cohort === undefined) return `<p class="muted">Loading…</p>`;
  if (!cohort) return `<section class="card stack"><h2>Unknown cohort code</h2><p>Check the code with your instructor.</p><button class="btn" data-go="test" data-reset-test="1">Try again</button></section>`;
  const openRooms = ROOMS.filter(r => isOpen(cohort, r.id));
  const rid = t.rid && openRooms.find(r => r.id === t.rid) ? t.rid : (S.testRoom && openRooms.find(r => r.id === S.testRoom) ? S.testRoom : (openRooms[openRooms.length - 1] || {}).id);
  if (!rid) return `<section class="card stack"><h2>No test open yet</h2><p>Your instructor has not opened a room for ${esc(cohort.name)} yet.</p><button class="btn" data-go="landing">Home</button></section>`;
  const room = roomById(rid);
  return `<section class="card stack">
    <p class="eyebrow">Exit test · ${esc(cohort.name)} · not graded</p>
    <h2>What did you take away?</h2>
    <form id="testForm" class="stack">
      <label class="field" for="testRoom">Room<select id="testRoom">${openRooms.map(r => `<option value="${r.id}"${r.id === rid ? ' selected' : ''}>Room ${r.number}: ${esc(r.title)}</option>`).join('')}</select></label>
      <label class="field" for="studentName">Your full name<input type="text" id="studentName" maxlength="60" required autocomplete="name"></label>
      ${room.test.map((q, k) => `<fieldset class="q"><legend><b>${k + 1}. ${esc(q.q)}</b></legend>${q.o.map((o, j) => `<label class="qopt"><input type="radio" name="q${k}" value="${j}" required><span>${esc(o)}</span></label>`).join('')}</fieldset>`).join('')}
      <div class="row"><button class="btn" type="submit">Submit answers</button><button type="button" class="btn ghost" data-go="landing">Cancel</button></div>
    </form>
  </section>`;
}

function vConsole() {
  if (!S.consoleOpen) return `<section class="card stack narrow">
    <p class="eyebrow">Instructor</p><h2>Console</h2>
    <form id="pinForm" class="row"><input type="password" id="pin" inputmode="numeric" placeholder="PIN" aria-label="PIN" class="pin"><button class="btn">Open</button></form>
    ${flash ? `<p class="feedback bad">${flash}</p>` : ''}
    ${IS_LOCAL ? `<p class="muted small">The PIN is set in config.js${CFG.INSTRUCTOR_PIN === '0000' ? ' (currently 0000)' : ''}.</p>` : ''}
    <button class="btn ghost" data-go="landing">Back</button></section>`;
  const cohorts = data['cohorts'];
  if (cohorts === undefined) return `<p class="muted">Loading…</p>`;
  const list = Object.keys(cohorts || {}).map(k => Object.assign({ code: k }, cohorts[k])).sort((a, b) => (a.archived - b.archived) || (b.createdAt - a.createdAt));
  const sel = S.cCode && cohorts && cohorts[S.cCode] ? Object.assign({ code: S.cCode }, cohorts[S.cCode]) : null;
  return `<section class="stack">
    <div class="file-head"><div><p class="eyebrow">Instructor console</p><h1 class="h1-sm">Cohorts</h1></div><div class="row"><button class="btn ghost" id="exportAll">Download all results (Excel)</button><button class="btn ghost" id="lockConsole">Close console</button></div></div>
    ${flash ? `<p class="feedback ${/^✓/.test(flash) ? 'good' : /…$/.test(flash) ? '' : 'bad'}">${flash}</p>` : ''}
    <div class="cohort-list">${list.map(c => `<button class="card cohort${c.code === S.cCode ? ' on' : ''}" data-cohort="${c.code}"><span class="eyebrow">${c.archived ? 'Archived' : 'Active'} · ${c.code}</span><b>${esc(c.name)}</b><span class="muted small">Rooms open: ${ROOMS.filter(r => isOpen(c, r.id)).map(r => r.number).join(', ') || 'none'}</span></button>`).join('')}
      <form id="newCohort" class="card stack"><span class="eyebrow">New cohort</span><label class="field" for="cohortName">Name<input type="text" id="cohortName" maxlength="40" placeholder="e.g. BA Business 2026, Group A" required></label><label class="field" for="cohortCode">Join code (optional)<input type="text" id="cohortCode" class="code-input" maxlength="12" placeholder="e.g. GROUP-A"></label><span class="muted small">3 to 12 letters, digits or hyphens. Leave empty for a random 5-letter code.</span><button class="btn">Create cohort</button></form>
    </div>
  </section>
  ${sel ? vCohort(sel) : `<p class="muted">Choose a cohort, or create one. Each cohort gets its own code, which students type when they join.</p>`}
  ${modeNote()}`;
}

function vCohort(c) {
  const teams = data['teams/' + c.code] || {}, tests = data['tests/' + c.code] || {};
  const rid = S.cRoom || 'r1', room = roomById(rid);
  const tlist = Object.keys(teams).map(k => Object.assign({ id: k }, teams[k]));
  const rows = tlist.map(t => ({ t, rs: roomState(t, rid) })).sort((a, b) => roomScore(b.rs) - roomScore(a.rs));
  const trs = tests[rid] || {}, tl = Object.keys(trs).map(k => Object.assign({ id: k }, trs[k])).sort((a, b) => a.at - b.at);
  const per = room.test.map((q, k) => tl.length ? Math.round(100 * tl.filter(r => toArr(r.answers)[k] === q.a).length / tl.length) : null);
  const avg = tl.length ? (tl.reduce((a, r) => a + testScore(room, r.answers), 0) / tl.length).toFixed(1) : '–';
  return `<section class="card stack">
    <div class="file-head"><div><p class="eyebrow">Cohort ${c.code}${c.archived ? ' · archived' : ''}</p><h2>${esc(c.name)}</h2><p class="muted small">Students join with the code <b class="mono">${c.code}</b>. Created ${fmtDate(c.createdAt)}.</p></div>
      <div class="row"><button class="btn ghost" data-go="projector" data-proj="${c.code}">Projector leaderboard</button></div></div>
    <h3>Rooms</h3>
    <div class="room-switch">${ROOMS.map(r => { const open = isOpen(c, r.id); return `<div class="rs${r.id === rid ? ' on' : ''}"><button class="tab${r.id === rid ? ' on' : ''}" data-croom="${r.id}">Room ${r.number}: ${esc(r.title)}</button><button class="chip-btn ${open ? 'good' : 'off'}" data-toggle-room="${r.id}" ${c.archived ? 'disabled' : ''}>${open ? 'Open · click to close' : 'Closed · click to open'}</button></div>`; }).join('')}</div>
  </section>
  <section class="card stack">
    <h2>Room ${room.number}: teams</h2>
    <div class="tbl-wrap"><table><thead><tr><th>Team</th><th>Locks</th><th>Score</th><th>Hints</th><th>Wrong</th><th>Time</th><th>Series</th><th></th></tr></thead><tbody>
    ${rows.length ? rows.map(({ t, rs }) => `<tr><td>${esc(t.name)}</td><td>${rs ? roomSolved(rs) + ' / 5' : '–'}</td><td>${rs ? roomScore(rs) : '–'}</td><td>${rs ? rs.locks.reduce((a, l) => a + (l.hints || 0), 0) : '–'}</td><td>${rs ? rs.locks.reduce((a, l) => a + (l.wrong || 0), 0) : '–'}</td><td>${rs ? (rs.finishedAt ? fmtTime(roomElapsed(rs)) : `<span class="live">${fmtTime(roomElapsed(rs))}</span>`) : '–'}</td><td>${seriesScore(t)}</td>
      <td class="actions">${rs && rs.current < 5 ? `<button class="btn ghost tiny" data-skip="${t.id}">Open lock ${rs.current + 1}</button>` : ''}${rs ? `<button class="btn ghost tiny" data-reset="${t.id}">Reset room</button>` : ''}</td></tr>`).join('') : `<tr><td colspan="8" class="muted">No teams have joined this cohort yet.</td></tr>`}
    </tbody></table></div>
    <div id="confirmBox"></div>
  </section>
  <section class="card stack">
    <h2>Debrief notes, Room ${room.number}</h2><p class="muted small">About 15 minutes after the room. A good opening question per lock: "What did you almost get wrong?"</p>
    ${room.locks.map((L, i) => `<div><b>${i + 1}. ${esc(L.title)}</b><ul class="small">${L.debrief.map(d => `<li>${d}</li>`).join('')}</ul></div>`).join('')}
  </section>
  <section class="card stack">
    <h2>Exit test, Room ${room.number}</h2>
    <p class="muted small">${tl.length} submissions · average ${avg} / ${room.test.length}</p>
    ${tl.length ? `<div class="tbl-wrap"><table><thead><tr><th>Question</th><th>Correct</th></tr></thead><tbody>${room.test.map((q, k) => `<tr><td class="wrap">${k + 1}. ${esc(q.q)}</td><td>${per[k]}%</td></tr>`).join('')}</tbody></table></div>
    <div class="tbl-wrap"><table><thead><tr><th>Student</th><th>Submitted</th><th>Score</th></tr></thead><tbody>${tl.map(r => `<tr><td>${esc(r.name)}</td><td>${fmtDate(r.at)}</td><td>${testScore(room, r.answers)} / ${room.test.length}</td></tr>`).join('')}</tbody></table></div>` : ''}
  </section>
  <section class="card stack">
    <h2>Save, load and archive</h2>
    <p class="muted small">Progress saves automatically and separately for each cohort. Use these for records and backups.</p>
    <div class="row">
      <button class="btn" id="exportCohort">Download results (Excel)</button>
      <button class="btn ghost" id="backupCohort">Download backup (.json)</button>
      <label class="btn ghost file-btn" for="restoreFile">Load backup…<input type="file" id="restoreFile" accept=".json,application/json" hidden></label>
      <button class="btn ghost" id="archiveCohort">${c.archived ? 'Reactivate cohort' : 'Archive cohort'}</button>
    </div>
    <div id="restoreBox"></div>
    <p class="muted small">Archiving closes all rooms and stops new teams from joining. All data stays and can still be exported.</p>
  </section>`;
}

function vProjector() {
  const code = S.code, cohort = data['cohorts/' + code], teams = data['teams/' + code] || {};
  if (cohort === undefined) return `<p class="muted">Loading…</p>`;
  const list = Object.keys(teams).map(k => teams[k]).map(t => ({ name: t.name, rooms: ROOMS.map(r => roomState(t, r.id)), total: seriesScore(t) })).sort((a, b) => b.total - a.total);
  return `<section class="projector stack">
    <div class="file-head"><div><p class="eyebrow">${esc(cohort ? cohort.name : '')} · join with code <b class="mono">${esc(code)}</b></p><h1>Leaderboard</h1></div><button class="btn ghost" data-go="console">Back to console</button></div>
    <div class="tbl-wrap"><table class="big"><thead><tr><th>#</th><th>Team</th>${ROOMS.map(r => `<th>Room ${r.number}</th>`).join('')}<th>Total</th></tr></thead><tbody>
    ${list.map((t, i) => `<tr><td>${i + 1}</td><td>${esc(t.name)}</td>${t.rooms.map(rs => `<td>${rs ? (rs.finishedAt ? roomScore(rs) : roomSolved(rs) + '/5') : '–'}</td>`).join('')}<td><b>${t.total}</b></td></tr>`).join('')}
    </tbody></table></div></section>`;
}

/* ================= RENDER ================= */
let ticker = null;
function render(fromData) {
  syncSubs();
  const app = $('#app');
  // keep what people are typing when live data re-renders the page
  const keep = {}; let focusId = null;
  if (fromData) { app.querySelectorAll('input[id]:not([type=radio]):not([type=file]), select[id], textarea[id]').forEach(el => { keep[el.id] = el.value; }); app.querySelectorAll('input[type=radio]:checked').forEach(el => { keep['radio:' + el.name] = el.value; }); if (document.activeElement && document.activeElement.id) focusId = document.activeElement.id; }
  const views = { landing: vLanding, team: vTeam, room: vRoom, guide: vGuide, test: vTest, console: vConsole, projector: vProjector };
  app.innerHTML = (storeProblem ? `<p class="confirm" role="alert"><b>Not saved.</b> ${esc(storeProblem)}</p>` : '') + (views[S.view] || vLanding)();
  if (fromData) {
    Object.keys(keep).forEach(k => { if (k.indexOf('radio:') === 0) { const el = app.querySelector(`input[name="${k.slice(6)}"][value="${keep[k]}"]`); if (el) el.checked = true; } else { const el = document.getElementById(k); if (el) el.value = keep[k]; } });
    if (focusId) { const el = document.getElementById(focusId); if (el) el.focus(); }
  }
  renderBar();
  clearInterval(ticker);
  if (S.view === 'room' || (S.view === 'console' && S.cCode)) ticker = setInterval(() => { if (S.view === 'room') renderBar(); else document.querySelectorAll('.live').length && scheduleRender(); }, 1000);
  document.title = M.title;
}

/* ================= ACTIONS ================= */
const teamPath = () => `teams/${S.code}/${S.tid}`;
function writeRoom(rs) { return STORE.set(`${teamPath()}/rooms/${S.rid}`, rs); }

async function joinTeam(code, name) {
  code = norm(code).slice(0, 12); name = name.trim();
  if (!code || !name) return;
  let cohort;
  try { cohort = await STORE.get('cohorts/' + code); } catch (e) { return; }
  if (!cohort) { flash = `No cohort has the code ${esc(code)}. Check it with your instructor.`; render(); return; }
  const tid = slug(name), existing = await STORE.get(`teams/${code}/${tid}`);
  if (!existing) {
    if (cohort.archived) { flash = 'This cohort has been archived and no longer accepts new teams.'; render(); return; }
    await STORE.set(`teams/${code}/${tid}`, { name, createdAt: Date.now() });
  }
  go('team', { code, tid, teamName: name });
}

async function enterRoom(rid) {
  const team = (data['teams/' + S.code] || {})[S.tid];
  if (!roomState(team, rid)) await STORE.set(`${teamPath()}/rooms/${rid}`, blankRoom());
  go('room', { rid, reveal: null });
}

function tryCode(value) {
  const team = (data['teams/' + S.code] || {})[S.tid], room = roomById(S.rid), rs = roomState(team, S.rid);
  if (!rs || rs.current >= room.locks.length) return;
  const L = room.locks[rs.current], st = rs.locks[rs.current], v = norm(value);
  if (!v) return;
  if (L.answer.map(norm).includes(v)) {
    st.done = true; st.points = lockPoints(st); st.at = Date.now();
    S.reveal = rs.current; rs.current++;
    if (rs.current >= room.locks.length) rs.finishedAt = Date.now();
    saveSession(); writeRoom(rs); W.scrollTo(0, 0);
  } else {
    st.wrong = (st.wrong || 0) + 1; writeRoom(rs);
    setTimeout(() => { const fb = $('#fb'); if (fb) { fb.className = 'feedback bad'; fb.textContent = `The lock does not move. (−${M.wrongCost} points)`; } const c = $('#code'); if (c) c.select(); }, 0);
  }
}

function rowsForExport(cohorts, teamsBy, testsBy) {
  const overview = [], teamRows = [], testRows = [], qRows = [];
  Object.keys(cohorts).sort().forEach(code => {
    const c = cohorts[code], teams = teamsBy[code] || {}, tests = testsBy[code] || {};
    let nTests = 0;
    Object.keys(teams).forEach(tid => { const t = teams[tid]; ROOMS.forEach(r => { const rs = roomState(t, r.id); if (!rs) return; teamRows.push({ Cohort: c.name, Code: code, Team: t.name, Room: r.number, 'Room title': r.title, Status: rs.finishedAt ? 'cleared' : 'in progress', 'Locks solved': roomSolved(rs), Score: roomScore(rs), 'Max score': r.locks.length * M.lockPoints, 'Hints used': rs.locks.reduce((a, l) => a + (l.hints || 0), 0), 'Wrong codes': rs.locks.reduce((a, l) => a + (l.wrong || 0), 0), Minutes: Math.round(roomElapsed(rs) / 60), Started: isoDate(rs.startedAt), Finished: isoDate(rs.finishedAt) }); }); });
    ROOMS.forEach(r => {
      const list = Object.keys(tests[r.id] || {}).map(k => tests[r.id][k]); nTests += list.length;
      list.sort((a, b) => a.at - b.at).forEach(t => { const a = toArr(t.answers), row = { Cohort: c.name, Code: code, Room: r.number, Student: t.name, Submitted: isoDate(t.at), Score: testScore(r, a), 'Max score': r.test.length }; r.test.forEach((q, k) => { row['Q' + (k + 1)] = a[k] === q.a ? 1 : 0; }); testRows.push(row); });
      if (list.length) r.test.forEach((q, k) => qRows.push({ Cohort: c.name, Code: code, Room: r.number, Question: k + 1, Text: q.q, 'Correct answer': q.o[q.a], 'Answered': list.length, '% correct': Math.round(100 * list.filter(t => toArr(t.answers)[k] === q.a).length / list.length) }));
    });
    overview.push({ Cohort: c.name, Code: code, Created: isoDate(c.createdAt), Archived: c.archived ? 'yes' : 'no', Teams: Object.keys(teams).length, 'Exit tests submitted': nTests });
  });
  const key = [];
  ROOMS.forEach(r => r.test.forEach((q, k) => key.push({ Room: r.number, Question: k + 1, Text: q.q, 'Correct answer': q.o[q.a] })));
  return { overview, teamRows, testRows, qRows, key };
}
function download(name, blob) {
  if (PREVIEW) { flash = 'Downloads are switched off in this preview. They work in the classroom version on GitHub Pages.'; render(); return; }
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name; document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
}
async function exportResults(codes) {
  const cohortsAll = (await STORE.get('cohorts')) || {}, cohorts = {}, teamsBy = {}, testsBy = {};
  for (const code of codes || Object.keys(cohortsAll)) { if (!cohortsAll[code]) continue; cohorts[code] = cohortsAll[code]; teamsBy[code] = (await STORE.get('teams/' + code)) || {}; testsBy[code] = (await STORE.get('tests/' + code)) || {}; }
  const R = rowsForExport(cohorts, teamsBy, testsBy), stamp = new Date().toISOString().slice(0, 10);
  const base = `retraction-room-results-${codes && codes.length === 1 ? codes[0] + '-' : ''}${stamp}`;
  const info = [{ Field: 'Game', Value: `${M.title} v${M.version}` }, { Field: 'Course', Value: `${M.course}, ${M.institution}` }, { Field: 'Exported', Value: new Date().toISOString() }, { Field: 'Scoring', Value: `${M.lockPoints} points per lock, minus ${M.wrongCost} per wrong code and ${M.hintCost.join('/')} for hints 1/2, minimum ${M.minPoints}` }];
  if (W.XLSX) {
    const wb = W.XLSX.utils.book_new(), add = (rows, name, empty) => W.XLSX.utils.book_append_sheet(wb, W.XLSX.utils.json_to_sheet(rows.length ? rows : [empty]), name);
    add(info, 'About', {}); add(R.overview, 'Cohorts', { Cohort: 'none' }); add(R.teamRows, 'Team results', { Team: 'none yet' }); add(R.testRows, 'Exit tests', { Student: 'none yet' }); add(R.qRows, 'Question analysis', { Question: 'none yet' }); add(R.key, 'Answer key', {});
    const out = W.XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    download(base + '.xlsx', new Blob([out], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }));
  } else {
    const csv = rows => { if (!rows.length) return ''; const cols = Object.keys(rows.reduce((a, r) => Object.assign(a, r), {})); return [cols.join(';')].concat(rows.map(r => cols.map(c => `"${String(r[c] == null ? '' : r[c]).replace(/"/g, '""')}"`).join(';'))).join('\r\n'); };
    download(base + '-tests.csv', new Blob(['﻿' + csv(R.testRows)], { type: 'text/csv' }));
    download(base + '-teams.csv', new Blob(['﻿' + csv(R.teamRows)], { type: 'text/csv' }));
  }
}
async function backupCohort(code) {
  const snap = { format: 'retraction-room-backup', version: 1, exportedAt: new Date().toISOString(), code, cohort: await STORE.get('cohorts/' + code), teams: (await STORE.get('teams/' + code)) || {}, tests: (await STORE.get('tests/' + code)) || {} };
  download(`retraction-room-backup-${code}-${snap.exportedAt.slice(0, 10)}.json`, new Blob([JSON.stringify(snap, null, 2)], { type: 'application/json' }));
}
let pendingRestore = null;
async function restoreCohort(snap, mode) {
  const code = mode === 'new' ? newCode(data['cohorts'] || {}) : snap.code;
  const cohort = Object.assign({}, snap.cohort, mode === 'new' ? { name: snap.cohort.name + ' (restored)', createdAt: Date.now() } : {});
  await STORE.set('cohorts/' + code, cohort); await STORE.set('teams/' + code, snap.teams || null); await STORE.set('tests/' + code, snap.tests || null);
  S.cCode = code; flash = `✓ Backup loaded into cohort ${code}.`; pendingRestore = null; saveSession(); render();
}

/* ================= EVENTS ================= */
document.addEventListener('click', e => {
  const el = e.target.closest('button, [data-go]');
  if (!el) return;
  const d = el.dataset;
  if (d.check) { const [rid, k, j] = d.check.split(':'); S.selfCheck = S.selfCheck || {}; S.selfCheck[rid] = S.selfCheck[rid] || {}; S.selfCheck[rid][k] = +j; saveSession(); const y = W.scrollY; render(); W.scrollTo(0, y); return; }
  if (d.backRoom) { go('room'); return; }
  if (d.go) {
    const extra = {};
    if (d.room) { extra.gRoom = d.room; extra.fromRoom = !!d.fromRoom; }
    if (d.resetTest) { extra.testState = null; extra.testRoom = null; if (!d.keepCode) extra.testCode = null; }
    if (d.testRoom) { extra.testState = null; extra.testRoom = d.testRoom; extra.testCode = S.code; }
    if (d.proj) extra.code = d.proj;
    if (d.go === 'room' && !S.rid) { go('team'); return; }
    go(d.go, extra); return;
  }
  if (d.enter) { enterRoom(d.enter); return; }
  if (d.cohort) { S.cCode = d.cohort; flash = ''; saveSession(); render(); return; }
  if (d.croom) { S.cRoom = d.croom; saveSession(); render(); return; }
  if (d.toggleRoom) { const c = data['cohorts'][S.cCode]; STORE.set(`cohorts/${S.cCode}/rooms/${d.toggleRoom}`, { open: !isOpen(c, d.toggleRoom), changedAt: Date.now() }); return; }
  if (d.skip) { const t = data['teams/' + S.cCode][d.skip], rs = roomState(t, S.cRoom || 'r1'); if (!rs) return; const st = rs.locks[rs.current]; st.done = true; st.points = M.minPoints; st.at = Date.now(); st.openedByInstructor = true; rs.current++; if (rs.current >= 5) rs.finishedAt = Date.now(); STORE.set(`teams/${S.cCode}/${d.skip}/rooms/${S.cRoom || 'r1'}`, rs); return; }
  if (d.reset) { const t = data['teams/' + S.cCode][d.reset]; $('#confirmBox').innerHTML = `<div class="confirm row"><span>Delete ${esc(t.name)}'s progress in this room? Their other rooms are kept.</span><button class="btn" data-reset-yes="${d.reset}">Yes, reset</button><button class="btn ghost" data-reset-no="1">Cancel</button></div>`; return; }
  if (d.resetYes) { STORE.set(`teams/${S.cCode}/${d.resetYes}/rooms/${S.cRoom || 'r1'}`, null); return; }
  if (d.resetNo) { $('#confirmBox').innerHTML = ''; return; }
  if (d.restore) { if (pendingRestore) restoreCohort(pendingRestore, d.restore); return; }
  const id = el.id;
  if (id === 'hintBtn') { const team = data['teams/' + S.code][S.tid], rs = roomState(team, S.rid); rs.locks[rs.current].hints = (rs.locks[rs.current].hints || 0) + 1; writeRoom(rs); }
  if (id === 'nextBtn') { S.reveal = null; saveSession(); render(); W.scrollTo(0, 0); }
  if (id === 'printBtn') W.print();
  if (id === 'lockConsole') { S.consoleOpen = false; go('landing'); }
  if (id === 'exportAll') exportResults(null);
  if (id === 'exportCohort') exportResults([S.cCode]);
  if (id === 'backupCohort') backupCohort(S.cCode);
  if (id === 'archiveCohort') { const c = data['cohorts'][S.cCode]; const upd = { archived: !c.archived }; if (!c.archived) ROOMS.forEach(r => { upd['rooms/' + r.id] = { open: false, changedAt: Date.now() }; }); STORE.update('cohorts/' + S.cCode, upd); }
});

document.addEventListener('change', e => {
  if (e.target.id === 'testRoom') { S.testState = Object.assign({}, S.testState, { rid: e.target.value }); saveSession(); render(true); }
  if (e.target.id === 'restoreFile') {
    const f = e.target.files[0]; if (!f) return;
    const rd = new FileReader();
    rd.onload = () => {
      let snap; try { snap = JSON.parse(rd.result); } catch (er) { snap = null; }
      const box = $('#restoreBox');
      if (!snap || snap.format !== 'retraction-room-backup' || !snap.cohort) { box.innerHTML = `<p class="feedback bad">That file is not a Retraction Room backup.</p>`; return; }
      pendingRestore = snap;
      const exists = data['cohorts'] && data['cohorts'][snap.code];
      box.innerHTML = `<div class="confirm stack"><span>Backup of <b>${esc(snap.cohort.name)}</b> (${esc(snap.code)}) from ${fmtDate(snap.exportedAt)}: ${Object.keys(snap.teams || {}).length} teams.</span>
        <div class="row">${exists ? `<button class="btn" data-restore="replace">Replace current ${esc(snap.code)} with this backup</button>` : `<button class="btn" data-restore="replace">Restore as ${esc(snap.code)}</button>`}<button class="btn ghost" data-restore="new">Load as a new cohort</button></div></div>`;
    };
    rd.readAsText(f);
  }
});

document.addEventListener('submit', e => {
  e.preventDefault();
  const f = e.target.id;
  if (f === 'joinForm') joinTeam($('#joinCode').value, $('#joinTeam').value);
  if (f === 'codeForm') tryCode($('#code').value);
  if (f === 'testCodeForm') { const code = norm($('#testCode').value).slice(0, 12); if (code) go('test', { testCode: code }); }
  if (f === 'testForm') {
    const rid = $('#testRoom').value, room = roomById(rid), name = $('#studentName').value.trim();
    if (!name) return;
    const answers = room.test.map((_, k) => { const c = document.querySelector(`input[name=q${k}]:checked`); return c ? +c.value : -1; });
    const rec = { name, answers, score: testScore(room, answers), at: Date.now() };
    STORE.set(`tests/${S.testCode}/${rid}/${slug(name)}-${rec.at}`, rec).then(() => go('test', { testState: { done: true, rid, name, answers } }));
  }
  if (f === 'pinForm') { if ($('#pin').value === String(CFG.INSTRUCTOR_PIN)) { flash = ''; go('console', { consoleOpen: true }); } else { flash = 'Wrong PIN.'; render(); } }
  if (f === 'newCohort') {
    const name = $('#cohortName').value.trim(); if (!name) return;
    const wanted = norm($('#cohortCode').value), existing = data['cohorts'] || {};
    if (wanted && !/^[A-Z0-9-]{3,12}$/.test(wanted)) { flash = 'The join code can only use letters, digits and hyphens, 3 to 12 characters.'; render(true); return; }
    if (wanted && existing[wanted]) { flash = `The code ${wanted} is already used by another cohort.`; render(true); return; }
    const code = wanted || newCode(existing);
    flash = 'Creating…'; render(true);
    STORE.set('cohorts/' + code, { name, createdAt: Date.now(), archived: false, rooms: { r1: { open: false } } })
      .then(() => { S.cCode = code; S.cRoom = 'r1'; flash = `✓ Created ${esc(name)}. Students join with the code ${code}.`; saveSession(); render(); })
      .catch(() => { flash = 'The cohort was not created. See the message at the top of the page.'; render(true); });
  }
});

render();
})();
