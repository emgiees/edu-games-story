/* KONTRAKT - silniki obliczeniowe (generatory, rozwiazania wzorcowe, walidacja, symulacja KPI)
   Czysty JS, dziala w przegladarce i w node (testy). */
(function (root) {
  'use strict';
  const E = {};

  /* ---------- PRNG ---------- */
  function xmur3(str) {
    let h = 1779033703 ^ str.length;
    for (let i = 0; i < str.length; i++) {
      h = Math.imul(h ^ str.charCodeAt(i), 3432918353);
      h = (h << 13) | (h >>> 19);
    }
    return function () {
      h = Math.imul(h ^ (h >>> 16), 2246822507);
      h = Math.imul(h ^ (h >>> 13), 3266489909);
      return (h ^= h >>> 16) >>> 0;
    };
  }
  function mulberry32(a) {
    return function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  E.makeRng = function (seedStr) {
    const r = mulberry32(xmur3(String(seedStr))());
    return {
      f: () => r(),
      int: (a, b) => a + Math.floor(r() * (b - a + 1)),
      pick: (arr) => arr[Math.floor(r() * arr.length)],
      norm: function () { // Box-Muller
        let u = 0, v = 0;
        while (u === 0) u = r();
        while (v === 0) v = r();
        return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
      }
    };
  };
  const r2 = (x) => Math.round(x * 100) / 100;
  const r1 = (x) => Math.round(x * 10) / 10;
  E.r2 = r2; E.r1 = r1;
  const sum = (a) => a.reduce((s, x) => s + x, 0);
  const mean = (a) => sum(a) / a.length;
  E.sum = sum; E.mean = mean;

  /* ---------- statystyka ---------- */
  E.ols = function (x, y) {
    const n = x.length, mx = mean(x), my = mean(y);
    let sxy = 0, sxx = 0, syy = 0;
    for (let i = 0; i < n; i++) { sxy += (x[i] - mx) * (y[i] - my); sxx += (x[i] - mx) ** 2; syy += (y[i] - my) ** 2; }
    const b = sxy / sxx, a = my - b * mx;
    const r2v = syy === 0 ? 0 : (sxy * sxy) / (sxx * syy);
    return { a, b, r2: r2v };
  };
  E.anova1 = function (groups) { // rowne liczebnosci
    const k = groups.length, n = groups[0].length, N = k * n;
    const all = groups.flat(), gm = mean(all);
    let ssb = 0, ssw = 0;
    groups.forEach((g) => {
      const m = mean(g);
      ssb += n * (m - gm) ** 2;
      g.forEach((x) => { ssw += (x - m) ** 2; });
    });
    const dfb = k - 1, dfw = N - k;
    const F = (ssb / dfb) / (ssw / dfw);
    return { F, dfb, dfw, ssb, ssw };
  };
  E.FCRIT_2_21 = 3.4668; // alfa 0.05

  /* ---------- prognozowanie ---------- */
  // prognozy jednokrokowe dla indeksow start..end (0-based), na bazie danych do t-1
  E.fcMA3 = function (s, t) { return (s[t - 1] + s[t - 2] + s[t - 3]) / 3; };
  E.fcES = function (s, t, alpha) {
    let L = s[0];
    for (let i = 1; i < t; i++) L = alpha * s[i] + (1 - alpha) * L;
    return L;
  };
  E.fcTrend = function (s, t) { // dopasowanie do danych 0..t-1, prognoza na t
    const x = [], y = [];
    for (let i = 0; i < t; i++) { x.push(i + 1); y.push(s[i]); }
    const f = E.ols(x, y);
    return f.a + f.b * (t + 1);
  };
  E.backtestMAPE = function (s, method, alpha) {
    // miesiace 19..24 (indeksy 18..23)
    let e = 0, n = 0;
    for (let t = 18; t <= 23; t++) {
      let f;
      if (method === 'MA3') f = E.fcMA3(s, t);
      else if (method === 'ES') f = E.fcES(s, t, alpha || 0.3);
      else f = E.fcTrend(s, t);
      e += Math.abs(s[t] - f) / s[t]; n++;
    }
    return (e / n) * 100;
  };
  E.mape = function (real, fc) {
    let e = 0;
    for (let i = 0; i < real.length; i++) e += Math.abs(real[i] - fc[i]) / real[i];
    return (e / real.length) * 100;
  };

  /* ---------- MRP ---------- */
  E.mrp = function (gir, oh, ss, sr, lt, lot) { // lot: null=L4L, inaczej wielokrotnosc
    const n = gir.length, nr = Array(n).fill(0), porec = Array(n).fill(0), porel = Array(n).fill(0), poh = Array(n).fill(0);
    let prev = oh, late = false;
    for (let t = 0; t < n; t++) {
      const avail = prev + sr[t];
      const net = gir[t] + ss - avail;
      if (net > 0) {
        nr[t] = net;
        porec[t] = lot ? Math.ceil(net / lot) * lot : net;
      }
      prev = avail + porec[t] - gir[t];
      poh[t] = prev;
    }
    for (let t = 0; t < n; t++) if (porec[t] > 0) {
      if (t - lt >= 0) porel[t - lt] += porec[t]; else { porel[0] += porec[t]; late = true; }
    }
    return { gir, sr, nr, porec, porel, poh, late };
  };

  /* ---------- LP: enumeracja wierzcholkow (3 zmienne) ---------- */
  function solve3(M, v) { // Gauss 3x3
    const A = M.map((r) => r.slice()), b = v.slice();
    for (let c = 0; c < 3; c++) {
      let p = c;
      for (let r = c + 1; r < 3; r++) if (Math.abs(A[r][c]) > Math.abs(A[p][c])) p = r;
      if (Math.abs(A[p][c]) < 1e-10) return null;
      [A[c], A[p]] = [A[p], A[c]]; [b[c], b[p]] = [b[p], b[c]];
      for (let r = 0; r < 3; r++) if (r !== c) {
        const f = A[r][c] / A[c][c];
        for (let k = c; k < 3; k++) A[r][k] -= f * A[c][k];
        b[r] -= f * b[c];
      }
    }
    return [b[0] / A[0][0], b[1] / A[1][1], b[2] / A[2][2]];
  }
  E.lp3 = function (c, A, b, ub) {
    // max c.x, A x <= b, 0 <= x <= ub
    const G = [], h = [];
    A.forEach((row, i) => { G.push(row.slice()); h.push(b[i]); });
    for (let i = 0; i < 3; i++) { const g = [0, 0, 0]; g[i] = 1; G.push(g); h.push(ub[i]); }
    for (let i = 0; i < 3; i++) { const g = [0, 0, 0]; g[i] = -1; G.push(g); h.push(0); }
    let best = null;
    const n = G.length;
    for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) for (let k = j + 1; k < n; k++) {
      const x = solve3([G[i], G[j], G[k]], [h[i], h[j], h[k]]);
      if (!x) continue;
      let feas = true;
      for (let m = 0; m < n; m++) {
        let lhs = G[m][0] * x[0] + G[m][1] * x[1] + G[m][2] * x[2];
        if (lhs > h[m] + 1e-6) { feas = false; break; }
      }
      if (!feas) continue;
      const z = c[0] * x[0] + c[1] * x[1] + c[2] * x[2];
      if (!best || z > best.z + 1e-9) best = { x: x.map((v) => Math.round(v * 1e6) / 1e6), z };
    }
    return best;
  };
  E.lp3dual = function (c, A, b, ub, which, idx) {
    const base = E.lp3(c, A, b, ub);
    const b2 = b.slice(), ub2 = ub.slice();
    if (which === 'row') b2[idx] += 1; else ub2[idx] += 1;
    const pert = E.lp3(c, A, b2, ub2);
    return pert.z - base.z;
  };
  E.lp3unique = function (c, A, b, ub) {
    const base = E.lp3(c, A, b, ub);
    for (let i = 0; i < 3; i++) for (const s of [1, -1]) {
      const c2 = c.slice(); c2[i] += s * 1e-4;
      const p = E.lp3(c2, A, b, ub);
      if (Math.abs(p.x[0] - base.x[0]) + Math.abs(p.x[1] - base.x[1]) + Math.abs(p.x[2] - base.x[2]) > 0.5) return false;
    }
    return true;
  };

  /* ---------- zagadnienie transportowe ---------- */
  E.nwCorner = function (supply, demand) {
    const s = supply.slice(), d = demand.slice(), m = s.length, n = d.length;
    const A = Array.from({ length: m }, () => Array(n).fill(0));
    let i = 0, j = 0;
    while (i < m && j < n) {
      const q = Math.min(s[i], d[j]);
      A[i][j] = q; s[i] -= q; d[j] -= q;
      if (s[i] === 0 && i < m - 1) i++;
      else if (d[j] === 0) j++;
      else i++;
    }
    return A;
  };
  E.leastCost = function (supply, demand, C) {
    const s = supply.slice(), d = demand.slice(), m = s.length, n = d.length;
    const A = Array.from({ length: m }, () => Array(n).fill(0));
    while (sum(s) > 0) {
      let bi = -1, bj = -1, bc = Infinity;
      for (let i = 0; i < m; i++) for (let j = 0; j < n; j++) {
        if (s[i] > 0 && d[j] > 0 && C[i][j] < bc) { bc = C[i][j]; bi = i; bj = j; } // remis: mniejszy wiersz, potem kolumna
      }
      const q = Math.min(s[bi], d[bj]);
      A[bi][bj] = q; s[bi] -= q; d[bj] -= q;
    }
    return A;
  };
  E.tCost = function (A, C) {
    let c = 0;
    for (let i = 0; i < A.length; i++) for (let j = 0; j < A[0].length; j++) c += A[i][j] * C[i][j];
    return c;
  };
  E.modi = function (supply, demand, C, startAlloc) {
    const m = supply.length, n = demand.length;
    const A = startAlloc.map((r) => r.slice());
    let basis = [];
    for (let i = 0; i < m; i++) for (let j = 0; j < n; j++) if (A[i][j] > 0) basis.push([i, j]);
    // uzupelnienie zdegenerowanej bazy do drzewa rozpinajacego (m+n-1)
    const parent = Array(m + n).fill(0).map((_, i) => i);
    const find = (x) => (parent[x] === x ? x : (parent[x] = find(parent[x])));
    const uni = (a, b) => { parent[find(a)] = find(b); };
    basis.forEach(([i, j]) => uni(i, m + j));
    while (basis.length < m + n - 1) {
      let best = null;
      for (let i = 0; i < m; i++) for (let j = 0; j < n; j++) {
        if (find(i) !== find(m + j) && (!best || C[i][j] < best.c)) best = { i, j, c: C[i][j] };
      }
      basis.push([best.i, best.j]); uni(best.i, m + best.j);
    }
    const inBasis = () => {
      const S = new Set(); basis.forEach(([i, j]) => S.add(i + ',' + j)); return S;
    };
    for (let iter = 0; iter < 80; iter++) {
      // potencjaly u,v
      const u = Array(m).fill(null), v = Array(n).fill(null);
      u[0] = 0;
      let changed = true;
      while (changed) {
        changed = false;
        basis.forEach(([i, j]) => {
          if (u[i] !== null && v[j] === null) { v[j] = C[i][j] - u[i]; changed = true; }
          if (v[j] !== null && u[i] === null) { u[i] = C[i][j] - v[j]; changed = true; }
        });
      }
      // najbardziej ujemny koszt zredukowany
      let ei = -1, ej = -1, ec = -1e-9;
      const S = inBasis();
      for (let i = 0; i < m; i++) for (let j = 0; j < n; j++) {
        if (S.has(i + ',' + j)) continue;
        const rc = C[i][j] - u[i] - v[j];
        if (rc < ec) { ec = rc; ei = i; ej = j; }
      }
      if (ei < 0) return { alloc: A, cost: E.tCost(A, C), optimal: true, iters: iter };
      // cykl: DFS po komorkach bazy + wchodzaca, naprzemiennie wiersz/kolumna
      const cells = basis.concat([[ei, ej]]);
      const path = [[ei, ej]];
      function dfs(ci, cj, dir) { // dir: 'row' => nastepny ruch w tym samym wierszu
        const cand = cells.filter(([x, y]) => (dir === 'row' ? x === ci && y !== cj : y === cj && x !== ci));
        for (const [x, y] of cand) {
          if (path.some(([a, b]) => a === x && b === y) && !(x === ei && y === ej)) continue;
          path.push([x, y]);
          if (x === ei && y === ej) {
            if (path.length >= 5 && path.length % 2 === 1) return true; // cykl parzysty domkniety
            path.pop(); continue;
          }
          if (dfs(x, y, dir === 'row' ? 'col' : 'row')) return true;
          path.pop();
        }
        return false;
      }
      dfs(ei, ej, 'row');
      if (path.length > 1 && path[path.length - 1][0] === ei && path[path.length - 1][1] === ej) path.pop(); // usun duplikat startu
      // pozycje nieparzyste (1,3,...) traca
      let theta = Infinity, drop = null;
      for (let k = 1; k < path.length; k += 2) {
        const [i, j] = path[k];
        if (A[i][j] < theta) { theta = A[i][j]; drop = k; }
      }
      for (let k = 0; k < path.length; k++) {
        const [i, j] = path[k];
        A[i][j] += (k % 2 === 0 ? theta : -theta);
      }
      const [di, dj] = path[drop];
      basis = basis.filter(([i, j]) => !(i === di && j === dj));
      basis.push([ei, ej]);
    }
    return { alloc: A, cost: E.tCost(A, C), optimal: false, iters: 80 };
  };
  E.transportOpt = function (supply, demand, C) {
    const start = E.leastCost(supply, demand, C);
    return E.modi(supply, demand, C, start);
  };

  /* ---------- Johnson ---------- */
  E.johnson = function (jobs) { // jobs: {name:[t1,t2]}
    const front = [], back = [], items = Object.assign({}, jobs);
    while (Object.keys(items).length) {
      let bk = null, bv = Infinity;
      Object.keys(items).forEach((k) => { const mn = Math.min(items[k][0], items[k][1]); if (mn < bv) { bv = mn; bk = k; } });
      if (items[bk][0] <= items[bk][1]) front.push(bk); else back.unshift(bk);
      delete items[bk];
    }
    return front.concat(back);
  };
  E.makespan = function (seq, jobs) {
    let t1 = 0, t2 = 0;
    seq.forEach((j) => { t1 += jobs[j][0]; t2 = Math.max(t2, t1) + jobs[j][1]; });
    return t2;
  };
  E.bestMakespan = function (jobs) {
    const keys = Object.keys(jobs);
    let best = Infinity;
    const perm = (arr, cur) => {
      if (!arr.length) { best = Math.min(best, E.makespan(cur, jobs)); return; }
      for (let i = 0; i < arr.length; i++) perm(arr.slice(0, i).concat(arr.slice(i + 1)), cur.concat([arr[i]]));
    };
    perm(keys, []);
    return best;
  };

  /* ---------- CPM ---------- */
  E.cpm = function (acts) { // {A:{d,pre:[]}}
    const keys = Object.keys(acts), ES = {}, EF = {}, LS = {}, LF = {};
    const calc = (a) => {
      if (EF[a] !== undefined) return EF[a];
      ES[a] = Math.max(0, ...acts[a].pre.map(calc));
      EF[a] = ES[a] + acts[a].d;
      return EF[a];
    };
    keys.forEach(calc);
    const T = Math.max(...Object.values(EF));
    const succ = {};
    keys.forEach((a) => { succ[a] = keys.filter((s) => acts[s].pre.includes(a)); });
    const back = (a) => {
      if (LS[a] !== undefined) return LS[a];
      LF[a] = succ[a].length ? Math.min(...succ[a].map(back)) : T;
      LS[a] = LF[a] - acts[a].d;
      return LS[a];
    };
    keys.forEach(back);
    const slack = {}, critical = [];
    keys.forEach((a) => { slack[a] = LS[a] - ES[a]; if (slack[a] === 0) critical.push(a); });
    return { T, ES, EF, LS, LF, slack, critical };
  };

  /* ---------- DP etapowe ---------- */
  E.dpStages = function (stages, legs) { // stages: [['Tczew'],['Gdynia','Swin'],[...],['Sztokholm']]
    const f = {}, nxt = {};
    const goal = stages[stages.length - 1][0];
    f[goal] = 0;
    for (let s = stages.length - 2; s >= 0; s--) {
      stages[s].forEach((node) => {
        let bv = Infinity, bn = null;
        stages[s + 1].forEach((m) => {
          const c = legs[node + '|' + m];
          if (c !== undefined && c + f[m] < bv) { bv = c + f[m]; bn = m; }
        });
        f[node] = bv; nxt[node] = bn;
      });
    }
    const path = [stages[0][0]];
    while (path[path.length - 1] !== goal) path.push(nxt[path[path.length - 1]]);
    return { f, path, cost: f[stages[0][0]] };
  };

  /* ---------- balansowanie linii ---------- */
  E.lbCheck = function (times, prec, assign, CT) { // assign: {task: stationIdx}
    const viol = [];
    Object.keys(prec).forEach((t) => prec[t].forEach((p) => {
      if (assign[p] !== undefined && assign[t] !== undefined && assign[p] > assign[t]) viol.push(p + '->' + t);
    }));
    const nS = Math.max(...Object.values(assign)) + 1;
    const loads = Array(nS).fill(0);
    Object.keys(assign).forEach((t) => { loads[assign[t]] += times[t]; });
    const over = loads.some((l) => l > CT);
    const total = sum(Object.values(times));
    return { violations: viol, loads, over, nStations: nS, eff: total / (nS * CT) * 100, feasible: viol.length === 0 && !over && Object.keys(assign).length === Object.keys(times).length };
  };
  E.lbFeasible3 = function (times, prec, CT) { // brute 3^9
    const keys = Object.keys(times), n = keys.length;
    const total = Math.pow(3, n);
    for (let mask = 0; mask < total; mask++) {
      let m = mask; const asg = {};
      for (let i = 0; i < n; i++) { asg[keys[i]] = m % 3; m = Math.floor(m / 3); }
      const ck = E.lbCheck(times, prec, asg, CT);
      if (ck.feasible && ck.nStations === 3) return asg;
    }
    return null;
  };

  /* =========================================================
     GENERATORY ZADAN (deterministyczne per seed, z warunkami jakosci)
     ========================================================= */
  const PRODUCTS = ['szafa PAK-3D', 'komoda KOM-2', 'regal REG-5'];
  E.PRODUCTS = PRODUCTS;

  E.genE12 = function (seed) {
    const rng = E.makeRng(seed + ':e12');
    const seas = [0.94, 0.92, 0.96, 1.0, 1.02, 0.98, 0.9, 0.92, 1.05, 1.1, 1.15, 1.06]; // pik jesienny
    const prods = PRODUCTS.map(() => ({
      a: rng.int(300, 500), b: rng.int(2, 6), sig: 0.05,
    }));
    const series = prods.map((p, pi) => {
      const s = [];
      for (let t = 1; t <= 27; t++) {
        const base = (p.a + p.b * t) * seas[(t - 1) % 12];
        const noise = 1 + p.sig * E.makeRng(seed + ':n' + pi + ':' + t).norm();
        s.push(Math.max(50, Math.round(base * noise)));
      }
      return s;
    });
    const hist = series.map((s) => s.slice(0, 24));
    const future = series.map((s) => s.slice(24)); // realizacja mies. 25-27 (deterministyczna)
    const key = hist.map((s) => ({
      mapeMA3: r1(E.backtestMAPE(s, 'MA3')),
      mapeES: r1(E.backtestMAPE(s, 'ES', 0.3)),
      mapeTrend: r1(E.backtestMAPE(s, 'Trend')),
    }));
    return { hist, future, key, seas };
  };
  E.valE12 = function (gen, ans) {
    // ans: {method:'MA3|ES|Trend', mape: number (szafa), fc: [[3],[3],[3]]}
    const fb = [];
    let pts = 0;
    const km = gen.key[0]['mape' + ans.method];
    if (Math.abs(ans.mape - km) <= 0.5) { pts += 40; fb.push('MAPE walidacji wstecznej (szafa) zgodne z kluczem: +40'); }
    else fb.push('MAPE walidacji wstecznej dla metody ' + ans.method + ' (szafa) wg klucza: ' + km + '% (podano ' + ans.mape + '%): +0');
    const real = gen.future.flat();
    const fc = ans.fc.flat();
    const mp = E.mape(real, fc);
    let expPts = 0;
    if (mp <= 4) expPts = 60; else if (mp >= 20) expPts = 0; else expPts = Math.round(60 * (20 - mp) / 16);
    pts += expPts;
    fb.push('MAPE ex post prognoz (3 produkty x 3 mies.): ' + r1(mp) + '% -> +' + expPts);
    return { score: pts, feedback: fb, exPostMape: r1(mp) };
  };

  E.genE13 = function (seed) {
    const rng = E.makeRng(seed + ':e13');
    const base = 2.0 + rng.f() * 0.6;
    const beta = 0.07 + rng.f() * 0.03;
    const extra3 = 0.5 + rng.f() * 0.4;
    const rows = []; // {zmiana, tydzien, nadgodziny, braki}
    for (let z = 1; z <= 3; z++) for (let w = 1; w <= 8; w++) {
      const ot = z === 3 ? 8 + rng.f() * 8 : 2 + rng.f() * 6;
      const braki = base + beta * ot + (z === 3 ? extra3 : 0) + 0.15 * rng.norm();
      rows.push({ z, w, ot: r1(ot), braki: r2(Math.max(0.5, braki)) });
    }
    const groups = [1, 2, 3].map((z) => rows.filter((r) => r.z === z).map((r) => r.braki));
    const an = E.anova1(groups);
    const reg = E.ols(rows.map((r) => r.ot), rows.map((r) => r.braki));
    return { rows, key: { F: r2(an.F), Fcrit: E.FCRIT_2_21, b: Math.round(reg.b * 1000) / 1000, r2: r2(reg.r2) } };
  };
  E.valE13 = function (gen, ans) {
    let pts = 0; const fb = [];
    if (Math.abs(ans.F - gen.key.F) <= 0.05) { pts += 30; fb.push('F zgodne: +30'); } else fb.push('F wg klucza: ' + gen.key.F + ': +0');
    if (Math.abs(ans.b - gen.key.b) <= Math.abs(gen.key.b) * 0.10) { pts += 30; fb.push('współczynnik b zgodny: +30'); } else fb.push('b wg klucza: ' + gen.key.b + ': +0');
    if (Math.abs(ans.r2 - gen.key.r2) <= 0.03) { pts += 30; fb.push('R2 zgodne: +30'); } else fb.push('R2 wg klucza: ' + gen.key.r2 + ': +0');
    if (ans.wniosek === 'C') { pts += 10; fb.push('wniosek: +10'); } else fb.push('wniosek: rekomendacja to limit nadgodzin z monitoringiem zmiany 3: +0');
    return { score: pts, feedback: fb };
  };

  E.mpsFromForecast = function (F1, F2) {
    const r = Math.round;
    return [0, 0, r(0.15 * F1), r(0.15 * F1), r(0.20 * F1), r(0.20 * F1), r(0.25 * F2), r(0.25 * F2)];
  };
  E.genE14 = function (seed, F1, F2) {
    const rng = E.makeRng(seed + ':e14');
    const mps = E.mpsFromForecast(F1, F2);
    let p = {}, o = {};
    for (let tries = 0; tries < 200; tries++) {
      p = { per: 4, oh: rng.pick([140, 160, 180, 200, 220]), ss: 50, lt: 2, lot: rng.pick([50, 100, 150]) };
      o = { per: 1, oh: rng.int(3, 6) * 10, ss: 0, srWeek: 2, srQty: rng.int(8, 12) * 10, lt: rng.pick([2, 3, 4]) };
      const girP = mps.map((x) => x * p.per);
      const srO = [0, 0, 0, 0, 0, 0, 0, 0]; srO[o.srWeek - 1] = o.srQty;
      const kp = E.mrp(girP, p.oh, p.ss, [0, 0, 0, 0, 0, 0, 0, 0], p.lt, p.lot);
      const ko = E.mrp(mps, o.oh, o.ss, srO, o.lt, null);
      if (!kp.late && !ko.late) return { mps, p, o, keyP: kp, keyO: ko };
    }
    // fallback kanoniczny
    p = { per: 4, oh: 180, ss: 50, lt: 2, lot: 100 };
    o = { per: 1, oh: 40, ss: 0, srWeek: 2, srQty: 100, lt: 3 };
    const girP = mps.map((x) => x * 4);
    const srO = [0, 100, 0, 0, 0, 0, 0, 0];
    return { mps, p, o, keyP: E.mrp(girP, p.oh, p.ss, [0, 0, 0, 0, 0, 0, 0, 0], 2, 100), keyO: E.mrp(mps, o.oh, o.ss, srO, 3, null) };
  };
  E.valE14 = function (gen, ans) {
    // ans: {porelP:[8], porelO:[8]}
    const cmp = (key, got) => {
      let ok = 0, shifted = 0;
      for (let t = 0; t < 8; t++) {
        if (Number(got[t] || 0) === key[t]) ok++;
        else if (t > 0 && Number(got[t] || 0) === key[t - 1] && key[t - 1] > 0) shifted++;
        else if (t < 7 && Number(got[t] || 0) === key[t + 1] && key[t + 1] > 0) shifted++;
      }
      return { ok, shifted };
    };
    const a = cmp(gen.keyP.porel, ans.porelP), b = cmp(gen.keyO.porel, ans.porelO);
    const pts = Math.round((a.ok + b.ok) / 16 * 100);
    const fb = ['Płyta: ' + a.ok + '/8 tygodni zgodnych, okucia: ' + b.ok + '/8.'];
    if (a.shifted + b.shifted >= 3) fb.push('Uwaga: część zamówień przesunięta o 1 tydzień. Sprawdź cykle dostaw (LT): zamówienie dobre, ale za późno lub za wcześnie.');
    return { score: pts, feedback: fb };
  };

  E.genE15 = function (seed) {
    const rng = E.makeRng(seed + ':e15');
    const pStd = rng.int(56, 68), pReal = pStd + rng.int(2, 6);
    const prod = rng.int(25, 35) * 10;
    const qReal = Math.round(4 * prod * (1.03 + rng.f() * 0.05));
    const odchI = (qReal - 4 * prod) * pStd, odchC = (pReal - pStd) * qReal;
    return { pStd, pReal, prod, qStd: 4, qReal, key: { odchI, odchC } };
  };
  E.valE15 = function (gen, ans) {
    let pts = 0; const fb = [];
    if (Math.abs(ans.odchI - gen.key.odchI) <= 1) { pts += 50; fb.push('odchylenie ilościowe: +50'); } else fb.push('odchylenie ilościowe wg klucza: ' + gen.key.odchI + ' zł');
    if (Math.abs(ans.odchC - gen.key.odchC) <= 1) { pts += 50; fb.push('odchylenie cenowe: +50'); } else fb.push('odchylenie cenowe wg klucza: ' + gen.key.odchC + ' zł');
    return { score: pts, feedback: fb };
  };

  E.genE21 = function (seed) {
    const rng = E.makeRng(seed + ':e21');
    const mk = (av, pf, q) => ({ av: r2(av), pf: r2(pf), q: r2(q), oee: r1(av * pf * q * 100) });
    const okl = mk(0.78 + rng.f() * 0.08, 0.74 + rng.f() * 0.08, 0.93 + rng.f() * 0.04);
    const pila = mk(0.86 + rng.f() * 0.06, 0.85 + rng.f() * 0.08, 0.96 + rng.f() * 0.03);
    const wiert = mk(0.84 + rng.f() * 0.08, 0.83 + rng.f() * 0.08, 0.95 + rng.f() * 0.04);
    return { machines: { pila, okleiniarka: okl, wiertarka: wiert } };
  };
  E.valE21 = function (gen, ans) {
    let pts = 0; const fb = [];
    ['pila', 'okleiniarka', 'wiertarka'].forEach((m) => {
      if (Math.abs(ans[m] - gen.machines[m].oee) <= 0.5) { pts += 20; fb.push('OEE ' + m + ': +20'); }
      else fb.push('OEE ' + m + ' wg klucza: ' + gen.machines[m].oee + '%');
    });
    if (ans.gardlo === 'okleiniarka') { pts += 40; fb.push('wąskie gardło: +40'); } else fb.push('wąskie gardło: okleiniarka (najniższe OEE i najwyższe obciążenie)');
    return { score: pts, feedback: fb };
  };

  E.genE22 = function (seed) {
    const rng = E.makeRng(seed + ':e22');
    const base = { a: 120, b: 90, c: 150, d: 60, e: 200, f: 110, g: 180, h: 140, i: 150 };
    const prec = { a: [], b: ['a'], c: ['a'], d: ['b'], e: ['c'], f: ['c'], g: ['e', 'f'], h: ['d', 'g'], i: ['h'] };
    const CT = 480;
    for (let t = 0; t < 60; t++) {
      const times = {};
      Object.keys(base).forEach((k) => { times[k] = Math.round(base[k] * (0.8 + rng.f() * 0.4) / 10) * 10; });
      const total = sum(Object.values(times));
      if (total > 3 * CT || total <= 2 * CT) continue;
      if (Object.values(times).some((v) => v > CT)) continue;
      if (E.lbFeasible3(times, prec, CT)) return { times, prec, CT, total, minS: 3 };
    }
    return { times: base, prec, CT, total: sum(Object.values(base)), minS: 3 };
  };
  E.valE22 = function (gen, assign) {
    const ck = E.lbCheck(gen.times, gen.prec, assign, gen.CT);
    let pts = 0; const fb = [];
    if (ck.feasible && ck.nStations === 3) {
      pts = 70; fb.push('Wykonalny przydział na 3 stanowiskach (minimum teoretyczne): +70');
      const varr = ck.loads.reduce((s, l) => s + (l - mean(ck.loads)) ** 2, 0) / ck.loads.length;
      const bonus = varr <= 2500 ? 30 : varr <= 6400 ? 20 : 10;
      pts += bonus; fb.push('Wygładzenie obciążeń (odch. std ' + Math.round(Math.sqrt(varr)) + ' s): +' + bonus);
    } else if (ck.feasible) {
      pts = 40; fb.push('Przydział wykonalny, ale na ' + ck.nStations + ' stanowiskach; minimum to 3: +40');
    } else {
      fb.push(ck.violations.length ? 'Naruszone poprzedzania: ' + ck.violations.join(', ') : 'Przekroczony takt na stanowisku.');
    }
    return { score: pts, feedback: fb, eff: r1(ck.eff), nStations: ck.nStations };
  };

  E.genE23 = function (seed) {
    const rng = E.makeRng(seed + ':e23');
    const A = [[0.40, 0.30, 0.20], [0.50, 0.40, 0.25], [0.30, 0.35, 0.20]];
    for (let t = 0; t < 300; t++) {
      const c = [Math.round(180 * (0.85 + rng.f() * 0.3)), Math.round(140 * (0.85 + rng.f() * 0.3)), Math.round(95 * (0.85 + rng.f() * 0.3))];
      const b = [Math.round(240 * (0.9 + rng.f() * 0.2)), Math.round(180 * (0.9 + rng.f() * 0.2)), Math.round(210 * (0.9 + rng.f() * 0.2))];
      const ub = [300, 350, 400];
      const sol = E.lp3(c, A, b, ub);
      if (!sol) continue;
      const slackOkl = b[1] - (A[1][0] * sol.x[0] + A[1][1] * sol.x[1] + A[1][2] * sol.x[2]);
      const slackP = b[0] - (A[0][0] * sol.x[0] + A[0][1] * sol.x[1] + A[0][2] * sol.x[2]);
      const slackW = b[2] - (A[2][0] * sol.x[0] + A[2][1] * sol.x[1] + A[2][2] * sol.x[2]);
      if (slackOkl > 1e-6 || slackP < 5 || slackW < 5) continue; // wiaze tylko okleiniarka
      if (sol.x[1] > 0.5) continue; // pointe: komoda = 0
      if (sol.x[0] < 20 || sol.x[2] < 20) continue;
      if (!E.lp3unique(c, A, b, ub)) continue;
      const dualOkl = Math.round(E.lp3dual(c, A, b, ub, 'row', 1));
      const dualR = Math.round(E.lp3dual(c, A, b, ub, 'ub', 2));
      return { c, A, b, ub, key: { x: sol.x.map((v) => Math.round(v)), z: Math.round(sol.z), dualOkl, dualR, binding: 'okleiniarka' } };
    }
    const c = [180, 140, 95], b = [240, 180, 210], ub = [300, 350, 400];
    const sol = E.lp3(c, A, b, ub);
    return { c, A, b, ub, key: { x: sol.x.map((v) => Math.round(v)), z: Math.round(sol.z), dualOkl: Math.round(E.lp3dual(c, A, b, ub, 'row', 1)), dualR: Math.round(E.lp3dual(c, A, b, ub, 'ub', 2)), binding: 'okleiniarka' } };
  };
  E.valE23 = function (gen, ans) {
    let pts = 0; const fb = []; const k = gen.key;
    if (Math.abs(ans.z - k.z) <= k.z * 0.005) { pts += 30; fb.push('marża maksymalna: +30'); } else fb.push('marża wg klucza: ' + k.z + ' zł');
    const dv = Math.abs(ans.S - k.x[0]) + Math.abs(ans.K - k.x[1]) + Math.abs(ans.R - k.x[2]);
    if (dv <= 3) { pts += 30; fb.push('plan produkcji: +30'); } else fb.push('plan wg klucza: S=' + k.x[0] + ', K=' + k.x[1] + ', R=' + k.x[2]);
    if (ans.binding === 'okleiniarka') { pts += 10; fb.push('ograniczenie wiążące: +10'); } else fb.push('wiąże okleiniarka (zerowy luz)');
    if (Math.abs(ans.dual - k.dualOkl) <= 1) { pts += 20; fb.push('cena dualna: +20'); } else fb.push('cena dualna godziny okleiniarki wg klucza: ' + k.dualOkl + ' zl/h');
    if (ans.decyzja === 'B') { pts += 10; fb.push('decyzja wobec Grabowskiego: +10'); }
    else fb.push('każda godzina okleiniarki na komodzie oddaje mniej marży niż na pozostałych produktach; komody wracają po naprawie.');
    return { score: pts, feedback: fb };
  };

  E.genE24 = function (seed) {
    const rng = E.makeRng(seed + ':e24');
    for (let t = 0; t < 200; t++) {
      const jobs = {};
      ['Z1', 'Z2', 'Z3', 'Z4', 'Z5'].forEach((k) => { jobs[k] = [rng.int(2, 9), rng.int(2, 9)]; });
      const seq = E.johnson(jobs);
      const ms = E.makespan(seq, jobs);
      const fifo = E.makespan(['Z1', 'Z2', 'Z3', 'Z4', 'Z5'], jobs);
      if (fifo - ms >= 2 && E.bestMakespan(jobs) === ms) return { jobs, key: { seq, ms, fifo } };
    }
    const jobs = { Z1: [4, 7], Z2: [6, 3], Z3: [2, 8], Z4: [9, 5], Z5: [5, 5] };
    return { jobs, key: { seq: E.johnson(jobs), ms: E.makespan(E.johnson(jobs), jobs), fifo: E.makespan(['Z1', 'Z2', 'Z3', 'Z4', 'Z5'], jobs) } };
  };
  E.valE24 = function (gen, ans) {
    const ms = E.makespan(ans.seq, gen.jobs);
    let pts = 0; const fb = [];
    if (ms === gen.key.ms) { pts += 80; fb.push('makespan optymalny (' + ms + ' h): +80'); }
    else fb.push('osiągnięty makespan ' + ms + ' h; optimum: ' + gen.key.ms + ' h');
    if (ans.rule === 'johnson') { pts += 20; fb.push('reguła Johnsona: +20'); } else fb.push('to reguła Johnsona (min czas na M1 -> początek, na M2 -> koniec)');
    return { score: pts, feedback: fb, ms };
  };

  E.genE25 = function (seed) {
    const rng = E.makeRng(seed + ':e25');
    const H = rng.int(60, 120);
    const stOT = 57, stCoop = 62, shift2 = 18000, otLimit = 144;
    return {
      H, stOT, stCoop, shift2, otLimit,
      key: { costOT: H <= otLimit ? H * stOT : null, costCoop: H * stCoop, costShift: shift2, best: 'OT' }
    };
  };
  E.valE25 = function (gen, ans) {
    let pts = 0; const fb = []; const k = gen.key;
    const near = (a, b) => b !== null && Math.abs(a - b) <= b * 0.02;
    if (near(ans.costOT, k.costOT)) { pts += 20; fb.push('koszt nadgodzin: +20'); } else fb.push('koszt nadgodzin wg klucza: ' + k.costOT + ' zł');
    if (near(ans.costCoop, k.costCoop)) { pts += 20; fb.push('koszt kooperacji: +20'); } else fb.push('koszt kooperacji wg klucza: ' + k.costCoop + ' zł');
    if (Math.abs(ans.costShift - k.costShift) <= 1) { pts += 20; fb.push('koszt II zmiany: +20'); } else fb.push('koszt II zmiany: ' + k.costShift + ' zł (stały)');
    // wybor spojny: akceptujemy kazdy wariant, ale rachunek musi byc poprawny; najtanszy = OT
    const costs = { OT: k.costOT, COOP: k.costCoop, SHIFT: k.costShift };
    if (costs[ans.wybor] !== undefined && pts >= 40) { pts += 40; fb.push('wybór spójny z rachunkiem (' + ans.wybor + '): +40'); }
    else fb.push('wybór punktowany przy poprawnym rachunku kosztów wszystkich opcji');
    return { score: pts, feedback: fb };
  };

  E.genE31 = function (seed) {
    const rng = E.makeRng(seed + ':e31');
    const baseC = [[95, 120, 140, 60], [130, 150, 110, 45], [70, 90, 150, 85]];
    for (let t = 0; t < 300; t++) {
      const C = baseC.map((row) => row.map((c) => Math.max(20, Math.round(c * (0.8 + rng.f() * 0.4) / 5) * 5)));
      const supply = [Math.round(420 * (0.85 + rng.f() * 0.3) / 10) * 10, Math.round(260 * (0.85 + rng.f() * 0.3) / 10) * 10, Math.round(180 * (0.85 + rng.f() * 0.3) / 10) * 10];
      const S = sum(supply);
      const w = [0.35, 0.28, 0.21, 0.16];
      const demand = w.map((x) => Math.round(S * x / 10) * 10);
      demand[3] = S - demand[0] - demand[1] - demand[2];
      if (demand[3] <= 20) continue;
      const nw = E.tCost(E.nwCorner(supply, demand), C);
      const lcA = E.leastCost(supply, demand, C);
      const lc = E.tCost(lcA, C);
      const opt = E.modi(supply, demand, C, lcA);
      if (!opt.optimal) continue;
      if (nw > lc && lc >= opt.cost * 1.01) return { C, supply, demand, key: { nw, lc, opt: opt.cost, optAlloc: opt.alloc } };
    }
    const C = baseC, supply = [420, 260, 180], demand = [300, 240, 180, 140];
    const lcA = E.leastCost(supply, demand, C);
    const opt = E.modi(supply, demand, C, lcA);
    return { C, supply, demand, key: { nw: E.tCost(E.nwCorner(supply, demand), C), lc: E.tCost(lcA, C), opt: opt.cost, optAlloc: opt.alloc } };
  };
  E.valE31 = function (gen, ans) {
    let pts = 0; const fb = []; const k = gen.key;
    if (Math.abs(ans.nw - k.nw) <= 0.5) { pts += 25; fb.push('koszt NW: +25'); } else fb.push('koszt kąta pn.-zach. wg klucza: ' + k.nw + ' zł (reguła remisów: mniejszy wiersz, potem kolumna)');
    if (Math.abs(ans.lc - k.lc) <= 0.5) { pts += 25; fb.push('koszt metody najmniejszego kosztu: +25'); } else fb.push('koszt najmniejszego kosztu wg klucza: ' + k.lc + ' zł');
    if (Math.abs(ans.opt - k.opt) <= 0.5) { pts += 35; fb.push('koszt optymalny: +35'); } else fb.push('optimum wg klucza: ' + k.opt + ' zł');
    // alokacja: przeliczamy koszt i bilanse z wpisanych ilosci (dopuszcza optima alternatywne)
    if (ans.alloc) {
      const m = gen.supply.length, n = gen.demand.length;
      let ok = true, c = 0;
      const rows = Array(m).fill(0), cols = Array(n).fill(0);
      for (let i = 0; i < m; i++) for (let j = 0; j < n; j++) {
        const v = Number(ans.alloc[i][j] || 0);
        if (v < -1e-9) ok = false;
        rows[i] += v; cols[j] += v; c += v * gen.C[i][j];
      }
      for (let i = 0; i < m; i++) if (Math.abs(rows[i] - gen.supply[i]) > 0.5) ok = false;
      for (let j = 0; j < n; j++) if (Math.abs(cols[j] - gen.demand[j]) > 0.5) ok = false;
      if (ok && Math.abs(c - k.opt) <= 0.5) { pts += 15; fb.push('alokacja optymalna (bilanse i koszt): +15'); }
      else fb.push('alokacja: sprawdź bilanse wierszy/kolumn i koszt (' + Math.round(c) + ' zł vs optimum ' + k.opt + ' zł)');
    }
    return { score: pts, feedback: fb };
  };

  E.genE32 = function (seed, flags) {
    const rng = E.makeRng(seed + ':e32');
    const n = 24;
    let late = 2 + (flags && flags.mrpBraki ? 1 : 0) + (flags && flags.johnsonDelay ? 1 : 0);
    late = Math.min(5, late);
    const rows = [];
    for (let i = 0; i < n; i++) {
      const m3 = rng.int(28, 36), cap = 38;
      rows.push({
        nr: i + 1, m3, koszt: m3 * rng.int(52, 68),
        naCzas: i >= late, kompletna: i === 5 && (flags && flags.mrpBraki) ? false : true,
        ladownosc: cap
      });
    }
    const otifCnt = rows.filter((r) => r.naCzas && r.kompletna).length;
    const key = {
      otif: r1(otifCnt / n * 100),
      kosztM3: r2(sum(rows.map((r) => r.koszt)) / sum(rows.map((r) => r.m3))),
      wykorzystanie: r1(sum(rows.map((r) => r.m3)) / sum(rows.map((r) => r.ladownosc)) * 100)
    };
    return { rows, key };
  };
  E.valE32 = function (gen, ans) {
    let pts = 0; const fb = []; const k = gen.key;
    if (Math.abs(ans.otif - k.otif) <= 0.5) { pts += 34; fb.push('OTIF: +34'); } else fb.push('OTIF wg klucza: ' + k.otif + '%');
    if (Math.abs(ans.kosztM3 - k.kosztM3) <= 1) { pts += 33; fb.push('koszt/m3: +33'); } else fb.push('koszt/m3 wg klucza: ' + k.kosztM3 + ' zł');
    if (Math.abs(ans.wyk - k.wykorzystanie) <= 0.5) { pts += 33; fb.push('wykorzystanie ładowności: +33'); } else fb.push('wykorzystanie wg klucza: ' + k.wykorzystanie + '%');
    return { score: pts, feedback: fb };
  };

  const CPM_BASE = {
    A: { d: 2, pre: [], name: 'demontaz starej maszyny' },
    B: { d: 4, pre: ['A'], name: 'prace fundamentowe' },
    C: { d: 6, pre: [], name: 'dostawa nowej maszyny' },
    D: { d: 3, pre: ['B'], name: 'instalacja elektryczna' },
    E: { d: 2, pre: ['B', 'C'], name: 'posadowienie maszyny' },
    F: { d: 2, pre: ['D', 'E'], name: 'podlaczenie mediow' },
    G: { d: 3, pre: ['F'], name: 'kalibracja' },
    H: { d: 4, pre: ['C'], name: 'szkolenie operatorow' },
    I: { d: 2, pre: ['G', 'H'], name: 'testy produkcyjne' },
    J: { d: 1, pre: ['I'], name: 'odbior techniczny' }
  };
  E.genE33 = function (seed) {
    const rng = E.makeRng(seed + ':e33');
    for (let t = 0; t < 200; t++) {
      const acts = {};
      Object.keys(CPM_BASE).forEach((k) => {
        acts[k] = { d: Math.max(1, CPM_BASE[k].d + rng.int(-1, 2)), pre: CPM_BASE[k].pre, name: CPM_BASE[k].name };
      });
      const k = E.cpm(acts);
      const nonCrit = Object.keys(acts).filter((a) => k.slack[a] > 0);
      if (k.T >= 14 && k.T <= 21 && nonCrit.length >= 2 && k.slack.H >= 2 && k.critical.length >= 6) return { acts, key: k };
    }
    return { acts: CPM_BASE, key: E.cpm(CPM_BASE) };
  };
  E.valE33 = function (gen, ans) {
    let pts = 0; const fb = []; const k = gen.key;
    const keys = Object.keys(gen.acts);
    let okES = 0, okLS = 0;
    keys.forEach((a) => {
      if (Number(ans.ES[a]) === k.ES[a]) okES++;
      if (Number(ans.LS[a]) === k.LS[a]) okLS++;
    });
    const tab = Math.round(40 * (okES + okLS) / (2 * keys.length));
    pts += tab; fb.push('tabela ES/LS: ' + (okES + okLS) + '/' + 2 * keys.length + ' pól: +' + tab);
    const critSet = new Set(k.critical);
    const gotSet = new Set(ans.crit || []);
    const critOk = k.critical.every((a) => gotSet.has(a)) && [...gotSet].every((a) => critSet.has(a));
    if (critOk) { pts += 25; fb.push('ścieżka krytyczna: +25'); } else fb.push('ścieżka krytyczna wg klucza: ' + k.critical.join('-'));
    if (Number(ans.T) === k.T && Number(ans.slackH) === k.slack.H) { pts += 20; fb.push('czas projektu i zapas H: +20'); }
    else fb.push('czas: ' + k.T + ' dni, zapas H: ' + k.slack.H);
    if (ans.skracaj && critSet.has(ans.skracaj)) { pts += 15; fb.push('skracanie czynności krytycznej: +15'); }
    else fb.push('skracać opłaca się wyłącznie czynność krytyczną');
    return { score: pts, feedback: fb };
  };

  E.genE34 = function (seed) {
    const rng = E.makeRng(seed + ':e34');
    const stages = [['Tczew'], ['Gdynia', 'Swinoujscie'], ['Karlskrona', 'Ystad', 'Trelleborg'], ['Sztokholm']];
    const base = {
      'Tczew|Gdynia': 180, 'Tczew|Swinoujscie': 320,
      'Gdynia|Karlskrona': 540, 'Gdynia|Ystad': 610,
      'Swinoujscie|Ystad': 380, 'Swinoujscie|Trelleborg': 350,
      'Karlskrona|Sztokholm': 480, 'Ystad|Sztokholm': 560, 'Trelleborg|Sztokholm': 590
    };
    const legs = {};
    Object.keys(base).forEach((k) => { legs[k] = Math.round(base[k] * (0.8 + rng.f() * 0.4) / 10) * 10; });
    const full = E.dpStages(stages, legs);
    const legs2 = {};
    Object.keys(legs).forEach((k) => { if (!k.includes('Gdynia')) legs2[k] = legs[k]; });
    const stages2 = [['Tczew'], ['Swinoujscie'], ['Karlskrona', 'Ystad', 'Trelleborg'], ['Sztokholm']];
    const noGdynia = E.dpStages(stages2, legs2);
    return { stages, legs, key: full, keyEvent: noGdynia };
  };
  E.valE34 = function (gen, ans) {
    let pts = 0; const fb = []; const k = gen.key;
    const nodes = ['Karlskrona', 'Ystad', 'Trelleborg', 'Gdynia', 'Swinoujscie', 'Tczew'];
    let ok = 0;
    nodes.forEach((n) => { if (Number(ans.f[n]) === k.f[n]) ok++; });
    const tp = Math.round(60 * ok / nodes.length);
    pts += tp; fb.push('tabela f*: ' + ok + '/' + nodes.length + ': +' + tp);
    if (Number(ans.cost) === k.cost && ans.path === k.path.join('-')) { pts += 20; fb.push('trasa optymalna: +20'); }
    else fb.push('optimum: ' + k.path.join('-') + ' (' + k.cost + ' zł)');
    if (Number(ans.costEvent) === gen.keyEvent.cost) { pts += 20; fb.push('trasa po odwołaniu promu: +20 (przy remisie tras równe koszty są akceptowane)'); }
    else fb.push('po odwołaniu promu optimum: ' + gen.keyEvent.cost + ' zł');
    return { score: pts, feedback: fb };
  };

  E.genE41 = function (seed) {
    const rng = E.makeRng(seed + ':e41');
    const dzialy = ['montaz', 'lakiernia', 'pakowanie', 'magazyn'];
    const emp = { montaz: 34, lakiernia: 12, pakowanie: 8, magazyn: 6 };
    const abs = {};
    dzialy.forEach((d) => {
      abs[d] = [];
      for (let m = 0; m < 12; m++) {
        let v = 4 + rng.f() * 2;
        if (d === 'lakiernia') v += 3 + (m >= 5 ? (m - 5) * 0.7 : 0) + rng.f() * 1.5;
        abs[d].push(r1(Math.min(16, v)));
      }
    });
    const odejscia = { montaz: rng.int(3, 5), lakiernia: rng.int(1, 2), pakowanie: rng.int(2, 3), magazyn: rng.int(0, 1) };
    const dniNominalne = 251;
    // klucz: wskazniki roczne
    const wAbs = {};
    dzialy.forEach((d) => { wAbs[d] = r1(mean(abs[d])); });
    const totEmp = sum(Object.values(emp));
    const absZaklad = r1(dzialy.reduce((s, d) => s + wAbs[d] * emp[d], 0) / totEmp);
    const rotPak = r1(odejscia.pakowanie / emp.pakowanie * 100);
    const rotZaklad = r1(sum(Object.values(odejscia)) / totEmp * 100);
    return { dzialy, emp, abs, odejscia, dniNominalne, key: { absZaklad, absLakiernia: wAbs.lakiernia, rotPak, rotZaklad } };
  };
  E.valE41 = function (gen, ans) {
    let pts = 0; const fb = []; const k = gen.key;
    if (Math.abs(ans.absZaklad - k.absZaklad) <= 0.3) { pts += 20; fb.push('absencja zakładu: +20'); } else fb.push('absencja zakładu wg klucza: ' + k.absZaklad + '%');
    if (Math.abs(ans.absLak - k.absLakiernia) <= 0.3) { pts += 20; fb.push('absencja lakierni: +20'); } else fb.push('absencja lakierni wg klucza: ' + k.absLakiernia + '%');
    if (Math.abs(ans.rotPak - k.rotPak) <= 0.5) { pts += 20; fb.push('rotacja pakowania: +20'); } else fb.push('rotacja pakowania wg klucza: ' + k.rotPak + '%');
    if (ans.diagLak === 'B' ) { pts += 20; fb.push('diagnoza lakierni: +20'); } else fb.push('lakiernia: warunki pracy + kumulacja nadgodzin (por. E1.3)');
    if (ans.diagPak === 'C') { pts += 20; fb.push('diagnoza pakowania: +20'); } else fb.push('pakowanie: płace poniżej rynku -> rotacja');
    return { score: pts, feedback: fb };
  };

  E.genE42 = function (seed) {
    const rng = E.makeRng(seed + ':e42');
    const base = 4.8 + rng.f() * 0.8;
    const obs = [];
    for (let i = 0; i < 10; i++) obs.push(r1(base + (rng.f() - 0.5) * 0.6));
    const tempo = rng.pick([100, 105, 110]);
    const narzuty = rng.pick([10, 12, 15]);
    const tj = mean(obs);
    const tn = tj * tempo / 100 * (1 + narzuty / 100);
    const norma = 60 / tn;
    const staraNorma = r1(norma * (1.15 + rng.f() * 0.15));
    return { obs, tempo, narzuty, staraNorma, key: { tj: r2(tj), tn: r2(tn), norma: r1(norma) } };
  };
  E.valE42 = function (gen, ans) {
    let pts = 0; const fb = []; const k = gen.key;
    if (Math.abs(ans.tj - k.tj) <= k.tj * 0.01) { pts += 33; fb.push('czas średni: +33'); } else fb.push('t średni wg klucza: ' + k.tj + ' min');
    if (Math.abs(ans.tn - k.tn) <= k.tn * 0.01) { pts += 33; fb.push('czas normatywny: +33'); } else fb.push('t normatywny = t średni x tempo x (1+narzuty) = ' + k.tn + ' min');
    if (Math.abs(ans.norma - k.norma) <= 0.1) { pts += 24; fb.push('norma szt./h: +24'); } else fb.push('norma wg klucza: ' + k.norma + ' szt./h');
    if (ans.odstajace === 'B') { pts += 10; fb.push('pomiary odstające: +10'); } else fb.push('rozstęp pomiarów niewielki, brak podstaw do eliminacji');
    return { score: pts, feedback: fb };
  };

  E.genE43 = function (seed, absZaklad) {
    const rng = E.makeRng(seed + ':e43');
    const vol = rng.int(40, 50) * 1000;
    const minSzt = rng.pick([5, 5.5, 6, 6.5]);
    const absPct = Math.round((absZaklad || 6) * 2) / 2;
    const dni = 251, urlop = 26;
    const praco = vol * minSzt / 60;
    const fundusz = (dni - urlop) * 8 * (1 - absPct / 100);
    const etatyDokl = praco / fundusz;
    return { vol, minSzt, absPct, dni, urlop, obecnie: 4, key: { praco: Math.round(praco), fundusz: Math.round(fundusz), etatyDokl: r2(etatyDokl), etaty: Math.ceil(etatyDokl) } };
  };
  E.valE43 = function (gen, ans) {
    let pts = 0; const fb = []; const k = gen.key;
    if (Math.abs(ans.fundusz - k.fundusz) <= 5) { pts += 35; fb.push('fundusz efektywny: +35'); } else fb.push('fundusz wg klucza: ' + k.fundusz + ' h/etat');
    if (Number(ans.etaty) === k.etaty) { pts += 35; fb.push('etatyzacja: +35'); } else fb.push('etaty wg klucza: ' + k.etatyDokl + ' -> ' + k.etaty);
    if (ans.decyzja === 'A' || ans.decyzja === 'B') { pts += 30; fb.push('decyzja kadrowa podjęta: +30'); }
    return { score: pts, feedback: fb };
  };

  E.genE44 = function (seed) {
    const rng = E.makeRng(seed + ':e44');
    const w1 = Math.round(48 * (0.75 + rng.f() * 0.5) / 2) * 2;
    const w2 = Math.round(24 * (0.75 + rng.f() * 0.5) / 2) * 2;
    const w3 = Math.round(12 * (0.75 + rng.f() * 0.5) / 2) * 2;
    const prodPass = Math.round((72 + rng.int(-12, 12)) / 6) * 6;
    const steps = [
      { id: 's1', name: 'przyjecie zamowienia', touch: 0.25, wait: 0 },
      { id: 's2', name: 'oczekiwanie na planowanie', touch: 0, wait: w1 },
      { id: 's3', name: 'planowanie produkcji', touch: 0.5, wait: 0 },
      { id: 's4', name: 'oczekiwanie na wolna linie', touch: 0, wait: w2 },
      { id: 's5', name: 'produkcja (przejscie)', touch: 6, wait: prodPass - 6 },
      { id: 's6', name: 'kontrola jakosci', touch: 1, wait: 0 },
      { id: 's7', name: 'oczekiwanie na zaladunek', touch: 0, wait: w3 },
      { id: 's8', name: 'zaladunek i wysylka', touch: 2, wait: 0 }
    ];
    const LT = sum(steps.map((s) => s.touch + s.wait));
    const PT = sum(steps.map((s) => s.touch));
    const improvements = [
      { id: 'i1', name: 'planowanie codzienne zamiast tygodniowego', effect: 'w1->12h', cost: 0 },
      { id: 'i2', name: 'elektroniczna awizacja zaladunku', effect: 'w3 -8h (min 2h)', cost: 3000 },
      { id: 'i3', name: 'supermarket komponentow przy linii', effect: 'przejscie produkcji -24h (min 30h)', cost: 9000 },
      { id: 'i4', name: 'drugi kontroler jakosci w szczycie', effect: 'w2 -6h', cost: 4500 }
    ];
    return { steps, improvements, key: { LT: r2(LT), PT: r2(PT), PCE: r1(PT / LT * 100) } };
  };
  E.e44After = function (gen, chosen) {
    const s = gen.steps.map((x) => Object.assign({}, x));
    if (chosen.includes('i1')) s[1].wait = Math.min(s[1].wait, 12);
    if (chosen.includes('i2')) s[6].wait = Math.max(2, s[6].wait - 8);
    if (chosen.includes('i3')) s[4].wait = Math.max(30 - 6, s[4].wait - 24);
    if (chosen.includes('i4')) s[3].wait = Math.max(0, s[3].wait - 6);
    const LT = sum(s.map((x) => x.touch + x.wait));
    const PT = sum(s.map((x) => x.touch));
    return { LT: r2(LT), PT: r2(PT), PCE: r1(PT / LT * 100) };
  };
  E.valE44 = function (gen, ans) {
    let pts = 0; const fb = []; const k = gen.key;
    if (ans.orderOk) { pts += 20; fb.push('mapa procesu w poprawnej kolejności: +20'); }
    if (Math.abs(ans.pceBefore - k.PCE) <= 0.3) { pts += 40; fb.push('PCE przed: +40'); } else fb.push('PCE przed wg klucza: ' + k.PCE + '% (PT ' + k.PT + ' h / LT ' + k.LT + ' h)');
    const after = E.e44After(gen, ans.chosen || []);
    if (Math.abs(ans.pceAfter - after.PCE) <= 0.3) { pts += 40; fb.push('PCE po usprawnieniach: +40'); } else fb.push('PCE po wybranych usprawnieniach wg klucza: ' + after.PCE + '%');
    return { score: pts, feedback: fb, after };
  };

  /* ---------- UMEWAP ---------- */
  E.umewapTotal = function (scale, levels) { // levels: {A1:1..5,...}
    let t = 0;
    scale.forEach((c) => c.sub.forEach((s) => { t += s.pts[(levels[s.id] || 1) - 1]; }));
    return t;
  };
  E.umewapCat = function (bands, pts) {
    for (let i = bands.length - 1; i >= 0; i--) if (pts >= bands[i].min) return bands[i].kat;
    return bands[0].kat;
  };
  E.valE45 = function (cfg, ans) {
    // ans: {levels:{job:{sub:lvl}}, kategorie:{job:kat}, anomalie:[job,job], korekty:{job:zl}}
    let pts = 0; const fb = [];
    const jobs = cfg.jobs.map((j) => j.id);
    let subOk = 0, subAll = 0, sumOkJobs = 0;
    jobs.forEach((j) => {
      const key = cfg.expertKey[j];
      let jt = 0;
      Object.keys(key).forEach((s) => {
        subAll++;
        const got = (ans.levels[j] || {})[s];
        if (got !== undefined && Math.abs(got - key[s]) <= 1) subOk++;
      });
      const total = E.umewapTotal(cfg.scale, ans.levels[j] || {});
      const keyTotal = E.umewapTotal(cfg.scale, key);
      if (Math.abs(total - keyTotal) <= cfg.sumTol) sumOkJobs++;
      fb.push(cfg.jobs.find((x) => x.id === j).name + ': ' + total + ' pkt (klucz: ' + keyTotal + ' +/- ' + cfg.sumTol + ')');
    });
    const p1 = Math.round(50 * (0.5 * subOk / subAll + 0.5 * sumOkJobs / jobs.length));
    pts += p1; fb.unshift('zgodność punktacji z kluczem: +' + p1 + ' (kryteria ' + subOk + '/' + subAll + ' w tolerancji, sumy ' + sumOkJobs + '/' + jobs.length + ')');
    let catOk = 0;
    jobs.forEach((j) => {
      const keyCat = E.umewapCat(cfg.bands, E.umewapTotal(cfg.scale, cfg.expertKey[j]));
      if (ans.kategorie[j] === keyCat) catOk++;
    });
    const p2 = Math.round(20 * catOk / jobs.length);
    pts += p2; fb.push('kategorie zaszeregowania: ' + catOk + '/' + jobs.length + ': +' + p2);
    const anomSet = new Set(ans.anomalie || []);
    const hit = cfg.anomalie.filter((a) => anomSet.has(a)).length;
    const p3 = hit === 2 && anomSet.size === 2 ? 15 : hit >= 1 ? 7 : 0;
    pts += p3; fb.push('anomalie płacowe: ' + hit + '/2: +' + p3);
    const kor = ans.korekty || {};
    const totalKor = sum(Object.values(kor).map(Number));
    const adr = cfg.anomalie.every((a) => (a === cfg.underpaid ? Number(kor[a] || 0) >= 300 : Number(kor[a] || 0) <= 0));
    if (totalKor <= cfg.budzet && totalKor > 0 && adr) { pts += 15; fb.push('korekty w budżecie i adresujące anomalie: +15'); }
    else fb.push('korekty: podwyżka dla niedopłaconego stanowiska (>= 300 zł), suma <= ' + cfg.budzet + ' zł');
    return { score: Math.min(100, pts), feedback: fb };
  };

  /* ---------- SYMULACJA KPI ---------- */
  E.simEp1 = function (seed, tasks) {
    const g12 = E.genE12(seed);
    const real = g12.future[0]; // szafa
    const fc = tasks.e1_2 && tasks.e1_2.answers ? tasks.e1_2.answers.fc[0] : real.map((x) => Math.round(x * 0.85));
    let over = 0, under = 0;
    for (let i = 0; i < 3; i++) { over += Math.max(0, fc[i] - real[i]); under += Math.max(0, real[i] - fc[i]); }
    const cash = -Math.round(120 * over) - Math.round(180 * under);
    const mp = tasks.e1_2 && tasks.e1_2.exPostMape !== undefined ? tasks.e1_2.exPostMape : 15;
    const otif = mp > 6 ? -Math.min(6, Math.round(mp / 3)) : 0;
    const mrpBraki = !tasks.e1_4 || (tasks.e1_4.score || 0) < 70;
    const lines = [
      'Prognoza vs realizacja (szafy): przeszacowanie ' + over + ' szt. (koszt zapasu ' + Math.round(120 * over) + ' zł), niedoszacowanie ' + under + ' szt. (utracona marża ' + Math.round(180 * under) + ' zł).',
      mrpBraki ? 'Plan MRP z lukami: dostawy ekspresowe okuć (-4 000 zł); braki materiałowe przenoszą się na październik.' : 'Plan MRP szczelny: materiał zabezpieczony.'
    ];
    return { d: { cash: cash - (mrpBraki ? 4000 : 0), otif, unitCost: mrpBraki ? 4 : 0, climate: 0 }, flags: { mrpBraki }, lines };
  };
  E.simEp2 = function (seed, tasks, flags) {
    const g23 = E.genE23(seed);
    let lost = 0;
    if (tasks.e2_3 && tasks.e2_3.answers) {
      const a = tasks.e2_3.answers;
      const plan = [a.S || 0, a.K || 0, a.R || 0].map(Number);
      let feas = true;
      for (let i = 0; i < 3; i++) {
        const lhs = g23.A[i][0] * plan[0] + g23.A[i][1] * plan[1] + g23.A[i][2] * plan[2];
        if (lhs > g23.b[i] + 1e-6) feas = false;
      }
      for (let i = 0; i < 3; i++) if (plan[i] > g23.ub[i] + 0.5 || plan[i] < 0) feas = false;
      const z = feas ? g23.c[0] * plan[0] + g23.c[1] * plan[1] + g23.c[2] * plan[2] : g23.key.z * 0.7;
      lost = Math.max(0, Math.round(g23.key.z - z));
    } else lost = Math.round(g23.key.z * 0.3);
    const g24 = E.genE24(seed);
    const ms = tasks.e2_4 && tasks.e2_4.ms ? tasks.e2_4.ms : g24.key.fifo;
    const delay = Math.max(0, ms - g24.key.ms);
    const johnsonDelay = delay > 0;
    const crp = tasks.e2_5 && tasks.e2_5.answers ? tasks.e2_5.answers.wybor : 'OT';
    const g25 = E.genE25(seed);
    const crpCost = crp === 'OT' ? g25.key.costOT : crp === 'COOP' ? g25.key.costCoop : g25.key.costShift;
    const crpClim = crp === 'OT' ? -Math.round(g25.H / 40) * 4 : crp === 'SHIFT' ? 2 : 0;
    const eff = tasks.e2_2 && tasks.e2_2.eff ? tasks.e2_2.eff : 62.5;
    const lines = [
      'Plan asortymentowy: utracona marża względem optimum: ' + lost + ' zł.',
      'Sekwencja zleceń: makespan ' + ms + ' h (optimum ' + g24.key.ms + ' h)' + (delay ? '; opóźnienie części zleceń (-' + Math.min(6, delay) + ' p.p. OTIF).' : '.'),
      'Zdolności: wybrano wariant ' + (crp === 'OT' ? 'nadgodziny' : crp === 'COOP' ? 'kooperacja' : 'II zmiana') + ' (-' + crpCost + ' zł).',
      'Linia montażu komód: efektywność ' + eff + '%' + (eff >= 75 ? ' (koszt jednostkowy w dół).' : ' (koszt jednostkowy w górę).'),
      flags.mrpBraki ? 'Braki materiałowe z września: przestój okleiniarki 6 h.' : 'Materiał bez zakłóceń.'
    ];
    return {
      d: {
        cash: -Math.min(lost, 30000) - crpCost,
        otif: -(delay ? Math.min(6, delay) : 0) - (flags.mrpBraki ? 2 : 0),
        unitCost: (eff >= 75 ? -2 : 6) + (crp === 'COOP' ? 3 : 0),
        climate: crpClim
      },
      flags: { johnsonDelay, shift2: crp === 'SHIFT', coop: crp === 'COOP' },
      lines
    };
  };
  E.simEp3 = function (seed, tasks, flags) {
    const g31 = E.genE31(seed);
    const bestT = tasks.e3_1 && tasks.e3_1.answers ? Math.min(Number(tasks.e3_1.answers.opt) || g31.key.lc, g31.key.lc) : g31.key.lc;
    const excess = Math.max(0, Math.round(bestT - g31.key.opt));
    const g34 = E.genE34(seed);
    const dpCost = tasks.e3_4 && tasks.e3_4.answers && Number(tasks.e3_4.answers.cost) ? Number(tasks.e3_4.answers.cost) : g34.key.cost * 1.1;
    const dpExcess = Math.max(0, Math.round(dpCost - g34.key.cost)) * 4;
    const cpmOk = tasks.e3_3 && (tasks.e3_3.score || 0) >= 70;
    const lines = [
      'Plan przewozów: nadwyżka kosztu względem optimum: ' + excess + ' zł.',
      'Trasa do Sztokholmu: ' + (dpExcess ? 'nadpłata ' + dpExcess + ' zł na 4 kursach.' : 'optymalna.'),
      cpmOk ? 'Projekt nowej okleiniarki na ścieżce: maszyna ruszy przed grudniową dostawą.' : 'Projekt okleiniarki opóźniony: grudzień na starej zdolności.'
    ];
    return { d: { cash: -excess - dpExcess, otif: 0, unitCost: cpmOk ? -8 : 0, climate: 0 }, flags: { cpmOk }, lines };
  };
  E.simFinal = function (seed, tasks, flags, kpi) {
    let pkt = 0;
    if (tasks.e4_5 && (tasks.e4_5.score || 0) >= 70) pkt += 2; else if (tasks.e4_5 && (tasks.e4_5.score || 0) >= 40) pkt += 1;
    if (tasks.e4_2 && (tasks.e4_2.score || 0) >= 60) pkt += 1;
    if (tasks.e4_1 && (tasks.e4_1.score || 0) >= 60) pkt += 1;
    const zwolnienie = tasks.e4_3 && tasks.e4_3.answers && tasks.e4_3.answers.decyzja === 'B';
    if (!zwolnienie) pkt += 1;
    if ((kpi.climate || 0) >= 55) pkt += 1;
    const strajk = pkt >= 5 ? 0 : pkt >= 3 ? 1 : 2;
    const pceAfter = tasks.e4_4 && tasks.e4_4.after ? tasks.e4_4.after.PCE : 6;
    let otifFin = 90 + (flags.cpmOk ? 4 : 0) + (pceAfter >= 12 ? 3 : 0) - [0, 6, 15][strajk] - (flags.coop ? 1 : 0);
    otifFin = Math.max(60, Math.min(100, Math.round(otifFin)));
    const premia = otifFin >= 92 ? 25000 : otifFin < 85 ? -20000 : 0;
    const korekty = tasks.e4_5 && tasks.e4_5.answers && tasks.e4_5.answers.korekty ? Math.min(8000, sum(Object.values(tasks.e4_5.answers.korekty).map(Number))) : 0;
    const climD = (zwolnienie ? -8 : 4) + (tasks.e4_2 && (tasks.e4_2.score || 0) >= 60 ? 3 : 0) + (tasks.e4_5 && (tasks.e4_5.score || 0) >= 70 ? 8 : tasks.e4_5 && (tasks.e4_5.score || 0) >= 40 ? 3 : -4) + [4, -4, -12][strajk];
    const lines = [
      ['Strajk odwołany. Mazur: "Pierwszy raz ktoś pokazał, że te płace mają logikę."', 'Strajk ostrzegawczy (2 h). Napięta zgoda.', 'Strajk właściwy: dwa dni postoju przed dostawą.'][strajk],
      'Dostawa grudniowa do NORDIKI: OTIF ' + otifFin + '%' + (premia > 0 ? ' -> premia kontraktowa +25 000 zł.' : premia < 0 ? ' -> kara umowna -20 000 zł.' : '.'),
      korekty ? 'Korekty płacowe: -' + korekty + ' zl/mies.' : 'Bez korekt płacowych.'
    ];
    return {
      d: { cash: premia - korekty + (zwolnienie ? 5200 : 0) - [0, 3000, 12000][strajk], otif: otifFin - (kpi.otif || 100), unitCost: 0, climate: climD },
      flags: { strajk, otifFin },
      lines, strajk, otifFin
    };
  };

  E.wynikFirmy = function (teamsKpi) {
    // min-max normalizacja w ramach gry; zwraca mape teamId -> wynik 0..100
    const ids = Object.keys(teamsKpi);
    if (!ids.length) return {};
    const get = (k) => ids.map((i) => teamsKpi[i][k] || 0);
    const norm = (arr, invert) => {
      const mn = Math.min(...arr), mx = Math.max(...arr);
      return arr.map((v) => (mx === mn ? 0.5 : (v - mn) / (mx - mn))).map((v) => (invert ? 1 - v : v));
    };
    const c = norm(get('cash')), o = norm(get('otif')), u = norm(get('unitCost'), true), k = norm(get('climate'));
    const out = {};
    ids.forEach((id, i) => { out[id] = Math.round((0.35 * c[i] + 0.30 * o[i] + 0.15 * u[i] + 0.20 * k[i]) * 100); });
    return out;
  };

  if (typeof module !== 'undefined' && module.exports) module.exports = E;
  root.KENG = E;
})(typeof window !== 'undefined' ? window : globalThis);
