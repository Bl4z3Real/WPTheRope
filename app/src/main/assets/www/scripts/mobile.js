/* Adatta il gioco a qualsiasi schermo, a tutto schermo e senza bande.
   - In livello: canvas verticale (384 x altezza in proporzione allo schermo).
   - Menu, caricamento, selezione livelli, risultati: lo stage 1024x576 viene scalato sulla larghezza
     del contenuto e lo sfondo dell'immagine copre tutto lo schermo. */
(function () {
  var STAGE_W = 1024, STAGE_H = 576;
  var PORT_X = 320, PORT_W = 384;                 // zona verticale (canvas di gioco) dentro lo stage
  var PORT_H = window.__CTR_AB || 576;            // altezza del canvas verticale
  var CONT_X = 212, CONT_W = 600;                 // zona centrale dei menu in verticale
  var mode = 'stage';                             // 'game' | 'stage'
  var backdrop, bctx, bw = 0, bh = 0;
  var imgCache = {};

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
    if (visible('boxNavForward')) return 'box';
    if (visible('menuBtnVbox')) return 'menu';
    return 'stage';
  }

  // zona centrale (x, larghezza) dello stage 1024 usata per ogni schermata in verticale
  var REGIONS = {
    menu:    { x: 322, w: 380 },
    box:     { x: 252, w: 520 },
    results: { x: 232, w: 560 },
    stage:   { x: 212, w: 600 }
  };

  function fit() {
    var el = document.getElementById('gameContainer');
    if (!el) return;
    var vw = window.innerWidth, vh = window.innerHeight;
    var tall = vw / vh < 0.9;
    var s, x, y;
    if (mode === 'game') {
      s = Math.min(vw / PORT_W, vh / PORT_H);
      x = (vw - PORT_W * s) / 2 - PORT_X * s;
      y = (vh - PORT_H * s) / 2;
    } else if (tall) {
      var rg = REGIONS[mode] || REGIONS.stage;
      s = vw / rg.w;
      x = -rg.x * s;
      y = (vh - STAGE_H * s) / 2;
      document.body.style.setProperty('--rx', rg.x + 'px');
      document.body.style.setProperty('--rr', (STAGE_W - rg.x - rg.w) + 'px');
    } else {
      s = Math.min(vw / STAGE_W, vh / STAGE_H);
      x = (vw - STAGE_W * s) / 2;
      y = (vh - STAGE_H * s) / 2;
    }
    el.style.transformOrigin = '0 0';
    el.style.transform = 'translate(' + Math.round(x) + 'px,' + Math.round(y) + 'px) scale(' + s + ')';
    document.body.classList.toggle('pm', mode === 'game');
    document.body.classList.toggle('sm', mode !== 'game' && tall);
    document.body.classList.toggle('hidec', mode !== 'game' && !visible('startBackground'));
    sizeBackdrop();
  }

  /* ---------- sfondo a tutto schermo (menu, caricamento...) ---------- */
  function ensureBackdrop() {
    if (backdrop) return;
    backdrop = document.createElement('canvas');
    backdrop.id = 'backdrop';
    backdrop.style.cssText =
      'position:fixed;left:0;top:0;width:100%;height:100%;z-index:0;pointer-events:none;';
    document.body.insertBefore(backdrop, document.body.firstChild);
    bctx = backdrop.getContext('2d');
    var lang = document.getElementById('lang');
    if (lang) { lang.style.position = 'relative'; lang.style.zIndex = '1'; }
  }

  function sizeBackdrop() {
    ensureBackdrop();
    var vw = window.innerWidth, vh = window.innerHeight;
    if (bw !== vw || bh !== vh) {
      bw = vw; bh = vh;
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
    var ids = ['loaderWindow', 'startBackground', 'menuBackground'];
    for (var i = 0; i < ids.length; i++) {
      var e = document.getElementById(ids[i]);
      if (e) {
        var im = bgImage(e);
        if (im) return im;
      }
    }
    // schermate con sfondo disegnato su canvas (selezione livelli, risultati)
    if (visible('levelBackground')) {
      var lc = document.getElementById('levelCanvas');
      if (lc.width > 10) return lc;
    }
    return null;
  }

  var lastSrc = null, lastW = 0, lastH = 0, lastMode = '';
  function drawBackdrop() {
    if (!bctx || document.hidden) return;
    if (mode === 'game') {            // in livello il canvas riempie gia' tutto
      if (lastMode !== 'game') { bctx.clearRect(0, 0, bw, bh); lastMode = 'game'; lastSrc = null; }
      return;
    }
    lastMode = mode;
    var im = pickSource();
    var isCanvas = im && im.tagName === 'CANVAS';
    if (!isCanvas && im === lastSrc && bw === lastW && bh === lastH) return;   // niente da ridisegnare
    lastSrc = im; lastW = bw; lastH = bh;
    bctx.fillStyle = '#17110a';
    bctx.fillRect(0, 0, bw, bh);
    if (!im) return;
    var sw0 = isCanvas ? im.width : im.naturalWidth, sh0 = isCanvas ? im.height : im.naturalHeight;
    var k = Math.max(bw / sw0, bh / sh0);
    var dw = sw0 * k, dh = sh0 * k;
    bctx.imageSmoothingQuality = 'high';
    bctx.drawImage(im, (bw - dw) / 2, (bh - dh) / 2, dw, dh);
  }

  function loop() {
    var m = currentMode();
    if (m !== mode) { mode = m; fit(); }
    var hc = mode !== 'game' && !visible('startBackground');
    if (hc !== document.body.classList.contains('hidec')) document.body.classList.toggle('hidec', hc);
    drawBackdrop();
    setTimeout(function () { window.requestAnimationFrame(loop); }, 90);
  }

  function start() {
    fit();
    if (!loop.started) { loop.started = true; loop(); }
  }

  window.addEventListener('resize', function () { lastSrc = null; fit(); });
  window.addEventListener('orientationchange', function () { setTimeout(function () { lastSrc = null; fit(); }, 150); });
  document.addEventListener('DOMContentLoaded', start);
  window.addEventListener('load', start);
  if (document.body) start();

  document.addEventListener('touchmove', function (e) { e.preventDefault(); }, { passive: false });
  document.addEventListener('contextmenu', function (e) { e.preventDefault(); });
  document.addEventListener('gesturestart', function (e) { e.preventDefault(); });
})();
