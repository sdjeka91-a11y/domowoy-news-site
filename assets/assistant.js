// Домовёнок: маскот и помощник по сайту. Работает только в браузере: отвечает по готовым ответам (config/assistant.yaml) и по материалам сайта (search-index.js).
// Ничего не выдумывает, личные данные не собирает, историю не хранит. Маскот нарисован для Домового News (SVG, без чужих персонажей).
(function () {
  var A = window.ASSIST || {};
  var IDX = window.SEARCH_INDEX || [];
  var scr = document.currentScript || document.querySelector('script[src*="assistant.js"]');
  var ROOT = scr ? (scr.getAttribute("src") || "").replace(/assets\/assistant\.js.*$/, "") : "";
  var reduce = !!(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) && document.documentElement.getAttribute("data-motion") !== "on";
  var TZ = "Asia/Almaty";
  var MONTHS_G = ["января", "февраля", "марта", "апреля", "мая", "июня", "июля", "августа", "сентября", "октября", "ноября", "декабря"];

  var SVG = '<svg class="dm" viewBox="0 0 120 150" role="img" aria-label="Домовёнок, маскот сайта" data-state="">' +
    '<g class="body-all">' +
    '<ellipse cx="45" cy="141" rx="14" ry="8" fill="#d9c49c"/><ellipse cx="75" cy="141" rx="14" ry="8" fill="#d9c49c"/><path d="M31 144h28M61 144h28" stroke="#8a6a3a" stroke-width="3" stroke-linecap="round"/>' +
    '<path d="M34 90Q60 80 86 90L92 135Q60 146 28 135Z" fill="#6f8a45"/><rect x="30" y="109" width="60" height="7" fill="#c8782a"/><rect x="54" y="107" width="12" height="11" rx="2" fill="#f0c24a"/>' +
    '<g fill="#e8c871"><circle cx="40" cy="128" r="1.8"/><circle cx="52" cy="131" r="1.8"/><circle cx="64" cy="131" r="1.8"/><circle cx="76" cy="128" r="1.8"/></g>' +
    '<path d="M36 96Q25 105 23 117" stroke="#6f8a45" stroke-width="9" stroke-linecap="round" fill="none"/><circle cx="22" cy="119" r="5.4" fill="#f1caa2"/>' +
    '<path d="M20 132L15 88" stroke="#b98a2c" stroke-width="2.2" stroke-linecap="round"/>' +
    '<g fill="#e8b94d"><ellipse cx="15" cy="84" rx="2.6" ry="5.2"/><ellipse cx="11.5" cy="88" rx="2.4" ry="4.8" transform="rotate(-24 11.5 88)"/><ellipse cx="18.8" cy="88" rx="2.4" ry="4.8" transform="rotate(24 18.8 88)"/><ellipse cx="11.5" cy="96" rx="2.4" ry="4.8" transform="rotate(-24 11.5 96)"/><ellipse cx="18.8" cy="96" rx="2.4" ry="4.8" transform="rotate(24 18.8 96)"/></g>' +
    '<g class="arm-w"><path d="M84 96Q99 94 105 80" stroke="#6f8a45" stroke-width="9" stroke-linecap="round" fill="none"/><circle cx="106" cy="76" r="5.4" fill="#f1caa2"/>' +
    '<g class="prop p-snow"><circle cx="106" cy="76" r="7" fill="#c8433a"/></g></g>' +
    '<g class="prop p-snow"><circle cx="22" cy="119" r="7" fill="#c8433a"/></g>' +
    '<circle cx="33" cy="61" r="6" fill="#f1caa2"/><circle cx="87" cy="61" r="6" fill="#f1caa2"/>' +
    '<circle cx="60" cy="61" r="27" fill="#f1caa2"/>' +
    '<path d="M33 63Q36 101 60 107Q84 101 87 63Q77 80 60 80Q43 80 33 63Z" fill="#d0661d"/>' +
    '<path d="M42 84Q46 98 60 102M78 84Q74 98 60 102M52 88Q56 96 60 98" stroke="#ea9549" stroke-width="2" stroke-linecap="round" fill="none"/>' +
    '<path d="M44 74Q52 67 60 73Q68 67 76 74Q67 80 60 76Q53 80 44 74Z" fill="#dd7424"/>' +
    '<ellipse cx="60" cy="66" rx="5.2" ry="4.2" fill="#e7a07a"/>' +
    '<circle cx="42" cy="65" r="5" fill="#ee8a78" opacity=".45"/><circle cx="78" cy="65" r="5" fill="#ee8a78" opacity=".45"/>' +
    '<ellipse cx="49" cy="56" rx="3.3" ry="4.3" fill="#2a1b10"/><ellipse cx="71" cy="56" rx="3.3" ry="4.3" fill="#2a1b10"/><circle cx="50" cy="54.6" r="1.2" fill="#fff"/><circle cx="72" cy="54.6" r="1.2" fill="#fff"/>' +
    '<ellipse class="eyelid" cx="49" cy="56" rx="3.6" ry="4.6" fill="#f1caa2"/><ellipse class="eyelid" cx="71" cy="56" rx="3.6" ry="4.6" fill="#f1caa2"/>' +
    '<path d="M44 49Q49 46 54 49M66 49Q71 46 76 49" stroke="#b9621f" stroke-width="2" stroke-linecap="round" fill="none"/>' +
    '<path d="M32 50Q33 24 62 13Q71 9 81 15Q75 19 77 25Q89 33 88 50Q60 42 32 50Z" fill="#c1572b"/>' +
    '<path d="M32 50Q60 42 88 50L88 55Q60 47 32 55Z" fill="#e8b94d"/><g fill="#c1572b"><circle cx="46" cy="50" r="1.4"/><circle cx="60" cy="48.6" r="1.4"/><circle cx="74" cy="50" r="1.4"/></g>' +
    '<g class="prop p-snow"><path d="M37 91Q60 101 83 91L83 99Q60 109 37 99Z" fill="#c8433a"/><path d="M70 100L74 116" stroke="#c8433a" stroke-width="6" stroke-linecap="round"/></g>' +
    '<g class="prop p-hot"><ellipse cx="60" cy="31" rx="36" ry="8" fill="#ead595" stroke="#b99a46" stroke-width="1.5"/><path d="M42 31Q44 16 60 16Q76 16 78 31Z" fill="#ead595" stroke="#b99a46" stroke-width="1.5"/><path d="M43 27Q60 31 77 27" stroke="#c8433a" stroke-width="3" fill="none"/></g>' +
    '<g class="prop p-rain"><path d="M8 34Q60 -14 112 34Q100 27 88 34Q74 26 60 34Q46 26 32 34Q20 27 8 34Z" fill="#3b78a8" transform="translate(0,-6)"/><path d="M60 28L60 8" stroke="#2a587e" stroke-width="2"/></g>' +
    '<g class="prop p-night"><circle class="lantern-glow" cx="22" cy="118" r="17" fill="rgba(255,225,120,.45)"/><rect x="16" y="110" width="12" height="16" rx="2" fill="#f0c24a" stroke="#8a6a3a" stroke-width="1.5"/><path d="M18 110Q22 103 26 110" stroke="#8a6a3a" stroke-width="1.5" fill="none"/></g>' +
    '</g></svg>';

  function el(tag, cls, html) { var e = document.createElement(tag); if (cls) { e.className = cls; } if (html) { e.innerHTML = html; } return e; }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  function url(u) { return /^(https?:|mailto:)/.test(u) ? u : ROOT + u; }

  // ---- маскот ----
  var wrap = el("button", "dm-wrap hi", SVG);
  wrap.type = "button"; wrap.setAttribute("aria-label", "Спросите домовёнка"); wrap.setAttribute("aria-expanded", "false");
  var hint = el("div", "dm-hint", "Спросите домовёнка");
  var box = el("section", "dm-box"); box.id = "dm-box"; box.hidden = true; box.setAttribute("role", "dialog"); box.setAttribute("aria-label", "Домовёнок, помощник по сайту");
  box.innerHTML = '<div class="dm-head"><b>Домовёнок</b><button type="button" id="dm-x" aria-label="Закрыть"><svg class="ico" viewBox="0 0 24 24"><use href="#i-close"/></svg></button></div>' +
    '<div class="dm-msgs" id="dm-msgs" aria-live="polite"></div><div class="dm-chips" id="dm-chips"></div>' +
    '<form class="dm-form" id="dm-form"><input id="dm-q" type="text" autocomplete="off" placeholder="Спросите домовёнка" aria-label="Спросите домовёнка"><button type="submit" aria-label="Отправить"><svg class="ico" viewBox="0 0 24 24"><use href="#i-send"/></svg></button></form>' +
    '<div class="dm-foot">Домовёнок нарисован для Домового News. ' + esc(A.privacy || "") + "</div>";
  document.body.appendChild(wrap); document.body.appendChild(hint); document.body.appendChild(box);

  // состояние маскота: погода, ночь, жара
  function hourNow() { try { return parseInt(new Intl.DateTimeFormat("ru-RU", { hour: "numeric", hour12: false, timeZone: TZ }).format(new Date()), 10) % 24; } catch (e) { return new Date().getHours(); } }
  function state() {
    var h = document.getElementById("hero");
    var wx = h ? h.getAttribute("data-weather") : "", t = h ? parseInt(h.getAttribute("data-temp"), 10) : NaN;
    var night = h ? h.getAttribute("data-tod") === "night" : (hourNow() >= 21 || hourNow() < 6);
    if (wx === "rain") { return "rain"; }
    if (wx === "snow" || (!isNaN(t) && t <= -5)) { return "snow"; }
    if (!isNaN(t) && t >= 28) { return "hot"; }
    return night ? "night" : "";
  }
  var svg = wrap.querySelector("svg");
  function setState() { svg.setAttribute("data-state", state()); }
  setState();
  if (reduce) { svg.querySelectorAll(".arm-w, .eyelid, .body-all").forEach(function (n) { n.style.animation = "none"; }); }
  setTimeout(function () { wrap.classList.remove("hi"); }, 6500);
  setTimeout(function () { if (box.hidden) { hint.classList.add("show"); setTimeout(function () { hint.classList.remove("show"); }, 5000); } }, 4000);

  // ---- диалог ----
  var msgs = document.getElementById("dm-msgs"), chips = document.getElementById("dm-chips"), form = document.getElementById("dm-form"), input = document.getElementById("dm-q");
  function openBox() { box.hidden = false; wrap.setAttribute("aria-expanded", "true"); hint.classList.remove("show"); if (!msgs.children.length) { say(A.hello || "Здравствуйте!", null, true); } input.focus(); }
  function closeBox() { box.hidden = true; wrap.setAttribute("aria-expanded", "false"); }
  wrap.addEventListener("click", function () { box.hidden ? openBox() : closeBox(); });
  document.getElementById("dm-x").addEventListener("click", closeBox);

  (A.chips || []).forEach(function (c) {
    var b = el("button", "", esc(c.t)); b.type = "button";
    b.addEventListener("click", function () { ask(c.t, c.action); });
    chips.appendChild(b);
  });

  function say(text, links, instant, me) {
    var m = el("div", "dm-m" + (me ? " me" : ""));
    msgs.appendChild(m);
    var finish = function () {
      if (links && links.length) {
        var l = el("div", "dm-links");
        links.forEach(function (x) { l.appendChild(el("a", "", esc(x.t) + (x.s ? "<small>" + esc(x.s) + "</small>" : ""))).href = url(x.u); });
        m.appendChild(l);
      }
      msgs.scrollTop = msgs.scrollHeight;
    };
    if (me || instant || reduce || text.length > 260) { m.textContent = text; finish(); return; }
    var i = 0;   // «печатающийся» текст
    var t = setInterval(function () { i += 2; m.textContent = text.slice(0, i); msgs.scrollTop = msgs.scrollHeight; if (i >= text.length) { clearInterval(t); finish(); } }, 16);
  }

  function stems(q) { return q.toLowerCase().replace(/ё/g, "е").split(/[^a-zа-я0-9]+/).filter(function (w) { return w.length >= 3; }).map(function (w) { return w.slice(0, Math.max(4, w.length - 2)); }); }
  function todayIso() { var p = new Intl.DateTimeFormat("en-CA", { timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date()); return p; }
  function dateIn(q) {
    var s = q.toLowerCase();
    var t = todayIso();
    if (/сегодня/.test(s)) { return t; }
    if (/вчера/.test(s)) { var d = new Date(); d.setDate(d.getDate() - 1); return new Intl.DateTimeFormat("en-CA", { timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit" }).format(d); }
    var m = /(\d{1,2})\s+([а-я]+)/.exec(s);
    if (m) { for (var i = 0; i < 12; i++) { if (MONTHS_G[i].indexOf(m[2].slice(0, 4)) === 0) { return t.slice(0, 4) + "-" + ("0" + (i + 1)).slice(-2) + "-" + ("0" + m[1]).slice(-2); } } }
    return "";
  }
  function search(q) {
    var st = stems(q), di = dateIn(q), out = [];
    IDX.forEach(function (a) {
      var t = a.t.toLowerCase().replace(/ё/g, "е"), l = (a.l || "").toLowerCase().replace(/ё/g, "е"), r = (a.r || "").toLowerCase().replace(/ё/g, "е"), score = 0;
      st.forEach(function (w) { if (t.indexOf(w) !== -1) { score += 3; } if (r.indexOf(w) !== -1) { score += 2; } if (l.indexOf(w) !== -1) { score += 1; } });
      if (di && a.i === di) { score += 4; }
      if (score > 0) { out.push({ a: a, s: score }); }
    });
    out.sort(function (x, y) { return y.s - x.s; });
    return out.slice(0, 5).map(function (x) { return { t: x.a.t, u: x.a.u, s: x.a.d + (x.a.r ? " · " + x.a.r : "") }; });
  }
  function faqFor(q) {
    var s = q.toLowerCase().replace(/ё/g, "е"), best = null, bs = 0;
    (A.faq || []).forEach(function (f) {
      var n = 0; (f.keys || []).forEach(function (k) { if (s.indexOf(k.toLowerCase().replace(/ё/g, "е")) !== -1) { n++; } });
      if (n > bs) { bs = n; best = f; }
    });
    return best;
  }
  function latest() { return IDX.slice().sort(function (x, y) { return (y.i || "").localeCompare(x.i || ""); }).slice(0, 5).map(function (a) { return { t: a.t, u: a.u, s: a.d + (a.r ? " · " + a.r : "") }; }); }

  function ask(text, action) {
    say(text, null, true, true);
    if (action === "today") {
      var t = todayIso(), items = IDX.filter(function (a) { return a.i === t; }).map(function (a) { return { t: a.t, u: a.u, s: a.r }; });
      if (items.length) { say("Новости за сегодня:", items); } else { say("Сегодня материалов пока нет, вот последние:", latest()); }
      return;
    }
    if (action === "rubrics") { say("Рубрики сайта:", (A.rubrics || []).map(function (r) { return { t: r.n, u: r.u }; })); return; }
    var f = null;
    if (action && action.indexOf("faq:") === 0) { var id = action.slice(4); (A.faq || []).forEach(function (x) { if (x.id === id) { f = x; } }); } else { f = faqFor(text); }
    var found = search(text);
    if (f) {
      say(f.a, (f.links || []).map(function (l) { return { t: l.t, u: l.u }; }));
      return;
    }
    if (found.length) { say(A.fallback || "Вот что нашёл:", found); return; }
    var links = A.bot ? [{ t: "Предложить тему через Telegram-бот", u: A.bot }] : [{ t: "Предложить тему", u: "suggest.html" }];
    say(A.nothing || "Ничего не нашёл.", links);
  }
  form.addEventListener("submit", function (e) { e.preventDefault(); var q = input.value.trim(); if (!q) { return; } input.value = ""; ask(q, ""); });
})();
