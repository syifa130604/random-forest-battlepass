// Inti algoritma Random Forest (Gain Ratio, fitur acak m=2, bootstrap, OOB)
const RF = (() => {
const FEATS = ["Rank","JamMain","MainTim","EventDiskon"];
const VALUES = {Rank:["Rendah","Menengah","Tinggi"],JamMain:["Sedikit","Sedang","Banyak"],MainTim:["Ya","Tidak"],EventDiskon:["Ada","Tidak"]};
const RAW = `1,Rendah,Sedikit,Tidak,Tidak,Tidak
2,Rendah,Sedikit,Tidak,Ada,Tidak
3,Menengah,Sedikit,Tidak,Tidak,Ya
4,Tinggi,Sedang,Tidak,Tidak,Tidak
5,Tinggi,Sedikit,Ya,Tidak,Ya
6,Tinggi,Banyak,Ya,Ada,Tidak
7,Menengah,Banyak,Ya,Ada,Ya
8,Rendah,Sedang,Tidak,Tidak,Tidak
9,Rendah,Banyak,Ya,Tidak,Ya
10,Tinggi,Sedang,Ya,Tidak,Ya
11,Rendah,Sedang,Ya,Ada,Ya
12,Menengah,Sedang,Tidak,Ada,Ya
13,Menengah,Banyak,Ya,Tidak,Ya
14,Tinggi,Sedang,Tidak,Ada,Tidak`;
const DATA = RAW.split("\n").map(l => { const p = l.split(","); return {no:+p[0],Rank:p[1],JamMain:p[2],MainTim:p[3],EventDiskon:p[4],y:p[5]}; });
// Skenario laporan = sama persis dengan perhitungan manual di Excel
const SCENARIO = {
  boots: [[3,10,14,13,13,2,5,2,8,13,8,8,11,7],[13,4,2,8,1,14,7,7,10,13,13,1,12,8],[5,12,13,4,10,2,6,1,1,1,11,9,1,7]],
  plans: [
    {"root":["JamMain","MainTim"],"root|MainTim=Tidak":["JamMain","EventDiskon"],"root|MainTim=Tidak|JamMain=Sedikit":["Rank","EventDiskon"]},
    {"root":["JamMain","MainTim"],"root|MainTim=Tidak":["JamMain","EventDiskon"],"root|MainTim=Tidak|EventDiskon=Ada":["Rank","JamMain"]},
    {"root":["MainTim","EventDiskon"],"root|MainTim=Tidak":["Rank","EventDiskon"],"root|MainTim=Ya":["Rank","EventDiskon"],"root|MainTim=Ya|EventDiskon=Ada":["Rank","JamMain"]}]
};
const H = (t, y) => { const n = t + y; return [t, y].reduce((s, c) => c ? s - c / n * Math.log2(c / n) : s, 0); };
const cnt = S => ({t: S.filter(r => r.y === "Tidak").length, y: S.filter(r => r.y === "Ya").length});
const maj = S => { const c = cnt(S); return c.y >= c.t ? "Ya" : "Tidak"; };
function stats(S, f) {
  const n = S.length, c = cnt(S); let gain = H(c.t, c.y), si = 0; const rows = [];
  for (const v of VALUES[f]) {
    const sub = S.filter(r => r[f] === v); if (!sub.length) continue;
    const k = cnt(sub), e = H(k.t, k.y), p = sub.length / n;
    gain -= p * e; si -= p * Math.log2(p); rows.push({v, n: sub.length, t: k.t, y: k.y, e, si: -p * Math.log2(p)});
  }
  return {f, gain, si, gr: si ? gain / si : 0, rows};
}
function build(S, avail, pick, path) {
  const c = cnt(S), node = {path, n: S.length, t: c.t, y: c.y, maj: maj(S)};
  if (!c.t || !c.y || !avail.length) { node.leaf = node.maj; return node; }
  node.cand = pick(path, avail).map(f => stats(S, f));
  node.split = node.cand.reduce((b, s) => s.gr > b.gr ? s : b).f;   // seri -> fitur yang lebih dulu
  node.kids = {};
  for (const v of VALUES[node.split]) {
    const sub = S.filter(r => r[node.split] === v);
    if (sub.length) node.kids[v] = build(sub, avail.filter(f => f !== node.split), pick, path + "|" + node.split + "=" + v);
  }
  return node;
}
const mk = (boot, pick) => ({boot, oob: DATA.filter(r => !boot.includes(r.no)).map(r => r.no),
  root: build(boot.map(no => DATA[no - 1]), FEATS, pick, "root")});
function rng(a) { return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
function scenarioForest() { return SCENARIO.boots.map((b, i) => mk(b, (p) => SCENARIO.plans[i][p])); }
function randomForest(nTree, seed) {
  const r = rng(seed), m = Math.floor(Math.sqrt(FEATS.length)), out = [];
  for (let i = 0; i < nTree; i++) {
    const boot = Array.from({length: DATA.length}, () => 1 + Math.floor(r() * DATA.length));
    const pick = (p, av) => { const a = av.slice(), k = Math.min(m, a.length);
      for (let j = a.length - 1; j > 0; j--) { const q = Math.floor(r() * (j + 1)); [a[j], a[q]] = [a[q], a[j]]; }
      return a.slice(0, k).sort((x, z) => FEATS.indexOf(x) - FEATS.indexOf(z)); };
    out.push(mk(boot, pick));
  }
  return out;
}
function trace(node, x) {
  const path = [];
  while (!node.leaf) { const v = x[node.split], nx = node.kids[v]; path.push(node.split + "=" + v); if (!nx) return {label: node.maj, path}; node = nx; }
  return {label: node.leaf, path};
}
function vote(forest, x) {
  const res = forest.map(t => trace(t.root, x)), ya = res.filter(r => r.label === "Ya").length, tidak = res.length - ya;
  return {res, ya, tidak, result: ya >= tidak ? "Ya" : "Tidak"};
}
function oobEval(forest) {
  const rows = DATA.map(d => { const votes = forest.filter(t => t.oob.includes(d.no)).map(t => trace(t.root, d).label);
    const ya = votes.filter(v => v === "Ya").length, tidak = votes.length - ya;
    const pred = votes.length ? (ya >= tidak ? "Ya" : "Tidak") : null;
    return {no: d.no, y: d.y, votes, pred, ok: pred === null ? null : pred === d.y}; });
  const ev = rows.filter(r => r.pred), ok = ev.filter(r => r.ok).length;
  return {rows, evaluated: ev.length, correct: ok, acc: ev.length ? ok / ev.length : 0};
}
return {FEATS, VALUES, DATA, H, scenarioForest, randomForest, vote, oobEval};
})();
if (typeof module !== "undefined") module.exports = RF;