/*
 * app.js — Pantallas de la plataforma: galería de plantillas, editor y pedido.
 *
 * Rutas (se leen del "#" de la dirección, así funcionan en cualquier hosting estático):
 *   #/                 → galería (inicio)
 *   #/nueva/<plantilla>→ editor con una invitación nueva (aún sin guardar)
 *   #/editar/<id>      → editor con un borrador guardado
 *   #/importar         → (solo para el estudio) abrir el archivo de pedido de un cliente
 */
(function () {
  'use strict';

  const Catalog = window.TapNova.Catalog;
  const Storage = window.TapNova.Storage;
  const Render = window.TapNova.Render;
  const Config = window.TapNova.Config || {};
  const esc = Render.esc;

  const app = document.getElementById('app');
  const toastEl = document.getElementById('toast');
  const BASE_TITLE = 'Tap Nova Invitaciones — Crea tu invitación digital';

  let leave = null;          // limpieza de la pantalla actual
  let galleryFilter = 'todas';
  let toastTimer = null;
  let sheetEl = null;        // hoja de publicación abierta (si hay)

  function toast(msg) {
    toastEl.textContent = msg;
    toastEl.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toastEl.classList.remove('show'), 3200);
  }

  function shortDate(iso) {
    const d = new Date(iso);
    return isNaN(d) ? '' : d.toLocaleDateString('es-MX', { day: 'numeric', month: 'short' });
  }

  function closeSheet() {
    if (sheetEl) { sheetEl.remove(); sheetEl = null; }
  }

  /* ======================= Enrutador ======================= */
  function route() {
    closeSheet();
    if (leave) { leave(); leave = null; }
    app.onclick = null; app.oninput = null; app.onchange = null;
    document.body.classList.remove('is-editor');

    const parts = location.hash.replace(/^#\/?/, '').split('/');
    const view = parts[0];
    const arg = decodeURIComponent(parts[1] || '');

    if (view === 'nueva') {
      const tpl = Catalog.getTemplate(arg);
      if (tpl) { window.scrollTo(0, 0); return showEditor(tpl, Storage.build(tpl), true); }
    } else if (view === 'editar') {
      const inv = Storage.get(arg);
      const tpl = inv && Catalog.getTemplate(inv.templateId);
      if (inv && tpl) { window.scrollTo(0, 0); return showEditor(tpl, inv, false); }
      toast('No encontramos esa invitación en este dispositivo.');
    } else if (view === 'importar') {
      window.scrollTo(0, 0);
      return showImport();
    }
    if (location.hash && !/^#\/?$/.test(location.hash)) history.replaceState(null, '', '#/');
    showGallery();
    window.scrollTo(0, 0);
  }

  /* ======================= Galería ======================= */
  function miniature(tpl) {
    return Render.render(tpl, { paletteId: tpl.palettes[0].id, data: tpl.defaults(), stickers: Storage.initialStickers(tpl) }, { preview: false });
  }

  function templateCard(tpl) {
    const cat = Catalog.getCategory(tpl.category);
    const href = '#/nueva/' + encodeURIComponent(tpl.id);
    const preview = tpl.cover
      ? '<img class="cover" src="' + esc(tpl.cover) + '" alt="" loading="lazy">'
      : '<div class="thumb-inner">' + miniature(tpl) + '</div>';
    const tagColor = tpl.palettes[0].vars['--accent'];
    return (
      '<article class="card">' +
      '<div class="thumb">' + preview +
      '<a class="thumb-link" href="' + href + '" aria-label="Personalizar ' + esc(tpl.name) + '"></a></div>' +
      '<div class="card-body">' +
      '<span class="tag" style="--tag:' + esc(tagColor) + '">' + esc(cat ? cat.name : '') + '</span>' +
      '<h3>' + esc(tpl.name) + '</h3>' +
      '<a class="card-cta" href="' + href + '">Personalizar <span aria-hidden="true">›</span></a>' +
      '</div></article>'
    );
  }

  function mockHtml(id, pos) {
    const tpl = Catalog.getTemplate(id);
    if (!tpl) return '';
    return '<div class="mock mock-' + pos + '" aria-hidden="true"><div class="thumb"><div class="thumb-inner">' + miniature(tpl) + '</div></div></div>';
  }

  function draftItem(inv) {
    const tpl = Catalog.getTemplate(inv.templateId);
    const name = (inv.data && inv.data.names) || 'Sin nombre';
    const open = tpl
      ? '<a class="btn btn-sm btn-dark" href="#/editar/' + encodeURIComponent(inv.id) + '">Abrir</a>'
      : '';
    const dup = tpl ? '<button class="btn btn-sm" type="button" data-act="dup" data-id="' + esc(inv.id) + '">Duplicar</button>' : '';
    return (
      '<li class="draft"><div><strong>' + esc(name) + '</strong>' +
      '<small>' + esc(tpl ? tpl.name : 'Plantilla no disponible') + ' · Borrador · editado ' + esc(shortDate(inv.updatedAt)) + '</small></div>' +
      '<div class="draft-actions">' + open + dup +
      '<button class="btn btn-sm btn-danger" type="button" data-act="del" data-id="' + esc(inv.id) + '">Eliminar</button>' +
      '</div></li>'
    );
  }

  function showGallery() {
    document.title = BASE_TITLE;
    const drafts = Storage.list();
    const cats = Catalog.CATEGORIES.filter((c) => Catalog.TEMPLATES.some((t) => t.category === c.id));
    if (galleryFilter !== 'todas' && !cats.some((c) => c.id === galleryFilter)) galleryFilter = 'todas';

    const chips = [{ id: 'todas', name: 'Todas' }].concat(cats)
      .map((c) => '<button class="chip-btn" type="button" data-filter="' + esc(c.id) + '" aria-pressed="' + (c.id === galleryFilter) + '">' + esc(c.name) + '</button>')
      .join('');

    app.innerHTML =
      '<section class="hero"><div class="blobs" aria-hidden="true"><i></i><i></i><i></i><i></i></div>' +
      '<div class="wrap">' +
      '<p class="eyebrow">Tap Nova Invitaciones</p>' +
      '<h1>Crea tu <span class="grad">invitación digital</span></h1>' +
      '<p class="lead">Elige un diseño, ponle tus stickers, escribe los datos de tu fiesta y míralo cobrar vida en tu celular.</p>' +
      '<div class="cta"><button class="btn btn-primary" type="button" data-act="scroll">Elegir plantilla</button></div>' +
      '<div class="showcase" id="showcase">' + mockHtml('baby-granja', 'left') + mockHtml('collage-rosa', 'mid') + mockHtml('halloween-noche', 'right') + '</div>' +
      '</div></section>' +
      (drafts.length
        ? '<section class="section wrap" id="borradores"><h2>Mis borradores</h2>' +
          '<p class="section-sub">Se guardan solo en este dispositivo.</p>' +
          (Storage.isPersistent() ? '' : '<p class="notice">Tu navegador no permite guardar de forma permanente: los borradores se perderán al cerrar esta pestaña.</p>') +
          '<ul class="drafts">' + drafts.map(draftItem).join('') + '</ul></section>'
        : '') +
      '<section class="section wrap" id="plantillas-sec"><h2>Plantillas</h2>' +
      '<p class="section-sub">Elige la que más te guste. Después cambias textos, foto, colores y stickers.</p>' +
      '<div class="chips" role="group" aria-label="Filtrar por tipo de evento">' + chips + '</div>' +
      '<div class="grid" id="grid"></div></section>' +
      '<footer class="site-foot wrap">Tap Nova Studio · Marketing que se toca</footer>';

    let stopThumbs = null;
    let cardObserver = null;
    function paintGrid() {
      if (stopThumbs) stopThumbs();
      if (cardObserver) cardObserver.disconnect();
      const grid = document.getElementById('grid');
      const items = Catalog.TEMPLATES.filter((t) => galleryFilter === 'todas' || t.category === galleryFilter);
      grid.innerHTML = items.length
        ? items.map(templateCard).join('')
        : '<p class="empty">Aún no hay plantillas en esta categoría. ¡Pronto habrá más!</p>';
      stopThumbs = fitThumbs(app);
      // Las tarjetas aparecen suavemente al entrar en pantalla.
      const cards = Array.prototype.slice.call(grid.querySelectorAll('.card'));
      if ('IntersectionObserver' in window) {
        cards.forEach((c) => c.classList.add('pre'));
        cardObserver = new IntersectionObserver((es) => {
          es.forEach((e) => { if (e.isIntersecting) { e.target.classList.remove('pre'); cardObserver.unobserve(e.target); } });
        }, { threshold: 0.08 });
        cards.forEach((c) => cardObserver.observe(c));
      }
    }
    paintGrid();
    leave = () => { if (stopThumbs) stopThumbs(); if (cardObserver) cardObserver.disconnect(); };

    app.onclick = function (e) {
      const chip = e.target.closest('[data-filter]');
      if (chip) {
        galleryFilter = chip.getAttribute('data-filter');
        app.querySelectorAll('[data-filter]').forEach((b) => b.setAttribute('aria-pressed', String(b === chip)));
        paintGrid();
        return;
      }
      const btn = e.target.closest('[data-act]');
      if (!btn) return;
      const act = btn.getAttribute('data-act');
      const id = btn.getAttribute('data-id');
      if (act === 'scroll') {
        document.getElementById('plantillas-sec').scrollIntoView({ behavior: 'smooth' });
      } else if (act === 'dup') {
        if (Storage.duplicate(id)) { toast('Copia creada.'); rerender(); }
        else toast('No se pudo duplicar: no hay espacio en este dispositivo.');
      } else if (act === 'del') {
        if (window.confirm('¿Eliminar este borrador? No se puede deshacer.')) {
          Storage.remove(id);
          toast('Borrador eliminado.');
          rerender();
        }
      }
    };
  }

  function rerender() {
    const y = window.scrollY;
    if (leave) { leave(); leave = null; }
    showGallery();
    window.scrollTo(0, y);
  }

  // Las miniaturas son la propia plantilla dibujada a 390px y reducida.
  function fitThumbs(root) {
    function scale(t) {
      const inner = t.querySelector('.thumb-inner');
      if (inner && t.clientWidth) inner.style.transform = 'scale(' + (t.clientWidth / 390) + ')';
    }
    const ro = 'ResizeObserver' in window ? new ResizeObserver((es) => es.forEach((e) => scale(e.target))) : null;
    root.querySelectorAll('.thumb').forEach((t) => { scale(t); if (ro) ro.observe(t); });
    return function () { if (ro) ro.disconnect(); };
  }

  /* ======================= Importar pedido (para el estudio) ======================= */
  function showImport() {
    document.title = 'Importar pedido — Tap Nova';
    app.innerHTML =
      '<section class="section wrap"><h2>Importar pedido</h2>' +
      '<p class="section-sub">Para uso del estudio: abre el archivo de diseño que te envió tu cliente.</p>' +
      '<div class="group" style="margin-top:22px"><div class="field"><label for="imp">Archivo del pedido (.txt)</label>' +
      '<input id="imp" type="file" accept=".txt,.json,text/plain,application/json"></div>' +
      '<p class="publish-note" id="impMsg" role="status"></p>' +
      '<div class="field"><a class="btn" href="#/">Volver al inicio</a></div></div></section>';
    app.querySelector('#imp').addEventListener('change', (e) => {
      const file = e.target.files && e.target.files[0];
      const msg = app.querySelector('#impMsg');
      if (!file) return;
      if (file.size > 4000000) { msg.textContent = 'El archivo es demasiado grande.'; return; }
      const fr = new FileReader();
      fr.onload = () => {
        let inv = null;
        try { inv = Storage.sanitize(JSON.parse(String(fr.result))); } catch (err) { inv = null; }
        if (!inv) { msg.textContent = 'Ese archivo no parece un pedido válido de Tap Nova.'; return; }
        const res = Storage.save(inv);
        if (!res.ok) { msg.textContent = 'No hay espacio en este dispositivo para guardarlo.'; return; }
        location.hash = '#/editar/' + encodeURIComponent(inv.id);
      };
      fr.onerror = () => { msg.textContent = 'No se pudo leer el archivo.'; };
      fr.readAsText(file);
    });
  }

  /* ======================= Editor ======================= */
  const GROUPS = [
    { title: 'Lo principal', keys: ['names', 'motive', 'age', 'photo'] },
    { title: 'Cuándo y dónde', keys: ['date', 'time', 'venue', 'address', 'mapsUrl'] },
    { title: 'Mensaje y confirmación', keys: ['message', 'whatsapp', 'rsvpText'] }
  ];

  function fieldHtml(f, value) {
    const id = 'f-' + f.key;
    const ph = f.placeholder ? ' placeholder="' + esc(f.placeholder) + '"' : '';
    const max = f.max ? ' maxlength="' + f.max + '"' : '';
    const hint = f.hint ? '<small id="' + id + '-h">' + esc(f.hint) + '</small>' : '';
    const err = (f.key === 'mapsUrl' || f.key === 'whatsapp') ? '<small class="err" data-err="' + f.key + '" role="alert"></small>' : '';
    const desc = f.hint ? ' aria-describedby="' + id + '-h"' : '';
    const label = '<label for="' + id + '">' + esc(f.label) + '</label>';

    if (f.type === 'image') {
      return (
        '<div class="field"><span class="field-label">' + esc(f.label) + '</span>' +
        '<div class="photo-field">' +
        '<div class="photo-thumb" id="photoThumb"></div>' +
        '<input id="photoInput" type="file" accept="image/*">' +
        '<label class="btn btn-sm" for="photoInput">Subir foto</label>' +
        '<button class="btn btn-sm btn-danger" type="button" id="photoRemove">Quitar</button>' +
        '</div><small>Se reduce automáticamente para que tu invitación cargue rápido.</small></div>'
      );
    }
    if (f.type === 'textarea') {
      return '<div class="field">' + label + '<textarea id="' + id + '" name="' + f.key + '" rows="' + (f.rows || 3) + '"' + ph + max + desc + '>' + esc(value) + '</textarea>' + hint + err + '</div>';
    }
    const type = { text: 'text', url: 'text', tel: 'tel', date: 'date', time: 'time' }[f.type] || 'text';
    const mode = f.type === 'url' ? ' inputmode="url" autocapitalize="off" spellcheck="false"' : f.type === 'tel' ? ' inputmode="tel"' : '';
    return '<div class="field">' + label + '<input id="' + id + '" name="' + f.key + '" type="' + type + '"' + mode + ph + max + desc + ' value="' + esc(value) + '">' + hint + err + '</div>';
  }

  function groupHtml(title, fields, data) {
    if (!fields.length) return '';
    const out = [];
    for (let i = 0; i < fields.length; i++) {
      const f = fields[i];
      const next = fields[i + 1];
      if (f.key === 'date' && next && next.key === 'time') {
        out.push('<div class="row-2">' + fieldHtml(f, data.date) + fieldHtml(next, data.time) + '</div>');
        i++;
      } else {
        out.push(fieldHtml(f, data[f.key]));
      }
    }
    return '<section class="group"><h3>' + esc(title) + '</h3>' + out.join('') + '</section>';
  }

  function fieldsHtml(fields, data) {
    const used = new Set();
    let html = GROUPS.map((g) => {
      const list = fields.filter((f) => g.keys.indexOf(f.key) >= 0);
      list.forEach((f) => used.add(f.key));
      return groupHtml(g.title, list, data);
    }).join('');
    const rest = fields.filter((f) => !used.has(f.key));
    if (rest.length) html += groupHtml('Más detalles', rest, data);
    return html;
  }

  // Reduce la foto a 900px y la guarda como JPG para que quepa en el dispositivo.
  function fileToDataUrl(file) {
    return new Promise((resolve, reject) => {
      const fr = new FileReader();
      fr.onerror = () => reject(new Error('read'));
      fr.onload = () => {
        const img = new Image();
        img.onerror = () => reject(new Error('img'));
        img.onload = () => {
          const s = Math.min(1, 900 / Math.max(img.width, img.height));
          const c = document.createElement('canvas');
          c.width = Math.max(1, Math.round(img.width * s));
          c.height = Math.max(1, Math.round(img.height * s));
          const ctx = c.getContext('2d');
          ctx.fillStyle = '#fff';
          ctx.fillRect(0, 0, c.width, c.height);
          ctx.drawImage(img, 0, 0, c.width, c.height);
          resolve(c.toDataURL('image/jpeg', 0.8));
        };
        img.src = fr.result;
      };
      fr.readAsDataURL(file);
    });
  }

  function phoneLabel(p) {
    const d = String(p || '').replace(/\D/g, '');
    return d.length === 10 ? d.replace(/(\d{3})(\d{3})(\d{4})/, '$1 $2 $3') : String(p || '');
  }

  /* ----- Hoja de publicación: pago + envío del diseño ----- */
  function openPublish(tpl, inv, saveNow) {
    closeSheet();
    saveNow(false);
    const price = Config.price;
    const hasWa = !!Render.whatsappLink(Config.whatsapp, 'x');
    const priceHtml =
      '<div class="price"><span>Invitación publicada con enlace único</span><div>' +
      (price != null && price !== '' ? '<strong>$' + esc(price) + '</strong> <em>' + esc(Config.currency || 'MXN') + '</em>' : '<em>Precio por confirmar</em>') +
      '</div></div>';
    const payStep = Config.payUrl && Render.safeUrl(Config.payUrl)
      ? '<p>Paga de forma segura y vuelve aquí.</p><a class="btn btn-primary" href="' + esc(Render.safeUrl(Config.payUrl)) + '" target="_blank" rel="noopener noreferrer">Pagar ahora</a>'
      : '<p>' + (Config.payNote ? multi(Config.payNote) : 'Te enviaremos los datos de pago por WhatsApp.') + '</p>';
    const waLine = hasWa ? '<p>Elige el WhatsApp de ' + esc(Config.studioName || 'Tap Nova') + ' (' + esc(phoneLabel(Config.whatsapp)) + ') para enviarlo.</p>' : '';

    sheetEl = document.createElement('div');
    sheetEl.className = 'sheet-back';
    sheetEl.innerHTML =
      '<div class="sheet" role="dialog" aria-modal="true" aria-labelledby="sheetTitle">' +
      '<h2 id="sheetTitle">Publica tu invitación</h2>' +
      '<p class="sub">' + esc(tpl.name) + ' · ' + esc((inv.data && inv.data.names) || 'Sin nombre') + '</p>' +
      priceHtml +
      '<ol class="psteps">' +
      '<li><strong>Paga tu invitación</strong>' + payStep + '</li>' +
      '<li><strong>Envíanos tu diseño</strong><p>Mandamos tu invitación tal como la dejaste, con textos, colores y stickers.</p>' + waLine +
      '<button class="btn btn-dark" type="button" id="sendOrder">Enviar mi diseño por WhatsApp</button></li>' +
      '<li><strong>Recibe tu enlace</strong><p>Publicamos tu invitación y te mandamos su enlace único para compartirla por WhatsApp, Facebook o donde quieras.</p></li>' +
      '</ol>' +
      (hasWa ? '' : '<p class="notice">Aviso para el dueño: falta tu número de WhatsApp en js/config.js. Sin él, tus clientes no pueden enviarte el pedido.</p>') +
      '<button class="btn btn-block sheet-close" type="button" id="sheetClose">Seguir editando</button>' +
      '</div>';
    document.body.appendChild(sheetEl);
    sheetEl.addEventListener('click', (e) => { if (e.target === sheetEl || e.target.closest('#sheetClose')) closeSheet(); });
    const onKey = (e) => { if (e.key === 'Escape') { closeSheet(); document.removeEventListener('keydown', onKey); } };
    document.addEventListener('keydown', onKey);
    sheetEl.querySelector('#sendOrder').addEventListener('click', () => sendOrder(tpl, inv, hasWa));
  }

  function multi(t) { return esc(t).replace(/\n/g, '<br>'); }

  async function sendOrder(tpl, inv, hasWa) {
    const names = (inv.data && inv.data.names) || 'mi invitación';
    const text = 'Hola, quiero publicar mi invitación "' + names + '" (' + tpl.name + ').';
    const slug = String(names).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 30) || 'invitacion';
    const payload = JSON.stringify({ app: 'tapnova-invitaciones', v: 2, invitation: inv });
    const file = new File([payload], 'tapnova-' + slug + '.txt', { type: 'text/plain' });
    try {
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({ files: [file], text: text });
        return;
      }
    } catch (e) {
      if (e && e.name === 'AbortError') return; // la persona canceló
    }
    // Respaldo: se descarga el archivo y se abre WhatsApp para adjuntarlo.
    const url = URL.createObjectURL(file);
    const a = document.createElement('a');
    a.href = url; a.download = file.name;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 4000);
    if (hasWa) {
      window.open(Render.whatsappLink(Config.whatsapp, text + ' Te adjunto mi archivo de diseño.'), '_blank', 'noopener');
      toast('Se descargó tu diseño. Adjúntalo en el chat de WhatsApp.');
    } else {
      toast('Se descargó tu diseño. Envíalo por WhatsApp a Tap Nova.');
    }
  }

  function showEditor(tpl, inv, isNew) {
    document.title = 'Editando ' + tpl.name + ' — Tap Nova';
    document.body.classList.add('is-editor');
    const fields = Catalog.resolveFields(tpl);
    const textKeys = new Set(fields.filter((f) => f.type !== 'image').map((f) => f.key));
    const data = inv.data;
    if (!Array.isArray(inv.stickers)) inv.stickers = [];

    const dots = tpl.palettes.map((p) => {
      const v = p.vars;
      const c3 = v['--pop-1'] || v['--accent-2'];
      return '<button class="dot" type="button" role="radio" aria-checked="' + (p.id === inv.paletteId) + '" data-palette="' + esc(p.id) + '">' +
        '<i style="background:conic-gradient(' + v['--accent'] + ' 0 33%,' + v['--accent-2'] + ' 0 66%,' + c3 + ' 0)"></i>' + esc(p.name) + '</button>';
    }).join('');

    const tray = Catalog.stickerSet(tpl).map((e) =>
      '<button type="button" data-add="' + esc(e) + '" aria-label="Agregar sticker ' + esc(e) + '">' + esc(e) + '</button>'
    ).join('');

    app.innerHTML =
      '<div class="editor" data-tab="edit">' +
      '<div class="navbar"><div class="wrap">' +
      '<a class="nav-back" href="#/">‹ Plantillas</a>' +
      '<div class="nav-title"><strong>' + esc(tpl.name) + '</strong><small id="saveState"></small></div>' +
      '<button class="nav-save" type="button" id="saveBtn">Guardar</button>' +
      '</div></div>' +
      '<div class="editor-grid">' +
      '<form class="form" id="form" autocomplete="off" novalidate>' +
      fieldsHtml(fields, data) +
      '<section class="group"><h3>Colores</h3>' +
      '<div class="palettes" role="radiogroup" aria-label="Colores">' + dots + '</div></section>' +
      '<section class="group"><h3>Stickers</h3>' +
      '<p class="publish-note">Agrégalos desde la bandeja de la vista previa y arrástralos con el dedo para acomodarlos.</p></section>' +
      '<section class="group"><h3>Publicar</h3>' +
      '<div class="field"><button class="btn btn-primary btn-block" type="button" id="publishBtn">Publicar y compartir</button></div>' +
      '<p class="publish-note">Tu diseño se guarda como borrador en este dispositivo. Al publicar, pagas y te entregamos tu enlace único.</p></section>' +
      '</form>' +
      '<section class="preview" aria-label="Vista previa">' +
      '<div class="preview-head"><p>Vista previa</p>' +
      '<button class="btn btn-sm" type="button" id="playBtn">▶ Ver animación</button></div>' +
      '<div class="dock" id="dock">' +
      '<div class="dock-title"><span>Stickers</span><small>Toca para agregar · arrastra para mover</small></div>' +
      '<div class="tray" role="group" aria-label="Agregar stickers">' + tray + '</div>' +
      '<div class="tools" id="stTools" hidden>' +
      '<button class="btn btn-sm" type="button" data-st="down" aria-label="Más pequeño">−</button>' +
      '<button class="btn btn-sm" type="button" data-st="up" aria-label="Más grande">+</button>' +
      '<button class="btn btn-sm" type="button" data-st="left" aria-label="Girar a la izquierda">↺</button>' +
      '<button class="btn btn-sm" type="button" data-st="right" aria-label="Girar a la derecha">↻</button>' +
      '<button class="btn btn-sm btn-danger" type="button" data-st="del">Quitar</button>' +
      '</div></div>' +
      '<div class="phone"><div class="phone-screen" id="inv-root"></div></div>' +
      '</section></div>' +
      '<nav class="tabs" aria-label="Cambiar entre editar y vista previa">' +
      '<button type="button" class="is-active" data-tab="edit">Editar</button>' +
      '<button type="button" data-tab="preview">Vista previa</button></nav>' +
      '</div>';

    const editor = app.querySelector('.editor');
    const form = app.querySelector('#form');
    const root = app.querySelector('#inv-root');
    const dock = app.querySelector('#dock');
    const tools = app.querySelector('#stTools');
    const saveStateEl = app.querySelector('#saveState');
    const photoThumb = app.querySelector('#photoThumb');
    const photoRemove = app.querySelector('#photoRemove');

    let stopCount = null;
    let paintQueued = false;
    let dirty = false;
    let saveTimer = null;
    let selId = null;
    let hinted = false;

    function setSel(id) {
      selId = id;
      tools.hidden = !id;
    }
    function moveSticker(id, x, y) {
      const s = inv.stickers.find((k) => k.id === id);
      if (s) { s.x = Math.round(x * 10) / 10; s.y = Math.round(y * 10) / 10; markDirty(); }
    }

    // live=true reproduce las animaciones de entrada; mientras se edita se muestra estático
    // y los stickers se pueden arrastrar.
    function paint(live) {
      paintQueued = false;
      if (stopCount) stopCount();
      root.innerHTML = Render.render(tpl, inv, { preview: true });
      stopCount = Render.mount(root, live === true
        ? { live: true }
        : { edit: { selectedId: selId, onSelect: setSel, onMove: moveSticker } });
    }
    function queuePaint() {
      if (!paintQueued) { paintQueued = true; requestAnimationFrame(() => paint(false)); }
    }

    function setSaveState(text) { saveStateEl.textContent = 'Borrador · ' + text; }

    // Guarda el borrador. Devuelve el resultado de Storage.save.
    function saveNow(manual) {
      clearTimeout(saveTimer);
      const res = Storage.save(inv);
      if (res.ok) {
        dirty = false;
        // Una invitación nueva pasa a tener su propia dirección (#/editar/id).
        if (location.hash.indexOf('#/nueva/') === 0) history.replaceState(null, '', '#/editar/' + encodeURIComponent(inv.id));
        setSaveState(res.persistent ? 'guardado' : 'guardado solo en esta pestaña');
        if (manual) toast(res.persistent ? 'Borrador guardado en este dispositivo.' : 'Guardado temporalmente: tu navegador no permite guardar de forma permanente.');
      } else {
        setSaveState('no se pudo guardar');
        toast(res.reason === 'quota'
          ? 'No hay espacio en este dispositivo. Prueba con una foto más pequeña o elimina borradores.'
          : 'No se pudo guardar el borrador.');
      }
      return res;
    }
    function markDirty() {
      dirty = true;
      setSaveState('guardando…');
      clearTimeout(saveTimer);
      saveTimer = setTimeout(() => saveNow(false), 600);
    }

    function validate(key) {
      const el = form.querySelector('[data-err="' + key + '"]');
      if (!el) return;
      const v = String(data[key] || '').trim();
      let msg = '';
      if (key === 'mapsUrl' && v && !Render.safeUrl(v)) msg = 'Ese enlace no parece válido.';
      if (key === 'whatsapp' && v && !Render.whatsappLink(v, 'x')) msg = 'Escribe tu número a 10 dígitos.';
      el.textContent = msg;
    }

    function refreshPhotoUI() {
      if (!photoThumb) return;
      const has = typeof data.photo === 'string' && data.photo.indexOf('data:image/') === 0;
      photoThumb.innerHTML = has ? '<img alt="" src="' + esc(data.photo) + '">' : 'Sin foto';
      photoRemove.hidden = !has;
    }

    setSaveState(isNew ? 'sin guardar' : 'guardado');
    validate('mapsUrl');
    validate('whatsapp');
    refreshPhotoUI();
    paint(false);

    // Escribir en el formulario → actualiza los datos de ESTA invitación y la vista previa.
    form.addEventListener('input', (e) => {
      const el = e.target;
      if (!el.name || !textKeys.has(el.name)) return;
      data[el.name] = el.value;
      validate(el.name);
      queuePaint();
      markDirty();
    });

    form.addEventListener('click', (e) => {
      const sw = e.target.closest('[data-palette]');
      if (sw) {
        inv.paletteId = sw.getAttribute('data-palette');
        form.querySelectorAll('[data-palette]').forEach((b) => b.setAttribute('aria-checked', String(b === sw)));
        queuePaint();
        markDirty();
        return;
      }
      if (e.target.closest('#photoRemove')) {
        data.photo = '';
        refreshPhotoUI();
        queuePaint();
        markDirty();
        return;
      }
      if (e.target.closest('#publishBtn')) openPublish(tpl, inv, saveNow);
    });

    // Bandeja de stickers
    dock.addEventListener('click', (e) => {
      const add = e.target.closest('[data-add]');
      if (add) {
        if (inv.stickers.length >= 16) { toast('Máximo 16 stickers por invitación.'); return; }
        const st = {
          id: 's' + Math.random().toString(36).slice(2, 8),
          e: add.getAttribute('data-add'),
          x: 30 + Math.random() * 40,
          y: 30 + Math.random() * 30,
          s: 60,
          r: 0
        };
        inv.stickers.push(st);
        setSel(st.id);
        queuePaint();
        markDirty();
        if (!hinted) { hinted = true; toast('Arrástralo en la invitación para moverlo.'); }
        return;
      }
      const act = e.target.closest('[data-st]');
      if (!act) return;
      const idx = inv.stickers.findIndex((k) => k.id === selId);
      if (idx < 0) return;
      const st = inv.stickers[idx];
      const a = act.getAttribute('data-st');
      if (a === 'up') st.s = Math.min(160, st.s + 8);
      else if (a === 'down') st.s = Math.max(24, st.s - 8);
      else if (a === 'left') st.r = Math.max(-360, (st.r || 0) - 15);
      else if (a === 'right') st.r = Math.min(360, (st.r || 0) + 15);
      else if (a === 'del') { inv.stickers.splice(idx, 1); setSel(null); }
      queuePaint();
      markDirty();
    });

    const photoInput = form.querySelector('#photoInput');
    if (photoInput) {
      photoInput.addEventListener('change', async (e) => {
        const input = e.target;
        const file = input.files && input.files[0];
        input.value = '';
        if (!file) return;
        if (!/^image\//.test(file.type)) { toast('Elige una imagen (JPG o PNG).'); return; }
        try {
          const url = await fileToDataUrl(file);
          const prev = data.photo;
          data.photo = url;
          const res = saveNow(false);
          if (!res.ok) data.photo = prev; // no cabe: se conserva la foto anterior
          refreshPhotoUI();
          queuePaint();
        } catch (err) {
          toast('No pudimos leer esa imagen. Prueba con otra.');
        }
      });
    }

    app.querySelector('#saveBtn').addEventListener('click', () => saveNow(true));

    // Reproduce la invitación como la verá un invitado (con animaciones).
    app.querySelector('#playBtn').addEventListener('click', () => {
      setSel(null);
      root.scrollTop = 0;
      paint(true);
    });

    editor.querySelector('.tabs').addEventListener('click', (e) => {
      const b = e.target.closest('[data-tab]');
      if (!b) return;
      editor.setAttribute('data-tab', b.getAttribute('data-tab'));
      editor.querySelectorAll('.tabs button').forEach((x) => x.classList.toggle('is-active', x === b));
      window.scrollTo(0, 0);
    });

    function onHide() { if (dirty) saveNow(false); }
    window.addEventListener('pagehide', onHide);

    leave = function () {
      window.removeEventListener('pagehide', onHide);
      if (dirty) saveNow(false);
      clearTimeout(saveTimer);
      if (stopCount) stopCount();
    };
  }

  window.addEventListener('hashchange', route);
  route();
})();
