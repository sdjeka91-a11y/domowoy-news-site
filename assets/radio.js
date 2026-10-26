/* «Радио Домовой»: мини-плеер в шапке. Играет открытую музыку (config/radio_tracks.json) и станции с разрешением (radio.json → stations).
   Не включается сам. Выбор, трек и позиция запоминаются; при переходе на другую страницу воспроизведение продолжается с того же места (если браузер разрешает звук). */
(function () {
  var D = window.DM_RADIO || {};
  var items = (D.tracks || []).map(function (t) { t.live = false; return t; }).concat((D.stations || []).map(function (s) { return { id: s.id, title: s.name, author: "прямой эфир", license: "по разрешению станции", file: s.stream, live: true, url: "" }; }));
  if (!items.length) return;
  var sc = document.currentScript || document.querySelector('script[src*="radio.js"]');
  var root = sc ? sc.src.replace(/assets\/radio\.js.*$/, "") : "";
  var KEY = "dm-radio", st = {};
  try { st = JSON.parse(localStorage.getItem(KEY) || "{}"); } catch (e) {}
  var i = Math.min(Math.max(+st.i || 0, 0), items.length - 1);
  var audio = new Audio();
  audio.preload = "none";
  audio.volume = st.v == null ? 0.7 : Math.min(1, Math.max(0, +st.v));

  var top = document.querySelector(".top"), grow = document.querySelector(".toprow .grow");
  var box = document.createElement("div");
  box.className = "radio";
  box.innerHTML = '<button type="button" class="iconbtn rbtn" aria-label="Радио Домовой: играть" aria-pressed="false" title="Радио Домовой">▶</button>' +
    '<button type="button" class="iconbtn rnext" aria-label="Следующий трек" title="Следующий трек">⏭</button>' +
    '<input class="rvol" type="range" min="0" max="1" step="0.05" aria-label="Громкость" title="Громкость">';
  var line = document.createElement("div");
  line.className = "radio-line";
  line.hidden = true;
  line.setAttribute("role", "status");
  if (grow && grow.parentNode) grow.parentNode.insertBefore(box, grow.nextSibling);
  if (top) top.appendChild(line);
  var btn = box.querySelector(".rbtn"), nxt = box.querySelector(".rnext"), vol = box.querySelector(".rvol");
  vol.value = audio.volume;

  function save() {
    try { localStorage.setItem(KEY, JSON.stringify({ i: i, t: audio.currentTime || 0, v: audio.volume, on: !audio.paused, ts: Date.now() })); } catch (e) {}
  }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  function show(msg) {
    var t = items[i];
    var by = t.live ? "" : esc(t.author) + ", " + esc(t.license);
    line.hidden = false;
    line.innerHTML = '<span class="rdot" aria-hidden="true">♪</span> ' + (msg ? esc(msg) + " " : "Сейчас играет: ") + '<b>' + esc(t.title) + '</b>' + (by ? " — " + by : "") +
      ' <a href="' + root + 'radio.html">все треки</a>';
  }
  function paint() {
    var on = !audio.paused;
    btn.textContent = on ? "❚❚" : "▶";
    btn.setAttribute("aria-pressed", on ? "true" : "false");
    btn.setAttribute("aria-label", on ? "Радио Домовой: пауза" : "Радио Домовой: играть");
    document.querySelectorAll(".rplay").forEach(function (b) { var me = +b.dataset.i === i && on; b.textContent = me ? "❚❚" : "▶"; b.classList.toggle("on", me); });
    if (on && "mediaSession" in navigator) {
      try { navigator.mediaSession.metadata = new MediaMetadata({ title: items[i].title, artist: items[i].author, album: "Радио Домовой" }); } catch (e) {}
    }
  }
  function load(n, at) {
    i = (n + items.length) % items.length;
    var f = items[i].file;
    audio.src = /^https?:/.test(f) ? f : root + f;
    if (at) { audio.addEventListener("loadedmetadata", function seek() { try { audio.currentTime = at; } catch (e) {} audio.removeEventListener("loadedmetadata", seek); }); }
    show();
  }
  function play(msgOnFail) {
    var p = audio.play();
    if (p && p.catch) p.catch(function () { paint(); if (msgOnFail) show("Нажмите ▶, чтобы продолжить:"); });
  }
  function toggle() { if (!audio.src) load(i); if (audio.paused) play(); else audio.pause(); }

  btn.onclick = toggle;
  nxt.onclick = function () { var was = !audio.paused; load(i + 1); if (was || true) play(); };
  vol.oninput = function () { audio.volume = +vol.value; save(); };
  audio.addEventListener("play", function () { paint(); show(); save(); });
  audio.addEventListener("pause", function () { paint(); save(); });
  audio.addEventListener("ended", function () { load(i + 1); play(); });
  audio.addEventListener("error", function () { if (audio.src) show("Не удалось загрузить трек:"); });
  audio.addEventListener("timeupdate", function () { if (!audio._s || Date.now() - audio._s > 1000) { audio._s = Date.now(); save(); } });
  window.addEventListener("pagehide", save);
  if ("mediaSession" in navigator) {
    try {
      navigator.mediaSession.setActionHandler("play", function () { play(); });
      navigator.mediaSession.setActionHandler("pause", function () { audio.pause(); });
      navigator.mediaSession.setActionHandler("nexttrack", function () { load(i + 1); play(); });
    } catch (e) {}
  }

  // Страница «Радио»: кнопки у треков и «Играть всё подряд»
  document.querySelectorAll(".rplay").forEach(function (b) {
    b.onclick = function () { var n = +b.dataset.i; if (n === i && audio.src) { toggle(); } else { load(n); play(); } };
  });
  var all = document.getElementById("radio-all");
  if (all) all.onclick = function () { load(0); play(); };

  // Продолжение после перехода на другую страницу: трек и место запоминаются. Если звук был включён, пробуем продолжить; браузер может потребовать нажать ▶.
  if (st.on) {
    var gap = Math.max(0, (Date.now() - (+st.ts || 0)) / 1000);
    load(i, (+st.t || 0) + (gap < 20 ? gap : 0));
    play(true);
  } else if (st.i != null && st.ts && Date.now() - st.ts < 3600 * 1000) {
    load(i, +st.t || 0);
  }
  paint();
})();
