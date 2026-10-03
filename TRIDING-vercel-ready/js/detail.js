// Pages de détail : un clic sur une carte du dashboard ouvre sa page dédiée (#/d/<carte>).
TD.detail = (function () {
  const S = TD.stats, st = TD.store, V = TD.views, C = TD.charts, cf = st.cfg, f = V.f, K = V.kpi, W = 1000;
  const ms = () => Array.from({ length: st.count() }, (_, i) => S.month(i));
  const lb = () => ms().map((_, i) => "M" + (i + 1));
  const days = () => st.DAYS.map((_, i) => S.day(i));
  const weeks = () => Array.from({ length: st.W }, (_, i) => S.wk(i));
  const wl = () => weeks().map((_, i) => "W" + (i + 1));
  const r2 = n => Math.round(n * 100) / 100, ox = n => n == null ? 0 : n;
  const tbl = (h, rows) => `<table><thead><tr>${h.map(x => `<th>${x}</th>`).join("")}</tr></thead><tbody>${rows.map(c => `<tr>${c.map(x => `<td>${x}</td>`).join("")}</tr>`).join("")}</tbody></table>`;
  const mt = (h, fn) => tbl(["Mois", ...h], ms().map((c, i) => [`<a href="#/month/${i + 1}">Month ${i + 1}</a>`, ...fn(c, i)]));
  const pick = (fn, hi = true) => {
    let b = -1, bv;
    ms().forEach((c, i) => { if (!c.trades && !c.be) return; const v = fn(c); if (b < 0 || (hi ? v > bv : v < bv)) { b = i; bv = v; } });
    return b < 0 ? "–" : "M" + (b + 1);
  };
  const pc = c => `<b class="${S.tone(c.winRate)}">${S.pct(c.winRate)}</b>`;
  const riskNote = () => `WIN = +${f(cf().risk * cf().rr)}%, LOSS = −${f(cf().risk)}%, NT = 0, cumul simple.`;
  const scen = () => {
    const a = S.all(), k = cf().risk, dd = S.dd(S.curve());
    return tbl(["Risque", "Performance", "Drawdown max", "Gain / WIN", "Perte / LOSS"], [0.5, 1, 2].map(x => [`<b>${String(x).replace(".", ",")} %</b>`, `<b class="${S.sign(a.r)}">${S.pnl(a.r * x)}</b>`, `<span class="loss">${S.pnl(-dd * x / k)}</span>`, "+" + f(x * cf().rr) + "%", "−" + f(x) + "%"]));
  };
  const full = (head, rows) => `<table>${head}<tbody>${rows.join("")}</tbody></table>`;

  const defs = {
    perf() {
      const a = S.all(), k = cf().risk, m = ms(); let cum = 0;
      return {
        t: "Performance", s: "Rendement total de la stratégie selon ton risque par trade, mois par mois.",
        k: K("Performance", S.pnl(a.pnl), "var(--ac)", S.sign(a.pnl)) + K("Meilleur mois", pick(c => c.pnl), "var(--gr)") + K("Pire mois", pick(c => c.pnl, false), "var(--rd)") + K("Mois positifs", m.filter(c => c.pnl > 0).length + " / " + m.filter(c => c.trades).length, "var(--pu)") + K("Expectancy", S.r(a.exp), "var(--pu)", S.sign(a.exp)) + K("Gain moyen par trade", S.pnl(ox(a.exp) * k), "var(--or)", S.sign(a.exp)),
        m: ["P&amp;L par mois (%)", C.col(m.map(c => c.pnl), lb(), { suf: "%", W, signed: true }), riskNote()],
        x: [["Cumul mois par mois", mt(["P&amp;L", "Cumul"], c => { cum = r2(cum + c.pnl); return [`<b class="${S.sign(c.pnl)}">${c.trades ? S.pnl(c.pnl) : "–"}</b>`, `<b class="${S.sign(cum)}">${S.pnl(cum)}</b>`]; })], ["Comparaison des deux risques", scen()]]
      };
    },
    curve() {
      const cv = S.curve(), a = S.all(), u = S.under(cv), dd = S.dd(cv), cur = u[u.length - 1];
      return {
        t: "Courbe de capital", s: "Évolution cumulée du capital, trade après trade, dans l'ordre du journal.",
        k: K("Performance", S.pnl(a.pnl), "var(--ac)", S.sign(a.pnl)) + K("Drawdown max", S.pnl(-dd), "var(--rd)", dd ? "loss" : "") + K("Drawdown actuel", S.pnl(cur), "var(--or)", cur ? "loss" : "") + K("Série de WIN", S.streak("WIN"), "var(--gr)", "win") + K("Série de LOSS", S.streak("LOSS"), "var(--rd)", "loss"),
        m: ["Courbe de capital (%)", C.line(cv, "Courbe de capital", "%", W, false, S.log()), riskNote()],
        x: [["Drawdown (écart au sommet)", C.line(u, "Drawdown", "%", 560, true, S.log())], ["Comparaison des deux risques", scen()]]
      };
    },
    results() {
      const a = S.all(), m = ms();
      return {
        t: "Résultats par mois", s: "Wins, losses et NT, mois par mois, par jour de la semaine et par semaine du mois.",
        k: K("Total trades", a.trades, "var(--ac)") + K("Wins", a.wins, "var(--gr)", "win") + K("Losses", a.losses, "var(--rd)", "loss") + K("NT", a.be, "var(--or)", "be") + K("Win / loss ratio", S.num(a.ratio), "var(--ac)") + K("Win rate", S.pct(a.winRate), "var(--pu)", S.tone(a.winRate)),
        m: ["Résultats par mois", C.stack(V.ser(m), lb(), W)],
        x: [["Détail par mois", full(V.head("Mois", 1), m.map((c, i) => V.row(`<a href="#/month/${i + 1}">Month ${i + 1}</a>`, c, 1)))],
          ["Par jour de la semaine", full(V.head("Jour"), days().map((c, i) => V.row(st.DAYS[i], c)))],
          ["Par semaine du mois", full(V.head("Semaine"), weeks().map((c, i) => V.row("Week " + (i + 1), c)))]]
      };
    },
    winrate() {
      const a = S.all(), be = S.be() * 100, pv = c => r2(ox(c.winRate) * 100), gap = a.winRate == null ? null : r2(a.winRate * 100 - be);
      const o = w => ({ suf: "%", W: w, ref: be, refLabel: "Seuil " + f(be) + "%", color: n => n >= be - 1e-9 ? "var(--gr)" : "var(--rd)" });
      return {
        t: "Win rate", s: `Pourcentage de trades gagnants. Avec un RR de 1:${cf().rr}, la stratégie est rentable à partir de ${f(be)} %.`,
        k: K("Win rate global", S.pct(a.winRate), "var(--ac)", S.tone(a.winRate)) + K("Seuil de rentabilité", f(be) + "%", "var(--or)") + K("Écart au seuil", gap == null ? "–" : (gap > 0 ? "+" : "") + gap + " pts", "var(--pu)", gap == null ? "" : gap >= 0 ? "win" : "loss") + K("Meilleur mois", pick(c => ox(c.winRate)), "var(--gr)"),
        m: ["Win rate par mois (%)", C.col(ms().map(pv), lb(), o(W)), "Les barres vertes dépassent le seuil de rentabilité."],
        x: [["Par jour de la semaine", C.col(days().map(pv), st.DAYS, o(560))], ["Par semaine du mois", C.col(weeks().map(pv), wl(), o(560))], ["Détail par mois", mt(["Trades", "Wins", "Win rate"], c => [c.trades, c.wins, pc(c)])]]
      };
    }
  };

  return {
    has: k => Object.prototype.hasOwnProperty.call(defs, k),
    render(k) {
      const d = defs[k]();
      return V.bar(d.t) + `<div class="hd"><h1>${d.t}</h1><a class="btn" href="#/">Retour au dashboard</a></div><p class="mu sub">${d.s}</p>
      <section class="kpis">${d.k}</section>
      <section class="card wide"><div class="ch"><h3>${d.m[0]}</h3>${V.sw()}</div>${d.m[1]}${d.m[2] ? `<p class="note">${d.m[2]}</p>` : ""}</section>
      <div class="row">${d.x.map(([t, h]) => `<section class="card"><h3>${t}</h3>${h}</section>`).join("")}</div>`;
    }
  };
})();
