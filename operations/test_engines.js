const E = require('./engines.js');
let fails = 0;
function ok(name, cond, extra) {
  if (cond) console.log('PASS ' + name);
  else { console.log('FAIL ' + name + (extra !== undefined ? ' :: ' + JSON.stringify(extra) : '')); fails++; }
}

/* ANOVA sanity */
const an = E.anova1([[1, 2, 3], [2, 3, 4], [3, 4, 5]]);
ok('anova F=3', Math.abs(an.F - 3) < 1e-9, an.F);

/* LP canonical (verified in Python: z=66800, x=[160,0,400], dual okl=360, dual R cap=5) */
const c = [180, 140, 95], A = [[0.40, 0.30, 0.20], [0.50, 0.40, 0.25], [0.30, 0.35, 0.20]], b = [240, 180, 210], ub = [300, 350, 400];
const lp = E.lp3(c, A, b, ub);
ok('lp z=66800', Math.abs(lp.z - 66800) < 1e-6, lp.z);
ok('lp x', Math.abs(lp.x[0] - 160) + Math.abs(lp.x[1]) + Math.abs(lp.x[2] - 400) < 1e-4, lp.x);
ok('lp dual okl=360', Math.abs(E.lp3dual(c, A, b, ub, 'row', 1) - 360) < 1e-6);
ok('lp dual Rcap=5', Math.abs(E.lp3dual(c, A, b, ub, 'ub', 2) - 5) < 1e-6);
ok('lp unique', E.lp3unique(c, A, b, ub));

/* Transport canonical (Python: NW 94200, LC 80700, OPT 78900) */
const C = [[95, 120, 140, 60], [130, 150, 110, 45], [70, 90, 150, 85]];
const S = [420, 260, 180], D = [300, 240, 180, 140];
ok('nw 94200', E.tCost(E.nwCorner(S, D), C) === 94200);
const lc = E.leastCost(S, D, C);
ok('lc 80700', E.tCost(lc, C) === 80700, E.tCost(lc, C));
const opt = E.modi(S, D, C, lc);
ok('modi optimal flag', opt.optimal, opt);
ok('modi 78900', opt.cost === 78900, opt.cost);

/* MRP canonical: F1=F2=400 -> MPS [0,0,60,60,80,80,100,100] */
const mps = E.mpsFromForecast(400, 400);
ok('mps', JSON.stringify(mps) === JSON.stringify([0, 0, 60, 60, 80, 80, 100, 100]), mps);
const kp = E.mrp(mps.map((x) => x * 4), 180, 50, [0, 0, 0, 0, 0, 0, 0, 0], 2, 100);
ok('mrp plyta porel', JSON.stringify(kp.porel) === JSON.stringify([200, 200, 300, 300, 400, 400, 0, 0]), kp.porel);
const ko = E.mrp(mps, 40, 0, [0, 100, 0, 0, 0, 0, 0, 0], 3, null);
ok('mrp okucia porel', JSON.stringify(ko.porel) === JSON.stringify([0, 60, 80, 100, 100, 0, 0, 0]), ko.porel);
ok('mrp poh plyta end 60', kp.poh[7] === 60, kp.poh);

/* Johnson canonical */
const jobs = { Z1: [4, 7], Z2: [6, 3], Z3: [2, 8], Z4: [9, 5], Z5: [5, 5] };
const seq = E.johnson(jobs);
ok('johnson seq', seq.join(',') === 'Z3,Z1,Z5,Z4,Z2', seq);
ok('johnson ms 30', E.makespan(seq, jobs) === 30);
ok('fifo 32', E.makespan(['Z1', 'Z2', 'Z3', 'Z4', 'Z5'], jobs) === 32);
ok('brute best 30', E.bestMakespan(jobs) === 30);

/* CPM canonical */
const acts = {
  A: { d: 2, pre: [] }, B: { d: 4, pre: ['A'] }, C: { d: 6, pre: [] }, D: { d: 3, pre: ['B'] },
  E: { d: 2, pre: ['B', 'C'] }, F: { d: 2, pre: ['D', 'E'] }, G: { d: 3, pre: ['F'] },
  H: { d: 4, pre: ['C'] }, I: { d: 2, pre: ['G', 'H'] }, J: { d: 1, pre: ['I'] }
};
const cp = E.cpm(acts);
ok('cpm T=17', cp.T === 17, cp.T);
ok('cpm critical', cp.critical.join('') === 'ABDFGIJ', cp.critical);
ok('cpm slack H=4', cp.slack.H === 4);
ok('cpm slack C=1,E=1', cp.slack.C === 1 && cp.slack.E === 1);

