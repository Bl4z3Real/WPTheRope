/* Adatta il gioco a qualsiasi schermo.
   - Menu/selezione livelli: stage 1024x576 (orizzontale) scalato per stare nello schermo.
   - Durante il gioco: modalita' verticale 9:16 (canvas 384x576, centro dello stage).
   Le barre libere vengono riempite con uno sfondo esteso (continuazione sfocata dei bordi). */
(function () {
  var STAGE_W = 1024, STAGE_H = 576;
  var PORT_X = 320, PORT_W = 384;      // zona verticale dentro lo stage
  var BD_W = 96;                       // risoluzione (bassa) del canvas di sfondo
  var backdrop, bctx, bw = 0, bh = 0;
  var imgCache = {};
  var RES_X = 212, RES_W = 600;        // schermata risultati (centro dello stage)
  var mode = 'stage';                  // 'game' | 'results' | 'stage'
  var portrait = false;

  function visible(id) {
    var e = document.getElementById(id);
    if (!e) return false;
    var cs = window.getComputedStyle(e);
    if (cs.display === 'none' || cs.visibility === 'hidden') return false;
    var r = e.getBoundingClientRect();
    return r.width > 0 && r.height > 0;
  }

  function currentMode() {
    if (visible('gameBtnTray')) return 'game';
    if (visible('levelResults')) return 'results';
    return 'stage';
  }

  function fit() {
    var el = document.getElementById('gameContainer');
    if (!el) return;
    var vw = window.innerWidth, vh = window.innerHeight;
    var s, x, y;
    if (mode === 'game') {
      s = Math.min(vw / PORT_W, vh / STAGE_H);
      x = (vw - PORT_W * s) / 2 - PORT_X * s;
    } else if (mode === 'results') {
      s = Math.min(vw / RES_W, vh / STAGE_H);
      x = (vw - RES_W * s) / 2 - RES_X * s;
    } else {
      s = Math.min(vw / STAGE_W, vh / STAGE_H);
      x = (vw - STAGE_W * s) / 2;
    }
    y = (vh - STAGE_H * s) / 2;
    el.style.transformOrigin = '0 0';
    el.style.transform = 'translate(' + Math.round(x) + 'px,' + Math.round(y) + 'px) scale(' + s + ')';
    portrait = (mode === 'game');
    document.body.classList.toggle('pm', portrait);
    sizeBackdrop();
  }

  /* ---------- sfondo esteso ---------- */
  function ensureBackdrop() {
    if (backdrop) return;
    backdrop = document.createElement('canvas');
    backdrop.id = 'backdrop';
    backdrop.style.cssText =
      'position:fixed;left:-6%;top:-6%;width:112%;height:112%;z-index:0;pointer-events:none;' +
      'filter:blur(12px) brightness(.92);';
    document.body.insertBefore(backdrop, document.body.firstChild);
    bctx = backdrop.getContext('2d');
    var lang = document.getElementById('lang');
    if (lang) { lang.style.position = 'relative'; lang.style.zIndex = '1'; }
  }

  function sizeBackdrop() {
    ensureBackdrop();
    var vw = window.innerWidth, vh = window.innerHeight;
    var h = Math.max(8, Math.round(BD_W * vh / vw));
    if (bw !== BD_W || bh !== h) {
      bw = BD_W; bh = h;
      backdrop.width = bw; backdrop.height = bh;
    }
  }

  function bgImage(el) {
    var cs = window.getComputedStyle(el);
    if (cs.display === 'none' || cs.visibility === 'hidden') return null;
    var m = /url\(["']?([^"')]+)["']?\)/.exec(cs.backgroundImage || '');
    if (!m) return null;
    var url = m[1];
    var im = imgCache[url];
    if (!im) { im = new Image(); im.src = url; imgCache[url] = im; }
    return im.complete && im.naturalWidth ? im : null;
  }

  function pickSource() {
    if (!portrait) {
      var ids = ['startBackground', 'menuBackground', 'levelBackground'];
      for (var i = 0; i < ids.length; i++) {
        var e = document.getElementById(ids[i]);
        if (e) {
          var im = bgImage(e);
          if (im) return { src: im, w: im.naturalWidth, h: im.naturalHeight };
        }
      }
    }
    var c = document.getElementById('c');
    if (c && c.width) return { src: c, w: c.width, h: c.height };
    return null;
  }

  function drawBackdrop() {
    if (!bctx || document.hidden) return;
    var vw = window.innerWidth;
    var ref = document.getElementById(portrait ? 'c' : 'gameArea');
    var r = ref ? ref.getBoundingClientRect() : null;
    if (!r || !r.width) return;
    var k = bw / vw;
    var x0 = r.left * k, y0 = r.top * k, x1 = r.right * k, y1 = r.bottom * k;
    var s = pickSource();
    bctx.fillStyle = '#17110a';
    bctx.fillRect(0, 0, bw, bh);
    if (!s) return;
    var sw = s.w, sh = s.h, t = 3;
    try {
      bctx.drawImage(s.src, 0, 0, sw, sh, x0, y0, x1 - x0, y1 - y0);
      if (y0 > 0.5) bctx.drawImage(s.src, 0, 0, sw, t, 0, 0, bw, y0);
      if (y1 < bh - 0.5) bctx.drawImage(s.src, 0, sh - t, sw, t, 0, y1, bw, bh - y1);
      if (x0 > 0.5) bctx.drawImage(s.src, 0, 0, t, sh, 0, y0, x0, y1 - y0);
      if (x1 < bw - 0.5) bctx.drawImage(s.src, sw - t, 0, t, sh, x1, y0, bw - x1, y1 - y0);
    } catch (e) { /* sorgente non ancora pronta */ }
  }

  function loop() {
    var m = currentMode();
    if (m !== mode) { mode = m; fit(); }
    drawBackdrop();
    setTimeout(function () { window.requestAnimationFrame(loop); }, 90);
  }

  function start() {
    fit();
    if (!loop.started) { loop.started = true; loop(); }
  }

  window.addEventListener('resize', fit);
  window.addEventListener('orientationchange', function () { setTimeout(fit, 150); });
  document.addEventListener('DOMContentLoaded', start);
  window.addEventListener('load', start);
  if (document.body) start();

  document.addEventListener('touchmove', function (e) { e.preventDefault(); }, { passive: false });
  document.addEventListener('contextmenu', function (e) { e.preventDefault(); });
  document.addEventListener('gesturestart', function (e) { e.preventDefault(); });
})();
