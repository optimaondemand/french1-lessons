/* annotate.js: "Annote le texte", an on-page replacement for "circle every adjective on a printout and draw an arrow
   to the noun it describes". Students tap an adjective (it is circled), then tap the noun (or pronoun) it describes:
   a blue arrow links them (adjectives circled in blue, nouns underlined in burgundy). They then say masculine or
   feminine, and a small "m." / "f." label appears under the adjective. When every
   adjective is linked, they find the BANGS adjectives that sit before their noun. Hints on every wrong tap.
   Markup: <div class="annote" data-config='{ "title": ..., "paras": [[token, ...], ...] }'></div>
   token = "plain text" | {"t": "grand", "adj": 1, "to": ["n3"], "g": "m", "bangs": 1, "why": "gender hint"}
         | {"t": "frère", "id": "n3"} (a noun or pronoun an arrow can point to) | {"t": "très", "hint": "why it is not an adjective"}
   Reports to "All Your Work" with a 'mw-game' event when finished. One shared file; no libraries. */
(function () {
  'use strict';
  var NS = 'http://www.w3.org/2000/svg';
  var CSS = '\
.an{--ink:#1d2a44;--gold:#b8892e;--gold-lt:#e9d39a;--cream:#fbf6ea;--rule:#e2d6bb;--muted:#5e5a52;--m:#2b4c8c;--f:#8c2f39;--ok:#2f6b4f;color:var(--ink)}\
.an-steps{display:flex;flex-wrap:wrap;gap:6px 14px;font-size:14px;color:var(--muted);margin:0 0 10px}.an-steps b{color:var(--ink)}\
.an-steps span.on{color:var(--ink);font-weight:600}.an-steps span.done{color:var(--ok)}\
.an-page{position:relative;background:#fffdf7;border:1px solid var(--rule);outline:1px solid var(--gold-lt);outline-offset:-7px;border-radius:2px;\
padding:30px 30px 22px;box-shadow:0 6px 16px rgba(60,40,10,.12)}\
.an-p{font-family:"Cormorant Garamond",Garamond,Georgia,serif;font-size:27px;line-height:2.5;margin:0 0 6px;position:relative;z-index:1}\
.an-w{cursor:pointer;border-radius:999px;padding:1px 4px;margin:0 -4px;border:2px solid transparent;transition:background .15s,border-color .2s}\
.an-w:hover{background:#f7ecd2}\
.an-w:focus-visible{outline:3px solid #2b4c8c;outline-offset:2px}\
.an-w.sel{border-color:var(--gold);background:#fff4d6;animation:anpulse 1s ease-in-out infinite}\
@keyframes anpulse{50%{box-shadow:0 0 0 4px rgba(184,137,46,.25)}}\
.an-w.adj{border-color:var(--m);position:relative}\
.an-w.adj.m::before,.an-w.adj.f::before{position:absolute;left:50%;bottom:-1.4em;transform:translateX(-50%);font-family:"Segoe UI",Arial,sans-serif;\
font-size:11px;font-weight:700;line-height:1.4;color:var(--m);letter-spacing:.04em}\
.an-w.adj.m::before{content:"m."}.an-w.adj.f::before{content:"f."}\
.an-wiping .an-w{transition:border-color .8s,background .8s}.an-wiping .an-w.adj,.an-wiping .an-w.noun{border-color:transparent}.an-wiping .an-w.adj::before{opacity:0;transition:opacity .8s}\n.an-w.noun{border-bottom:3px solid var(--f);border-radius:0}\
.an-w.bad{animation:anshake .4s}\
@keyframes anshake{20%,60%{transform:translateX(-4px)}40%,80%{transform:translateX(4px)}}\
.an-w.star{position:relative}.an-w.star::after{content:"BANGS";position:absolute;left:50%;top:-1.15em;transform:translateX(-50%);font-family:"Segoe UI",Arial,sans-serif;\
font-size:10px;letter-spacing:.12em;font-weight:700;color:#fff;background:var(--gold);padding:1px 6px;border-radius:999px;line-height:1.5;white-space:nowrap}\
.an-svg{position:absolute;inset:0;width:100%;height:100%;pointer-events:none;z-index:2;overflow:visible}\
.an-arrow{fill:none;stroke-width:2.4;stroke-linecap:round}\
.an-bar{margin-top:12px;min-height:58px;background:var(--cream);border:1px solid var(--rule);border-left:4px solid var(--gold);border-radius:3px;padding:10px 14px;font-size:16px;line-height:1.5}\
.an-bar.an-nudge{animation:anshake .4s}.an-bar.no{border-left-color:var(--f)}.an-bar.ok{border-left-color:var(--ok)}\
.an-bar button{font:inherit;font-size:15px;margin:6px 6px 0 0;border-radius:999px;padding:5px 16px;cursor:pointer;border:1.5px solid var(--rule);background:#fff;color:var(--ink)}\
.an-bar button.gm{border-color:var(--m);color:var(--m)}.an-bar button.gf{border-color:var(--f);color:var(--f)}\
.an-bar button:hover{background:#f7ecd2}\
.an-meter{display:flex;gap:4px;margin:10px 0 0}.an-meter i{flex:1;height:6px;border-radius:3px;background:#e8e1d2}.an-meter i.on{background:var(--gold)}\
.an-key{display:flex;flex-wrap:wrap;gap:6px 16px;font-size:13.5px;color:var(--muted);margin-top:8px}.an-key i{display:inline-block;width:22px;height:3px;vertical-align:middle;margin-right:5px;border-radius:2px}\
.an-done{margin-top:12px;text-align:center}\
.an-done h4{font-family:"Cormorant Garamond",Georgia,serif;font-size:28px;font-weight:600;margin:0}\
.an-reset{font:inherit;font-size:13px;margin-top:8px;background:transparent;border:1px solid var(--gold);color:var(--muted);border-radius:999px;padding:4px 14px;cursor:pointer}\
@media (max-width:600px){.an-p{font-size:22px;line-height:2.6}.an-page{padding:24px 14px 16px}}\
@media (prefers-reduced-motion:reduce){.an-w.sel,.an-w.bad{animation:none}}\
';
  function el(t, c, h) { var e = document.createElement(t); if (c) e.className = c; if (h != null) e.innerHTML = h; return e; }
  function sv(t, a, p) { var e = document.createElementNS(NS, t); for (var k in a) e.setAttribute(k, a[k]); if (p) p.appendChild(e); return e; }

  function Annote(root, cfg) {
    var self = this; this.root = root; this.cfg = cfg; root.classList.add('an');
    this.steps = el('div', 'an-steps'); root.appendChild(this.steps);
    this.page = el('div', 'an-page'); root.appendChild(this.page);
    this.adjs = []; this.nouns = {};
    cfg.paras.forEach(function (para) {
      var p = el('p', 'an-p'); p.lang = 'fr';
      para.forEach(function (tk, i) {
        if (typeof tk === 'string') { p.appendChild(document.createTextNode(tk)); return; }
        var w = el('span', 'an-w', tk.t); w.tabIndex = 0; w.setAttribute('role', 'button'); w._tk = tk;
        if (tk.adj) self.adjs.push(w); if (tk.id) self.nouns[tk.id] = w;
        w.addEventListener('click', function () { self.tap(w); });
        w.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); self.tap(w); } });
        p.appendChild(w);
      });
      self.page.appendChild(p);
    });
    this.svg = sv('svg', { 'class': 'an-svg', 'aria-hidden': 'true' }, this.page);
    var defs = sv('defs', {}, this.svg);
    ['gold', 'm', 'f'].forEach(function (k) {
      var mk = sv('marker', { id: 'anHead-' + k + cfg.id, viewBox: '0 0 10 10', refX: 8, refY: 5, markerWidth: 7, markerHeight: 7, orient: 'auto-start-reverse' }, defs);
      sv('path', { d: 'M0,0 L10,5 L0,10 z', fill: { gold: '#b8892e', m: '#2b4c8c', f: '#8c2f39' }[k] }, mk);
    });
    this.bar = el('div', 'an-bar'); root.appendChild(this.bar);
    this.meter = el('div', 'an-meter'); root.appendChild(this.meter);
    var key = el('div', 'an-key', '<span><i style="background:#2b4c8c"></i>adjective, linked to its noun</span><span><i style="background:#8c2f39"></i>noun it describes</span>' +
      '<span><b style="color:#2b4c8c">m. / f.</b> masculine / feminine</span><span><i style="background:#b8892e"></i>BANGS: before the noun</span>');
    root.appendChild(key);
    this.links = []; this.mode = 'link'; this.sel = null; this.wrong = 0;
    window.addEventListener('resize', function () { self.draw(); });
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { self.draw(); });
    this.say('Tap an <strong>adjective</strong> to circle it. Then tap the <strong>noun</strong> (or pronoun) it describes to draw the link.');
    this.update();
  }
  Annote.prototype.say = function (html, cls) { this.bar.className = 'an-bar' + (cls ? ' ' + cls : ''); this.bar.innerHTML = html; };
  Annote.prototype.update = function () {
    var n = this.adjs.length, k = this.links.length, b = this.adjs.filter(function (w) { return w._tk.bangs; }), bk = b.filter(function (w) { return w.classList.contains('star'); }).length;
    this.steps.innerHTML = '<span class="' + (this.mode === 'link' ? 'on' : 'done') + '">1 &middot; Circle and link: <b>' + k + ' / ' + n + '</b> adjectives</span>' +
      '<span class="' + (this.mode === 'bangs' ? 'on' : this.mode === 'done' ? 'done' : '') + '">2 &middot; Find the BANGS adjectives: <b>' + bk + ' / ' + b.length + '</b></span>';
    var h = ''; for (var i = 0; i < n; i++) h += '<i class="' + (i < k ? 'on' : '') + '"></i>'; this.meter.innerHTML = h;
  };
  Annote.prototype.tap = function (w) {
    var tk = w._tk, self = this;
    if (this.mode === 'done') return;
    if (this.mode === 'bangs') {
      if (tk.adj && tk.bangs && !w.classList.contains('star')) { w.classList.add('star'); this.say('<strong>Oui&nbsp;!</strong> <em>' + tk.t + '</em> comes <strong>before</strong> its noun: a BANGS adjective.', 'ok'); this.update(); this.checkEnd(); return; }
      if (tk.adj && !tk.bangs) { this.bad(w, '<em>' + tk.t + '</em> comes <strong>after</strong> the noun it describes, so it is not one of the BANGS adjectives.'); return; }
      if (!tk.adj) { this.bad(w, 'Tap an <strong>adjective</strong> that sits <strong>in front of</strong> its noun.'); }
      return;
    }
    if (this.links.some(function (L) { return L.g === null; })) { this.bar.classList.remove('an-nudge'); void this.bar.offsetWidth; this.bar.classList.add('an-nudge'); return; }
    if (this.sel) {                                   // second tap: the noun
      var a = this.sel;
      if (w === a) { a.classList.remove('sel'); this.sel = null; this.say('Tap an adjective to circle it.'); return; }
      if (tk.adj && !w.linked) { a.classList.remove('sel'); this.sel = null; return this.tap(w); }
      if (tk.id && a._tk.to.indexOf(tk.id) >= 0) {
        a.classList.remove('sel'); this.sel = null; a.classList.add('adj'); a.linked = true; w.classList.add('noun');
        var L = { a: a, n: w, g: null }; this.links.push(L); this.draw(); this.update();
        this.askGender(L); return;
      }
      this.bad(w, 'Not that one. Who or what is <em>' + a._tk.t + '</em>? Look at who the sentence is about.' + (tk.id ? '' : ' Tap a <strong>noun</strong> (or <em>il</em> / <em>elle</em>).'));
      return;
    }
    if (tk.adj) {
      if (w.linked) { this.say('<em>' + tk.t + '</em> is already linked. Pick another adjective.'); return; }
      w.classList.add('sel'); this.sel = w;
      this.say('<em>' + tk.t + '</em> is circled. Now tap the <strong>noun</strong> (or pronoun) it describes.'); return;
    }
    if (tk.id && !tk.hint) { this.bad(w, '<em>' + tk.t + '</em> is a noun (or pronoun). First tap an <strong>adjective</strong>, then the noun it describes.'); return; }
    this.bad(w, tk.hint || ('<em>' + tk.t + '</em> is not an adjective. Adjectives tell you what a person or thing is <strong>like</strong>.'));
  };
  Annote.prototype.bad = function (w, msg) {
    this.wrong++; w.classList.remove('bad'); void w.offsetWidth; w.classList.add('bad'); this.say(msg, 'no');
  };
  Annote.prototype.askGender = function (L) {
    var self = this, a = L.a, tk = a._tk;
    a.awaitGender = true;
    this.say('Linked: <em>' + tk.t + '</em> &rarr; <em>' + L.n._tk.t + '</em>. Is <em>' + tk.t + '</em> here <strong>masculine</strong> or <strong>feminine</strong>?<br>', '');
    [['m', 'masculine', 'gm'], ['f', 'feminine', 'gf']].forEach(function (g) {
      var b = el('button', g[2], g[1]); b.type = 'button';
      b.addEventListener('click', function () {
        if (g[0] === tk.g) {
          a.awaitGender = false; L.g = tk.g; a.classList.add(tk.g); self.draw();
          self.say('<strong>Oui&nbsp;!</strong> ' + (tk.why || '') + ' ' + (self.links.length < self.adjs.length ? 'Tap the next adjective.' : ''), 'ok');
          if (self.links.length === self.adjs.length) self.toBangs();
        } else { self.wrong++; self.say('Not quite. ' + (tk.why || '') + '<br>', 'no'); self.askGenderButtons(L); }
      });
      self.bar.appendChild(b);
    });
  };
  Annote.prototype.askGenderButtons = function (L) {  // after a wrong guess, offer the buttons again
    var self = this, tk = L.a._tk;
    [['m', 'masculine', 'gm'], ['f', 'feminine', 'gf']].forEach(function (g) {
      var b = el('button', g[2], g[1]); b.type = 'button';
      b.addEventListener('click', function () { if (g[0] === tk.g) { L.a.awaitGender = false; L.g = tk.g; L.a.classList.add(tk.g); self.draw();
        self.say('<strong>Oui.</strong> ' + (self.links.length < self.adjs.length ? 'Tap the next adjective.' : ''), 'ok');
        if (self.links.length === self.adjs.length) self.toBangs();
      } });
      self.bar.appendChild(b);
    });
  };
  Annote.prototype.toBangs = function () {  // Step 2 is a separate task: show the finished annotation briefly, then wipe it
    var self = this; this.mode = 'bangs'; this.update();
    setTimeout(function () { self.svg.style.transition = 'opacity .8s'; self.svg.style.opacity = '0'; self.page.classList.add('an-wiping'); }, 1600);
    setTimeout(function () {
      [].forEach.call(self.page.querySelectorAll('.an-w'), function (w) { w.classList.remove('adj', 'noun', 'm', 'f'); });
      [].slice.call(self.svg.querySelectorAll('.an-arrow')).forEach(function (a) { a.remove(); });
      self.svg.style.transition = ''; self.svg.style.opacity = ''; self.page.classList.remove('an-wiping');
      self.say('<strong>Step 2 &middot; a new task.</strong> The page is clean again. Now find the <strong>BANGS</strong> adjectives: tap the ones that sit <strong>in front of</strong> their noun.');
    }, 2500);
  };
  Annote.prototype.draw = function () {
    if (this.mode !== 'link') return;   // after Step 1 the links are wiped
    var svg = this.svg, box = this.page.getBoundingClientRect(), id = this.cfg.id;
    [].slice.call(svg.querySelectorAll('.an-arrow')).forEach(function (p) { p.remove(); });
    this.links.forEach(function (L) {
      var ra = L.a.getBoundingClientRect(), rn = L.n.getBoundingClientRect();
      var x1 = ra.left + ra.width / 2 - box.left, y1 = ra.top - box.top + 2, x2 = rn.left + rn.width / 2 - box.left, y2 = rn.top - box.top + 2;
      var lift = 16 + Math.min(34, Math.abs(x2 - x1) * .12) + (Math.abs(y2 - y1) > 10 ? 10 : 0);
      var cx = (x1 + x2) / 2, cy = Math.min(y1, y2) - lift;  // every link is blue: adjective (blue) -> noun (burgundy underline)
      sv('path', { 'class': 'an-arrow', d: 'M' + x1.toFixed(1) + ',' + y1.toFixed(1) + ' Q' + cx.toFixed(1) + ',' + cy.toFixed(1) + ' ' + x2.toFixed(1) + ',' + y2.toFixed(1),
        stroke: '#2b4c8c', 'marker-end': 'url(#anHead-m' + id + ')' }, svg);
    });
  };
  Annote.prototype.checkEnd = function () {
    var self = this, b = this.adjs.filter(function (w) { return w._tk.bangs; });
    if (!b.every(function (w) { return w.classList.contains('star'); })) return;
    this.mode = 'done'; this.update();
    var sum = this.links.map(function (L) { return L.a._tk.t + ' → ' + L.n._tk.t + ' (' + (L.g === 'm' ? 'm.' : 'f.') + (L.a._tk.bangs ? ', BANGS' : '') + ')'; });
    this.say('<strong>Bravo&nbsp;!</strong> Every adjective is circled, linked and marked, and you found the BANGS adjectives.', 'ok');
    var d = el('div', 'an-done', '<h4>Texte annot&eacute;&nbsp;!</h4><div style="font-size:15px;color:#5e5a52">' + (this.wrong === 0 ? 'No slips at all.' : this.wrong + ' wrong tap' + (this.wrong > 1 ? 's' : '') + ' along the way, each one fixed.') + '</div>');
    var r = el('button', 'an-reset', 'Start again'); r.type = 'button'; r.addEventListener('click', function () { self.reset(); }); d.appendChild(r);
    this.root.appendChild(d); this.doneBox = d;
    try { window.dispatchEvent(new CustomEvent('mw-game', { detail: { name: this.cfg.title || 'Annote le texte', done: true, summary: 'Linked all ' + this.adjs.length + ' adjectives: ' + sum.join('; ') + '.' } })); } catch (e) {}
  };
  Annote.prototype.reset = function () {
    this.links = []; this.mode = 'link'; this.sel = null; this.wrong = 0;
    [].forEach.call(this.page.querySelectorAll('.an-w'), function (w) { w.className = 'an-w'; w.linked = false; w.awaitGender = false; });
    if (this.doneBox) this.doneBox.remove(); this.draw(); this.update();
    this.say('Tap an <strong>adjective</strong> to circle it. Then tap the <strong>noun</strong> (or pronoun) it describes to draw the link.');
  };

  function init() {
    if (!document.getElementById('an-css')) { var s = document.createElement('style'); s.id = 'an-css'; s.textContent = CSS; document.head.appendChild(s); }
    [].forEach.call(document.querySelectorAll('.annote'), function (root, i) {
      if (root.dataset.anReady) return; root.dataset.anReady = '1';
      var cfg = JSON.parse(root.getAttribute('data-config')); cfg.id = cfg.id || ('a' + i); new Annote(root, cfg);
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
