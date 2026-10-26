/* vocabkey.js: a word key beside a lesson's "Défi éclair" (David 2026-10-23: "vocab keys on the right so the student has
   easier access"). Finds each <div class="vkey" data-config='{"title", "groups": [{"title", "note"?, "items": [["fr", "en"], ...]}]}'>
   placed inside an activity card, moves the card's challenges into a two-column layout with the key on the right (sticky
   while the student scrolls the challenges; below them on narrow screens), and makes every French word clickable: it is
   typed into the writing box the student last used in that card (at the cursor, with spaces as needed). A reference, not
   an answer: grammar groups show every form side by side. */
(function () {
  'use strict';
  var CSS = '\
.vk-grid{display:grid;grid-template-columns:minmax(0,1fr) 270px;gap:18px;align-items:start}\
@media (max-width:820px){.vk-grid{grid-template-columns:1fr}}\
.vk-card{position:sticky;top:12px;max-height:calc(100vh - 24px);overflow:auto;background:#fbf6ea;border:1px solid #e2d6bb;border-top:3px solid #b8892e;\
border-radius:4px;padding:12px 14px;font-family:"Segoe UI",Roboto,Helvetica,Arial,sans-serif;color:#1d2a44;box-shadow:0 2px 8px rgba(60,40,10,.08)}\
.vk-h{font-family:"Cormorant Garamond",Georgia,serif;font-size:21px;font-weight:600;margin:0 0 2px}\
.vk-help{font-size:12.5px;color:#5e5a52;margin:0 0 8px;line-height:1.4}\
.vk-g{margin:10px 0 0}.vk-gt{font-size:11.5px;letter-spacing:.14em;text-transform:uppercase;color:#b8892e;font-weight:700;margin:0 0 3px}\
.vk-note{font-size:12.5px;color:#5e5a52;font-style:italic;margin:0 0 4px;line-height:1.35}\
.vk-row{display:flex;justify-content:space-between;gap:8px;align-items:baseline;padding:2px 0;border-bottom:1px dotted #e2d6bb}\
.vk-w{font-family:"Cormorant Garamond",Georgia,serif;font-size:17.5px;font-weight:600;color:#2b4c8c;background:none;border:0;padding:0;cursor:pointer;text-align:left}\
.vk-w:hover{color:#8c2f39;text-decoration:underline}\
.vk-en{font-size:12.5px;color:#5e5a52;text-align:right}\
.vk-ok{font-size:12px;color:#2f6b4f;min-height:16px;margin-top:6px}';

  function el(t, c, h) { var e = document.createElement(t); if (c) e.className = c; if (h != null) e.innerHTML = h; return e; }

  function build(key) {
    var cfg; try { cfg = JSON.parse(key.getAttribute('data-config')); } catch (e) { return; }
    var card = key.closest('.activity-card') || key.parentNode;
    var widgets = [].slice.call(card.querySelectorAll('.optima-widget'));
    if (!widgets.length) return;
    var grid = el('div', 'vk-grid'), main = el('div'), side = el('div', 'vk-card');
    widgets[0].parentNode.insertBefore(grid, widgets[0]);
    widgets.forEach(function (w) { main.appendChild(w); });
    grid.appendChild(main); grid.appendChild(side);
    var boxes = [].slice.call(main.querySelectorAll('textarea'));
    var last = boxes[0] || null;
    boxes.forEach(function (b) { b.addEventListener('focus', function () { last = b; }); });
    side.appendChild(el('div', 'vk-h', cfg.title || 'Mots utiles · Word key'));
    side.appendChild(el('div', 'vk-help', boxes.length ? 'Click a word to type it into the box you are writing in.' : 'Use these to build each sentence.'));
    var ok = el('div', 'vk-ok'); ok.setAttribute('aria-live', 'polite');
    var DET = /(?:^|\s)(ce|cet|cette|ces|mon|ma|mes|ton|ta|tes|son|sa|ses|un|une|le|la|les|des|du|de|au|en|l[’']|d[’'])\s*$/i;
    function put(form) {
      if (!last) return;
      var t = form.split('…')[0].replace(/\s+$/, '');                       // "dans le … de" types "dans le"
      var s = last.selectionStart != null ? last.selectionStart : last.value.length, en = last.selectionEnd != null ? last.selectionEnd : s;
      var before = last.value.slice(0, s);
      if (DET.test(before)) t = t.replace(/^(le |la |les |un |une |l[’'])/i, '');   // "cette" + "la région" -> "cette région"
      var glue = /[’']$/.test(before) || !before || /\s$/.test(before) ? '' : ' ', ins = glue + t + (/[’']$/.test(t) ? '' : ' ');
      last.value = before + ins + last.value.slice(en); last.focus(); last.setSelectionRange(s + ins.length, s + ins.length);
      last.dispatchEvent(new Event('input', { bubbles: true })); ok.textContent = '+ ' + t;
    }
    (cfg.groups || []).forEach(function (g) {
      var box = el('div', 'vk-g'); box.appendChild(el('div', 'vk-gt', g.title));
      if (g.note) box.appendChild(el('div', 'vk-note', g.note));
      g.items.forEach(function (it) {
        var row = el('div', 'vk-row'), forms = el('span');
        it[0].split(' · ').forEach(function (form, k) {             // "beau · bel · belle": each form is its own button
          if (k) forms.appendChild(document.createTextNode(' · '));
          var w = el('button', 'vk-w'); w.type = 'button'; w.lang = 'fr'; w.textContent = form;
          w.addEventListener('mousedown', function (e) { e.preventDefault(); });   // keep the cursor in the box
          w.addEventListener('click', function () { put(form); });
          forms.appendChild(w);
        });
        row.appendChild(forms); row.appendChild(el('span', 'vk-en', it[1] || '')); box.appendChild(row);
      });
      side.appendChild(box);
    });
    side.appendChild(ok);
  }

  function init() {
    var keys = document.querySelectorAll('.vkey[data-config]'); if (!keys.length) return;
    if (!document.getElementById('vk-css')) { var st = document.createElement('style'); st.id = 'vk-css'; st.textContent = CSS; document.head.appendChild(st); }
    [].forEach.call(keys, build);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
