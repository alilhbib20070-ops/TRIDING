// Routage (#/ et #/month/N), saisie, menu réductible, import/export.
(function () {
  const $ = id => document.getElementById(id), app = $("app"), nav = $("nav"), sb = $("sb");
  const I = {
    j: '<svg viewBox="0 0 24 24"><rect x="5" y="3" width="14" height="18" rx="2"/><path d="M9 8h6M9 12h6M9 16h4"/></svg>',
    d: '<svg viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7" rx="2"/><rect x="14" y="3" width="7" height="7" rx="2"/><rect x="3" y="14" width="7" height="7" rx="2"/><rect x="14" y="14" width="7" height="7" rx="2"/></svg>',
    m: '<svg viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="16" rx="3"/><path d="M3 10h18M8 3v4M16 3v4"/></svg>'
  };
  const ADD = '<button class="addm" data-add title="Ajouter un mois"><svg viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg><span class="t">Ajouter un mois</span></button>';
  const link = (h, on, ic, t) => `<a href="${h}" title="${t}" class="${on ? "on" : ""}"${on ? ' aria-current="page"' : ""}>${ic}<span class="t">${t}</span></a>`;

  // Compte les gros chiffres de 0 à leur valeur
  function count(root) {
    if (matchMedia("(prefers-reduced-motion:reduce)").matches) return;
    root.querySelectorAll(".big").forEach(el => {
      const m = el.textContent.match(/^([+-]?)(\d+(?:\.\d+)?)([%R]?)$/);
      if (!m) return;
      const end = +m[2], dec = (m[2].split(".")[1] || "").length, t0 = performance.now();
      (function f(t) {
        const k = Math.min(1, (t - t0) / 800);
        el.textContent = m[1] + (end * (1 - Math.pow(1 - k, 3))).toFixed(dec) + m[3];
        if (k < 1) requestAnimationFrame(f);
      })(t0);
    });
  }

  function route(keep) {
    const cm = location.hash.match(/^#\/cal(?:\/(\d{4}-\d{2}))?$/);
    const r = location.hash.match(/^#\/month\/(\d+)$/), i = r && +r[1] >= 1 && +r[1] <= TD.store.count() ? +r[1] - 1 : -1;
    nav.innerHTML = link("#/", i < 0 && !cm, I.d, "Dashboard") + link("#/cal", !!cm, I.m, "Calendrier") + Array.from({ length: TD.store.count() }, (_, k) => '<div class="mi">' + link("#/month/" + (k + 1), k === i, I.j, "Month " + (k + 1)) + `<button class="rm" data-del="${k}" title="Supprimer ce mois" aria-label="Supprimer Month ${k + 1}">−</button></div>`).join("") + ADD;
    const dm = location.hash.match(/^#\/d\/(\w+)$/);
    app.innerHTML = i >= 0 ? TD.views.month(i) : dm && TD.detail.has(dm[1]) ? TD.detail.render(dm[1]) : cm ? TD.cal.render(cm[1]) : TD.views.dashboard();
    if (keep !== true) window.scrollTo(0, 0);
    app.classList.add("fresh"); clearTimeout(route.t); route.t = setTimeout(() => app.classList.remove("fresh"), 1400);
    count(app);
  }

  app.addEventListener("change", e => {
    const el = e.target, f = el.dataset.f;
    if (!f) return;
    const m = +el.dataset.m;
    TD.store.set(m, +el.dataset.w, +el.dataset.d, { [f]: el.value });
    if (f === "result") {
      el.className = "res " + el.value;
      $("kp").innerHTML = TD.views.kpis(m); count($("kp"));
      $("side").innerHTML = TD.views.side(m);
    }
  });

  $("col").onclick = () => sb.classList.toggle("min");
  $("exp").onclick = () => TD.store.export();
  $("imp").onchange = e => {
    const file = e.target.files[0];
    if (!file) return;
    file.text().then(t => { TD.store.import(t); route(); }).catch(err => alert("Import impossible : " + err.message));
    e.target.value = "";
  };
  $("demo").onclick = () => { if (confirm("Remplacer toutes les données par l'exemple ?")) { TD.store.demo(); route(); } };
  $("clr").onclick = () => { if (confirm("Effacer toutes les données ?")) { TD.store.clear(); route(); } };
  // La lumière suit la souris (fond + cartes + menu)
  let raf = 0;
  document.addEventListener("pointermove", e => {
    if (raf) return;
    raf = requestAnimationFrame(() => {
      raf = 0;
      document.body.style.setProperty("--gx", e.clientX + "px");
      document.body.style.setProperty("--gy", e.clientY + "px");
      document.querySelectorAll(".card,nav a").forEach(c => {
        const r = c.getBoundingClientRect();
        c.style.setProperty("--x", e.clientX - r.left + "px");
        c.style.setProperty("--y", e.clientY - r.top + "px");
      });
    });
  });

  document.addEventListener("click", e => {
    const b = e.target.closest("[data-risk]");
    if (!b) return;
    TD.store.setRisk(+b.dataset.risk);
    route(true);
  });

  document.addEventListener("click", e => {
    if (e.target.closest("[data-add]")) location.hash = "#/month/" + TD.store.addMonth();
    const d = e.target.closest("[data-del]");
    if (!d) return;
    const i = +d.dataset.del;
    const c = TD.stats.month(i), n = c.trades + c.be;
    if (!confirm("Supprimer Month " + (i + 1) + " ?" + (n ? " Ses " + n + " résultat(s) seront perdus définitivement." : ""))) return;
    TD.store.delMonth(i);
    if (location.hash === "#/" || !location.hash) route(); else location.hash = "#/";
  });

  document.addEventListener("click", e => {
    const t = e.target.closest("[data-theme]");
    if (!t) return;
    document.documentElement.dataset.theme = t.dataset.theme;
    try { localStorage.setItem("td.theme", t.dataset.theme); } catch (x) {}
  });
  app.addEventListener("change", e => {
    if (!("start" in e.target.dataset)) return;
    TD.store.setStart(e.target.value);
    route(true);
  });

  // Réticule type TradingView sur les graphiques (svg[data-p])
  const tip = document.createElement("div"); tip.id = "tip"; document.body.append(tip);
  let cur = null;
  const clear = () => { if (cur) { const g = cur.querySelector(".xh"); if (g) g.remove(); cur = null; } tip.style.display = "none"; };
  document.addEventListener("pointermove", e => {
    const s = e.target.closest && e.target.closest("svg[data-p]");
    if (!s) return clear();
    if (cur && cur !== s) clear();
    cur = s;
    const P = s._p || (s._p = JSON.parse(s.dataset.p)), r = s.getBoundingClientRect(), vb = s.viewBox.baseVal, mx = (e.clientX - r.left) * vb.width / r.width;
    let b = P[0];
    P.forEach(q => { if (Math.abs(q[0] - mx) < Math.abs(b[0] - mx)) b = q; });
    let g = s.querySelector(".xh");
    if (!g) { g = document.createElementNS("http://www.w3.org/2000/svg", "g"); g.setAttribute("class", "xh"); s.append(g); }
    g.innerHTML = `<line x1="${b[0]}" x2="${b[0]}" y1="0" y2="${vb.height}"/><line x1="0" x2="${vb.width}" y1="${b[1]}" y2="${b[1]}"/><circle cx="${b[0]}" cy="${b[1]}" r="4.5"/>`;
    tip.textContent = b[2]; tip.style.display = "block";
    tip.style.left = Math.min(e.clientX + 16, innerWidth - tip.offsetWidth - 8) + "px"; tip.style.top = e.clientY + 16 + "px";
  });

  window.addEventListener("hashchange", route);
  route();
})();
