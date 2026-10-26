/* puzzle.js — "Sentence puzzle" game for Optima lesson pages (SAMPLE, 2026-10-19).
 * Students build a sentence from word blocks shaped like puzzle pieces. The shape says what KIND of word a block is
 * (who · verb · a · infinitive · the rest), never which form is right, so trap blocks (other forms of the same verb)
 * still make the student choose. Tap a block to place it (or drag it); tap a placed block to send it back.
 * Check marks each piece; 2 checked tries, then "Show me" appears.
 * Data: <div class="puzzle-game" data-title="..." data-sentences='[{"en": "...", "pieces": [["Nosotros","who","audio url"],...],
 *        "traps": [["van","verb","audio url"]], "audio"?: "whole-sentence clip", "also"?: [["alternative order of piece texts"]]}]'></div>
 * Each block says its word when it is placed in the row; the whole sentence plays when it is built correctly.
 * Kinds: who · verb · link · inf · rest. Use only words taught BEFORE the lesson the game sits in.
 * Fiesta: a string of flags of Spanish-speaking countries across the top; confetti, two shaking maracas and a short
 * maraca rattle on each correct sentence (then the sentence is read aloud); a bigger burst at the end. Reduced motion
 * turns the movement off.
 * Options on the div: data-lang ("Spanish" | "French" | "Latin"; default Spanish), data-order="free" (any word order is
 * right as long as every block is: for Latin, where the endings carry the meaning), data-theme ("fiesta" default |
 * "mosaic": each correct sentence lays a share of a Roman floor mosaic; no audio | "galerie": a salon wall of empty gilt
 * frames, one per sentence; each sentence built correctly hangs its portrait (sentence "img"/"alt"; data-galerie-caption,
 * data-galerie-credit) | "cartes": the same with postcards: a sentence built correctly turns its postcard over to
 * the painting and postmarks it (sentence "place" = postmark text, "orient": "portrait" for a tall card)), data-help.
 * Reports {name, done, summary} to my-work.js through a "mw-game" event. One shared file; our own CSS, no libraries.
 */
