// Домовой News: меню, часы Петропавловска, календарь с архивом по дням, раскрывающиеся плашки. Без библиотек.
(function () {
  var TZ = "Asia/Almaty";
  var MONTHS = ["Январь", "Февраль", "Март", "Апрель", "Май", "Июнь", "Июль", "Август", "Сентябрь", "Октябрь", "Ноябрь", "Декабрь"];
  var MONTHS_G = ["января", "февраля", "марта", "апреля", "мая", "июня", "июля", "августа", "сентября", "октября", "ноября", "декабря"];
  var DOW = ["пн", "вт", "ср", "чт", "пт", "сб", "вс"];
  var WEEK = ["воскресенье", "понедельник", "вторник", "среда", "четверг", "пятница", "суббота"];

  // ---- меню ----
  var menu = document.getElementById("menu"), shade = document.getElementById("menu-shade"), openBtn = document.getElementById("menu-open"), closeBtn = document.getElementById("menu-close");
  function openMenu() {
    if (!menu) { return; }
    menu.hidden = false; shade.hidden = false;
    requestAnimationFrame(function () { menu.classList.add("open"); shade.classList.add("open"); });
    openBtn.setAttribute("aria-expanded", "true");
    var f = menu.querySelector("input,a"); if (f) { f.focus(); }
  }
  function closeMenu() {
    if (!menu || menu.hidden) { return; }
    menu.classList.remove("open"); shade.classList.remove("open");
    openBtn.setAttribute("aria-expanded", "false");
    setTimeout(function () { menu.hidden = true; shade.hidden = true; }, 280);
    openBtn.focus();
  }
  if (openBtn) { openBtn.addEventListener("click", openMenu); }
  if (closeBtn) { closeBtn.addEventListener("click", closeMenu); }
  if (shade) { shade.addEventListener("click", closeMenu); }

  // ---- переключатель анимации (запоминается) ----
  var mt = document.getElementById("motion-toggle");
  if (mt) {
    mt.addEventListener("click", function () {
      var on = mt.getAttribute("aria-pressed") === "true";
      try { localStorage.setItem("motion", on ? "off" : "on"); } catch (e) {}
      document.documentElement.setAttribute("data-motion", on ? "off" : "on");
      document.dispatchEvent(new Event("motionchange"));
    });
  }

  // ---- часы: время Петропавловска, обновляется раз в секунду; меняется только текст, поэтому мерцания нет ----
  var clock = document.getElementById("clock"), cdate = document.getElementById("clock-date");
  function parts() {
    var f = new Intl.DateTimeFormat("ru-RU", { timeZone: TZ, hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false, year: "numeric", month: "numeric", day: "numeric", weekday: "long" });
    var o = {}; f.formatToParts(new Date()).forEach(function (p) { o[p.type] = p.value; });
    return o;
  }
  var lastDate = "";
  function tick() {
    if (!clock) { return; }
    try {
      var p = parts();
      var t = p.hour + ":" + p.minute + ":" + p.second;
      if (clock.textContent !== t) { clock.textContent = t; }
      var d = p.weekday + ", " + parseInt(p.day, 10) + " " + MONTHS_G[parseInt(p.month, 10) - 1];
      if (d !== lastDate && cdate) { cdate.textContent = d; lastDate = d; }
    } catch (e) {}
  }
  if (clock) { tick(); setInterval(tick, 1000); }

  // ---- всплывающие плашки ----
  var pops = [];
  function place(pop, anchor) {
    var r = anchor.getBoundingClientRect();
    pop.style.left = Math.max(8, Math.min(window.scrollX + r.left, window.scrollX + document.documentElement.clientWidth - pop.offsetWidth - 8)) + "px";
    pop.style.top = (window.scrollY + r.bottom + 8) + "px";
  }
  function closeAll(except) {
    pops.forEach(function (p) {
      if (p.pop !== except) { p.pop.hidden = true; p.btn.setAttribute("aria-expanded", "false"); }
    });
  }
  function bindPop(btnId, popId, onOpen) {
    var btn = document.getElementById(btnId), pop = document.getElementById(popId);
    if (!btn || !pop) { return; }
    pops.push({ btn: btn, pop: pop });
    btn.addEventListener("click", function (e) {
      e.stopPropagation();
      var show = pop.hidden;
      closeAll(show ? pop : null);
      pop.hidden = !show;
      btn.setAttribute("aria-expanded", show ? "true" : "false");
      if (show) { if (onOpen) { onOpen(); } place(pop, btn); }
    });
    pop.addEventListener("click", function (e) { e.stopPropagation(); });
  }

  // ---- календарь ----
  var days = window.NEWS_DAYS || {};
  var view = null;
  function nowParts() { var p = parts(); return { y: parseInt(p.year, 10), m: parseInt(p.month, 10) - 1, d: parseInt(p.day, 10) }; }
  function iso(y, m, d) { return y + "-" + ("0" + (m + 1)).slice(-2) + "-" + ("0" + d).slice(-2); }
  function renderCal() {
    var grid = document.getElementById("cal-grid"), title = document.getElementById("cal-title");
    if (!grid) { return; }
    var today = nowParts();
    title.textContent = MONTHS[view.m] + " " + view.y;
    var first = new Date(Date.UTC(view.y, view.m, 1)).getUTCDay();   // 0 = воскресенье
    var lead = (first + 6) % 7;
    var count = new Date(Date.UTC(view.y, view.m + 1, 0)).getUTCDate();
    var html = DOW.map(function (d) { return '<span class="dow">' + d + "</span>"; }).join("");
    for (var i = 0; i < lead; i++) { html += "<span></span>"; }
    for (var d = 1; d <= count; d++) {
      var key = iso(view.y, view.m, d), has = days[key];
      var cls = (has ? "has " : "") + (today.y === view.y && today.m === view.m && today.d === d ? "today" : "");
      html += '<button type="button" role="gridcell" class="' + cls + '" data-day="' + key + '"' + (has ? "" : " disabled") + ' aria-label="' + d + " " + MONTHS_G[view.m] + (has ? ", материалов: " + has : ", материалов нет") + '">' + d + "</button>";
    }
    grid.innerHTML = html;
  }
  var calBtn = document.getElementById("sc-today");
  if (calBtn) {
    bindPop("sc-today", "pop-cal", function () { var t = nowParts(); if (!view) { view = { y: t.y, m: t.m }; } renderCal(); });
    var grid = document.getElementById("cal-grid");
    grid.addEventListener("click", function (e) {
      var b = e.target.closest("button[data-day]");
      if (b && !b.disabled) { location.href = "archive/" + b.getAttribute("data-day") + ".html"; }
    });
    grid.addEventListener("keydown", function (e) {
      var b = e.target.closest("button"); if (!b) { return; }
      var all = Array.prototype.slice.call(grid.querySelectorAll("button")), i = all.indexOf(b), step = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7 }[e.key];
      if (step && all[i + step]) { e.preventDefault(); all[i + step].focus(); }
    });
    document.getElementById("cal-prev").addEventListener("click", function () { view.m--; if (view.m < 0) { view.m = 11; view.y--; } renderCal(); });
    document.getElementById("cal-next").addEventListener("click", function () { view.m++; if (view.m > 11) { view.m = 0; view.y++; } renderCal(); });
    document.getElementById("cal-close").addEventListener("click", function () { closeAll(null); });
  }
  bindPop("sc-rates", "pop-rates");

  document.addEventListener("click", function () { closeAll(null); });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") { closeAll(null); closeMenu(); var box = document.getElementById("dm-box"); if (box && !box.hidden) { box.hidden = true; } }
  });
  window.addEventListener("resize", function () { pops.forEach(function (p) { if (!p.pop.hidden) { place(p.pop, p.btn); } }); });

  // ---- блок погоды в hero на телефоне ----
  var hw = document.getElementById("hw"), chip = hw && hw.querySelector(".hw-chip");
  if (chip) {
    chip.addEventListener("click", function () { var o = hw.classList.toggle("open"); chip.setAttribute("aria-expanded", o ? "true" : "false"); });
  }
})();

