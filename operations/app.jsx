/* KONTRAKT - aplikacja (React, single-file JSX) */
/* global React, ReactDOM, firebase, XLSX, KONFIG, KENG, FIREBASE_CONFIG */
const { useState, useEffect, useMemo, useRef } = React;
const K = KONFIG, E = KENG;

/* ================= STORE ================= */
const IS_LOCAL = !FIREBASE_CONFIG || String(FIREBASE_CONFIG.apiKey || '').indexOf('WKLEJ') === 0;

function makeLocalStore() {
  const KEY = 'kontrakt_local_v1';
  let doc = {};
  try { doc = JSON.parse(localStorage.getItem(KEY) || '{}'); } catch (e) { doc = {}; }
  const subs = [];
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(doc)); } catch (e) {} };
  const getAt = (path) => {
    let n = doc;
    for (const p of path.split('/').filter(Boolean)) { if (n == null || typeof n !== 'object') return undefined; n = n[p]; }
    return n;
  };
  const setAt = (path, val) => {
    const parts = path.split('/').filter(Boolean);
    let n = doc;
    for (let i = 0; i < parts.length - 1; i++) { if (typeof n[parts[i]] !== 'object' || n[parts[i]] == null) n[parts[i]] = {}; n = n[parts[i]]; }
    if (val === null) delete n[parts[parts.length - 1]]; else n[parts[parts.length - 1]] = val;
    save();
    subs.forEach((s) => { if (path.indexOf(s.path) === 0 || s.path.indexOf(path) === 0) s.cb(getAt(s.path)); });
  };
  return {
    local: true,
    get: (path) => Promise.resolve(getAt(path)),
    claim: (path) => { if (getAt(path)) return Promise.resolve(false); setAt(path, 'claim'); return Promise.resolve(true); },
    set: (path, val) => { setAt(path, val); return Promise.resolve(); },
    update: (path, obj) => { Object.keys(obj).forEach((k) => setAt(path + '/' + k, obj[k])); return Promise.resolve(); },
    sub: (path, cb) => { const s = { path, cb }; subs.push(s); cb(getAt(path)); return () => { const i = subs.indexOf(s); if (i >= 0) subs.splice(i, 1); }; }
  };
}
function makeFirebaseStore() {
  firebase.initializeApp(FIREBASE_CONFIG);
  const db = firebase.database();
  const R = (p) => db.ref(K.meta.rootKey + '/' + p);
  return {
    local: false,
    get: (p) => R(p).once('value').then((s) => s.val()),
    claim: (p) => R(p).transaction((cur) => (cur === null ? 'claim' : undefined)).then((r) => r.committed).catch(() => false),
    set: (p, v) => R(p).set(v),
    update: (p, o) => R(p).update(o),
    sub: (p, cb) => { const ref = R(p); const h = ref.on('value', (s) => cb(s.val())); return () => ref.off('value', h); }
  };
}
const STORE = IS_LOCAL ? makeLocalStore() : makeFirebaseStore();

/* ================= POMOCNICZE ================= */
const num = (v) => { const x = parseFloat(String(v).replace(',', '.').replace(/\s/g, '')); return isNaN(x) ? 0 : x; };
const fmt = (v) => (v == null ? '—' : Number(v).toLocaleString('pl-PL'));
const slug = (s) => String(s).toLowerCase().replace(/[ąćęłńóśźż]/g, (c) => ({ ą: 'a', ć: 'c', ę: 'e', ł: 'l', ń: 'n', ó: 'o', ś: 's', ź: 'z', ż: 'z' }[c])).replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 24) || 'zespol';
const MIESIACE = ['—', 'Wrzesień', 'Październik', 'Listopad', 'Grudzień', 'Finał'];
const TASK_IDS = K.epizody.flatMap((e) => e.zadania.map((z) => z.id));
function useStore(path) {
  const [v, setV] = useState(undefined);
  useEffect(() => (path ? STORE.sub(path, setV) : undefined), [path]);
  return v;
}
function totalPoints(tasks) {
  let t = 0;
  TASK_IDS.forEach((id) => { if (tasks && tasks[id] && tasks[id].score) t += tasks[id].score; });
  return Math.round(t);
}

/* ================= ROOT ================= */
function App() {
  const [view, setView] = useState(() => {
    try { return JSON.parse(sessionStorage.getItem('kontrakt_view') || 'null') || { v: 'landing' }; } catch (e) { return { v: 'landing' }; }
  });
  const go = (v) => { setView(v); try { sessionStorage.setItem('kontrakt_view', JSON.stringify(v)); } catch (e) {} };
  if (view.v === 'team') return <TeamApp code={view.code} tid={view.tid} onExit={() => go({ v: 'landing' })} />;
  if (view.v === 'console') return <ConsoleApp code={view.code} onExit={() => go({ v: 'landing' })} onProjector={() => go({ v: 'projector', code: view.code, back: view })} />;
  if (view.v === 'projector') return <ProjectorView code={view.code} onBack={() => go(view.back || { v: 'landing' })} />;
  return <Landing go={go} />;
}

function Landing({ go }) {
  const [mode, setMode] = useState(null);
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [pin, setPin] = useState('');
  const [err, setErr] = useState('');
  const join = async () => {
    setErr('');
    const c = code.trim().toUpperCase();
    const cfg = await STORE.get('games/' + c + '/config');
    if (!cfg) { setErr('Nie ma gry o kodzie ' + c + '. Sprawdź kod u prowadzącego.'); return; }
    const tid = slug(name);
    if (!name.trim()) { setErr('Podaj nazwę zespołu.'); return; }
    const exist = await STORE.get('games/' + c + '/teams/' + tid + '/name');
    if (!exist) {
      await STORE.set('games/' + c + '/teams/' + tid, {
        name: name.trim(), seed: c + ':' + tid, kpi: Object.assign({}, K.kpiStart), created: Date.now()
      });
    }
    go({ v: 'team', code: c, tid });
  };
  const console_ = async () => {
    setErr('');
    const c = code.trim().toUpperCase();
    const cfg = await STORE.get('games/' + c + '/config');
    if (!cfg) { setErr('Nie ma gry o kodzie ' + c + '.'); return; }
    if (String(cfg.pin) !== pin.trim()) { setErr('Błędny PIN.'); return; }
    go({ v: 'console', code: c });
  };
  const create = async () => {
    const c = Array.from({ length: 5 }, () => 'ABCDEFGHJKLMNPRSTUWXYZ'[Math.floor(Math.random() * 22)]).join('');
    const p = String(1000 + Math.floor(Math.random() * 9000));
    await STORE.set('games/' + c + '/config', { pin: p, created: Date.now() });
    await STORE.set('games/' + c + '/episode', 0);
    alert('Utworzono grę.\nKOD GRY: ' + c + '\nPIN prowadzącego: ' + p + '\nZapisz oba — otwieram konsolę.');
    go({ v: 'console', code: c });
  };
  const localTest = async () => {
    const c = 'LOKAL';
    const cfg = await STORE.get('games/' + c + '/config');
    if (!cfg) { await STORE.set('games/' + c + '/config', { pin: '0000', created: Date.now() }); await STORE.set('games/' + c + '/episode', 1); }
    const tid = 'zespol-testowy';
    const exist = await STORE.get('games/' + c + '/teams/' + tid + '/name');
    if (!exist) await STORE.set('games/' + c + '/teams/' + tid, { name: 'Zespół testowy', seed: c + ':' + tid, kpi: Object.assign({}, K.kpiStart), created: Date.now() });
    go({ v: 'team', code: c, tid });
  };
  return (
    <div className="landing">
      <div className="big">KON<em>TRAKT</em></div>
      <div className="sub">FABRYKA MEBLI FALA × NORDIKA · {K.meta.podtytul}</div>
      {IS_LOCAL && <div className="panel bad" style={{ textAlign: 'left' }}>
        <b>Tryb lokalny (bez Firebase).</b> W pliku <span className="mono">config.js</span> nie wklejono jeszcze konfiguracji Firebase.
        Gra działa na tym komputerze (jedna drużyna + konsola), zapis w przeglądarce. Do zajęć z wieloma zespołami wklej konfigurację z poprzednich gier.
      </div>}
      {!mode && <div style={{ display: 'grid', gap: 12 }}>
        <button onClick={() => setMode('team')}>Dołącz jako zespół</button>
        <button className="b2" onClick={() => setMode('console')}>Panel prowadzącego</button>
        <button className="b3" onClick={localTest}>Tryb testowy (lokalnie)</button>
      </div>}
      {mode === 'team' && <div className="panel" style={{ textAlign: 'left' }}>
        <h3>Dołącz do gry</h3>
        <p><input placeholder="KOD GRY" value={code} onChange={(e) => setCode(e.target.value)} style={{ textTransform: 'uppercase' }} /></p>
        <p><input placeholder="Nazwa zespołu" value={name} onChange={(e) => setName(e.target.value)} style={{ width: '100%' }} /></p>
        {err && <p style={{ color: 'var(--bad)' }}>{err}</p>}
        <button onClick={join}>Wejdź na halę</button> <button className="b2" onClick={() => setMode(null)}>Wróć</button>
      </div>}
      {mode === 'console' && <div className="panel" style={{ textAlign: 'left' }}>
        <h3>Panel prowadzącego</h3>
        <p><input placeholder="KOD GRY" value={code} onChange={(e) => setCode(e.target.value)} style={{ textTransform: 'uppercase' }} /> <input placeholder="PIN" value={pin} onChange={(e) => setPin(e.target.value)} style={{ width: 90 }} /></p>
        {err && <p style={{ color: 'var(--bad)' }}>{err}</p>}
        <button onClick={console_}>Otwórz konsolę</button> <button className="b2" onClick={create}>Utwórz nową grę</button> <button className="b2" onClick={() => setMode(null)}>Wróć</button>
      </div>}
      <p className="small" style={{ marginTop: 30 }}>Uniwersytet Gdański · Analityka operacyjna i procesów pracy · gra nr 3 serii edu-games-story</p>
    </div>
  );
}

/* ================= ZESPÓŁ ================= */
function TeamApp({ code, tid, onExit }) {
  const base = 'games/' + code;
  const episode = useStore(base + '/episode');
  const team = useStore(base + '/teams/' + tid);
  const events = useStore(base + '/events');
  const [tab, setTab] = useState('fabula');
  const [activeTask, setActiveTask] = useState(null);
  const seed = team && team.seed;

  /* symulacja miesiąca: uruchamiana, gdy prowadzący przesunie epizod */
  useEffect(() => {
    if (!team || episode == null) return;
    const run = async () => {
      const tasks = team.tasks || {};
      const sims = team.sim || {};
      const flagsAcc = Object.assign({}, (sims.e1 || {}).flags, (sims.e2 || {}).flags, (sims.e3 || {}).flags);
      const apply = async (eid, mk) => {
        const got = await STORE.claim(base + '/teams/' + tid + '/sim/' + eid + '/done');
        if (!got) return; // inny klient zespolu juz liczy / policzyl
        const res = mk();
        const kpi = Object.assign({}, K.kpiStart, team.kpi);
        const nk = {
          cash: Math.round((kpi.cash || 0) + res.d.cash),
          otif: Math.round(Math.max(0, Math.min(100, (kpi.otif || 100) + res.d.otif))),
          unitCost: Math.round((kpi.unitCost || 262) + res.d.unitCost),
          climate: Math.round(Math.max(0, Math.min(100, (kpi.climate || 62) + res.d.climate)))
        };
        await STORE.update(base + '/teams/' + tid, { kpi: nk });
        await STORE.set(base + '/teams/' + tid + '/sim/' + eid, { lines: res.lines, flags: res.flags || {}, done: true, ts: Date.now() });
      };
      if (episode >= 2 && !(sims.e1 && sims.e1.done)) { await apply('e1', () => E.simEp1(seed, tasks)); return; }
      if (episode >= 3 && !(sims.e2 && sims.e2.done)) { await apply('e2', () => E.simEp2(seed, tasks, flagsAcc)); return; }
      if (episode >= 4 && !(sims.e3 && sims.e3.done)) { await apply('e3', () => E.simEp3(seed, tasks, flagsAcc)); return; }
      if (episode >= 5 && !(sims.e4 && sims.e4.done)) { await apply('e4', () => E.simFinal(seed, tasks, flagsAcc, team.kpi || K.kpiStart)); return; }
    };
    run();
  }, [episode, team && team.sim, team && team.tasks]);

  /* zdarzenia opcjonalne: efekt jednorazowy po stronie zespołu */
  useEffect(() => {
    if (!events || !team) return;
    const applied = (team.sim && team.sim.events) || {};
    Object.keys(events).forEach(async (ev) => {
      if (applied[ev]) return;
      const got = await STORE.claim(base + '/teams/' + tid + '/sim/events/' + ev);
      if (!got) return;
      const tasks = team.tasks || {};
      const kpi = Object.assign({}, K.kpiStart, team.kpi);
      let d = { cash: 0, otif: 0, climate: 0 };
      if (ev === 'pip') { if ((tasks.e4_2 || {}).score >= 60) d.climate = 2; else d.cash = -3000; }
      if (ev === 'reklamacja') { if (!((tasks.e2_2 || {}).eff >= 75)) d.otif = -3; }
      if (ev === 'choroba') d.cash = -1500;
      await STORE.update(base + '/teams/' + tid, { kpi: { cash: kpi.cash + d.cash, otif: Math.max(0, kpi.otif + d.otif), unitCost: kpi.unitCost, climate: Math.max(0, Math.min(100, kpi.climate + d.climate)) } });
    });
  }, [events, team && team.sim]);

  if (!team) return <div className="wrap"><p>Ładowanie zespołu…</p></div>;
  const ep = K.epizody.find((e) => e.nr === episode);

  return (
    <div>
      <ShiftBoard code={code} team={team} episode={episode} onExit={onExit} />
      <div className="wrap">
        {events && Object.keys(events).map((ev) => {
          const z = K.zdarzeniaOpcjonalne.find((x) => x.id === ev);
          return z ? <div key={ev} className="evbanner">⚠ {z.nazwa}<div className="body">{z.tekst}</div></div> : null;
        })}
        {episode === 0 && <div className="panel amber"><h2>Poczekalnia</h2><p>Gra jeszcze się nie zaczęła. Prowadzący uruchomi Epizod 1 za chwilę. Kod gry: <b className="mono">{code}</b>, zespół: <b>{team.name}</b>.</p></div>}
        {episode >= 5 && <Finale base={base} tid={tid} team={team} />}
        {episode >= 1 && episode <= 4 && <div>
          <div className="tabs">
            <button className={tab === 'fabula' ? 'on' : ''} onClick={() => setTab('fabula')}>Fabuła</button>
            <button className={tab === 'zadania' ? 'on' : ''} onClick={() => { setTab('zadania'); setActiveTask(null); }}>Zadania</button>
            <button className={tab === 'ranking' ? 'on' : ''} onClick={() => setTab('ranking')}>Ranking</button>
            <button className={tab === 'pomoc' ? 'on' : ''} onClick={() => setTab('pomoc')}>Pomoc</button>
          </div>
          {tab === 'fabula' && <StoryView ep={ep} base={base} tid={tid} team={team} />}
          {tab === 'zadania' && <TasksView ep={ep} base={base} tid={tid} team={team} seed={seed} activeTask={activeTask} setActiveTask={setActiveTask} episode={episode} />}
          {tab === 'ranking' && <Leaderboard base={base} meId={tid} />}
          {tab === 'pomoc' && <HelpView />}
        </div>}
      </div>
    </div>
  );
}

