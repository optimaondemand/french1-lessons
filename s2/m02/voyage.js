/* voyage.js — "Iter Aenēae" (The Journey of Aeneas) map game for Optima Latin lesson pages (SAMPLE, 2026-10-19).
 * Aeneas's ship sails a map of the Mediterranean. Every correct answer moves the ship one step toward the next port;
 * a wrong answer brings Juno's wave, which pushes the ship back one step (never past a port already reached: ports
 * are safe harbours). Reaching a port opens a short story card: English story + one Latin line the students can read.
 * Data: <div class="voyage-game" data-voyage='{"title":..., "ports":[{"name","x","y","story","latin","english"}],
 *        "legs":["svg path d from port i to port i+1", ...], "steps": 3, "questions":[{"q","options":[...],"answer":i,"why"}],
 *        "next": "teaser for the next voyage"}'></div>
 * Questions are drawn at random without repeats; use only Latin taught BEFORE the lesson the game sits in.
 * Reports {name, done, summary} to my-work.js through a "mw-game" event. Our own SVG art and sound; no libraries.
 */
(function () {
  'use strict';
  var root = document.querySelector('.voyage-game');
  if (!root) return;
  var D; try { D = JSON.parse(root.getAttribute('data-voyage')); } catch (e) { return; }
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var NS = 'http://www.w3.org/2000/svg', STEPS = D.steps || 3, TOTAL = D.legs.length * STEPS;
  var VELO = D.theme === 'velo';
  var T = VELO ? { right: 'Bravo ! (Well done!) ', back: 'Un pneu crevé ! (A flat tyre!) You lose one step. ', safe: 'Un pneu crevé ! (A flat tyre!) But you are safe in town. ',
                   answer: 'The answer is ', go: 'Ride on', start: 'Set off', on: 'Ride on to ', see: 'See my tour', begins: 'The tour begins', reached: 'Stage reached · ',
                   leg: 'Stage ', toward: ' · to ', fin: 'Bravo ! (Well done!) You reached ', rode: function (m) { return m ? ', and fixed ' + m + ' flat tyre' + (m > 1 ? 's' : '') + '.' : ' — not a single flat tyre.'; },
                   again: 'Encore ! (Again!)', aria: 'Map of France with your route around the regions' }
              : { right: 'Rēctē! (Correct!) ', back: 'Juno sends a wave! Your ship is pushed back one step. ', safe: 'Juno sends a wave, but your ship is safe in the harbour. ',
                  answer: 'The answer is ', go: 'Sail on', start: 'Set sail', on: 'Sail on to ', see: 'See my voyage', begins: 'The voyage begins', reached: 'Port reached · ',
                  leg: 'Leg ', toward: ' · toward ', fin: 'Optimē! (Excellent!) You reached ', rode: function (m) { return m ? ', and rode out ' + m + ' of Juno’s waves.' : ' — Juno never touched you.'; },
                  again: 'Iterum! (Again!)', aria: 'Map of the Mediterranean with the route of Aeneas' };
  for (var tk in (D.text || {})) T[tk] = D.text[tk];

  var css =
    '.voyage-game{font-family:"EB Garamond",Garamond,Georgia,serif;color:#2b1d0e}' +
    '.vg-map{position:relative;border-radius:8px;overflow:hidden;border:2px solid #7a5a2a;box-shadow:0 3px 10px rgba(20,30,50,.25);background:#1d4a73}' +
    '.vg-map svg{display:block;width:100%;height:auto}' +
    '.vg-land{fill:#ead8ae;stroke:#7d5f33;stroke-width:.9;stroke-linejoin:round}' +
    '.vg-label{font-family:"Uncial Antiqua",Georgia,serif;font-size:14px;fill:#4a2f14;letter-spacing:.06em}' +
    '.vg-sea{font-family:"Uncial Antiqua",Georgia,serif;font-size:18px;fill:#ecdcaa;letter-spacing:.12em;opacity:.92}' +
    '.vg-route{fill:none;stroke:#f3e6c0;stroke-width:1.8;stroke-dasharray:4 5;opacity:.75}' +
    '.vg-done{fill:none;stroke:#f0a83a;stroke-width:3.5;stroke-linecap:round}' +
    '.vg-port{fill:#fff8e6;stroke:#5a3e1c;stroke-width:2}.vg-port.on{fill:#e0a030;stroke:#5a3e1c}' +
    '.vg-step{fill:#f3e6c0;opacity:.55}.vg-step.on{fill:#f0a83a;opacity:1}' +
    '.vg-wave{fill:none;stroke:#fff;stroke-width:2.5;opacity:.0}' +
    '.vg-card{background:#fbf5e6;border:1px solid #cdb88e;outline:1px solid #cdb88e;outline-offset:-5px;border-radius:4px;padding:18px 20px;margin:14px 0 0}' +
    '.vg-top{display:flex;flex-wrap:wrap;justify-content:space-between;gap:8px;font-size:15px;letter-spacing:.1em;font-variant:small-caps;text-transform:lowercase;color:#5e4a32;margin:0 0 6px}' +
    '.vg-q{font-size:24px;font-weight:600;margin:2px 0 14px;line-height:1.35}' +
    '.vg-opts{display:flex;flex-wrap:wrap;gap:10px}' +
    '.vg-opt{font-weight:600;font-size:20px;font-family:inherit;padding:10px 20px;border-radius:4px;border:1.5px solid #6b4e2a;background:#fffaf0;color:#2b1d0e;cursor:pointer;min-width:120px;box-shadow:inset 0 0 0 3px #fffaf0,inset 0 0 0 4px #e3d3ae}' +
    '.vg-opt:hover{background:#f6ead0}.vg-opt:focus-visible{outline:3px solid #7a2e1f;outline-offset:3px}' +
    '.vg-opt.ok{background:#2A7F4F;border-color:#2A7F4F;color:#fff}.vg-opt.no{background:#9a3412;border-color:#9a3412;color:#fff}' +
    '.vg-opt[disabled]{cursor:default}' +
    '.vg-fb{font-size:20px;margin:12px 0 0;min-height:1.4em}.vg-fb.ok{color:#2f5e2a;font-weight:600}.vg-fb.no{color:#7a2e1f}' +
    '.vg-btn{font-weight:600;font-size:20px;font-family:inherit;padding:10px 28px;border-radius:4px;border:1.5px solid #4e1d13;background:#7a2e1f;color:#fbf0d8;cursor:pointer;box-shadow:0 2px 0 #4e1d13;margin-top:12px;letter-spacing:.02em}' +
    '.vg-btn:focus-visible{outline:3px solid #b8892e;outline-offset:3px}' +
    '.vg-port-card{border-left:5px solid #7a2e1f}.vg-port-card h3{font-size:27px;font-weight:600;margin:0 0 6px;color:#2b1d0e}' +
    '.vg-latin{font-style:italic;font-weight:600;font-size:25px;color:#5A3A28;margin:10px 0 2px}.vg-en{color:#5e4a32;font-size:18px}' +
    '.vg-story{font-size:20px;line-height:1.55;margin:0}' +
    '.vg-quote{margin:14px 0 0;padding:12px 16px;background:#f7efdc;border-left:5px solid #8B3A2B;border-radius:6px}' +
    '.vg-qk{font-size:15px;letter-spacing:.1em;font-variant:small-caps;text-transform:lowercase;color:#7a2e1f;margin:0 0 6px}' +
    '.vg-ql{font-style:italic;font-weight:600;font-size:22px;color:#3b2a14;line-height:1.4}' +
    '.vg-qe{font-size:19px;color:#2b1d0e;margin:8px 0 0;line-height:1.5}' +
    '.vg-qm{font-size:18px;color:#5e4a32;margin:8px 0 0;line-height:1.5}' +
    '.vg-storm{position:absolute;inset:0;pointer-events:none;background:radial-gradient(ellipse at 50% 30%,rgba(40,50,70,.0),rgba(40,50,70,.0));transition:background .3s}' +
    '.vg-storm.on{background:radial-gradient(ellipse at 50% 30%,rgba(40,50,70,.45),rgba(40,50,70,.15))}' +
    '@keyframes vgRock{0%,100%{transform:rotate(0)}25%{transform:rotate(-6deg)}75%{transform:rotate(6deg)}}' +
    '.vg-ship-inner{transform-box:fill-box;transform-origin:50% 80%}' +
    (reduce ? '' : '.vg-ship-inner{animation:vgRock 3.2s ease-in-out infinite}.vg-ship.hit .vg-ship-inner{animation:vgRock .35s ease-in-out 4}') +
    (VELO ? '.vg-velo .vg-label{font-family:"EB Garamond",Georgia,serif;font-size:16px;font-weight:600;fill:#3b2a14;letter-spacing:.03em}' +
      '.vg-velo .vg-sea{font-family:"EB Garamond",Georgia,serif;font-style:italic;font-size:17px;fill:#dbe8f4;letter-spacing:.06em}' +
      '.vg-france{fill:#f1e2bb;stroke:#5a3e1c;stroke-width:1.4;stroke-linejoin:round}.vg-velo .vg-land{fill:#d9ccb0;stroke:#9a8562}' +
      '.vg-velo .vg-route{stroke:#7a2e1f;opacity:.55}.vg-velo .vg-done{stroke:#d4462e}' +
      '.vg-puff{font:700 15px "Segoe UI",Arial,sans-serif;fill:#7a2e1f}' +
      (reduce ? '' : '.vg-velo .vg-ship-inner{animation:none}.vg-velo .vg-ship.hit .vg-ship-inner{animation:vgRock .3s ease-in-out 3}') : '');
  if (!document.querySelector('link[data-vg-fonts]')) {   // Uncial Antiqua (map names) + EB Garamond (text), Google Fonts
    var fl = document.createElement('link'); fl.rel = 'stylesheet'; fl.setAttribute('data-vg-fonts', '');
    fl.href = 'https://fonts.googleapis.com/css2?family=EB+Garamond:ital,wght@0,400;0,600;1,400;1,600&family=Uncial+Antiqua&display=swap';
    document.head.appendChild(fl);
  }
  var st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);

  function el(tag, cls, txt) { var e = document.createElement(tag); if (cls) e.className = cls; if (txt != null) e.textContent = txt; return e; }
  function sv(tag, a) { var e = document.createElementNS(NS, tag); for (var k in a) e.setAttribute(k, a[k]); return e; }
  function shuffle(a) { a = a.slice(); for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; } return a; }

  // ---- sound (synthesised, no files): a brass call for each step forward, a fanfare at each port, wind for Juno ----
  var actx = null;
  function ctx() { actx = actx || new (window.AudioContext || window.webkitAudioContext)(); if (actx.state === 'suspended') actx.resume(); return actx; }
  function horn(freq, at, dur, gain) {             // one trumpet-like note: two detuned saws through an opening filter
    var a = ctx(), g = a.createGain(), lp = a.createBiquadFilter();
    lp.type = 'lowpass'; lp.Q.value = 1.5;
    lp.frequency.setValueAtTime(500, at); lp.frequency.linearRampToValueAtTime(2600, at + 0.06); lp.frequency.linearRampToValueAtTime(1700, at + dur);
    g.gain.setValueAtTime(0.0001, at); g.gain.linearRampToValueAtTime(gain, at + 0.035); g.gain.setValueAtTime(gain * 0.85, at + dur - 0.06);
    g.gain.linearRampToValueAtTime(0.0001, at + dur);
    [-6, 6].forEach(function (cents) {
      var o = a.createOscillator(); o.type = 'sawtooth'; o.frequency.value = freq; o.detune.value = cents;
      if (dur > 0.3) { var v = a.createOscillator(), vg = a.createGain(); v.frequency.value = 5.5; vg.gain.value = freq * 0.008; v.connect(vg); vg.connect(o.frequency); v.start(at + 0.15); v.stop(at + dur); }
      o.connect(lp); o.start(at); o.stop(at + dur + 0.02);
    });
    lp.connect(g); g.connect(a.destination);
  }
  function bell(at) {                               // a bicycle bell: two bright partials, quick decay
    var a = ctx(); [[2350, .09], [3100, .05]].forEach(function (p) { var o = a.createOscillator(), g = a.createGain(); o.type = 'sine'; o.frequency.value = p[0];
      g.gain.setValueAtTime(0.0001, at); g.gain.linearRampToValueAtTime(p[1], at + 0.005); g.gain.exponentialRampToValueAtTime(0.0001, at + 0.55); o.connect(g); g.connect(a.destination); o.start(at); o.stop(at + 0.6); });
  }
  function soundStep() { try { var t = ctx().currentTime + 0.02; if (VELO) { bell(t); bell(t + 0.16); return; } horn(392, t, 0.13, 0.13); horn(523.3, t + 0.15, 0.32, 0.13); } catch (e) {} }   // G4 → C5
  function soundPort() {                            // ta-ta-ta-taaa: C5 C5 C5 G5 with a low C underneath
    try { var t = ctx().currentTime + 0.02; [[523.3, 0, 0.12], [523.3, 0.15, 0.12], [523.3, 0.3, 0.12], [784, 0.45, 0.75]].forEach(function (n) { horn(n[0], t + n[1], n[2], 0.12); });
      horn(261.6, t + 0.45, 0.75, 0.08); } catch (e) {}
  }
  function timp(freq, at, gain) {                   // a timpani-like drum stroke: a low tone that drops in pitch and dies away
    var a = ctx(), o = a.createOscillator(), g = a.createGain();
    o.type = 'sine'; o.frequency.setValueAtTime(freq * 1.5, at); o.frequency.exponentialRampToValueAtTime(freq, at + 0.08);
    g.gain.setValueAtTime(0.0001, at); g.gain.linearRampToValueAtTime(gain, at + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, at + 0.9);
    o.connect(g); g.connect(a.destination); o.start(at); o.stop(at + 1);
  }
  function soundFinale() {                          // the last port: a two-trumpet flourish, drum strokes and a long final chord
    try {
      var t = ctx().currentTime + 0.02;
      [[392, 0, .1], [523.3, .11, .1], [659.3, .22, .1], [784, .33, .45],                  // trumpet 1: G C E | G
       [659.3, .82, .12], [784, .95, .12], [880, 1.08, .12], [784, 1.21, .3],               //            E G A | G
       [1046.5, 1.6, 1.3]].forEach(function (n) { horn(n[0], t + n[1], n[2], 0.075); });  //            high C (held)
      [[659.3, .33, .45], [523.3, .82, .12], [659.3, .95, .12], [698.5, 1.08, .12], [659.3, 1.21, .3],   // trumpet 2 in harmony
       [784, 1.6, 1.3], [659.3, 1.6, 1.3]].forEach(function (n) { horn(n[0], t + n[1], n[2], 0.05); });
      horn(261.6, t + 1.6, 1.3, 0.05); horn(130.8, t + 1.6, 1.3, 0.045);   // kept quiet so the full chord never distorts                  // low C under the final chord
      [[98, .33], [130.8, 1.21], [98, 1.42], [98, 1.5], [130.8, 1.6]].forEach(function (d) { timp(d[0], t + d[1], 0.3); });
    } catch (e) {}
  }
  function soundWave() {                            // a gust of wind: noise through a sweeping, resonant band-pass
    if (VELO) { try {                                 // velo: a tyre losing air (a falling hiss)
      var a0 = ctx(), n = Math.floor(a0.sampleRate * 1.1), b0 = a0.createBuffer(1, n, a0.sampleRate), d0 = b0.getChannelData(0);
      for (var j = 0; j < n; j++) d0[j] = Math.random() * 2 - 1;
      var s0 = a0.createBufferSource(), f0 = a0.createBiquadFilter(), g0 = a0.createGain(), t0 = a0.currentTime; s0.buffer = b0; f0.type = 'highpass';
      f0.frequency.setValueAtTime(5200, t0); f0.frequency.exponentialRampToValueAtTime(900, t0 + 1.0);
      g0.gain.setValueAtTime(0.0001, t0); g0.gain.linearRampToValueAtTime(0.28, t0 + 0.05); g0.gain.exponentialRampToValueAtTime(0.0001, t0 + 1.05);
      s0.connect(f0); f0.connect(g0); g0.connect(a0.destination); s0.start(t0); } catch (e) {} return; }
    try {
      var a = ctx(), dur = 1.8, len = Math.floor(a.sampleRate * dur), buf = a.createBuffer(1, len, a.sampleRate), d = buf.getChannelData(0);
      for (var i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
      var t = a.currentTime;
      [[6, 380, 900, 0.9], [2.5, 1400, 2300, 0.35]].forEach(function (b) {   // [Q, from Hz, peak Hz, gain]: the howl and the hiss
        var s = a.createBufferSource(), bp = a.createBiquadFilter(), g = a.createGain();
        s.buffer = buf; bp.type = 'bandpass'; bp.Q.value = b[0];
        bp.frequency.setValueAtTime(b[1], t); bp.frequency.linearRampToValueAtTime(b[2], t + 0.7);
        bp.frequency.linearRampToValueAtTime(b[1] * 1.3, t + 1.1); bp.frequency.linearRampToValueAtTime(b[1] * 0.8, t + dur);
        g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(b[3], t + 0.55); g.gain.linearRampToValueAtTime(b[3] * 0.6, t + 1.1);
        g.gain.linearRampToValueAtTime(0.0001, t + dur);
        s.connect(bp); bp.connect(g); g.connect(a.destination); s.start(t);
      });
    } catch (e) {}
  }

  // ---- the map (our own simplified drawing of the Mediterranean; not to survey scale) ----
  var M = D.map, W = M.W, H = M.H, LAND = M.land;
  function xy(lon, lat) { return { x: (lon - M.lon0) * M.kx, y: (M.lat1 - lat) * M.ky }; }
  D.ports.forEach(function (p) { if (p.lon != null) { var q = xy(p.lon, p.lat); p.x = q.x; p.y = q.y; } });
  (D.labels || []).forEach(function (l) { if (l.lon != null) { var q = xy(l.lon, l.lat); l.x = q.x; l.y = q.y; } });
  D.legs = D.legs.map(function (g) {                 // a leg = [from, control, to] in [lon, lat], drawn as a curve
    if (typeof g === 'string') return g;
    var a = xy(g[0][0], g[0][1]), c = xy(g[1][0], g[1][1]), b = xy(g[2][0], g[2][1]);
    return 'M' + a.x.toFixed(1) + ' ' + a.y.toFixed(1) + ' Q' + c.x.toFixed(1) + ' ' + c.y.toFixed(1) + ' ' + b.x.toFixed(1) + ' ' + b.y.toFixed(1);
  });
  var svg, done, ship, marks, stepDots = [], portDots = [], legPaths = [], storm;
  function addMarks() {                              // needs the map on the page to measure the route
    for (var i = 1; i < TOTAL; i++) if (i % STEPS) { var pt = at(i); var c = sv('circle', { cx: pt.x, cy: pt.y, r: 3, 'class': 'vg-step' }); marks.appendChild(c); stepDots[i] = c; }
    D.ports.forEach(function (p, i) { var c = sv('circle', { cx: p.x, cy: p.y, r: 7, 'class': 'vg-port' + (i === 0 ? ' on' : '') }); marks.appendChild(c); portDots.push(c); });
  }
  function drawMap() {
    var map = el('div', 'vg-map');
    if (VELO) map.classList.add('vg-velo');
    svg = sv('svg', { viewBox: '0 0 ' + W + ' ' + H, role: 'img', 'aria-label': T.aria });
    var defs = sv('defs', {});
    var wav = sv('pattern', { id: 'vgWaves', width: 28, height: 18, patternUnits: 'userSpaceOnUse' });
    wav.innerHTML = '<path d="M0 13 C4 13 6 5 11 5 C15 5 16 10 12.8 10 C10.6 10 10.8 7.4 12.8 7.6 M12.8 10 C17 14 22 13 28 13" fill="none" stroke="#5f93c4" stroke-width="1.1" opacity=".45"/>';
    var key = sv('pattern', { id: 'vgKey', width: 12, height: 12, patternUnits: 'userSpaceOnUse' });
    key.innerHTML = '<rect width="12" height="12" fill="#13324f"/><path d="M0 10.5 H10 V1.5 H3 V7.5 H7 V4.5" fill="none" stroke="#d6b25e" stroke-width="1.3"/>';
    var sea = sv('radialGradient', { id: 'vgSea', cx: '50%', cy: '45%', r: '75%' });
    sea.innerHTML = '<stop offset="0" stop-color="#2a6496"/><stop offset="1" stop-color="#173f66"/>';
    defs.appendChild(wav); defs.appendChild(key); defs.appendChild(sea); svg.appendChild(defs);
    svg.appendChild(sv('rect', { x: 0, y: 0, width: W, height: H, fill: 'url(#vgSea)' }));
    svg.appendChild(sv('rect', { x: 0, y: 0, width: W, height: H, fill: 'url(#vgWaves)' }));
    LAND.forEach(function (d) { svg.appendChild(sv('path', { d: d, 'class': 'vg-land' })); });
    (M.france || []).forEach(function (d) { svg.appendChild(sv('path', { d: d, 'class': 'vg-france' })); });
    (D.labels || []).forEach(function (l) { var t = sv('text', { x: l.x, y: l.y, 'class': l.sea ? 'vg-sea' : 'vg-label', 'text-anchor': 'middle' }); t.textContent = l.text; svg.appendChild(t); });
    D.legs.forEach(function (d) { var p = sv('path', { d: d, 'class': 'vg-route' }); svg.appendChild(p); legPaths.push(p); });
    done = sv('path', { d: '', 'class': 'vg-done' }); svg.appendChild(done);
    marks = sv('g', {}); svg.appendChild(marks);
    // the ship: a small galley with a square sail and oars
    ship = sv('g', { 'class': 'vg-ship' });
    var inner = sv('g', { 'class': 'vg-ship-inner' });
    if (VELO) inner.innerHTML = '<circle cx="-10" cy="6" r="7" fill="none" stroke="#1d2a44" stroke-width="2"/><circle cx="11" cy="6" r="7" fill="none" stroke="#1d2a44" stroke-width="2"/>' +
      '<path d="M-10 6 L-2 -4 L8 -4 L11 6 M-2 -4 L1 6 L-10 6 M8 -4 L7 -9 M5 -9 L10 -9 M-3 -6 L-1 -6" fill="none" stroke="#c0392b" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>' +
      '<path d="M-1 -6 L2 -15 L7 -10" fill="none" stroke="#1d2a44" stroke-width="2.4" stroke-linecap="round"/><path d="M2 -15 L-3 -8 L1 6" fill="none" stroke="#1d2a44" stroke-width="2.2" stroke-linecap="round"/>' +
      '<circle cx="4" cy="-19" r="3.4" fill="#f2c7a5" stroke="#1d2a44" stroke-width="1"/><path d="M0.5 -21 Q4 -25 7.5 -21 Z" fill="#f4d03f" stroke="#1d2a44" stroke-width=".8"/>';
    else inner.innerHTML = '<path d="M-20 4 Q0 14 22 4 L18 0 L-16 0 Z" fill="#6b3f1d" stroke="#3b2210" stroke-width="1"/>' +
      '<path d="M22 4 Q28 0 26 -6" stroke="#6b3f1d" stroke-width="3" fill="none"/>' +
      '<line x1="0" y1="0" x2="0" y2="-26" stroke="#3b2210" stroke-width="2"/>' +
      '<path d="M-11 -24 L11 -24 L10 -6 L-10 -6 Z" fill="#f6efe0" stroke="#9b8a6a" stroke-width="1"/>' +
      '<path d="M-6 -20 L6 -20 M-6 -14 L6 -14" stroke="#B45309" stroke-width="2.4"/>' +
      '<path d="M-14 6 L-18 13 M-7 8 L-10 15 M0 8 L-2 15 M7 8 L6 15 M14 6 L14 13" stroke="#3b2210" stroke-width="1.2"/>';
    ship.appendChild(inner); svg.appendChild(ship);
    var B = 12;                                       // Greek-key (meander) frame; velo: a tricolore ribbon
    if (VELO) { [['#2b4c8c', 0], ['#ffffff', 1], ['#c0392b', 2]].forEach(function (c) { var w3 = W / 3;
        svg.appendChild(sv('rect', { x: c[1] * w3, y: 0, width: w3 + 1, height: B, fill: c[0] })); svg.appendChild(sv('rect', { x: c[1] * w3, y: H - B, width: w3 + 1, height: B, fill: c[0] })); });
      svg.appendChild(sv('rect', { x: 0, y: 0, width: B, height: H, fill: '#2b4c8c' })); svg.appendChild(sv('rect', { x: W - B, y: 0, width: B, height: H, fill: '#c0392b' })); }
    else [[0, 0, W, B], [0, H - B, W, B], [0, 0, B, H], [W - B, 0, B, H]].forEach(function (r) {
      svg.appendChild(sv('rect', { x: r[0], y: r[1], width: r[2], height: r[3], fill: 'url(#vgKey)' }));
    });
    svg.appendChild(sv('rect', { x: B - 1, y: B - 1, width: W - 2 * B + 2, height: H - 2 * B + 2, fill: 'none', stroke: '#d6b25e', 'stroke-width': 1.5 }));
    map.appendChild(svg);
    storm = el('div', 'vg-storm'); map.appendChild(storm);
    return map;
  }
  // position of step i along the route (ports at multiples of STEPS)
  function at(i) {
    var leg = Math.min(D.legs.length - 1, Math.floor(i / STEPS)), f = (i - leg * STEPS) / STEPS;
    if (i >= TOTAL) { leg = D.legs.length - 1; f = 1; }
    var p = legPaths[leg] || legPaths[0], L = p.getTotalLength(), q = p.getPointAtLength(L * f);
    return { x: q.x, y: q.y, leg: leg, f: f };
  }
  var pos = 0, faceLeft = true;
  function place(i) { var p = at(i); ship.setAttribute('transform', 'translate(' + p.x.toFixed(1) + ' ' + (p.y - 4).toFixed(1) + ') scale(' + (faceLeft ? -1 : 1) + ' 1)'); }
  function trail(i) {                                 // the orange line of the voyage so far
    var d = '';
    for (var k = 0; k <= i * 4; k++) { var p = at(k / 4); d += (k ? ' L' : 'M') + p.x.toFixed(1) + ' ' + p.y.toFixed(1); }
    done.setAttribute('d', i ? d : '');
    stepDots.forEach(function (c, k) { if (c) c.setAttribute('class', 'vg-step' + (k <= i ? ' on' : '')); });
    portDots.forEach(function (c, k) { c.setAttribute('class', 'vg-port' + (k * STEPS <= i ? ' on' : '')); });
  }
  function sail(from, to, cb) {
    var a = at(from), b = at(to); faceLeft = b.x < a.x || (b.x === a.x && faceLeft);
    if (reduce || document.hidden) { pos = to; place(to); trail(Math.max(to, 0)); cb && cb(); return; }   // no animation when motion is reduced or the page is hidden
    var t0 = performance.now(), dur = 900, ended = false;
    function end() { if (ended) return; ended = true; pos = to; place(to); trail(to); cb && cb(); }
    setTimeout(end, dur + 400);                       // safety net: browsers pause animation in hidden windows
    (function frame(now) {
      if (ended) return;
      var k = Math.min(1, (now - t0) / dur), e = k < .5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2, v = from + (to - from) * e;
      place(v); if (k < 1) requestAnimationFrame(frame); else end();
    })(t0);
  }
  function wave() {                                   // Juno's wave rolls across the ship
    ship.setAttribute('class', 'vg-ship hit'); storm.className = 'vg-storm on'; soundWave();
    var p = at(pos), w = VELO ? sv('text', { x: p.x + 14, y: p.y - 18, 'class': 'vg-puff' }) : sv('path', { d: 'M' + (p.x - 60) + ' ' + (p.y + 6) + ' q15 -14 30 0 t30 0 t30 0 t30 0', 'class': 'vg-wave' });
    if (VELO) w.textContent = 'pfff…';
    svg.insertBefore(w, ship);
    if (!reduce) w.animate([{ opacity: 0, transform: 'translateX(-30px)' }, { opacity: .95, transform: 'translateX(0)' }, { opacity: 0, transform: 'translateX(30px)' }], { duration: 1100 });
    setTimeout(function () { w.remove(); ship.setAttribute('class', 'vg-ship'); storm.className = 'vg-storm'; }, 1150);
  }

  // ---- game flow ----
  var card, bank = [], asked = 0, firstTry = 0, missed = 0, legStart = 0;
  function nextQ() { if (!bank.length) bank = shuffle(D.questions); return bank.pop(); }
  function question() {
    card.className = 'vg-card'; card.innerHTML = '';
    var leg = Math.floor(pos / STEPS), to = D.ports[leg + 1];
    var top = el('div', 'vg-top'); top.appendChild(el('span', null, T.leg + (leg + 1) + ' of ' + D.legs.length + T.toward + to.name)); top.appendChild(el('span', null, (pos % STEPS) + ' of ' + STEPS + ' steps'));
    card.appendChild(top);
    var q = nextQ(), tried = false; asked++;
    card.appendChild(el('div', 'vg-q', q.q));
    var opts = el('div', 'vg-opts'), fb = el('div', 'vg-fb'); fb.setAttribute('aria-live', 'polite');
    shuffle(q.options.map(function (o, i) { return i; })).forEach(function (i) {
      var b = el('button', 'vg-opt', q.options[i]); b.type = 'button';
      b.addEventListener('click', function () {
        Array.prototype.forEach.call(opts.children, function (x) { x.disabled = true; });
        if (i === q.answer) {
          b.classList.add('ok'); if (!tried) firstTry++;
          fb.className = 'vg-fb ok'; fb.textContent = T.right + (q.why || '');
          soundStep();
          setTimeout(function () { sail(pos, pos + 1, function () { if (pos % STEPS === 0) port(pos / STEPS); else question(); }); }, 700);
        } else {
          b.classList.add('no'); tried = true; missed++;
          Array.prototype.forEach.call(opts.children, function (x) { if (x.textContent === q.options[q.answer]) x.classList.add('ok'); });
          fb.className = 'vg-fb no';
          var back = pos > legStart;
          fb.textContent = (back ? T.back : T.safe) + T.answer + '“' + q.options[q.answer] + '.” ' + (q.why || '');
          wave();
          var go = el('button', 'vg-btn', T.go); go.type = 'button';
          go.addEventListener('click', function () { if (back) sail(pos, pos - 1, question); else question(); });
          setTimeout(function () { card.appendChild(go); go.focus({ preventScroll: true }); }, 300);
        }
      });
      opts.appendChild(b);
    });
    card.appendChild(opts); card.appendChild(fb);
  }
  function port(k) {
    legStart = pos; if (k === D.ports.length - 1) soundFinale(); else if (k > 0) soundPort();         // no fanfare on page load: browsers block sound before the first click
    var p = D.ports[k]; card.className = 'vg-card vg-port-card'; card.innerHTML = '';
    card.appendChild(el('div', 'vg-top', k === 0 ? T.begins : T.reached + p.name));
    card.appendChild(el('h3', null, p.title || p.name));
    card.appendChild(el('p', 'vg-story', p.story));
    var line = p.latin || p.french; if (line) { card.appendChild(el('div', 'vg-latin', line)); card.appendChild(el('div', 'vg-en', p.english || '')); }
    if (p.quote) {                                   // a line from the Aeneid about the journey and what it means
      var qb = el('div', 'vg-quote');
      qb.appendChild(el('div', 'vg-qk', 'From the Aeneid · ' + p.quote.ref));
      p.quote.latin.split(String.fromCharCode(10)).forEach(function (l) { qb.appendChild(el('div', 'vg-ql', l)); });
      qb.appendChild(el('div', 'vg-qe', '“' + p.quote.english + '”'));
      if (p.quote.meaning) qb.appendChild(el('div', 'vg-qm', p.quote.meaning));
      card.appendChild(qb);
    }
    var last = k === D.ports.length - 1;
    var b = el('button', 'vg-btn', last ? T.see : k === 0 ? T.start : T.on + D.ports[k + 1].name); b.type = 'button';
    b.addEventListener('click', function () { if (last) finish(); else question(); });
    card.appendChild(b); b.focus({ preventScroll: true });
  }
  function finish() {
    card.className = 'vg-card vg-port-card'; card.innerHTML = '';
    card.appendChild(el('h3', null, T.fin + D.ports[D.ports.length - 1].name + '.'));
    card.appendChild(el('p', 'vg-story', 'You answered ' + firstTry + ' of ' + asked + ' questions right on the first try' + T.rode(missed)));
    if (D.next) card.appendChild(el('p', 'vg-en', D.next));
    var again = el('button', 'vg-btn', T.again); again.type = 'button';
    again.addEventListener('click', function () { pos = 0; legStart = 0; asked = firstTry = missed = 0; bank = []; place(0); trail(0); port(0); });
    card.appendChild(again);
    try { window.dispatchEvent(new CustomEvent('mw-game', { detail: { name: D.title || 'Iter Aenēae', done: true, summary: 'reached ' + D.ports[D.ports.length - 1].name + ' · ' + firstTry + ' of ' + asked + ' right on the first try' } })); } catch (e) {}
  }

  root.appendChild(drawMap()); addMarks();
  card = el('div', 'vg-card'); root.appendChild(card);
  place(0); trail(0); port(0);
})();