/* DP canonical */
const stages = [['Tczew'], ['Gdynia', 'Swinoujscie'], ['Karlskrona', 'Ystad', 'Trelleborg'], ['Sztokholm']];
const legs = {
  'Tczew|Gdynia': 180, 'Tczew|Swinoujscie': 320, 'Gdynia|Karlskrona': 540, 'Gdynia|Ystad': 610,
  'Swinoujscie|Ystad': 380, 'Swinoujscie|Trelleborg': 350, 'Karlskrona|Sztokholm': 480,
  'Ystad|Sztokholm': 560, 'Trelleborg|Sztokholm': 590
};
const dp = E.dpStages(stages, legs);
ok('dp cost 1200', dp.cost === 1200, dp);
ok('dp path', dp.path.join('-') === 'Tczew-Gdynia-Karlskrona-Sztokholm');
const legs2 = {}; Object.keys(legs).forEach((k) => { if (!k.includes('Gdynia')) legs2[k] = legs[k]; });
const dp2 = E.dpStages([['Tczew'], ['Swinoujscie'], ['Karlskrona', 'Ystad', 'Trelleborg'], ['Sztokholm']], legs2);
ok('dp event 1260', dp2.cost === 1260, dp2.cost);

/* line balancing canonical */
const times = { a: 120, b: 90, c: 150, d: 60, e: 200, f: 110, g: 180, h: 140, i: 150 };
const prec = { a: [], b: ['a'], c: ['a'], d: ['b'], e: ['c'], f: ['c'], g: ['e', 'f'], h: ['d', 'g'], i: ['h'] };
const asg = { a: 0, b: 0, c: 0, d: 1, e: 1, f: 1, g: 2, h: 2, i: 2 };
const ck = E.lbCheck(times, prec, asg, 480);
ok('lb feasible 3st', ck.feasible && ck.nStations === 3 && Math.abs(ck.eff - 83.3) < 0.1, ck);
ok('lb brute finds 3st', E.lbFeasible3(times, prec, 480) !== null);

/* generator smoke: 30 seedow kazdy */
let allOk = true;
for (let s = 0; s < 30; s++) {
  const seed = 'GAME' + s + ':T' + s;
  const g12 = E.genE12(seed);
  if (g12.hist[0].length !== 24 || g12.future[0].length !== 3) { allOk = false; console.log('e12 fail', s); }
  const g13 = E.genE13(seed);
  if (!(g13.key.F > E.FCRIT_2_21)) { allOk = false; console.log('e13 F too small', s, g13.key.F); }
  if (!(g13.key.r2 >= 0.35)) { allOk = false; console.log('e13 r2 small', s, g13.key.r2); }
  const g14 = E.genE14(seed, 380 + s * 5, 400 + s * 4);
  if (g14.keyP.late || g14.keyO.late) { allOk = false; console.log('e14 late', s); }
  const g22 = E.genE22(seed);
  if (!E.lbFeasible3(g22.times, g22.prec, g22.CT)) { allOk = false; console.log('e22 infeasible', s); }
  const g23 = E.genE23(seed);
  if (g23.key.x[1] !== 0) { allOk = false; console.log('e23 K!=0', s, g23.key); }
  if (!(g23.key.dualOkl > 0)) { allOk = false; console.log('e23 dual<=0', s); }
  const g24 = E.genE24(seed);
  if (!(g24.key.fifo - g24.key.ms >= 2)) { allOk = false; console.log('e24 no advantage', s); }
  const g31 = E.genE31(seed);
  if (!(g31.key.nw > g31.key.lc && g31.key.lc >= g31.key.opt * 1.01)) { allOk = false; console.log('e31 order', s, g31.key); }
  const g33 = E.genE33(seed);
  if (!(g33.key.T >= 14 && g33.key.T <= 21 && g33.key.slack.H >= 2)) { allOk = false; console.log('e33', s, g33.key.T); }
  const g34 = E.genE34(seed);
  if (!(g34.key.cost > 0 && g34.keyEvent.cost >= g34.key.cost)) { allOk = false; console.log('e34', s); }
  const g41 = E.genE41(seed);
  if (!(g41.key.absLakiernia > g41.key.absZaklad + 1)) { allOk = false; console.log('e41 anomalia', s, g41.key); }
  const g42 = E.genE42(seed);
  if (!(g42.staraNorma > g42.key.norma)) { allOk = false; console.log('e42 stara norma', s); }
  const g43 = E.genE43(seed, g41.key.absZaklad);
  if (!(g43.key.etaty >= 2 && g43.key.etaty <= 4)) { allOk = false; console.log('e43 etaty', s, g43.key); }
  const g44 = E.genE44(seed);
  if (!(g44.key.PCE > 3 && g44.key.PCE < 12)) { allOk = false; console.log('e44 pce', s, g44.key); }
  const after = E.e44After(g44, ['i1', 'i3']);
  if (!(after.PCE > g44.key.PCE)) { allOk = false; console.log('e44 after', s); }
}
ok('generators 30 seeds', allOk);

/* determinizm: dwa wywolania = te same dane */
const a1 = E.genE12('X:1'), a2 = E.genE12('X:1');
ok('determinism e12', JSON.stringify(a1.hist) === JSON.stringify(a2.hist) && JSON.stringify(a1.future) === JSON.stringify(a2.future));

