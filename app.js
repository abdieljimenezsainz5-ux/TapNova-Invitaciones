/*
 * app.js — Pantallas de la plataforma: galería de plantillas y editor.
 *
 * Rutas (se leen del "#" de la dirección, así funcionan en cualquier hosting estático):
 *   #/                 → galería (inicio)
 *   #/nueva/<plantilla>→ editor con una invitación nueva (aún sin guardar)
 *   #/editar/<id>      → editor con un borrador guardado
 */
(function () {
  'use strict';

  const Catalog = window.TapNova.Catalog;
  const Storage = window.TapNova.Storage;
  const Render = window.TapNova.Render;
  const esc = Render.esc;

  const app = document.getElementById('app');
  const toastEl = document.getElementById('toast');
  const BASE_TITLE = 'Tap Nova Invitaciones — Crea tu invitación digital';

  let leave = null;          // limpieza de la pantalla actual
  let galleryFilter = 'todas';
  let toastTimer = null;

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

  /* ======================= Enrutador ======================= */
  function route() {
    if (leave) { leave(); leave = null; }
    app.onclick = null; app.oninput = null; app.onchange = null;

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
    }
    if (location.hash && !/^#\/?$/.test(location.hash)) history.replaceState(null, '', '#/');
    showGallery();
    window.scrollTo(0, 0);
  }

  /* ======================= Galería ======================= */
  function templateCard(tpl) {
    const cat = Catalog.getCategory(tpl.category);
    const href = '#/nueva/' + encodeURIComponent(tpl.id);
    const preview = tpl.cover
      ? '<img class="cover" src="' + esc(tpl.cover) + '" alt="" loading="lazy">'
      : '<div class="thumb-inner">' +
        Render.render(tpl, { paletteId: tpl.palettes[0].id, data: tpl.defaults() }, { preview: false }) +
        '</div>';
    return (
      '<article class="card">' +
      '<div class="thumb">' + preview +
      '<a class="thumb-link" href="' + href + '" aria-label="Personalizar ' + esc(tpl.name) + '"></a></div>' +
      '<div class="card-body">' +
      '<span class="tag">' + esc(cat ? cat.name : '') + '</span>' +
      '<h3>' + esc(tpl.name) + '</h3>' +
      '<a class="btn btn-ink btn-block" href="' + href + '">Personalizar</a>' +
      '</div></article>'
    );
  }

  function draftItem(inv) {
    const tpl = Catalog.getTemplate(inv.templateId);
    const name = (inv.data && inv.data.names) || 'Sin nombre';
    const open = tpl
      ? '<a class="btn btn-sm btn-ink" href="#/editar/' + encodeURIComponent(inv.id) + '">Abrir</a>'
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
      '<section class="hero"><div class="wrap">' +
      '<p class="eyebrow">Tap Nova Invitaciones</p>' +
      '<h1>Crea tu <em>invitación digital</em></h1>' +
      '<p class="lead">Elige una plantilla, escribe los datos de tu evento y mira cómo queda en tu celular al instante. Sin diseñar nada desde cero.</p>' +
      '<button class="btn btn-brand" type="button" data-act="scroll">Ver plantillas</button>' +
      '<ol class="steps"><li>Elige</li><li>Escribe tus datos</li><li>Mira la vista previa</li><li>Guarda tu borrador</li></ol>' +
      '</div></section>' +
      (drafts.length
        ? '<section class="section wrap"><h2>Mis borradores</h2>' +
          '<p class="section-sub">Se guardan solo en este dispositivo.</p>' +
          (Storage.isPersistent() ? '' : '<p class="notice">Tu navegador no permite guardar de forma permanente: los borradores se perderán al cerrar esta pestaña.</p>') +
          '<ul class="drafts">' + drafts.map(draftItem).join('') + '</ul></section>'
        : '') +
      '<section class="section wrap" id="plantillas-sec"><h2>Plantillas</h2>' +
      '<p class="section-sub">Elige la que más te guste. Después puedes cambiar textos, foto y colores.</p>' +
      '<div class="chips" role="group" aria-label="Filtrar por tipo de evento">' + chips + '</div>' +
      '<div class="grid" id="grid"></div></section>' +
      '<footer class="site-foot wrap">Tap Nova Studio · Marketing que se toca</footer>';

    let stopThumbs = null;
    function paintGrid() {
      if (stopThumbs) stopThumbs();
      const grid = document.getElementById('grid');
      const items = Catalog.TEMPLATES.filter((t) => galleryFilter === 'todas' || t.category === galleryFilter);
      grid.innerHTML = items.length
        ? items.map(templateCard).join('')
        : '<p class="empty">Aún no hay plantillas en esta categoría. ¡Pronto habrá más!</p>';
      stopThumbs = fitThumbs(grid);
    }
    paintGrid();
    leave = () => { if (stopThumbs) stopThumbs(); };

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

  /* ======================= Editor ======================= */
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

  function fieldsHtml(fields, data) {
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
    return out.join('');
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

  function showEditor(tpl, inv, isNew) {
    document.title = 'Editando ' + tpl.name + ' — Tap Nova';
    const fields = Catalog.resolveFields(tpl);
    const textKeys = new Set(fields.filter((f) => f.type !== 'image').map((f) => f.key));
    const data = inv.data;

    const swatches = tpl.palettes.map((p) =>
      '<button class="swatch" type="button" role="radio" aria-checked="' + (p.id === inv.paletteId) + '" data-palette="' + esc(p.id) + '">' +
      '<i style="background:linear-gradient(135deg,' + p.vars['--accent'] + ' 50%,' + p.vars['--bg'] + ' 50%)"></i>' + esc(p.name) + '</button>'
    ).join('');

    app.innerHTML =
      '<div class="editor" data-tab="edit">' +
      '<div class="editor-bar"><div class="wrap">' +
      '<a class="back" href="#/">← Plantillas</a>' +
      '<div class="bar-title"><strong>' + esc(tpl.name) + '</strong><span class="status">Borrador</span></div>' +
      '<span class="save-state" id="saveState" aria-live="polite"></span>' +
      '<button class="btn btn-brand btn-sm" type="button" id="saveBtn">Guardar</button>' +
      '</div></div>' +
      '<div class="editor-grid">' +
      '<form class="panel form" id="form" autocomplete="off" novalidate>' +
      '<h2>Personaliza tu invitación</h2>' +
      fieldsHtml(fields, data) +
      '<div class="field"><span class="field-label" id="palLabel">Colores</span>' +
      '<div class="swatches" role="radiogroup" aria-labelledby="palLabel">' + swatches + '</div></div>' +
      '<div class="publish-box"><button class="btn btn-block" type="button" disabled>Publicar y compartir</button>' +
      '<p>Próximamente podrás publicar tu invitación con un enlace único y compartirla por WhatsApp. Por ahora es un borrador guardado solo en este dispositivo.</p></div>' +
      '</form>' +
      '<section class="panel preview" aria-label="Vista previa">' +
      '<p class="preview-note">Vista previa · así la verán tus invitados</p>' +
      '<div class="phone"><div id="inv-root"></div></div>' +
      '</section></div>' +
      '<nav class="tabs" aria-label="Cambiar entre editar y vista previa">' +
      '<button type="button" class="is-active" data-tab="edit">Editar</button>' +
      '<button type="button" data-tab="preview">Vista previa</button></nav>' +
      '</div>';

    const editor = app.querySelector('.editor');
    const form = app.querySelector('#form');
    const root = app.querySelector('#inv-root');
    const saveStateEl = app.querySelector('#saveState');
    const photoThumb = app.querySelector('#photoThumb');
    const photoRemove = app.querySelector('#photoRemove');

    let stopCount = null;
    let paintQueued = false;
    let dirty = false;
    let saveTimer = null;
    let saved = !isNew;

    function paint() {
      paintQueued = false;
      if (stopCount) stopCount();
      root.innerHTML = Render.render(tpl, inv, { preview: true });
      stopCount = Render.mount(root);
    }
    function queuePaint() {
      if (!paintQueued) { paintQueued = true; requestAnimationFrame(paint); }
    }

    function setSaveState(text) { saveStateEl.textContent = text; }

    // Guarda el borrador. Devuelve el resultado de Storage.save.
    function saveNow(manual) {
      clearTimeout(saveTimer);
      const res = Storage.save(inv);
      if (res.ok) {
        dirty = false;
        saved = true;
        // Una invitación nueva pasa a tener su propia dirección (#/editar/id).
        if (location.hash.indexOf('#/nueva/') === 0) history.replaceState(null, '', '#/editar/' + encodeURIComponent(inv.id));
        setSaveState(res.persistent ? 'Borrador guardado' : 'Guardado solo en esta pestaña');
        if (manual) toast(res.persistent ? 'Borrador guardado en este dispositivo.' : 'Guardado temporalmente: tu navegador no permite guardar de forma permanente.');
      } else {
        setSaveState('No se pudo guardar');
        toast(res.reason === 'quota'
          ? 'No hay espacio en este dispositivo. Prueba con una foto más pequeña o elimina borradores.'
          : 'No se pudo guardar el borrador.');
      }
      return res;
    }
    function markDirty() {
      dirty = true;
      setSaveState('Guardando…');
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
      const has = typeof data.photo === 'string' && data.photo.indexOf('data:image/') === 0;
      photoThumb.innerHTML = has ? '<img alt="" src="' + esc(data.photo) + '">' : 'Sin foto';
      photoRemove.hidden = !has;
    }

    setSaveState(isNew ? 'Aún sin guardar' : 'Borrador guardado');
    validate('mapsUrl');
    validate('whatsapp');
    refreshPhotoUI();
    paint();

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
      }
    });

    form.querySelector('#photoInput').addEventListener('change', async (e) => {
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

    app.querySelector('#saveBtn').addEventListener('click', () => saveNow(true));

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
