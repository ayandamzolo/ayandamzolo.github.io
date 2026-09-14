/* Desk pet: an octopus that lives on the page.
   One rAF loop, one state object, no animation library. CSS keyframes are used
   only for the small decorative loops (anger puff, sleep z's, prop spin). */
(function () {
  'use strict';

  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  var PALETTES = {
    teal:  ['#9FE1CB', '#0F6E56', '#E1F5EE'],
    green: ['#C0DD97', '#3B6D11', '#EAF3DE'],
    pink:  ['#F4C0D1', '#993556', '#FBEAF0'],
    blue:  ['#B5D4F4', '#185FA5', '#E6F1FB']
  };

  var CFG = {
    patience: 4, tapWindow: 2600, sulk: 4400,
    sleepAfter: 14000, gravity: 0.85, bounce: 0.34,
    gazeCap: 5, tiltCap: 7, fleeMin: 1.4, fleeMax: 5.6,
    wanderMin: 11000, wanderMax: 25000, squashDecay: 0.88
  };

  /* ---------------------------------------------------------------- markup */
  var host = document.createElement('div');
  host.className = 'pet-host';
  host.tabIndex = 0;
  host.setAttribute('role', 'button');
  host.setAttribute('aria-label', 'Desk pet. Press Enter to poke it, or drag it around.');
  host.innerHTML =
  '<svg class="pet-svg" viewBox="0 0 240 320" width="120" height="160" aria-hidden="true" focusable="false">' +
    '<g class="pet-lean">' +
      '<g class="pet-squish">' +

        '<g id="pet-props" class="pet-props">' +
          '<g class="prop prop-mug"><rect x="176" y="178" width="42" height="38" rx="8" fill="var(--tint)" stroke="var(--ol)" stroke-width="5"/>' +
            '<path d="M218 188 C232 188 232 206 218 206" fill="none" stroke="var(--ol)" stroke-width="5"/>' +
            '<path class="steam" d="M188 170 C194 162 182 156 188 146" fill="none" stroke="var(--ol)" stroke-width="4" stroke-linecap="round"/>' +
            '<path class="steam s2" d="M204 170 C210 162 198 156 204 146" fill="none" stroke="var(--ol)" stroke-width="4" stroke-linecap="round"/></g>' +
          '<g class="prop prop-book"><path d="M62 186 L118 174 L118 216 L62 228 Z" fill="var(--tint)" stroke="var(--ol)" stroke-width="5" stroke-linejoin="round"/>' +
            '<path d="M122 174 L178 186 L178 228 L122 216 Z" fill="var(--tint)" stroke="var(--ol)" stroke-width="5" stroke-linejoin="round"/>' +
            '<path d="M120 174 L120 216" stroke="var(--ol)" stroke-width="5"/>' +
            '<path d="M134 186 L152 192 M134 200 L152 206" stroke="var(--ol)" stroke-width="4" stroke-linecap="round"/></g>' +
          '<g class="prop prop-brush"><g class="spin">' +
            '<g transform="translate(76,58) rotate(-18)"><rect x="-7" y="0" width="14" height="30" rx="5" fill="var(--tint)" stroke="var(--ol)" stroke-width="4"/><path d="M-7 0 L7 0 L0 -12 Z" fill="var(--ol)"/></g>' +
            '<g transform="translate(120,44)"><rect x="-7" y="0" width="14" height="30" rx="5" fill="var(--tint)" stroke="var(--ol)" stroke-width="4"/><path d="M-7 0 L7 0 L0 -12 Z" fill="var(--ol)"/></g>' +
            '<g transform="translate(164,58) rotate(18)"><rect x="-7" y="0" width="14" height="30" rx="5" fill="var(--tint)" stroke="var(--ol)" stroke-width="4"/><path d="M-7 0 L7 0 L0 -12 Z" fill="var(--ol)"/></g>' +
          '</g></g>' +
          '<g class="prop prop-phones"><path d="M48 130 C48 74 82 48 120 48 C158 48 192 74 192 130" fill="none" stroke="var(--ol)" stroke-width="7" stroke-linecap="round"/>' +
            '<rect x="32" y="122" width="26" height="42" rx="11" fill="var(--tint)" stroke="var(--ol)" stroke-width="5"/>' +
            '<rect x="182" y="122" width="26" height="42" rx="11" fill="var(--tint)" stroke="var(--ol)" stroke-width="5"/>' +
            '<path d="M45 164 C58 178 68 184 80 182" fill="none" stroke="var(--ol)" stroke-width="4"/>' +
            '<circle cx="84" cy="182" r="6" fill="var(--tint)" stroke="var(--ol)" stroke-width="4"/></g>' +
        '</g>' +

        '<g class="pet-tent" fill="var(--fl)" stroke="var(--ol)" stroke-width="6" stroke-linejoin="round">' +
          '<path class="t t1" d="M64 196 C40 206 34 244 54 256 C62 246 56 222 78 214 Z"/>' +
          '<path class="t t2" d="M176 196 C200 206 206 244 186 256 C178 246 184 222 162 214 Z"/>' +
          '<path class="t t3" d="M86 216 C78 242 98 256 112 240 C104 234 94 226 90 216 Z"/>' +
          '<path class="t t4" d="M116 224 C110 252 132 262 144 246 C136 240 126 232 122 224 Z"/>' +
          '<path class="t t5" d="M152 216 C146 244 166 254 176 238 C168 232 158 224 156 216 Z"/>' +
        '</g>' +

        '<path class="pet-head" d="M52 214 C52 118 84 78 120 78 C156 78 188 118 188 214 C188 230 156 238 120 238 C84 238 52 230 52 214 Z" fill="var(--fl)" stroke="var(--ol)" stroke-width="6" stroke-linejoin="round"/>' +

        '<g class="pet-blush"><ellipse cx="74" cy="178" rx="13" ry="8" fill="var(--ol)" opacity=".22"/><ellipse cx="166" cy="178" rx="13" ry="8" fill="var(--ol)" opacity=".22"/></g>' +

        '<g class="pet-brows"><path class="bl" d="M76 132 L106 144" stroke="var(--ol)" stroke-width="6" stroke-linecap="round"/><path class="br" d="M164 132 L134 144" stroke="var(--ol)" stroke-width="6" stroke-linecap="round"/></g>' +

        '<g class="pet-eyes">' +
          '<g class="eye el"><circle cx="94" cy="158" r="8" fill="var(--ol)"/></g>' +
          '<g class="eye er"><circle cx="146" cy="158" r="8" fill="var(--ol)"/></g>' +
          '<path class="lid ll" d="M84 158 C90 150 98 150 104 158" fill="none" stroke="var(--ol)" stroke-width="5" stroke-linecap="round"/>' +
          '<path class="lid lr" d="M136 158 C142 150 150 150 156 158" fill="none" stroke="var(--ol)" stroke-width="5" stroke-linecap="round"/>' +
        '</g>' +

        '<path class="pet-mouth" d="M110 184 C115 192 125 192 130 184" fill="none" stroke="var(--ol)" stroke-width="5" stroke-linecap="round"/>' +

        '<g class="pet-anger"><path d="M186 86 L200 96 M200 86 L186 96 M193 80 L193 102" stroke="#c0392b" stroke-width="6" stroke-linecap="round"/></g>' +
        '<g class="pet-zzz"><text x="186" y="86" font-size="26" font-weight="700" fill="var(--ol)" font-family="system-ui,sans-serif">z</text>' +
          '<text class="z2" x="206" y="62" font-size="18" font-weight="700" fill="var(--ol)" font-family="system-ui,sans-serif">z</text></g>' +
      '</g>' +
    '</g>' +
  '</svg>' +
  '<span class="pet-bubble" aria-hidden="true"></span>';
  document.body.appendChild(host);

  var svg    = host.querySelector('.pet-svg');
  var lean   = host.querySelector('.pet-lean');
  var sq     = host.querySelector('.pet-squish');
  var eyeL   = host.querySelector('.eye.el');
  var eyeR   = host.querySelector('.eye.er');
  var dotL   = eyeL.firstChild, dotR = eyeR.firstChild;
  var mouth  = host.querySelector('.pet-mouth');
  var bubble = host.querySelector('.pet-bubble');
  var tent   = host.querySelector('.pet-tent');

  var MOUTH = {
    smile: 'M110 184 C115 192 125 192 130 184',
    oval:  'M108 182 C108 196 132 196 132 182 C132 172 108 172 108 182 Z',
    frown: 'M110 190 C115 182 125 182 130 190',
    flat:  'M110 186 L130 186'
  };

  /* ---------------------------------------------------------------- state */
  var W = 120, H = 160;
  var S = {
    x: innerWidth - W - 28, y: innerHeight - H - 28,
    vx: 0, vy: 0, squash: 0, tilt: 0, gx: 0, gy: 0,
    held: false, falling: false, asleep: false,
    angryUntil: 0, taps: [], blinkAt: 0, blinking: false,
    lastAct: Date.now(), wanderAt: 0, walkTo: null, phase: 0
  };

  try {
    var saved = JSON.parse(localStorage.getItem('petPos') || 'null');
    if (saved && isFinite(saved.x) && isFinite(saved.y)) { S.x = saved.x; S.y = saved.y; }
  } catch (e) { /* private mode or blocked storage, carry on */ }

  function save() {
    try { localStorage.setItem('petPos', JSON.stringify({ x: S.x, y: S.y })); } catch (e) {}
  }

  function clamp() {
    S.x = Math.max(4, Math.min(S.x, innerWidth - W - 4));
    S.y = Math.max(4, Math.min(S.y, innerHeight - H - 4));
  }
  var floor = function () { return innerHeight - H - 12; };

  function say(text, ms) {
    bubble.textContent = text;
    bubble.classList.add('on');
    clearTimeout(say._t);
    say._t = setTimeout(function () { bubble.classList.remove('on'); }, ms || 1100);
  }

  var pointer = null;
  function angry() { return Date.now() < S.angryUntil; }

  /* ---------------------------------------------------------------- loop */
  function tick() {
    var now = Date.now();
    var cx = S.x + W / 2, cy = S.y + H / 2;

    if (!S.held && !reduce) S.phase += 0.035;
    var breathe = reduce ? 0 : Math.sin(S.phase) * 0.018;

    /* sleep */
    if (!S.asleep && !S.held && !angry() && now - S.lastAct > CFG.sleepAfter) S.asleep = true;

    /* gaze and tilt */
    var wantGX = 0, wantGY = 0, wantTilt = 0;
    if (pointer && !S.held && !S.asleep) {
      var dx = pointer.x - cx, dy = pointer.y - cy;
      var d = Math.hypot(dx, dy) || 1;
      if (angry()) { wantGX = -dx / d; wantGY = -dy / d; }   // averts its eyes
      else { wantGX = dx / d; wantGY = dy / d; wantTilt = Math.max(-1, Math.min(1, dx / 260)); }
    }
    S.gx += (wantGX - S.gx) * 0.14;
    S.gy += (wantGY - S.gy) * 0.14;
    S.tilt += (wantTilt * CFG.tiltCap - S.tilt) * 0.12;

    /* flee while angry */
    if (angry() && pointer && !S.held) {
      var fdx = cx - pointer.x, fdy = cy - pointer.y, fd = Math.hypot(fdx, fdy) || 1;
      if (fd < 420) {
        var urgency = 1 - Math.min(1, fd / 420);
        var sp = CFG.fleeMin + (CFG.fleeMax - CFG.fleeMin) * urgency;
        S.x += (fdx / fd) * sp;
        S.y += (fdy / fd) * sp * 0.55;
        clamp();
      }
    }

    /* physics after a drop */
    if (!S.held && S.falling) {
      S.vy += CFG.gravity;
      S.y += S.vy; S.x += S.vx; S.vx *= 0.97;
      if (S.y >= floor()) {
        S.y = floor();
        if (Math.abs(S.vy) > 1.2) {
          S.squash = Math.min(0.42, Math.abs(S.vy) * 0.028);
          S.vy = -S.vy * CFG.bounce;
        } else { S.vy = 0; S.falling = false; S.vx = 0; save(); }
      }
      clamp();
    }

    /* wandering */
    if (!reduce && !S.held && !S.falling && !S.asleep && !angry()) {
      if (!S.wanderAt) S.wanderAt = now + CFG.wanderMin + Math.random() * (CFG.wanderMax - CFG.wanderMin);
      if (now > S.wanderAt && S.walkTo === null) {
        S.walkTo = Math.max(4, Math.min(innerWidth - W - 4, S.x + (Math.random() * 300 - 150)));
        S.wanderAt = 0;
      }
      if (S.walkTo !== null) {
        var step = S.walkTo - S.x;
        if (Math.abs(step) < 2) { S.walkTo = null; save(); }
        else { S.x += Math.sign(step) * 1.3; S.tilt += Math.sin(now / 90) * 1.6; clamp(); }
      }
    }

    /* blinking */
    if (!S.asleep && !S.held && now > S.blinkAt) {
      S.blinking = true;
      setTimeout(function () { S.blinking = false; }, 130);
      S.blinkAt = now + 3000 + Math.random() * 4000;
    }

    S.squash *= CFG.squashDecay;
    if (Math.abs(S.squash) < 0.002) S.squash = 0;

    /* ------------------------------------------------------------ render */
    host.style.transform = 'translate(' + S.x.toFixed(1) + 'px,' + S.y.toFixed(1) + 'px)';
    lean.setAttribute('transform', 'rotate(' + S.tilt.toFixed(2) + ' 120 200)');
    var sx = 1 + S.squash, sy = 1 - S.squash + breathe;
    sq.setAttribute('transform', 'translate(120 238) scale(' + sx.toFixed(3) + ' ' + sy.toFixed(3) + ') translate(-120 -238)');

    var gx = S.gx * CFG.gazeCap, gy = S.gy * CFG.gazeCap;
    var narrow = angry() ? 0.5 : 1;
    var shut = (S.blinking ? 0.12 : 1) * narrow;
    [[eyeL, dotL, 94], [eyeR, dotR, 146]].forEach(function (p) {
      p[0].setAttribute('transform',
        'translate(' + gx.toFixed(2) + ',' + gy.toFixed(2) + ') ' +
        'translate(' + p[2] + ',158) scale(1,' + shut.toFixed(3) + ') translate(' + (-p[2]) + ',-158)');
      p[1].setAttribute('r', S.held ? 11.5 : 8);
    });

    host.classList.toggle('is-asleep', S.asleep);
    host.classList.toggle('is-angry', angry());
    host.classList.toggle('is-held', S.held);
    mouth.setAttribute('d', S.held ? MOUTH.oval : S.asleep ? MOUTH.flat : angry() ? MOUTH.frown : MOUTH.smile);
    tent.style.transform = S.held ? 'translateY(10px)' : '';

    requestAnimationFrame(tick);
  }

  /* ---------------------------------------------------------------- input */
  function wake() {
    S.lastAct = Date.now();
    if (S.asleep) { S.asleep = false; S.squash = -0.16; say('*stretch*', 900); }
  }
  addEventListener('pointermove', function (e) { pointer = { x: e.clientX, y: e.clientY }; wake(); }, { passive: true });
  addEventListener('scroll', wake, { passive: true });
  addEventListener('resize', function () { clamp(); save(); });

  function poke() {
    wake();
    S.squash = 0.3;
    if (!S.falling) { S.vy = -7; S.falling = true; }
    var now = Date.now();
    S.taps = S.taps.filter(function (t) { return now - t < CFG.tapWindow; });
    S.taps.push(now);
    if (S.taps.length >= CFG.patience) {
      S.angryUntil = Math.max(S.angryUntil, now) + CFG.sulk;
      say('grr', 1200);
    } else {
      say('!', 700);
    }
  }

  var down = null;
  host.addEventListener('pointerdown', function (e) {
    wake();
    host.setPointerCapture(e.pointerId);
    down = { x: e.clientX, y: e.clientY, ox: e.clientX - S.x, oy: e.clientY - S.y, moved: 0 };
    S.held = true; S.falling = false; S.vx = S.vy = 0;
    say('oh!', 4000);
    e.preventDefault();
  });
  host.addEventListener('pointermove', function (e) {
    if (!down) return;
    var nx = e.clientX - down.ox, ny = e.clientY - down.oy;
    down.moved = Math.max(down.moved, Math.hypot(e.clientX - down.x, e.clientY - down.y));
    S.vx = nx - S.x; S.vy = ny - S.y;
    S.x = nx; S.y = ny; clamp();
  });
  function release(e) {
    if (!down) return;
    var tap = down.moved < 6;
    S.held = false;
    bubble.classList.remove('on');
    if (tap) poke();
    else { S.falling = true; S.vx = Math.max(-14, Math.min(14, S.vx)); S.vy = Math.max(-14, Math.min(14, S.vy)); }
    down = null;
    try { host.releasePointerCapture(e.pointerId); } catch (err) {}
  }
  host.addEventListener('pointerup', release);
  host.addEventListener('pointercancel', release);

  host.addEventListener('keydown', function (e) {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); poke(); }
  });

  /* --------------------------------------------------- hue and prop swaps */
  function apply(hue, prop, instant) {
    var p = PALETTES[hue] || PALETTES.teal;
    host.style.setProperty('--fl', p[0]);
    host.style.setProperty('--ol', p[1]);
    host.style.setProperty('--tint', p[2]);
    host.classList.toggle('no-fade', !!instant || reduce);
    host.setAttribute('data-prop', prop || 'none');
  }
  apply(document.body.dataset.hue || 'teal', document.body.dataset.prop || 'none', true);
  requestAnimationFrame(function () { host.classList.remove('no-fade'); });

  var zones = document.querySelectorAll('[data-hue]');
  if (zones.length && 'IntersectionObserver' in window) {
    new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) apply(en.target.dataset.hue, en.target.dataset.prop, reduce);
      });
    }, { rootMargin: '-40% 0px -40% 0px' }).observe && zones.forEach(function (z) {
      new IntersectionObserver(function (entries) {
        entries.forEach(function (en) { if (en.isIntersecting) apply(z.dataset.hue, z.dataset.prop, reduce); });
      }, { rootMargin: '-40% 0px -40% 0px' }).observe(z);
    });
  }

  clamp();
  requestAnimationFrame(tick);
})();