(function () {
  'use strict';
  var root = document.querySelector('.puzzle-game');
  if (!root) return;
  var DATA; try { DATA = JSON.parse(root.getAttribute('data-sentences')); } catch (e) { return; }
  var NAME = root.getAttribute('data-title') || 'Sentence puzzle';
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var LANG = root.getAttribute('data-lang') || 'Spanish', FREE = root.getAttribute('data-order') === 'free';
  var THEME = root.getAttribute('data-theme') || 'fiesta';
  var SAY = { Spanish: { ok: '¡Perfecto!', top: ['¡Excelente! (Excellent!)', '¡Muy bien! (Very good!)', '¡Buen trabajo! (Good work!)'], again: '¡Otra vez! (Again!)' },
              French: { ok: 'Parfait !', top: ['Excellent ! (Excellent!)', 'Très bien ! (Very good!)', 'Bon travail ! (Good work!)'], again: 'Encore ! (Again!)' },
              Latin: { ok: 'Optimē! (Excellent!)', top: ['Optimē! (Excellent!)', 'Bene! (Well done!)', 'Bene labōrāvistī! (You worked well!)'], again: 'Iterum! (Again!)' } }[LANG] || {};

  var KIND = { art: ['#4A6B82', '“the” (no Latin word for it)'], noun: ['#7A3B8F', 'noun'], who: ['#1F5F8B', 'who'], verb: ['#B45309', 'verb'], link: ['#5B6672', 'link'], inf: ['#2A7F4F', 'action'], rest: ['#6B3FA0', 'when / where / what'] };
  var css =
    '.puzzle-game{font-family:inherit;color:#1a2340}' +
    '.pz-top{display:flex;flex-wrap:wrap;gap:8px;align-items:center;justify-content:space-between;margin:0 0 10px}' +
    '.pz-count{font-size:15px;letter-spacing:.06em;text-transform:uppercase;color:#5b6672}' +
    '.pz-dots{display:flex;gap:6px}.pz-dots i{width:12px;height:12px;border-radius:50%;background:#dde2ea;display:block}.pz-dots i.ok{background:#2A7F4F}.pz-dots i.now{box-shadow:0 0 0 2px #B45309 inset}' +
    '.pz-en{font-size:24px;font-weight:700;margin:4px 0 4px}.pz-w{border-bottom:3px solid transparent;padding-bottom:1px}.pz-help{font-size:18px;color:#3d4a5c;margin:0 0 12px}' +
    '.pz-row{min-height:64px;display:flex;flex-wrap:wrap;align-items:center;gap:0;padding:10px 12px;border:2px dashed #9FB3CC;border-radius:10px;background:#F4F9FC;margin:0 0 12px}' +
    '.pz-row.pz-over{border-color:#B45309;background:#FFF7EC}' +
    '.pz-row:empty::before{content:attr(data-ph);color:#6b7787;font-size:17px}' +
    '.pz-tray{display:flex;flex-wrap:wrap;align-items:flex-start;align-content:flex-start;gap:10px 14px;min-height:56px;padding:6px 0 10px}' +
    '.pz-b{position:relative;border:0;color:#fff;font-weight:700;font-size:19px;line-height:1;font-family:inherit;padding:12px 22px 12px 20px;margin:0 6px 0 0;cursor:grab;touch-action:none;user-select:none;' +
      'border-radius:6px;transition:transform .12s}' +
    // puzzle shape: a round tab on the right, a round hole on the left (the hole is painted in the colour behind it)
    '.pz-b::after{content:"";position:absolute;right:-7px;top:50%;width:15px;height:15px;margin-top:-7.5px;border-radius:50%;background:inherit;z-index:2}' +
    '.pz-b::before{content:"";position:absolute;left:-8px;top:50%;width:16px;height:16px;margin-top:-8px;border-radius:50%;background:var(--hole,#fff);z-index:1}' +
    '.pz-b.k-who::before{display:none}.pz-b.k-who{padding-left:16px}.pz-b.pz-last::after{display:none}.pz-b.pz-last{padding-right:16px}' +
    '.pz-row{--hole:#F4F9FC}.pz-row .pz-b{margin:4px 0}' +
    '.pz-b:focus-visible{outline:3px solid #0E1C42;outline-offset:3px}' +
    '.pz-b.pz-ok{box-shadow:0 0 0 3px #2A7F4F inset,0 0 0 3px #fff inset}.pz-m{font-weight:700;margin-right:4px}' +
    '.pz-b.pz-no{box-shadow:0 0 0 3px #fff inset;filter:saturate(.35) brightness(.9)}' +
    '.pz-b.pz-drag{opacity:.35}.pz-ghost{position:fixed;pointer-events:none;z-index:9999;opacity:.9;transform:rotate(-3deg)}' +
    '.pz-key{display:flex;flex-wrap:wrap;gap:14px;font-size:15px;color:#5b6672;margin:2px 0 12px}.pz-key span::before{content:"";display:inline-block;width:10px;height:10px;border-radius:2px;margin-right:5px;background:var(--c);vertical-align:-1px}' +
    '.pz-acts{display:flex;flex-wrap:wrap;gap:12px;align-items:center;border-top:1px solid #dde2ea;padding-top:14px;margin-top:4px}' +
    '.pz-btn{font-weight:700;font-size:18px;font-family:inherit;padding:11px 26px;border-radius:999px;border:2px solid #0E1C42;background:#fff;color:#0E1C42;cursor:pointer}' +
    '.pz-btn.pz-main{background:#0E1C42;border-color:#0E1C42;color:#fff;box-shadow:0 3px 0 #000a2a}' +
    '.pz-btn:focus-visible{outline:3px solid #B45309;outline-offset:3px}' +
    '.pz-btn[hidden]{display:none}' +
    '.pz-fb{font-size:18px;margin:12px 0 0;min-height:1.5em}.pz-fb.ok{color:#2A7F4F;font-weight:700}.pz-fb.no{color:#9a3412}' +
    '.pz-done{text-align:center;padding:18px 8px}.pz-done h3{font-size:24px;margin:0 0 6px}.pz-done p{margin:0 0 14px;color:#5b6672}' +
    (reduce ? '' : '@keyframes pzPop{0%{transform:scale(.85)}60%{transform:scale(1.06)}100%{transform:scale(1)}}.pz-pop{animation:pzPop .22s}' +
      '@keyframes pzShake{0%,100%{transform:translateX(0)}25%{transform:translateX(-5px)}75%{transform:translateX(5px)}}.pz-shake{animation:pzShake .3s}');
  var st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);

  function shuffle(a) { a = a.slice(); for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
  function el(tag, cls, txt) { var e = document.createElement(tag); if (cls) e.className = cls; if (txt != null) e.textContent = txt; return e; }

  var idx = 0, results = [], tries = 0, row, tray, fb, checkBtn, showBtn, nextBtn, player = null;
  function say(src) { if (!src) return; try { if (player) player.pause(); player = new Audio(src); player.play().catch(function () {}); } catch (e) {} }

  function block(p, last) {
    var b = el('button', 'pz-b k-' + p[1] + (last ? ' pz-last' : ''), p[0]);
    b.type = 'button'; b.style.background = KIND[p[1]][0]; b.setAttribute('data-t', p[0]); b._audio = p[2] || '';
    b.setAttribute('aria-label', p[0] + ' (' + KIND[p[1]][1] + ')');
    b.addEventListener('click', function () { if (b._dragged) { b._dragged = false; return; } move(b, b.parentNode === tray ? row : tray); });
    b.addEventListener('pointerdown', startDrag);
    return b;
  }
  function move(b, to, before) {
    clearMarks();
    if (before) to.insertBefore(b, before); else to.appendChild(b);
    if (to === row) say(b._audio);           // the block says its word as it joins the sentence
    if (!reduce) { b.classList.remove('pz-pop'); void b.offsetWidth; b.classList.add('pz-pop'); }
    b.focus();
  }
  function mark(b, ok) { b.classList.add(ok ? 'pz-ok' : 'pz-no'); var m = b.querySelector('.pz-m') || b.insertBefore(el('span', 'pz-m'), b.firstChild); m.textContent = ok ? '✓' : '✗'; }
  function clearMarks() { row.querySelectorAll('.pz-b').forEach(function (x) { x.classList.remove('pz-ok', 'pz-no'); var m = x.querySelector('.pz-m'); if (m) m.remove(); }); fb.textContent = ''; fb.className = 'pz-fb'; }

  // ---- drag (pointer events: mouse, touch, pen) ----
  var drag = null;
  function startDrag(e) {
    if (e.button && e.button !== 0) return;
    var b = e.currentTarget, r = b.getBoundingClientRect();
    drag = { b: b, x0: e.clientX, y0: e.clientY, dx: e.clientX - r.left, dy: e.clientY - r.top, on: false };
    document.addEventListener('pointermove', onMove); document.addEventListener('pointerup', onUp, { once: true });
  }
  function onMove(e) {
    if (!drag) return;
    if (!drag.on && Math.abs(e.clientX - drag.x0) + Math.abs(e.clientY - drag.y0) < 8) return;
    if (!drag.on) { drag.on = true; drag.g = drag.b.cloneNode(true); drag.g.classList.add('pz-ghost'); document.body.appendChild(drag.g); drag.b.classList.add('pz-drag'); }
    drag.g.style.left = (e.clientX - drag.dx) + 'px'; drag.g.style.top = (e.clientY - drag.dy) + 'px';
    var over = document.elementFromPoint(e.clientX, e.clientY);
    row.classList.toggle('pz-over', !!(over && row.contains(over)));
  }
  function onUp(e) {
    document.removeEventListener('pointermove', onMove);
    if (!drag) return;
    var d = drag; drag = null;
    if (!d.on) return;
    d.b._dragged = true; d.g.remove(); d.b.classList.remove('pz-drag'); row.classList.remove('pz-over');
    var over = document.elementFromPoint(e.clientX, e.clientY);
    if (over && row.contains(over)) {
      var before = null;
      Array.prototype.some.call(row.children, function (c) { if (c === d.b) return false; var r = c.getBoundingClientRect();
        if (e.clientY < r.bottom && e.clientX < r.left + r.width / 2) { before = c; return true; } return false; });
      move(d.b, row, before);
    } else if (over && tray.contains(over)) move(d.b, tray);
    setTimeout(function () { d.b._dragged = false; }, 0);
  }

  // ---- fiesta (decoration only): flags of Spanish-speaking countries, confetti and maracas on a correct sentence ----
  // Flags are drawn as each country's plain civil flag (no coat of arms); countries whose flag needs its emblem
  // to be correct (e.g. Mexico) are left out rather than drawn wrong.
  function star(cx, cy, R, fill) {
    var p = []; for (var j = 0; j < 10; j++) { var r = j % 2 ? R * 0.4 : R, a = -Math.PI / 2 + j * Math.PI / 5; p.push((cx + r * Math.cos(a)).toFixed(2) + ',' + (cy + r * Math.sin(a)).toFixed(2)); }
    return '<polygon points="' + p.join(' ') + '" fill="' + fill + '"/>';
  }
  function rect(x, y, w, h, f) { return '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" fill="' + f + '"/>'; }
  function hbands(cols) { var h = 20 / cols.length; return cols.map(function (c, i) { return rect(0, i * h, 30, h + 0.05, c); }).join(''); }
  function sun(cx, cy, r) { var s = ''; for (var i = 0; i < 16; i++) s += '<rect x="' + (cx - 0.25) + '" y="' + (cy - r * 1.8) + '" width="0.5" height="' + (r * 0.8) + '" fill="#F6B40E" transform="rotate(' + (i * 22.5) + ' ' + cx + ' ' + cy + ')"/>'; return s + '<circle cx="' + cx + '" cy="' + cy + '" r="' + r + '" fill="#F6B40E"/>'; }
  var FLAGS = [
    ['Spain', rect(0, 0, 30, 20, '#AA151B') + rect(0, 5, 30, 10, '#F1BF00')],
    ['Argentina', hbands(['#74ACDF', '#FFFFFF', '#74ACDF']) + sun(15, 10, 1.7)],
    ['Chile', rect(0, 0, 30, 10, '#FFFFFF') + rect(0, 10, 30, 10, '#D52B1E') + rect(0, 0, 10, 10, '#0039A6') + star(5, 5, 2.6, '#FFFFFF')],
    ['Colombia', rect(0, 0, 30, 10, '#FCD116') + rect(0, 10, 30, 5, '#003893') + rect(0, 15, 30, 5, '#CE1126')],
    ['Peru', rect(0, 0, 30, 20, '#D91023') + rect(10, 0, 10, 20, '#FFFFFF')],
    ['Cuba', hbands(['#002A8F', '#FFFFFF', '#002A8F', '#FFFFFF', '#002A8F']) + '<polygon points="0,0 0,20 15,10" fill="#CF142B"/>' + star(5, 10, 2.6, '#FFFFFF')],
    ['Puerto Rico', hbands(['#ED0000', '#FFFFFF', '#ED0000', '#FFFFFF', '#ED0000']) + '<polygon points="0,0 0,20 15,10" fill="#0050F0"/>' + star(5, 10, 2.6, '#FFFFFF')],
    ['Panama', rect(0, 0, 30, 20, '#FFFFFF') + rect(15, 0, 15, 10, '#DA121A') + rect(0, 10, 15, 10, '#072357') + star(7.5, 5, 2.4, '#072357') + star(22.5, 15, 2.4, '#DA121A')],
    ['Costa Rica', hbands(['#002B7F', '#FFFFFF', '#CE1126', '#CE1126', '#FFFFFF', '#002B7F'])],
    ['Uruguay', hbands(['#FFFFFF', '#0038A8', '#FFFFFF', '#0038A8', '#FFFFFF', '#0038A8', '#FFFFFF', '#0038A8', '#FFFFFF']) + rect(0, 0, 11.1, 11.1, '#FFFFFF') + sun(5.55, 5.55, 1.6)],
    ['Honduras', hbands(['#00BCE4', '#FFFFFF', '#00BCE4']) + [[15, 10], [11.5, 8.3], [11.5, 11.7], [18.5, 8.3], [18.5, 11.7]].map(function (c) { return star(c[0], c[1], 1.1, '#00BCE4'); }).join('')],
    ['Bolivia', hbands(['#D52B1E', '#F9E300', '#007934'])],
    ['Venezuela', hbands(['#FFCC00', '#00247D', '#CF142B']) + [0, 1, 2, 3, 4, 5, 6, 7].map(function (i) { var a = Math.PI * (1.12 + i * 0.109); return star(15 + 5.2 * Math.cos(a), 12.6 + 5.2 * Math.sin(a), 0.75, '#FFFFFF'); }).join('')]
  ];
  var CONFETTI = ['#AA151B', '#F1BF00', '#74ACDF', '#0039A6', '#D52B1E', '#FCD116', '#007934', '#00BCE4', '#FFFFFF', '#B45309'];
  var fcss = '.puzzle-game{position:relative}' +
    '.pz-flags{display:block;width:100%;height:46px;margin:-6px 0 6px;overflow:visible}' +
    '.pz-flag{transform-box:fill-box;transform-origin:50% 0;animation:pzSway 3s ease-in-out infinite alternate}' +
    '.pz-party .pz-flag{animation-duration:.35s}' +
    '@keyframes pzSway{from{transform:rotate(-4deg)}to{transform:rotate(4deg)}}' +
    '.pz-confetti{position:absolute;left:0;top:0;pointer-events:none;z-index:5}' +
    '.pz-maracas{position:absolute;pointer-events:none;z-index:6}' +
    '.pz-maracas svg{width:58px;height:90px;transform-origin:50% 85%;animation:pzMaraca .16s ease-in-out 8 alternate}' +
        '@keyframes pzMaraca{from{transform:rotate(-18deg)}to{transform:rotate(18deg)}}' +
    '@media (prefers-reduced-motion:reduce){.pz-flag,.pz-maracas svg{animation:none}}';
  var fst = document.createElement('style'); fst.textContent = fcss; document.head.appendChild(fst);

  function flagStrip() {
    var gap = 10, fw = 30, W = FLAGS.length * (fw + gap) + gap;
    var svg = '<svg class="pz-flags" viewBox="0 0 ' + W + ' 34" preserveAspectRatio="xMidYMin meet" role="img" aria-label="Flags of Spanish-speaking countries">' +
      '<path d="M0 3 Q' + W / 2 + ' 9 ' + W + ' 3" stroke="#8a6d3b" stroke-width="0.8" fill="none"/>';
    FLAGS.forEach(function (f, i) {
      var x = gap + i * (fw + gap), t = (x + fw / 2) / W, sag = 3 + 6 * t * (1 - t) * 2;
      svg += '<g transform="translate(' + x + ' ' + sag.toFixed(2) + ')"><g class="pz-flag" style="animation-delay:' + (-(i * 0.41) % 3).toFixed(2) + 's">' +
        '<title>' + f[0] + '</title>' +
        '<svg x="0" y="0" width="30" height="20" viewBox="0 0 30 20">' + f[1] + '<rect x="0.15" y="0.15" width="29.7" height="19.7" fill="none" stroke="#000" stroke-opacity=".18" stroke-width="0.3"/></svg></g></g>';
    });
    var d = document.createElement('div'); d.innerHTML = svg + '</svg>'; return d.firstChild;
  }

  var actx = null;
  function shaker() {                              // three quick maraca rattles, synthesised (no file)
    try {
      actx = actx || new (window.AudioContext || window.webkitAudioContext)();
      var len = Math.floor(actx.sampleRate * 0.09), buf = actx.createBuffer(1, len, actx.sampleRate), ch = buf.getChannelData(0);
      for (var i = 0; i < len; i++) ch[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2);
      [0, 0.13, 0.26].forEach(function (t, k) {
        var src = actx.createBufferSource(), bp = actx.createBiquadFilter(), g = actx.createGain();
        src.buffer = buf; bp.type = 'bandpass'; bp.frequency.value = 5200 + k * 600; bp.Q.value = 1.2; g.gain.value = 0.55;
        src.connect(bp); bp.connect(g); g.connect(actx.destination); src.start(actx.currentTime + t);
      });
    } catch (e) {}
  }
  function maracaSVG(c1, c2) {
    return '<svg viewBox="0 0 58 90" aria-hidden="true"><rect x="25" y="46" width="8" height="40" rx="4" fill="#8B5A2B"/>' +
      '<ellipse cx="29" cy="28" rx="21" ry="25" fill="' + c1 + '"/>' +
      '<path d="M10 22 Q29 30 48 22" stroke="' + c2 + '" stroke-width="5" fill="none"/><path d="M9 34 Q29 42 49 34" stroke="#FFFFFF" stroke-width="4" fill="none"/>' +
      '<circle cx="20" cy="14" r="3" fill="#FFFFFF" opacity=".7"/></svg>';
  }
  function maracas() {                         // one maraca each side of the sentence row, never over the words
    if (!row || !row.isConnected) return;
    var r = row.getBoundingClientRect(), sx = window.scrollX || 0, sy = window.scrollY || 0, vw = document.documentElement.clientWidth;
    var room = Math.min(r.left, vw - r.right) - 6, w = Math.max(30, Math.min(58, room)), h = w * 90 / 58;
    [[r.left - w - 4, '#D52B1E'], [r.right + 4, '#007934']].forEach(function (side, i) {
      var m = document.createElement('div');
      m.className = 'pz-maracas'; m.setAttribute('aria-hidden', 'true');
      m.style.left = Math.max(0, Math.min(vw - w, side[0])) + sx + 'px'; m.style.top = (r.top + r.height / 2 - h / 2 + sy) + 'px';
      m.style.width = w + 'px'; m.style.height = h + 'px';
      m.innerHTML = maracaSVG(side[1], '#F1BF00');
      var svg = m.firstChild; svg.style.width = w + 'px'; svg.style.height = h + 'px'; if (i) svg.style.animationDelay = '.08s';
      document.body.appendChild(m); setTimeout(function () { m.remove(); }, 1500);
    });
  }
  function confetti(big) {
    if (reduce) return;
    var c = document.createElement('canvas'); c.className = 'pz-confetti'; c.setAttribute('aria-hidden', 'true');
    var w = root.clientWidth, h = Math.max(root.clientHeight, 260), dpr = window.devicePixelRatio || 1;
    c.width = w * dpr; c.height = h * dpr; c.style.width = w + 'px'; c.style.height = h + 'px'; root.appendChild(c);
    var x = c.getContext('2d'); x.scale(dpr, dpr);
    var r = row && row.isConnected ? row.getBoundingClientRect() : root.getBoundingClientRect(), g = root.getBoundingClientRect();
    var ox = r.left - g.left + r.width / 2, oy = r.top - g.top + Math.min(r.height, 120) / 2, P = [];
    for (var i = 0; i < (big ? 260 : 120); i++) {
      var a = Math.random() * Math.PI * 2, v = (big ? 7 : 5) + Math.random() * (big ? 8 : 5);
      P.push({ x: ox + (Math.random() - 0.5) * r.width * 0.6, y: oy, vx: Math.cos(a) * v, vy: Math.sin(a) * v - (big ? 6 : 4), s: 4 + Math.random() * 5,
               rot: Math.random() * 6, vr: (Math.random() - 0.5) * 0.4, c: CONFETTI[i % CONFETTI.length] });
    }
    var t0 = performance.now(), life = big ? 2600 : 1700;
    (function frame(now) {
      var k = (now - t0) / life; x.clearRect(0, 0, w, h);
      P.forEach(function (p) { p.vy += 0.28; p.vx *= 0.985; p.x += p.vx; p.y += p.vy; p.rot += p.vr;
        x.save(); x.globalAlpha = Math.max(0, 1 - k * k); x.translate(p.x, p.y); x.rotate(p.rot); x.fillStyle = p.c;
        x.fillRect(-p.s / 2, -p.s / 4, p.s, p.s / 2); x.restore(); });
      if (k < 1) requestAnimationFrame(frame); else c.remove();
    })(t0);
  }
  // ---- mosaic theme (Latin): each correct sentence lays a share of the tiles of a Roman floor mosaic ---------------
  // A real photograph is revealed tile by tile; tiles finished with "Show me" appear faded, so the picture is always
  // completed but shows where help was used.
  var mosaic = null;
  function buildMosaic() {
    var img = root.getAttribute('data-mosaic-img'), g = (root.getAttribute('data-mosaic-grid') || '28x21').split('x');
    var C = +g[0], Rw = +g[1];
    var box = el('div', 'pz-mosaic'); box.setAttribute('role', 'img'); box.setAttribute('aria-label', 'A Roman floor mosaic that appears as you build each sentence');
    var grid = el('div', 'pz-mgrid'); grid.style.gridTemplateColumns = 'repeat(' + C + ',1fr)';
    var tiles = [];
    for (var y = 0; y < Rw; y++) for (var x = 0; x < C; x++) {
      var t = el('i'); t._pos = (x * 100 / (C - 1)).toFixed(3) + '% ' + (y * 100 / (Rw - 1)).toFixed(3) + '%';
      t.style.backgroundSize = (C * 100) + '% ' + (Rw * 100) + '%'; grid.appendChild(t); tiles.push(t);
    }
    box.appendChild(grid);
    var cap = el('div', 'pz-mcap');
    cap.innerHTML = (root.getAttribute('data-mosaic-caption') || '') +
      (root.getAttribute('data-mosaic-credit') ? '<span class="pz-credit">' + root.getAttribute('data-mosaic-credit') + '</span>' : '');
    box.appendChild(cap);
    var order = shuffle(tiles.map(function (_, i) { return i; })), per = Math.ceil(tiles.length / DATA.length);
    mosaic = { box: box, tiles: tiles, cap: cap, img: img, chunks: DATA.map(function (_, k) { return order.slice(k * per, (k + 1) * per); }) };
  }
  function lay(k, ok) {
    if (!mosaic) return;
    mosaic.chunks[k].forEach(function (i, n) {
      var t = mosaic.tiles[i];
      t.style.transitionDelay = (reduce ? 0 : Math.min(900, n * 6)) + 'ms';
      t.style.backgroundImage = 'url("' + mosaic.img + '")'; t.style.backgroundPosition = t._pos;
      t.className = ok ? 'on' : 'on faded';
    });
  }
  function resetMosaic() { mosaic = null; }
  function pluck(freq, at, gain) {                 // one plucked string (Karplus-Strong: a noise burst through a short tuned delay)
    var sr = actx.sampleRate, len = Math.floor(sr * 2.2), N = Math.round(sr / freq), buf = actx.createBuffer(1, len, sr), y = buf.getChannelData(0);
    for (var i = 0; i < N; i++) y[i] = Math.random() * 2 - 1;
    for (i = N; i < len; i++) y[i] = 0.996 * 0.5 * (y[i - N] + y[i - N + 1 < i ? i - N + 1 : i - N]);
    var src = actx.createBufferSource(), lp = actx.createBiquadFilter(), g = actx.createGain();
    src.buffer = buf; lp.type = 'lowpass'; lp.frequency.value = 3200; g.gain.value = gain;
    src.connect(lp); lp.connect(g); g.connect(actx.destination); src.start(at);
  }
  function clink(big) {                            // a cithara strum: rising arpeggio; a longer up-and-down strum at the end
    try {
      actx = actx || new (window.AudioContext || window.webkitAudioContext)();
      var G = [196.0, 246.9, 293.7, 392.0, 493.9, 587.3, 784.0];          // G major: G3 B3 D4 G4 B4 D5 G5
      var notes = big ? [0, 1, 2, 3, 4, 5, 6, 5, 4, 3] : [2, 3, 4, 5], t0 = actx.currentTime + 0.02;
      notes.forEach(function (n, k) { pluck(G[n], t0 + k * (big ? 0.09 : 0.075), big ? 0.32 : 0.36); });
      if (big) [0, 3, 5].forEach(function (n) { pluck(G[n], t0 + notes.length * 0.09 + 0.12, 0.22); });   // closing chord
    } catch (e) {}
  }
  var mcss = '.pz-mosaic{max-width:420px;margin:0 auto 14px}' +
    '@media (min-width:760px){.pz-theme-mosaic{display:grid;grid-template-columns:minmax(220px,38%) 1fr;column-gap:22px;align-items:start}' +
      '.pz-theme-mosaic>*{grid-column:2}.pz-theme-mosaic>.pz-mosaic{grid-column:1;grid-row:1 / span 30;position:sticky;top:12px;max-width:none;margin:0}' +
      '.pz-theme-mosaic>.pz-confetti{grid-column:auto}}' +
    '.pz-mgrid{display:grid;gap:1px;background:#B9AD93;border-radius:4px;overflow:hidden;box-shadow:0 2px 8px rgba(60,40,20,.18)}' +
    '.pz-mgrid i{display:block;aspect-ratio:1;background-color:#E4DAC4;background-repeat:no-repeat;opacity:.55;transform:scale(.7);transition:opacity .3s,transform .3s,filter .3s}' +
    '.pz-mgrid i.on{opacity:1;transform:scale(1)}.pz-mgrid i.on.faded{opacity:.5;filter:sepia(.7)}.pz-mosaic.done .pz-mgrid{gap:0;transition:gap .8s}.pz-mosaic.done .pz-mgrid i.on.faded{opacity:.8}' +
    '.pz-mcap{font-size:16px;color:#3d4a5c;text-align:center;margin:0;max-height:0;overflow:hidden;opacity:0;transition:opacity .6s,max-height .6s,margin .6s}.pz-mcap.show{opacity:1;max-height:220px;margin:8px 0 0}' +
    '.pz-mcap strong{letter-spacing:.18em;color:#5A3A28}.pz-credit{display:block;font-size:12px;color:#6b7787;margin-top:4px}' +
    '@media (prefers-reduced-motion:reduce){.pz-mgrid i{transition:none}}';

  if (THEME === 'mosaic') { root.classList.add('pz-theme-mosaic'); var mst = document.createElement('style'); mst.textContent = mcss; document.head.appendChild(mst); CONFETTI = ['#1E1B18', '#9B2D20', '#C9A66B', '#EFE6D2', '#5A3A28', '#7A3B8F']; }
  // ---- galerie theme (French + painting): one gilt frame per sentence on a salon wall; a correct sentence hangs its
  // portrait (from the module's painting), "Show me" hangs it in sepia, so the wall is always completed but honest.
  var galerie = null;
  function buildGalerie() {
    var wall = el('div', 'pz-wall' + (THEME === 'cartes' ? ' pz-cartes' : '')), bg = THEME === 'cartes' ? null : root.getAttribute('data-galerie-bg'); if (bg) { wall.style.setProperty('--gbg', 'url("' + bg + '")'); wall.classList.add('pz-wall-art'); }
    wall.setAttribute('role', 'img'); wall.setAttribute('aria-label', THEME === 'cartes' ? 'Postcards from the regions of France, turned over one by one as you build each sentence' : 'A gallery wall of portraits that fills as you build each sentence');
    var frames = DATA.map(function (d, k) {
      var f = el('figure', 'pz-gf' + (THEME === 'cartes' && d.orient === 'portrait' ? ' tall' : '')), ov = el('div', 'pz-gov'), im = el('img'); im.alt = d.alt || ''; im.src = d.img || ''; ov.appendChild(im);
      if (THEME === 'cartes') { var back = el('div', 'pz-cback'); back.innerHTML = '<span class="pz-cb-t">Carte postale</span><span class="pz-cb-s"></span><i></i><i></i><i></i>';
        var pmk = el('span', 'pz-pmark'); pmk.innerHTML = '<b>Post&eacute;e</b>'; pmk.appendChild(document.createTextNode(d.place || '')); ov.appendChild(back); ov.appendChild(pmk); }
      ov.appendChild(el('span', 'pz-gq', (k + 1) + '')); f.appendChild(ov); var cap = el('figcaption', null, ''); f.appendChild(cap); wall.appendChild(f);
      return { f: f, cap: cap };
    });
    var cap = el('div', 'pz-gcap'); cap.innerHTML = (root.getAttribute('data-galerie-caption') || '') +
      (root.getAttribute('data-galerie-credit') ? '<span class="pz-credit">' + root.getAttribute('data-galerie-credit') + '</span>' : '');
    wall.appendChild(cap); galerie = { wall: wall, frames: frames, cap: cap };
  }
  function hang(k, ok) {
    if (!galerie) return; var g = galerie.frames[k], d = DATA[k];
    g.f.className = 'pz-gf ' + (ok ? 'on' : 'on faded'); g.cap.textContent = d.pieces.map(function (p) { return p[0]; }).join(' ');
  }
  function chime(big) {                            // soft piano-like bells for the gallery
    try {
      actx = actx || new (window.AudioContext || window.webkitAudioContext)();
      var t0 = actx.currentTime + 0.02, N = big ? [523.3, 659.3, 784, 1046.5, 987.8, 784, 880, 1046.5] : [659.3, 987.8];
      N.forEach(function (f, i) { [[1, 'triangle', .16], [2, 'sine', .05]].forEach(function (h) {
        var o = actx.createOscillator(), g = actx.createGain(), t = t0 + i * (big ? .16 : .09);
        o.type = h[1]; o.frequency.value = f * h[0]; g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(h[2], t + .012); g.gain.exponentialRampToValueAtTime(.0008, t + 1.1);
        o.connect(g); g.connect(actx.destination); o.start(t); o.stop(t + 1.2); }); });
    } catch (e) {}
  }
  var gcss = '.pz-wall{position:relative;display:flex;flex-wrap:wrap;justify-content:center;gap:78px 18px;align-items:flex-start;padding:68px 14px 68px;margin:0 0 16px;border-radius:4px;' +
      'background:radial-gradient(ellipse at 50% 0%,#7a2a2e 0%,#5a1c20 55%,#45151a 100%);box-shadow:inset 0 0 40px rgba(0,0,0,.45),0 4px 14px rgba(40,10,10,.25)}' +
    '.pz-wall-art{overflow:hidden;isolation:isolate;background:#2a2016}' +
    '.pz-wall-art::before{content:"";position:absolute;inset:-14px;z-index:-2;background:var(--gbg) center/cover no-repeat;filter:blur(2px) brightness(.7) saturate(1.2)}' +
    '.pz-wall-art::after{content:"";position:absolute;inset:0;z-index:-1;background:radial-gradient(ellipse at 50% 45%,rgba(20,12,6,0) 30%,rgba(20,12,6,.55) 100%)}' +
    '.pz-wall-art figcaption,.pz-wall-art .pz-gcap{text-shadow:0 1px 3px rgba(0,0,0,.85),0 0 8px rgba(0,0,0,.6)}' +
    '.pz-gf{position:relative;margin:0;text-align:center;width:118px}' +
    '.pz-gov{position:relative;width:96px;height:116px;margin:0 auto;border-radius:50%;overflow:hidden;border:5px solid #c9a24e;outline:2px solid #3b2a1a;' +
      'box-shadow:0 0 0 6px #e9d39a,0 6px 12px rgba(0,0,0,.5);background:#2a1d14}' +
    '.pz-gov img{width:100%;height:100%;object-fit:cover;opacity:0;filter:blur(6px) saturate(.2);transform:scale(1.15);transition:opacity 1.1s,filter 1.3s,transform 1.3s}' +
    '.pz-gq{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-family:"Cormorant Garamond",Georgia,serif;font-size:30px;font-weight:600;color:rgba(233,211,154,.55);transition:opacity .6s}' +
    '.pz-gf.on img{opacity:1;filter:none;transform:scale(1)}.pz-gf.on .pz-gq{opacity:0}.pz-gf.on.faded img{filter:sepia(.75) saturate(.6);opacity:.85}' +
    '.pz-gf.now .pz-gov{box-shadow:0 0 0 6px #e9d39a,0 0 18px 4px rgba(255,214,120,.75)}' +
    '.pz-gf figcaption{position:absolute;left:-3px;right:-3px;top:100%;margin-top:10px;font-family:"Cormorant Garamond",Georgia,serif;font-size:15.5px;line-height:1.15;color:#f3e6c4;font-style:italic}' +
    '.pz-gcap{position:absolute;top:16px;left:12px;right:12px;font-size:15px;color:#f3e6c4;text-align:center;max-height:0;overflow:hidden;opacity:0;transition:opacity .6s,max-height .6s}.pz-gcap.show{opacity:1;max-height:200px}' +
    '.pz-gcap .pz-credit{color:#d9c79e}.pz-wall.done .pz-gov{box-shadow:0 0 0 6px #e9d39a,0 0 22px 6px rgba(255,214,120,.6)}' +
    '.pz-gcap .pz-credit{display:block;font-size:12px;margin-top:2px}' +
    '@media (max-width:600px){.pz-gf{width:92px}.pz-gov{width:76px;height:92px}.pz-wall{padding-top:92px}.pz-gcap{font-size:13px}}' +
    '@media (prefers-reduced-motion:reduce){.pz-gov img{transition:none}}';
  var ccss = '.pz-wall.pz-cartes{background:radial-gradient(ellipse at 50% 30%,#8a5a34 0%,#6b4226 60%,#4e2f1a 100%);gap:70px 26px}' +
    '.pz-cartes .pz-gf{width:220px}.pz-cartes .pz-gf.tall{width:160px}' +
    '.pz-cartes .pz-gov{width:200px;height:134px;border-radius:2px;border:7px solid #fffaf0;outline:none;box-shadow:0 6px 14px rgba(0,0,0,.45);background:#fffaf0;transform:rotate(-2deg);transition:transform .6s}' +
    '.pz-cartes .pz-gf:nth-child(even) .pz-gov{transform:rotate(2.2deg)}.pz-cartes .pz-gf.tall .pz-gov{width:140px;height:186px}' +
    '.pz-cartes .pz-gov img{filter:none;transform:none;opacity:0;transition:opacity .9s .25s}' +
    '.pz-cback{position:absolute;inset:0;background:#fffaf0;display:block;transition:opacity .5s .2s}.pz-cback i{position:absolute;left:52%;right:8%;height:1px;background:#c9b48a}' +
    '.pz-cback i:nth-of-type(1){top:52%}.pz-cback i:nth-of-type(2){top:66%}.pz-cback i:nth-of-type(3){top:80%}' +
    '.pz-cback:before{content:"";position:absolute;left:47%;top:10%;bottom:10%;width:1px;background:#c9b48a}' +
    '.pz-cb-t{position:absolute;left:8%;top:9%;font:italic 600 15px "Cormorant Garamond",Georgia,serif;color:#7a5a2a;letter-spacing:.06em}' +
    '.pz-cb-s{position:absolute;right:7%;top:9%;width:30px;height:36px;border:2px dashed #c9a24e;border-radius:2px}' +
    '.pz-cartes .pz-gq{color:rgba(122,90,42,.55);font-size:34px;justify-content:flex-start;padding-left:16%;align-items:flex-end;padding-bottom:12%}' +
    '.pz-cartes .pz-gf.on .pz-cback{opacity:0}.pz-cartes .pz-gf.on img{opacity:1}.pz-cartes .pz-gf.on .pz-gov{transform:rotate(0deg) scale(1.03)}' +
    '.pz-pmark{position:absolute;right:6px;top:6px;width:62px;height:62px;border-radius:50%;border:2.5px solid rgba(140,47,57,.85);color:rgba(140,47,57,.9);' +
      'font:700 9.5px/1.15 "Segoe UI",Arial,sans-serif;text-transform:uppercase;letter-spacing:.06em;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;' +
      'transform:rotate(-14deg) scale(2.4);opacity:0;background:rgba(255,250,240,.35);pointer-events:none}' +
    '.pz-pmark b{font-size:10.5px;letter-spacing:.1em;border-bottom:1.5px solid rgba(140,47,57,.7);margin-bottom:2px;padding-bottom:1px}' +
    '.pz-cartes .pz-gf.on:not(.faded) .pz-pmark{animation:pzStamp .45s 1s cubic-bezier(.2,1.6,.5,1) forwards}' +
    '@keyframes pzStamp{to{opacity:1;transform:rotate(-14deg) scale(1)}}' +
    '.pz-cartes .pz-gf.on.faded img{filter:sepia(.8) saturate(.55)}.pz-cartes .pz-gf.now .pz-gov{box-shadow:0 0 0 3px #e9d39a,0 0 22px 6px rgba(255,214,120,.7)}' +
    '.pz-cartes .pz-gf figcaption{color:#fbefd6}' +
    '@media (prefers-reduced-motion:reduce){.pz-cartes .pz-gf.on:not(.faded) .pz-pmark{animation:none;opacity:1;transform:rotate(-14deg)}}';
  if (THEME === 'galerie' || THEME === 'cartes') { var gst = document.createElement('style'); gst.textContent = gcss + (THEME === 'cartes' ? ccss : ''); document.head.appendChild(gst); CONFETTI = ['#C9A24E', '#E9D39A', '#FFF3C4', '#7A2A2E', '#1D2A44', '#FFFFFF']; }
  function celebrate(big) {
    if (THEME === 'galerie' || THEME === 'cartes') { chime(big); if (!big) hang(idx, true); confetti(big); return; }
    if (THEME === 'mosaic') { clink(big); if (!big) lay(idx, true); confetti(big); return; }
    shaker(); maracas(); confetti(big);
  }

  function render() {
    root.innerHTML = '';
    root.classList.remove('pz-party');
    if (THEME === 'fiesta') root.appendChild(flagStrip());
    if (THEME === 'mosaic') { if (!mosaic) buildMosaic(); root.appendChild(mosaic.box); }
    if (THEME === 'galerie' || THEME === 'cartes') { if (!galerie) buildGalerie(); root.appendChild(galerie.wall); galerie.frames.forEach(function (g, k) { g.f.classList.toggle('now', k === idx); }); }
    if (idx >= DATA.length) return finish();
    var s = DATA[idx]; tries = 0;
    var top = el('div', 'pz-top'), dots = el('div', 'pz-dots');
    top.appendChild(el('div', 'pz-count', 'Sentence ' + (idx + 1) + ' of ' + DATA.length));
    DATA.forEach(function (_, i) { var d = el('i'); if (i < idx && results[i]) d.className = 'ok'; if (i === idx) d.className = 'now'; dots.appendChild(d); });
    top.appendChild(dots); root.appendChild(top);
    var en = el('div', 'pz-en');
    if (s.enParts) s.enParts.forEach(function (w, i) {        // each English word in the colour of its kind of block
      var sp = el('span', 'pz-w', w[0]); if (KIND[w[1]]) { sp.style.color = KIND[w[1]][0]; sp.style.borderBottomColor = KIND[w[1]][0]; }
      en.appendChild(sp); if (i < s.enParts.length - 1) en.appendChild(document.createTextNode(' '));
    }); else en.textContent = s.en;
    root.appendChild(en);
    root.appendChild(el('p', 'pz-help', root.getAttribute('data-help') || ('Build it in ' + LANG + '. Watch out: some blocks don’t belong.')));
    var key = el('div', 'pz-key');
    ['noun', 'who', 'verb', 'link', 'inf', 'rest', 'art'].filter(function (k) { return DATA.some(function (d) { return d.pieces.concat(d.traps || [], d.enParts || []).some(function (p) { return p[1] === k; }); }); }).forEach(function (k) { var sp = el('span', null, KIND[k][1]); sp.style.setProperty('--c', KIND[k][0]); key.appendChild(sp); });
    root.appendChild(key);
    row = el('div', 'pz-row'); row.setAttribute('aria-label', 'Your sentence'); row.setAttribute('data-ph', FREE ? 'Tap or drag the blocks here, in any order' : 'Tap or drag the blocks here, in order'); root.appendChild(row);
    tray = el('div', 'pz-tray'); tray.setAttribute('aria-label', 'Blocks');
    var lastText = FREE ? null : s.pieces[s.pieces.length - 1][0];
    shuffle(s.pieces.concat(s.traps || [])).forEach(function (p) { tray.appendChild(block(p, p[0] === lastText)); });
    root.appendChild(tray);
    var acts = el('div', 'pz-acts');
    checkBtn = el('button', 'pz-btn pz-main', '✔ Check my sentence'); checkBtn.type = 'button'; checkBtn.addEventListener('click', check);
    showBtn = el('button', 'pz-btn', 'Show me'); showBtn.type = 'button'; showBtn.hidden = true; showBtn.addEventListener('click', showMe);
    nextBtn = el('button', 'pz-btn pz-main', 'Next sentence →'); nextBtn.type = 'button'; nextBtn.hidden = true;
    nextBtn.addEventListener('click', function () { idx++; render(); });
    acts.appendChild(checkBtn); acts.appendChild(showBtn); acts.appendChild(nextBtn); root.appendChild(acts);
    fb = el('div', 'pz-fb'); fb.setAttribute('aria-live', 'polite'); root.appendChild(fb);
  }

  function texts() { return Array.prototype.map.call(row.children, function (b) { return b.getAttribute('data-t'); }); }
  function check() {
    var s = DATA[idx], want = s.pieces.map(function (p) { return p[0]; }), got = texts();
    if (!got.length) { fb.className = 'pz-fb no'; fb.textContent = 'Put some blocks in the row first.'; return; }
    if (FREE) return checkFree(s, want, got);
    var orders = [want].concat(s.also || []);
    var best = orders.reduce(function (b, o) { var n = o.filter(function (t, i) { return got[i] === t; }).length; return n > b.n ? { o: o, n: n } : b; }, { o: want, n: -1 });
    var right = got.length === best.o.length && best.n === best.o.length;
    Array.prototype.forEach.call(row.children, function (b, i) { mark(b, b.getAttribute('data-t') === best.o[i]); });
    tries++;
    if (right) { fb.className = 'pz-fb ok'; fb.textContent = SAY.ok + ' ' + (tries === 1 ? 'First try.' : '') + (s.audio ? ' Listen to your sentence.' : ''); celebrate(false); setTimeout(function () { say(s.audio); }, 450); done(true); return; }
    if (!reduce) { row.classList.remove('pz-shake'); void row.offsetWidth; row.classList.add('pz-shake'); }
    // which kind of trap block is in the wrong place decides the hint (a sentence may also carry its own "hint")
    var trapKind = null;
    got.forEach(function (t, i) { if (best.o[i] && t !== best.o[i]) (s.traps || []).forEach(function (p) { if (p[0] === t && !trapKind) trapKind = p[1]; }); });
    var KINDHINT = { verb: 'Check the verb: who is doing it? ', link: 'Check the little linking word (to, in, of): which one goes with this place? ',
                     who: 'Check the first word: does it match its noun (masculine, feminine, plural)? ' };
    fb.className = 'pz-fb no';
    fb.textContent = (trapKind ? (s.hint ? s.hint + ' ' : KINDHINT[trapKind] || 'Not quite. ') : got.length < best.o.length ? 'Something is missing. ' : 'Not quite. ') +
      (tries >= 2 ? 'You can try again, or press Show me.' : 'Fix the red blocks and check again.');
    if (tries >= 2) showBtn.hidden = false;
  }
  function checkFree(s, want, got) {           // any order: right when every block is a needed one and none is missing
    var need = want.slice(), wrongNoun = false, wrongVerb = false;
    Array.prototype.forEach.call(row.children, function (b) {
      var t = b.getAttribute('data-t'), k = need.indexOf(t);
      if (k >= 0) { need.splice(k, 1); mark(b, true); }
      else { mark(b, false); var tr = (s.traps || []).filter(function (p) { return p[0] === t; })[0]; if (tr && tr[1] === 'verb') wrongVerb = true; else wrongNoun = true; }
    });
    tries++;
    var right = !need.length && got.length === want.length;
    if (right) { fb.className = 'pz-fb ok'; fb.textContent = SAY.ok + ' ' + (tries === 1 ? 'First try. ' : '') + 'Any order works: the endings tell who does what.'; celebrate(false); done(true); return; }
    if (!reduce) { row.classList.remove('pz-shake'); void row.offsetWidth; row.classList.add('pz-shake'); }
    fb.className = 'pz-fb no';
    fb.textContent = (wrongNoun ? 'Check the endings: which word does the action, and which word receives it? ' : wrongVerb ? 'Check the verb: is the subject one person or more than one? ' : need.length ? 'Something is missing. ' : 'Not quite. ') +
      (tries >= 2 ? 'You can try again, or press Show me.' : 'Fix the red blocks and check again.');
    if (tries >= 2) showBtn.hidden = false;
  }
  function showMe() {
    var s = DATA[idx]; row.innerHTML = '';
    s.pieces.forEach(function (p, i) { var b = block(p, i === s.pieces.length - 1); row.appendChild(b); mark(b, true); });
    Array.prototype.forEach.call(tray.children, function (b) { b.disabled = true; b.style.opacity = '.4'; });
    fb.className = 'pz-fb'; fb.textContent = s.audio ? 'Here it is. Listen, say it aloud once, then go on.' : 'Here it is. Read it once, then go on.'; say(s.audio);
    if (THEME === 'mosaic') lay(idx, false);
    if (THEME === 'galerie' || THEME === 'cartes') hang(idx, false);
    done(false);
  }
  function done(ok) {
    results[idx] = ok;
    checkBtn.hidden = true; showBtn.hidden = true; nextBtn.hidden = false;
    if (idx === DATA.length - 1) nextBtn.textContent = 'See my result';
    Array.prototype.forEach.call(root.querySelectorAll('.pz-b'), function (b) { b.style.cursor = 'default'; b.removeEventListener('pointerdown', startDrag); });
    nextBtn.focus();
  }
  function finish() {
    root.classList.add('pz-party'); setTimeout(function () { celebrate(true); }, 60);
    var n = results.filter(Boolean).length, box = el('div', 'pz-done');
    box.appendChild(el('h3', null, n === DATA.length ? SAY.top[0] : n >= DATA.length - 1 ? SAY.top[1] : SAY.top[2]));
    if (galerie) { galerie.cap.classList.add('show'); galerie.wall.classList.add('done'); }
    if (mosaic) { mosaic.cap.classList.add('show'); setTimeout(function () { if (mosaic) mosaic.box.classList.add('done'); }, 900); }
    box.appendChild(el('p', null, 'You built ' + n + ' of ' + DATA.length + ' sentences on your own.'));
    var again = el('button', 'pz-btn pz-main', SAY.again); again.type = 'button';
    again.addEventListener('click', function () { idx = 0; results = []; mosaic = null; galerie = null; render(); });
    box.appendChild(again); root.appendChild(box);
    try { window.dispatchEvent(new CustomEvent('mw-game', { detail: { name: NAME, done: true, summary: n + ' of ' + DATA.length + ' sentences built on my own' } })); } catch (e) {}
  }
  render();
})();
