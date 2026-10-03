// Graphiques SVG sans dépendance. Chaque svg porte data-p = [[x, y, texte], ...] pour le réticule (voir app.js).
(function () {
  const rd = n => Math.round(n * 100) / 100, sg = n => (n > 0 ? "+" : "") + rd(n);
  const hp = a => JSON.stringify(a.map(q => [Math.round(q[0]), Math.round(q[1]), q[2]])).replace(/&/g, "&amp;").replace(/"/g, "&quot;");
  TD.charts = {
    stack(series, labels, W = 560) {
      const H = 240, p = { l: 34, r: 8, t: 22, b: 28 }, pts = [];
      const tot = labels.map((_, i) => series.reduce((a, s) => a + s.values[i], 0));
      const max = Math.max(4, ...tot), ih = H - p.t - p.b, gw = (W - p.l - p.r) / labels.length, bw = Math.min(40, gw * 0.6);
      let g = "";
      for (let i = 0; i <= 4; i++) {
        const y = p.t + ih - ih * i / 4;
        g += `<line x1="${p.l}" x2="${W - p.r}" y1="${y}" y2="${y}" class="grid"/><text x="${p.l - 6}" y="${y + 4}" class="ax" text-anchor="end">${Math.round(max * i / 4)}</text>`;
      }
      labels.forEach((l, i) => {
        const cx = p.l + gw * i + gw / 2; let y = p.t + ih;
        series.forEach(s => {
          const h = ih * s.values[i] / max; y -= h;
          if (h) g += `<rect x="${cx - bw / 2}" y="${y}" width="${bw}" height="${h}" fill="${s.color}"/>`;
        });
        pts.push([cx, y, l + "\n" + series.map(s => s.values[i] + " " + s.name).join(", ")]);
        g += `<text x="${cx}" y="${H - 8}" class="ax" text-anchor="middle">${l}</text>` + (tot[i] ? `<text x="${cx}" y="${y - 5}" class="ax tv" text-anchor="middle">${tot[i]}</text>` : "");
      });
      const lg = `<div class="lg">${series.map(s => `<span><i style="background:${s.color}"></i>${s.name}</span>`).join("")}</div>`;
      return `${lg}<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Résultats" data-p="${hp(pts)}">${g}</svg>`;
    },
    // Colonnes : o = { suf, W, color (texte ou fonction), signed, ref, refLabel, label }
    col(v, labels, o = {}) {
      const W = o.W || 560, H = 240, p = { l: 46, r: 8, t: 26, b: 40 }, suf = o.suf || "", pts = [];
      const mn = Math.min(0, ...v), mx = Math.max(0, ...v, o.ref || 0), r = (mx - mn) || 1, ih = H - p.t - p.b;
      const y = n => p.t + ih * (1 - (n - mn) / r), gw = (W - p.l - p.r) / labels.length, bw = Math.min(44, gw * 0.6);
      let g = "";
      for (let i = 0; i <= 4; i++) {
        const n = mn + r * i / 4;
        g += `<line x1="${p.l}" x2="${W - p.r}" y1="${y(n)}" y2="${y(n)}" class="grid"/><text x="${p.l - 6}" y="${y(n) + 4}" class="ax" text-anchor="end">${rd(n)}${suf}</text>`;
      }
      labels.forEach((l, i) => {
        const cx = p.l + gw * i + gw / 2, n = v[i], a = y(0), b = y(n);
        const c = typeof o.color === "function" ? o.color(n, i) : o.color || (n >= 0 ? "var(--gr)" : "var(--rd)");
        pts.push([cx, b, l + "\n" + (o.signed ? sg(n) : rd(n)) + suf]);
        g += `<text x="${cx}" y="${H - 8}" class="ax" text-anchor="middle">${l}</text>`;
        if (n) g += `<rect x="${cx - bw / 2}" y="${Math.min(a, b)}" width="${bw}" height="${Math.abs(b - a)}" rx="3" fill="${c}"/>`;
        g += `<text x="${cx}" y="${n >= 0 ? b - 6 : b + 14}" class="ax tv" text-anchor="middle">${o.signed ? sg(n) : rd(n)}${suf}</text>`;
      });
      if (o.ref != null) g += `<line x1="${p.l}" x2="${W - p.r}" y1="${y(o.ref)}" y2="${y(o.ref)}" stroke="var(--mu)" stroke-dasharray="5 4"/><text x="${W - p.r}" y="${y(o.ref) - 5}" class="ax" text-anchor="end">${o.refLabel || ""}</text>`;
      return `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${o.label || "Graphique"}" data-p="${hp(pts)}">${g}</svg>`;
    },
    // Courbe : neg = courbe de drawdown (rouge) ; info[i] = texte du jour affiché par le réticule
    line(v, label, suf = "", W = 560, neg = false, info = null) {
      if (v.length < 2) return `<p class="note">Aucun trade enregistré pour l'instant.</p>`;
      const big = W > 560, H = big ? 260 : 200, pl = big ? 46 : 10, p = 10;
      const mn = Math.min(0, ...v), mx = Math.max(0, ...v), r = mx - mn || 1, ex = neg ? mn : mx;
      const x = i => pl + (W - pl - p) * i / (v.length - 1), y = n => 24 + (H - 40) * (1 - (n - mn) / r);
      const col = neg ? "var(--rd)" : "var(--gr)", id = neg ? "ln" : "lp";
      const pts = v.map((n, i) => `${x(i)},${y(n)}`).join(" "), pk = v.indexOf(ex);
      const hv = v.map((n, i) => [x(i), y(n), (info && info[i] ? info[i] + "\n" : "") + (neg ? "Drawdown : " : "Capital : ") + sg(n) + suf]);
      let g = "";
      if (big) for (let i = 0; i <= 4; i++) {
        const n = mn + r * i / 4;
        g += `<line x1="${pl}" x2="${W - p}" y1="${y(n)}" y2="${y(n)}" class="grid"/><text x="${pl - 6}" y="${y(n) + 4}" class="ax" text-anchor="end">${rd(n)}${suf}</text>`;
      }
      return `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${label}" data-p="${hp(hv)}"><defs><linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${col}" stop-opacity=".3"/><stop offset="1" stop-color="${col}" stop-opacity="0"/></linearGradient></defs>${g}
        <line x1="${pl}" x2="${W - p}" y1="${y(0)}" y2="${y(0)}" class="grid" stroke-dasharray="4 4"/>
        <polygon points="${x(0)},${H} ${pts} ${x(v.length - 1)},${H}" fill="url(#${id})"/>
        <polyline pathLength="1" points="${pts}" fill="none" stroke="${col}" stroke-width="2" stroke-linejoin="round"/>
        <circle cx="${x(pk)}" cy="${y(ex)}" r="4" fill="${col}"/><text x="${x(pk)}" y="${y(ex) + (neg ? 18 : -10)}" class="ax tv" text-anchor="middle">${sg(ex)}${suf}</text></svg>`;
    }
  };
})();
