/* La nature morte: hear it, find it (David 2026-10-26). A few French still-life paintings in a row. For each food the
   student hears the word (with its partitive: "du pain", "des fruits") and taps it in the black-and-white painting. A right tap
   brings that part of the black-and-white painting into full colour and pins the word on it; when a painting is complete it clears and
   shows its museum label. Tapping another food names it ("Ça, c'est du poisson."), so wrong taps still teach.
   After 2 misses the word is shown; after 3 a ring marks the spot.
   Markup: <div data-naturemorte='{config JSON}'></div>  (or data-config-url="file.json"). Config: see fr1-m03-naturemorte.json.
   Reports to the "All Your Work" layer with a window 'mw-game' event at the end. */
(function () {
  'use strict';
  var CSS = '\
.nm{--ink:#1d2a44;--gold:#b8892e;--gold-lt:#e9d39a;--cream:#fbf6ea;--rule:#e2d6bb;--muted:#5e5a52;--wine:#8c2f39;--ok:#2f6b4f;\
font-family:"Segoe UI",Roboto,Helvetica,Arial,sans-serif;color:var(--ink);max-width:900px;margin:0 auto}\
.nm *{box-sizing:border-box}\
.nm-head{text-align:center;margin-bottom:12px}\
.nm-kick{font-size:12.5px;letter-spacing:.2em;text-transform:uppercase;color:var(--gold)}\
.nm-title{font-family:"Cormorant Garamond",Garamond,Georgia,serif;font-size:38px;font-weight:600;line-height:1.1;margin:2px 0}\
.nm-intro{font-size:16.5px;line-height:1.55;color:#1a2340;max-width:680px;margin:6px auto 0}\
.nm-frame{background:#3b2a1a;padding:8px;border-radius:3px;box-shadow:0 6px 18px rgba(40,25,10,.35)}\
.nm-stage{position:relative;border:5px solid var(--gold);outline:1px solid var(--gold-lt);outline-offset:-9px;overflow:hidden;line-height:0;cursor:crosshair;touch-action:manipulation}\
.nm-base{display:block;width:100%;height:auto;filter:grayscale(1);transition:filter 2.2s ease;user-select:none;-webkit-user-drag:none}\
.nm-base.clear{filter:none}\
.nm-rev{position:absolute;inset:0;background-size:100% 100%;opacity:0;transition:opacity 1s ease;pointer-events:none}\
.nm-rev.on{opacity:1}\
.nm-svg{position:absolute;inset:0;width:100%;height:100%;pointer-events:none}\
.nm-ring{fill:none;stroke:#f3d77e;stroke-width:5;stroke-dasharray:16 12;animation:nmdash 1.2s linear infinite;filter:drop-shadow(0 0 4px rgba(0,0,0,.6))}\
@keyframes nmdash{to{stroke-dashoffset:-56}}\
.nm-tap{fill:none;stroke:#fff;stroke-width:3;opacity:.9;animation:nmtap .6s ease-out forwards}\
@keyframes nmtap{from{r:6;opacity:.95}to{r:34;opacity:0}}\
.nm-tag{position:absolute;transform:translate(-50%,-50%);background:var(--cream);border:1px solid var(--gold);color:var(--ink);font-family:"Cormorant Garamond",Georgia,serif;\
font-size:20px;font-weight:600;line-height:1.15;padding:3px 10px 4px;border-radius:2px;box-shadow:0 2px 6px rgba(0,0,0,.35);white-space:nowrap;pointer-events:none;text-align:center}\
.nm-tag small{display:block;font:12px "Segoe UI",Arial,sans-serif;color:var(--muted)}\
.nm-label{max-width:560px;margin:12px auto 0;background:#fffdf7;border:1px solid var(--rule);border-radius:3px;padding:9px 16px;font-size:14px;line-height:1.5;text-align:center;box-shadow:0 1px 3px rgba(0,0,0,.08)}\
.nm-label b{font-family:"Cormorant Garamond",Georgia,serif;font-size:19px}.nm-label i{font-family:"Cormorant Garamond",Georgia,serif;font-size:18px}.nm-label span{color:var(--muted)}\
.nm-prog{display:flex;align-items:center;justify-content:center;gap:10px;margin:14px 0 6px;font-size:14px;color:var(--muted);flex-wrap:wrap}\
.nm-dots{display:flex;gap:5px}.nm-dots i{width:11px;height:11px;border-radius:50%;border:1.5px solid var(--gold);background:#fff}.nm-dots i.done{background:var(--gold)}\
.nm-card{position:relative;max-width:620px;margin:8px auto 0;background:#fffdf7;border:1px solid var(--rule);outline:1px solid var(--gold-lt);outline-offset:-7px;\
padding:16px 22px 14px;text-align:center;box-shadow:0 10px 22px rgba(60,40,10,.18);border-radius:2px}\
.nm-ask{display:flex;align-items:center;justify-content:center;gap:14px;flex-wrap:wrap}\
.nm-say{width:58px;height:58px;border-radius:50%;border:0;background:var(--ink);color:#fff;font-size:26px;cursor:pointer;box-shadow:inset 0 -3px 0 var(--gold);flex-shrink:0}\
.nm-say:hover{background:#1b2d5e}.nm-say:focus-visible{outline:3px solid #2b4c8c;outline-offset:3px}\
.nm-q{font-size:17px;text-align:left}.nm-q b{font-family:"Cormorant Garamond",Georgia,serif;font-size:26px;color:var(--wine)}\
.nm-show{background:none;border:0;color:#2b4c8c;text-decoration:underline;cursor:pointer;font-size:13.5px;padding:2px 0;margin-top:2px}\
.nm-fb{min-height:24px;margin-top:10px;font-size:15.5px;line-height:1.45}\
.nm-fb.ok{color:var(--ok)}.nm-fb.no{color:var(--wine)}\
.nm-btn{display:inline-block;background:var(--ink);color:#fff;border:0;border-radius:999px;padding:10px 22px;font-size:15.5px;cursor:pointer;box-shadow:inset 0 -2px 0 var(--gold);margin-top:10px}\
.nm-btn:hover{background:#1b2d5e}\
.nm-end{text-align:center;margin-top:14px}.nm-end h3{font-family:"Cormorant Garamond",Georgia,serif;font-size:30px;margin:4px 0}\
.nm-words{display:flex;flex-wrap:wrap;gap:8px;justify-content:center;margin:10px 0}\
.nm-word{background:var(--cream);border:1px solid var(--gold-lt);border-radius:999px;padding:4px 12px;font-size:15px;cursor:pointer}\
.nm-word small{color:var(--muted)}\
@media (prefers-reduced-motion:reduce){.nm-base,.nm-rev{transition:none}.nm-ring{animation:none}}';

  function el(tag, cls, html) { var e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; }
  function shuffle(a) { for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)), t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
  var AC = null;
  function ctx() { if (!AC) { try { AC = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { return null; } } if (AC.state === 'suspended') AC.resume(); return AC; }
  // Accordion (bal musette) voice, David 2026-10-26: each note = three reeds, the outer two tuned a little sharp and flat
  // (the "wet" musette beating), sawtooth through a soft low-pass, bellows-like attack and release. Melodies are original.
  var MIX = null;
  function out() { var a = ctx(); if (!a) return null; if (!MIX) { MIX = a.createDynamicsCompressor(); MIX.connect(a.destination); } return MIX; }
  function reed(f, t0, dur, gain, bright) {
    var a = ctx(), m = out(); if (!a || !m) return; var t = a.currentTime + t0, lp = a.createBiquadFilter(), g = a.createGain();
    lp.type = 'lowpass'; lp.frequency.value = bright || 2600; lp.Q.value = 0.7; lp.connect(g); g.connect(m);
    g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(gain, t + 0.035); g.gain.setValueAtTime(gain * 0.9, t + Math.max(0.04, dur - 0.07));
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur + 0.06);
    [1, 1.0045, 0.9955].forEach(function (d, k) { var o = a.createOscillator(), og = a.createGain(); o.type = 'sawtooth'; o.frequency.value = f * d;
      og.gain.value = k ? 0.32 : 0.45; o.connect(og); og.connect(lp); o.start(t); o.stop(t + dur + 0.1); });
  }
  function bass(f, t0, dur, gain) { reed(f, t0, dur, gain, 900); }
  function chord(fs, t0, dur, gain) { fs.forEach(function (f) { reed(f, t0, dur, gain, 1800); }); }
  var N = { G3: 196, C4: 261.6, E4: 329.6, G4: 392, B4: 493.9, C5: 523.3, D5: 587.3, E5: 659.3, F5: 698.5, G5: 784, A5: 880, C6: 1046.5, C3: 130.8, G2: 98, F3: 174.6, A4: 440 };
  function waltz(bars, beat) {   // bars: [[bassNote, chordNotes, [[melodyNote, beatOffset, beats], ...]], ...]
    bars.forEach(function (b, i) { var t = i * 3 * beat;
      bass(N[b[0]], t, beat * 0.8, 0.07); chord(b[1].map(function (n) { return N[n]; }), t + beat, beat * 0.45, 0.022); chord(b[1].map(function (n) { return N[n]; }), t + 2 * beat, beat * 0.45, 0.022);
      b[2].forEach(function (m) { reed(N[m[0]], t + m[1] * beat, m[2] * beat * 0.95, 0.045); }); });
  }
  function chime() { reed(N.E5, 0, .11, .045); reed(N.G5, .12, .11, .045); reed(N.C6, .24, .4, .05); bass(N.C3, 0, .3, .04); chord([N.E4, N.G4], .24, .38, .016); }
  function thud() { reed(146.8, 0, .18, .045, 700); reed(138.6, .2, .3, .04, 600); }   // a soft sigh of the bellows
  function cadence() {   // painting complete: two bars of valse musette
    waltz([['C3', ['E4', 'G4'], [['G5', 0, 1], ['E5', 1, 1], ['C5', 2, 1]]], ['G2', ['F3', 'B4'], [['D5', 0, 1], ['F5', 1, 1], ['E5', 2, 1]]]], 0.3);
    reed(N.C5, 1.8, .7, .06); bass(N.C3, 1.8, .6, .06); chord([N.E4, N.G4], 1.8, .6, .02);
  }
  function finale() {   // end of the game: four bars
    waltz([['C3', ['E4', 'G4'], [['E5', 0, 1], ['G5', 1, 1], ['C6', 2, 1]]], ['F3', ['A4', 'C5'], [['A5', 0, 2], ['G5', 2, 1]]],
           ['G2', ['F3', 'B4'], [['F5', 0, 1], ['E5', 1, 1], ['D5', 2, 1]]], ['C3', ['E4', 'G4'], [['C5', 0, 1], ['E5', 1, 1], ['G5', 2, 1]]]], 0.3);
    reed(N.C6, 3.6, 1.0, .06); bass(N.C3, 3.6, .9, .06); chord([N.E4, N.G4, N.C5], 3.6, .9, .02);
  }

  function inShape(s, x, y) { var dx = (x - s[0]) / s[2], dy = (y - s[1]) / s[3]; return dx * dx + dy * dy <= 1; }
  function hit(item, x, y) { return item.shapes.some(function (s) { return inShape(s, x, y); }); }

  // No sound until the student touches the game (David 2026-10-27: "when I tap to enter 6.03, the French auto-plays"):
  // the first sentence waits for the 🔊 button or a tap; after that each new sentence plays by itself, as before.
  function Game(root, cfg) { var self = this; this.root = root; this.cfg = cfg; this.base = cfg.audioBase || ''; this.player = new Audio(); this.armed = false;
    root.addEventListener('pointerdown', function () { self.armed = true; }, true); root.addEventListener('keydown', function () { self.armed = true; }, true);
    this.build(); this.start(); }
  Game.prototype.build = function () {
    var c = this.cfg, self = this, r = this.root; r.classList.add('nm');
    var head = el('div', 'nm-head');
    head.appendChild(el('div', 'nm-kick', c.kicker || 'Jeu &middot; Game'));
    head.appendChild(el('div', 'nm-title', c.title)); head.appendChild(el('div', 'nm-intro', c.intro)); r.appendChild(head);
    var frame = el('div', 'nm-frame'); this.stage = el('div', 'nm-stage'); frame.appendChild(this.stage); r.appendChild(frame);
    this.stage.addEventListener('click', function (e) { self.tap(e); });
    this.labelEl = el('div', 'nm-label'); r.appendChild(this.labelEl);
    this.prog = el('div', 'nm-prog'); r.appendChild(this.prog);
    var card = el('div', 'nm-card'); this.card = card;
    var ask = el('div', 'nm-ask'); this.sayBtn = el('button', 'nm-say', '&#128266;'); this.sayBtn.type = 'button';
    this.sayBtn.addEventListener('click', function () { self.play(self.cur.audio); });
    this.q = el('div', 'nm-q'); ask.appendChild(this.sayBtn); ask.appendChild(this.q); card.appendChild(ask);
    this.fb = el('div', 'nm-fb'); card.appendChild(this.fb); r.appendChild(card);
    this.end = el('div', 'nm-end'); this.end.hidden = true; r.appendChild(this.end);
  };
  Game.prototype.start = function () {
    this.ri = 0; this.first = 0; this.total = 0; this.found = [];
    this.card.hidden = false; this.end.hidden = true; this.round();
  };
  Game.prototype.round = function () {
    var R = this.R = this.cfg.rounds[this.ri], self = this, st = this.stage;
    st.innerHTML = ''; this.labelEl.hidden = true;
    this.baseImg = el('img', 'nm-base'); this.baseImg.src = R.img; this.baseImg.alt = R.alt; this.baseImg.draggable = false; st.appendChild(this.baseImg);
    this.revs = {};
    R.items.forEach(function (it) {
      var d = el('div', 'nm-rev'), m = it.shapes.map(function (s) {
        return 'radial-gradient(ellipse ' + (s[2] * 1.3 / R.w * 100) + '% ' + (s[3] * 1.3 / R.h * 100) + '% at ' + (s[0] / R.w * 100) + '% ' + (s[1] / R.h * 100) + '%, #000 70%, transparent 100%)'; }).join(',');
      d.style.backgroundImage = 'url("' + R.img + '")'; d.style.webkitMaskImage = m; d.style.maskImage = m; st.appendChild(d); self.revs[it.id] = d;
    });
    var NS = 'http://www.w3.org/2000/svg'; this.svg = document.createElementNS(NS, 'svg'); this.svg.setAttribute('class', 'nm-svg');
    this.svg.setAttribute('viewBox', '0 0 ' + R.w + ' ' + R.h); this.svg.setAttribute('preserveAspectRatio', 'none');
    this.ring = document.createElementNS(NS, 'ellipse'); this.ring.setAttribute('class', 'nm-ring'); this.ring.style.display = 'none'; this.svg.appendChild(this.ring);
    st.appendChild(this.svg);
    this.order = shuffle(R.items.slice()); this.ii = 0; this.doneRound = [];
    this.ask();
  };
  Game.prototype.progress = function () {
    var R = this.R, n = R.items.length, k = this.doneRound.length, dots = '';
    for (var j = 0; j < n; j++) dots += '<i class="' + (j < k ? 'done' : '') + '"></i>';
    this.prog.innerHTML = '<span>Tableau ' + (this.ri + 1) + ' / ' + this.cfg.rounds.length + '</span><span class="nm-dots">' + dots + '</span><span>' + k + ' / ' + n + ' trouv&eacute;' + (k > 1 ? 's' : '') + '</span>';
  };
  Game.prototype.ask = function () {
    var it = this.cur = this.order[this.ii], self = this; this.tries = 0; this.locked = false; this.shown = false;
    this.ring.style.display = 'none'; this.progress();
    var T = this.cfg.text || {};   // optional wording per game (La nature morte = foods; Module 4 = who did what)
    this.q.innerHTML = '<div>' + (T.ask || '&Eacute;coute et trouve-le dans le tableau.') + '</div><div style="font-size:14px;color:var(--muted)">' + (T.askEn || 'Listen, then tap that food in the painting.') + '</div>';
    var sb = el('button', 'nm-show', T.show || 'Show me the word'); sb.type = 'button'; sb.addEventListener('click', function () { self.reveal(); }); this.q.appendChild(sb);
    this.fb.className = 'nm-fb'; this.fb.innerHTML = '';
    this.sayBtn.setAttribute('aria-label', 'Écouter le mot');
    if (this.armed) setTimeout(function () { self.play(it.audio); }, 450);
  };
  Game.prototype.reveal = function () {
    if (this.shown) return; this.shown = true; var it = this.cur;
    this.q.innerHTML = '<div>' + ((this.cfg.text || {}).find || 'Trouve') + ' <b lang="fr">' + it.fr + '</b></div><div style="font-size:14px;color:var(--muted)">(' + it.en + ')</div>';
  };
  Game.prototype.tap = function (e) {
    if (this.locked || this.card.hidden) return;
    var R = this.R, rect = this.stage.getBoundingClientRect(), x = (e.clientX - rect.left) / rect.width * R.w, y = (e.clientY - rect.top) / rect.height * R.h, self = this;
    var NS = 'http://www.w3.org/2000/svg', c = document.createElementNS(NS, 'circle'); c.setAttribute('cx', x); c.setAttribute('cy', y); c.setAttribute('r', 6); c.setAttribute('class', 'nm-tap');
    this.svg.appendChild(c); setTimeout(function () { c.remove(); }, 700);
    var it = this.cur, owner = R.items.filter(function (o) { return hit(o, x, y); })[0];   // items are listed small-first
    if (owner === it) { this.right(); return; }
    this.tries++; thud();
    var other = owner && this.doneRound.indexOf(owner) < 0 ? owner : (owner || null), msg;
    if (other) { var TT = this.cfg.text || {}; msg = (TT.other || '&Ccedil;a, c&rsquo;est <b lang="fr">{fr}</b> ({en}). Listen again: you are looking for something else.').replace('{fr}', other.fr).replace('{en}', other.en); var cur = it, oa = other.audio; setTimeout(function () { if (self.cur === cur) self.play(oa); }, 600); setTimeout(function () { if (self.cur === cur) self.play(cur.audio); }, 2300); }
    else msg = (this.cfg.text || {}).notThere || 'Not there. Press &#128266; to hear the word again, then look at the painting.';
    if (this.tries >= 2) { this.reveal(); msg += ' ' + ((this.cfg.text || {}).shown || 'The word is shown above.'); }
    if (this.tries >= 3) { var s = it.shapes[0]; this.ring.setAttribute('cx', s[0]); this.ring.setAttribute('cy', s[1]); this.ring.setAttribute('rx', s[2]); this.ring.setAttribute('ry', s[3]); this.ring.style.display = ''; msg = 'It is inside the gold ring. Tap it.'; }
    this.fb.className = 'nm-fb no'; this.fb.innerHTML = msg;
  };
  Game.prototype.right = function () {
    var it = this.cur, R = this.R, self = this; this.locked = true; this.ring.style.display = 'none';
    if (this.tries === 0) this.first++; this.total++;
    chime(); this.revs[it.id].classList.add('on'); this.reveal();
    var tag = el('div', 'nm-tag', '<span lang="fr">' + it.fr + '</span><small>' + it.en + '</small>');
    tag.style.left = (it.tag[0] / R.w * 100) + '%'; tag.style.top = (it.tag[1] / R.h * 100) + '%'; this.stage.appendChild(tag);
    this.fb.className = 'nm-fb ok'; this.fb.innerHTML = (this.tries === 0 ? 'Bravo&nbsp;! ' : 'Oui&nbsp;! ') + ((this.cfg.text || {}).right || '<b lang="fr">{fr}</b>: {en}.').replace('{fr}', it.fr).replace('{en}', it.en);
    setTimeout(function () { self.play(it.audio); }, 850);   // after the accordion flourish, never on top of it
    this.doneRound.push(it); this.found.push(it); this.progress();
    setTimeout(function () { self.next(); }, 2000);
  };
  Game.prototype.next = function () {
    var self = this, R = this.R; this.ii++;
    if (this.ii < this.order.length) { this.ask(); return; }
    this.baseImg.classList.add('clear'); cadence();
    this.labelEl.innerHTML = '<b>' + R.painter + '</b> <span>(' + R.life + ')</span><br><i' + (R.title_en ? ' lang="fr"' : '') + '>' + R.title + '</i>' + (R.title_en ? ' <span>(<em>' + R.title_en + '</em>)</span>' : '') + '<br><span>' + R.meta + '</span>';
    this.labelEl.hidden = false;
    var last = this.ri === this.cfg.rounds.length - 1;
    this.q.innerHTML = '<div><b style="font-size:24px;color:var(--ink)">Tableau complet&nbsp;!</b></div><div style="font-size:14px;color:var(--muted)">The whole painting is in colour.</div>';
    this.fb.className = 'nm-fb'; this.fb.innerHTML = '';
    var b = el('button', 'nm-btn', last ? 'Voir mes mots &middot; See my words &rarr;' : 'Tableau suivant &middot; Next painting &rarr;'); b.type = 'button';
    b.addEventListener('click', function () { if (last) self.finish(); else { self.ri++; self.round(); self.top(); } }); this.fb.appendChild(b);
  };
  Game.prototype.top = function () { window.scrollTo({ top: this.root.getBoundingClientRect().top + window.pageYOffset - 10, behavior: 'smooth' }); };   // never scrollIntoView: in a Canvas iframe it scrolls the parent page
  Game.prototype.finish = function () {
    var self = this, n = this.total; this.card.hidden = true;
    var seen = {}, words = this.found.filter(function (w) { if (seen[w.fr]) return false; seen[w.fr] = 1; return true; });
    var T = this.cfg.text || {};
    this.end.innerHTML = '<div class="nm-kick">' + this.cfg.rounds.length + ' tableaux &middot; ' + n + ' ' + (T.unit || 'aliments') + '</div><h3>' + (T.end || 'Bon app&eacute;tit&nbsp;!') + '</h3>' +
      '<p><strong>' + this.first + ' of ' + n + '</strong> found on the first tap. ' + (T.again || 'Click a word to hear it again.') + '</p><div class="nm-words"></div>' +
      '<button class="nm-btn" type="button">Rejouer &middot; Play again</button>';
    var box = this.end.querySelector('.nm-words');
    words.forEach(function (w) { var b = el('button', 'nm-word', '&#128266; <span lang="fr">' + w.fr + '</span> <small>' + w.en + '</small>'); b.type = 'button'; b.addEventListener('click', function () { self.play(w.audio); }); box.appendChild(b); });
    this.end.querySelector('.nm-btn:last-child').addEventListener('click', function () { self.start(); self.top(); });
    this.end.hidden = false; finale();
    try { window.dispatchEvent(new CustomEvent('mw-game', { detail: { name: this.cfg.title, done: true, summary: 'Found all ' + n + ' ' + (T.unitEn || 'foods') + ' in ' + this.cfg.rounds.length + ' paintings; ' + this.first + ' of ' + n + ' on the first tap.' } })); } catch (e) {}
  };
  Game.prototype.play = function (src) { if (!src) return; try { this.player.pause(); this.player.src = this.base + src; this.player.play().catch(function () {}); } catch (e) {} };

  function init() {
    if (!document.getElementById('nm-css')) { var s = document.createElement('style'); s.id = 'nm-css'; s.textContent = CSS; document.head.appendChild(s); }
    [].slice.call(document.querySelectorAll('[data-naturemorte]')).forEach(function (root) {
      if (root.dataset.nmReady) return; root.dataset.nmReady = '1';
      var raw = root.getAttribute('data-naturemorte'), url = root.getAttribute('data-config-url');
      if (raw) new Game(root, JSON.parse(raw));
      else if (url) fetch(url).then(function (r) { return r.json(); }).then(function (c) { new Game(root, c); });
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
