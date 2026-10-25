/*
 * config.js — Datos del negocio. ESTE es el archivo que tú editas.
 *
 *   whatsapp : el WhatsApp de Tap Nova donde te llegarán los pedidos (10 dígitos).
 *   price    : precio por invitación publicada (número, ej. 199). Si lo dejas en null,
 *              la pantalla dirá "precio por confirmar".
 *   currency : moneda, normalmente 'MXN'.
 *   payUrl   : enlace de pago (ej. un "Link de pago" de Mercado Pago o Stripe). Si está
 *              vacío, se muestran las instrucciones de payNote.
 *   payNote  : texto con tus datos de pago (ej. "Transferencia a CLABE ... a nombre de ...").
 */
(function (global) {
  'use strict';
  global.TapNova = global.TapNova || {};
  global.TapNova.Config = {
    studioName: 'Tap Nova Studio',
    whatsapp: '6673457524',
    price: null,
    currency: 'MXN',
    payUrl: '',
    payNote: 'Paga por transferencia:\nCLABE: 722969010466377184\nBeneficiario: Abdiel Josue Jimenez Sainz\nInstitución: Mercado Pago W\nDespués de pagar, envíanos tu diseño en el paso 2.'
  };
})(typeof window !== 'undefined' ? window : globalThis);
