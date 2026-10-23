/* portrait.js: guided writing workshop ("Ton portrait de famille"). Enhances a block of five static
   <textarea class="journal-box"> boxes (so my-work.js saves them like any journal box) with: clickable sentence
   starters, an accent bar, live per-sentence coaching (ticks + gentle hints for common slips), a live framed
   "portrait card" that gathers the sentences, and the lesson's checklist ticking itself. Coaching, not grading.
   Markup: <div class="portrait" data-config='{"words": {...}, "steps": [{"prompt", "starters": [], "needs": []}]}'>
             <textarea class="journal-box" data-label="..." data-model="..."></textarea> x5 ... </div>
   needs (per step): family | adj2 | irregular | bangs | faire. French 1 S2 Module 1 word lists live in the config.
   Optional (2026-10-23, Lesson 1.08 "Au revoir, Renoir"): cardTitle, readyText, checks (keys: fam3 adj5 adj2 irr bangs faire clean;
   default = the family-portrait six), guests [{img, alt, label}] = a picker whose choice shows on the card (kept on this device). */
(function () {
  'use strict';
  var CSS = '\
.pt{--ink:#1d2a44;--gold:#b8892e;--gold-lt:#e9d39a;--cream:#fbf6ea;--rule:#e2d6bb;--muted:#5e5a52;--blue:#2b4c8c;--wine:#8c2f39;--ok:#2f6b4f;color:var(--ink)}\
.pt *{box-sizing:border-box}\
.pt-grid{display:grid;grid-template-columns:minmax(0,1fr) 300px;gap:20px;align-items:start}\
@media (max-width:820px){.pt-grid{grid-template-columns:1fr}}\
.pt-step{background:#fff;border:1px solid var(--rule);border-left:4px solid var(--gold);border-radius:4px;padding:12px 14px;margin:0 0 12px}\
.pt-step.good{border-left-color:var(--ok)}\
.pt-head{display:flex;gap:10px;align-items:baseline}\
.pt-num{flex:0 0 auto;width:28px;height:28px;border-radius:50%;border:1.5px solid var(--gold);display:flex;align-items:center;justify-content:center;\
font-family:"Cormorant Garamond",Georgia,serif;font-size:17px;font-weight:600;background:var(--cream)}\
.pt-step.good .pt-num{background:var(--ok);border-color:var(--ok);color:#fff}\
.pt-prompt{font-size:16px;line-height:1.45}\
.pt-starters{display:flex;flex-wrap:wrap;gap:6px;margin:8px 0}\
.pt-starters button{font-family:"Cormorant Garamond",Georgia,serif;font-size:17px;font-weight:600;color:var(--blue);background:#f4f6fb;border:1px dashed var(--blue);\
border-radius:999px;padding:2px 12px;cursor:pointer}\
.pt-starters button:hover{background:#e8edf8}\
.pt-starters span{font-size:13px;color:var(--muted);align-self:center}\
.pt-extras button{color:#2f6b4f;border-color:#2f6b4f;background:#f1f7f3}.pt-extras button:hover{background:#e3f0e8}\
.pt-extras button small{font-family:"Segoe UI",Arial,sans-serif;font-size:11.5px;font-weight:400;color:var(--muted);margin-left:3px}\
.pt textarea.journal-box{width:100%;min-height:58px;font-family:"Cormorant Garamond",Georgia,serif;font-size:22px;line-height:1.35;color:var(--ink);\
border:1.5px solid var(--rule);border-radius:6px;padding:8px 12px;background:#fffdf8;resize:vertical}\
.pt textarea.journal-box:focus{outline:none;border-color:var(--blue);box-shadow:0 0 0 3px rgba(43,76,140,.15)}\
.pt-ticks{display:flex;flex-wrap:wrap;gap:6px 12px;margin-top:6px;font-size:13.5px;color:var(--muted)}\
.pt-ticks span::before{content:"\\25CB  ";color:#c8bfae}.pt-ticks span.on{color:var(--ok)}.pt-ticks span.on::before{content:"\\2713  ";color:var(--ok);font-weight:700}\
.pt-hint{margin-top:6px;font-size:14.5px;line-height:1.45;color:var(--wine)}.pt-hint:empty{display:none}\
.pt-hint div::before{content:"\\270E  "}\
.pt-acc{position:sticky;top:6px;z-index:3;display:flex;flex-wrap:wrap;gap:4px;align-items:center;background:#fffdf7;border:1px dashed #b8c4d6;border-radius:8px;padding:6px 10px;margin:0 0 12px}\
.pt-acc small{font-size:12.5px;color:var(--muted);margin-right:6px}\
.pt-acc button{font-size:19px;min-width:32px;height:32px;border:1px solid var(--rule);border-radius:6px;background:#fff;color:var(--ink);cursor:pointer}\
.pt-acc button:hover{background:var(--cream)}\
.pt-side{position:sticky;top:10px}\
.pt-card{background:#fffdf7;border:1px solid var(--rule);outline:1px solid var(--gold-lt);outline-offset:-7px;padding:18px 18px 14px;box-shadow:0 8px 20px rgba(60,40,10,.15);border-radius:2px}\
.pt-card.ready{box-shadow:0 0 0 3px var(--gold-lt),0 8px 26px rgba(184,137,46,.45)}\
.pt-card h4{margin:0;text-align:center;font-family:"Cormorant Garamond",Georgia,serif;font-size:24px;font-weight:600;font-style:italic}\
.pt-card .pt-orn{display:block;margin:4px auto 8px;width:120px;height:12px}\
.pt-text{font-family:"Cormorant Garamond",Georgia,serif;font-size:19px;line-height:1.5;min-height:90px;color:var(--ink)}\
.pt-text:empty::before{content:"Your portrait appears here as you write.";color:#a59c8c;font-style:italic;font-size:16px}\
.pt-list{list-style:none;padding:0;margin:12px 0 0;font-size:14px;line-height:1.4}\
.pt-list li{padding:3px 0 3px 24px;position:relative;color:var(--muted)}\
.pt-list li::before{content:"\\25A1";position:absolute;left:2px;top:2px;font-size:16px;color:#b9ae98}\
.pt-list li.on{color:var(--ok)}.pt-list li.on::before{content:"\\2611";color:var(--ok)}\
.pt-ready{margin-top:10px;text-align:center;font-size:14.5px;color:var(--ok);font-weight:600;min-height:20px}\
.pt-model summary{cursor:pointer;color:var(--blue);font-weight:600;font-size:15px;margin:0 0 6px}\
.pt-model div{font-family:"Cormorant Garamond",Georgia,serif;font-size:19px;line-height:1.5;background:var(--cream);border:1px solid var(--rule);border-radius:4px;padding:8px 12px;margin-bottom:12px}\
.pt-note{font-size:12.5px;color:var(--muted);margin-top:8px;font-style:italic;text-align:center}\
.pt-card{max-height:calc(100vh - 20px);overflow:auto}\
.pt-bank{margin-top:12px;border-top:1px solid var(--rule);padding-top:8px}\
.pt-bank summary{cursor:pointer;font-family:"Cormorant Garamond",Georgia,serif;font-size:19px;font-weight:600;color:var(--ink)}\
.pt-bhelp{font-size:12.5px;color:var(--muted);margin:2px 0 6px}\
.pt-mf{color:var(--blue);font-weight:700}.pt-mf.f{color:var(--wine)}\
.pt-btitle{font-size:11.5px;letter-spacing:.14em;text-transform:uppercase;color:var(--gold);margin:8px 0 3px}\
.pt-bnote{font-size:12px;color:var(--muted);font-style:italic;margin:-1px 0 3px}\
.pt-brow{display:flex;justify-content:space-between;align-items:baseline;gap:8px;padding:1px 0;border-bottom:1px dotted #eee4d0}\
.pt-bforms{font-family:"Cormorant Garamond",Georgia,serif;font-size:17px;color:var(--muted)}\
.pt-bw{font:inherit;font-weight:600;color:var(--ink);background:none;border:none;padding:0 1px;cursor:pointer;border-bottom:1px dashed transparent}\
.pt-bw.m{color:var(--blue)}.pt-bw.f{color:var(--wine)}.pt-bw:hover{border-bottom-color:currentColor;background:var(--cream)}\
.pt-ben{font-size:12.5px;color:var(--muted);text-align:right;white-space:nowrap}\
.pt-guests{display:flex;flex-wrap:wrap;gap:14px;margin:0 0 14px}\
.pt-guests button{background:none;border:0;padding:0;cursor:pointer;text-align:center;width:118px;font:13px/1.3 "Segoe UI",Arial,sans-serif;color:var(--muted)}\
.pt-guests img{display:block;width:104px;height:128px;object-fit:cover;border-radius:50%;margin:0 auto 6px;border:3px solid var(--gold-lt);box-shadow:0 0 0 1px var(--gold);transition:transform .15s}\
.pt-guests button:hover img{transform:scale(1.04)}\
.pt-guests button.on img{border-color:var(--gold);box-shadow:0 0 0 3px var(--ink)}.pt-guests button.on{color:var(--ink);font-weight:600}\
.pt-gpick{font-size:16px;margin:0 0 8px}\
.pt-gimg{display:block;width:120px;height:148px;object-fit:cover;border-radius:50%;margin:4px auto 8px;border:3px solid var(--gold-lt);box-shadow:0 0 0 1px var(--gold)}\
';
  function el(t, c, h) { var e = document.createElement(t); if (c) e.className = c; if (h != null) e.innerHTML = h; return e; }
  function norm(s) { return s.toLowerCase().replace(/[\u2019']/g, "'").replace(/\u0153/g, 'oe'); }
  function words(s) { return norm(s).replace(/\b(l|d|j|m|t|s|n|c|qu)'/g, ' ').split(/[^a-z\u00e0-\u00ff'-]+/).filter(Boolean); }  // l'a\u00een\u00e9 -> a\u00een\u00e9

  function Portrait(root, cfg) {
    var self = this, W = cfg.words; this.cfg = cfg; this.root = root; root.classList.add('pt');
    // word lookups (keys are normalised: lower case, œ -> oe)
    this.fam = {}; W.family.forEach(function (w) { self.fam[norm(w)] = 1; });
    this.adj = {}; W.adjectives.forEach(function (g) { g.forms.forEach(function (f) { self.adj[norm(f)] = { lemma: g.forms[0], irr: !!g.irregular, bangs: !!g.bangs, fem: g.fem ? g.fem.map(norm) : [], masc: g.masc ? g.masc.map(norm) : [] }; }); });
    this.faire = {}; W.faire.forEach(function (w) { self.faire[norm(w)] = 1; });
    this.det = {}; W.determiners.forEach(function (w) { self.det[norm(w)] = 1; });
    var boxes = [].slice.call(root.querySelectorAll('textarea.journal-box'));
    var grid = el('div', 'pt-grid'), main = el('div'), side = el('div', 'pt-side');
    // worked example + accent bar
    if (cfg.model) { var md = el('details', 'pt-model'); md.innerHTML = '<summary>See a worked example</summary><div lang="fr">' + cfg.model + '</div>'; main.appendChild(md); }
    var acc = el('div', 'pt-acc', '<small>Accents: click a box first, then a letter.</small>');
    (cfg.accents || []).forEach(function (ch) { var b = el('button', null, ch); b.type = 'button'; b.addEventListener('mousedown', function (e) { e.preventDefault(); }); b.addEventListener('click', function () { self.insert(ch); }); acc.appendChild(b); });
    main.appendChild(acc);
    if (cfg.guests) {   // choose who to describe: a guest from the module painting
      var gk = 'pt-guest:' + location.pathname, gp = el('div', 'pt-gpick', '<strong>Choose a guest</strong> from the painting:'), gs = el('div', 'pt-guests');
      this.gbtn = cfg.guests.map(function (g, i) { var b = el('button'); b.type = 'button'; b.innerHTML = '<img src="' + g.img + '" alt="">' + g.label; b.setAttribute('aria-label', 'Choose ' + g.alt);
        b.addEventListener('click', function () { self.pick(i); try { localStorage.setItem(gk, String(i)); } catch (e) {} }); gs.appendChild(b); return b; });
      main.insertBefore(gp, acc); main.insertBefore(gs, acc);
      var saved = null; try { saved = localStorage.getItem(gk); } catch (e) {}
      this.pendingGuest = saved != null && cfg.guests[+saved] ? +saved : null;
    }
    this.steps = cfg.steps.map(function (st, i) {
      var box = boxes[i], card = el('div', 'pt-step'), head = el('div', 'pt-head');
      head.appendChild(el('div', 'pt-num', String(i + 1))); head.appendChild(el('div', 'pt-prompt', st.prompt)); card.appendChild(head);
      var sb = el('div', 'pt-starters', '<span>Start with:</span>');
      (st.starters || []).forEach(function (t) { var b = el('button', null, t); b.type = 'button'; b.lang = 'fr';
        b.addEventListener('click', function () { if (!box.value.trim()) box.value = t + ' '; else box.value = box.value.replace(/\s*$/, ' ') + t + ' '; box.focus(); box.setSelectionRange(box.value.length, box.value.length); box.dispatchEvent(new Event('input', { bubbles: true })); }); sb.appendChild(b); });
      card.appendChild(sb);
      if (st.extras) {   // e.g. step 5: things to do with faire, click to insert
        var xb = el('div', 'pt-starters pt-extras', '<span>' + st.extras.label + '</span>');
        st.extras.items.forEach(function (it) { var b = el('button', null, it[0] + ' <small>' + it[1] + '</small>'); b.type = 'button'; b.lang = 'fr';
          b.addEventListener('mousedown', function (e) { e.preventDefault(); }); b.addEventListener('click', function () { self.last = box; box.focus(); self.addWord(it[0]); }); xb.appendChild(b); });
        card.appendChild(xb);
      }
      box.lang = 'fr'; box.spellcheck = false; box.setAttribute('autocapitalize', 'sentences'); box.placeholder = 'Écris ta phrase…'; card.appendChild(box);
      var ticks = el('div', 'pt-ticks'), hint = el('div', 'pt-hint'); card.appendChild(ticks); card.appendChild(hint); main.appendChild(card);
      box.addEventListener('focus', function () { self.last = box; });
      box.addEventListener('input', function () { self.run(); });
      return { st: st, box: box, card: card, ticks: ticks, hint: hint };
    });
    this.last = boxes[0];
    var c = el('div', 'pt-card');
    c.innerHTML = '<h4>' + (cfg.cardTitle || 'Mon portrait de famille') + '</h4><svg class="pt-orn" viewBox="0 0 120 12" fill="none" stroke="#b8892e" stroke-width="1.2"><path d="M52 6 C42 6 30 2 8 6"/><path d="M68 6 C78 6 90 2 112 6"/><path d="M60 1 L64 6 L60 11 L56 6 Z" fill="#b8892e" stroke="none"/></svg>';
    if (cfg.guests) { this.gimg = el('img', 'pt-gimg'); this.gimg.hidden = true; this.gimg.alt = ''; c.appendChild(this.gimg); }
    this.text = el('div', 'pt-text'); this.text.lang = 'fr'; c.appendChild(this.text);
    this.list = el('ul', 'pt-list'); c.appendChild(this.list); this.ready = el('div', 'pt-ready'); c.appendChild(this.ready);
    if (cfg.bank) {   // the module's adjectives: click a word to put it in the sentence you are writing
      var bk = el('details', 'pt-bank'); bk.open = true; bk.innerHTML = '<summary>' + (cfg.bankTitle || 'Les adjectifs du module') + '</summary><div class="pt-bhelp">Click a word to add it to your sentence. <span class="pt-mf">m.</span> / <span class="pt-mf f">f.</span></div>';
      cfg.bank.forEach(function (grp) {
        var g = el('div', 'pt-bgrp'); g.appendChild(el('div', 'pt-btitle', grp.title)); if (grp.note) g.appendChild(el('div', 'pt-bnote', grp.note));
        grp.items.forEach(function (it) {
          var row = el('div', 'pt-brow'), forms = el('span', 'pt-bforms');
          [[it[0], 'm'], [it[1], 'f']].forEach(function (f, k) {
            if (!f[0]) return; if (k && it[0]) forms.appendChild(document.createTextNode(' · '));
            var b = el('button', 'pt-bw' + (it[1] ? ' ' + f[1] : ''), f[0]); b.type = 'button'; b.lang = 'fr'; b.title = it[1] ? (f[1] === 'm' ? 'masculine' : 'feminine') : 'masculine and feminine';
            b.addEventListener('mousedown', function (e) { e.preventDefault(); }); b.addEventListener('click', function () { self.addWord(f[0]); }); forms.appendChild(b);
          });
          row.appendChild(forms); row.appendChild(el('span', 'pt-ben', it[2])); g.appendChild(row);
        });
        bk.appendChild(g);
      });
      c.appendChild(bk);
    }
    c.appendChild(el('div', 'pt-note', 'The ticks and hints are a coach, not a grade: read your sentences again yourself too.'));
    this.cardEl = c; side.appendChild(c);
    grid.appendChild(main); grid.appendChild(side); root.appendChild(grid);
    if (this.pendingGuest != null) this.pick(this.pendingGuest);
    this.run(); setTimeout(function () { self.run(); }, 400); setTimeout(function () { self.run(); }, 1500);   // after my-work restores saved text
  }
  Portrait.prototype.pick = function (i) {
    var g = this.cfg.guests[i]; this.gbtn.forEach(function (b, k) { b.classList.toggle('on', k === i); b.setAttribute('aria-pressed', k === i ? 'true' : 'false'); });
    this.gimg.src = g.img; this.gimg.alt = 'Detail from the painting: ' + g.alt; this.gimg.hidden = false;
  };
  Portrait.prototype.addWord = function (w) {   // a whole word: add the spaces it needs around it
    var b = this.last; if (!b) return; var s = b.selectionStart != null ? b.selectionStart : b.value.length, before = b.value.slice(0, s);
    this.insert((before && !/\s$/.test(before) ? ' ' : '') + w + ' ');
  };
  Portrait.prototype.insert = function (ch) {
    var b = this.last; if (!b) return; var s = b.selectionStart != null ? b.selectionStart : b.value.length, e = b.selectionEnd != null ? b.selectionEnd : s;  // 0 is a real position
    b.value = b.value.slice(0, s) + ch + b.value.slice(e); b.focus(); b.setSelectionRange(s + ch.length, s + ch.length); b.dispatchEvent(new Event('input', { bubbles: true }));
  };
  Portrait.prototype.analyse = function (text) {
    var self = this, ws = words(text), r = { fam: [], adj: [], irr: false, bangs: false, faire: false, hints: [] };
    ws.forEach(function (w, i) {
      if (self.fam[w] && r.fam.indexOf(w) < 0) r.fam.push(w);
      var a = self.adj[w];
      if (a) { if (r.adj.indexOf(a.lemma) < 0) r.adj.push(a.lemma); if (a.irr) r.irr = true;
        if (a.bangs && self.det[ws[i - 1]] && ws[i + 1] && !self.adj[ws[i + 1]] && ['et', 'mais', 'ou'].indexOf(ws[i + 1]) < 0) r.bangs = true;
        // agreement with the article in front: une + masculine-only form, un + feminine form
        if (ws[i - 1] === 'une' && a.masc.indexOf(w) >= 0) r.hints.push('With <em>une</em>, the adjective is feminine: check <em>' + w + '</em>.');
        if (ws[i - 1] === 'un' && a.fem.indexOf(w) >= 0) r.hints.push('With <em>un</em>, the adjective is masculine: check <em>' + w + '</em>.');
        // after "elle est (très/un peu)" / "il est (…)"
        var j = i - 1; while (j >= 0 && ['tres', 'très', 'un', 'peu', 'aussi', 'assez'].indexOf(ws[j]) >= 0) j--;
        if (ws[j] === 'est' && ws[j - 1] === 'elle' && a.masc.indexOf(w) >= 0) r.hints.push('<em>Elle est ' + w + '</em>? If it describes a woman or girl, use the feminine ending.');
        if (ws[j] === 'est' && ws[j - 1] === 'il' && a.fem.indexOf(w) >= 0) r.hints.push('<em>Il est ' + w + '</em>? For a man or boy, use the masculine form.');
      }
      if (self.faire[w]) r.faire = true;
    });
    return r;
  };
  Portrait.prototype.run = function () {
    var self = this, all = { fam: [], adj: [], irr: false, bangs: false, faire: false }, texts = [];
    this.steps.forEach(function (S) {
      var t = S.box.value.trim(), r = self.analyse(t), need = S.st.needs || [], marks = [], hints = r.hints.slice();
      if (t) texts.push(t.replace(/</g, '&lt;'));
      r.fam.forEach(function (f) { if (all.fam.indexOf(f) < 0) all.fam.push(f); }); r.adj.forEach(function (a) { if (all.adj.indexOf(a) < 0) all.adj.push(a); });
      if (r.irr) all.irr = true; if (r.bangs) all.bangs = true; if (r.faire) all.faire = true;
      var label = { family: ['a family member', r.fam.length > 0], adj2: ['two adjectives', r.adj.length >= 2], adj1: ['an adjective', r.adj.length >= 1],
        irregular: ['an irregular adjective (beau / nouveau / vieux)', r.irr], bangs: ['a BANGS adjective before a noun', r.bangs], faire: ['a form of faire', r.faire] };
      need.forEach(function (n) { marks.push('<span class="' + (label[n][1] ? 'on' : '') + '">' + label[n][0] + '</span>'); });
      if (t) {
        if (!/^[A-ZÀ-ÖØ-Þ«]/.test(t)) hints.push('Start the sentence with a capital letter.');
        if (!/[.!?]$/.test(t)) hints.push('End with a full stop (.), or ! or ?');
        if (need.indexOf('irregular') >= 0 && !r.irr) hints.push('Use <em>beau / belle</em>, <em>nouveau / nouvelle</em> or <em>vieux / vieille</em> somewhere in this sentence.');
        if (need.indexOf('bangs') >= 0 && !r.bangs) hints.push('Put a BANGS adjective (<em>petit, grand, jeune, vieux, beau, bon…</em>) <strong>in front of</strong> a noun: <em>un petit frère</em>.');
        if (need.indexOf('faire') >= 0 && !r.faire) hints.push('Use a form of <em>faire</em>: <em>je fais, il fait, nous faisons, ils font…</em>');
      }
      S.ticks.innerHTML = marks.join('');
      S.hint.innerHTML = hints.map(function (h) { return '<div>' + h + '</div>'; }).join('');
      S.card.classList.toggle('good', !!t && need.every(function (n) { return label[n][1]; }) && !r.hints.length && /[.!?]$/.test(t) && /^[A-ZÀ-ÖØ-Þ«]/.test(t));
    });
    this.text.innerHTML = texts.join(' ');
    var famCount = all.fam.filter(function (f) { return f !== 'famille'; }).length;
    var n = this.steps.length, C = {
      fam3: ['at least three family members named (' + Math.min(famCount, 3) + '/3)', famCount >= 3], adj5: ['five different adjectives (' + Math.min(all.adj.length, 5) + '/5)', all.adj.length >= 5],
      adj2: ['two different adjectives (' + Math.min(all.adj.length, 2) + '/2)', all.adj.length >= 2],
      irr: ['an irregular adjective (beau / nouveau / vieux)', all.irr], bangs: ['a BANGS word placed before the noun', all.bangs], faire: ['the verb faire in a full sentence', all.faire],
      clean: ['endings checked: no hints left', !this.steps.some(function (S) { return S.hint.textContent; }) && texts.length === n] };
    var checks = (this.cfg.checks || ['fam3', 'adj5', 'irr', 'bangs', 'faire', 'clean']).map(function (k) { return C[k]; });
    this.list.innerHTML = checks.map(function (c) { return '<li class="' + (c[1] ? 'on' : '') + '">' + c[0] + '</li>'; }).join('');
    var ok = checks.every(function (c) { return c[1]; });
    this.cardEl.classList.toggle('ready', ok);
    this.ready.innerHTML = ok ? (this.cfg.readyText || 'Pr&ecirc;t pour le Speaking Task&nbsp;! Your portrait is saved in All Your Work.') : '';
  };

  function init() {
    if (!document.getElementById('pt-css')) { var s = document.createElement('style'); s.id = 'pt-css'; s.textContent = CSS; document.head.appendChild(s); }
    [].forEach.call(document.querySelectorAll('.portrait'), function (root) {
      if (root.dataset.ptReady) return; root.dataset.ptReady = '1'; new Portrait(root, JSON.parse(root.getAttribute('data-config')));
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
