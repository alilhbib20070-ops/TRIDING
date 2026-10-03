// Données : liste de mois (5 semaines × 4 jours chacun), sauvegardée dans localStorage.
(function () {
  const KEY = "td.backtest.v1", W = 5, D = 4, DAYS = ["Mon", "Tue", "Wed", "Thu"], DEF = { risk: 1, rr: 2 };
  const month = () => Array.from({ length: W }, () => Array.from({ length: D }, () => ({ date: "", result: "", notes: "" })));
  const used = m => m.flat().some(t => t.result || t.notes);
  const blank = () => ({ v: 2, months: [month()] });
  const seed = () => {
    const S = TD.SEED, s = { v: 2, months: Object.keys(S.months).map(() => month()) };
    Object.entries(S.months).forEach(([m, weeks]) => weeks.forEach((w, wi) => w.forEach((r, di) => { s.months[m - 1][wi][di].result = r; })));
    s.start = S.firstDate;
    return s;
  };
  let state;
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) {} };
  try { state = JSON.parse(localStorage.getItem(KEY)); } catch (e) {}
  if (!state || !Array.isArray(state.months)) state = seed();
  // Migration unique : retire les mois vides de fin de l'ancienne version (6 mois fixes).
  if (!state.v) { while (state.months.length > 1 && !used(state.months[state.months.length - 1])) state.months.pop(); state.v = 2; }
  state.settings = Object.assign({}, DEF, state.settings);
  if (state.start === undefined) state.start = (state.months[0] && state.months[0][0][0].date) || "";
  const fixNT = s => s.months.forEach(m => m.flat().forEach(t => { if (t.result === "BE") t.result = "NT"; }));
  fixNT(state);
  const keep = fn => { const s = state.settings; fn(); state.settings = s; save(); };

  const ymd = d => d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
  const ok = d => d.getDay() >= 1 && d.getDay() <= 4;
  const snap = iso => { const d = new Date(iso + "T00:00"); while (!ok(d)) d.setDate(d.getDate() + 1); return d; };
  const dates = () => {
    const out = [];
    if (!state.start) return out;
    const d = snap(state.start), n = state.months.length * W * D;
    for (let i = 0; i < n; i++) { out.push(ymd(d)); do { d.setDate(d.getDate() + 1); } while (!ok(d)); }
    return out;
  };
  const cells = () => {
    const ds = dates(), out = []; let i = 0;
    state.months.forEach((mo, m) => mo.forEach((wk, w) => wk.forEach((t, d) => out.push({ t, m, w, d, date: ds[i++] || "" }))));
    return out;
  };
  TD.store = {
    DAYS, W, D,
    get: () => state,
    cfg: () => state.settings,
    setRisk(v) { state.settings.risk = v; save(); },
    count: () => state.months.length,
    dates, cells,
    setStart(v) { state.start = v ? ymd(snap(v)) : ""; save(); },
    used: i => used(state.months[i]),
    set(m, w, d, patch) { Object.assign(state.months[m][w][d], patch); save(); },
    addMonth() { state.months.push(month()); save(); return state.months.length; },
    delMonth(i) { state.months.splice(i, 1); if (!state.months.length) state.months.push(month()); save(); },
    demo() { keep(() => { state = seed(); }); },
    clear() { keep(() => { state = blank(); }); },
    export() {
      const a = document.createElement("a");
      a.href = URL.createObjectURL(new Blob([JSON.stringify(state, null, 2)], { type: "application/json" }));
      a.download = "backtest-" + new Date().toISOString().slice(0, 10) + ".json";
      a.click(); URL.revokeObjectURL(a.href);
    },
    import(text) {
      const j = JSON.parse(text);
      if (!Array.isArray(j.months) || !j.months.length) throw new Error("Le fichier ne contient aucun mois.");
      state = j; fixNT(state); state.v = 2; state.settings = Object.assign({}, DEF, j.settings); save();
    }
  };
})();
