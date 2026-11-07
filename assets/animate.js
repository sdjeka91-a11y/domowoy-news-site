/* Плавные анимации сайта (docs/SITE.md, раздел «Анимации»).
   Только поверх готового HTML: без JS всё читается, поисковики видят текст.
   dm-motion (движение не отключено): заголовок статьи появляется по строкам (чистый CSS, без библиотек).
   dm-gsap (ещё и мышь, ширина от 900 px): Lenis (мягкая прокрутка) + GSAP/ScrollTrigger из assets/vendor/, подгружаются после загрузки страницы.
   Телефон и планшет, «уменьшить движение»: ни Lenis, ни GSAP не загружаются; остаётся лёгкое CSS-появление (.reveal в site.js/site.css).
   Слой героя (поле, тулпар, погода, часы: .dm, .hero) не трогаем. Классы выставляет короткий скрипт в <head> (build.py). */
(function () {
  "use strict";
  var root = document.documentElement;
  if (!root.classList.contains("dm-motion")) return;

  var base = (function () {
    var s = document.currentScript || document.querySelector('script[src*="assets/animate.js"]');
    return s ? s.src.replace(/animate\.js(\?.*)?$/, "") : "assets/";
  })();

  function inHero(el) { return !!el.closest(".dm, .hero, .hero-media"); }

  /* Заголовок статьи по строкам (не по буквам): слова раскладываются в строки по смещению, каждая строка выезжает снизу из-под маски (CSS .dm-line) */
  function titleByLines() {
    var h = document.querySelector(".article > h1");
    if (!h || inHero(h) || h.dataset.split) return;
    var text = h.textContent.trim();
    var words = text.split(/\s+/);
    h.setAttribute("aria-label", text);
    h.textContent = "";
    var spans = words.map(function (w, i) {
      var s = document.createElement("span");
      s.textContent = w;
      s.style.display = "inline-block";
      h.appendChild(s);
      if (i < words.length - 1) h.appendChild(document.createTextNode(" "));
      return s;
    });
    var lines = [], top = null;
    spans.forEach(function (s) {
      var t = s.offsetTop;
      if (top === null || Math.abs(t - top) > 4) { lines.push([]); top = t; }
      lines[lines.length - 1].push(s.textContent);
    });
    h.textContent = "";
    lines.forEach(function (ws, i) {
      var mask = document.createElement("span");
      mask.className = "dm-line";
      mask.setAttribute("aria-hidden", "true");
      var inner = document.createElement("span");
      inner.style.setProperty("--i", i);
      inner.textContent = ws.join(" ");
      mask.appendChild(inner);
      h.appendChild(mask);
    });
    h.dataset.split = "1";
    h.classList.add("dm-ready");
  }
  try { titleByLines(); } catch (e) { var hh = document.querySelector(".article > h1"); if (hh) hh.classList.add("dm-ready"); }

  if (!root.classList.contains("dm-gsap")) return;

  function load(src) {
    return new Promise(function (ok, fail) {
      var el = document.createElement("script");
      el.src = base + "vendor/" + src;
      el.async = false;
      el.onload = ok;
      el.onerror = fail;
      document.head.appendChild(el);
    });
  }

  function start() {
    var gsap = window.gsap, ST = window.ScrollTrigger;
    if (!gsap || !ST) return;
    gsap.registerPlugin(ST);

    /* Мягкая прокрутка Lenis (только мышь); внутренние прокручиваемые окна (меню, помощник, поиск) остаются родными */
    if (window.Lenis) {
      document.querySelectorAll(".menu, .menu-body, .assistant, .pop, [role=dialog], textarea").forEach(function (el) { el.setAttribute("data-lenis-prevent", ""); });
      var lenis = new window.Lenis({ duration: 1.05, easing: function (t) { return 1 - Math.pow(1 - t, 3); }, smoothWheel: true, anchors: true });
      lenis.on("scroll", ST.update);
      gsap.ticker.add(function (t) { lenis.raf(t * 1000); });
      gsap.ticker.lagSmoothing(0);
      root.classList.add("dm-lenis");
    }

    /* Появление блоков: подъём 16 px и проявление, один раз; на пакет не больше 0,32 с задержки в сумме.
       Прячем только то, что ниже экрана: всё, что видно сразу, остаётся на месте (без мигания и прыжков разметки: transform не двигает соседей) */
    var sel = ".reveal, .ev, .brief, .article h2, .article blockquote, .sources, .related h2";
    var limit = window.innerHeight * 0.92;
    var targets = Array.prototype.filter.call(document.querySelectorAll(sel), function (el) {
      return !inHero(el) && el.getBoundingClientRect().top > limit;
    });
    targets.forEach(function (el) { gsap.set(el, { opacity: 0, y: 16 }); });
    ST.batch(targets, {
      start: "top 92%",
      once: true,
      onEnter: function (batch) {
        gsap.to(batch, {
          opacity: 1, y: 0, duration: 0.55, ease: "power2.out", stagger: { each: 0.06, amount: 0.32 }, overwrite: true,
          onComplete: function () { batch.forEach(function (el) { el.classList.add("in"); gsap.set(el, { clearProps: "opacity,transform" }); }); }
        });
      }
    });
    window.addEventListener("load", function () { ST.refresh(); });
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { ST.refresh(); });
  }

  // библиотеки грузим после первой отрисовки, чтобы не задерживать показ страницы; не загрузились: страница остаётся как есть
  function boot() {
    load("gsap.min.js").then(function () { return load("ScrollTrigger.min.js"); }).then(function () { return load("lenis.min.js").catch(function () {}); }).then(start).catch(function () {});
  }
  if (document.readyState === "complete") setTimeout(boot, 0);
  else window.addEventListener("load", function () { setTimeout(boot, 0); });
})();