/* walidatory: pelne punkty za odpowiedzi z klucza */
const g23 = E.genE23('X:1');
const v23 = E.valE23(g23, { z: g23.key.z, S: g23.key.x[0], K: g23.key.x[1], R: g23.key.x[2], binding: 'okleiniarka', dual: g23.key.dualOkl, decyzja: 'B' });
ok('val e23 = 100', v23.score === 100, v23);
const g31b = E.genE31('X:1');
const v31 = E.valE31(g31b, { nw: g31b.key.nw, lc: g31b.key.lc, opt: g31b.key.opt, alloc: g31b.key.optAlloc });
ok('val e31 = 100', v31.score === 100, v31);
const g33b = E.genE33('X:1');
const v33 = E.valE33(g33b, { ES: g33b.key.ES, LS: g33b.key.LS, crit: g33b.key.critical, T: g33b.key.T, slackH: g33b.key.slack.H, skracaj: g33b.key.critical[0] });
ok('val e33 = 100', v33.score === 100, v33);
const g34b = E.genE34('X:1');
const v34 = E.valE34(g34b, { f: g34b.key.f, cost: g34b.key.cost, path: g34b.key.path.join('-'), costEvent: g34b.keyEvent.cost });
ok('val e34 = 100', v34.score === 100, v34);
const g14b = E.genE14('X:1', 400, 400);
const v14 = E.valE14(g14b, { porelP: g14b.keyP.porel, porelO: g14b.keyO.porel });
ok('val e14 = 100', v14.score === 100, v14);
const g24b = E.genE24('X:1');
const v24 = E.valE24(g24b, { seq: g24b.key.seq, rule: 'johnson' });
ok('val e24 = 100', v24.score === 100, v24);
const g12b = E.genE12('X:1');
const v12 = E.valE12(g12b, { method: 'Trend', mape: g12b.key[0].mapeTrend, fc: g12b.future });
ok('val e12 = 100 (prognoza idealna)', v12.score === 100, v12);
const g42b = E.genE42('X:1');
const v42 = E.valE42(g42b, { tj: g42b.key.tj, tn: g42b.key.tn, norma: g42b.key.norma, odstajace: 'B' });
ok('val e42 = 100', v42.score === 100, v42);
const g43b = E.genE43('X:1', 6);
const v43 = E.valE43(g43b, { fundusz: g43b.key.fundusz, etaty: g43b.key.etaty, decyzja: 'A' });
ok('val e43 = 100', v43.score === 100, v43);
const g44b = E.genE44('X:1');
const after = E.e44After(g44b, ['i1', 'i2']);
const v44 = E.valE44(g44b, { orderOk: true, pceBefore: g44b.key.PCE, chosen: ['i1', 'i2'], pceAfter: after.PCE });
ok('val e44 = 100', v44.score === 100, v44);

/* symulacja: przebieg pelny nie rzuca bledow i daje sensowne liczby */
const seed = 'DEMO:TEAM1';
const tasks = {};
const g12c = E.genE12(seed);
tasks.e1_2 = { answers: { method: 'Trend', mape: g12c.key[0].mapeTrend, fc: g12c.future }, score: 100, exPostMape: 0 };
tasks.e1_4 = { score: 100 };
const s1 = E.simEp1(seed, tasks);
ok('sim ep1', s1.d.cash === 0 && s1.flags.mrpBraki === false, s1);
const g23c = E.genE23(seed);
tasks.e2_3 = { answers: { S: g23c.key.x[0], K: g23c.key.x[1], R: g23c.key.x[2] } };
const g24c = E.genE24(seed);
tasks.e2_4 = { ms: g24c.key.ms };
tasks.e2_5 = { answers: { wybor: 'OT' } };
tasks.e2_2 = { eff: 83.3 };
const s2 = E.simEp2(seed, tasks, s1.flags);
ok('sim ep2 lost=0', s2.d.cash === -E.genE25(seed).key.costOT, s2.d);
const g31c = E.genE31(seed);
tasks.e3_1 = { answers: { opt: g31c.key.opt } };
const g34c = E.genE34(seed);
tasks.e3_4 = { answers: { cost: g34c.key.cost } };
tasks.e3_3 = { score: 90 };
const s3 = E.simEp3(seed, tasks, s2.flags);
ok('sim ep3 excess 0', s3.d.cash === 0 && s3.flags.cpmOk, s3.d);
tasks.e4_1 = { score: 80 }; tasks.e4_2 = { score: 90 }; tasks.e4_3 = { answers: { decyzja: 'A' } };
tasks.e4_4 = { after: { PCE: 14 } }; tasks.e4_5 = { score: 85, answers: { korekty: { planistka: 600 } } };
const sf = E.simFinal(seed, tasks, Object.assign({}, s2.flags, s3.flags), { climate: 62, otif: 96 });
ok('sim final strajk odwolany', sf.strajk === 0 && sf.otifFin >= 92, sf);

/* wynik firmy */
const w = E.wynikFirmy({ a: { cash: 100, otif: 95, unitCost: 250, climate: 70 }, b: { cash: -50, otif: 80, unitCost: 280, climate: 40 } });
ok('wynik firmy a>b', w.a > w.b, w);

console.log(fails === 0 ? '\nALL TESTS PASSED' : '\n' + fails + ' FAILURES');
process.exit(fails === 0 ? 0 : 1);
