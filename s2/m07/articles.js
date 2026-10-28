/* Le, la ou les ? — sort nouns by their definite article (French 1 S2, David 2026-10-28: "an activity where the students
   have to match definite articles to nouns, to help them recall the gender of the new vocabulary").
   Markup: <div data-articles='{"title", "intro", "audioBase", "bins": ["le","la","les"], "items": [{"noun", "en", "art",
   "audio", "after"?}]}'></div>. Click a noun card, then a basket (or the basket's key: buttons, so the keyboard works too).
   Right: the card drops into the basket and the word plays WITH its article (+ the optional "after" line, e.g. the pronoun).
   Wrong: a hint; the second miss plays the word with its article (the answer by ear). No sound before the first click.
   Ungraded, nothing saved. */
(function () {
  var CSS = '\
.art-box{border:1px solid #e2d6bb;border-radius:6px;background:#fffdf8;padding:16px 18px}\
.art-h{font-family:"Cormorant Garamond",Georgia,serif;font-size:28px;font-weight:600;color:#1d2a44;text-align:center;margin:0 0 4px}\
.art-intro{font-size:16px;color:#1a2340;text-align:center;line-height:1.55;margin:0 0 14px}\
.art-cards{display:flex;flex-wrap:wrap;gap:8px;justify-content:center;min-height:46px;margin:0 0 14px}\
.art-card{font:600 19px Georgia,serif;color:#1d2a44;background:#fff;border:1.5px solid #b9c4d8;border-radius:999px;padding:6px 16px;cursor:pointer}\n.art-card.pic{display:inline-flex;flex-direction:column;align-items:center;border-radius:10px;padding:6px 10px 8px;min-width:104px}\n.art-card.pic img{width:76px;height:76px;margin:0 0 2px}.art-card.pic small{margin:0}\n.art-in img{width:34px;height:34px;vertical-align:middle;margin-right:6px}\
.art-card small{font:400 13px "Segoe UI",Arial,sans-serif;color:#5e5a52;margin-left:6px}\
.art-card.sel{border-color:#b8892e;box-shadow:0 0 0 3px #e9d39a;background:#fbf6ea}\
.art-card.no{animation:artshake .35s}\
@keyframes artshake{25%{transform:translateX(-5px)}75%{transform:translateX(5px)}}\
.art-bins{display:grid;grid-template-columns:repeat(var(--n),1fr);gap:12px}\
.art-bin{border:2px dashed #e2d6bb;border-radius:8px;background:#fbf6ea;padding:8px 10px 12px;min-height:120px;text-align:center;cursor:pointer}\
.art-bin:hover,.art-bin.ready{border-color:#b8892e;background:#fff8e6}\
.art-bin .art-lab{display:block;width:100%;font:700 30px Georgia,serif;background:none;border:0;cursor:pointer;padding:2px 0 6px}\
.art-bin[data-a="le"] .art-lab{color:#2b4c8c}.art-bin[data-a="la"] .art-lab{color:#8c2f39}.art-bin[data-a="les"] .art-lab{color:#2f6b4f}.art-bin[data-a="l\'"] .art-lab{color:#7a5a12}\
.art-in{display:block;font:600 16.5px Georgia,serif;color:#1d2a44;margin:4px 0;line-height:1.3}\
.art-in em{display:block;font:italic 400 13.5px "Segoe UI",Arial,sans-serif;color:#2f6b4f}\
.art-fb{min-height:24px;text-align:center;font-size:15.5px;color:#1a2340;margin:12px 0 0}\
.art-fb.ok{color:#1e8a3c;font-weight:700}.art-fb.bad{color:#b3382c}\
.art-end{display:none;text-align:center;margin:12px 0 0;font-size:16px;color:#1a2340}\
.art-end b{color:#1e8a3c}.art-again{margin-left:10px;background:#1d2a44;color:#fff;border:0;border-bottom:3px solid #b8892e;border-radius:999px;padding:5px 14px;cursor:pointer}\
.art-tip{font-size:14px;color:#5e5a52;text-align:center;margin:10px 0 0}';
  function el(t, c, h) { var e = document.createElement(t); if (c) e.className = c; if (h != null) e.innerHTML = h; return e; }
  function shuffle(a) { for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)), t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
  function full(it) { return (it.art === "l'" ? "l’" : it.art + ' ') + it.noun; }

  function Sorter(root, cfg) {
    var self = this; this.root = root; this.cfg = cfg; this.base = cfg.audioBase || ''; this.player = new Audio(); this.sel = null;
    root.classList.add('art-box');
    root.appendChild(el('div', 'art-h', cfg.title || 'Le, la ou les&nbsp;?'));
    if (cfg.intro) root.appendChild(el('p', 'art-intro', cfg.intro));
    this.cards = root.appendChild(el('div', 'art-cards'));
    var bins = root.appendChild(el('div', 'art-bins')); bins.style.setProperty('--n', cfg.bins.length); this.bins = {};
    cfg.bins.forEach(function (a) {
      var b = bins.appendChild(el('div', 'art-bin')); b.dataset.a = a;
      var lab = b.appendChild(el('button', 'art-lab', a === "l'" ? 'l’' : a)); lab.type = 'button'; lab.setAttribute('aria-label', 'Put it with ' + a);
      b.addEventListener('click', function () { self.drop(a); }); self.bins[a] = b;
    });
    this.fb = root.appendChild(el('div', 'art-fb'));
    this.end = root.appendChild(el('div', 'art-end'));
    if (cfg.tip) root.appendChild(el('p', 'art-tip', cfg.tip));
    this.start();
  }
  Sorter.prototype.play = function (src) { if (!src) return; try { this.player.pause(); this.player.src = this.base + src; this.player.play().catch(function () {}); } catch (e) {} };
  Sorter.prototype.start = function () {
    var self = this; this.cards.innerHTML = ''; this.left = 0; this.sel = null; this.fb.className = 'art-fb'; this.fb.innerHTML = this.cfg.ask || 'Click a word, then click <strong>le</strong>, <strong>la</strong> or <strong>les</strong>.';
    this.end.style.display = 'none';
    Object.keys(this.bins).forEach(function (a) { [].slice.call(self.bins[a].querySelectorAll('.art-in')).forEach(function (n) { n.remove(); }); });
    shuffle(this.cfg.items.slice()).forEach(function (it) {
      var pic = it.img ? '<img src="' + it.img + '" alt="">' : '';   // picture: same colours for every word, so it never hints at the gender
      var c = self.cards.appendChild(el('button', 'art-card' + (pic ? ' pic' : ''), pic + '<span>' + it.noun + '</span>' + (it.en ? '<small>' + it.en + '</small>' : ''))); c.type = 'button'; c._it = it; c._miss = 0; self.left++;
      c.addEventListener('click', function (e) { e.stopPropagation(); self.pick(c); });
    });
  };
  Sorter.prototype.pick = function (c) {
    if (this.sel) this.sel.classList.remove('sel');
    this.sel = c; c.classList.add('sel'); this.fb.className = 'art-fb';
    var names = this.cfg.bins.map(function (b) { return '<strong>' + (b === "l'" ? 'l’' : b) + '</strong>'; });
    this.fb.innerHTML = '<em lang="fr">' + c._it.noun + '</em>: ' + names.slice(0, -1).join(', ') + ' or ' + names[names.length - 1] + '? Click a basket.';
    Object.keys(this.bins).forEach(function (a) { this.bins[a].classList.add('ready'); }, this);
  };
  Sorter.prototype.drop = function (a) {
    var c = this.sel, it, self = this; if (!c) { this.fb.className = 'art-fb'; this.fb.innerHTML = 'First click a word above.'; return; }
    it = c._it; Object.keys(this.bins).forEach(function (k) { self.bins[k].classList.remove('ready'); });
    if (a === it.art) {
      var inb = el('span', 'art-in', (it.img ? '<img src="' + it.img + '" alt="">' : '') + '<span lang="fr">' + full(it) + '</span>' + (it.after ? '<em lang="fr">' + it.after + '</em>' : ''));
      this.bins[a].appendChild(inb); c.remove(); this.sel = null; this.left--;
      this.fb.className = 'art-fb ok'; this.fb.innerHTML = '&#10003; <span lang="fr">' + full(it) + '</span>' + (it.en ? ' &middot; ' + it.en : '') + (it.after ? ' &rarr; <span lang="fr">' + it.after + '</span>' : '');
      this.play(it.audio);
      if (!this.left) {
        this.fb.innerHTML = ''; this.end.style.display = 'block';
        this.end.innerHTML = '<b>Bravo&nbsp;!</b> ' + (this.cfg.end || 'Every word is in its basket. Now say each one aloud, with its article.');
        var again = el('button', 'art-again', 'Again'); again.type = 'button'; again.addEventListener('click', function () { self.start(); }); this.end.appendChild(again);
      }
    } else {
      c._miss++; c.classList.remove('no'); void c.offsetWidth; c.classList.add('no');
      this.fb.className = 'art-fb bad';
      if (c._miss >= 2) { this.fb.innerHTML = 'Listen: <span lang="fr">' + full(it) + '</span>. Which basket?'; this.play(it.audio); }
      else this.fb.innerHTML = (it.hint || 'Not that one.') + ' Try another basket.';
    }
  };
  function init() {
    if (!document.getElementById('art-css')) { var st = document.createElement('style'); st.id = 'art-css'; st.textContent = CSS; document.head.appendChild(st); }
    [].forEach.call(document.querySelectorAll('[data-articles]'), function (r) { if (r._art) return; r._art = 1; try { new Sorter(r, JSON.parse(r.getAttribute('data-articles'))); } catch (e) { if (window.console) console.error(e); } });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
