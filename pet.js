/* The mascot. It sits in a corner, watches for text drifting underneath it,
   looks at whatever it finds, and gets out of the way. Purely decorative:
   aria-hidden, never focusable, never intercepts a click. */
(function () {
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var el = document.createElement('div');
  el.className = 'pet-float';
  el.setAttribute('aria-hidden', 'true');
  el.innerHTML =
    '<svg viewBox="-105 -85 210 150" width="110" height="79">' +
      '<g fill="#9FE1CB" stroke="#0F6E56" stroke-width="5" stroke-linejoin="round">' +
        '<path d="M -62 6 C -88 14 -98 46 -80 60 C -70 51 -76 28 -50 22 Z"/>' +
        '<path d="M 62 6 C 88 14 98 46 80 60 C 70 51 76 28 50 22 Z"/>' +
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

  if (reduce) return;               // static mascot, no watching, no dodging

  var eyes = el.querySelectorAll('.pet-eye');
  var mouth = el.querySelector('.pet-mouth');
  var dodgeX = 0, dodgeY = 0, curX = 0, curY = 0;
  var pad = 14;                      // how close text has to get before it counts
  var queued = false;

  function textRects() {
    var out = [];
    var nodes = document.querySelectorAll('h1, h2, h3, p, li, dt, dd, figcaption');
    for (var i = 0; i < nodes.length; i++) {
      var n = nodes[i];
      if (!n.textContent.trim()) continue;
      var r = n.getBoundingClientRect();
      if (r.bottom < -40 || r.top > window.innerHeight + 40) continue;  // offscreen
      out.push(r);
    }
    return out;
  }

  function look() {
    queued = false;
    var home = el.getBoundingClientRect();
    // Work from where the pet wants to rest, not where it has already dodged to,
    // otherwise it chases its own displacement and oscillates.
    var cx = home.left + home.width / 2 - curX;
    var cy = home.top + home.height / 2 - curY;
    var box = { l: cx - home.width / 2 - pad, r: cx + home.width / 2 + pad,
                t: cy - home.height / 2 - pad, b: cy + home.height / 2 + pad };

    var rects = textRects(), nearest = null, best = Infinity;
    for (var i = 0; i < rects.length; i++) {
      var r = rects[i];
      if (r.right < box.l || r.left > box.r || r.bottom < box.t || r.top > box.b) continue;
      var tx = Math.max(r.left, Math.min(cx, r.right));
      var ty = Math.max(r.top, Math.min(cy, r.bottom));
      var d = (tx - cx) * (tx - cx) + (ty - cy) * (ty - cy);
      if (d < best) { best = d; nearest = { x: tx, y: ty }; }
    }

    if (nearest) {
      var vx = cx - nearest.x, vy = cy - nearest.y;
      var len = Math.sqrt(vx * vx + vy * vy) || 1;
      // Look at the words, then step away from them along the same line.
      setEyes(-vx / len, -vy / len);
      mouth.setAttribute('d', 'M -8 14 C -4 8 4 8 8 14');   // small worried mouth
      dodgeX = (vx / len) * 46;
      dodgeY = (vy / len) * 30;
      // Never push itself off the screen.
      if (cx + dodgeX < 70) dodgeX = 70 - cx;
      if (cx + dodgeX > window.innerWidth - 70) dodgeX = window.innerWidth - 70 - cx;
      if (cy + dodgeY < 70) dodgeY = 70 - cy;
      if (cy + dodgeY > window.innerHeight - 70) dodgeY = window.innerHeight - 70 - cy;
    } else {
      setEyes(0, 0);
      mouth.setAttribute('d', 'M -8 10 C -4 16 4 16 8 10');
      dodgeX = 0; dodgeY = 0;
    }

    curX += (dodgeX - curX) * 0.16;
    curY += (dodgeY - curY) * 0.16;
    el.style.transform = 'translate(' + curX.toFixed(1) + 'px,' + curY.toFixed(1) + 'px)';

    if (Math.abs(dodgeX - curX) > 0.4 || Math.abs(dodgeY - curY) > 0.4) schedule();
  }

  function setEyes(nx, ny) {
    for (var i = 0; i < eyes.length; i++) {
      eyes[i].setAttribute('transform', 'translate(' + (nx * 4).toFixed(2) + ',' + (ny * 4).toFixed(2) + ')');
    }
  }

  function schedule() { if (!queued) { queued = true; requestAnimationFrame(look); } }

  addEventListener('scroll', schedule, { passive: true });
  addEventListener('resize', schedule);
  setInterval(schedule, 400);
  schedule();
})();
