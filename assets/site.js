// Домовой News: приветствие и дата по времени Петропавловска (UTC+5), карусель, вкладки, поиск, появление блоков, лёгкий параллакс. Без библиотек.
(function () {
  var TZ = "Asia/Almaty";
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function hourNow() {
    try { return parseInt(new Intl.DateTimeFormat("ru-RU", { hour: "numeric", hour12: false, timeZone: TZ }).format(new Date()), 10) % 24; }
    catch (e) { return new Date().getHours(); }
  }
  var greet = document.getElementById("greeting");
  if (greet) {
    var h = hourNow();
    var text = h >= 5 && h < 12 ? "Доброе утро" : h >= 12 && h < 18 ? "Добрый день" : h >= 18 && h < 23 ? "Добрый вечер" : "Доброй ночи";
    greet.textContent = text + ", Петропавловск";
  }
  var dateEl = document.getElementById("today");
  if (dateEl) {
    try { dateEl.textContent = new Intl.DateTimeFormat("ru-RU", { weekday: "long", day: "numeric", month: "long", timeZone: TZ }).format(new Date()); } catch (e) {}
  }

  // Первый экран: видео с тулпаром, погода и время суток. Проверка вручную: index.html#wx=snow&tod=night (wx: clear, cloudy, rain, snow, fog, thunder)
  var heroEl = document.querySelector(".hero");
  if (heroEl) {
    var hr = hourNow();
    var tod = hr >= 21 || hr < 6 ? "night" : "day";
    var forced = /[#&]tod=(day|night)/.exec(location.hash);
    if (forced) { tod = forced[1]; }
    heroEl.setAttribute("data-tod", tod);
    var fw = /[#&]wx=(clear|cloudy|rain|snow|fog|thunder)/.exec(location.hash);
    if (fw) {
      heroEl.setAttribute("data-weather", fw[1] === "fog" || fw[1] === "thunder" ? (fw[1] === "thunder" ? "rain" : "cloudy") : fw[1]);
      heroEl.setAttribute("data-fx", fw[1] === "fog" || fw[1] === "thunder" ? fw[1] : "");
    }
    var hw = heroEl.querySelector(".hw"), hwBtn = heroEl.querySelector(".hw-toggle");
    if (hw && hwBtn) { hwBtn.addEventListener("click", function () { var o = hw.classList.toggle("open"); hwBtn.setAttribute("aria-expanded", o ? "true" : "false"); }); }
    var video = heroEl.querySelector(".hero-video");
    var conn = navigator.connection || {};
    var slow = conn.saveData || /(^|-)2g$|3g/.test(conn.effectiveType || "");
    if (reduce || slow || /[#&]still/.test(location.hash)) {
      heroEl.classList.add("paused");  // постер вместо видео, слои стоят
    } else if (video) {
      var small = (window.matchMedia && window.matchMedia("(max-width: 700px)").matches) || (navigator.hardwareConcurrency || 8) <= 4;  // телефон и слабые компьютеры: лёгкий ролик 540p
      var can = function (t) { return video.canPlayType(t) !== ""; };
      var src = can('video/mp4; codecs="avc1.4D401E"') ? (small ? video.getAttribute("data-mp4-m") : video.getAttribute("data-mp4"))
        : (small ? video.getAttribute("data-webm-m") : video.getAttribute("data-webm"));
      video.muted = true;
      video.src = src;
      video.addEventListener("playing", function () { video.classList.add("on"); }, { once: true });
      var tryPlay = function () { var r = video.play(); if (r && r.catch) { r.catch(function () {}); } };
      tryPlay();
      // экономим слабый ноутбук: пауза, когда вкладка скрыта или первый экран прокручен
      var inView = true;
      var sync = function () { if (document.hidden || !inView) { video.pause(); } else { tryPlay(); } };
      document.addEventListener("visibilitychange", sync);
      if ("IntersectionObserver" in window) { new IntersectionObserver(function (e) { inView = e[0].isIntersecting; sync(); }).observe(heroEl); }
    }
  }

  // Тёмная тема: запоминается только в браузере читателя (если хранилище недоступно, работает до закрытия страницы)
  var toggle = document.getElementById("theme-toggle");
  if (toggle) {
    var root = document.documentElement;
    var isDark = function () { var t = root.getAttribute("data-theme"); return t ? t === "dark" : !!(window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches); };
    var sync = function () { toggle.setAttribute("aria-pressed", isDark() ? "true" : "false"); };
    toggle.addEventListener("click", function () {
      var next = isDark() ? "light" : "dark";
      root.setAttribute("data-theme", next);
      try { localStorage.setItem("theme", next); } catch (e) {}
      sync();
    });
    sync();
  }

  // Появление блоков при прокрутке
  var reveals = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window && !reduce) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); } });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.05 });
    reveals.forEach(function (el) { io.observe(el); });
    // запасной путь: что уже в области видимости, показываем и без наблюдателя (медленные устройства, печать, редкие браузеры)
    var sweep = function () { reveals.forEach(function (el) { if (!el.classList.contains("in") && el.getBoundingClientRect().top < window.innerHeight) { el.classList.add("in"); io.unobserve(el); } }); };
    window.addEventListener("load", function () { setTimeout(sweep, 400); });
    window.addEventListener("scroll", function () { window.requestAnimationFrame(sweep); }, { passive: true });
  } else {
    reveals.forEach(function (el) { el.classList.add("in"); });
  }

  // Вкладки «Последние / Выбор редакции / Рубрики»
  var tabs = document.querySelectorAll('.tabs [role="tab"]');
  if (tabs.length) {
    var panels = document.querySelectorAll(".tabbed [role='tabpanel']");
    function show(tab) {
      tabs.forEach(function (t) { t.setAttribute("aria-selected", t === tab ? "true" : "false"); });
      panels.forEach(function (p) { p.hidden = p.id !== tab.getAttribute("aria-controls"); });
      tab.ownerDocument.querySelectorAll(".tabbed .reveal").forEach(function (el) { el.classList.add("in"); });
    }
    tabs.forEach(function (t) {
      t.addEventListener("click", function () { show(t); });
      t.addEventListener("keydown", function (e) {
        var i = Array.prototype.indexOf.call(tabs, t);
        if (e.key === "ArrowRight" || e.key === "ArrowLeft") { var n = tabs[(i + (e.key === "ArrowRight" ? 1 : tabs.length - 1)) % tabs.length]; n.focus(); show(n); }
      });
    });
    show(tabs[0]);
  }

  // Карусель: свайп (scroll-snap), стрелки и точки; автопрокрутки нет
  var box = document.querySelector(".carousel");
  if (box) {
    var slides = box.querySelector(".slides");
    var items = slides.children;
    var dots = box.querySelector(".dots");
    var step = function () { return items[0].offsetWidth + 16; };
    var current = function () { return Math.round(slides.scrollLeft / step()); };
    var go = function (i) { i = (i + items.length) % items.length; slides.scrollTo({ left: i * step(), behavior: reduce ? "auto" : "smooth" }); };
    for (var i = 0; i < items.length; i++) {
      (function (n) {
        var b = document.createElement("button");
        b.type = "button";
        b.setAttribute("aria-label", "Материал " + (n + 1));
        b.addEventListener("click", function () { go(n); });
        dots.appendChild(b);
      })(i);
    }
    var mark = function () { var c = current(); Array.prototype.forEach.call(dots.children, function (d, n) { d.setAttribute("aria-current", n === c ? "true" : "false"); }); };
    slides.addEventListener("scroll", function () { window.requestAnimationFrame(mark); }, { passive: true });
    slides.addEventListener("keydown", function (e) { if (e.key === "ArrowRight") { go(current() + 1); } else if (e.key === "ArrowLeft") { go(current() - 1); } });
    box.querySelector(".prev").addEventListener("click", function () { go(current() - 1); });
    box.querySelector(".next").addEventListener("click", function () { go(current() + 1); });
    mark();
  }

  // Копирование ссылки
  document.querySelectorAll(".copylink").forEach(function (b) {
    b.addEventListener("click", function () {
      var url = b.getAttribute("data-url");
      var done = function () { var s = b.querySelector("span"); var old = s.textContent; s.textContent = "Ссылка скопирована"; setTimeout(function () { s.textContent = old; }, 2000); };
      if (navigator.clipboard) { navigator.clipboard.writeText(url).then(done, function () { window.prompt("Скопируйте ссылку:", url); }); }
      else { window.prompt("Скопируйте ссылку:", url); }
    });
  });

  // Поиск по заголовкам и рубрикам (индекс assets/search-index.js)
  var q = document.getElementById("q");
  if (q && window.SEARCH_INDEX) {
    var out = document.getElementById("results"), none = document.getElementById("none");
    var esc = function (s) { return s.replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); };
    var run = function () {
      var term = q.value.trim().toLowerCase();
      var hits = term ? window.SEARCH_INDEX.filter(function (a) { return (a.t + " " + a.l + " " + a.r).toLowerCase().indexOf(term) !== -1; }) : [];
      out.innerHTML = hits.map(function (a) { return '<li><a href="' + a.u + '"><div class="meta"><span>' + esc(a.r) + "</span><span>" + esc(a.d) + "</span></div><h3>" + esc(a.t) + "</h3><p>" + esc(a.l) + "</p></a></li>"; }).join("");
      none.hidden = !term || hits.length > 0;
    };
    q.addEventListener("input", run);
    var pre = new URLSearchParams(location.search).get("q");
    if (pre) { q.value = pre; run(); }
  }
})();