// ---- «Ваш Петропавловск»: фото крупно ----
(function () {
  document.addEventListener("click", function (e) {
    var a = e.target.closest && e.target.closest("a.yt-a");
    if (!a) { return; }
    e.preventDefault();
    var lb = document.createElement("div");
    lb.className = "lb"; lb.setAttribute("role", "dialog"); lb.setAttribute("aria-modal", "true");
    lb.innerHTML = '<button type="button" aria-label="Закрыть">×</button><img alt=""><p></p>';
    lb.querySelector("img").src = a.getAttribute("href");
    lb.querySelector("p").innerHTML = a.getAttribute("data-cap") || "";
    function close() { lb.remove(); document.removeEventListener("keydown", onKey); }
    function onKey(ev) { if (ev.key === "Escape") { close(); } }
    lb.addEventListener("click", function (ev) { if (ev.target !== lb.querySelector("img")) { close(); } });
    document.addEventListener("keydown", onKey);
    document.body.appendChild(lb);
    lb.querySelector("button").focus();
  });
})();

// ---- короткое превью видео в карточках: играет при наведении и на экране телефона, когда карточка в поле зрения ----
(function () {
  var vids = document.querySelectorAll("video.card-pv");
  if (!vids.length) { return; }
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches && document.documentElement.getAttribute("data-motion") !== "on";
  function load(v) { if (!v.src) { v.src = v.getAttribute("data-src"); } }
  vids.forEach(function (v) {
    var card = v.closest("a");
    if (reduce) { return; }
    card.addEventListener("mouseenter", function () { load(v); v.play().catch(function () {}); });
    card.addEventListener("mouseleave", function () { v.pause(); });
  });
  if ("IntersectionObserver" in window && !reduce && window.matchMedia("(pointer: coarse)").matches) {
    var io = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { load(e.target); e.target.play().catch(function () {}); } else { e.target.pause(); } }); }, { threshold: 0.6 });
    vids.forEach(function (v) { io.observe(v); });
  }
})();
