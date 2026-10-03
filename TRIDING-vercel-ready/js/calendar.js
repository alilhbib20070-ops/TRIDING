// Calendrier des performances (comme les calendriers de prop firms, mais en pourcentages).
TD.cal = (function () {
  const S = TD.stats, st = TD.store, V = TD.views, cf = st.cfg, f = V.f, K = V.kpi;
  const pad = n => String(n).padStart(2, "0");
  const val = t => t.result === "WIN" ? cf().risk * cf().rr : t.result === "LOSS" ? -cf().risk : 0;
  function render(ym) {
    const head = V.bar("Calendrier") + `<div class="hd"><h1>Calendrier</h1><span class="hr">${V.startInput()}</span></div>`;
    const all = st.cells().filter(c => c.date);
    if (!all.length) return head + `<section class="card"><p class="mu" style="margin:0">Choisis la date du 1er jour : les autres jours se remplissent automatiquement (du lundi au jeudi).</p></section>`;
    const ms = [...new Set(all.map(c => c.date.slice(0, 7)))], last = [...all].reverse().find(c => c.t.result);
    if (!ms.includes(ym)) ym = last ? last.date.slice(0, 7) : ms[0];
    const i = ms.indexOf(ym), [Y, M] = ym.split("-").map(Number), by = {};
    all.forEach(c => { by[c.date] = c; });
    const n = new Date(Y, M, 0).getDate(), lead = (new Date(Y, M - 1, 1).getDay() + 6) % 7, slots = [];
    for (let k = 0; k < lead; k++) slots.push(0);
    for (let d = 1; d <= n; d++) slots.push(d);
    while (slots.length % 7) slots.push(0);
    let grid = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim", "Semaine"].map(h => `<div class="h">${h}</div>`).join("");
    for (let r = 0; r < slots.length; r += 7) {
      let sum = 0, tr = 0;
      slots.slice(r, r + 7).forEach(d => {
        const c = d && by[`${ym}-${pad(d)}`], t = c && c.t.result ? c.t : null;
        if (t) { sum += val(t); if (t.result !== "NT") tr++; }
        grid += c ? `<a class="dc ${t ? t.result : ""}" href="#/month/${c.m + 1}" title="${V.esc(c.t.notes || "")}"><i>${d}</i>${t ? `<b>${t.result === "NT" ? "NT" : S.pnl(val(t))}</b>` : ""}</a>` : `<div class="dc off"><i>${d || ""}</i></div>`;
      });
      grid += `<div class="dc sum"><i>Semaine</i><b class="${S.sign(sum)}">${tr ? S.pnl(Math.round(sum * 1e4) / 1e4) : "–"}</b></div>`;
    }
    const mc = S.count(all.filter(c => c.date.startsWith(ym)).map(c => c.t));
    const label = new Date(Y, M - 1, 1).toLocaleDateString("fr-FR", { month: "long", year: "numeric" });
    const nav = (k, t) => ms[k] ? `<a class="btn" href="#/cal/${ms[k]}" aria-label="${t}">${t === "Mois précédent" ? "‹" : "›"}</a>` : "";
    return head + `<section class="kpis">${K("P&amp;L du mois", S.pnl(mc.pnl), "var(--ac)", S.sign(mc.pnl))}${K("Trades", mc.trades, "var(--gr)")}${K("Win rate", S.pct(mc.winRate), "var(--pu)", S.tone(mc.winRate))}</section>
    <section class="card"><div class="ch"><div class="cn">${nav(i - 1, "Mois précédent")}<h3 style="font-size:18px;text-transform:capitalize">${label}</h3>${nav(i + 1, "Mois suivant")}</div>${V.sw()}</div>
    <div class="cal">${grid}</div><p class="note">Une case = un jour du journal (WIN = +${f(cf().risk * cf().rr)}%, LOSS = −${f(cf().risk)}%, NT = 0). Clique sur un jour pour ouvrir son mois.</p></section>`;
  }
  return { render };
})();
