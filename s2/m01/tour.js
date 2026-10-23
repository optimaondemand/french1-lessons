/* La Tour scintille: listening game. Each round plays one word; the student picks the form they heard. Every right
   answer lights the next band of the Eiffel Tower from the base up (a thermometer of progress). All right: the whole
   tower glows gold, then sparkles like the real one on the hour, with the beacon sweeping the sky. Partly right: the
   tower is lit in proportion.  Markup: <div data-tour='{config}'></div>  (config: see fr1-m01-genre.json).
   Reports to "All Your Work" with a window 'mw-game' event at the end. */
(function () {
  'use strict';
  var NS = 'http://www.w3.org/2000/svg';
  var CSS = '\
.ts{--ink:#1d2a44;--gold:#b8892e;--gold-lt:#e9d39a;--cream:#fbf6ea;--rule:#e2d6bb;--muted:#5e5a52;--wine:#8c2f39;--ok:#2f6b4f;\
font-family:"Segoe UI",Roboto,Helvetica,Arial,sans-serif;color:var(--ink);max-width:900px;margin:0 auto}\
.ts *{box-sizing:border-box}\
.ts-head{text-align:center;margin-bottom:12px}\
.ts-kick{font-size:12.5px;letter-spacing:.2em;text-transform:uppercase;color:var(--gold)}\
.ts-title{font-family:"Cormorant Garamond",Garamond,Georgia,serif;font-size:38px;font-weight:600;line-height:1.1;margin:2px 0}\
.ts-intro{font-size:16.5px;line-height:1.55;color:#1a2340;max-width:680px;margin:6px auto 0}\
.ts-body{display:flex;flex-wrap:wrap;gap:20px;align-items:stretch;justify-content:center}\
.ts-night{flex:0 0 340px;max-width:100%;border-radius:4px;overflow:hidden;background:#0a1230;box-shadow:0 8px 22px rgba(10,15,40,.45);border:5px solid #3b2a1a;outline:2px solid var(--gold);outline-offset:-3px}\
.ts-night svg{display:block;width:100%;height:auto}\
.ts-side{flex:1 1 340px;display:flex;flex-direction:column;gap:12px;min-width:280px}\
.ts-card{background:#fffdf7;border:1px solid var(--rule);outline:1px solid var(--gold-lt);outline-offset:-7px;padding:20px 22px;text-align:center;box-shadow:0 8px 20px rgba(60,40,10,.14);border-radius:2px}\
.ts-q{font-size:14px;color:var(--muted);letter-spacing:.06em}\
.ts-play{display:inline-flex;align-items:center;gap:10px;margin:12px 0 6px;background:var(--ink);color:#fff;border:none;border-bottom:3px solid var(--gold);border-radius:999px;\
padding:12px 26px;font-size:18px;cursor:pointer;font-family:inherit;box-shadow:0 0 0 3px #fff,0 0 0 4px var(--gold-lt)}\
.ts-play:hover{background:#2b3d63}.ts-play.playing{background:var(--gold)}\
.ts-ask{font-size:15.5px;color:#1a2340;margin:8px 0 10px}\
.ts-choices{display:flex;justify-content:center;gap:12px;flex-wrap:wrap}\
.ts-choice{font-family:"Cormorant Garamond",Georgia,serif;font-size:32px;font-weight:600;color:var(--ink);background:#fff;border:2px solid var(--rule);border-radius:10px;\
min-width:150px;padding:6px 18px;cursor:pointer;transition:all .2s}\
.ts-choice:hover{border-color:var(--gold);background:var(--cream)}\
.ts-choice:focus-visible{outline:3px solid #2b4c8c;outline-offset:2px}\
.ts-choice.right{background:var(--ok);border-color:var(--ok);color:#fff}\
.ts-choice.wrong{background:#fbecec;border-color:var(--wine);color:var(--wine)}\
.ts-choice[disabled]{cursor:default}\
.ts-fb{min-height:46px;font-size:15.5px;line-height:1.5;margin-top:10px}.ts-fb.ok{color:var(--ok)}.ts-fb.no{color:var(--wine)}\
.ts-next{margin-top:8px;background:transparent;border:1.5px solid var(--gold);color:var(--ink);border-radius:999px;padding:7px 20px;font-size:15px;cursor:pointer;font-family:inherit}\
.ts-meter{display:flex;gap:4px;justify-content:center}.ts-meter i{width:22px;height:8px;border-radius:2px;background:#e8e1d2}\
.ts-meter i.ok{background:linear-gradient(90deg,#f7c75a,#e39b2d)}.ts-meter i.no{background:#c9b9b9}\
.ts-score{font-size:14px;color:var(--muted);text-align:center}\
.ts-end h3{font-family:"Cormorant Garamond",Georgia,serif;font-size:32px;font-weight:600;margin:0 0 4px}\
.ts-end p{font-size:16px;margin:4px 0 10px;color:#1a2340}\
.ts-culture{margin-top:16px;text-align:left;background:var(--cream);border:1px solid var(--rule);border-left:4px solid var(--gold);border-radius:3px;padding:12px 16px;font-size:15px;line-height:1.55;color:#1a2340}\n.ts-culture h4{font-family:"Cormorant Garamond",Georgia,serif;font-size:23px;font-weight:600;margin:0 0 4px;color:var(--ink)}\n.ts-culture h4 small{display:block;font-family:"Segoe UI",Roboto,Arial,sans-serif;font-size:11.5px;letter-spacing:.18em;text-transform:uppercase;color:var(--gold);font-weight:400}\n.ts-culture p{margin:6px 0 0}\n.ts-credit{font-size:11.5px;color:var(--muted);text-align:center;margin-top:12px;line-height:1.45}.ts-credit a{color:var(--muted)}\n.ts-btn{background:var(--ink);color:#fff;border:none;border-bottom:3px solid var(--gold);border-radius:999px;padding:10px 24px;font-size:15px;cursor:pointer;font-family:inherit}\
@keyframes tstw{0%,100%{opacity:.25}50%{opacity:1}}\
@keyframes tsspark{0%,34%,100%{opacity:0;transform:scale(.4)}14%{opacity:1;transform:scale(1.3)}}\
@keyframes tssweep{0%{transform:scaleX(1)}50%{transform:scaleX(-1)}100%{transform:scaleX(1)}}\
@keyframes tsshim{0%,100%{opacity:.25}50%{opacity:.75}}\
.ts-star{animation:tstw 3s ease-in-out infinite}\
.ts-spark{opacity:0;transform-box:fill-box;transform-origin:center}\
.ts-sparkling .ts-spark{animation:tsspark var(--d,.5s) ease-in-out infinite;animation-delay:var(--dl,0s)}\
.ts-beam{opacity:0;transform-box:view-box;transition:opacity 1.5s ease}\
.ts-beacon .ts-beam{opacity:1;animation:tssweep 6s linear infinite}\
.ts-shim{animation:tsshim 2.4s ease-in-out infinite}\
@media (max-width:640px){.ts-title{font-size:30px}.ts-night{flex-basis:260px}.ts-choice{font-size:27px;min-width:120px}}\
';

  function el(tag, cls, html) { var e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; }
  function sv(tag, attrs, parent) { var e = document.createElementNS(NS, tag); for (var k in attrs) e.setAttribute(k, attrs[k]); if (parent) parent.appendChild(e); return e; }
  function shuffle(a) { for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)), t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
  function tween(from, to, ms, step, done) {  // rAF tween with a timer fallback (rAF stalls in hidden windows)
    var t0 = performance.now(), fin = false;
    function f(now) { var k = Math.min(1, ((now || performance.now()) - t0) / ms), e = 1 - Math.pow(1 - k, 3); step(from + (to - from) * e); if (k < 1) requestAnimationFrame(f); else if (!fin) { fin = true; if (done) done(); } }
    requestAnimationFrame(f); setTimeout(function () { if (!fin) { fin = true; step(to); if (done) done(); } }, ms + 400);
  }

  // ---- sound: soft bells (Web Audio) ----
  var AC = null;
  function ctx() { if (!AC) { try { AC = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { return null; } } if (AC.state === 'suspended') AC.resume(); return AC; }
  function bell(f, t0, dur, gain) {
    var c = ctx(); if (!c) return; var t = c.currentTime + t0;
    [[1, 1], [2.76, .25], [5.4, .08]].forEach(function (h) {
      var o = c.createOscillator(), g = c.createGain(); o.type = 'sine'; o.frequency.value = f * h[0];
      g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(gain * h[1], t + .006); g.gain.exponentialRampToValueAtTime(.0006, t + dur);
      o.connect(g); g.connect(c.destination); o.start(t); o.stop(t + dur + .05);
    });
  }
  var PENTA = [523.3, 587.3, 659.3, 784, 880, 1046.5, 1174.7, 1318.5, 1568, 1760, 2093];
  function rise(k) { bell(PENTA[Math.min(k, PENTA.length - 1)], 0, 1.4, .12); }
  function low() { bell(196, 0, .5, .09); bell(185, .06, .5, .07); }
  function glitter() {
    for (var i = 0; i < 46; i++) bell(PENTA[4 + Math.floor(Math.random() * 7)] * (Math.random() < .3 ? 2 : 1), i * .11 + Math.random() * .05, .9, .045);
    [523.3, 659.3, 784, 1046.5].forEach(function (f, i) { bell(f, .05 + i * .07, 3.2, .06); });
  }

  // ---- the tower (viewBox 0 0 360 600; tower centred on x = 180, base y = 572, tip y = 18) ----
  var TOP = 18, BASE = 572;
  function towerPath() {
    var R = [[182, 18], [182, 40], [187, 46], [188, 96], [194, 102], [194, 110], [189, 110]],
        P = 'M180,18 ' + R.map(function (p) { return 'L' + p[0] + ',' + p[1]; }).join(' ') +
            ' Q192,300 210,366 L222,366 L222,380 L213,380 L244,466 L264,466 L264,482 L252,482 Q262,540 290,570 L290,574 L236,574 Q228,512 180,503' +
            ' Q132,512 124,574 L70,574 L70,570 Q98,540 108,482 L96,482 L96,466 L116,466 L147,380 L138,380 L138,366 L150,366 Q168,300 171,110' +
            ' L166,110 L166,102 L172,96 L173,46 L178,40 L178,18 Z' +
            ' M180,392 Q186,430 205,466 L155,466 Q174,430 180,392 Z';
    return P;
  }
  function buildScene(host) {
    var svg = sv('svg', { viewBox: '0 0 360 600', role: 'img', 'aria-label': 'The Eiffel Tower at night, lit in proportion to your correct answers' });
    var d = sv('defs', {}, svg);
    var sky = sv('linearGradient', { id: 'tsSky', x1: 0, y1: 0, x2: 0, y2: 1 }, d);
    [['0', '#050a24'], ['.55', '#13204f'], ['1', '#2a2f5c']].forEach(function (s) { sv('stop', { offset: s[0], 'stop-color': s[1] }, sky); });
    var gold = sv('linearGradient', { id: 'tsGold', x1: 0, y1: 0, x2: 0, y2: 1 }, d);
    [['0', '#fff3c4'], ['.35', '#ffd36b'], ['1', '#e8952a']].forEach(function (s) { sv('stop', { offset: s[0], 'stop-color': s[1] }, gold); });
    var beam = sv('linearGradient', { id: 'tsBeam', x1: 0, y1: 0, x2: 1, y2: 0 }, d);
    [['0', 'rgba(255,244,200,.55)'], ['1', 'rgba(255,244,200,0)']].forEach(function (s) { sv('stop', { offset: s[0], 'stop-color': s[1] }, beam); });
    var lat = sv('pattern', { id: 'tsLat', width: 9, height: 9, patternUnits: 'userSpaceOnUse' }, d);
    sv('path', { d: 'M0,0 L9,9 M9,0 L0,9', stroke: 'rgba(0,0,0,.42)', 'stroke-width': .9 }, lat);
    var latU = sv('pattern', { id: 'tsLatU', width: 9, height: 9, patternUnits: 'userSpaceOnUse' }, d);
    sv('path', { d: 'M0,0 L9,9 M9,0 L0,9', stroke: 'rgba(160,140,110,.28)', 'stroke-width': .8 }, latU);
    var blur = sv('filter', { id: 'tsGlow', x: '-50%', y: '-20%', width: '200%', height: '140%' }, d);
    sv('feGaussianBlur', { stdDeviation: 9 }, blur);
    var cp = sv('clipPath', { id: 'tsTowerClip' }, d); var tp = towerPath(); sv('path', { d: tp, 'clip-rule': 'evenodd' }, cp);
    var lc = sv('clipPath', { id: 'tsLevelClip' }, d); var lvl = sv('rect', { x: 0, y: BASE + 4, width: 360, height: 0 }, lc);

    sv('rect', { x: 0, y: 0, width: 360, height: 600, fill: 'url(#tsSky)' }, svg);
    for (var i = 0; i < 60; i++) {
      var st = sv('circle', { cx: (Math.random() * 360).toFixed(1), cy: (Math.random() * 430).toFixed(1), r: (Math.random() * 1.1 + .3).toFixed(2), fill: '#fff', 'class': 'ts-star' }, svg);
      st.style.animationDelay = (Math.random() * 3).toFixed(2) + 's'; st.style.animationDuration = (2 + Math.random() * 3).toFixed(2) + 's';
    }
    sv('circle', { cx: 62, cy: 70, r: 15, fill: '#f4ecd2', opacity: .9 }, svg); sv('circle', { cx: 68, cy: 66, r: 13, fill: '#0b1434', opacity: .9 }, svg);
    var beams = sv('g', { 'class': 'ts-beam', style: 'transform-origin:180px 30px' }, svg);
    sv('polygon', { points: '180,28 360,0 360,62', fill: 'url(#tsBeam)' }, beams);
    // Paris rooftops + the Seine
    sv('path', { d: 'M0,548 L0,520 L18,520 L18,506 L30,500 L42,506 L42,516 L64,516 L64,498 L72,492 L80,498 L80,522 L104,522 L104,512 L118,512 L118,530 L242,530 L242,510 L258,504 L274,510 L274,520 L296,520 L296,496 L304,488 L312,496 L312,514 L336,514 L336,504 L360,504 L360,548 Z', fill: '#070c22' }, svg);
    sv('rect', { x: 0, y: 574, width: 360, height: 26, fill: '#0a1638' }, svg);
    var refl = sv('g', { opacity: 0 }, svg);
    for (var j = 0; j < 7; j++) sv('rect', { x: 160 + (j % 3) * 8 - 6, y: 578 + j * 3, width: 18 - (j % 2) * 8, height: 1.4, fill: '#ffd36b', 'class': 'ts-shim', style: 'animation-delay:' + (j * .3) + 's' }, refl);

    var halo = sv('path', { d: tp, 'fill-rule': 'evenodd', fill: '#ffb84a', filter: 'url(#tsGlow)', opacity: 0, 'clip-path': 'url(#tsLevelClip)' }, svg);
    var body = sv('path', { d: tp, 'fill-rule': 'evenodd', fill: '#2a2318' }, svg);
    sv('rect', { x: 60, y: 10, width: 240, height: 570, fill: 'url(#tsLatU)', 'clip-path': 'url(#tsTowerClip)' }, svg);
    var lit = sv('g', { 'clip-path': 'url(#tsLevelClip)' }, svg);
    sv('path', { d: tp, 'fill-rule': 'evenodd', fill: 'url(#tsGold)' }, lit);
    sv('rect', { x: 60, y: 10, width: 240, height: 570, fill: 'url(#tsLat)', 'clip-path': 'url(#tsTowerClip)' }, lit);
    sv('path', { d: tp, 'fill-rule': 'evenodd', fill: 'none', stroke: '#fff1c2', 'stroke-width': .8, opacity: .7 }, lit);
    var sparks = sv('g', {}, svg);
    host.appendChild(svg);
    function addSparks() {  // needs the scene on the page: isPointInFill is false for shapes not yet rendered
    // sparkle points: random points inside the tower outline
      var probe = body, pts = [], tries = 0;  // the visible tower (a path inside <clipPath> always tests 'outside')
      while (pts.length < 150 && tries < 6000) {
        tries++; var x = 70 + Math.random() * 220, y = TOP + 10 + Math.random() * (BASE - TOP - 10), inside = true;
        try { inside = probe.isPointInFill(new DOMPoint(x, y)); } catch (e) { inside = Math.abs(x - 180) < 12 + (y - TOP) * .2; }
        if (inside) pts.push([x, y]);
      }
      pts.forEach(function (p) {
        var c = sv('circle', { cx: p[0].toFixed(1), cy: p[1].toFixed(1), r: (Math.random() * 1.4 + 1.1).toFixed(2), fill: '#fffdf2', 'class': 'ts-spark' }, sparks);
        c.style.setProperty('--d', (.25 + Math.random() * .45).toFixed(2) + 's'); c.style.setProperty('--dl', (Math.random() * .9).toFixed(2) + 's');
      });
    }
    return { svg: svg, level: lvl, halo: halo, refl: refl, sparks: sparks, beams: beams, addSparks: addSparks };
  }

  function Game(root, cfg) { this.root = root; this.cfg = cfg; this.base = cfg.audioBase || ''; this.player = new Audio(); this.build(); this.start(); }
  Game.prototype.build = function () {
    var c = this.cfg, r = this.root, self = this; r.classList.add('ts');
    var head = el('div', 'ts-head');
    head.appendChild(el('div', 'ts-kick', '&Eacute;coute &middot; Listening game'));
    head.appendChild(el('div', 'ts-title', c.title)); head.appendChild(el('div', 'ts-intro', c.intro)); r.appendChild(head);
    var body = el('div', 'ts-body'), night = el('div', 'ts-night'); this.scene = buildScene(night); body.appendChild(night);
    var side = el('div', 'ts-side'); this.card = el('div', 'ts-card'); side.appendChild(this.card);
    this.meter = el('div', 'ts-meter'); this.scoreEl = el('div', 'ts-score');
    var mwrap = el('div'); mwrap.appendChild(this.meter); mwrap.appendChild(this.scoreEl); side.appendChild(mwrap);
    body.appendChild(side); r.appendChild(body); this.scene.addSparks();
    if (c.credit) r.appendChild(el('div', 'ts-credit', c.credit));
    this.levelNow = 0;
  };
  Game.prototype.setLevel = function (k, ms) {  // k = number of bands lit
    var self = this, n = this.rounds.length, from = this.levelNow, to = k / n, H = BASE + 4 - TOP;
    this.levelNow = to; var id = this.tw = (this.tw || 0) + 1;  // a newer change cancels this one
    tween(from, to, ms || 1100, function (v) {
      if (id !== self.tw) return;
      self.scene.level.setAttribute('y', (BASE + 4 - H * v).toFixed(1)); self.scene.level.setAttribute('height', (H * v).toFixed(1));
      self.scene.halo.setAttribute('opacity', (Math.min(.85, v * .9)).toFixed(2)); self.scene.refl.setAttribute('opacity', v.toFixed(2));
    });
  };
  Game.prototype.start = function () {
    var self = this, pairs = shuffle(this.cfg.pairs.slice()).slice(0, this.cfg.rounds || 10), half = Math.ceil(pairs.length / 2);
    var sexes = shuffle(pairs.map(function (_, i) { return i < half ? 'f' : 'm'; }));
    this.rounds = pairs.map(function (p, i) { return { p: p, g: sexes[i] }; });
    this.i = 0; this.right = 0; this.marks = [];
    this.scene.svg.classList.remove('ts-sparkling'); this.scene.svg.classList.remove('ts-beacon');
    this.setLevel(0, 600); this.show();
  };
  Game.prototype.drawMeter = function () {
    var h = ''; for (var j = 0; j < this.rounds.length; j++) h += '<i class="' + (this.marks[j] || '') + '"></i>';
    this.meter.innerHTML = h; this.scoreEl.innerHTML = this.right + ' / ' + this.rounds.length + ' &middot; la tour s&rsquo;illumine';
  };
  Game.prototype.play = function (src, btn) {
    var self = this; ctx();
    try { this.player.pause(); this.player.src = this.base + src; if (btn) { btn.classList.add('playing'); this.player.onended = function () { btn.classList.remove('playing'); }; } this.player.play().catch(function () { if (btn) btn.classList.remove('playing'); }); } catch (e) {}
  };
  Game.prototype.show = function () {
    var self = this, R = this.rounds[this.i], p = R.p, heard = R.g === 'm' ? p.m : p.f, audio = R.g === 'm' ? p.mAudio : p.fAudio;
    this.drawMeter(); this.answered = false;
    var c = this.card; c.innerHTML = '';
    c.appendChild(el('div', 'ts-q', 'Word ' + (this.i + 1) + ' of ' + this.rounds.length));
    var pb = el('button', 'ts-play', '&#128266; &Eacute;coute'); pb.type = 'button'; pb.setAttribute('aria-label', 'Listen to the word');
    pb.addEventListener('click', function () { self.play(audio, pb); }); c.appendChild(pb);
    c.appendChild(el('div', 'ts-ask', 'Which form did you hear? Listen as often as you like.'));
    var ch = el('div', 'ts-choices'), opts = shuffle([p.m, p.f]);
    opts.forEach(function (o) {
      var b = el('button', 'ts-choice', o); b.type = 'button'; b.lang = 'fr';
      b.addEventListener('click', function () { self.answer(o, heard, b, ch); }); ch.appendChild(b);
    });
    c.appendChild(ch); this.fb = el('div', 'ts-fb'); c.appendChild(this.fb);
    if (this.started) setTimeout(function () { self.play(audio, pb); }, 250);
  };
  Game.prototype.answer = function (o, heard, b, ch) {
    if (this.answered) return; this.answered = true; this.started = true; ctx();
    var self = this, R = this.rounds[this.i], p = R.p, ok = o === heard;
    [].forEach.call(ch.querySelectorAll('.ts-choice'), function (x) { x.disabled = true; if (x.textContent === heard) x.classList.add('right'); });
    if (ok) { this.right++; this.marks[this.i] = 'ok'; rise(this.right); this.setLevel(this.right); this.fb.className = 'ts-fb ok';
      this.fb.innerHTML = '<strong>Oui&nbsp;!</strong> You heard <em>' + heard + '</em> (' + (R.g === 'm' ? 'masculine' : 'feminine') + '). ' + p.tip; }
    else { b.classList.add('wrong'); this.marks[this.i] = 'no'; low(); this.fb.className = 'ts-fb no';
      this.fb.innerHTML = 'You heard <em>' + heard + '</em> (' + (R.g === 'm' ? 'masculine' : 'feminine') + '). ' + p.tip; }
    var rp = el('button', 'ts-next', '&#128266; Hear both'); rp.type = 'button';
    rp.addEventListener('click', function () { self.play(p.mAudio); setTimeout(function () { self.play(p.fAudio); }, 1300); });
    var nx = el('button', 'ts-next', this.i + 1 < this.rounds.length ? 'Next word &rarr;' : 'See the tower &rarr;'); nx.type = 'button'; nx.style.marginLeft = '8px';
    nx.addEventListener('click', function () { self.next(); });
    var row = el('div'); row.appendChild(rp); row.appendChild(nx); this.fb.appendChild(row); this.drawMeter();
    setTimeout(function () { nx.focus({ preventScroll: true }); }, 50);
  };
  Game.prototype.next = function () {
    this.i++; if (this.i < this.rounds.length) { this.show(); return; }
    var self = this, n = this.rounds.length, all = this.right === n, c = this.card;
    this.drawMeter(); c.innerHTML = '';
    var end = el('div', 'ts-end');
    if (all) {
      end.innerHTML = '<h3>La tour scintille&nbsp;!</h3><p>All <strong>' + n + ' of ' + n + '</strong>. Like the real tower every evening on the hour, it sparkles for you.</p>';
      setTimeout(function () { self.scene.svg.classList.add('ts-sparkling'); self.scene.svg.classList.add('ts-beacon'); glitter(); }, 900);
      setTimeout(function () { self.scene.svg.classList.remove('ts-sparkling'); }, 9500);
    } else {
      end.innerHTML = '<h3>' + this.right + ' / ' + n + '</h3><p>The tower is lit <strong>' + Math.round(this.right / n * 100) + '%</strong> of the way up. Get every word right to make the whole tower sparkle.</p>';
    }
    var again = el('button', 'ts-btn', 'Rejouer &middot; Play again'); again.type = 'button'; again.addEventListener('click', function () { self.start(); });
    end.appendChild(again); c.appendChild(end);
    if (this.cfg.culture) c.appendChild(el('div', 'ts-culture', this.cfg.culture));
    try { window.dispatchEvent(new CustomEvent('mw-game', { detail: { name: this.cfg.title, done: true, summary: this.right + ' of ' + n + ' heard correctly' + (all ? ' (the tower sparkled)' : '') + '.' } })); } catch (e) {}
  };

  function init() {
    if (!document.getElementById('ts-css')) { var s = document.createElement('style'); s.id = 'ts-css'; s.textContent = CSS; document.head.appendChild(s); }
    [].slice.call(document.querySelectorAll('[data-tour]')).forEach(function (root) {
      if (root.dataset.tsReady) return; root.dataset.tsReady = '1';
      var g = new Game(root, JSON.parse(root.getAttribute('data-tour'))), m = /[?&]tsdemo=(\d+)/.exec(location.search);
      if (m) { g.right = +m[1]; g.setLevel(g.right, 10); if (g.right >= g.rounds.length) { g.scene.svg.classList.add('ts-sparkling'); g.scene.svg.classList.add('ts-beacon'); } }
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
