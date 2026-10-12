/* Adatta il gioco (stage logico 1024x576) a qualsiasi schermo, anche 9:16 in verticale. */
(function () {
  var STAGE_W = 1024, STAGE_H = 576;

  function fit() {
    var el = document.getElementById('gameContainer');
    if (!el) return;
    var vw = window.innerWidth, vh = window.innerHeight;
    var s = Math.min(vw / STAGE_W, vh / STAGE_H);
    var x = Math.round((vw - STAGE_W * s) / 2);
    var y = Math.round((vh - STAGE_H * s) / 2);
    el.style.transformOrigin = '0 0';
    el.style.transform = 'translate(' + x + 'px,' + y + 'px) scale(' + s + ')';
  }

  window.addEventListener('resize', fit);
  window.addEventListener('orientationchange', function () { setTimeout(fit, 150); });
  document.addEventListener('DOMContentLoaded', fit);
  window.addEventListener('load', fit);
  fit();

  /* niente scroll/zoom/menu contestuale col dito */
  document.addEventListener('touchmove', function (e) { e.preventDefault(); }, { passive: false });
  document.addEventListener('contextmenu', function (e) { e.preventDefault(); });
  document.addEventListener('gesturestart', function (e) { e.preventDefault(); });
})();
