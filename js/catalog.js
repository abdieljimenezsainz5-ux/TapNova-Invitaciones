/*
 * catalog.js — Catálogo de categorías, campos y plantillas.
 *
 * Aquí SOLO hay datos (la "definición" de cada plantilla). Los datos de cada
 * invitación real (nombre, fecha, foto...) viven aparte, en storage.js.
 *
 * Para agregar una plantilla nueva:
 *   1. Copia un bloque de TEMPLATES y cambia id, nombre, categoría, textos y paletas.
 *   2. Si quieres un diseño distinto, usa un "layout" nuevo y agrega sus estilos
 *      en css/templates.css (solo CSS, no hay que tocar el código JavaScript).
 * Para agregar una categoría nueva: añade una línea a CATEGORIES.
 */
(function (global) {
  'use strict';

  const CATEGORIES = [
    { id: 'infantil', name: 'Cumpleaños infantiles' },
    { id: 'adultos', name: 'Cumpleaños de adultos' },
    { id: 'xv', name: 'XV años' },
    { id: 'boda', name: 'Bodas' },
    { id: 'graduacion', name: 'Graduaciones' },
    { id: 'bautizo', name: 'Bautizos' },
    { id: 'comunion', name: 'Primera comunión' },
    { id: 'aniversario', name: 'Aniversarios' },
    { id: 'babyshower', name: 'Baby shower' }
  ];

  // Biblioteca de campos que cualquier plantilla puede usar.
  // Cada plantilla puede cambiar la etiqueta o el texto de ejemplo (placeholder).
  const FIELDS = {
    names: { type: 'text', label: 'Nombre(s)', max: 60 },
    motive: { type: 'text', label: 'Edad o motivo del evento', max: 50 },
    date: { type: 'date', label: 'Fecha' },
    time: { type: 'time', label: 'Hora' },
    venue: { type: 'text', label: 'Nombre del lugar', max: 60 },
    address: { type: 'textarea', rows: 2, label: 'Dirección', max: 160 },
    mapsUrl: {
      type: 'url',
      label: 'Enlace de Google Maps',
      placeholder: 'https://maps.app.goo.gl/...',
      hint: 'Opcional. Si lo dejas vacío, usaremos la dirección para buscar el lugar.'
    },
    message: { type: 'textarea', rows: 4, label: 'Mensaje de invitación', max: 400 },
    photo: { type: 'image', label: 'Fotografía principal' },
    rsvpText: {
      type: 'textarea',
      rows: 2,
      label: 'Mensaje de confirmación',
      max: 140,
      hint: 'Es el texto que se escribirá solo en el WhatsApp de tu invitado al confirmar.'
    },
    whatsapp: {
      type: 'tel',
      label: 'WhatsApp para confirmar asistencia',
      placeholder: '10 dígitos, ej. 6671234567',
      hint: 'Con este número se activa el botón "Confirmar asistencia".'
    }
  };

  function inDays(n) {
    const d = new Date();
    d.setDate(d.getDate() + n);
    const p = (x) => String(x).padStart(2, '0');
    return d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate());
  }

  // Secciones disponibles hoy: hero, message, details, countdown, location, rsvp.
  // (Música de fondo y galería de imágenes se agregarán después como secciones nuevas.)
  const TEMPLATES = [
    {
      id: 'fiesta-confeti',
      name: 'Fiesta Confeti',
      category: 'infantil',
      cover: null, // null = se genera una miniatura automática de la propia plantilla
      layout: 'confeti',
      kicker: '¡Estás invitado!',
      sections: ['hero', 'message', 'details', 'countdown', 'location', 'rsvp'],
      fields: [
        { key: 'names', label: 'Nombre del festejado', placeholder: 'Sofía' },
        { key: 'motive', placeholder: '¡Cumplo 6 años!' },
        { key: 'photo' },
        { key: 'date' },
        { key: 'time' },
        { key: 'venue', placeholder: 'Salón Mundo Mágico' },
        { key: 'address' },
        { key: 'mapsUrl' },
        { key: 'message' },
        { key: 'whatsapp' },
        { key: 'rsvpText' }
      ],
      palettes: [
        { id: 'cielo', name: 'Cielo', vars: { '--bg': '#EAF6FF', '--paper': '#FFFFFF', '--ink': '#1B2B4B', '--muted': '#5B6B8A', '--accent': '#FF6B4A', '--accent-ink': '#FFFFFF', '--accent-2': '#FFC93C' } },
        { id: 'fresa', name: 'Fresa', vars: { '--bg': '#FFEFF3', '--paper': '#FFFFFF', '--ink': '#4A1D33', '--muted': '#85566B', '--accent': '#F0457A', '--accent-ink': '#FFFFFF', '--accent-2': '#7FD6C2' } },
        { id: 'menta', name: 'Menta', vars: { '--bg': '#E8F8F1', '--paper': '#FFFFFF', '--ink': '#12382B', '--muted': '#4F7667', '--accent': '#1FA97A', '--accent-ink': '#FFFFFF', '--accent-2': '#FFB84D' } }
      ],
      defaults: () => ({
        names: 'Sofía',
        motive: '¡Cumplo 6 años!',
        photo: '',
        date: inDays(21),
        time: '16:00',
        venue: 'Salón Mundo Mágico',
        address: 'Av. de las Flores 123, Col. Centro',
        mapsUrl: '',
        message: '¡Ven a celebrar conmigo! Habrá pastel, piñata, juegos y muchas sorpresas. ¡No faltes!',
        whatsapp: '',
        rsvpText: 'Hola, confirmo mi asistencia a la fiesta de Sofía 🎉'
      })
    },

    {
      id: 'xv-dorado',
      name: 'XV Dorado',
      category: 'xv',
      cover: null,
      layout: 'gala',
      kicker: 'Te invito a celebrar',
      sections: ['hero', 'message', 'details', 'countdown', 'location', 'rsvp'],
      fields: [
        { key: 'names', label: 'Nombre de la quinceañera', placeholder: 'Valeria Ramírez' },
        { key: 'motive', placeholder: 'Mis XV años' },
        { key: 'photo' },
        { key: 'date' },
        { key: 'time' },
        { key: 'venue', placeholder: 'Jardín Las Palmas' },
        { key: 'address' },
        { key: 'mapsUrl' },
        { key: 'message' },
        { key: 'whatsapp' },
        { key: 'rsvpText' }
      ],
      palettes: [
        { id: 'medianoche', name: 'Medianoche', vars: { '--bg': '#0F1226', '--paper': '#171B38', '--ink': '#F3EBD7', '--muted': '#B7B0C9', '--accent': '#D8B65A', '--accent-ink': '#1A1530', '--accent-2': '#8F7BD6' } },
        { id: 'vino', name: 'Vino', vars: { '--bg': '#2A0F1A', '--paper': '#3A1624', '--ink': '#F7E9E1', '--muted': '#D2AFA8', '--accent': '#E3BE7B', '--accent-ink': '#2A0F1A', '--accent-2': '#C25A74' } },
        { id: 'esmeralda', name: 'Esmeralda', vars: { '--bg': '#0B2A24', '--paper': '#12382F', '--ink': '#F1EBDD', '--muted': '#A9C4B8', '--accent': '#D9B866', '--accent-ink': '#0B2A24', '--accent-2': '#5FB89A' } }
      ],
      defaults: () => ({
        names: 'Valeria Ramírez',
        motive: 'Mis XV años',
        photo: '',
        date: inDays(45),
        time: '19:00',
        venue: 'Jardín Las Palmas',
        address: 'Camino Real 456, Fracc. Las Palmas',
        mapsUrl: '',
        message: 'Con la bendición de Dios y de mis padres, te invito a celebrar conmigo una noche inolvidable en este día tan especial.',
        whatsapp: '',
        rsvpText: 'Hola, confirmo mi asistencia a los XV años de Valeria ✨'
      })
    },

    {
      id: 'boda-lino',
      name: 'Boda Lino',
      category: 'boda',
      cover: null,
      layout: 'lino',
      kicker: 'Con alegría los invitamos',
      sections: ['hero', 'message', 'details', 'countdown', 'location', 'rsvp'],
      fields: [
        { key: 'names', label: 'Nombres de los novios', placeholder: 'Camila & Andrés' },
        { key: 'motive', placeholder: 'Nos casamos' },
        { key: 'photo' },
        { key: 'date' },
        { key: 'time' },
        { key: 'venue', placeholder: 'Hacienda Santa Lucía' },
        { key: 'address' },
        { key: 'mapsUrl' },
        { key: 'message' },
        { key: 'whatsapp' },
        { key: 'rsvpText' }
      ],
      palettes: [
        { id: 'marfil', name: 'Marfil', vars: { '--bg': '#F6F1E7', '--paper': '#FFFDF8', '--ink': '#2D2A26', '--muted': '#7B746A', '--accent': '#A8845A', '--accent-ink': '#FFFFFF', '--accent-2': '#D9C7A6' } },
        { id: 'salvia', name: 'Salvia', vars: { '--bg': '#EEF1EA', '--paper': '#FBFCF8', '--ink': '#27322B', '--muted': '#6E7B71', '--accent': '#6F8F7A', '--accent-ink': '#FFFFFF', '--accent-2': '#C9D5C4' } },
        { id: 'rosa', name: 'Rosa polvo', vars: { '--bg': '#F8EEEC', '--paper': '#FFFBFA', '--ink': '#3A2A2A', '--muted': '#86706F', '--accent': '#B8707A', '--accent-ink': '#FFFFFF', '--accent-2': '#E8C7C3' } }
      ],
      defaults: () => ({
        names: 'Camila & Andrés',
        motive: 'Nos casamos',
        photo: '',
        date: inDays(90),
        time: '17:30',
        venue: 'Hacienda Santa Lucía',
        address: 'Carretera a la Presa km 8, Santa Lucía',
        mapsUrl: '',
        message: 'Hoy empieza nuestra historia favorita y queremos compartirla contigo. Tu presencia será nuestro mejor regalo.',
        whatsapp: '',
        rsvpText: 'Hola, confirmo mi asistencia a la boda de Camila y Andrés 💍'
      })
    }
  ];

  function getTemplate(id) {
    return TEMPLATES.find((t) => t.id === id) || null;
  }

  function getCategory(id) {
    return CATEGORIES.find((c) => c.id === id) || null;
  }

  // Une la definición de cada campo de la plantilla con la biblioteca FIELDS.
  function resolveFields(tpl) {
    return tpl.fields
      .map((f) => {
        const base = FIELDS[f.key];
        return base ? Object.assign({}, base, f) : null;
      })
      .filter(Boolean);
  }

  global.TapNova = global.TapNova || {};
  global.TapNova.Catalog = {
    CATEGORIES,
    TEMPLATES,
    FIELDS,
    getTemplate,
    getCategory,
    resolveFields
  };
})(typeof window !== 'undefined' ? window : globalThis);
