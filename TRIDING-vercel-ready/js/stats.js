// Trades = Wins + Losses ; NT affiché mais non compté.
// P&L : WIN = +risque × RR, LOSS = −risque, NT = 0 (cumul simple, en % du capital).
TD.stats = {
  be: () => 1 / (1 + TD.store.cfg().rr),
  count(list) {
    const { risk, rr } = TD.store.cfg(), c = { wins: 0, losses: 0, be: 0 };
    list.forEach(t => { if (t.result === "WIN") c.wins++; else if (t.result === "LOSS") c.losses++; else if (t.result === "NT") c.be++; });
    c.trades = c.wins + c.losses;
    c.winRate = c.trades ? c.wins / c.trades : null;
    c.ratio = c.losses ? c.wins / c.losses : null;
    c.r = c.wins * rr - c.losses;
    c.pnl = Math.round(c.r * risk * 1e4) / 1e4;
    c.exp = c.trades ? c.r / c.trades : null;
    return c;
  },
  week: (m, w) => TD.stats.count(TD.store.get().months[m][w]),
  month: m => TD.stats.count(TD.store.get().months[m].flat()),
  all: () => TD.stats.count(TD.store.get().months.flat(2)),
  day: d => TD.stats.count(TD.store.cells().filter(c => c.date ? new Date(c.date + "T00:00").getDay() === d + 1 : c.d === d).map(c => c.t)),
  fd: (iso, o) => iso ? new Date(iso + "T00:00").toLocaleDateString("fr-FR", o || { weekday: "short", day: "numeric", month: "short", year: "numeric" }) : "",
  log(m) {
    const out = ["Départ"]; let n = 0;
    TD.store.cells().forEach(c => {
      const r = c.t.result;
      if ((m != null && c.m !== m) || (r !== "WIN" && r !== "LOSS")) return;
      out.push((c.date ? TD.stats.fd(c.date) + "\n" : "") + "Trade " + (++n) + ", " + r);
    });
    return out;
  },
  wk: w => TD.stats.count(TD.store.get().months.map(m => m[w]).flat()),
  streak(res) { let b = 0, c = 0; TD.store.get().months.flat(2).forEach(t => { if (!t.result) return; c = t.result === res ? c + 1 : 0; b = Math.max(b, c); }); return b; },
  under: v => { let pk = 0; return v.map(x => { pk = Math.max(pk, x); return Math.round((x - pk) * 1e4) / 1e4; }); },
  curve(list) {
    const { risk, rr } = TD.store.cfg(), v = [0]; let c = 0;
    (list || TD.store.get().months.flat(2)).forEach(t => {
      if (t.result === "WIN") c += risk * rr; else if (t.result === "LOSS") c -= risk; else return;
      v.push(Math.round(c * 1e4) / 1e4);
    });
    return v;
  },
  dd(v) { let pk = 0, m = 0; v.forEach(x => { pk = Math.max(pk, x); m = Math.max(m, pk - x); }); return Math.round(m * 1e4) / 1e4; },
  pct: v => v == null ? "–" : Math.round(v * 1000) / 10 + "%",
  num: v => v == null ? "–" : String(Math.round(v * 100) / 100),
  pnl: v => v == null ? "–" : (v > 0 ? "+" : "") + Math.round(v * 100) / 100 + "%",
  r: v => v == null ? "–" : (v > 0 ? "+" : "") + Math.round(v * 100) / 100 + "R",
  tone: v => v == null ? "" : v >= TD.stats.be() - 1e-9 ? "win" : "loss",
  sign: v => v > 0 ? "win" : v < 0 ? "loss" : ""
};
