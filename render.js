/*
 * render.js — Convierte (plantilla + datos de una invitación) en HTML.
 *
 * Una sola función de dibujo sirve para TODAS las plantillas: lo que cambia
 * entre una plantilla y otra son sus textos, paletas, secciones y estilos CSS
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

  // ---------- Secciones ----------
  // Para sumar una sección nueva (música, galería...) se agrega aquí y se
  // nombra en la lista "sections" de la plantilla que la quiera usar.
  const SECTIONS = {
    hero(tpl, d) {
      const hasPhoto = typeof d.photo === 'string' && d.photo.indexOf('data:image/') === 0;
      const photo = hasPhoto
        ? '<img src="' + esc(d.photo) + '" alt="Fotografía de ' + esc(d.names) + '">'
        : '<div class="inv-photo-empty">' + PLACEHOLDER_SVG + '</div>';
      return (
        '<header class="inv-hero">' +
        '<div class="inv-deco" aria-hidden="true"></div>' +
        '<p class="inv-kicker">' + esc(tpl.kicker) + '</p>' +
        '<div class="inv-photo">' + photo + '</div>' +
        '<h1 class="inv-names">' + esc(d.names || 'Tu nombre aquí') + '</h1>' +
        (d.motive ? '<p class="inv-motive">' + esc(d.motive) + '</p>' : '') +
        '</header>'
      );
    },

    message(tpl, d) {
      if (!d.message || !d.message.trim()) return '';
      return '<section class="inv-block inv-message"><p>' + multiline(d.message) + '</p></section>';
    },

    details(tpl, d) {
      const rows = [];
      const date = formatDate(d.date);
      const time = formatTime(d.time);
      if (date) rows.push(['Fecha', date]);
      if (time) rows.push(['Hora', time]);
      if (d.venue) rows.push(['Lugar', d.venue]);
      if (!rows.length) return '';
      return (
        '<section class="inv-block inv-details">' +
        rows.map((r) =>
          '<div class="inv-detail"><span class="inv-label">' + r[0] + '</span><strong>' + esc(r[1]) + '</strong></div>'
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
        '<section class="inv-block inv-countdown" data-countdown="' + dt.getTime() + '">' +
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
        '<section class="inv-block inv-location">' +
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
        return '<section class="inv-block inv-rsvp"><a class="inv-btn inv-btn-main" href="' + esc(link) +
          '" target="_blank" rel="noopener noreferrer">Confirmar asistencia</a></section>';
      }
      // Sin número: en la invitación final no se muestra nada; en la vista previa
      // se muestra el botón apagado para que se entienda qué falta.
      if (ctx && ctx.preview) {
        return '<section class="inv-block inv-rsvp"><span class="inv-btn inv-btn-main is-disabled">Confirmar asistencia</span></section>';
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
    const body = tpl.sections.map((name) => (SECTIONS[name] ? SECTIONS[name](tpl, inv.data || {}, ctx) : '')).join('');
    return (
      '<article class="inv tpl-' + esc(tpl.layout) + '" style="' + esc(style) + '">' +
      body +
      '<footer class="inv-foot">Creada con Tap Nova</footer>' +
      '</article>'
    );
  }

  // Pone a andar las cuentas regresivas dentro de "root". Devuelve una función para detenerlas.
  function mount(root) {
    const boxes = Array.prototype.slice.call(root.querySelectorAll('[data-countdown]'));
    if (!boxes.length) return function () {};
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
          if (el) el.textContent = pad(p[k]);
        });
      });
    }
    tick();
    const timer = setInterval(tick, 1000);
    return function stop() { clearInterval(timer); };
  }

  global.TapNova = global.TapNova || {};
  global.TapNova.Render = {
    render, mount, esc, safeUrl, whatsappLink, countdownParts, formatDate, formatTime, parseDateTime, getPalette
  };
})(typeof window !== 'undefined' ? window : globalThis);
