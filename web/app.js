const $ = s => document.querySelector(s);
const f6 = x => x.toFixed(6).replace(".", ",");
const cls = v => v === "Ya" ? "ya" : "no";
let forest = [];

function treeHTML(n, edge) {
  const info = `<small>(n=${n.n}; Tidak=${n.t}, Ya=${n.y})</small>`;
  const lab = n.leaf ? `<b class="leaf ${n.leaf}">${n.leaf}</b> ${info}` : `<b class="nd">${n.split}?</b> ${info}`;
  const kids = n.leaf ? "" : "<ul>" + Object.entries(n.kids).map(([v, k]) => treeHTML(k, v)).join("") + "</ul>";
  return `<li>${edge ? `<span class="edge">${edge}</span> ` : ""}${lab}${kids}</li>`;
}
const internal = (n, o = []) => { if (!n.leaf) { o.push(n); Object.values(n.kids).forEach(k => internal(k, o)); } return o; };
function nodeTable(n) {
  let r = `<tr class="tot"><td>Total</td><td></td><td>${n.n}</td><td>${n.t}</td><td>${n.y}</td><td>${f6(RF.H(n.t, n.y))}</td><td></td><td></td><td></td></tr>`;
  for (const s of n.cand) {
    r += `<tr class="at"><td>${s.f}</td><td></td><td></td><td></td><td></td><td></td><td>${f6(s.gain)}</td><td>${f6(s.si)}</td><td>${f6(s.gr)}</td></tr>`;
    r += s.rows.map(x => `<tr><td></td><td>${x.v}</td><td>${x.n}</td><td>${x.t}</td><td>${x.y}</td><td>${f6(x.e)}</td><td></td><td>${f6(x.si)}</td><td></td></tr>`).join("");
  }
  const best = n.cand.map(s => `${s.f}: ${f6(s.gr)}`).join(" | ");
  const label = n.path === "root" ? "Root" : n.path.replace("root|", "").replace(/\|/g, " &rarr; ");
  return `<details><summary>Node: ${label} &rarr; pecah dengan ${n.split}</summary>
    <p>Fitur acak terpilih: <b>${n.cand.map(s => s.f).join(", ")}</b><br>Gain Ratio: ${best}</p>
    <div class="scroll"><table><tr><th>Atribut</th><th>Nilai</th><th>Jumlah</th><th>Tidak</th><th>Ya</th><th>Entropy</th><th>Gain</th><th>Split Info</th><th>Gain Ratio</th></tr>${r}</table></div></details>`;
}
function render() {
  $("#dataset").innerHTML = "<table><tr><th>No</th>" + RF.FEATS.map(f => `<th>${f}</th>`).join("") + "<th>BeliBP</th></tr>" +
    RF.DATA.map(d => `<tr><td>${d.no}</td>${RF.FEATS.map(f => `<td>${d[f]}</td>`).join("")}<td class="${cls(d.y)}">${d.y}</td></tr>`).join("") + "</table>";
  $("#trees").innerHTML = forest.map((t, i) => `<details open><summary>Pohon ${i + 1}</summary>
    <p><b>Sampel bootstrap (No asal):</b> ${t.boot.join(", ")}<br><b>Data OOB:</b> ${t.oob.length ? t.oob.join(", ") : "-"}</p>
    <ul class="tree">${treeHTML(t.root)}</ul>
    <p><b>Perhitungan per node:</b></p>${internal(t.root).map(nodeTable).join("")}</details>`).join("");
  const o = RF.oobEval(forest);
  $("#oob").innerHTML = "<table><tr><th>No</th><th>Label asli</th><th>Vote pohon OOB</th><th>Hasil</th><th>Benar?</th></tr>" +
    o.rows.map(r => `<tr><td>${r.no}</td><td>${r.y}</td><td>${r.votes.join(", ") || "-"}</td><td>${r.pred || "-"}</td><td>${r.ok === null ? "-" : r.ok ? "Benar" : "Salah"}</td></tr>`).join("") + "</table>" +
    `<p class="big">Data dievaluasi: ${o.evaluated} &middot; Benar: ${o.correct} &middot; Akurasi OOB: ${(o.acc * 100).toFixed(1)}% &middot; Error OOB: ${((1 - o.acc) * 100).toFixed(1)}%</p>
     <p class="hint">Data yang tidak pernah menjadi OOB tidak dievaluasi. Jika vote seri, dipilih Ya.</p>`;
  showVote();
}
function showVote() {
  const x = {}; RF.FEATS.forEach(f => x[f] = $("#in-" + f).value);
  const v = RF.vote(forest, x);
  $("#vote").innerHTML = "<table><tr><th>Pohon</th><th>Jalur</th><th>Hasil</th></tr>" +
    v.res.map((r, i) => `<tr><td>${i + 1}</td><td>${r.path.join(" &rarr; ")} &rarr; daun</td><td class="${cls(r.label)}"><b>${r.label}</b></td></tr>`).join("") + "</table>" +
    `<p class="big">Vote: Ya = ${v.ya}, Tidak = ${v.tidak} &rarr; <span class="${cls(v.result)}">${v.result === "Ya" ? "Membeli Battle Pass (Ya)" : "Tidak membeli (Tidak)"}</span></p>`;
}
function run() {
  forest = $("#mode").value === "skenario" ? RF.scenarioForest()
    : RF.randomForest(Math.min(15, Math.max(1, +$("#ntree").value || 3)), +$("#seed").value || 1);
  render();
}
const def = {Rank: "Tinggi", JamMain: "Sedang", MainTim: "Ya", EventDiskon: "Ada"};
$("#form").innerHTML = RF.FEATS.map(f => `<label>${f}<select id="in-${f}">${RF.VALUES[f].map(v => `<option${v === def[f] ? " selected" : ""}>${v}</option>`).join("")}</select></label>`).join("");
RF.FEATS.forEach(f => $("#in-" + f).addEventListener("change", showVote));
$("#run").addEventListener("click", run);
$("#mode").addEventListener("change", () => { const a = $("#mode").value === "acak"; $("#ntree").disabled = $("#seed").disabled = !a; });
$("#ntree").disabled = $("#seed").disabled = true;
run();