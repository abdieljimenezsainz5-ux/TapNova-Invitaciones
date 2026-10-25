/*
 * render.js — Convierte (plantilla + datos + stickers de una invitación) en HTML
 * y le da vida (confeti, globos que se revientan, stickers, cuenta regresiva).
 *
 * Una sola función de dibujo sirve para TODAS las plantillas: lo que cambia
 * entre una plantilla y otra son sus textos, paletas, adornos y estilos CSS
 * (css/templates.css), no el código.
 *
 * Seguridad: todo lo que escribe el usuario pasa por esc() antes de llegar al
 * HTML, para que nadie pueda inyectar código en una invitación.
 */
(function (global) {
  'use strict';

  function esc(v) {
    return String(v == null ? '' : v).replace(/[&<>"']/g, (c) => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[c]));
  }

  function multiline(v) {
    return esc(v).replace(/\n/g, '<br>');
  }

  function clamp(n, min, max) {
    return Math.min(max, Math.max(min, n));
  }

  function parseDateTime(dateStr, timeStr) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr || '')) return null;
    const p = dateStr.split('-').map(Number);
    let hh = 0, mm = 0;
    if (/^\d{2}:\d{2}$/.test(timeStr || '')) {
      const t = timeStr.split(':').map(Number);
      hh = t[0]; mm = t[1];
    }
    const dt = new Date(p[0], p[1] - 1, p[2], hh, mm, 0);
    return isNaN(dt.getTime()) ? null : dt;
  }

  function formatDate(dateStr) {
    const dt = parseDateTime(dateStr, '');
    if (!dt) return '';
    const s = dt.toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    return s.charAt(0).toUpperCase() + s.slice(1);
  }

  function formatTime(timeStr) {
    if (!/^\d{2}:\d{2}$/.test(timeStr || '')) return '';
    const t = timeStr.split(':').map(Number);
    const h12 = t[0] % 12 || 12;
    return h12 + ':' + String(t[1]).padStart(2, '0') + (t[0] < 12 ? ' a. m.' : ' p. m.');
  }

  // Solo enlaces http/https. Acepta que la persona escriba "maps.app.goo.gl/..." sin https.
  function safeUrl(raw) {
    let u = String(raw || '').trim();
    if (!u) return '';
    if (!/^https?:\/\//i.test(u)) u = 'https://' + u;
    try {
      const url = new URL(u);
      if ((url.protocol === 'http:' || url.protocol === 'https:') && url.hostname.indexOf('.') > 0) {
        return url.href;
      }
    } catch (e) { /* inválido */ }
    return '';
  }

  // Números de 10 dígitos se toman como México (+52).
  function whatsappLink(phone, text) {
    let digits = String(phone || '').replace(/\D/g, '');
    if (digits.length === 10) digits = '52' + digits;
    if (digits.length < 11 || digits.length > 15) return '';
    return 'https://wa.me/' + digits + '?text=' + encodeURIComponent(text || '');
  }

  function mapsLink(data) {
    const direct = safeUrl(data.mapsUrl);
    if (direct) return direct;
    const q = [data.venue, data.address].filter(Boolean).join(' ').trim();
    return q ? 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(q) : '';
  }

  function countdownParts(targetMs, nowMs) {
    const diff = targetMs - nowMs;
    if (diff <= 0) return { done: true, d: 0, h: 0, m: 0, s: 0 };
    const s = Math.floor(diff / 1000);
    return {
      done: false,
      d: Math.floor(s / 86400),
      h: Math.floor((s % 86400) / 3600),
      m: Math.floor((s % 3600) / 60),
      s: s % 60
    };
  }

  const pad = (n) => String(n).padStart(2, '0');

  const PLACEHOLDER_SVG =
    '<svg viewBox="0 0 100 100" aria-hidden="true"><circle cx="50" cy="38" r="17" fill="currentColor"/>' +
    '<path d="M16 92c2-22 16-34 34-34s32 12 34 34z" fill="currentColor"/></svg>';

  // Posiciones (x%, y%, tamaño px, duración s, retraso s) de los adornos flotantes.
  const FLOAT_SLOTS = [
    [5, 7, 34, 5.2, -1.2], [82, 5, 38, 6.1, -3.1], [4, 33, 30, 5.6, -2.2], [86, 31, 34, 4.8, -0.6],
    [6, 58, 36, 6.4, -4.0], [84, 56, 30, 5.0, -1.8], [14, 82, 32, 5.8, -2.9], [76, 84, 36, 5.4, -3.6]
  ];

  // Stickers: cada uno es { id, e (emoji), x, y (% de la portada), s (tamaño px), r (giro °) }.
  function stickersHtml(list) {
    if (!Array.isArray(list) || !list.length) return '';
    const items = list.slice(0, 16).map((st) => {
      if (!st || typeof st.e !== 'string' || !st.e) return '';
      const x = clamp(Number(st.x) || 0, -5, 105);
      const y = clamp(Number(st.y) || 0, -5, 105);
      const s = clamp(Number(st.s) || 56, 24, 160);
      const r = clamp(Number(st.r) || 0, -360, 360);
      return '<span class="inv-st" data-id="' + esc(st.id) + '" style="left:' + x.toFixed(1) + '%;top:' + y.toFixed(1) +
        '%;--ss:' + s + 'px;--sr:' + r + 'deg">' + esc(st.e.slice(0, 12)) + '</span>';
    }).join('');
    return '<div class="inv-stickers" aria-hidden="true">' + items + '</div>';
  }

  // Nombre: normal, o "letras recortadas" (cada letra con su propio estilo).
  function namesHtml(tpl, d) {
    const raw = d.names || 'Tu nombre aquí';
    if (tpl.nameStyle === 'ransom') {
      const letters = Array.from(String(raw)).slice(0, 24).map((ch) =>
        ch === ' ' ? '<span class="sp" aria-hidden="true"></span>' : '<span class="l" aria-hidden="true">' + esc(ch) + '</span>'
      ).join('');
      return '<h1 class="inv-names" aria-label="' + esc(raw) + '">' + letters + '</h1>';
    }
    return '<h1 class="inv-names">' + esc(raw) + '</h1>';
  }

  // ---------- Secciones ----------
  // Para sumar una sección nueva (música, galería...) se agrega aquí y se
  // nombra en la lista "sections" de la plantilla que la quiera usar.
  const SECTIONS = {
    hero(tpl, d, ctx, inv) {
      const hasPhoto = typeof d.photo === 'string' && d.photo.indexOf('data:image/') === 0;
      let photo = '';
      if (hasPhoto) {
        photo = '<div class="inv-photo"><img src="' + esc(d.photo) + '" alt="Fotografía de ' + esc(d.names) + '"></div>';
      } else if (!tpl.photoOptional) {
        photo = '<div class="inv-photo"><div class="inv-photo-empty">' + PLACEHOLDER_SVG + '</div></div>';
      }
      const floaters = (tpl.floaters || []).slice(0, FLOAT_SLOTS.length).map((emoji, i) => {
        const s = FLOAT_SLOTS[i];
        return '<span class="inv-float" aria-hidden="true" style="--x:' + s[0] + '%;--y:' + s[1] + '%;--s:' + s[2] +
          'px;--t:' + s[3] + 's;--d:' + s[4] + 's">' + emoji + '</span>';
      }).join('');
      const age = String(d.age || '').trim();
      return (
        '<header class="inv-hero">' +
        '<div class="inv-deco" aria-hidden="true"></div>' +
        '<p class="inv-kicker">' + esc(tpl.kicker) + '</p>' +
        photo +
        namesHtml(tpl, d) +
        (d.motive ? '<p class="inv-motive">' + esc(d.motive) + '</p>' : '') +
        (age ? '<div class="inv-age">' + esc(age.slice(0, 3)) + '</div>' : '') +
        (floaters ? '<div class="inv-floaters">' + floaters + '</div>' : '') +
        stickersHtml(inv && inv.stickers) +
        '</header>'
      );
    },

    message(tpl, d) {
      if (!d.message || !d.message.trim()) return '';
      return '<section class="inv-block inv-message reveal"><p>' + multiline(d.message) + '</p></section>';
    },

    details(tpl, d) {
      const rows = [];
      const date = formatDate(d.date);
      const time = formatTime(d.time);
      if (date) rows.push(['Fecha', date, '📅']);
      if (time) rows.push(['Hora', time, '🕒']);
      if (d.venue) rows.push(['Lugar', d.venue, '📍']);
      if (!rows.length) return '';
      return (
        '<section class="inv-block inv-details">' +
        rows.map((r, i) =>
          '<div class="inv-detail reveal" style="--i:' + i + '"><span class="inv-ico" aria-hidden="true">' + r[2] + '</span>' +
          '<div><span class="inv-label">' + r[0] + '</span><strong>' + esc(r[1]) + '</strong></div></div>'
        ).join('') +
        '</section>'
      );
    },

    countdown(tpl, d) {
      const dt = parseDateTime(d.date, d.time);
      if (!dt) return '';
      const p = countdownParts(dt.getTime(), Date.now());
      const cell = (k, v, label) => '<div><b data-u="' + k + '">' + pad(v) + '</b><span>' + label + '</span></div>';
      return (
        '<section class="inv-block inv-countdown reveal" data-countdown="' + dt.getTime() + '">' +
        '<p class="inv-label">Faltan</p>' +
        '<div class="inv-count">' +
        cell('d', p.d, 'días') + cell('h', p.h, 'horas') + cell('m', p.m, 'min') + cell('s', p.s, 'seg') +
        '</div>' +
        '<p class="inv-count-done" hidden>¡Hoy es el gran día!</p>' +
        '</section>'
      );
    },

    location(tpl, d) {
      const link = mapsLink(d);
      if (!d.address && !link) return '';
      return (
        '<section class="inv-block inv-location reveal">' +
        '<p class="inv-label">Ubicación</p>' +
        (d.address ? '<p class="inv-address">' + multiline(d.address) + '</p>' : '') +
        (link ? '<a class="inv-btn" href="' + esc(link) + '" target="_blank" rel="noopener noreferrer">Ver ubicación</a>' : '') +
        '</section>'
      );
    },

    rsvp(tpl, d, ctx) {
      const text = d.rsvpText || 'Hola, confirmo mi asistencia.';
      const link = whatsappLink(d.whatsapp, text);
      if (link) {
        return '<section class="inv-block inv-rsvp reveal"><a class="inv-btn inv-btn-main" href="' + esc(link) +
          '" target="_blank" rel="noopener noreferrer">Confirmar asistencia</a></section>';
      }
      // Sin número: en la invitación final no se muestra nada; en la vista previa
      // se muestra el botón apagado para que se entienda qué falta.
      if (ctx && ctx.preview) {
        return '<section class="inv-block inv-rsvp reveal"><span class="inv-btn inv-btn-main is-disabled">Confirmar asistencia</span></section>';
      }
      return '';
    }
  };

  function getPalette(tpl, paletteId) {
    return tpl.palettes.find((p) => p.id === paletteId) || tpl.palettes[0];
  }

  function render(tpl, inv, ctx) {
    ctx = ctx || {};
    const palette = getPalette(tpl, inv.paletteId);
    const style = Object.keys(palette.vars).map((k) => k + ':' + palette.vars[k]).join(';');
    const body = tpl.sections.map((name) => (SECTIONS[name] ? SECTIONS[name](tpl, inv.data || {}, ctx, inv) : '')).join('');
    return (
      '<article class="inv tpl-' + esc(tpl.layout) + '" style="' + esc(style) + '">' +
      body +
      '<footer class="inv-foot">Creada con Tap Nova</footer>' +
      '</article>'
    );
  }

  /* ---------- Vida: confeti, globos, stickers, animaciones ---------- */
  function prefersReducedMotion() {
    return !!(global.matchMedia && global.matchMedia('(prefers-reduced-motion: reduce)').matches);
  }

  function popColors(inv) {
    const cs = global.getComputedStyle(inv);
    const list = ['--accent', '--accent-2', '--pop-1', '--pop-2']
      .map((v) => cs.getPropertyValue(v).trim()).filter(Boolean);
    return list.length ? list : ['#FF4F8B', '#FFC83D', '#2FB8F0', '#4CCB6A'];
  }

  // Lanza confeti desde el punto (x, y) dentro de la invitación.
  function burst(inv, x, y, count) {
    if (prefersReducedMotion() || !inv.animate) return;
    const colors = popColors(inv);
    const n = count || 26;
    for (let i = 0; i < n; i++) {
      const p = document.createElement('i');
      p.className = 'inv-conf';
      const w = 6 + Math.random() * 7;
      p.style.cssText = 'left:' + x + 'px;top:' + y + 'px;width:' + w + 'px;height:' + (w * (Math.random() > 0.5 ? 1 : 0.5)) +
        'px;background:' + colors[i % colors.length] + ';' + (Math.random() > 0.6 ? 'border-radius:50%' : '');
      inv.appendChild(p);
      const ang = Math.random() * Math.PI * 2;
      const dist = 50 + Math.random() * 110;
      const dx = Math.cos(ang) * dist;
      const dy = Math.sin(ang) * dist;
      const anim = p.animate([
        { transform: 'translate(0,0) rotate(0deg) scale(1)', opacity: 1 },
        { transform: 'translate(' + dx + 'px,' + (dy + 70) + 'px) rotate(' + (Math.random() * 720 - 360) + 'deg) scale(.5)', opacity: 0 }
      ], { duration: 800 + Math.random() * 600, easing: 'cubic-bezier(.15,.8,.3,1)' });
      anim.onfinish = () => p.remove();
    }
  }

  // Pone a andar la invitación dentro de "root". Devuelve una función para detenerla.
  //   opts.live = true → con animaciones de entrada (al abrir la invitación)
  //   opts.edit = { selectedId, onSelect(id), onMove(id, x, y) } → los stickers se pueden arrastrar
  function mount(root, opts) {
    opts = opts || {};
    const inv = root.querySelector('.inv');
    if (!inv) return function () {};
    const reduce = prefersReducedMotion();
    let io = null;

    // Entrada suave de cada bloque al hacer scroll.
    if (opts.live) {
      inv.classList.add('inv-live');
      const items = Array.prototype.slice.call(inv.querySelectorAll('.reveal'));
      if ('IntersectionObserver' in global && !reduce) {
        io = new IntersectionObserver((entries) => {
          entries.forEach((e) => {
            if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
          });
        }, { threshold: 0.12 });
        items.forEach((el) => io.observe(el));
      } else {
        items.forEach((el) => el.classList.add('in'));
      }
      if (!reduce) setTimeout(() => { if (inv.isConnected) burst(inv, inv.clientWidth / 2, 190); }, 450);
    }

    // Arrastrar stickers (solo en el editor).
    const E = opts.edit;
    if (E) {
      inv.classList.add('inv-edit');
      const layer = inv.querySelector('.inv-stickers');
      const mark = (id) => {
        inv.querySelectorAll('.inv-st').forEach((n) => n.classList.toggle('sel', !!id && n.getAttribute('data-id') === id));
      };
      if (E.selectedId) mark(E.selectedId);
      inv.addEventListener('pointerdown', (e) => {
        const el = e.target.closest('.inv-st');
        if (!el || !layer) {
          if (E.selectedId || inv.querySelector('.inv-st.sel')) { mark(null); E.selectedId = null; if (E.onSelect) E.onSelect(null); }
          return;
        }
        e.preventDefault();
        const id = el.getAttribute('data-id');
        mark(id); E.selectedId = id;
        if (E.onSelect) E.onSelect(id);
        const rect = layer.getBoundingClientRect();
        let last = null;
        try { el.setPointerCapture(e.pointerId); } catch (err) { /* sin captura */ }
        const move = (ev) => {
          const x = clamp((ev.clientX - rect.left) / rect.width * 100, -5, 105);
          const y = clamp((ev.clientY - rect.top) / rect.height * 100, -5, 105);
          el.style.left = x.toFixed(1) + '%';
          el.style.top = y.toFixed(1) + '%';
          last = { x: x, y: y };
        };
        const up = () => {
          el.removeEventListener('pointermove', move);
          el.removeEventListener('pointerup', up);
          el.removeEventListener('pointercancel', up);
          if (last && E.onMove) E.onMove(id, last.x, last.y);
        };
        el.addEventListener('pointermove', move);
        el.addEventListener('pointerup', up);
        el.addEventListener('pointercancel', up);
      });
    }

    // Tocar un adorno lo revienta; tocar un sticker lo hace saltar; la foto o el nombre lanzan confeti.
    if (!E) {
      inv.addEventListener('click', (e) => {
        const r = inv.getBoundingClientRect();
        const f = e.target.closest('.inv-float');
        if (f) {
          if (f.classList.contains('pop')) return;
          f.classList.add('pop');
          const fr = f.getBoundingClientRect();
          burst(inv, fr.left - r.left + fr.width / 2, fr.top - r.top + fr.height / 2);
          setTimeout(() => f.classList.remove('pop'), 3200);
          return;
        }
        const st = e.target.closest('.inv-st');
        if (st) {
          st.classList.remove('bounce'); void st.offsetWidth; st.classList.add('bounce');
          const sr = st.getBoundingClientRect();
          burst(inv, sr.left - r.left + sr.width / 2, sr.top - r.top + sr.height / 2, 12);
          return;
        }
        if (e.target.closest('.inv-photo, .inv-names')) {
          burst(inv, e.clientX - r.left, e.clientY - r.top);
          const ph = inv.querySelector('.inv-photo');
          if (ph) { ph.classList.remove('wiggle'); void ph.offsetWidth; ph.classList.add('wiggle'); }
        }
      });
    }

    // La foto se inclina con el dedo o el cursor.
    const hero = inv.querySelector('.inv-hero');
    const photo = inv.querySelector('.inv-photo');
    if (hero && photo && !reduce && !E) {
      hero.addEventListener('pointermove', (e) => {
        const b = hero.getBoundingClientRect();
        const x = (e.clientX - b.left) / b.width - 0.5;
        const y = (e.clientY - b.top) / b.height - 0.5;
        photo.style.setProperty('--rx', (-y * 16).toFixed(1) + 'deg');
        photo.style.setProperty('--ry', (x * 16).toFixed(1) + 'deg');
      });
      hero.addEventListener('pointerleave', () => {
        photo.style.setProperty('--rx', '0deg');
        photo.style.setProperty('--ry', '0deg');
      });
    }

    // Cuenta regresiva en vivo.
    const boxes = Array.prototype.slice.call(inv.querySelectorAll('[data-countdown]'));
    function tick() {
      boxes.forEach((box) => {
        const p = countdownParts(Number(box.getAttribute('data-countdown')), Date.now());
        const grid = box.querySelector('.inv-count');
        const done = box.querySelector('.inv-count-done');
        if (p.done) {
          if (grid) grid.hidden = true;
          if (done) done.hidden = false;
          return;
        }
        ['d', 'h', 'm', 's'].forEach((k) => {
          const el = box.querySelector('[data-u="' + k + '"]');
          if (el && el.textContent !== pad(p[k])) {
            el.textContent = pad(p[k]);
            if (k === 's' && !reduce) { el.classList.remove('tick'); void el.offsetWidth; el.classList.add('tick'); }
          }
        });
      });
    }
    tick();
    const timer = boxes.length ? setInterval(tick, 1000) : null;

    return function stop() {
      if (timer) clearInterval(timer);
      if (io) io.disconnect();
    };
  }

  global.TapNova = global.TapNova || {};
  global.TapNova.Render = {
    render, mount, esc, safeUrl, whatsappLink, countdownParts, formatDate, formatTime, parseDateTime, getPalette
  };
})(typeof window !== 'undefined' ? window : globalThis);
