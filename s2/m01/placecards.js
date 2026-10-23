/* Les cartons de table: place-card game. One card per guest in a painting; the student puts the adjective before or
   after the noun. A correct card brings that guest into full colour; when every card is done the whole painting is clear.
   Markup: <div data-placecards='{config JSON}'></div>  (or data-config-url="file.json").  Config: see fr1-m01.json.
   Reports to the "All Your Work" layer with a window 'mw-game' event at the end. */
(function () {
  'use strict';
  var CSS = '\
.pc{--ink:#1d2a44;--gold:#b8892e;--gold-lt:#e9d39a;--cream:#fbf6ea;--rule:#e2d6bb;--muted:#5e5a52;--wine:#8c2f39;--ok:#2f6b4f;\
font-family:"Segoe UI",Roboto,Helvetica,Arial,sans-serif;color:var(--ink);max-width:900px;margin:0 auto}\
.pc *{box-sizing:border-box}\
.pc-serif{font-family:"Cormorant Garamond",Garamond,Georgia,serif}\
.pc-head{text-align:center;margin-bottom:12px}\
.pc-kick{font-size:12.5px;letter-spacing:.2em;text-transform:uppercase;color:var(--gold)}\
.pc-title{font-family:"Cormorant Garamond",Garamond,Georgia,serif;font-size:38px;font-weight:600;line-height:1.1;margin:2px 0}\
.pc-intro{font-size:16.5px;line-height:1.55;color:#1a2340;max-width:680px;margin:6px auto 0}\
.pc-frame{background:#3b2a1a;padding:8px;border-radius:3px;box-shadow:0 6px 18px rgba(40,25,10,.35)}\
.pc-stage{position:relative;border:5px solid var(--gold);outline:1px solid var(--gold-lt);outline-offset:-9px;overflow:hidden;line-height:0}\
.pc-base{display:block;width:100%;height:auto;filter:blur(3.5px) saturate(.12) sepia(.45) brightness(.8) contrast(.85);transition:filter 2.4s ease}\
.pc-base.clear{filter:none}\
.pc-rev{position:absolute;inset:0;background-size:100% 100%;opacity:0;filter:blur(6px) saturate(.3);transition:opacity 1.3s ease,filter 1.6s ease}\
.pc-rev.on{opacity:1;filter:none}\
.pc-svg{position:absolute;inset:0;width:100%;height:100%;pointer-events:none}\
.pc-ring{fill:none;stroke:#f3d77e;stroke-width:5;stroke-dasharray:16 12;animation:pcdash 1.2s linear infinite;filter:drop-shadow(0 0 4px rgba(0,0,0,.6))}\
@keyframes pcdash{to{stroke-dashoffset:-56}}\
.pc-tag{position:absolute;transform:translate(-50%,-50%);background:var(--cream);border:1px solid var(--gold);color:var(--ink);font-family:"Cormorant Garamond",Georgia,serif;\
font-size:19px;font-weight:600;line-height:1.2;padding:3px 10px;border-radius:2px;box-shadow:0 2px 6px rgba(0,0,0,.35);white-space:nowrap;transition:opacity 1s ease,transform .6s ease;pointer-events:none}\
.pc-tag.fade{opacity:0;transform:translate(-50%,-70%)}\
.pc-credit{font-size:12px;color:var(--muted);text-align:center;font-style:italic;margin:8px 0 0}\
.pc-prog{display:flex;align-items:center;justify-content:center;gap:10px;margin:14px 0 6px;font-size:14px;color:var(--muted)}\
.pc-dots{display:flex;gap:5px}.pc-dots i{width:11px;height:11px;border-radius:50%;border:1.5px solid var(--gold);background:#fff}.pc-dots i.done{background:var(--gold)}\
.pc-card{position:relative;max-width:620px;margin:8px auto 0;background:#fffdf7;border:1px solid var(--rule);outline:1px solid var(--gold-lt);outline-offset:-7px;\
padding:18px 22px 16px;text-align:center;box-shadow:0 10px 22px rgba(60,40,10,.18);border-radius:2px}\
.pc-card::before{content:"";position:absolute;left:12%;right:12%;top:-1px;height:1px;background:linear-gradient(90deg,transparent,var(--gold),transparent)}\
.pc-for{font-size:14px;color:var(--muted)}.pc-for b{color:var(--ink);font-weight:600}\
.pc-line{display:flex;align-items:center;justify-content:center;flex-wrap:wrap;gap:8px;margin:12px 0 8px;font-family:"Cormorant Garamond",Georgia,serif;font-size:34px;font-weight:600;min-height:62px}\
.pc-slot{font:inherit;color:var(--wine);min-width:120px;height:54px;padding:0 12px;border:2px dashed var(--gold);border-radius:6px;background:var(--cream);cursor:pointer;transition:all .3s ease}\
.pc-slot:hover,.pc-slot.over{background:#f7ecd2;border-style:solid}\
.pc-slot:focus-visible{outline:3px solid #2b4c8c;outline-offset:2px}\
.pc-slot.bad{border-color:var(--wine);background:#fbecec;animation:pcshake .4s}\
.pc-slot.filled{border:2px solid transparent;background:transparent;cursor:default;min-width:0;padding:0 2px}\
.pc-slot.gone{min-width:0;width:0;padding:0;border-width:0;margin:0 -4px;opacity:0}\
@keyframes pcshake{20%,60%{transform:translateX(-6px)}40%,80%{transform:translateX(6px)}}\
.pc-tray{display:flex;align-items:center;justify-content:center;gap:12px;flex-wrap:wrap;min-height:52px}\
.pc-chip{font-family:"Cormorant Garamond",Georgia,serif;font-size:30px;font-weight:600;color:var(--wine);background:#fff;border:1.5px solid var(--gold);border-radius:999px;\
padding:4px 22px;box-shadow:0 3px 8px rgba(60,40,10,.18);cursor:grab;touch-action:none;user-select:none}\
.pc-chip.drag{position:fixed;z-index:50;pointer-events:none;cursor:grabbing;box-shadow:0 8px 18px rgba(60,40,10,.3)}\
.pc-chip.ghost{opacity:.3}\
.pc-help{font-size:13.5px;color:var(--muted)}\
.pc-fb{min-height:24px;font-size:15.5px;line-height:1.5;margin-top:8px}.pc-fb.ok{color:var(--ok)}.pc-fb.no{color:var(--wine)}\
.pc-say{background:var(--ink);color:#fff;border:none;border-radius:50%;width:36px;height:36px;font-size:15px;cursor:pointer;vertical-align:middle;margin-left:6px;box-shadow:0 0 0 2px #fff,0 0 0 3px var(--gold-lt)}\
.pc-end{text-align:center;margin:16px auto 0;max-width:640px}\
.pc-end h3{font-family:"Cormorant Garamond",Georgia,serif;font-size:34px;font-weight:600;margin:0}\
.pc-end p{font-size:16px;color:#1a2340;margin:4px 0 10px}\
.pc-btn{background:var(--ink);color:#fff;border:none;border-bottom:3px solid var(--gold);border-radius:999px;padding:10px 24px;font-size:15px;cursor:pointer;font-family:inherit}\
.pc-plan{display:flex;flex-wrap:wrap;justify-content:center;gap:10px;margin:14px 0 4px}\
.pc-mini{background:#fffdf7;border:1px solid var(--rule);outline:1px solid var(--gold-lt);outline-offset:-4px;padding:7px 14px;font-family:"Cormorant Garamond",Georgia,serif;font-size:20px;font-weight:600}\
.pc-mini b{color:var(--wine)}\
@media (max-width:600px){.pc-title{font-size:30px}.pc-line{font-size:27px}.pc-slot{min-width:84px;height:46px}.pc-chip{font-size:25px}.pc-tag{font-size:14px}}\
';

  function el(tag, cls, html) { var e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; }
  function shuffle(a) { for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)), t = a[i]; a[i] = a[j]; a[j] = t; } return a; }

  // ---- sound: soft piano-like tones (Web Audio, made on first click) ----
  var AC = null;
  function ctx() { if (!AC) { try { AC = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { return null; } } if (AC.state === 'suspended') AC.resume(); return AC; }
  function note(f, t0, dur, gain) {
    var c = ctx(); if (!c) return; var t = c.currentTime + t0;
    [[1, 'triangle', 1], [2, 'sine', .35], [3, 'sine', .12]].forEach(function (h) {
      var o = c.createOscillator(), g = c.createGain(); o.type = h[1]; o.frequency.value = f * h[0];
      g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(gain * h[2], t + .012); g.gain.exponentialRampToValueAtTime(.0008, t + dur);
      o.connect(g); g.connect(c.destination); o.start(t); o.stop(t + dur + .05);
    });
  }
  function chime() { note(659.3, 0, .9, .16); note(987.8, .09, 1.1, .12); }
  function thud() { note(146.8, 0, .35, .14); note(138.6, .05, .4, .1); }
  function finale() {  // a little waltz cadence
    [[523.3, 0], [659.3, .16], [784, .32], [1046.5, .48], [987.8, .72], [784, .88], [880, 1.04]].forEach(function (n) { note(n[0], n[1], .9, .11); });
    [523.3, 659.3, 784, 1046.5].forEach(function (f) { note(f, 1.3, 2.4, .08); });
  }

  function Game(root, cfg) {
    this.root = root; this.cfg = cfg; this.base = cfg.audioBase || '';
    this.player = new Audio(); this.build(); this.start();
  }
  Game.prototype.build = function () {
    var c = this.cfg, self = this, r = this.root;
    r.classList.add('pc');
    var head = el('div', 'pc-head');
    head.appendChild(el('div', 'pc-kick', 'Jeu &middot; Game'));
    head.appendChild(el('div', 'pc-title', c.title));
    head.appendChild(el('div', 'pc-intro', c.intro));
    r.appendChild(head);
    var frame = el('div', 'pc-frame'), stage = el('div', 'pc-stage');
    this.baseImg = el('img', 'pc-base'); this.baseImg.src = c.img; this.baseImg.alt = 'Renoir, Le Déjeuner des canotiers';
    stage.appendChild(this.baseImg);
    this.revs = {};
    c.guests.forEach(function (g) {
      var d = el('div', 'pc-rev'), m = 'radial-gradient(ellipse ' + (g.rx * 1.35 / c.w * 100) + '% ' + (g.ry * 1.35 / c.h * 100) + '% at ' + (g.x / c.w * 100) + '% ' + (g.y / c.h * 100) + '%, #000 68%, transparent 100%)';
      d.style.backgroundImage = 'url("' + c.img + '")';
      d.style.webkitMaskImage = m; d.style.maskImage = m;
      stage.appendChild(d); self.revs[g.id] = d;
    });
    var NS = 'http://www.w3.org/2000/svg', svg = document.createElementNS(NS, 'svg');
    svg.setAttribute('class', 'pc-svg'); svg.setAttribute('viewBox', '0 0 ' + c.w + ' ' + c.h); svg.setAttribute('preserveAspectRatio', 'none');
    this.ring = document.createElementNS(NS, 'ellipse'); this.ring.setAttribute('class', 'pc-ring'); svg.appendChild(this.ring);
    stage.appendChild(svg); this.stage = stage;
    frame.appendChild(stage); r.appendChild(frame);
    r.appendChild(el('div', 'pc-credit', c.credit || ''));
    this.prog = el('div', 'pc-prog'); r.appendChild(this.prog);
    var card = el('div', 'pc-card'); this.card = card;
    this.forEl = el('div', 'pc-for'); card.appendChild(this.forEl);
    this.line = el('div', 'pc-line'); card.appendChild(this.line);
    this.tray = el('div', 'pc-tray'); card.appendChild(this.tray);
    this.fb = el('div', 'pc-fb'); card.appendChild(this.fb);
    r.appendChild(card);
    this.end = el('div', 'pc-end'); this.end.hidden = true; r.appendChild(this.end);
  };
  Game.prototype.start = function () {
    var self = this;
    this.order = shuffle(this.cfg.guests.slice()); this.i = 0; this.first = 0; this.doneIds = [];
    Object.keys(this.revs).forEach(function (k) { self.revs[k].classList.remove('on'); });
    this.baseImg.classList.remove('clear');
    [].slice.call(this.stage.querySelectorAll('.pc-tag')).forEach(function (t) { t.remove(); });
    this.card.hidden = false; this.end.hidden = true; this.ring.style.display = '';
    this.show();
  };
  Game.prototype.progress = function () {
    var n = this.cfg.guests.length, k = this.doneIds.length, dots = '';
    for (var j = 0; j < n; j++) dots += '<i class="' + (j < k ? 'done' : '') + '"></i>';
    this.prog.innerHTML = '<span class="pc-dots">' + dots + '</span><span>' + k + ' / ' + n + ' &agrave; table</span>';
  };
  Game.prototype.show = function () {
    var g = this.cur = this.order[this.i], self = this;
    this.tries = 0; this.locked = false; this.progress();
    this.ring.setAttribute('cx', g.x); this.ring.setAttribute('cy', g.y); this.ring.setAttribute('rx', g.rx); this.ring.setAttribute('ry', g.ry);
    this.forEl.innerHTML = 'Place card for <b>' + g.who + '</b>';
    this.line.innerHTML = '';
    this.line.appendChild(el('span', 'pc-art', g.art));
    this.slotB = el('button', 'pc-slot'); this.slotB.type = 'button'; this.slotB.setAttribute('aria-label', 'Before ' + g.noun); this.slotB.dataset.side = 'before';
    this.line.appendChild(this.slotB);
    this.line.appendChild(el('span', 'pc-noun', g.noun));
    this.slotA = el('button', 'pc-slot'); this.slotA.type = 'button'; this.slotA.setAttribute('aria-label', 'After ' + g.noun); this.slotA.dataset.side = 'after';
    this.line.appendChild(this.slotA);
    [this.slotB, this.slotA].forEach(function (s) { s.addEventListener('click', function () { self.choose(s.dataset.side); }); });
    this.tray.innerHTML = '';
    this.chip = el('span', 'pc-chip', g.adj); this.chip.setAttribute('aria-hidden', 'true');
    this.tray.appendChild(this.chip);
    this.tray.appendChild(el('span', 'pc-help', 'Drag the word into a box, or tap a box.'));
    this.fb.className = 'pc-fb'; this.fb.innerHTML = '';
    this.drag(this.chip);
  };
  Game.prototype.drag = function (chip) {
    var self = this, ghost = null, ox = 0, oy = 0, over = null;
    function slotAt(x, y) { var e = document.elementFromPoint(x, y); return e && e.closest ? e.closest('.pc-slot') : null; }
    chip.addEventListener('pointerdown', function (e) {
      if (self.locked) return; e.preventDefault(); ctx();
      var r = chip.getBoundingClientRect(); ox = e.clientX - r.left; oy = e.clientY - r.top;
      ghost = chip.cloneNode(true); ghost.classList.add('drag'); ghost.style.left = r.left + 'px'; ghost.style.top = r.top + 'px'; document.body.appendChild(ghost);
      chip.classList.add('ghost'); chip.setPointerCapture(e.pointerId);
    });
    chip.addEventListener('pointermove', function (e) {
      if (!ghost) return; ghost.style.left = (e.clientX - ox) + 'px'; ghost.style.top = (e.clientY - oy) + 'px';
      var s = slotAt(e.clientX, e.clientY); if (over && over !== s) over.classList.remove('over'); over = s; if (s) s.classList.add('over');
    });
    function up(e) {
      if (!ghost) return; ghost.remove(); ghost = null; chip.classList.remove('ghost');
      var s = slotAt(e.clientX, e.clientY); if (over) over.classList.remove('over'); over = null;
      if (s && s.dataset.side) self.choose(s.dataset.side);
    }
    chip.addEventListener('pointerup', up); chip.addEventListener('pointercancel', up);
  };
  Game.prototype.choose = function (side) {
    if (this.locked) return; ctx();
    var g = this.cur, self = this, slot = side === 'before' ? this.slotB : this.slotA;
    this.tries++;
    if (side !== g.pos) {
      thud(); slot.classList.remove('bad'); void slot.offsetWidth; slot.classList.add('bad');
      this.fb.className = 'pc-fb no'; this.fb.innerHTML = 'Not quite. ' + g.hint;
      setTimeout(function () { slot.classList.remove('bad'); }, 700);
      return;
    }
    this.locked = true; if (this.tries === 1) this.first++;
    var other = side === 'before' ? this.slotA : this.slotB;
    slot.textContent = g.adj; slot.classList.add('filled'); other.classList.add('gone'); other.tabIndex = -1;
    this.tray.innerHTML = '';
    var phrase = g.pos === 'before' ? g.art + ' ' + g.adj + ' ' + g.noun : g.art + ' ' + g.noun + ' ' + g.adj;
    this.fb.className = 'pc-fb ok';
    this.fb.innerHTML = (this.tries === 1 ? 'Parfait&nbsp;! ' : 'Yes. ') + g.hint;
    if (g.audio) {
      var b = el('button', 'pc-say', '&#128266;'); b.type = 'button'; b.setAttribute('aria-label', 'Écouter : ' + phrase);
      b.addEventListener('click', function () { self.play(g.audio); }); this.fb.appendChild(b);
      setTimeout(function () { self.play(g.audio); }, 350);
    }
    chime();
    this.revs[g.id].classList.add('on');
    var tag = el('div', 'pc-tag', phrase); tag.style.left = (g.x / this.cfg.w * 100) + '%'; tag.style.top = (g.y / this.cfg.h * 100) + '%';
    this.stage.appendChild(tag); setTimeout(function () { tag.classList.add('fade'); }, 2600);
    this.doneIds.push({ g: g, phrase: phrase }); this.progress();
    setTimeout(function () { self.next(); }, 2900);
  };
  Game.prototype.play = function (src) { try { this.player.pause(); this.player.src = this.base + src; this.player.play().catch(function () {}); } catch (e) {} };
  Game.prototype.next = function () {
    this.i++;
    if (this.i < this.order.length) { this.show(); return; }
    var self = this, n = this.order.length;
    this.ring.style.display = 'none'; this.card.hidden = true; this.baseImg.classList.add('clear');
    finale();
    var plan = this.doneIds.map(function (d) {
      var g = d.g; return '<span class="pc-mini">' + (g.pos === 'before' ? g.art + ' <b>' + g.adj + '</b> ' + g.noun : g.art + ' ' + g.noun + ' <b>' + g.adj + '</b>') + '</span>';
    }).join('');
    this.end.innerHTML = '<h3>Tout le monde est &agrave; table&nbsp;!</h3><p>Everyone is seated. <strong>' + this.first + ' of ' + n + '</strong> cards right on the first try.</p>' +
      '<div class="pc-kick" style="margin-top:6px">Le plan de table</div><div class="pc-plan">' + plan + '</div>' +
      '<button class="pc-btn" type="button">Rejouer &middot; Play again</button>';
    this.end.hidden = false;
    this.end.querySelector('.pc-btn').addEventListener('click', function () { self.start(); window.scrollTo({ top: self.root.getBoundingClientRect().top + window.pageYOffset - 10, behavior: 'smooth' }); });  // never scrollIntoView: in a Canvas iframe it scrolls the parent page
    try { window.dispatchEvent(new CustomEvent('mw-game', { detail: { name: this.cfg.title, done: true, summary: 'All ' + n + ' guests seated; ' + this.first + ' of ' + n + ' right on the first try.' } })); } catch (e) {}
  };

  function init() {
    if (!document.getElementById('pc-css')) { var s = document.createElement('style'); s.id = 'pc-css'; s.textContent = CSS; document.head.appendChild(s); }
    [].slice.call(document.querySelectorAll('[data-placecards]')).forEach(function (root) {
      if (root.dataset.pcReady) return; root.dataset.pcReady = '1';
      var raw = root.getAttribute('data-placecards'), url = root.getAttribute('data-config-url');
      if (raw) new Game(root, JSON.parse(raw));
      else if (url) fetch(url).then(function (r) { return r.json(); }).then(function (c) { new Game(root, c); });
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
