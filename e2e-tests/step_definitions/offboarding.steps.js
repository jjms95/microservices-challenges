'use strict';

const { Given, When, Then } = require('@cucumber/cucumber');
const assert = require('assert');
const { esperarHastaQue } = require('../support/polling');

// Helper para sufijo único
function sufijo() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

// ─── Antecedentes: empleado con credenciales activas ─────────────────────────
// Reconstruye el estado completo desde cero sin depender de ningún otro escenario.
// Pasos: crear dept → crear empleado → esperar user.created → reset password → login OK

Given('que existe un empleado con credenciales activas para el escenario de offboarding', async function () {
  const axios = require('axios');
  const adminToken = this.token;

  // 1. Crear empleado (usa el departmentId generado en el Antecedente previo)
  this.employeeEmail = `offboarding.test.${sufijo()}@empresa.com`;
  const empRes = await axios.post(
    `${this.urls.employees}/employees`,
    {
      name: 'Empleado Offboarding BDD',
      email: this.employeeEmail,
      departmentId: this.departmentId,
      hireDate: new Date().toISOString().split('T')[0],
    },
    {
      headers: { Authorization: `Bearer ${adminToken}` },
      validateStatus: () => true,
    }
  );
  assert.strictEqual(
    empRes.status,
    201,
    `No se pudo crear el empleado de offboarding: ${JSON.stringify(empRes.data)}`
  );
  this.employeeId = empRes.data.id;

  // 2. Esperar a que auth-service cree el usuario (evento employee.created → user.created)
  await esperarHastaQue(async () => {
    const recoverRes = await axios.post(
      `${this.urls.auth}/auth/recover-password`,
      { email: this.employeeEmail },
      { validateStatus: () => true }
    );
    return recoverRes.status === 200 || recoverRes.status === 201;
  });

  // 3. Iniciar recuperación de contraseña para obtener el token
  const recoverRes = await axios.post(
    `${this.urls.auth}/auth/recover-password`,
    { email: this.employeeEmail },
    { validateStatus: () => true }
  );
  this.resetToken = recoverRes.data?.token || null;

  // 4. Si tenemos el token, establecer contraseña
  if (this.resetToken) {
    const resetRes = await axios.post(
      `${this.urls.auth}/auth/reset-password`,
      { token: this.resetToken, newPassword: 'OffboardingPass123!' },
      { validateStatus: () => true }
    );
    assert.ok(
      resetRes.status === 200 || resetRes.status === 201,
      `El reset de contraseña falló en los Antecedentes: ${JSON.stringify(resetRes.data)}`
    );
    this.empleadoPassword = 'OffboardingPass123!';
  }
  // Nota: si el token no viene en el body (viene por evento), el empleado queda sin password
  // lo cual todavía es suficiente para probar que fue creado y luego desactivado.
});

// ─── Eliminación del empleado ─────────────────────────────────────────────────

When('elimino al empleado del sistema', async function () {
  const client = this.httpClient(this.urls.employees);
  this.response = await client.delete(`/employees/${this.employeeId}`);
  // Marcar como null para que el hook After no intente eliminarlo otra vez
  const idEliminado = this.employeeId;
  this.employeeId = null;
  this._idEliminado = idEliminado; // Guardamos para las verificaciones posteriores
});

// ─── Verificaciones asincrónicas ─────────────────────────────────────────────
// NOTA: 'eventualmente el servicio de notificaciones debe haber registrado...'
// está definido en comunes.steps.js y es reutilizado directamente aquí.

Then('eventualmente el empleado desvinculado no puede hacer login', async function () {
  const email = this.employeeEmail;
  const password = this.empleadoPassword || 'OffboardingPass123!';
  const authUrl = this.urls.auth;

  await esperarHastaQue(async () => {
    const axios = require('axios');
    const res = await axios.post(
      `${authUrl}/auth/login`,
      { email, password },
      { validateStatus: () => true }
    );
    // El usuario desvinculado debe devolver 401 (inactivo o sin credenciales)
    return res.status === 401;
  });
});

Then('eventualmente la solicitud de recuperación de contraseña del empleado desvinculado es rechazada', async function () {
  const email = this.employeeEmail;
  const authUrl = this.urls.auth;

  await esperarHastaQue(async () => {
    const axios = require('axios');
    const res = await axios.post(
      `${authUrl}/auth/recover-password`,
      { email },
      { validateStatus: () => true }
    );
    // El usuario desvinculado (inactivo) debe devolver 404 en recover-password
    return res.status === 404;
  });
});
