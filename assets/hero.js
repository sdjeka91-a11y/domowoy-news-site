// Домовой News: первый экран. Видео тулпара в два слоя (двойная буферизация), анимация по умолчанию включена и на телефоне.
// Отключается только при настройке «уменьшить движение» или явной экономии трафика (Save-Data), и это можно переопределить кнопкой в меню или «Воспроизвести».
// Отладка: ?novideo=1 (без видео) ?nofx=1 (без погодных слоёв) ?noblur=1 (без размытия) ?nodim=1 (без тонировки). Проверка состояний: #tod=night&wx=snow (wx: clear, cloudy, rain, snow, fog, thunder)
(function () {
  var hero = document.getElementById("hero");
  var root = document.documentElement;
  var q = new URLSearchParams(location.search);
  if (q.get("noblur") === "1") { root.classList.add("noblur"); }

  // высота шапки для расчёта высоты первого экрана
  function measure() {
    var h = 0;
    ["ticker", "top", "navbar"].forEach(function (c) {
      var el = document.querySelector("." + c) || document.getElementById(c);
      if (el) { h += el.offsetHeight; }
    });
    var bar = document.querySelector(".testbar");
    if (bar) { h += bar.offsetHeight; }
    root.style.setProperty("--hdr", h + "px");
  }
  measure();
  window.addEventListener("resize", measure);
  window.addEventListener("load", measure);
  if (!hero) { return; }

  function hourNow() {
    try { return parseInt(new Intl.DateTimeFormat("ru-RU", { hour: "numeric", hour12: false, timeZone: "Asia/Almaty" }).format(new Date()), 10) % 24; }
    catch (e) { return new Date().getHours(); }
  }
  var hr = hourNow();
  var tod = hr >= 21 || hr < 6 ? "night" : "day";
  var m = /[#&]tod=(day|night)/.exec(location.hash);
  if (m) { tod = m[1]; }
  hero.setAttribute("data-tod", tod);
  var w = /[#&]wx=(clear|cloudy|rain|snow|fog|thunder)/.exec(location.hash);
  if (w) {
    hero.setAttribute("data-weather", w[1] === "fog" ? "cloudy" : w[1] === "thunder" ? "rain" : w[1]);
    hero.setAttribute("data-fx", w[1] === "fog" || w[1] === "thunder" ? w[1] : "");
  }
  if (q.get("nofx") === "1") { hero.classList.add("nofx"); }
  if (q.get("nodim") === "1") { hero.setAttribute("data-nodim", "1"); }

  // ---- настройка движения ----
  var reduced = !!(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  var conn = navigator.connection || {};
  var saveData = conn.saveData === true;   // только явная экономия трафика; тип сети (3g и т.п.) не считаем
  function stored() { try { return localStorage.getItem("motion"); } catch (e) { return null; } }
  function wantMotion() {
    var s = stored();
    if (s === "on") { return true; }
    if (s === "off") { return false; }
    return !(reduced || saveData);
  }
  var playBtn = document.getElementById("hero-play");
  var a = hero.querySelector(".hv-a"), b = hero.querySelector(".hv-b"), media = hero.querySelector(".hero-media");
  var cur = a, nxt = b, running = false, raf = 0, inView = true, ready = false;

  function pickSrc() {
    if (!a || !media) { return ""; }
    var small = (window.matchMedia && window.matchMedia("(max-width: 700px)").matches) || (navigator.hardwareConcurrency || 8) <= 4;  // телефон и слабый компьютер: лёгкий ролик 540p
    var mp4 = a.canPlayType('video/mp4; codecs="avc1.4D401E"') !== "";
    return media.getAttribute(mp4 ? (small ? "data-mp4-m" : "data-mp4") : (small ? "data-webm-m" : "data-webm"));
  }
  function prepare() {
    if (ready || !a) { return; }
    var src = pickSrc();
    if (!src) { return; }
    [a, b].forEach(function (v) { v.muted = true; v.defaultMuted = true; v.setAttribute("muted", ""); v.setAttribute("playsinline", ""); v.loop = false; v.src = src; v.load(); });
    ready = true;
  }
  function tick() {
    raf = 0;
    if (!running) { return; }
    var d = cur.duration;
    if (d && isFinite(d) && cur.currentTime >= d - 0.5 && !tick.swapping) { swap(); }
    raf = requestAnimationFrame(tick);
  }
  function swap() {
    // второй слой уже готов на первом кадре: запускаем его чуть раньше конца первого и плавно меняем слои по opacity
    tick.swapping = true;
    var from = cur, to = nxt;
    try { to.currentTime = 0; } catch (e) {}
    var p = to.play();
    var go = function () {
      to.classList.add("on");
      from.classList.remove("on");
      cur = to; nxt = from;
      setTimeout(function () { try { from.pause(); from.currentTime = 0; } catch (e) {} tick.swapping = false; }, 600);
    };
    if (p && p.then) { p.then(go, function () { tick.swapping = false; showPlay(); }); } else { go(); }
  }
  function showPlay() { if (playBtn) { playBtn.hidden = false; } }
  function start() {
    if (running) { return; }
    prepare();
    if (!a) { return; }
    hero.classList.remove("paused");
    var p = cur.play();
    var ok = function () {
      running = true;
      if (playBtn) { playBtn.hidden = true; }
      cur.classList.add("on");
      setTimeout(function () { hero.classList.add("vready"); }, 480);   // постер уходит только после первого запуска и не возвращается
      if (!raf) { raf = requestAnimationFrame(tick); }
    };
    if (p && p.then) { p.then(ok, function () { showPlay(); }); } else { ok(); }
  }
  function stop() {
    running = false;
    if (raf) { cancelAnimationFrame(raf); raf = 0; }
    [a, b].forEach(function (v) { if (v) { try { v.pause(); } catch (e) {} } });
  }
  function resume() { if (!running && ready && wantMotion() && inView && !document.hidden && q.get("novideo") !== "1") { var p = cur.play(); if (p && p.then) { p.then(function () { running = true; if (!raf) { raf = requestAnimationFrame(tick); } }, function () {}); } } }

  function apply() {
    var on = wantMotion() && q.get("novideo") !== "1";
    var btn = document.getElementById("motion-toggle");
    if (btn) {
      btn.setAttribute("aria-pressed", on ? "true" : "false");
      var t = btn.querySelector("span");
      if (t) { t.textContent = on ? "Анимация: включена" : "Анимация: выключена"; }
    }
    root.setAttribute("data-motion", wantMotion() ? (stored() === "on" ? "on" : "auto") : "off");
    if (on) { start(); }
    else {
      stop();
      hero.classList.add("paused");
      if (reduced && stored() !== "off" && q.get("novideo") !== "1") { showPlay(); }   // видео отключено настройкой устройства: даём кнопку «Воспроизвести»
    }
  }
  if (playBtn) {
    playBtn.addEventListener("click", function () {
      try { localStorage.setItem("motion", "on"); } catch (e) {}
      root.setAttribute("data-motion", "on");
      hero.classList.remove("paused");
      running = false;
      prepare();
      start();
      apply();
    });
  }
  document.addEventListener("motionchange", apply);
  document.addEventListener("visibilitychange", function () { if (document.hidden) { stop(); } else { resume(); } });
  if ("IntersectionObserver" in window) {
    new IntersectionObserver(function (e) { inView = e[0].isIntersecting; if (!inView) { stop(); } else { resume(); } }).observe(hero);
  }
  apply();

  // ---- звук (необязательный, по умолчанию выключен) ----
  var sbtn = document.getElementById("hero-sound");
  if (sbtn) {
    sbtn.hidden = false;
    var audio = null, on = false;
    function setSound(v) {
      on = v;
      sbtn.setAttribute("aria-pressed", v ? "true" : "false");
      sbtn.setAttribute("aria-label", v ? "Выключить звук" : "Включить звук");
      sbtn.innerHTML = '<svg class="ico" viewBox="0 0 24 24" aria-hidden="true"><use href="#i-' + (v ? "sound" : "mute") + '"/></svg>';
      try { localStorage.setItem("sound", v ? "on" : "off"); } catch (e) {}
      if (v) {
        if (!audio) { audio = new Audio(sbtn.getAttribute("data-src")); audio.loop = true; audio.volume = 0.35; }
        audio.play().catch(function () {});
      } else if (audio) { audio.pause(); }
    }
    sbtn.addEventListener("click", function () { setSound(!on); });
    document.addEventListener("visibilitychange", function () { if (audio && on) { document.hidden ? audio.pause() : audio.play().catch(function () {}); } });
  }
})();
