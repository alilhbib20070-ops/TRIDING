// Vues : Dashboard global et journal d'un mois.
TD.views = (function () {
  const S = TD.stats, st = TD.store, cf = st.cfg, f = v => String(Math.round(v * 100) / 100);
  const esc = s => String(s).replace(/[&"<>]/g, c => ({ "&": "&amp;", '"': "&quot;", "<": "&lt;", ">": "&gt;" }[c]));
  const kpi = (l, v, c, t = "", k = "") => `<${k ? `a href="#/d/${k}"` : "div"} class="card g kp${k ? " go" : ""}" style="--c:${c}"><span class="mu">${l}</span><b class="big ${t}">${v}</b></${k ? "a" : "div"}>`;
  const sw = () => `<span class="seg" role="group" aria-label="Risque par trade">${[0.5, 1, 2].map(v => `<button data-risk="${v}" class="${v === cf().risk ? "on" : ""}" aria-pressed="${v === cf().risk}">${String(v).replace(".", ",")} %</button>`).join("")}</span>`;
  const th = () => '<span class="themes">' + [["aura", "Aura"], ["clair", "Clair"], ["violet", "Violet"]].map(([k, n]) => `<button data-theme="${k}" title="Thème ${n}" aria-label="Thème ${n}"></button>`).join("") + "</span>";
  const startInput = () => `<label class="start">Date du 1er jour <input type="date" data-start value="${esc(st.get().start || "")}"></label>`;
  const bar = c => `<div class="bar"><span><a href="#/">Backtest</a> / <b>${c}</b></span><span class="ctl"><span class="mu">Risque par trade, RR 1:${cf().rr}</span>${sw()}${th()}<span class="pill"><i></i>Enregistré en local</span></span></div>`;
  const NOTE = () => `<p class="note">Trades = Wins + Losses. Win rate = Wins ÷ Trades. NT est affiché mais n'est pas compté comme un trade. P&amp;L : WIN = +${f(cf().risk * cf().rr)}%, LOSS = −${f(cf().risk)}%, NT = 0, cumul simple.</p>`;
  const stat = c => c.winRate == null ? '<span class="st na">Vide</span>' : c.r > 0 ? '<span class="st ok">Positif</span>' : '<span class="st no">À revoir</span>';
  const row = (l, c, s) => `<tr><td>${l}</td><td>${c.trades}</td><td class="win">${c.wins}</td><td class="loss">${c.losses}</td><td class="be">${c.be}</td><td class="${S.tone(c.winRate)}"><b>${S.pct(c.winRate)}</b></td><td class="${S.sign(c.pnl)}"><b>${c.trades ? S.pnl(c.pnl) : "–"}</b></td>${s ? `<td>${stat(c)}</td>` : ""}</tr>`;
  const head = (n, s) => `<thead><tr><th>${n}</th><th>Trades</th><th>Wins</th><th>Losses</th><th>NT</th><th>Win rate</th><th>P&amp;L</th>${s ? "<th>Statut</th>" : ""}</tr></thead>`;
  const ser = l => [{ name: "Wins", color: "var(--gr)", values: l.map(c => c.wins) }, { name: "Losses", color: "var(--rd)", values: l.map(c => c.losses) }, { name: "NT", color: "var(--or)", values: l.map(c => c.be) }];

  function dashboard() {
    const a = S.all(), r = cf(), ms = Array.from({ length: st.count() }, (_, i) => S.month(i)), cv = S.curve(), dd = S.dd(cv), be = S.be() * 100;
    const hb = ms.map((m, i) => `<div class="hb"><span>Month ${i + 1}</span><div class="tr"><i style="width:${(m.winRate || 0) * 100}%"></i><u style="left:${be}%"></u></div><b class="${S.tone(m.winRate)}">${S.pct(m.winRate)}</b></div>`).join("");
    return bar("Dashboard") + `<h1>Backtest dashboard</h1>
    <a class="card g hero go" href="#/d/perf"><div><div class="eb">Résumé des performances</div><h2>Tous les mois</h2><p class="mu" style="margin:0">${a.trades} trades, risque ${f(r.risk)}% par trade, RR 1:${r.rr}.</p></div>
      <div><b class="big ${S.sign(a.pnl) || "cy"}">${S.pnl(a.pnl)}</b><span class="mu">Performance</span></div>
      <div><b class="big ${S.tone(a.winRate) || "cy"}">${S.pct(a.winRate)}</b><span class="mu">Win rate</span></div>
      <div><b class="big">${a.trades}</b><span class="mu">Total trades</span></div></a>
    <section class="kpis">${kpi("Drawdown max", S.pnl(-dd), "var(--rd)", dd ? "loss" : "")}${kpi("Expectancy", S.r(a.exp), "var(--pu)", S.sign(a.exp))}${kpi("Win / loss ratio", S.num(a.ratio), "var(--ac)")}${kpi("Wins", a.wins, "var(--gr)", "win")}${kpi("Losses", a.losses, "var(--rd)", "loss")}${kpi("NT", a.be, "var(--or)", "be")}</section>
    <div class="row">
      <a class="card go" href="#/d/results"><h3>Résultats par mois</h3>${TD.charts.stack(ser(ms), ms.map((_, i) => "M" + (i + 1)))}</a>
      <a class="card go" href="#/d/winrate"><h3>Win rate par mois</h3><div class="lg"><span>- - - Seuil de rentabilité ${f(be)} % (RR 1:${r.rr})</span></div>${hb}</a>
      <a class="card go" href="#/d/curve"><h3>Courbe de capital (%)</h3>${TD.charts.line(cv, "Courbe de capital", "%", 560, false, S.log())}<p class="note">WIN = +${f(r.risk * r.rr)}%, LOSS = −${f(r.risk)}%, dans l'ordre du journal. NT ignoré.</p></a>
    </div>
    <section class="card"><h3>Détail par mois</h3><table>${head("Mois", 1)}<tbody>${ms.map((m, i) => row(`<a href="#/month/${i + 1}">Month ${i + 1}</a>`, m, 1)).join("")}</tbody><tfoot>${row("<b>Total</b>", a, 1)}</tfoot></table>${NOTE()}<p style="margin:14px 0 0"><button class="ghost" data-add>Ajouter un mois</button></p></section>`;
  }

  function kpis(m) {
    const t = S.month(m);
    return kpi("Trades", t.trades, "var(--ac)") + kpi("Wins", t.wins, "var(--gr)", "win") + kpi("Losses", t.losses, "var(--rd)", "loss") + kpi("NT", t.be, "var(--or)", "be") + kpi("Win rate", S.pct(t.winRate), "var(--pu)", S.tone(t.winRate)) + kpi("P&amp;L", S.pnl(t.pnl), "var(--ac)", S.sign(t.pnl));
  }

  function side(m) {
    const w = Array.from({ length: st.W }, (_, i) => S.week(m, i));
    return `<section class="card"><h3>Détail par semaine</h3><table>${head("Semaine")}<tbody>${w.map((c, i) => row("Week " + (i + 1), c)).join("")}</tbody></table>${NOTE()}</section>
    <section class="card"><h3>Résultats par semaine</h3>${TD.charts.stack(ser(w), w.map((_, i) => "W" + (i + 1)))}</section>
    <section class="card"><h3>Courbe du mois (%)</h3>${TD.charts.line(S.curve(st.get().months[m].flat()), "Courbe du mois", "%", 560, false, S.log(m))}</section>`;
  }

  function month(m) {
    const ds = st.dates(), dd = (w, d) => ds[(m * st.W + w) * st.D + d] || "", at = (fl, w, d) => `data-f="${fl}" data-m="${m}" data-w="${w}" data-d="${d}"`;
    const body = st.get().months[m].map((days, w) => `<tr class="wk"><th colspan="4">Semaine ${w + 1}</th></tr>` + days.map((t, d) =>
      `<tr><td>${dd(w, d) ? S.fd(dd(w, d), { day: "2-digit", month: "2-digit", year: "numeric" }) : "–"}</td><td class="mu">${dd(w, d) ? S.fd(dd(w, d), { weekday: "short" }) : st.DAYS[d]}</td>
      <td><select class="res ${t.result}" ${at("result", w, d)} aria-label="Résultat">${["", "WIN", "LOSS", "NT"].map(r => `<option class="o${r}" ${r === t.result ? "selected" : ""}>${r}</option>`).join("")}</select></td>
      <td><input type="text" value="${esc(t.notes)}" placeholder="Notes" ${at("notes", w, d)} aria-label="Notes"></td></tr>`).join("")).join("");
    return bar("Month " + (m + 1)) + `<div class="hd"><h1>Month ${m + 1}</h1><span class="hr">${startInput()}<button class="ghost" data-del="${m}">Supprimer ce mois</button></span></div><section class="kpis" id="kp">${kpis(m)}</section>
    <div class="month"><section class="card"><table><thead><tr><th>Date</th><th>Jour</th><th>Résultat</th><th>Notes</th></tr></thead><tbody>${body}</tbody></table></section><div id="side">${side(m)}</div></div>`;
  }
  return { dashboard, month, kpis, side, bar, sw, kpi, f, row, head, ser, NOTE, startInput, esc };
})();
