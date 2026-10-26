/* Мини-плеер радио. Работает только если в radio-data.js есть станции с разрешением (config/radio.json). Автозапуска нет. */
(function () {
  var list = window.DM_RADIO || [];
  if (!list.length) return;
  var row = document.querySelector(".toprow .grow");
  if (!row) return;
  var KEY = "dm-radio", st = {};
  try { st = JSON.parse(localStorage.getItem(KEY) || "{}"); } catch (e) {}
  var box = document.createElement("div");
  box.className = "radio";
  box.innerHTML = '<button type="button" class="iconbtn rbtn" aria-label="Радио: играть" aria-pressed="false">▶</button>' +
    '<select class="rsel" aria-label="Станция"></select>' +
    '<input class="rvol" type="range" min="0" max="1" step="0.05" aria-label="Громкость">';
  list.forEach(function (s, i) { var o = document.createElement("option"); o.value = i; o.textContent = s.name; box.querySelector("select").appendChild(o); });
  row.parentNode.insertBefore(box, row.nextSibling);
  var btn = box.querySelector(".rbtn"), sel = box.querySelector(".rsel"), vol = box.querySelector(".rvol");
  sel.value = Math.min(st.i || 0, list.length - 1);
  vol.value = st.v == null ? 0.7 : st.v;
  var audio = new Audio();
  audio.preload = "none";
  function save() { try { localStorage.setItem(KEY, JSON.stringify({ i: +sel.value, v: +vol.value })); } catch (e) {} }
  function set(on) { btn.textContent = on ? "❚❚" : "▶"; btn.setAttribute("aria-pressed", on); btn.setAttribute("aria-label", on ? "Радио: пауза" : "Радио: играть"); }
  btn.onclick = function () {
    if (!audio.paused) { audio.pause(); set(false); return; }
    audio.src = list[sel.value].stream; audio.volume = +vol.value;
    audio.play().then(function () { set(true); }).catch(function () { set(false); });
  };
  sel.onchange = function () { save(); if (!audio.paused) { audio.src = list[sel.value].stream; audio.play(); } };
  vol.oninput = function () { audio.volume = +vol.value; save(); };
})();
