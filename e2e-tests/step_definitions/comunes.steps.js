'use strict';

/**
 * STEPS COMPARTIDOS — Aserciones genéricas reutilizadas en todos los features.
 * IMPORTANTE: Solo definir aquí pasos que son genuinamente reutilizables.
 * No duplicar ninguna definición en otros archivos de steps.
 */

const { Then } = require('@cucumber/cucumber');
const assert = require('assert');
const { esperarHastaQue } = require('../support/polling');

// ─── Aserción genérica de código HTTP ────────────────────────────────────────
Then('la respuesta debe tener código {int}', function (codigoEsperado) {
  assert.strictEqual(
    this.response.status,
    codigoEsperado,
    `Se esperaba código HTTP ${codigoEsperado} pero se obtuvo ${this.response.status}. ` +
    `Cuerpo: ${JSON.stringify(this.response.data)}`
  );
});

// ─── Aserción asincrónica compartida: notificación por empleado ───────────────
Then(
  'eventualmente el servicio de notificaciones debe haber registrado una notificación de tipo {string} para el empleado',
  async function (tipo) {
    // El ID puede estar en employeeId (onboarding) o en _idEliminado (offboarding)
    const employeeId = this._idEliminado || this.employeeId;
    const adminToken = this.token;

    assert.ok(employeeId, 'No se tiene el ID del empleado para verificar la notificación');

    await esperarHastaQue(async () => {
      const axios = require('axios');
      const res = await axios.get(`${this.urls.notifications}/notifications/${employeeId}`, {
        headers: { Authorization: `Bearer ${adminToken}` },
        validateStatus: () => true,
      });
      if (res.status !== 200) return false;
      return Array.isArray(res.data) && res.data.some((n) => n.type === tipo);
    });
  }
);
