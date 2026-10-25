/*
 * catalog.js — Catálogo de categorías, campos y plantillas.
 *
 * Aquí SOLO hay datos (la "definición" de cada plantilla). Los datos de cada
 * invitación real (nombre, fecha, foto, stickers...) viven aparte, en storage.js.
 *
 * Para agregar una plantilla nueva:
 *   1. Copia un bloque de TEMPLATES y cambia id, nombre, categoría, textos, paletas.
 *   2. "stickers" = los stickers que se ofrecen en el editor.
 *      "startStickers" = los que ya vienen puestos (x, y en % de la portada; s tamaño; r giro).
 *      "floaters" = adornos que flotan solos en la portada.
 *   3. Si quieres un diseño distinto, usa un "layout" nuevo y agrega sus estilos
 *      en css/templates.css (solo CSS, no hay que tocar el código JavaScript).
 * Para agregar una categoría nueva: añade una línea a CATEGORIES.
 */
(function (global) {
  'use strict';

  const CATEGORIES = [
    { id: 'infantil', name: 'Cumpleaños infantiles' },
    { id: 'halloween', name: 'Halloween' },
    { id: 'adultos', name: 'Cumpleaños de adultos' },
    { id: 'xv', name: 'XV años' },
    { id: 'boda', name: 'Bodas' },
    { id: 'graduacion', name: 'Graduaciones' },
    { id: 'bautizo', name: 'Bautizos' },
    { id: 'comunion', name: 'Primera comunión' },
    { id: 'aniversario', name: 'Aniversarios' },
    { id: 'babyshower', name: 'Baby shower' }
  ];

  const FIELDS = {
    names: { type: 'text', label: 'Nombre(s)', max: 60 },
    motive: { type: 'text', label: 'Edad o motivo del evento', max: 50 },
    age: { type: 'text', label: 'Número grande (edad)', max: 3, placeholder: '20', hint: 'Opcional. Se muestra en grande en esta plantilla.' },
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

  // Stickers que se ofrecen en todas las plantillas (después de los propios de cada una).
  const GENERAL_STICKERS = ['⭐', '❤️', '🎈', '🎉', '✨', '🎀', '🌈', '🦋', '🌸', '🎁'];

  function inDays(n) {
    const d = new Date();
    d.setDate(d.getDate() + n);
    const p = (x) => String(x).padStart(2, '0');
    return d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate());
  }

  // Próximo 31 de octubre (este año si aún no pasa, si no el siguiente).
  function nextHalloween() {
    const n = new Date();
    let y = n.getFullYear();
    if (new Date(y, 9, 31, 23, 59).getTime() < n.getTime()) y++;
    return y + '-10-31';
  }

  // Mismos campos para todas las plantillas de hoy; cada una cambia etiquetas y ejemplos.
  function standardFields(namesLabel, namesPh, motivePh, venuePh, withAge) {
    const list = [
      { key: 'names', label: namesLabel, placeholder: namesPh },
      { key: 'motive', placeholder: motivePh }
    ];
    if (withAge) list.push({ key: 'age' });
    return list.concat([
      { key: 'photo' },
      { key: 'date' },
      { key: 'time' },
      { key: 'venue', placeholder: venuePh },
      { key: 'address' },
      { key: 'mapsUrl' },
      { key: 'message' },
      { key: 'whatsapp' },
      { key: 'rsvpText' }
    ]);
  }

  const SECTIONS_STD = ['hero', 'message', 'details', 'countdown', 'location', 'rsvp'];

  // Variables de color de cada paleta:
  // --bg fondo · --paper tarjetas · --ink texto · --muted texto suave · --accent color principal
  // --accent-ink texto sobre el color principal · --accent-2 secundario · --pop-1/--pop-2 colores extra
  const TEMPLATES = [
    /* ---------- Estilo "papel troquelado" (como las invitaciones físicas) ---------- */
    {
      id: 'baby-granja',
      name: 'Baby Shower Granja',
      category: 'babyshower',
      cover: null,
      layout: 'granja',
      kicker: 'Te invitamos a',
      photoOptional: true,
      floaters: [],
      sections: SECTIONS_STD,
      stickers: ['☀️', '☁️', '🚜', '🐴', '🐮', '🐷', '🐑', '🤠', '🌾', '🍼', '🧸', '👶', '🐔', '🥕'],
      startStickers: [
        { e: '☁️', x: 70, y: 8, s: 76, r: 0 },
        { e: '☀️', x: 83, y: 5, s: 52, r: 0 },
        { e: '🎈', x: 24, y: 50, s: 44, r: -10 },
        { e: '🚜', x: 24, y: 89, s: 96, r: 0 },
        { e: '🐴', x: 52, y: 93, s: 56, r: 0 },
        { e: '🤠', x: 72, y: 80, s: 64, r: 4 },
        { e: '🐮', x: 83, y: 92, s: 58, r: 0 }
      ],
      fields: standardFields('Nombre del festejado o de los papás', 'Luis Orlando', 'Mi baby shower', 'Salón Los Girasoles'),
      palettes: [
        { id: 'azul', name: 'Azul', vars: { '--bg': '#EDF1F5', '--paper': '#FFFFFF', '--ink': '#5A3E2B', '--muted': '#8A7B6E', '--accent': '#5F88AE', '--accent-ink': '#FFFFFF', '--accent-2': '#D9C7A6', '--pop-1': '#A9C0D6', '--pop-2': '#CDBB9A' } },
        { id: 'rosa', name: 'Rosa', vars: { '--bg': '#F9EEF0', '--paper': '#FFFFFF', '--ink': '#5A3A3A', '--muted': '#8F7474', '--accent': '#C9748B', '--accent-ink': '#FFFFFF', '--accent-2': '#E6C9A5', '--pop-1': '#F0B9C6', '--pop-2': '#D9C2A0' } },
        { id: 'menta', name: 'Menta', vars: { '--bg': '#EAF3EE', '--paper': '#FFFFFF', '--ink': '#46422E', '--muted': '#7C806C', '--accent': '#5E9B80', '--accent-ink': '#FFFFFF', '--accent-2': '#E0CFA2', '--pop-1': '#A8CFBC', '--pop-2': '#D5C79B' } }
      ],
      defaults: () => ({
        names: 'Luis Orlando',
        motive: 'Mi baby shower',
        photo: '',
        date: inDays(30),
        time: '16:00',
        venue: 'Salón Los Girasoles',
        address: 'Calle Girasol 210, Col. Jardines',
        mapsUrl: '',
        message: 'Estamos muy felices de compartir la llegada de nuestro pequeño vaquero. ¡Acompáñanos a celebrarlo!',
        whatsapp: '',
        rsvpText: 'Hola, confirmo mi asistencia al baby shower 🤠'
      })
    },

    {
      id: 'coctel-rosa',
      name: 'Cóctel Rosa',
      category: 'adultos',
      cover: null,
      layout: 'coctel',
      kicker: 'Celebra conmigo',
      photoOptional: true,
      floaters: [],
      sections: SECTIONS_STD,
      stickers: ['🍸', '🫒', '🍾', '🥂', '💸', '💵', '🎀', '🌟', '💅', '👠', '💄', '🍒', '🍓', '🛍️', '🪩'],
      startStickers: [
        { e: '🫒', x: 20, y: 9, s: 52, r: -25 },
        { e: '⭐', x: 82, y: 11, s: 56, r: 12 },
        { e: '🌟', x: 91, y: 20, s: 38, r: 0 },
        { e: '💸', x: 20, y: 84, s: 62, r: -10 },
        { e: '🍸', x: 81, y: 72, s: 88, r: 8 },
        { e: '🎀', x: 74, y: 82, s: 42, r: 0 }
      ],
      fields: standardFields('Nombre de la festejada', 'Fernanda', 'Birthday', 'Terraza Aurora', true),
      palettes: [
        { id: 'oliva', name: 'Oliva', vars: { '--bg': '#F1F1E4', '--paper': '#FFFFFF', '--ink': '#5B3A29', '--muted': '#8C7566', '--accent': '#C0436F', '--accent-ink': '#FFFFFF', '--accent-2': '#C79A3B', '--pop-1': '#B3B88F', '--pop-2': '#F7B9CF' } },
        { id: 'lila', name: 'Lila', vars: { '--bg': '#F4EFFA', '--paper': '#FFFFFF', '--ink': '#4B3566', '--muted': '#8574A0', '--accent': '#8E5BD1', '--accent-ink': '#FFFFFF', '--accent-2': '#E0A93B', '--pop-1': '#CDBEEA', '--pop-2': '#F6BEDD' } },
        { id: 'cielo', name: 'Cielo', vars: { '--bg': '#EAF4F8', '--paper': '#FFFFFF', '--ink': '#2F4858', '--muted': '#6F8A99', '--accent': '#2F8FB8', '--accent-ink': '#FFFFFF', '--accent-2': '#E8A33D', '--pop-1': '#A9D4E4', '--pop-2': '#FFC9B8' } }
      ],
      defaults: () => ({
        names: 'Fernanda',
        motive: 'Birthday',
        age: '',
        photo: '',
        date: inDays(24),
        time: '20:00',
        venue: 'Terraza Aurora',
        address: 'Av. del Mar 900, Zona Dorada',
        mapsUrl: '',
        message: 'Brindemos por otro año de vida. Ven con tu mejor look, habrá música, cócteles y mucha diversión.',
        whatsapp: '',
        rsvpText: 'Hola, confirmo mi asistencia al cumpleaños de Fernanda 🍸'
      })
    },

    {
      id: 'collage-rosa',
      name: 'Collage Rosa',
      category: 'infantil',
      cover: null,
      layout: 'collage',
      kicker: 'Ready? Es mi',
      nameStyle: 'ransom', // el nombre se arma con letras recortadas, una por una
      photoOptional: true,
      floaters: [],
      sections: SECTIONS_STD,
      stickers: ['🩷', '💖', '🎀', '💎', '🩴', '👑', '🍭', '🧁', '🎂', '🦄', '💗', '🪩', '👛', '🌺', '🍓'],
      startStickers: [
        { e: '🩴', x: 20, y: 7, s: 64, r: -12 },
        { e: '🩴', x: 44, y: 6, s: 64, r: 8 },
        { e: '🩷', x: 87, y: 8, s: 58, r: 12 },
        { e: '⭐', x: 91, y: 20, s: 44, r: 0 },
        { e: '🌺', x: 12, y: 47, s: 44, r: 0 },
        { e: '💎', x: 89, y: 47, s: 34, r: 0 },
        { e: '🎀', x: 14, y: 90, s: 52, r: -10 }
      ],
      fields: standardFields('Nombre de la festejada', 'Alexya', "It's my birthday", 'Casa de Alexya', true),
      palettes: [
        { id: 'rosa', name: 'Rosa', vars: { '--bg': '#FFE9F2', '--paper': '#FFFFFF', '--ink': '#5A1F3F', '--muted': '#9A5F7F', '--accent': '#E0307F', '--accent-ink': '#FFFFFF', '--accent-2': '#FFC83D', '--pop-1': '#9A6BFF', '--pop-2': '#FFE48A' } },
        { id: 'cielo', name: 'Cielo', vars: { '--bg': '#E5F4FF', '--paper': '#FFFFFF', '--ink': '#18365A', '--muted': '#5F7FA5', '--accent': '#1E88E5', '--accent-ink': '#FFFFFF', '--accent-2': '#FF8FB0', '--pop-1': '#26C6A6', '--pop-2': '#FFF0A8' } },
        { id: 'lila', name: 'Lila', vars: { '--bg': '#F1E9FF', '--paper': '#FFFFFF', '--ink': '#3F2468', '--muted': '#8467B3', '--accent': '#8E4DE0', '--accent-ink': '#FFFFFF', '--accent-2': '#FFB74D', '--pop-1': '#FF5FA2', '--pop-2': '#D8F3A8' } }
      ],
      defaults: () => ({
        names: 'Alexya',
        motive: "It's my birthday",
        age: '2',
        photo: '',
        date: inDays(18),
        time: '17:00',
        venue: 'Casa de Alexya',
        address: 'Calle Las Rosas 45, Col. Primavera',
        mapsUrl: '',
        message: '¡Vamos a celebrar mi cumpleaños con globos, pastel y muchas sorpresas! Te espero.',
        whatsapp: '',
        rsvpText: 'Hola, confirmo mi asistencia al cumpleaños de Alexya 💖'
      })
    },

    {
      id: 'halloween-noche',
      name: 'Noche de Halloween',
      category: 'halloween',
      cover: null,
      layout: 'halloween',
      kicker: '¡Truco o trato!',
      photoOptional: true,
      floaters: ['🦇', '🕸️', '🎃', '👻', '🦇', '🕷️', '💀', '🍬'],
      sections: SECTIONS_STD,
      stickers: ['🎃', '👻', '🦇', '🕷️', '🕸️', '💀', '🧙', '🧛', '🍬', '🍭', '🌙', '🪦', '🔮', '🧟', '🕯️', '🦉'],
      startStickers: [
        { e: '🕸️', x: 9, y: 5, s: 78, r: 0 },
        { e: '🎃', x: 17, y: 91, s: 76, r: -8 },
        { e: '👻', x: 84, y: 89, s: 68, r: 8 }
      ],
      fields: standardFields('Título de la fiesta', 'Noche de Brujas', 'Fiesta de disfraces', 'Casa Embrujada'),
      palettes: [
        { id: 'calabaza', name: 'Calabaza', vars: { '--bg': '#140B24', '--paper': '#24153D', '--ink': '#FFF4E0', '--muted': '#B9A6D6', '--accent': '#FF7A1A', '--accent-ink': '#1A0B2E', '--accent-2': '#FFC83D', '--pop-1': '#9B5CFF', '--pop-2': '#5CFF8A' } },
        { id: 'bruja', name: 'Bruja', vars: { '--bg': '#0E1A14', '--paper': '#16291F', '--ink': '#EFFFE6', '--muted': '#9FC4AC', '--accent': '#7CFF4D', '--accent-ink': '#0A1A10', '--accent-2': '#C58BFF', '--pop-1': '#FF7A1A', '--pop-2': '#FFD23F' } },
        { id: 'fantasma', name: 'Fantasma', vars: { '--bg': '#0F1822', '--paper': '#192634', '--ink': '#F2F8FF', '--muted': '#9DB2C7', '--accent': '#9FD8FF', '--accent-ink': '#0F1822', '--accent-2': '#FF7A1A', '--pop-1': '#B28CFF', '--pop-2': '#FFE08A' } }
      ],
      defaults: () => ({
        names: 'Noche de Brujas',
        motive: 'Fiesta de disfraces',
        photo: '',
        date: nextHalloween(),
        time: '20:00',
        venue: 'Casa Embrujada',
        address: 'Calle del Panteón 13, Col. Las Ánimas',
        mapsUrl: '',
        message: 'Si te atreves, ven a nuestra fiesta de Halloween: disfraces, dulces y muchos sustos. ¡Habrá premio al mejor disfraz!',
        whatsapp: '',
        rsvpText: 'Hola, confirmo mi asistencia a la fiesta de Halloween 🎃'
      })
    },

    /* ---------- Fiestas infantiles interactivas ---------- */
    {
      id: 'fiesta-confeti',
      name: 'Fiesta Confeti',
      category: 'infantil',
      cover: null,
      layout: 'confeti',
      kicker: '¡Estás invitado!',
      floaters: ['🎈', '🎉', '⭐', '🎈', '🎁', '🎈', '✨', '🎂'],
      sections: SECTIONS_STD,
      stickers: ['🎂', '🧁', '🍭', '🦄', '🎊', '🥳', '🪅', '🎠'],
      startStickers: [],
      fields: standardFields('Nombre del festejado', 'Sofía', '¡Cumplo 6 años!', 'Salón Mundo Mágico'),
      palettes: [
        { id: 'arcoiris', name: 'Arcoíris', vars: { '--bg': '#EAF7FF', '--paper': '#FFFFFF', '--ink': '#2B2A4C', '--muted': '#6B6A8C', '--accent': '#FF4F8B', '--accent-ink': '#FFFFFF', '--accent-2': '#FFC83D', '--pop-1': '#2FB8F0', '--pop-2': '#4CCB6A' } },
        { id: 'chicle', name: 'Chicle', vars: { '--bg': '#FFEFF6', '--paper': '#FFFFFF', '--ink': '#4A1D45', '--muted': '#8A5C85', '--accent': '#FF4FA3', '--accent-ink': '#FFFFFF', '--accent-2': '#FFD166', '--pop-1': '#A97BFF', '--pop-2': '#2FD4B5' } },
        { id: 'oceano', name: 'Océano', vars: { '--bg': '#E4FAF6', '--paper': '#FFFFFF', '--ink': '#0F3B4A', '--muted': '#4F7E8C', '--accent': '#00A9CE', '--accent-ink': '#FFFFFF', '--accent-2': '#FFB347', '--pop-1': '#FF6B8B', '--pop-2': '#8E7CFF' } }
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
      id: 'safari-aventura',
      name: 'Safari Aventura',
      category: 'infantil',
      cover: null,
      layout: 'safari',
      kicker: '¡Únete a la aventura!',
      floaters: ['🦁', '🌴', '🐘', '🦒', '🐵', '🦓', '🌿', '🐯'],
      sections: SECTIONS_STD,
      stickers: ['🦁', '🐘', '🦒', '🐵', '🦓', '🐯', '🌴', '🌿', '🐊', '🦜', '🐍', '☀️'],
      startStickers: [],
      fields: standardFields('Nombre del festejado', 'Mateo', '¡Cumplo 4 años!', 'Parque La Selva'),
      palettes: [
        { id: 'sabana', name: 'Sabana', vars: { '--bg': '#FFF3D1', '--paper': '#FFFFFF', '--ink': '#3B2A14', '--muted': '#7C6540', '--accent': '#2E9E5B', '--accent-ink': '#FFFFFF', '--accent-2': '#FFB020', '--pop-1': '#E4572E', '--pop-2': '#8B5E34' } },
        { id: 'selva', name: 'Selva', vars: { '--bg': '#E1F5DF', '--paper': '#FFFFFF', '--ink': '#143A25', '--muted': '#4C7A5E', '--accent': '#1F8A4C', '--accent-ink': '#FFFFFF', '--accent-2': '#FFD23F', '--pop-1': '#FF7A3D', '--pop-2': '#2BB3A3' } },
        { id: 'atardecer', name: 'Atardecer', vars: { '--bg': '#FFE7D9', '--paper': '#FFFFFF', '--ink': '#4A1F14', '--muted': '#8C5A4A', '--accent': '#E8553D', '--accent-ink': '#FFFFFF', '--accent-2': '#FFB84D', '--pop-1': '#8E44AD', '--pop-2': '#2ECC71' } }
      ],
      defaults: () => ({
        names: 'Mateo',
        motive: '¡Cumplo 4 años!',
        photo: '',
        date: inDays(28),
        time: '15:00',
        venue: 'Parque La Selva',
        address: 'Blvd. Los Álamos 800, Col. Jardines',
        mapsUrl: '',
        message: '¡Únete a mi gran aventura en la selva! Habrá juegos, sorpresas y mucho pastel. ¡Ven vestido de explorador!',
        whatsapp: '',
        rsvpText: 'Hola, confirmo mi asistencia a la fiesta de Mateo 🦁'
      })
    },

    {
      id: 'mision-espacial',
      name: 'Misión Espacial',
      category: 'infantil',
      cover: null,
      layout: 'espacial',
      kicker: 'Misión: ¡mi cumpleaños!',
      floaters: ['🚀', '🪐', '⭐', '🌙', '🛸', '🌟', '☄️', '🌎'],
      sections: SECTIONS_STD,
      stickers: ['🚀', '🪐', '🌙', '🛸', '🌟', '☄️', '🌎', '👨‍🚀', '👽', '🌠', '🛰️'],
      startStickers: [],
      fields: standardFields('Nombre del astronauta', 'Leo', '¡Cumplo 7 años!', 'Centro de Eventos Galaxia'),
      palettes: [
        { id: 'galaxia', name: 'Galaxia', vars: { '--bg': '#101746', '--paper': '#1B2566', '--ink': '#F4F6FF', '--muted': '#AEB6E8', '--accent': '#7C5CFF', '--accent-ink': '#FFFFFF', '--accent-2': '#FFD43B', '--pop-1': '#26D0CE', '--pop-2': '#FF6FB5' } },
        { id: 'nebulosa', name: 'Nebulosa', vars: { '--bg': '#2A1049', '--paper': '#3B1A63', '--ink': '#FBF3FF', '--muted': '#C7A9E6', '--accent': '#FF5FA2', '--accent-ink': '#FFFFFF', '--accent-2': '#FFD166', '--pop-1': '#6EE7F9', '--pop-2': '#A78BFA' } },
        { id: 'cohete', name: 'Cohete', vars: { '--bg': '#0B2540', '--paper': '#13365C', '--ink': '#F2F8FF', '--muted': '#9BB9D6', '--accent': '#FF6B35', '--accent-ink': '#FFFFFF', '--accent-2': '#FFD23F', '--pop-1': '#4CC9F0', '--pop-2': '#80ED99' } }
      ],
      defaults: () => ({
        names: 'Leo',
        motive: '¡Cumplo 7 años!',
        photo: '',
        date: inDays(35),
        time: '17:00',
        venue: 'Centro de Eventos Galaxia',
        address: 'Calle Orión 55, Col. Satélite',
        mapsUrl: '',
        message: '¡Prepárate para el despegue! Acompáñame a una misión espacial con juegos, pastel y muchas estrellas.',
        whatsapp: '',
        rsvpText: 'Hola, confirmo mi asistencia a la misión espacial de Leo 🚀'
      })
    },

    /* ---------- Elegantes ---------- */
    {
      id: 'xv-dorado',
      name: 'XV Dorado',
      category: 'xv',
      cover: null,
      layout: 'gala',
      kicker: 'Te invito a celebrar',
      floaters: ['✨', '💫', '✨', '✨'],
      sections: SECTIONS_STD,
      stickers: ['👑', '🦋', '🌹', '💎', '👗', '🥂', '🕊️', '💫', '🌸'],
      startStickers: [],
      fields: standardFields('Nombre de la quinceañera', 'Valeria Ramírez', 'Mis XV años', 'Jardín Las Palmas'),
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
      floaters: [],
      sections: SECTIONS_STD,
      stickers: ['💍', '🤍', '🕊️', '🌿', '🥂', '💐', '🕯️', '🌾'],
      startStickers: [],
      fields: standardFields('Nombres de los novios', 'Camila & Andrés', 'Nos casamos', 'Hacienda Santa Lucía'),
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

  // Stickers que se ofrecen en el editor: los de la plantilla y luego los generales.
  function stickerSet(tpl) {
    const own = tpl.stickers || [];
    return own.concat(GENERAL_STICKERS.filter((e) => own.indexOf(e) < 0));
  }

  global.TapNova = global.TapNova || {};
  global.TapNova.Catalog = {
    CATEGORIES,
    TEMPLATES,
    FIELDS,
    getTemplate,
    getCategory,
    resolveFields,
    stickerSet
  };
})(typeof window !== 'undefined' ? window : globalThis);