function ShiftBoard({ code, team, episode, onExit }) {
  const kpi = Object.assign({}, K.kpiStart, team.kpi);
  const cell = (label, val, suffix) => (
    <div className="kpi"><div className="v">{fmt(val)}{suffix || ''}</div><div className="l">{label}</div></div>
  );
  return (
    <div className="board"><div className="in">
      <div><div className="logo">KON<em>TRAKT</em></div><div className="tag">FALA sp. z o.o. · kod {code} · {team.name}</div></div>
      <div className="tag" style={{ fontSize: '.85rem', color: 'var(--amber)' }}>MIESIĄC: {MIESIACE[episode] || '—'}</div>
      <div className="kpis">
        {cell('Gotówka', kpi.cash, ' zł')}
        {cell('OTIF', kpi.otif, '%')}
        {cell('Koszt jedn.', kpi.unitCost, ' zł')}
        {cell('Klimat', kpi.climate, '/100')}
        <button className="bsm b2" onClick={onExit}>Wyjdź</button>
      </div>
    </div></div>
  );
}

/* ------- FABUŁA + WYWIADY ------- */
function StoryView({ ep, base, tid, team }) {
  const done = (team.interviews && team.interviews[ep.id]) || [];
  const [open, setOpen] = useState(null);
  const simPrev = team.sim && team.sim['e' + (ep.nr - 1)];
  const pick = async (idx) => {
    if (done.length >= 3 || done.includes(idx)) return;
    await STORE.set(base + '/teams/' + tid + '/interviews/' + ep.id, done.concat([idx]));
    setOpen(idx);
  };
  return (
    <div>
      {simPrev && simPrev.lines && <div className="panel steel">
        <h3>Raport z poprzedniego miesiąca</h3>
        {simPrev.lines.map((l, i) => <p key={i} className="fb">{l}</p>)}
      </div>}
      <div className="panel amber">
        <h2>Epizod {ep.nr}: {ep.tytul} <span className="badge">{ep.miesiac}</span></h2>
        <p className="small">{ep.cel}</p>
        {ep.prolog.map((d, i) => <Dialog key={i} kto={d.kto} tekst={d.tekst} />)}
      </div>
      {ep.zdarzenie && <div className="evbanner">⚠ {ep.zdarzenie.tytul}<div className="body">{ep.zdarzenie.tekst}</div></div>}
      <div className="panel">
        <h3>Wywiady <span className="badge">{3 - done.length} z 3 rozmów do wykorzystania</span></h3>
        <p className="small">Wybierz, z kim porozmawiać. Odpowiedzi zawierają wskazówki do zadań — a niewykorzystane rozmowy przepadają z końcem miesiąca.</p>
        <div className="npcgrid">
          {ep.wywiady.map((w, i) => {
            const os = K.postacie[w.npc];
            const used = done.includes(i);
            return (
              <div key={i} className={'tagcard' + (used ? ' sel' : '')} onClick={() => (used ? setOpen(open === i ? null : i) : pick(i))}>
                <div className="tt">{os.name} <span className="small">({os.rola})</span></div>
                <div className="meta">„{w.pytanie}"</div>
                {used && (open === i || true) && <div style={{ marginTop: 8 }}>
                  <Dialog kto={w.npc} tekst={w.odpowiedz} />
                  <div className="hintbox">Wskazówka: {w.hint}</div>
                </div>}
                {!used && done.length >= 3 && <div className="small" style={{ marginTop: 6 }}>Limit rozmów wyczerpany.</div>}
                {!used && done.length < 3 && <div className="small" style={{ marginTop: 6 }}>▸ kliknij, aby porozmawiać</div>}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
function Dialog({ kto, tekst }) {
  if (kto === 'narrator') return <div className="dlg nar"><div className="av">✎</div><div className="bub">{tekst}</div></div>;
  const os = K.postacie[kto];
  return <div className="dlg"><div className="av">{os.ini}</div><div className="bub"><div className="who">{os.name} · {os.rola}</div>{tekst}</div></div>;
}

/* ------- RANKING ------- */
function Leaderboard({ base, meId, big }) {
  const teams = useStore(base + '/teams');
  if (!teams) return <p>Ładowanie…</p>;
  const kpis = {}; Object.keys(teams).forEach((t) => { kpis[t] = Object.assign({}, K.kpiStart, teams[t].kpi); });
  const wyn = E.wynikFirmy(kpis);
  const rows = Object.keys(teams).map((t) => ({
    id: t, name: teams[t].name, kpi: kpis[t], wynik: wyn[t], pkt: totalPoints(teams[t].tasks)
  })).sort((a, b) => b.wynik - a.wynik || b.pkt - a.pkt);
  return (
    <div className="panel">
      <h2>Ranking — wynik firmy</h2>
      <p className="small">Wynik firmy = 35% gotówka + 30% OTIF + 15% koszt jednostkowy (odwrotnie) + 20% klimat (normalizacja min–max między zespołami). Punkty merytoryczne liczą się do oceny niezależnie od rankingu.</p>
      <table className={'lb' + (big ? ' projector' : '')} style={{ width: '100%' }}>
        <thead><tr><th>#</th><th className="l">Zespół</th><th>Wynik firmy</th><th>Gotówka</th><th>OTIF</th><th>Koszt jedn.</th><th>Klimat</th><th>Punkty</th></tr></thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={r.id} className={r.id === meId ? 'me' : ''}>
              <td>{i + 1}</td><td className="l">{r.name}{r.id === meId ? ' ◂ wy' : ''}</td>
              <td><b>{r.wynik}</b></td><td>{fmt(r.kpi.cash)} zł</td><td>{r.kpi.otif}%</td><td>{r.kpi.unitCost} zł</td><td>{r.kpi.climate}</td><td>{r.pkt}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function HelpView() {
  return (
    <div className="panel">
      <h2>Jak grać</h2>
      {K.pomoc.map((p, i) => <p key={i} className="fb">{p}</p>)}
      <hr className="hr" />
      <h3>Literatura kursu</h3>
      {K.lit.podstawowa.map((l, i) => <p key={i} className="small">{i + 1}. {l}</p>)}
    </div>
  );
}

/* ================= WIDGETY WSPÓLNE ================= */
function Stamp({ s }) {
  if (s == null) return <span className="stamp wait">OCZEKUJE</span>;
  if (s >= 60) return <span className="stamp ok pop">ZALICZONO · {s} pkt</span>;
  return <span className="stamp bad pop">DO POPRAWY · {s} pkt</span>;
}
function NumInput({ label, v, set, w, suf, ph }) {
  return (
    <label style={{ display: 'inline-block', margin: '4px 12px 4px 0' }}>
      <span className="small" style={{ display: 'block' }}>{label}</span>
      <input className="num" style={w ? { width: w } : null} value={v} placeholder={ph || ''} onChange={(e) => set(e.target.value)} />{suf ? <span className="small"> {suf}</span> : null}
    </label>
  );
}
function DataTable({ head, rows, cls }) {
  return (
    <table className={cls || ''} style={{ margin: '8px 0' }}>
      <thead><tr>{head.map((h, i) => <th key={i} className={i === 0 ? 'l' : ''}>{h}</th>)}</tr></thead>
      <tbody>{rows.map((r, i) => <tr key={i}>{r.map((c, j) => <td key={j} className={j === 0 ? 'l' : ''}>{c}</td>)}</tr>)}</tbody>
    </table>
  );
}
function SubmitBar({ taskId, base, tid, task, compute, label }) {
  const [fb, setFb] = useState(null);
  const attempts = (task && task.attempts) || 0;
  const locked = task && task.locked;
  const submit = async () => {
    const r = compute();
    if (!r) { setFb({ err: 'Uzupełnij wszystkie pola przed zatwierdzeniem.' }); return; }
    const att = attempts + 1;
    const final = att === 1 ? r.score : Math.round(r.score * 0.6);
    const rec = Object.assign({
      answers: r.answers, raw: r.score, score: Math.max(final, (task && task.score) || 0),
      attempts: att, locked: att >= 2 || r.score >= 100, ts: Date.now(), feedback: r.feedback
    }, r.extras || {});
    await STORE.set(base + '/teams/' + tid + '/tasks/' + taskId, rec);
    setFb({ feedback: r.feedback, score: final, raw: r.score });
  };
  const shown = fb || (task && task.feedback ? { feedback: task.feedback, score: task.score, raw: task.raw } : null);
  return (
    <div style={{ marginTop: 14 }}>
      <div style={{ display: 'flex', gap: 14, alignItems: 'center', flexWrap: 'wrap' }}>
        {!locked && <button onClick={submit}>{label || 'Zatwierdź odpowiedzi'}</button>}
        <Stamp s={task ? task.score : null} />
        <span className="small">{locked ? 'Zadanie zamknięte — omówimy je w debriefingu.' : attempts === 1 ? 'Druga próba: maksymalnie 60% punktów.' : 'Pierwsza próba: pełna pula 100 pkt.'}{task && task.overridden ? ' · Korekta prowadzącego.' : ''}</span>
      </div>
      {shown && shown.err && <p style={{ color: 'var(--bad)' }}>{shown.err}</p>}
      {shown && shown.feedback && <div className="panel steel" style={{ marginTop: 10 }}>
        {shown.feedback.map((f, i) => <p key={i} className="fb">{f}</p>)}
      </div>}
    </div>
  );
}

/* ------- paczki danych XLSX ------- */
function buildPack(epNr, seed, team, tid) {
  const wb = XLSX.utils.book_new();
  const aoa = (name, data) => XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(data), name);
  if (epNr === 1) {
    const g = E.genE12(seed);
    const rows = [['Miesiąc', 'Szafa PAK-3D', 'Komoda KOM-2', 'Regał REG-5']];
    for (let t = 0; t < 24; t++) rows.push([t + 1, g.hist[0][t], g.hist[1][t], g.hist[2][t]]);
    rows.push([]); rows.push(['Zadanie 1.2: porównaj MA(3), wygładzanie wykładnicze (α=0,3 i własne) oraz trend liniowy.']);
    rows.push(['MAPE licz na prognozach jednokrokowych dla miesięcy 19–24; prognozy podaj na miesiące 25–27.']);
    aoa('Sprzedaz_24m', rows);
    const g13 = E.genE13(seed);
    const r2 = [['Zmiana', 'Tydzień', 'Nadgodziny [h]', 'Braki [%]']];
    g13.rows.forEach((r) => r2.push([r.z, r.w, r.ot, r.braki]));
    r2.push([]); r2.push(['Zadanie 1.3: ANOVA jednoczynnikowa między zmianami (α=0,05) oraz regresja braki~nadgodziny.']);
    aoa('Zmiany_braki', r2);
    const fc = team.tasks && team.tasks.e1_2 && team.tasks.e1_2.answers;
    const F1 = fc ? Math.max(50, num(fc.fc[0][0])) : null, F2 = fc ? Math.max(50, num(fc.fc[0][1])) : null;
    const m = [['Zadanie 1.4: MRP dla szafy PAK-3D (dane pojawią się też na ekranie zadania)']];
    if (F1) {
      const g14 = E.genE14(seed, F1, F2);
      m.push(['MPS [szt./tydz.]', ...g14.mps]);
      m.push([]);
      m.push(['Pozycja', 'na szafę', 'zapas pocz.', 'zapas bezp.', 'przyjęcia w drodze', 'cykl dostawy [tyg.]', 'partia']);
      m.push(['Płyta 18 mm', g14.p.per, g14.p.oh, g14.p.ss, '—', g14.p.lt, 'wielokrotność ' + g14.p.lot]);
      m.push(['Okucia (kpl.)', g14.o.per, g14.o.oh, g14.o.ss, g14.o.srQty + ' w tyg. ' + g14.o.srWeek, g14.o.lt, 'L4L']);
    } else m.push(['Najpierw zatwierdź prognozę (zadanie 1.2) — MPS liczy się z Twojej prognozy.']);
    aoa('MRP', m);
  }
  if (epNr === 2) {
    const g = E.genE23(seed);
    const rows = [
      ['Zadanie 2.3: model do Solvera (max marża)'], [],
      ['', 'Szafa', 'Komoda', 'Regał', 'Zdolność [h/tydz.]'],
      ['Marża [zł/szt.]', g.c[0], g.c[1], g.c[2], ''],
      ['Piła panelowa [h/szt.]', ...g.A[0], g.b[0]],
      ['Okleiniarka po awarii [h/szt.]', ...g.A[1], g.b[1]],
      ['Wiertarko-osadzarka [h/szt.]', ...g.A[2], g.b[2]],
      ['Limit popytu [szt.]', g.ub[0], g.ub[1], g.ub[2], ''],
      [], ['Uruchom raport wrażliwości Solvera: potrzebna cena dualna godziny okleiniarki.']
    ];
    aoa('Solver_model', rows);
    const g25 = E.genE25(seed);
    aoa('CRP', [
      ['Zadanie 2.5: niedobór zdolności okleiniarki w listopadzie'], [],
      ['Niedobór H [h/mies.]', g25.H],
      ['Nadgodziny [zł/h]', g25.stOT, 'limit ' + g25.otLimit + ' h'],
      ['Kooperacja [zł/h]', g25.stCoop, 'bez limitu, +2 p.p. braków'],
      ['II zmiana [zł/mies., stały]', g25.shift2]
    ]);
  }
  if (epNr === 3) {
    const g = E.genE31(seed);
    const rows = [['Zadanie 3.1: zagadnienie transportowe (koszty zł/paletę)'], [],
      ['', 'Malmö', 'Kopenhaga', 'Hamburg', 'Wrocław', 'PODAŻ']];
    ['Tczew', 'Grudziądz', 'Gdańsk (bufor)'].forEach((n, i) => rows.push([n, ...g.C[i], g.supply[i]]));
    rows.push(['POPYT', ...g.demand, '']);
    rows.push([]); rows.push(['Kolejno: kąt pn.-zach. → metoda najmniejszego kosztu → optimum (Solver lub MODI).']);
    rows.push(['Reguła remisów w metodzie najmniejszego kosztu: mniejszy indeks wiersza, potem kolumny.']);
    aoa('Transport', rows);
  }
  if (epNr === 4) {
    const g41 = E.genE41(seed);
    const g43 = E.genE43(seed, g41.key.absZaklad);
    aoa('Etatyzacja', [
      ['Zadanie 4.3: etatyzacja stanowiska pakowania'], [],
      ['Wolumen roczny [szt.]', g43.vol],
      ['Norma [min/szt.]', g43.minSzt],
      ['Dni robocze w roku', g43.dni],
      ['Urlop [dni]', g43.urlop],
      ['Absencja [% nominalnego, z dashboardu HR]', g43.absPct],
      ['Zatrudnienie obecne [osoby]', g43.obecnie]
    ]);
  }
  XLSX.writeFile(wb, 'KONTRAKT_E' + epNr + '_' + tid + '.xlsx');
}

/* ================= ZADANIA ================= */
function TasksView({ ep, base, tid, team, seed, activeTask, setActiveTask, episode }) {
  const tasks = team.tasks || {};
  const hasExcel = ep.zadania.some((z) => z.forma === 'excel');
  const open = (z) => {
    if (z.zaleznosc && !((tasks[z.zaleznosc] || {}).attempts > 0)) return;
    setActiveTask(z.id);
  };
  if (activeTask) {
    const z = ep.zadania.find((x) => x.id === activeTask);
    return (
      <div>
        <button className="b2 bsm" onClick={() => setActiveTask(null)}>◂ Wróć do listy zadań</button>
        <div className="panel amber" style={{ marginTop: 10 }}>
          <h2>{z.nazwa} <span className="badge">{z.forma === 'excel' ? 'Excel + Solver' : z.forma === 'interaktywne' ? 'interaktywne' : 'w grze'}</span> <span className="badge">{z.czas}</span></h2>
          <TaskBody id={z.id} base={base} tid={tid} team={team} seed={seed} task={tasks[z.id]} />
        </div>
      </div>
    );
  }
  return (
    <div>
      {hasExcel && <div className="dl">
        <b>Paczka danych — Epizod {ep.nr}</b>
        <span className="small">Dane Twojego zespołu do zadań w Excelu (wygenerowane z Waszego ziarna).</span>
        <button className="bsm right" onClick={() => buildPack(ep.nr, seed, team, tid)}>Pobierz XLSX</button>
      </div>}
      <div className="tagrow">
        {ep.zadania.map((z) => {
          const t = tasks[z.id];
          const blocked = z.zaleznosc && !((tasks[z.zaleznosc] || {}).attempts > 0);
          return (
            <div key={z.id} className="tagcard" style={blocked ? { opacity: .55 } : null} onClick={() => open(z)}>
              <div className="tt">{z.nazwa}</div>
              <div className="meta">{z.forma === 'excel' ? 'EXCEL + SOLVER' : z.forma.toUpperCase()} · {z.czas}{blocked ? ' · wymaga: ' + ep.zadania.find((x) => x.id === z.zaleznosc).nazwa : ''}</div>
              <div style={{ marginTop: 8 }}><Stamp s={t ? t.score : null} />{t && t.attempts ? <span className="small"> próba {t.attempts}/2</span> : null}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function TaskBody(props) {
  switch (props.id) {
    case 'e1_1': return <TaskE11 {...props} />;
    case 'e1_2': return <TaskE12 {...props} />;
    case 'e1_3': return <TaskE13 {...props} />;
    case 'e1_4': return <TaskE14 {...props} />;
    case 'e1_5': return <TaskE15 {...props} />;
    case 'e2_1': return <TaskE21 {...props} />;
    case 'e2_2': return <TaskE22 {...props} />;
    case 'e2_3': return <TaskE23 {...props} />;
    case 'e2_4': return <TaskE24 {...props} />;
    case 'e2_5': return <TaskE25 {...props} />;
    case 'e3_1': return <TaskE31 {...props} />;
    case 'e3_2': return <TaskE32 {...props} />;
    case 'e3_3': return <TaskE33 {...props} />;
    case 'e3_4': return <TaskE34 {...props} />;
    case 'e4_1': return <TaskE41 {...props} />;
    case 'e4_2': return <TaskE42 {...props} />;
    case 'e4_3': return <TaskE43 {...props} />;
    case 'e4_4': return <TaskE44 {...props} />;
    case 'e4_5': return <TaskE45 {...props} />;
    default: return <p>Nieznane zadanie.</p>;
  }
}

/* ------- E1.1 klasyfikacja ------- */
function TaskE11({ base, tid, task, seed }) {
  const picked = useMemo(() => {
    const rng = E.makeRng(seed + ':e11');
    const idx = K.problemyPula.map((_, i) => i);
    for (let i = idx.length - 1; i > 0; i--) { const j = Math.floor(rng.f() * (i + 1)); [idx[i], idx[j]] = [idx[j], idx[i]]; }
    return idx.slice(0, 12).map((i) => K.problemyPula[i]);
  }, [seed]);
  const [ans, setAns] = useState((task && task.answers) || {});
  const setA = (i, k, v) => setAns(Object.assign({}, ans, { [i]: Object.assign({}, ans[i], { [k]: v }) }));
  const compute = () => {
    let pts = 0; const fb = [];
    picked.forEach((p, i) => {
      const a = ans[i] || {};
      if (!a.obszar || !a.metoda) return;
      if (a.obszar === p.obszar) pts += 50 / 12;
      if (a.metoda === p.metoda) pts += 50 / 12;
    });
    if (picked.some((p, i) => !(ans[i] && ans[i].obszar && ans[i].metoda))) return null;
    const wrong = picked.filter((p, i) => ans[i].obszar !== p.obszar || ans[i].metoda !== p.metoda).length;
    fb.push('Poprawnie w pełni sklasyfikowane problemy: ' + (12 - wrong) + '/12.');
    if (wrong) fb.push('Wskazówka: obszar mówi GDZIE jest problem, rodzina metod — CZYM go zaatakować. Niektóre problemy materiałowe rozwiązuje normowanie (normy zużycia), nie MRP.');
    return { score: Math.round(pts), feedback: fb, answers: ans };
  };
  return (
    <div>
      <p>Joanna prosi o uporządkowanie „listy pożarów" z wywiadów: przypisz każdemu problemowi <b>obszar</b> analityki i właściwą <b>rodzinę metod</b>.</p>
      <table style={{ width: '100%' }}>
        <thead><tr><th className="l">Problem</th><th>Obszar</th><th>Rodzina metod</th></tr></thead>
        <tbody>
          {picked.map((p, i) => (
            <tr key={i}>
              <td className="l" style={{ fontFamily: 'var(--f-body)', textAlign: 'left' }}>{p.t}</td>
              <td><select value={(ans[i] || {}).obszar || ''} onChange={(e) => setA(i, 'obszar', e.target.value)}>
                <option value="">— wybierz —</option>{K.obszary.map((o) => <option key={o.id} value={o.id}>{o.nazwa}</option>)}
              </select></td>
              <td><select value={(ans[i] || {}).metoda || ''} onChange={(e) => setA(i, 'metoda', e.target.value)}>
                <option value="">— wybierz —</option>{K.metody.map((o) => <option key={o.id} value={o.id}>{o.nazwa}</option>)}
              </select></td>
            </tr>
          ))}
        </tbody>
      </table>
      <SubmitBar taskId="e1_1" base={base} tid={tid} task={task} compute={compute} />
    </div>
  );
}

/* ------- E1.2 prognoza ------- */
function TaskE12({ base, tid, task, seed }) {
  const gen = useMemo(() => E.genE12(seed), [seed]);
  const a0 = (task && task.answers) || {};
  const [method, setMethod] = useState(a0.method || '');
  const [mape, setMape] = useState(a0.mape != null ? String(a0.mape) : '');
  const [fc, setFc] = useState(a0.fc || [['', '', ''], ['', '', ''], ['', '', '']]);
  const setF = (p, m, v) => { const n = fc.map((r) => r.slice()); n[p][m] = v; setFc(n); };
  const compute = () => {
    if (!method || mape === '' || fc.flat().some((x) => x === '')) return null;
    const ans = { method, mape: num(mape), fc: fc.map((r) => r.map(num)) };
    const v = E.valE12(gen, ans);
    return { score: v.score, feedback: v.feedback, answers: ans, extras: { exPostMape: v.exPostMape } };
  };
  const prods = ['Szafa PAK-3D', 'Komoda KOM-2', 'Regał REG-5'];
  return (
    <div>
      <p>Magda oddaje arkusz z 24 miesiącami sprzedaży (w paczce XLSX epizodu). Porównaj w Excelu <b>MA(3)</b>, <b>wygładzanie wykładnicze</b> (α = 0,3 i własne) i <b>trend liniowy</b>: MAPE na prognozach jednokrokowych dla miesięcy 19–24. Wybraną metodą zadeklaruj NORDICE wolumeny na miesiące 25–27.</p>
      <DataTable head={['Miesiąc', 'Szafa', 'Komoda', 'Regał']} rows={[[1, gen.hist[0][0], gen.hist[1][0], gen.hist[2][0]], ['…', '…', '…', '…'], [24, gen.hist[0][23], gen.hist[1][23], gen.hist[2][23]]]} />
      <hr className="hr" />
      <p>
        <label className="small" style={{ marginRight: 10 }}>Wybrana metoda:{' '}
          <select value={method} onChange={(e) => setMethod(e.target.value)}>
            <option value="">—</option><option value="MA3">MA(3)</option><option value="ES">Wygł. wykładnicze (α=0,3)</option><option value="Trend">Trend liniowy</option>
          </select></label>
        <NumInput label="MAPE tej metody, mies. 19–24 (szafa) [%]" v={mape} set={setMape} />
      </p>
      <table><thead><tr><th className="l">Prognoza [szt.]</th><th>Mies. 25</th><th>Mies. 26</th><th>Mies. 27</th></tr></thead>
        <tbody>{prods.map((p, i) => <tr key={i}><td className="l">{p}</td>{[0, 1, 2].map((m) => <td key={m}><input className="num" style={{ width: 84 }} value={fc[i][m]} onChange={(e) => setF(i, m, e.target.value)} /></td>)}</tr>)}</tbody></table>
      <p className="small">Punktacja: 40 pkt spójność MAPE z kluczem (±0,5 p.p.), 60 pkt trafność ex post — gra zna prawdziwy proces popytu i porówna Waszą prognozę z realizacją. Prognoza zasili plan MRP (zadanie 1.4) i produkcję października.</p>
      <SubmitBar taskId="e1_2" base={base} tid={tid} task={task} compute={compute} />
    </div>
  );
}

/* ------- E1.3 ANOVA + regresja ------- */
function TaskE13({ base, tid, task, seed }) {
  const gen = useMemo(() => E.genE13(seed), [seed]);
  const a0 = (task && task.answers) || {};
  const [F, setF] = useState(a0.F != null ? String(a0.F) : '');
  const [b, setB] = useState(a0.b != null ? String(a0.b) : '');
  const [r2, setR2] = useState(a0.r2 != null ? String(a0.r2) : '');
  const [wn, setWn] = useState(a0.wniosek || '');
  const compute = () => {
    if (F === '' || b === '' || r2 === '' || !wn) return null;
    const ans = { F: num(F), b: num(b), r2: num(r2), wniosek: wn };
    const v = E.valE13(gen, ans);
    return { score: v.score, feedback: v.feedback, answers: ans };
  };
  return (
    <div>
      <p>Grabowski obstawia „klątwę trzeciej zmiany", Beata — nadgodziny. Dane (8 tygodni × 3 zmiany: braki % i nadgodziny) są w paczce XLSX. Rozstrzygnij: <b>(a)</b> ANOVA jednoczynnikowa między zmianami (α = 0,05, F<sub>kryt</sub>(2;21) = {gen.key.Fcrit}), <b>(b)</b> regresja braków względem nadgodzin.</p>
      <DataTable head={['Zmiana', 'Tydz.', 'Nadgodz. [h]', 'Braki [%]']} rows={[[1, 1, gen.rows[0].ot, gen.rows[0].braki], ['…', '…', '…', '…'], [3, 8, gen.rows[23].ot, gen.rows[23].braki]]} />
      <p>
        <NumInput label="Statystyka F" v={F} set={setF} />
        <NumInput label="Współczynnik b regresji [p.p. braków / h]" v={b} set={setB} w={150} />
        <NumInput label="R²" v={r2} set={setR2} />
      </p>
      <p className="small"><b>Co rekomendujesz Joannie?</b></p>
      {[['A', 'Wymienić obsadę trzeciej zmiany — to oni psują wyniki.'],
        ['B', 'Nic — różnice między zmianami są dziełem przypadku.'],
        ['C', 'Ograniczyć nadgodziny (to one podnoszą braki) i monitorować zmianę 3, na której się kumulują.'],
        ['D', 'Dołożyć kontrolę jakości na końcu linii — przyczyna nie ma znaczenia.']].map(([k, t]) => (
        <label key={k} style={{ display: 'block', margin: '3px 0' }}><input type="radio" name="wn13" checked={wn === k} onChange={() => setWn(k)} /> <b>{k}.</b> {t}</label>
      ))}
      <SubmitBar taskId="e1_3" base={base} tid={tid} task={task} compute={compute} />
    </div>
  );
}

/* ------- E1.4 MRP ------- */
function TaskE14({ base, tid, task, seed, team }) {
  const f = team.tasks && team.tasks.e1_2 && team.tasks.e1_2.answers;
  const F1 = Math.max(50, num(f && f.fc[0][0]) || 400), F2 = Math.max(50, num(f && f.fc[0][1]) || 400);
  const gen = useMemo(() => E.genE14(seed, F1, F2), [seed, F1, F2]);
  const a0 = (task && task.answers) || {};
  const [pp, setPp] = useState(a0.porelP ? a0.porelP.map(String) : Array(8).fill(''));
  const [po, setPo] = useState(a0.porelO ? a0.porelO.map(String) : Array(8).fill(''));
  const setArr = (arr, set, i, v) => { const n = arr.slice(); n[i] = v; set(n); };
  const compute = () => {
    const ans = { porelP: pp.map((x) => num(x)), porelO: po.map((x) => num(x)) };
    const v = E.valE14(gen, ans);
    return { score: v.score, feedback: v.feedback, answers: ans };
  };
  const wk = [1, 2, 3, 4, 5, 6, 7, 8];
  return (
    <div>
      <p>MPS wyliczono z <b>Waszej prognozy</b> szafy (mies. 25: {F1}, mies. 26: {F2} szt.), rozłożonej na 8 tygodni z rozruchem: tyg. 3–4 po 15% F₁, tyg. 5–6 po 20% F₁, tyg. 7–8 po 25% F₂. Zbuduj pełne tablice MRP w Excelu i wpisz wiersz <b>planowanych uruchomień zamówień</b>.</p>
      <DataTable head={['Tydzień', ...wk]} rows={[['MPS szafy [szt.]', ...gen.mps]]} />
      <DataTable head={['Pozycja', 'na szafę', 'zapas pocz.', 'zapas bezp.', 'przyjęcia w drodze', 'cykl [tyg.]', 'partia']}
        rows={[
          ['Płyta 18 mm', gen.p.per, gen.p.oh, gen.p.ss, '—', gen.p.lt, 'wielokr. ' + gen.p.lot],
          ['Okucia (kpl.)', gen.o.per, gen.o.oh, gen.o.ss, gen.o.srQty + ' szt. w tyg. ' + gen.o.srWeek, gen.o.lt, 'L4L']
        ]} />
      <h4>Planowane uruchomienia zamówień [szt.] — wpisz 0, gdy brak zamówienia</h4>
      <table><thead><tr><th className="l">Pozycja</th>{wk.map((w) => <th key={w}>tyg. {w}</th>)}</tr></thead><tbody>
        <tr><td className="l">Płyta 18 mm</td>{wk.map((w, i) => <td key={i}><input className="num" style={{ width: 64 }} value={pp[i]} onChange={(e) => setArr(pp, setPp, i, e.target.value)} /></td>)}</tr>
        <tr><td className="l">Okucia</td>{wk.map((w, i) => <td key={i}><input className="num" style={{ width: 64 }} value={po[i]} onChange={(e) => setArr(po, setPo, i, e.target.value)} /></td>)}</tr>
      </tbody></table>
      <p className="small">Błędne uruchomienia zmaterializują się w październiku jako przestoje i dostawy ekspresowe. Zapas dysponowany płyty nie może spaść poniżej zapasu bezpieczeństwa.</p>
      <SubmitBar taskId="e1_4" base={base} tid={tid} task={task} compute={compute} />
    </div>
  );
}

/* ------- E1.5 odchylenia ------- */
function TaskE15({ base, tid, task, seed }) {
  const gen = useMemo(() => E.genE15(seed), [seed]);
  const a0 = (task && task.answers) || {};
  const [oi, setOi] = useState(a0.odchI != null ? String(a0.odchI) : '');
  const [oc, setOc] = useState(a0.odchC != null ? String(a0.odchC) : '');
  const compute = () => {
    if (oi === '' || oc === '') return null;
    const ans = { odchI: num(oi), odchC: num(oc) };
    const v = E.valE15(gen, ans);
    return { score: v.score, feedback: v.feedback, answers: ans };
  };
  return (
    <div>
      <p>Księgowość alarmuje: wrzesień przekroczył budżet płyty. Rozdziel efekt <b>ilości</b> od efektu <b>ceny</b> (odchylenia niekorzystne ze znakiem plus).</p>
      <DataTable head={['Parametr', 'Wartość']} rows={[
        ['Norma zużycia', gen.qStd + ' szt./szafę'],
        ['Cena standardowa', gen.pStd + ' zł/szt.'],
        ['Produkcja września', gen.prod + ' szaf'],
        ['Zużycie rzeczywiste', gen.qReal + ' szt.'],
        ['Cena rzeczywista', gen.pReal + ' zł/szt.']
      ]} />
      <p>
        <NumInput label="Odchylenie ilościowe [zł]" v={oi} set={setOi} w={130} />
        <NumInput label="Odchylenie cenowe [zł]" v={oc} set={setOc} w={130} />
      </p>
      <p className="small">Konwencja: odchylenie ilościowe = (zużycie rzecz. − norma × produkcja) × cena standardowa; cenowe = (cena rzecz. − standardowa) × zużycie rzeczywiste.</p>
      <SubmitBar taskId="e1_5" base={base} tid={tid} task={task} compute={compute} />
    </div>
  );
}

/* ------- E2.1 OEE ------- */
function TaskE21({ base, tid, task, seed }) {
  const gen = useMemo(() => E.genE21(seed), [seed]);
  const a0 = (task && task.answers) || {};
  const [v, setV] = useState({ pila: a0.pila || '', okleiniarka: a0.okleiniarka || '', wiertarka: a0.wiertarka || '', gardlo: a0.gardlo || '' });
  const set = (k, x) => setV(Object.assign({}, v, { [k]: x }));
  const M = [['pila', 'Piła panelowa'], ['okleiniarka', 'Okleiniarka'], ['wiertarka', 'Wiertarko-osadzarka']];
  const compute = () => {
    if (M.some(([k]) => v[k] === '') || !v.gardlo) return null;
    const ans = { pila: num(v.pila), okleiniarka: num(v.okleiniarka), wiertarka: num(v.wiertarka), gardlo: v.gardlo };
    const r = E.valE21(gen, ans);
    return { score: r.score, feedback: r.feedback, answers: ans };
  };
  return (
    <div>
      <p>Grabowski: „Maszyny chodzą na sto procent!" Sprawdź. Dla każdej maszyny policz <b>OEE = dostępność × wydajność × jakość</b> [%], a potem wskaż wąskie gardło (pamiętaj: wszystkie trzy wyroby przechodzą przez okleiniarkę, obciążenia porównuj ze zdolnością efektywną).</p>
      <table><thead><tr><th className="l">Maszyna</th><th>Dostępność</th><th>Wydajność</th><th>Jakość</th><th>OEE [%] — Twój wynik</th></tr></thead><tbody>
        {M.map(([k, n]) => <tr key={k}>
          <td className="l">{n}</td><td>{gen.machines[k].av}</td><td>{gen.machines[k].pf}</td><td>{gen.machines[k].q}</td>
          <td><input className="num" style={{ width: 80 }} value={v[k]} onChange={(e) => set(k, e.target.value)} /></td>
        </tr>)}
      </tbody></table>
      <p><label className="small">Wąskie gardło fabryki:{' '}
        <select value={v.gardlo} onChange={(e) => set('gardlo', e.target.value)}>
          <option value="">—</option><option value="pila">piła panelowa</option><option value="okleiniarka">okleiniarka</option><option value="wiertarka">wiertarko-osadzarka</option>
        </select></label></p>
      <SubmitBar taskId="e2_1" base={base} tid={tid} task={task} compute={compute} />
    </div>
  );
}

/* ------- E2.2 balansowanie linii (interaktywne) ------- */
function TaskE22({ base, tid, task, seed }) {
  const gen = useMemo(() => E.genE22(seed), [seed]);
  const a0 = (task && task.answers) || {};
  const [assign, setAssign] = useState(a0.assign || {});
  const [nS, setNS] = useState(a0.nS || 3);
  const [sel, setSel] = useState(null);
  const keys = Object.keys(gen.times);
  const pool = keys.filter((k) => assign[k] === undefined);
  const put = (st) => { if (sel == null) return; setAssign(Object.assign({}, assign, { [sel]: st })); setSel(null); };
  const back = (k) => { const n = Object.assign({}, assign); delete n[k]; setAssign(n); };
  const loads = Array(nS).fill(0);
  Object.keys(assign).forEach((k) => { if (assign[k] < nS) loads[assign[k]] += gen.times[k]; });
  const viol = [];
  Object.keys(gen.prec).forEach((t) => gen.prec[t].forEach((p) => {
    if (assign[p] !== undefined && assign[t] !== undefined && assign[p] > assign[t]) viol.push(p + '→' + t);
  }));
  const compute = () => {
    if (pool.length) return null;
    const r = E.valE22(gen, assign);
    return { score: r.score, feedback: r.feedback, answers: { assign, nS }, extras: { eff: r.eff, nStations: r.nStations } };
  };
  return (
    <div>
      <p>Popyt: 60 komód na zmianę 8 h → <b>takt CT = 480 s</b>. Suma czasów operacji: <b>{gen.total} s</b>, więc minimum teoretyczne to ⌈{gen.total}/480⌉ = <b>{gen.minS} stanowiska</b> (Zenek używa czterech). Kliknij operację, potem stanowisko. Poprzedzania: {Object.keys(gen.prec).filter((t) => gen.prec[t].length).map((t) => gen.prec[t].join(',') + '→' + t).join('; ')}.</p>
      <div className="panel" style={{ padding: 10 }}>
        <b className="small">OPERACJE DO PRZYDZIELENIA:</b><br />
        {pool.map((k) => <span key={k} className={'lbtask' + (sel === k ? ' sel' : '')} onClick={() => setSel(sel === k ? null : k)}>{k} · {gen.times[k]} s</span>)}
        {!pool.length && <span className="small"> wszystkie operacje przydzielone</span>}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(' + nS + ',1fr)', gap: 10 }}>
        {Array.from({ length: nS }, (_, s) => (
          <div key={s} className={'station' + (loads[s] > gen.CT ? ' over' : '')} onClick={() => put(s)}>
            <b className="small">STANOWISKO {s + 1} — {loads[s]}/{gen.CT} s</b><br />
            {keys.filter((k) => assign[k] === s).map((k) => <span key={k} className="lbtask done" onClick={(e) => { e.stopPropagation(); back(k); }}>{k} · {gen.times[k]} s ✕</span>)}
          </div>
        ))}
      </div>
      <p className="small" style={{ marginTop: 8 }}>
        {viol.length ? <span style={{ color: 'var(--bad)' }}>Naruszone poprzedzania: {viol.join(', ')} · </span> : null}
        {loads.some((l) => l > gen.CT) ? <span style={{ color: 'var(--bad)' }}>Przekroczony takt · </span> : null}
        Efektywność przy {nS} stanowiskach: {(gen.total / (nS * gen.CT) * 100).toFixed(1)}%
        {'  '}<button className="bsm b2" onClick={() => setNS(Math.min(4, nS + 1))} disabled={nS >= 4}>+ stanowisko</button>{' '}
        <button className="bsm b2" onClick={() => { if (nS > 3) { const n = Object.assign({}, assign); Object.keys(n).forEach((k) => { if (n[k] >= nS - 1) delete n[k]; }); setAssign(n); setNS(nS - 1); } }} disabled={nS <= 3}>− stanowisko</button>
      </p>
      <SubmitBar taskId="e2_2" base={base} tid={tid} task={task} compute={compute} label="Zatwierdź przydział" />
    </div>
  );
}

/* ------- E2.3 LP Solver ------- */
function TaskE23({ base, tid, task, seed }) {
  const gen = useMemo(() => E.genE23(seed), [seed]);
  const a0 = (task && task.answers) || {};
  const [v, setV] = useState({ S: a0.S ?? '', K: a0.K ?? '', R: a0.R ?? '', z: a0.z ?? '', binding: a0.binding || '', dual: a0.dual ?? '', decyzja: a0.decyzja || '' });
  const set = (k, x) => setV(Object.assign({}, v, { [k]: x }));
  const compute = () => {
    if (v.S === '' || v.K === '' || v.R === '' || v.z === '' || !v.binding || v.dual === '' || !v.decyzja) return null;
    const ans = { S: num(v.S), K: num(v.K), R: num(v.R), z: num(v.z), binding: v.binding, dual: num(v.dual), decyzja: v.decyzja };
    const r = E.valE23(gen, ans);
    return { score: r.score, feedback: r.feedback, answers: ans };
  };
  return (
    <div>
      <p>Po awarii okleiniarki nie da się wyprodukować wszystkiego. Zbuduj model w <b>Solverze</b> (dane też w paczce XLSX): maksymalizuj tygodniową marżę przy ograniczeniach maszynowych i popytowych. Uruchom <b>raport wrażliwości</b> — potrzebna cena dualna godziny okleiniarki.</p>
      <DataTable head={['', 'Szafa', 'Komoda', 'Regał', 'Zdolność [h]']} rows={[
        ['Marża [zł/szt.]', gen.c[0], gen.c[1], gen.c[2], ''],
        ['Piła [h/szt.]', ...gen.A[0], gen.b[0]],
        ['Okleiniarka (po awarii) [h/szt.]', ...gen.A[1], gen.b[1]],
        ['Wiertarka [h/szt.]', ...gen.A[2], gen.b[2]],
        ['Limit popytu [szt.]', gen.ub[0], gen.ub[1], gen.ub[2], '']
      ]} />
      <p>
        <NumInput label="Szafy [szt.]" v={v.S} set={(x) => set('S', x)} w={80} />
        <NumInput label="Komody [szt.]" v={v.K} set={(x) => set('K', x)} w={80} />
        <NumInput label="Regały [szt.]" v={v.R} set={(x) => set('R', x)} w={80} />
        <NumInput label="Marża maks. [zł/tydz.]" v={v.z} set={(x) => set('z', x)} w={110} />
      </p>
      <p>
        <label className="small" style={{ marginRight: 12 }}>Ograniczenie wiążące:{' '}
          <select value={v.binding} onChange={(e) => set('binding', e.target.value)}>
            <option value="">—</option><option value="pila">piła</option><option value="okleiniarka">okleiniarka</option><option value="wiertarka">wiertarka</option><option value="popyt">tylko limity popytu</option>
          </select></label>
        <NumInput label="Cena dualna godziny okleiniarki [zł/h]" v={v.dual} set={(x) => set('dual', x)} w={100} />
      </p>
      <p className="small"><b>Co mówisz Grabowskiemu?</b></p>
      {[['A', 'Komody produkujemy jak zwykle — to nasza wizytówka, nie ruszamy.'],
        ['B', 'Komody wstrzymujemy na październik: każda godzina okleiniarki oddaje na nich mniej marży niż na pozostałych wyrobach. Wracają po naprawie.'],
        ['C', 'Tniemy wszystkie wyroby proporcjonalnie — po równo, żeby było sprawiedliwie.']].map(([k, t]) => (
        <label key={k} style={{ display: 'block', margin: '3px 0' }}><input type="radio" name="dec23" checked={v.decyzja === k} onChange={() => set('decyzja', k)} /> <b>{k}.</b> {t}</label>
      ))}
      <p className="small">Zapamiętaj cenę dualną — ta liczba wróci w epizodzie 3 jako uzasadnienie inwestycji.</p>
      <SubmitBar taskId="e2_3" base={base} tid={tid} task={task} compute={compute} />
    </div>
  );
}

/* ------- E2.4 Johnson + Gantt ------- */
function TaskE24({ base, tid, task, seed }) {
  const gen = useMemo(() => E.genE24(seed), [seed]);
  const a0 = (task && task.answers) || {};
  const [seq, setSeq] = useState(a0.seq || Object.keys(gen.jobs));
  const [rule, setRule] = useState(a0.rule || '');
  const move = (i, d) => {
    const j = i + d; if (j < 0 || j >= seq.length) return;
    const n = seq.slice(); [n[i], n[j]] = [n[j], n[i]]; setSeq(n);
  };
  const ms = E.makespan(seq, gen.jobs);
  /* Gantt SVG */
  const scale = 600 / 42;
  let t1 = 0, t2 = 0;
  const bars = [];
  const cols = ['#33566B', '#E8A013', '#2F7D4F', '#B3402E', '#6E675B'];
  seq.forEach((j, i) => {
    const [a, b] = gen.jobs[j];
    bars.push({ j, x: t1 * scale, w: a * scale, y: 8, c: cols[i % 5] });
    t1 += a;
    const start2 = Math.max(t2, t1);
    bars.push({ j, y: 46, c: cols[i % 5], w: b * scale, x2: start2 * scale });
    t2 = start2 + b;
  });
  const compute = () => {
    if (!rule) return null;
    const ans = { seq, rule };
    const r = E.valE24(gen, ans);
    return { score: r.score, feedback: r.feedback, answers: ans, extras: { ms: r.ms } };
  };
  return (
    <div>
      <p>Pięć pilnych zleceń NORDIKI przechodzi przez <b>cięcie (M1)</b>, a potem <b>oklejanie (M2)</b>. Magda puściła je „jak przyszły". Ułóż kolejność minimalizującą łączny czas (makespan) — Gantt rysuje się na żywo.</p>
      <table><thead><tr><th>Kolejność</th><th className="l">Zlecenie</th><th>M1: cięcie [h]</th><th>M2: oklejanie [h]</th><th></th></tr></thead><tbody>
        {seq.map((j, i) => <tr key={j}><td>{i + 1}</td><td className="l">{j}</td><td>{gen.jobs[j][0]}</td><td>{gen.jobs[j][1]}</td>
          <td><button className="bsm b2" onClick={() => move(i, -1)}>▲</button> <button className="bsm b2" onClick={() => move(i, 1)}>▼</button></td></tr>)}
      </tbody></table>
      <svg width="660" height="96" style={{ maxWidth: '100%', background: '#fff', border: '1.5px solid var(--line-d)', margin: '8px 0' }}>
        <text x="4" y="22" fontSize="11" fontFamily="var(--f-mono)">M1</text>
        <text x="4" y="60" fontSize="11" fontFamily="var(--f-mono)">M2</text>
        {bars.map((b, i) => b.w ? <g key={i}>
          <rect x={26 + (b.x2 != null ? b.x2 : b.x)} y={b.y} width={b.w} height={26} fill={b.c} opacity="0.85" stroke="#23201B" />
          <text x={26 + (b.x2 != null ? b.x2 : b.x) + 4} y={b.y + 17} fontSize="11" fill="#fff" fontFamily="var(--f-mono)">{b.j}</text>
        </g> : null)}
        <line x1={26 + ms * scale} y1="0" x2={26 + ms * scale} y2="80" stroke="#B3402E" strokeWidth="2" strokeDasharray="4 3" />
        <text x={Math.min(600, 30 + ms * scale)} y="92" fontSize="12" fontFamily="var(--f-mono)" fill="#B3402E">makespan: {ms} h</text>
      </svg>
      <p><label className="small">Jaką regułę zastosowano?{' '}
        <select value={rule} onChange={(e) => setRule(e.target.value)}>
          <option value="">—</option>
          <option value="fifo">FIFO (kolejność zgłoszeń)</option>
          <option value="spt">SPT (najkrótsza operacja najpierw)</option>
          <option value="johnson">Reguła Johnsona</option>
          <option value="edd">EDD (najbliższy termin najpierw)</option>
        </select></label></p>
      <SubmitBar taskId="e2_4" base={base} tid={tid} task={task} compute={compute} label="Zatwierdź kolejność" />
    </div>
  );
}

/* ------- E2.5 CRP ------- */
function TaskE25({ base, tid, task, seed }) {
  const gen = useMemo(() => E.genE25(seed), [seed]);
  const a0 = (task && task.answers) || {};
  const [v, setV] = useState({ costOT: a0.costOT ?? '', costCoop: a0.costCoop ?? '', costShift: a0.costShift ?? '', wybor: a0.wybor || '' });
  const set = (k, x) => setV(Object.assign({}, v, { [k]: x }));
  const compute = () => {
    if (v.costOT === '' || v.costCoop === '' || v.costShift === '' || !v.wybor) return null;
    const ans = { costOT: num(v.costOT), costCoop: num(v.costCoop), costShift: num(v.costShift), wybor: v.wybor };
    const r = E.valE25(gen, ans);
    return { score: r.score, feedback: r.feedback, answers: ans };
  };
  return (
    <div>
      <p>{K.crp.opis}</p>
      <div className="panel steel"><b>Niedobór godzin okleiniarki w listopadzie (z Waszego MPS): H = {gen.H} h/mies.</b></div>
      <div className="npcgrid">
        {K.crp.opcje.map((o) => <div key={o.id} className={'tagcard' + (v.wybor === o.id ? ' sel' : '')} onClick={() => set('wybor', o.id)}>
          <div className="tt">{o.nazwa}</div><div className="small">{o.opis}</div>
          {v.wybor === o.id && <div className="small" style={{ marginTop: 6 }}>◂ wybrany wariant</div>}
        </div>)}
      </div>
      <p style={{ marginTop: 10 }}>
        <NumInput label={'Koszt nadgodzin dla H=' + gen.H + ' h [zł]'} v={v.costOT} set={(x) => set('costOT', x)} w={110} />
        <NumInput label="Koszt kooperacji [zł]" v={v.costCoop} set={(x) => set('costCoop', x)} w={110} />
        <NumInput label="Koszt II zmiany [zł/mies.]" v={v.costShift} set={(x) => set('costShift', x)} w={110} />
      </p>
      <p className="small">Punktujemy poprawny rachunek wszystkich trzech opcji oraz wybór spójny z rachunkiem — także świadome przepłacenie za klimat, jeśli koszty policzono dobrze. Skutki wyboru zobaczycie w symulacji miesiąca.</p>
      <SubmitBar taskId="e2_5" base={base} tid={tid} task={task} compute={compute} />
    </div>
  );
}

/* ------- E3.1 transport ------- */
function TaskE31({ base, tid, task, seed }) {
  const gen = useMemo(() => E.genE31(seed), [seed]);
  const a0 = (task && task.answers) || {};
  const [v, setV] = useState({ nw: a0.nw ?? '', lc: a0.lc ?? '', opt: a0.opt ?? '' });
  const [al, setAl] = useState(a0.alloc ? a0.alloc.map((r) => r.map(String)) : [['', '', '', ''], ['', '', '', ''], ['', '', '', '']]);
  const set = (k, x) => setV(Object.assign({}, v, { [k]: x }));
  const setC = (i, j, x) => { const n = al.map((r) => r.slice()); n[i][j] = x; setAl(n); };
  const SRC = ['Tczew', 'Grudziądz', 'Gdańsk (bufor)'], DST = ['Malmö', 'Kopenhaga', 'Hamburg', 'Wrocław'];
  const compute = () => {
    if (v.nw === '' || v.lc === '' || v.opt === '' || al.flat().some((x) => x === '')) return null;
    const ans = { nw: num(v.nw), lc: num(v.lc), opt: num(v.opt), alloc: al.map((r) => r.map(num)) };
    const r = E.valE31(gen, ans);
    return { score: r.score, feedback: r.feedback, answers: ans };
  };
  return (
    <div>
      <p>Trzy punkty nadania, czterech odbiorców, zadanie zbilansowane. Poprowadź tablicę transportową (ręcznie lub w Excelu): <b>kąt pn.-zach.</b> → <b>metoda najmniejszego kosztu</b> (remisy: mniejszy indeks wiersza, potem kolumny) → <b>optimum</b> (Solver lub MODI). Wpisz trzy koszty całkowite oraz alokację optymalną.</p>
      <table><thead><tr><th className="l">zł/paletę</th>{DST.map((d) => <th key={d}>{d}</th>)}<th>PODAŻ</th></tr></thead><tbody>
        {SRC.map((s, i) => <tr key={s}><td className="l">{s}</td>{gen.C[i].map((c, j) => <td key={j}>{c}</td>)}<td><b>{gen.supply[i]}</b></td></tr>)}
        <tr><td className="l"><b>POPYT</b></td>{gen.demand.map((d, j) => <td key={j}><b>{d}</b></td>)}<td>{E.sum(gen.supply)}</td></tr>
      </tbody></table>
      <p>
        <NumInput label="Koszt: kąt pn.-zach. [zł]" v={v.nw} set={(x) => set('nw', x)} w={110} />
        <NumInput label="Koszt: najmniejszego kosztu [zł]" v={v.lc} set={(x) => set('lc', x)} w={110} />
        <NumInput label="Koszt: optimum [zł]" v={v.opt} set={(x) => set('opt', x)} w={110} />
      </p>
      <h4>Alokacja optymalna [palety] — wpisz 0 w pustych komórkach</h4>
      <table><thead><tr><th className="l"></th>{DST.map((d) => <th key={d}>{d}</th>)}</tr></thead><tbody>
        {SRC.map((s, i) => <tr key={s}><td className="l">{s}</td>{[0, 1, 2, 3].map((j) => <td key={j}><input className="num" style={{ width: 66 }} value={al[i][j]} onChange={(e) => setC(i, j, e.target.value)} /></td>)}</tr>)}
      </tbody></table>
      <p className="small">Alokację sprawdzamy przez bilanse wierszy i kolumn oraz koszt — rozwiązania alternatywne o tym samym koszcie są akceptowane. Nadpłata Waszego planu względem optimum obciąży gotówkę w symulacji listopada.</p>
      <SubmitBar taskId="e3_1" base={base} tid={tid} task={task} compute={compute} />
    </div>
  );
}

/* ------- E3.2 scorecard ------- */
function TaskE32({ base, tid, task, seed, team }) {
  const flags = useMemo(() => Object.assign({},
    team.sim && team.sim.e1 && team.sim.e1.flags,
    team.sim && team.sim.e2 && team.sim.e2.flags), [team.sim]);
  const gen = useMemo(() => E.genE32(seed, flags), [seed, JSON.stringify(flags)]);
  const a0 = (task && task.answers) || {};
  const [v, setV] = useState({ otif: a0.otif ?? '', kosztM3: a0.kosztM3 ?? '', wyk: a0.wyk ?? '' });
  const set = (k, x) => setV(Object.assign({}, v, { [k]: x }));
  const compute = () => {
    if (v.otif === '' || v.kosztM3 === '' || v.wyk === '') return null;
    const ans = { otif: num(v.otif), kosztM3: num(v.kosztM3), wyk: num(v.wyk) };
    const r = E.valE32(gen, ans);
    return { score: r.score, feedback: r.feedback, answers: ans };
  };
  return (
    <div>
      <p>NORDIKA przysłała szablon scorecardu dostawcy. Z danych 24 dostaw października (Waszego października — spójrz na kolumny „na czas" i „kompletna") policz: <b>OTIF</b> [%], <b>koszt transportu na m³</b> [zł/m³] i <b>wykorzystanie ładowności</b> [%].</p>
      <div style={{ maxHeight: 260, overflow: 'auto', border: '1.5px solid var(--line-d)' }}>
        <table style={{ width: '100%' }}><thead><tr><th>Nr</th><th>Ładunek [m³]</th><th>Koszt [zł]</th><th>Ładowność [m³]</th><th>Na czas</th><th>Kompletna</th></tr></thead><tbody>
          {gen.rows.map((r) => <tr key={r.nr}><td>{r.nr}</td><td>{r.m3}</td><td>{r.koszt}</td><td>{r.ladownosc}</td><td>{r.naCzas ? '✓' : '✗'}</td><td>{r.kompletna ? '✓' : '✗'}</td></tr>)}
        </tbody></table>
      </div>
      <p>
        <NumInput label="OTIF [%]" v={v.otif} set={(x) => set('otif', x)} />
        <NumInput label="Koszt / m³ [zł]" v={v.kosztM3} set={(x) => set('kosztM3', x)} />
        <NumInput label="Wykorzystanie ładowności [%]" v={v.wyk} set={(x) => set('wyk', x)} />
      </p>
      <p className="small">Pamiętaj: OTIF liczy dostawy <b>na czas i w komplecie</b> jednocześnie. Próg kontraktowy NORDIKI: {K.progOTIF}%.</p>
      <SubmitBar taskId="e3_2" base={base} tid={tid} task={task} compute={compute} />
    </div>
  );
}

/* ------- E3.3 CPM ------- */
function TaskE33({ base, tid, task, seed }) {
  const gen = useMemo(() => E.genE33(seed), [seed]);
  const keys = Object.keys(gen.acts);
  const a0 = (task && task.answers) || {};
  const [ES, setES] = useState(a0.ES || {});
  const [LS, setLS] = useState(a0.LS || {});
  const [crit, setCrit] = useState(a0.crit || []);
  const [T, setT] = useState(a0.T ?? '');
  const [sh, setSh] = useState(a0.slackH ?? '');
  const [sk, setSk] = useState(a0.skracaj || '');
  const setM = (o, set, k, v) => set(Object.assign({}, o, { [k]: v }));
  const togCrit = (a) => setCrit(crit.includes(a) ? crit.filter((x) => x !== a) : crit.concat([a]));
  const POS = { A: [40, 30], B: [170, 30], C: [40, 120], D: [300, 12], E: [300, 66], H: [300, 128], F: [430, 40], G: [552, 40], I: [672, 84], J: [780, 84] };
  const compute = () => {
    if (keys.some((k) => ES[k] === undefined || ES[k] === '' || LS[k] === undefined || LS[k] === '') || T === '' || sh === '' || !sk) return null;
    const ans = { ES, LS, crit, T: num(T), slackH: num(sh), skracaj: sk };
    const r = E.valE33(gen, ans);
    return { score: r.score, feedback: r.feedback, answers: ans };
  };
  return (
    <div>
      <p>Joanna zatwierdziła zakup nowej okleiniarki (Wasza cena dualna przekonała radę). Warunek: maszyna rusza przed grudniową dostawą. Wykonaj przejście w przód i wstecz po sieci: uzupełnij <b>ES</b> i <b>LS</b>, zaznacz czynności <b>krytyczne</b>, podaj czas projektu i zapas czynności H.</p>
      <svg viewBox="0 0 840 170" style={{ width: '100%', background: '#fff', border: '1.5px solid var(--line-d)' }}>
        {keys.map((a) => gen.acts[a].pre.map((p) => <line key={a + p} x1={POS[p][0] + 44} y1={POS[p][1] + 14} x2={POS[a][0]} y2={POS[a][1] + 14} stroke="#B9B19E" strokeWidth="1.6" markerEnd="url(#arr)" />))}
        <defs><marker id="arr" markerWidth="7" markerHeight="7" refX="6" refY="3" orient="auto"><path d="M0,0 L6,3 L0,6 z" fill="#B9B19E" /></marker></defs>
        {keys.map((a) => <g key={a} onClick={() => togCrit(a)} style={{ cursor: 'pointer' }}>
          <rect x={POS[a][0]} y={POS[a][1]} width="44" height="28" fill={crit.includes(a) ? '#E8A013' : '#E4EBEF'} stroke="#23201B" strokeWidth="1.5" />
          <text x={POS[a][0] + 22} y={POS[a][1] + 18} textAnchor="middle" fontSize="13" fontFamily="var(--f-mono)" fontWeight="600">{a}·{gen.acts[a].d}</text>
        </g>)}
        <text x="6" y="164" fontSize="10.5" fontFamily="var(--f-mono)" fill="#6E675B">kliknij węzeł, aby oznaczyć go jako krytyczny (kolor bursztynowy) · etykieta: czynność·czas [dni]</text>
      </svg>
      <table style={{ width: '100%', marginTop: 8 }}><thead><tr><th>Czynn.</th><th className="l">Opis</th><th>Czas</th><th className="l">Poprzedniki</th><th>ES</th><th>LS</th><th>krytyczna?</th></tr></thead><tbody>
        {keys.map((a) => <tr key={a}>
          <td><b>{a}</b></td><td className="l">{gen.acts[a].name}</td><td>{gen.acts[a].d}</td><td className="l">{gen.acts[a].pre.join(', ') || '—'}</td>
          <td><input className="num" style={{ width: 54 }} value={ES[a] ?? ''} onChange={(e) => setM(ES, setES, a, e.target.value)} /></td>
          <td><input className="num" style={{ width: 54 }} value={LS[a] ?? ''} onChange={(e) => setM(LS, setLS, a, e.target.value)} /></td>
          <td><input type="checkbox" checked={crit.includes(a)} onChange={() => togCrit(a)} /></td>
        </tr>)}
      </tbody></table>
      <p>
        <NumInput label="Czas projektu [dni]" v={T} set={setT} w={70} />
        <NumInput label="Zapas czynności H [dni]" v={sh} set={setSh} w={70} />
        <label className="small" style={{ marginLeft: 8 }}>Którą czynność skracać za 2 000 zł/dzień, by przyspieszyć projekt?{' '}
          <select value={sk} onChange={(e) => setSk(e.target.value)}><option value="">—</option>{keys.map((k) => <option key={k} value={k}>{k}</option>)}</select></label>
      </p>
      <SubmitBar taskId="e3_3" base={base} tid={tid} task={task} compute={compute} />
    </div>
  );
}

/* ------- E3.4 DP ------- */
function TaskE34({ base, tid, task, seed }) {
  const gen = useMemo(() => E.genE34(seed), [seed]);
  const a0 = (task && task.answers) || {};
  const [f, setF] = useState(a0.f || {});
  const [p1, setP1] = useState(a0.p1 || '');
  const [p2, setP2] = useState(a0.p2 || '');
  const [cost, setCost] = useState(a0.cost ?? '');
  const [costEv, setCostEv] = useState(a0.costEvent ?? '');
  const [stage, setStage] = useState(a0.stage || 1);
  const [msg, setMsg] = useState('');
  const setFv = (k, v) => setF(Object.assign({}, f, { [k]: v }));
  const L = (a, b) => gen.legs[a + '|' + b];
  const S3 = ['Karlskrona', 'Ystad', 'Trelleborg'];
  const checkStage = (nodes, next) => {
    const bad = nodes.filter((n) => num(f[n]) !== gen.key.f[n]);
    if (bad.length) setMsg('Sprawdź: ' + bad.join(', ') + '. Zasada Bellmana: f*(węzeł) = min po następnikach [koszt odcinka + f*(następnika)].');
    else { setMsg(''); setStage(next); }
  };
  const compute = () => {
    if (S3.concat(['Gdynia', 'Swinoujscie', 'Tczew']).some((n) => f[n] === undefined || f[n] === '') || !p1 || !p2 || cost === '' || costEv === '') return null;
    const ans = { f: {}, cost: num(cost), path: ['Tczew', p1, p2, 'Sztokholm'].join('-'), costEvent: num(costEv), p1, p2, stage: 4 };
    Object.keys(f).forEach((k) => { ans.f[k] = num(f[k]); });
    const r = E.valE34(gen, ans);
    return { score: r.score, feedback: r.feedback, answers: ans };
  };
  return (
    <div>
      <p>Cotygodniowy tir do Sztokholmu: Tczew → port polski → port szwedzki → Sztokholm. Szulc wybiera „najtańszy pierwszy odcinek". Ty policz <b>indukcją wsteczną</b>: od Sztokholmu do Tczewa. Etapy odsłaniają się po poprawnym wypełnieniu poprzedniego.</p>
      <DataTable head={['Odcinek', 'zł', 'Odcinek', 'zł', 'Odcinek', 'zł']} rows={[
        ['Tczew–Gdynia', L('Tczew', 'Gdynia'), 'Gdynia–Karlskrona', L('Gdynia', 'Karlskrona'), 'Karlskrona–Sztokholm', L('Karlskrona', 'Sztokholm')],
        ['Tczew–Świnoujście', L('Tczew', 'Swinoujscie'), 'Gdynia–Ystad', L('Gdynia', 'Ystad'), 'Ystad–Sztokholm', L('Ystad', 'Sztokholm')],
        ['', '', 'Świnoujście–Ystad', L('Swinoujscie', 'Ystad'), 'Trelleborg–Sztokholm', L('Trelleborg', 'Sztokholm')],
        ['', '', 'Świnoujście–Trelleborg', L('Swinoujscie', 'Trelleborg'), '', '']
      ]} />
      <div className="panel steel">
        <h4>Etap 1 · porty szwedzkie → Sztokholm</h4>
        {S3.map((n) => <NumInput key={n} label={'f*(' + n + ') [zł]'} v={f[n] ?? ''} set={(x) => setFv(n, x)} w={90} />)}
        {stage === 1 && <button className="bsm" onClick={() => checkStage(S3, 2)}>Sprawdź etap 1</button>}
      </div>
      {stage >= 2 && <div className="panel steel">
        <h4>Etap 2 · porty polskie</h4>
        <NumInput label="f*(Gdynia) [zł]" v={f['Gdynia'] ?? ''} set={(x) => setFv('Gdynia', x)} w={90} />
        <NumInput label="f*(Świnoujście) [zł]" v={f['Swinoujscie'] ?? ''} set={(x) => setFv('Swinoujscie', x)} w={90} />
        {stage === 2 && <button className="bsm" onClick={() => checkStage(['Gdynia', 'Swinoujscie'], 3)}>Sprawdź etap 2</button>}
      </div>}
      {stage >= 3 && <div className="panel steel">
        <h4>Etap 3 · Tczew i trasa optymalna</h4>
        <NumInput label="f*(Tczew) = koszt trasy [zł]" v={f['Tczew'] ?? ''} set={(x) => setFv('Tczew', x)} w={90} />
        <label className="small" style={{ marginRight: 10 }}>Port polski:{' '}
          <select value={p1} onChange={(e) => setP1(e.target.value)}><option value="">—</option><option value="Gdynia">Gdynia</option><option value="Swinoujscie">Świnoujście</option></select></label>
        <label className="small">Port szwedzki:{' '}
          <select value={p2} onChange={(e) => setP2(e.target.value)}><option value="">—</option>{S3.map((s) => <option key={s}>{s}</option>)}</select></label>
        <NumInput label="Koszt trasy [zł]" v={cost} set={setCost} w={90} />
        {stage === 3 && <button className="bsm" onClick={() => { if (num(f['Tczew']) === gen.key.f['Tczew']) { setMsg(''); setStage(4); } else setMsg('f*(Tczew) jeszcze się nie zgadza — porównaj obie gałęzie.'); }}>Sprawdź etap 3</button>}
      </div>}
      {stage >= 4 && <div className="evbanner">⚠ PROM ODWOŁANY<div className="body">Sztorm: połączenia z Gdyni zawieszone. Przelicz optimum bez węzła Gdynia (dwie trasy mogą wyjść równoważne — obie są dobre).
        <div style={{ marginTop: 6 }}><NumInput label="Koszt trasy awaryjnej [zł]" v={costEv} set={setCostEv} w={90} /></div></div></div>}
      {msg && <p style={{ color: 'var(--bad)' }}>{msg}</p>}
      {stage >= 4 && <SubmitBar taskId="e3_4" base={base} tid={tid} task={task} compute={compute} />}
    </div>
  );
}

/* ------- E4.1 dashboard HR ------- */
function TaskE41({ base, tid, task, seed }) {
  const gen = useMemo(() => E.genE41(seed), [seed]);
  const [dz, setDz] = useState('lakiernia');
  const a0 = (task && task.answers) || {};
  const [v, setV] = useState({ absZaklad: a0.absZaklad ?? '', absLak: a0.absLak ?? '', rotPak: a0.rotPak ?? '', diagLak: a0.diagLak || '', diagPak: a0.diagPak || '' });
  const set = (k, x) => setV(Object.assign({}, v, { [k]: x }));
  const compute = () => {
    if (v.absZaklad === '' || v.absLak === '' || v.rotPak === '' || !v.diagLak || !v.diagPak) return null;
    const ans = { absZaklad: num(v.absZaklad), absLak: num(v.absLak), rotPak: num(v.rotPak), diagLak: v.diagLak, diagPak: v.diagPak };
    const r = E.valE41(gen, ans);
    return { score: r.score, feedback: r.feedback, answers: ans };
  };
  const mAll = gen.dzialy.map((d) => gen.abs[d].reduce((s, x) => s + x, 0) / 12);
  const avgZak = gen.dzialy.reduce((s, d, i) => s + mAll[i] * gen.emp[d], 0) / Object.values(gen.emp).reduce((a, b) => a + b, 0);
  const MIES = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'];
  return (
    <div>
      <p>Pierwszy w historii FALI dashboard kadrowy. Zbadaj absencję i rotację po działach, policz wskaźniki <b>roczne</b> i postaw diagnozę.</p>
      <p><label className="small">Dział:{' '}
        <select value={dz} onChange={(e) => setDz(e.target.value)}>{gen.dzialy.map((d) => <option key={d} value={d}>{d} ({gen.emp[d]} os.)</option>)}</select></label></p>
      <svg viewBox="0 0 680 170" style={{ width: '100%', maxWidth: 680, background: '#fff', border: '1.5px solid var(--line-d)' }}>
        {gen.abs[dz].map((x, i) => <g key={i}>
          <rect x={30 + i * 53} y={150 - x * 8.4} width="34" height={x * 8.4} fill="#33566B" opacity="0.85" />
          <text x={47 + i * 53} y={146 - x * 8.4} textAnchor="middle" fontSize="10" fontFamily="var(--f-mono)">{x}</text>
          <text x={47 + i * 53} y={164} textAnchor="middle" fontSize="10" fontFamily="var(--f-mono)" fill="#6E675B">{MIES[i]}</text>
        </g>)}
        <line x1="26" y1={150 - avgZak * 8.4} x2="670" y2={150 - avgZak * 8.4} stroke="#E8A013" strokeWidth="2" strokeDasharray="5 4" />
        <text x="560" y={144 - avgZak * 8.4} fontSize="10.5" fontFamily="var(--f-mono)" fill="#C4880D">średnia zakładu</text>
        <text x="6" y="14" fontSize="11" fontFamily="var(--f-mono)">Absencja [%] · {dz} · 12 miesięcy</text>
      </svg>
      <DataTable head={['Dział', 'Zatrudnienie', 'Odejścia w roku']} rows={gen.dzialy.map((d) => [d, gen.emp[d], gen.odejscia[d]])} />
      <p>
        <NumInput label="Wsk. absencji — zakład (śr. ważona) [%]" v={v.absZaklad} set={(x) => set('absZaklad', x)} w={90} />
        <NumInput label="Wsk. absencji — lakiernia [%]" v={v.absLak} set={(x) => set('absLak', x)} w={90} />
        <NumInput label="Wsk. rotacji — pakowanie [%]" v={v.rotPak} set={(x) => set('rotPak', x)} w={90} />
      </p>
      <p className="small"><b>Diagnoza — lakiernia:</b></p>
      {[['A', 'Sezonowe przeziębienia — zima swoje robi, przejdzie samo.'],
        ['B', 'Warunki pracy i kumulacja nadgodzin — trend rośnie od czerwca, spójnie z wrześniowym śledztwem (1.3).'],
        ['C', 'Symulanci — zaostrzyć kontrolę zwolnień lekarskich.']].map(([k, t]) => (
        <label key={k} style={{ display: 'block', margin: '3px 0' }}><input type="radio" name="dlak" checked={v.diagLak === k} onChange={() => set('diagLak', k)} /> <b>{k}.</b> {t}</label>
      ))}
      <p className="small"><b>Diagnoza — pakowanie:</b></p>
      {[['A', 'Złe kierowanie brygadą — wymienić brygadzistę.'],
        ['B', 'Monotonia — wprowadzić rotację między stanowiskami.'],
        ['C', 'Płace poniżej rynku lokalnego — ludzie odchodzą do handlu za rogiem.']].map(([k, t]) => (
        <label key={k} style={{ display: 'block', margin: '3px 0' }}><input type="radio" name="dpak" checked={v.diagPak === k} onChange={() => set('diagPak', k)} /> <b>{k}.</b> {t}</label>
      ))}
      <SubmitBar taskId="e4_1" base={base} tid={tid} task={task} compute={compute} />
    </div>
  );
}

/* ------- E4.2 chronometraż ------- */
function TaskE42({ base, tid, task, seed }) {
  const gen = useMemo(() => E.genE42(seed), [seed]);
  const a0 = (task && task.answers) || {};
  const [v, setV] = useState({ tj: a0.tj ?? '', tn: a0.tn ?? '', norma: a0.norma ?? '', odstajace: a0.odstajace || '' });
  const set = (k, x) => setV(Object.assign({}, v, { [k]: x }));
  const compute = () => {
    if (v.tj === '' || v.tn === '' || v.norma === '' || !v.odstajace) return null;
    const ans = { tj: num(v.tj), tn: num(v.tn), norma: num(v.norma), odstajace: v.odstajace };
    const r = E.valE42(gen, ans);
    return { score: r.score, feedback: r.feedback, answers: ans };
  };
  return (
    <div>
      <p>Mazur: „Normy są z sufitu". Sprawdzamy: 10 pomiarów montażu szuflady u pana Zenka. Obowiązująca norma zakładowa: <b>{gen.staraNorma} szt./h</b> („pisał ją poeta").</p>
      <DataTable head={['Pomiar', 1, 2, 3, 4, 5, 6, 7, 8, 9, 10]} rows={[['Czas cyklu [min]', ...gen.obs]]} />
      <DataTable head={['Współczynnik tempa', 'Narzuty (odpoczynek + potrzeby + organizacyjne)']} rows={[[gen.tempo + '%', gen.narzuty + '%']]} />
      <p>
        <NumInput label="Czas średni t̄ [min]" v={v.tj} set={(x) => set('tj', x)} w={90} />
        <NumInput label="Czas normatywny [min]" v={v.tn} set={(x) => set('tn', x)} w={90} />
        <NumInput label="Norma [szt./h]" v={v.norma} set={(x) => set('norma', x)} w={90} />
      </p>
      <p className="small"><b>Pomiary odstające:</b></p>
      {[['A', 'Odrzucić najwyższy i najniższy pomiar — zawsze tak się robi.'],
        ['B', 'Brak podstaw do eliminacji — rozstęp pomiarów jest niewielki.'],
        ['C', 'Odrzucić wszystkie pomiary powyżej średniej.']].map(([k, t]) => (
        <label key={k} style={{ display: 'block', margin: '3px 0' }}><input type="radio" name="od42" checked={v.odstajace === k} onChange={() => set('odstajace', k)} /> <b>{k}.</b> {t}</label>
      ))}
      <p className="small">Czas normatywny = czas średni × współczynnik tempa × (1 + narzuty). Urealniona norma wejdzie do etatyzacji i do negocjacji z Mazurem.</p>
      <SubmitBar taskId="e4_2" base={base} tid={tid} task={task} compute={compute} />
    </div>
  );
}

/* ------- E4.3 etatyzacja ------- */
function TaskE43({ base, tid, task, seed, team }) {
  const g41 = useMemo(() => E.genE41(seed), [seed]);
  const gen = useMemo(() => E.genE43(seed, g41.key.absZaklad), [seed]);
  const shift2 = team.sim && team.sim.e2 && team.sim.e2.flags && team.sim.e2.flags.shift2;
  const a0 = (task && task.answers) || {};
  const [v, setV] = useState({ fundusz: a0.fundusz ?? '', etaty: a0.etaty ?? '', decyzja: a0.decyzja || '' });
  const set = (k, x) => setV(Object.assign({}, v, { [k]: x }));
  const compute = () => {
    if (v.fundusz === '' || v.etaty === '' || !v.decyzja) return null;
    const ans = { fundusz: num(v.fundusz), etaty: num(v.etaty), decyzja: v.decyzja };
    const r = E.valE43(gen, ans);
    return { score: r.score, feedback: r.feedback, answers: ans };
  };
  return (
    <div>
      <p>Ilu ludzi naprawdę potrzeba w pakowaniu przy wolumenie kontraktu? Policz <b>efektywny fundusz czasu</b> jednego etatu i <b>etatyzację</b> (pracochłonność / fundusz, zaokrąglana w górę).</p>
      <DataTable head={['Parametr', 'Wartość']} rows={[
        ['Wolumen roczny', fmt(gen.vol) + ' szt.'],
        ['Norma', gen.minSzt + ' min/szt.'],
        ['Dni robocze w roku', gen.dni],
        ['Urlop', gen.urlop + ' dni'],
        ['Absencja (z dashboardu HR)', gen.absPct + '% nominalnego'],
        ['Zatrudnienie obecne', gen.obecnie + ' osoby']
      ]} />
      <p>
        <NumInput label="Fundusz efektywny [h/etat/rok]" v={v.fundusz} set={(x) => set('fundusz', x)} w={100} />
        <NumInput label="Etaty (w górę)" v={v.etaty} set={(x) => set('etaty', x)} w={70} />
      </p>
      {shift2 && <div className="hintbox">Uruchomiliście II zmianę na okleiniarce — do obsadzenia są 2 stanowiska operatora. Przesunięcie z pakowania (po przeszkoleniu) rozwiązuje dwa problemy naraz.</div>}
      <p className="small"><b>Decyzja wobec nadwyżki etatów:</b></p>
      {[['A', 'Przesunięcie do przeszkolenia na operatora okleiniarki (koszt szkolenia, klimat w górę).'],
        ['B', 'Zwolnienie (oszczędność ok. 5 200 zł/mies., klimat mocno w dół — tydzień przed strajkiem).']].map(([k, t]) => (
        <label key={k} style={{ display: 'block', margin: '3px 0' }}><input type="radio" name="d43" checked={v.decyzja === k} onChange={() => set('decyzja', k)} /> <b>{k}.</b> {t}</label>
      ))}
      <p className="small">Beata, cicho: „Zwolnienie teraz to zapałka nad beczką prochu. Ale decyzja należy do Was — obie policzone poprawnie dostają punkty."</p>
      <SubmitBar taskId="e4_3" base={base} tid={tid} task={task} compute={compute} />
    </div>
  );
}

/* ------- E4.4 VSM ------- */
function TaskE44({ base, tid, task, seed }) {
  const gen = useMemo(() => E.genE44(seed), [seed]);
  const shuffled = useMemo(() => {
    const rng = E.makeRng(seed + ':e44sh');
    const a = gen.steps.map((s) => s.id);
    for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rng.f() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
    return a;
  }, [seed]);
  const a0 = (task && task.answers) || {};
  const [order, setOrder] = useState(a0.order || shuffled);
  const [chosen, setChosen] = useState(a0.chosen || []);
  const [pb, setPb] = useState(a0.pceBefore ?? '');
  const [pa, setPa] = useState(a0.pceAfter ?? '');
  const move = (i, d) => { const j = i + d; if (j < 0 || j >= order.length) return; const n = order.slice(); [n[i], n[j]] = [n[j], n[i]]; setOrder(n); };
  const tog = (id) => setChosen(chosen.includes(id) ? chosen.filter((x) => x !== id) : chosen.length < 2 ? chosen.concat([id]) : chosen);
  const orderOk = order.join(',') === gen.steps.map((s) => s.id).join(',');
  const byId = {}; gen.steps.forEach((s) => { byId[s.id] = s; });
  const compute = () => {
    if (pb === '' || pa === '' || chosen.length !== 2) return null;
    const ans = { orderOk, order, chosen, pceBefore: num(pb), pceAfter: num(pa) };
    const r = E.valE44(gen, ans);
    return { score: r.score, feedback: r.feedback, answers: ans, extras: { after: r.after } };
  };
  return (
    <div>
      <p>NORDIKA pyta, czemu realizacja zamówienia trwa tydzień. Zmapuj strumień wartości: <b>(1)</b> ułóż kroki procesu we właściwej kolejności, <b>(2)</b> policz PCE = czas przetwarzania / czas przejścia, <b>(3)</b> wybierz <b>dokładnie 2 usprawnienia</b> i policz PCE „po".</p>
      <table style={{ width: '100%' }}><thead><tr><th>#</th><th className="l">Krok procesu</th><th>Praca [h]</th><th>Czekanie [h]</th><th></th></tr></thead><tbody>
        {order.map((id, i) => <tr key={id} style={orderOk ? { background: 'var(--ok-l)' } : null}>
          <td>{i + 1}</td><td className="l">{byId[id].name}</td><td>{byId[id].touch}</td><td>{byId[id].wait}</td>
          <td><button className="bsm b2" onClick={() => move(i, -1)}>▲</button> <button className="bsm b2" onClick={() => move(i, 1)}>▼</button></td>
        </tr>)}
      </tbody></table>
      <p className="small">{orderOk ? '✓ Kolejność procesu poprawna.' : 'Ułóż kroki tak, jak płynie zamówienie (od przyjęcia do wysyłki).'}</p>
      <p><NumInput label="PCE przed [%]" v={pb} set={setPb} w={80} /></p>
      <h4>Usprawnienia (wybierz 2)</h4>
      <div className="npcgrid">
        {gen.improvements.map((im) => <div key={im.id} className={'tagcard' + (chosen.includes(im.id) ? ' sel' : '')} onClick={() => tog(im.id)}>
          <div className="tt">{im.name}</div><div className="small">Efekt: {im.effect} · koszt: {fmt(im.cost)} zł</div>
        </div>)}
      </div>
      <p><NumInput label="PCE po wybranych usprawnieniach [%]" v={pa} set={setPa} w={80} /></p>
      <SubmitBar taskId="e4_4" base={base} tid={tid} task={task} compute={compute} />
    </div>
  );
}

/* ------- E4.5 UMEWAP ------- */
function TaskE45({ base, tid, task }) {
  const U = K.umewap;
  const a0 = (task && task.answers) || {};
  const [krok, setKrok] = useState(1);
  const [rank, setRank] = useState(a0.rank || U.jobs.map((j) => j.id));
  const [job, setJob] = useState(U.jobs[0].id);
  const [levels, setLevels] = useState(a0.levels || {});
  const [kat, setKat] = useState(a0.kategorie || {});
  const [anom, setAnom] = useState(a0.anomalie || []);
  const [kor, setKor] = useState(a0.korekty || {});
  const moveR = (i, d) => { const j = i + d; if (j < 0 || j >= rank.length) return; const n = rank.slice(); [n[i], n[j]] = [n[j], n[i]]; setRank(n); };
  const setLv = (j, s, v) => setLevels(Object.assign({}, levels, { [j]: Object.assign({}, levels[j], { [s]: Number(v) }) }));
  const togA = (j) => setAnom(anom.includes(j) ? anom.filter((x) => x !== j) : anom.length < 2 ? anom.concat([j]) : anom);
  const jobName = (id) => U.jobs.find((x) => x.id === id).name;
  const total = (j) => E.umewapTotal(U.scale, levels[j] || {});
  const rated = (j) => U.scale.every((c) => c.sub.every((s) => (levels[j] || {})[s.id]));
  const allRated = U.jobs.every((j) => rated(j.id));
  const budzetUsed = Object.values(kor).reduce((s, x) => s + num(x), 0);
  const compute = () => {
    if (!allRated || U.jobs.some((j) => !kat[j.id]) || anom.length !== 2) return null;
    const korN = {}; Object.keys(kor).forEach((k) => { korN[k] = num(kor[k]); });
    const ans = { levels, kategorie: kat, anomalie: anom, korekty: korN, rank };
    const r = E.valE45(U, ans);
    return { score: r.score, feedback: r.feedback, answers: ans };
  };
  return (
    <div>
      <p>Warunek Mazura: „pokażcie, że płace mają logikę". Trzy kroki: <b>ranking intuicyjny</b> (metoda rangowa) → <b>karty ocen {U.etykieta}</b> → <b>taryfikator i korekty</b> w budżecie {fmt(U.budzet)} zł/mies.</p>
      <div className="tabs">
        {[1, 2, 3].map((k) => <button key={k} className={krok === k ? 'on' : ''} onClick={() => setKrok(k)}>Krok {k}: {['Ranking', 'Karty ocen', 'Taryfikator'][k - 1]}</button>)}
      </div>
      {krok === 1 && <div>
        <p className="small">Rozgrzewka (metoda rangowa): uszereguj stanowiska intuicyjnie od najbardziej do najmniej wartościowego dla firmy. Gra zapamięta ranking i porówna go potem z punktacją.</p>
        <table><tbody>{rank.map((id, i) => <tr key={id}><td>{i + 1}</td><td className="l" style={{ minWidth: 220 }}>{jobName(id)}</td>
          <td><button className="bsm b2" onClick={() => moveR(i, -1)}>▲</button> <button className="bsm b2" onClick={() => moveR(i, 1)}>▼</button></td></tr>)}</tbody></table>
        <button className="bsm" onClick={() => setKrok(2)} style={{ marginTop: 8 }}>Dalej: karty ocen ▸</button>
      </div>}
      {krok === 2 && <div>
        <p><label className="small">Stanowisko:{' '}
          <select value={job} onChange={(e) => setJob(e.target.value)}>{U.jobs.map((j) => <option key={j.id} value={j.id}>{j.name}{rated(j.id) ? ' ✓' : ''}</option>)}</select></label>
          <span className="badge">suma: {total(job)} / 240 pkt</span>
          <span className="small" style={{ marginLeft: 10 }}>ocenione: {U.jobs.filter((j) => rated(j.id)).length}/6</span></p>
        <p className="small">{U.jobs.find((j) => j.id === job).opis}</p>
        {U.scale.map((c) => <div key={c.id}>
          <h4>{c.id}. {c.name}</h4>
          <table style={{ width: '100%' }}><tbody>
            {c.sub.map((s) => <tr key={s.id}>
              <td className="l" style={{ width: '45%' }}>{s.id} · {s.name}</td>
              <td className="l"><select value={(levels[job] || {})[s.id] || ''} onChange={(e) => setLv(job, s.id, e.target.value)}>
                <option value="">—</option>{s.pts.map((p, i) => <option key={i} value={i + 1}>{i + 1} · {U.poziomy[i]} ({p} pkt)</option>)}
              </select></td>
            </tr>)}
          </tbody></table>
        </div>)}
        <button className="bsm" onClick={() => setKrok(3)} disabled={!allRated} style={{ marginTop: 8 }}>{allRated ? 'Dalej: taryfikator ▸' : 'Oceń wszystkie stanowiska, aby przejść dalej'}</button>
      </div>}
      {krok === 3 && <div>
        <p className="small">Przypisz kategorie wg punktów (siatka poniżej), porównaj płace z widełkami, wskaż <b>dokładnie 2 anomalie</b> i zaproponuj korekty (podwyżki) w budżecie.</p>
        <DataTable head={['Kategoria', ...U.bands.map((b) => b.kat)]} rows={[
          ['od punktów', ...U.bands.map((b) => b.min)],
          ['widełki [zł]', ...U.bands.map((b) => b.w[0] + '–' + b.w[1])]
        ]} />
        <table style={{ width: '100%' }}><thead><tr><th className="l">Stanowisko</th><th>Punkty</th><th>Kategoria</th><th>Widełki</th><th>Płaca</th><th>Anomalia?</th><th>Korekta [zł/mies.]</th></tr></thead><tbody>
          {U.jobs.map((j) => {
            const b = U.bands.find((x) => x.kat === kat[j.id]);
            return <tr key={j.id}>
              <td className="l">{j.name}</td><td>{total(j.id)}</td>
              <td><select value={kat[j.id] || ''} onChange={(e) => setKat(Object.assign({}, kat, { [j.id]: e.target.value }))}>
                <option value="">—</option>{U.bands.map((x) => <option key={x.kat} value={x.kat}>{x.kat}</option>)}</select></td>
              <td>{b ? b.w[0] + '–' + b.w[1] : '—'}</td><td>{fmt(j.pay)}</td>
              <td><input type="checkbox" checked={anom.includes(j.id)} onChange={() => togA(j.id)} /></td>
              <td><input className="num" style={{ width: 72 }} value={kor[j.id] ?? ''} placeholder="0" onChange={(e) => setKor(Object.assign({}, kor, { [j.id]: e.target.value }))} /></td>
            </tr>;
          })}
        </tbody></table>
        <p className="small" style={{ color: budzetUsed > U.budzet ? 'var(--bad)' : 'inherit' }}>Suma korekt: <b>{fmt(budzetUsed)} zł</b> / budżet {fmt(U.budzet)} zł{budzetUsed > U.budzet ? ' — przekroczony!' : ''}</p>
        {task && task.attempts > 0 && <div className="panel steel">
          <h4>Ranking intuicyjny vs punkty</h4>
          <DataTable head={['#', 'Intuicja (krok 1)', 'Punktacja UMEWAP']} rows={rank.map((id, i) => {
            const byPts = U.jobs.slice().sort((a, b) => total(b.id) - total(a.id));
            return [i + 1, jobName(id), byPts[i] ? byPts[i].name + ' (' + total(byPts[i].id) + ')' : ''];
          })} />
          <p className="small">Metoda rangowa daje kolejność bez uzasadnienia; punktowa — uzasadnienie, które można obronić przed Mazurem. Kto u Was awansował po policzeniu?</p>
        </div>}
        <SubmitBar taskId="e4_5" base={base} tid={tid} task={task} compute={compute} label="Przedstaw taryfikator Mazurowi" />
      </div>}
    </div>
  );
}

/* ------- FINAŁ ------- */
function Finale({ base, tid, team }) {
  const sim = team.sim && team.sim.e4;
  if (!sim || !sim.done) return <div className="panel"><p>Trwa symulacja grudnia…</p></div>;
  const strajk = sim.flags.strajk, otif = sim.flags.otifFin;
  const tier = strajk === 0 && otif >= 92 ? 'top' : (strajk === 2 || otif < 85) ? 'low' : 'mid';
  const ep = K.epilogi.find((e) => e.prog === tier);
  const tasks = team.tasks || {};
  return (
    <div>
      <div className="panel amber">
        <h1>Grudzień: dostawa</h1>
        {sim.lines.map((l, i) => <p key={i} className="fb">{l}</p>)}
      </div>
      <div className="panel ok">
        <h2>Epilog: {ep.tytul}</h2>
        <p>{ep.tekst}</p>
      </div>
      <Leaderboard base={base} meId={tid} />
      <div className="panel">
        <h3>Wasze punkty merytoryczne (do oceny)</h3>
        <table style={{ width: '100%' }}><thead><tr><th className="l">Zadanie</th><th>Punkty</th><th>Próby</th></tr></thead><tbody>
          {K.epizody.flatMap((e) => e.zadania).map((z) => {
            const t = tasks[z.id] || {};
            return <tr key={z.id}><td className="l">{z.nazwa}</td><td>{t.score != null ? t.score : '—'}</td><td>{t.attempts || 0}</td></tr>;
          })}
          <tr><td className="l"><b>RAZEM</b></td><td><b>{totalPoints(tasks)}</b> / {TASK_IDS.length * 100}</td><td></td></tr>
        </tbody></table>
        <p className="small">To rozbicie jest też Waszą samooceną przed egzaminem: zadania z niskim wynikiem warto powtórzyć z debriefingów.</p>
      </div>
    </div>
  );
}

/* ================= KONSOLA PROWADZĄCEGO ================= */
const TASK_LABELS = {};
K.epizody.forEach((e) => e.zadania.forEach((z) => { TASK_LABELS[z.id] = z.id.replace('e', '').replace('_', '.'); }));

function ConsoleApp({ code, onExit, onProjector }) {
  const base = 'games/' + code;
  const episode = useStore(base + '/episode');
  const teams = useStore(base + '/teams');
  const events = useStore(base + '/events');
  const [drawer, setDrawer] = useState(null); // {tid, taskId}
  const [keyFor, setKeyFor] = useState(null); // tid
  const setEp = async (n) => {
    const names = ['Poczekalnia', 'Epizod 1 (Wrzesień)', 'Epizod 2 (Październik)', 'Epizod 3 (Listopad)', 'Epizod 4 (Grudzień)', 'FINAŁ (symulacja grudnia)'];
    if (!window.confirm('Przełączyć grę na: ' + names[n] + '?\nPrzejście do przodu uruchomi symulację miesiąca u zespołów.')) return;
    await STORE.set(base + '/episode', n);
  };
  const fire = async (id) => {
    if (!window.confirm('Wywołać zdarzenie u wszystkich zespołów?')) return;
    await STORE.set(base + '/events/' + id, Date.now());
  };
  const exportCsv = () => {
    const rows = [];
    const head = ['Zespół'];
    TASK_IDS.forEach((id) => { head.push(TASK_LABELS[id] + ' pkt', TASK_LABELS[id] + ' próby'); });
    head.push('RAZEM', 'Maks.', 'Propozycja składowej 20%', 'Wynik firmy', 'Gotówka', 'OTIF', 'Koszt jedn.', 'Klimat');
    rows.push(head);
    const kpis = {}; Object.keys(teams || {}).forEach((t) => { kpis[t] = Object.assign({}, K.kpiStart, teams[t].kpi); });
    const wyn = E.wynikFirmy(kpis);
    Object.keys(teams || {}).forEach((tid) => {
      const t = teams[tid], tk = t.tasks || {};
      const r = [t.name];
      TASK_IDS.forEach((id) => { r.push((tk[id] || {}).score != null ? tk[id].score : '', (tk[id] || {}).attempts || 0); });
      const tot = totalPoints(tk), max = TASK_IDS.length * 100;
      r.push(tot, max, Math.round(tot / max * 200) / 10, wyn[tid], kpis[tid].cash, kpis[tid].otif, kpis[tid].unitCost, kpis[tid].climate);
      rows.push(r);
    });
    const csv = '\ufeff' + rows.map((r) => r.map((c) => '"' + String(c).replace(/"/g, '""') + '"').join(';')).join('\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    a.download = 'KONTRAKT_wyniki_' + code + '.csv';
    a.click();
  };
  const ep = K.epizody.find((e) => e.nr === episode);
  return (
    <div>
      <div className="board"><div className="in">
        <div><div className="logo">KON<em>TRAKT</em> · KONSOLA</div><div className="tag">kod gry: {code} · zespołów: {teams ? Object.keys(teams).length : 0}</div></div>
        <div className="kpis">
          <button className="bsm" onClick={onProjector}>Widok projektora</button>
          <button className="bsm b2" onClick={exportCsv}>Eksport CSV</button>
          <button className="bsm b2" onClick={onExit}>Wyjdź</button>
        </div>
      </div></div>
      <div className="wrap">
        <div className="panel amber">
          <h3>Sterowanie epizodami</h3>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {['Poczekalnia', 'E1 Wrzesień', 'E2 Październik', 'E3 Listopad', 'E4 Grudzień', 'FINAŁ'].map((n, i) => (
              <button key={i} className={episode === i ? '' : 'b2'} onClick={() => setEp(i)}>{n}</button>
            ))}
          </div>
          <p className="small">Przejście do kolejnego epizodu uruchamia u zespołów symulację zakończonego miesiąca (KPI). Zespoły w tym samym epizodzie pracują we własnym tempie.</p>
        </div>
        <div className="panel">
          <h3>Zdarzenia opcjonalne</h3>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {K.zdarzeniaOpcjonalne.map((z) => (
              <button key={z.id} className="b2 bsm" disabled={events && events[z.id]} onClick={() => fire(z.id)} title={z.efekt}>{events && events[z.id] ? '✓ ' : ''}{z.nazwa}</button>
            ))}
          </div>
          <p className="small">{K.zdarzeniaOpcjonalne.map((z) => z.nazwa + ': ' + z.efekt).join(' · ')}</p>
        </div>
        <div className="panel">
          <h3>Zespoły × zadania <span className="small">(kliknij komórkę, aby zobaczyć odpowiedzi i skorygować punkty)</span></h3>
          <div style={{ overflowX: 'auto' }}>
            <table className="mx" style={{ width: '100%' }}>
              <thead><tr><th className="l">Zespół</th>{TASK_IDS.map((id) => <th key={id}>{TASK_LABELS[id]}</th>)}<th>Σ</th><th>KPI</th><th></th></tr></thead>
              <tbody>
                {teams && Object.keys(teams).map((tid) => {
                  const t = teams[tid], tk = t.tasks || {}, kpi = Object.assign({}, K.kpiStart, t.kpi);
                  return <tr key={tid}>
                    <td className="l"><b>{t.name}</b></td>
                    {TASK_IDS.map((id) => {
                      const x = tk[id];
                      const cls = !x ? 'sw' : x.score >= 60 ? 's100' : x.score > 0 ? 's60' : 's0';
                      return <td key={id} className={cls} style={{ cursor: 'pointer' }} onClick={() => setDrawer({ tid, taskId: id })}>
                        {x ? x.score + (x.overridden ? '*' : '') : '·'}
                      </td>;
                    })}
                    <td><b>{totalPoints(tk)}</b></td>
                    <td className="l" style={{ fontFamily: 'var(--f-mono)', fontSize: '.7rem' }}>{fmt(kpi.cash)} zł · {kpi.otif}% · {kpi.climate}</td>
                    <td><button className="bsm b3" onClick={() => setKeyFor(tid)}>Klucz</button></td>
                  </tr>;
                })}
              </tbody>
            </table>
          </div>
        </div>
        {ep && <div className="panel steel">
          <h3>Debriefing — {ep.tytul}</h3>
          {ep.debrief.map((d, i) => <p key={i} className="fb">{d}</p>)}
        </div>}
        {drawer && teams && <AnswerDrawer base={base} teams={teams} drawer={drawer} onClose={() => setDrawer(null)} />}
        {keyFor && teams && <KeyView team={teams[keyFor]} tid={keyFor} onClose={() => setKeyFor(null)} />}
      </div>
    </div>
  );
}

function AnswerDrawer({ base, teams, drawer, onClose }) {
  const t = teams[drawer.tid], x = (t.tasks || {})[drawer.taskId];
  const [ov, setOv] = useState('');
  const [note, setNote] = useState('');
  const save = async () => {
    if (ov === '') return;
    await STORE.update(base + '/teams/' + drawer.tid + '/tasks/' + drawer.taskId, { score: Math.max(0, Math.min(100, num(ov))), overridden: true, note });
    onClose();
  };
  return (
    <div className="panel amber">
      <h3>{t.name} · zadanie {TASK_LABELS[drawer.taskId]} <button className="bsm b2 right" onClick={onClose} style={{ float: 'right' }}>Zamknij ✕</button></h3>
      {!x && <p className="small">Zespół jeszcze nie zatwierdził odpowiedzi.</p>}
      {x && <div>
        <p className="small">Punkty: <b>{x.score}</b> (surowe: {x.raw}) · próby: {x.attempts} · {x.locked ? 'zamknięte' : 'otwarte'}{x.overridden ? ' · skorygowane ręcznie (' + (x.note || '') + ')' : ''}</p>
        {x.feedback && x.feedback.map((f, i) => <p key={i} className="fb">{f}</p>)}
        <details><summary className="small">Surowe odpowiedzi (JSON)</summary>
          <pre className="mono" style={{ fontSize: '.72rem', whiteSpace: 'pre-wrap', background: '#fff', padding: 8, border: '1px solid var(--line-d)' }}>{JSON.stringify(x.answers, null, 1)}</pre>
        </details>
      </div>}
      <p>
        <NumInput label="Korekta punktów (0–100)" v={ov} set={setOv} w={80} />
        <label className="small">Notatka: <input value={note} onChange={(e) => setNote(e.target.value)} style={{ width: 220 }} /></label>{' '}
        <button className="bsm" onClick={save}>Zapisz korektę</button>
      </p>
    </div>
  );
}

/* ------- KLUCZ ROZWIĄZAŃ per zespół ------- */
function KeyView({ team, tid, onClose }) {
  const seed = team.seed;
  const f = team.tasks && team.tasks.e1_2 && team.tasks.e1_2.answers;
  const F1 = Math.max(50, num(f && f.fc[0][0]) || 400), F2 = Math.max(50, num(f && f.fc[0][1]) || 400);
  const flags = Object.assign({}, team.sim && team.sim.e1 && team.sim.e1.flags, team.sim && team.sim.e2 && team.sim.e2.flags);
  const g11 = useMemo(() => {
    const rng = E.makeRng(seed + ':e11');
    const idx = K.problemyPula.map((_, i) => i);
    for (let i = idx.length - 1; i > 0; i--) { const j = Math.floor(rng.f() * (i + 1)); [idx[i], idx[j]] = [idx[j], idx[i]]; }
    return idx.slice(0, 12).map((i) => K.problemyPula[i]);
  }, [seed]);
  const G = useMemo(() => {
    const g41x = E.genE41(seed);
    const g22x = E.genE22(seed);
    return {
      g12: E.genE12(seed), g13: E.genE13(seed), g14: E.genE14(seed, F1, F2), g15: E.genE15(seed),
      g21: E.genE21(seed), g22: g22x, g23: E.genE23(seed), g24: E.genE24(seed), g25: E.genE25(seed),
      g31: E.genE31(seed), g32: E.genE32(seed, flags), g33: E.genE33(seed), g34: E.genE34(seed),
      g41: g41x, g42: E.genE42(seed), g43: E.genE43(seed, g41x.key.absZaklad), g44: E.genE44(seed),
      asg22: E.lbFeasible3(g22x.times, g22x.prec, g22x.CT)
    };
  }, [seed, F1, F2, JSON.stringify(flags)]);
  const { g12, g13, g14, g15, g21, g22, g23, g24, g25, g31, g32, g33, g34, g41, g42, g43, g44, asg22 } = G;
  const U = K.umewap;
  const S = ({ t, children }) => <div style={{ marginBottom: 10 }}><h4>{t}</h4>{children}</div>;
  const on = (name) => K.obszary.find((o) => o.id === name) || K.metody.find((o) => o.id === name);
  return (
    <div className="panel bad">
      <h3>KLUCZ ROZWIĄZAŃ · {team.name} <span className="small mono">(ziarno: {seed})</span> <button className="bsm b2" onClick={onClose} style={{ float: 'right' }}>Zamknij ✕</button></h3>
      <p className="small">Tylko dla prowadzącego. Klucz liczony na żywo z ziarna zespołu (dla 1.4 i 3.2 — z uwzględnieniem odpowiedzi/symulacji zespołu).</p>
      <div className="grid2">
        <S t="1.1 Klasyfikacja (wylosowane problemy)">{g11.map((p, i) => <p key={i} className="small">{i + 1}. {p.t} → <b>{on(p.obszar).nazwa}</b> / <b>{on(p.metoda).nazwa}</b></p>)}</S>
        <S t="1.2 Prognozy — MAPE walidacji (szafa/komoda/regał)">
          <p className="small mono">MA3: {g12.key.map((k) => k.mapeMA3).join(' / ')}% · ES: {g12.key.map((k) => k.mapeES).join(' / ')}% · Trend: {g12.key.map((k) => k.mapeTrend).join(' / ')}%</p>
          <p className="small mono">Realizacja mies. 25–27: szafa {g12.future[0].join(', ')} · komoda {g12.future[1].join(', ')} · regał {g12.future[2].join(', ')}</p>
        </S>
        <S t="1.3 ANOVA + regresja"><p className="small mono">F = {g13.key.F} (F kryt = {g13.key.Fcrit}) · b = {g13.key.b} · R² = {g13.key.r2} · wniosek C</p></S>
        <S t={'1.4 MRP (MPS z prognozy zespołu: F1=' + F1 + ', F2=' + F2 + ')'}>
          <p className="small mono">MPS: {g14.mps.join(', ')}</p>
          <p className="small mono">Płyta — uruchomienia: {g14.keyP.porel.join(', ')}</p>
          <p className="small mono">Okucia — uruchomienia: {g14.keyO.porel.join(', ')}</p>
        </S>
        <S t="1.5 Odchylenia"><p className="small mono">ilościowe: {g15.key.odchI} zł · cenowe: {g15.key.odchC} zł</p></S>
        <S t="2.1 OEE"><p className="small mono">piła {g21.machines.pila.oee}% · okleiniarka {g21.machines.okleiniarka.oee}% · wiertarka {g21.machines.wiertarka.oee}% · gardło: okleiniarka</p></S>
        <S t="2.2 Balansowanie (przykład wykonalny, 3 stanowiska)">
          <p className="small mono">{asg22 ? [0, 1, 2].map((s) => 'S' + (s + 1) + ': ' + Object.keys(asg22).filter((k) => asg22[k] === s).join(',')).join(' · ') : '—'} · eff 3 st.: {(g22.total / (3 * g22.CT) * 100).toFixed(1)}%</p>
        </S>
        <S t="2.3 LP"><p className="small mono">S={g23.key.x[0]}, K={g23.key.x[1]}, R={g23.key.x[2]} · marża {fmt(g23.key.z)} zł · wiąże okleiniarka · dual {g23.key.dualOkl} zł/h · decyzja B</p></S>
        <S t="2.4 Johnson"><p className="small mono">kolejność: {g24.key.seq.join('–')} · makespan {g24.key.ms} h (FIFO: {g24.key.fifo} h) · reguła Johnsona</p></S>
        <S t="2.5 CRP"><p className="small mono">H={g25.H} h · nadgodziny {fmt(g25.key.costOT)} zł · kooperacja {fmt(g25.key.costCoop)} zł · II zmiana {fmt(g25.key.costShift)} zł · najtaniej: nadgodziny</p></S>
        <S t="3.1 Transport">
          <p className="small mono">NW: {fmt(g31.key.nw)} zł · najmn. koszt: {fmt(g31.key.lc)} zł · optimum: {fmt(g31.key.opt)} zł</p>
          <p className="small mono">alokacja opt.: {g31.key.optAlloc.map((r) => '[' + r.join(',') + ']').join(' ')}</p>
        </S>
        <S t="3.2 Scorecard"><p className="small mono">OTIF {g32.key.otif}% · koszt/m³ {g32.key.kosztM3} zł · wykorzystanie {g32.key.wykorzystanie}%</p></S>
        <S t="3.3 CPM">
          <p className="small mono">T = {g33.key.T} dni · krytyczne: {g33.key.critical.join('–')} · zapas H = {g33.key.slack.H}</p>
          <p className="small mono">ES: {Object.keys(g33.acts).map((a) => a + '=' + g33.key.ES[a]).join(' ')}</p>
          <p className="small mono">LS: {Object.keys(g33.acts).map((a) => a + '=' + g33.key.LS[a]).join(' ')}</p>
        </S>
        <S t="3.4 DP">
          <p className="small mono">f*: {['Karlskrona', 'Ystad', 'Trelleborg', 'Gdynia', 'Swinoujscie', 'Tczew'].map((n) => n + '=' + g34.key.f[n]).join(' · ')}</p>
          <p className="small mono">trasa: {g34.key.path.join('–')} ({fmt(g34.key.cost)} zł) · po zdarzeniu: {fmt(g34.keyEvent.cost)} zł</p>
        </S>
        <S t="4.1 Dashboard"><p className="small mono">absencja zakład {g41.key.absZaklad}% · lakiernia {g41.key.absLakiernia}% · rotacja pakowania {g41.key.rotPak}% · diagnozy: B / C</p></S>
        <S t="4.2 Chronometraż"><p className="small mono">t̄ = {g42.key.tj} min · t_norm = {g42.key.tn} min · norma {g42.key.norma} szt./h · odstające: B</p></S>
        <S t="4.3 Etatyzacja"><p className="small mono">fundusz {fmt(g43.key.fundusz)} h · {g43.key.etatyDokl} → {g43.key.etaty} etaty</p></S>
        <S t="4.4 VSM"><p className="small mono">LT {g44.key.LT} h · PT {g44.key.PT} h · PCE {g44.key.PCE}% (po usprawnieniach zależnie od wyboru — walidator liczy z wybranej pary)</p></S>
        <S t="4.5 UMEWAP (sumy eksperckie)">
          {U.jobs.map((j) => { const tt = E.umewapTotal(U.scale, U.expertKey[j.id]); return <p key={j.id} className="small mono">{j.name}: {tt} pkt → kat. {E.umewapCat(U.bands, tt)}</p>; })}
          <p className="small mono">anomalie: planistka (niedopłacona), magazynier (przepłacony)</p>
        </S>
      </div>
    </div>
  );
}

/* ------- PROJEKTOR ------- */
function ProjectorView({ code, onBack }) {
  const base = 'games/' + code;
  const episode = useStore(base + '/episode');
  const ep = K.epizody.find((e) => e.nr === episode);
  return (
    <div className="wrap projector">
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 20, marginTop: 20 }}>
        <h1>KON<span style={{ color: 'var(--amber)' }}>TRAKT</span></h1>
        <h2 style={{ color: 'var(--muted)' }}>{episode >= 5 ? 'FINAŁ' : ep ? 'Epizod ' + ep.nr + ': ' + ep.tytul + ' · ' + ep.miesiac : 'Poczekalnia'}</h2>
        <button className="bsm b2 right" onClick={onBack}>◂ konsola</button>
      </div>
      <Leaderboard base={base} big />
      {ep && <div className="panel steel"><h3>Debriefing — {ep.tytul}</h3>{ep.debrief.map((d, i) => <p key={i} className="fb" style={{ fontSize: '1.05rem' }}>{d}</p>)}</div>}
    </div>
  );
}

/* ================= START ================= */
ReactDOM.createRoot(document.getElementById('root')).render(<App />);
