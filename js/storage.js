/*
 * storage.js — Dónde se guardan las invitaciones.
 *
 * VERSIÓN 1: todo se guarda en el propio teléfono o computadora de la persona
 * (localStorage del navegador). Eso significa:
 *   - No cuesta nada y no necesita internet ni cuentas.
 *   - Los borradores solo existen en ESE navegador. Si borra los datos del
 *     navegador o cambia de teléfono, se pierden.
 *   - Un borrador NO está publicado: nadie más puede abrirlo.
 *
 * Este archivo es la ÚNICA parte que habrá que cambiar cuando se integre una
 * base de datos: mientras conserve las mismas funciones, el resto de la
 * plataforma no se entera.
 *
 * Estados de una invitación (campo "status"):
 *   "draft"     → borrador guardado (lo único que existe hoy)
 *   "published" → publicada con enlace único (reservado para una etapa futura)
 * La "vista previa" no es un estado guardado: es solo cómo se ve el borrador
 * dentro del editor.
 */
(function (global) {
  'use strict';

  const PREFIX = 'tapnova:inv:v1:';
  const SCHEMA_VERSION = 1;

  // Si el navegador no permite localStorage (ej. modo privado estricto),
  // se usa memoria temporal y se avisa en pantalla.
  let backend;
  let persistent = true;
  try {
    const probe = '__tapnova_probe__';
    global.localStorage.setItem(probe, '1');
    global.localStorage.removeItem(probe);
    backend = global.localStorage;
  } catch (e) {
    persistent = false;
    const mem = {};
    backend = {
      get length() { return Object.keys(mem).length; },
      key: (i) => Object.keys(mem)[i] || null,
      getItem: (k) => (k in mem ? mem[k] : null),
      setItem: (k, v) => { mem[k] = String(v); },
      removeItem: (k) => { delete mem[k]; }
    };
  }

  function uid() {
    if (global.crypto && typeof global.crypto.randomUUID === 'function') {
      return global.crypto.randomUUID();
    }
    return 'i' + Date.now().toString(36) + Math.random().toString(36).slice(2, 10);
  }

  function now() {
    return new Date().toISOString();
  }

  function list() {
    const out = [];
    for (let i = 0; i < backend.length; i++) {
      const key = backend.key(i);
      if (key && key.indexOf(PREFIX) === 0) {
        try {
          const inv = JSON.parse(backend.getItem(key));
          if (inv && inv.id && inv.templateId) out.push(inv);
        } catch (e) { /* registro dañado: se ignora */ }
      }
    }
    return out.sort((a, b) => String(b.updatedAt).localeCompare(String(a.updatedAt)));
  }

  function get(id) {
    try {
      const raw = backend.getItem(PREFIX + id);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  }

  // Devuelve { ok: true } o { ok: false, reason: 'quota' | 'error' }
  function save(inv) {
    inv.updatedAt = now();
    try {
      backend.setItem(PREFIX + inv.id, JSON.stringify(inv));
      return { ok: true, persistent };
    } catch (e) {
      const quota = e && (e.name === 'QuotaExceededError' || e.code === 22 || e.code === 1014);
      return { ok: false, reason: quota ? 'quota' : 'error' };
    }
  }

  // Arma una invitación NUEVA a partir de una plantilla, SIN guardarla todavía
  // (así, si la persona solo mira una plantilla y regresa, no queda basura).
  // defaults() devuelve un objeto nuevo cada vez, así que dos invitaciones
  // de la misma plantilla nunca comparten datos.
  function build(tpl) {
    const t = now();
    return {
      schemaVersion: SCHEMA_VERSION,
      id: uid(),
      templateId: tpl.id,
      status: 'draft',
      paletteId: tpl.palettes[0].id,
      data: tpl.defaults(),
      publication: null, // futuro: { slug, publishedAt, expiresAt }
      createdAt: t,
      updatedAt: t
    };
  }

  function duplicate(id) {
    const src = get(id);
    if (!src) return null;
    const t = now();
    const copy = JSON.parse(JSON.stringify(src)); // copia profunda: nada se comparte
    copy.id = uid();
    copy.status = 'draft';
    copy.publication = null;
    copy.createdAt = t;
    const res = save(copy);
    return res.ok ? copy : null;
  }

  function remove(id) {
    backend.removeItem(PREFIX + id);
  }

  global.TapNova = global.TapNova || {};
  global.TapNova.Storage = { list, get, save, build, duplicate, remove, isPersistent: () => persistent };
})(typeof window !== 'undefined' ? window : globalThis);
