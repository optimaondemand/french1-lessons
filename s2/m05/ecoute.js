/* ecoute.js — "Écoute et choisis" listening game (French 1 S2 Lesson 5.01, David 2026-11-06).
 * Hear a word, pick its painting. Four framed paintings per turn; a right pick shows the word and its meaning, a wrong pick
 * names the painting you chose ("That one is le train") so a miss still teaches.
 *   Manche 1 · sans chrono: every word once, in a shuffled order (score = right on the first try).
 *   Manche 2 · contre la montre: as many as you can in N seconds.
 * Markup: <div data-ecoute='{"title","intro","audioBase","seconds","words":[{"fr","en","audio","img","alt","set"?}]}'></div>
 *   "set": look-alike group; a word's distractors never come from its own set.
 * Only words already taught on the page. Ungraded; reports to "All Your Work" through a window 'mw-game' event.
 * Our own code and drawing; the pictures are the lesson's public-domain paintings. */
(function () {
  'use strict';
  var CSS = '' +
    '.ec{--ink:#1d2a44;--gold:#b8892e;--gold-lt:#e9d39a;--cream:#fbf6ea;--wine:#8c2f39;--ok:#2f6b4f;color:var(--ink);max-width:880px;margin:0 auto;font-family:"Segoe UI",Roboto,Helvetica,Arial,sans-serif}' +
    '.ec *{box-sizing:border-box}' +
    '.ec-head{text-align:center;margin-bottom:10px}' +
    '.ec-title{font-family:"Cormorant Garamond",Garamond,Georgia,serif;font-size:34px;font-weight:600;line-height:1.1;margin:2px 0}' +
    '.ec-intro{font-size:16.5px;line-height:1.55;color:#1a2340;max-width:680px;margin:6px auto 0}' +
    '.ec-bar{display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:10px;background:var(--cream);border:1px solid #e2d6bb;border-radius:8px;padding:10px 14px;margin:12px 0}' +
    '.ec-mode{font-weight:700;font-size:15px;color:var(--wine);letter-spacing:.03em}' +
    '.ec-stat{font-size:15px;color:#1a2340}' +
    '.ec-clock{font-variant-numeric:tabular-nums;font-weight:700;font-size:18px;color:var(--wine)}' +
    '.ec-ask[hidden]{display:none}.ec-ask{display:flex;align-items:center;justify-content:center;gap:12px;margin:6px 0 12px;font-size:17px}' +
    '.ec-play{font:inherit;font-size:22px;width:58px;height:58px;border-radius:50%;border:3px solid var(--gold);background:#1d2a44;color:#fff;cursor:pointer;box-shadow:0 3px 10px rgba(40,25,10,.3)}' +
    '.ec-play:focus-visible{outline:3px solid var(--gold-lt);outline-offset:2px}' +
    '.ec-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:18px;max-width:760px;margin:0 auto}' +
    '.ec-card{font:inherit;display:block;width:100%;padding:6px;border:0;border-radius:3px;background:#3b2a1a;cursor:pointer;box-shadow:0 4px 12px rgba(40,25,10,.3);transition:transform .15s}' +
    '.ec-card:hover{transform:translateY(-2px)}' +
    '.ec-card:focus-visible{outline:3px solid var(--gold-lt);outline-offset:2px}' +
    '.ec-card .fr{display:block;border:4px solid var(--gold);line-height:0;position:relative}' +
    '.ec-card img{display:block;width:100%;height:auto;aspect-ratio:4/3;object-fit:cover}' +
    '.ec-card .lab{display:block;background:var(--cream);color:var(--ink);font-size:16px;line-height:1.3;padding:5px 4px;min-height:2.6em;text-align:center}' +
    '.ec-card .lab b{color:var(--wine)}' +
    '.ec-card.ok .fr{border-color:#3d8a5f;box-shadow:0 0 0 3px #3d8a5f}' +
    '.ec-card.no{animation:ec-shake .35s}.ec-card.no .fr{border-color:#b3261e}' +
    '@keyframes ec-shake{0%,100%{transform:translateX(0)}25%{transform:translateX(-5px)}75%{transform:translateX(5px)}}' +
    '.ec-fb{min-height:1.6em;margin:12px 0 4px;text-align:center;font-size:16px;line-height:1.5}' +
    '.ec-fb.ok{color:var(--ok);font-weight:700}.ec-fb.no{color:#8a1c14}' +
    '.ec-btns{display:flex;flex-wrap:wrap;justify-content:center;gap:10px;margin-top:8px}' +
    '.ec-btn{font:inherit;font-size:15.5px;border-radius:999px;padding:8px 18px;cursor:pointer;border:2px solid var(--wine);background:var(--wine);color:#fff}' +
    '.ec-btn.sec{background:#fff;color:var(--wine)}' +
    '.ec-start{font-size:21px;font-weight:700;padding:14px 34px;border-width:3px;border-color:var(--gold);box-shadow:0 4px 14px rgba(140,47,57,.35);animation:ec-pulse 1.8s ease-in-out infinite}' +
    '.ec-start:hover{filter:brightness(1.08)}' +
    '@keyframes ec-pulse{0%,100%{transform:scale(1)}50%{transform:scale(1.05)}}' +
    '@media (prefers-reduced-motion:reduce){.ec-start{animation:none}}' +
    '.ec-end{text-align:center;background:#eef6f0;border:1px solid #bcd9c6;border-radius:8px;padding:12px;font-size:16.5px;color:#1f5b3d;margin-top:10px}';

  function shuffle(a) { a = a.slice(); for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)), t = a[i]; a[i] = a[j]; a[j] = t; } return a; }

  function setup(root) {
    var C; try { C = JSON.parse(root.getAttribute('data-ecoute')); } catch (e) { return; }
    if (!document.getElementById('ec-css')) { var st = document.createElement('style'); st.id = 'ec-css'; st.textContent = CSS; document.head.appendChild(st); }
    var W = C.words, BASE = C.audioBase || '../../audio/', SECS = C.seconds || 60;
    root.className = 'ec';
    root.innerHTML = '<div class="ec-head"><div class="ec-title">' + (C.title || '&Eacute;coute et choisis') + '</div>' +
      '<p class="ec-intro">' + (C.intro || '') + '</p></div>' +
      '<div class="ec-bar"><span class="ec-mode"></span><span class="ec-stat"></span><span class="ec-clock" hidden></span></div>' +
      '<div class="ec-ask"><button type="button" class="ec-play" aria-label="&Eacute;coute le mot">&#128266;</button><span>&Eacute;coute, puis choisis le tableau. <span style="color:#5e5a52">(Listen, then pick the painting.)</span></span></div>' +
      '<div class="ec-grid" role="group" aria-label="Paintings"></div><div class="ec-fb" aria-live="polite"></div>' +
      '<div class="ec-btns"></div><div class="ec-endwrap"></div>';
    var mode = root.querySelector('.ec-mode'), stat = root.querySelector('.ec-stat'), clock = root.querySelector('.ec-clock');
    var grid = root.querySelector('.ec-grid'), fb = root.querySelector('.ec-fb'), btns = root.querySelector('.ec-btns'), endw = root.querySelector('.ec-endwrap');
    var play = root.querySelector('.ec-play'), ask = root.querySelector('.ec-ask'); ask.hidden = true;   // shown once the game starts
    var audio = null, round = 1, queue = [], cur = null, missed = false, first = 0, done = 0, timer = null, left = SECS, locked = false;

    function say(w) { try { if (audio) audio.pause(); audio = new Audio(BASE + w.audio); audio.play(); } catch (e) {} }
    play.addEventListener('click', function () { if (cur) say(cur); });

    function deal() {
      locked = false; missed = false; fb.textContent = ''; fb.className = 'ec-fb';
      if (round === 1 && !queue.length) return finish1();
      if (round === 1) cur = queue.shift();
      else { var prev = cur, pool = W.filter(function (w) { return w !== prev; }); cur = pool[Math.floor(Math.random() * pool.length)]; }   // never the same word twice in a row
      // distractors never come from the target's look-alike set (e.g. two street scenes, two trains): one painting = one answer
      var others = W.filter(function (w) { return w !== cur && !(cur.set && w.set === cur.set); });
      var opts = shuffle([cur].concat(shuffle(others).slice(0, 3)));
      grid.innerHTML = '';
      opts.forEach(function (w) {
        var b = document.createElement('button'); b.type = 'button'; b.className = 'ec-card';
        b.innerHTML = '<span class="fr"><img src="' + w.img + '" alt="' + (w.alt || '') + '"></span><span class="lab">&nbsp;</span>';
        b.addEventListener('click', function () { pick(b, w); });
        grid.appendChild(b);
      });
      stat.textContent = round === 1 ? 'Word ' + (W.length - queue.length) + ' of ' + W.length + ' · first try: ' + first : 'Found: ' + done;
      say(cur);
    }
    function pick(b, w) {
      if (locked) return;
      if (w === cur) {
        locked = true; b.className = 'ec-card ok';
        b.querySelector('.lab').innerHTML = '<b lang="fr">' + w.fr + '</b> &middot; ' + w.en;
        fb.className = 'ec-fb ok'; fb.innerHTML = 'Bravo&nbsp;! <span lang="fr">' + w.fr + '</span> = ' + w.en + '.';
        if (round === 1 && !missed) first++;
        if (round === 2) done++;
        stat.textContent = round === 1 ? 'Word ' + (W.length - queue.length) + ' of ' + W.length + ' · first try: ' + first : 'Found: ' + done;
        setTimeout(deal, round === 2 ? 650 : 1300);
      } else {
        missed = true; b.className = 'ec-card no'; setTimeout(function () { b.className = 'ec-card'; }, 380);
        b.querySelector('.lab').innerHTML = '<b lang="fr">' + w.fr + '</b> &middot; ' + w.en;
        fb.className = 'ec-fb no'; fb.innerHTML = 'That one is <b lang="fr">' + w.fr + '</b> (' + w.en + '). Press &#128266; and listen again.';
        if (round === 2) left = Math.max(0, left - 2);
      }
    }
    function start1() {
      ask.hidden = false; round = 1; first = 0; queue = shuffle(W); mode.innerHTML = 'Manche 1 &middot; sans chrono <span style="font-weight:400;color:#5e5a52">(no clock)</span>';
      clock.hidden = true; btns.innerHTML = ''; endw.innerHTML = ''; deal();
    }
    function finish1() {
      cur = null; grid.innerHTML = ''; stat.textContent = '';
      endw.innerHTML = '<div class="ec-end">&#127881; Manche 1 done: <b>' + first + ' of ' + W.length + '</b> right on the first try. Now try it against the clock: ' + SECS + ' seconds, as many as you can.</div>';
      btns.innerHTML = '';
      var go = document.createElement('button'); go.type = 'button'; go.className = 'ec-btn'; go.innerHTML = 'Manche 2 &middot; contre la montre &rarr;';
      go.addEventListener('click', start2); btns.appendChild(go);
      var again = document.createElement('button'); again.type = 'button'; again.className = 'ec-btn sec'; again.textContent = 'Manche 1 again';
      again.addEventListener('click', start1); btns.appendChild(again);
      report(false);
    }
    function start2() {
      round = 2; done = 0; left = SECS; endw.innerHTML = ''; btns.innerHTML = '';
      mode.innerHTML = 'Manche 2 &middot; contre la montre <span style="font-weight:400;color:#5e5a52">(against the clock)</span>';
      clock.hidden = false; clock.textContent = left + ' s';
      clearInterval(timer); timer = setInterval(function () { left--; clock.textContent = Math.max(0, left) + ' s'; if (left <= 0) finish2(); }, 1000);
      deal();
    }
    function finish2() {
      clearInterval(timer); locked = true; cur = null; grid.innerHTML = ''; fb.textContent = ''; clock.textContent = '0 s';
      endw.innerHTML = '<div class="ec-end">&#9201;&#65039; Time! You found <b>' + done + '</b> word' + (done === 1 ? '' : 's') + ' in ' + SECS + ' seconds. Can you beat it?</div>';
      btns.innerHTML = '';
      var again = document.createElement('button'); again.type = 'button'; again.className = 'ec-btn'; again.textContent = 'Try again';
      again.addEventListener('click', start2); btns.appendChild(again);
      report(true);
    }
    function report(timed) {
      try { window.dispatchEvent(new CustomEvent('mw-game', { detail: { name: (C.title || 'Écoute et choisis') + ' (listening game)', done: true, timed: timed, firstTry: first, found: done, words: W.length } })); } catch (e) {}
    }
    // start on a click (browsers block sound until the student interacts)
    mode.innerHTML = 'Ready?'; stat.textContent = W.length + ' words';
    var b0 = document.createElement('button'); b0.type = 'button'; b0.className = 'ec-btn ec-start'; b0.innerHTML = '&#9654; Click here to start <span lang="fr" style="font-weight:400;opacity:.9">&middot; Commencer</span>';
    b0.addEventListener('click', start1); btns.appendChild(b0);
  }
  [].forEach.call(document.querySelectorAll('[data-ecoute]'), setup);
})();
