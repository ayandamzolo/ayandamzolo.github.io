/* The mascot.
   Behaviours: it watches the cursor and follows it with its eyes; it perks up when
   you come near; it scoots aside if you get too close or if text drifts underneath
   it; it blinks when nothing is happening; and it squishes if you click beside it.
   Purely decorative: aria-hidden, never focusable, and pointer-events none, so it
   can never swallow a click meant for the page. */
(function () {
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  var EYES = [{ x: -24, y: -12 }, { x: 24, y: -12 }];

  var el = document.createElement('div');
  el.className = 'pet-float';
  el.setAttribute('aria-hidden', 'true');
  el.innerHTML =
    '<svg class="pet-body" viewBox="-105 -85 210 150" width="110" height="79">' +
      '<g fill="#9FE1CB" stroke="#0F6E56" stroke-width="5" stroke-linejoin="round">' +
        '<path class="pet-arm-l" d="M -62 6 C -88 14 -98 46 -80 60 C -70 51 -76 28 -50 22 Z"/>' +
        '<path class="pet-arm-r" d="M 62 6 C 88 14 98 46 80 60 C 70 51 76 28 50 22 Z"/>' +
        '<path d="M -40 30 C -48 52 -30 64 -16 50 C -24 44 -32 38 -36 30 Z"/>' +
        '<path d="M -6 38 C -12 62 8 70 20 56 C 12 50 4 44 0 38 Z"/>' +
        '<path d="M 34 30 C 28 54 46 62 56 48 C 48 42 40 36 38 30 Z"/>' +
        '<path d="M -70 30 C -70 -46 -38 -78 0 -78 C 38 -78 70 -46 70 30 C 70 42 40 48 0 48 C -40 48 -70 42 -70 30 Z"/>' +
      '</g>' +
      '<circle class="pet-eye" cx="-24" cy="-12" r="8" fill="#0F6E56"/>' +
      '<circle class="pet-eye" cx="24" cy="-12" r="8" fill="#0F6E56"/>' +
      '<path class="pet-mouth" d="M -8 10 C -4 16 4 16 8 10" fill="none" stroke="#0F6E56" stroke-width="4" stroke-linecap="round"/>' +
    '</svg>';
  document.body.appendChild(el);

  if (reduce) return;

  var svg = el.querySelector('.pet-body');
  var eyes = el.querySelectorAll('.pet-eye');
  var mouth = el.querySelector('.pet-mouth');
  var armR = el.querySelector('.pet-arm-r');

  var ARM_REST = armR.getAttribute('d');
  var ARM_WAVE = 'M 62 6 C 88 -6 96 -34 80 -46 C 70 -36 76 -16 50 22 Z';
  var MOUTH_REST = 'M -8 10 C -4 16 4 16 8 10';
  var MOUTH_OH   = 'M -6 12 C -6 19 6 19 6 12 C 6 6 -6 6 -6 12 Z';

  var pointer = null, lastMove = 0;
  var dodgeX = 0, dodgeY = 0, curX = 0, curY = 0;
  var blinking = false, gazeX = 0, gazeY = 0;

  function home() {
    var r = el.getBoundingClientRect();
    return { x: r.left + r.width / 2 - curX, y: r.top + r.height / 2 - curY, w: r.width, h: r.height };
  }

  /* Nearest visible text that is sitting under the pet, if any. */
  function textUnder(c, w, h) {
    var pad = 14, best = null, bestD = Infinity;
    var box = { l: c.x - w / 2 - pad, r: c.x + w / 2 + pad, t: c.y - h / 2 - pad, b: c.y + h / 2 + pad };
    var nodes = document.querySelectorAll('h1, h2, h3, p, li, dt, dd, figcaption');
    for (var i = 0; i < nodes.length; i++) {
      if (!nodes[i].textContent.trim()) continue;
      var r = nodes[i].getBoundingClientRect();
      if (r.bottom < box.t || r.top > box.b || r.right < box.l || r.left > box.r) continue;
      var tx = Math.max(r.left, Math.min(c.x, r.right));
      var ty = Math.max(r.top, Math.min(c.y, r.bottom));
      var d = (tx - c.x) * (tx - c.x) + (ty - c.y) * (ty - c.y);
      if (d < bestD) { bestD = d; best = { x: tx, y: ty }; }
    }
    return best;
  }

  function setEyes() {
    for (var i = 0; i < eyes.length; i++) {
      var t = 'translate(' + (gazeX * 4).toFixed(2) + ',' + (gazeY * 4).toFixed(2) + ')';
      if (blinking) {
        t += ' translate(' + EYES[i].x + ',' + EYES[i].y + ') scale(1,0.12) translate(' + (-EYES[i].x) + ',' + (-EYES[i].y) + ')';
      }
      eyes[i].setAttribute('transform', t);
    }
  }

  function frame() {
    var c = home(), r = el.getBoundingClientRect();
    var target = null, flee = null, near = false;

    // Text underneath makes it move, but never decides where it is looking.
    var txt = textUnder(c, r.width, r.height);
    if (txt) flee = txt;

    if (pointer) {
      var dx = pointer.x - c.x, dy = pointer.y - c.y;
      var dist = Math.sqrt(dx * dx + dy * dy);
      target = pointer;                              // the cursor always owns its attention
      near = dist < 190;
      if (dist < 120) flee = pointer;                // too close, move along
    } else if (txt) {
      target = txt;                                  // no cursor, so read what is underneath
    }

    if (target) {
      var vx = target.x - c.x, vy = target.y - c.y, L = Math.sqrt(vx * vx + vy * vy) || 1;
      gazeX = vx / L; gazeY = vy / L;
    } else { gazeX = 0; gazeY = 0; }
    setEyes();

    el.classList.toggle('is-near', near);
    armR.setAttribute('d', near ? ARM_WAVE : ARM_REST);
    mouth.setAttribute('d', near ? MOUTH_OH : MOUTH_REST);

    if (flee) {
      var ax = c.x - flee.x, ay = c.y - flee.y, AL = Math.sqrt(ax * ax + ay * ay) || 1;
      dodgeX = (ax / AL) * 52; dodgeY = (ay / AL) * 34;
      if (c.x + dodgeX < 70) dodgeX = 70 - c.x;
      if (c.x + dodgeX > innerWidth - 70) dodgeX = innerWidth - 70 - c.x;
      if (c.y + dodgeY < 70) dodgeY = 70 - c.y;
      if (c.y + dodgeY > innerHeight - 70) dodgeY = innerHeight - 70 - c.y;
    } else { dodgeX = 0; dodgeY = 0; }

    curX += (dodgeX - curX) * 0.15;
    curY += (dodgeY - curY) * 0.15;
    el.style.transform = 'translate(' + curX.toFixed(1) + 'px,' + curY.toFixed(1) + 'px)';

    requestAnimationFrame(frame);
  }

  addEventListener('pointermove', function (e) { pointer = { x: e.clientX, y: e.clientY }; lastMove = Date.now(); }, { passive: true });
  addEventListener('pointerleave', function () { pointer = null; });
  addEventListener('blur', function () { pointer = null; });

  /* A click anywhere near it gets a squish back. */
  addEventListener('pointerdown', function (e) {
    var c = home();
    var d = Math.hypot(e.clientX - c.x, e.clientY - c.y);
    if (d > 200) return;
    svg.classList.remove('squish');
    void svg.offsetWidth;
    svg.classList.add('squish');
  }, { passive: true });

  /* Blink when nothing has happened for a moment. */
  setInterval(function () {
    if (blinking || Date.now() - lastMove < 900) return;
    if (Math.random() > 0.45) return;
    blinking = true; setEyes();
    setTimeout(function () { blinking = false; setEyes(); }, 130);
  }, 1200);

  requestAnimationFrame(frame);
})();
