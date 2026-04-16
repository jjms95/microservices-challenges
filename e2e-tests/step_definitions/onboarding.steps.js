'use strict';

const { Given, When, Then } = require('@cucumber/cucumber');
const assert = require('assert');
const { esperarHastaQue } = require('../support/polling');

// Helper para generar un sufijo único por escenario (garantiza independencia)
function sufijo() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

// ─── Antecedentes: departamento de prueba ─────────────────────────────────────

Given('que existe un departamento de prueba para el escenario', async function () {
  const client = this.httpClient(this.urls.departments);
  const res = await client.post('/departments', {
    name: `Dept-Test-${sufijo()}`,
    description: 'Departamento temporal para pruebas BDD',
  });
  assert.strictEqual(
    res.status,
    201,
    `No se pudo crear el departamento de prueba: ${JSON.stringify(res.data)}`
  );
  this.departmentId = res.data.id;
});

// ─── Registro de empleado ─────────────────────────────────────────────────────

When('registro un empleado nuevo con datos únicos', async function () {
  // Email único por escenario — evita colisiones entre ejecuciones
  this.employeeEmail = `empleado.test.${sufijo()}@empresa.com`;
  const client = this.httpClient(this.urls.employees);
  this.response = await client.post('/employees', {
    name: 'Empleado Test BDD',
    email: this.employeeEmail,
    departmentId: this.departmentId,
    hireDate: new Date().toISOString().split('T')[0],
  });
  if (this.response.status === 201) {
    this.employeeId = this.response.data.id;
  }
});

When('intento registrar un empleado con un departamento que no existe', async function () {
  this.employeeEmail = `empleado.test.${sufijo()}@empresa.com`;
  const client = this.httpClient(this.urls.employees);
  this.response = await client.post('/employees', {
    name: 'Empleado Test BDD',
    email: this.employeeEmail,
    departmentId: '00000000-0000-0000-0000-000000000000', // UUID ficticio
    hireDate: new Date().toISOString().split('T')[0],
  });
});

When('intento registrar un empleado sin email', async function () {
  const client = this.httpClient(this.urls.employees);
  this.response = await client.post('/employees', {
    name: 'Empleado Sin Email',
    departmentId: this.departmentId,
    hireDate: new Date().toISOString().split('T')[0],
    // email deliberadamente omitido
  });
});

// ─── Verificaciones asincrónicas con polling ──────────────────────────────────

Then('eventualmente el servicio de autenticación debe haber creado un usuario para el empleado', async function () {
  const email = this.employeeEmail;
  const authUrl = this.urls.auth;
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@empresa.com';
  const adminPassword = process.env.ADMIN_PASSWORD || 'Admin123!';

  await esperarHastaQue(async () => {
    const axios = require('axios');
    // Intentar recuperar contraseña — si el usuario existe, devuelve 200/201; si no, 404
    const res = await axios.post(
      `${authUrl}/auth/recover-password`,
      { email },
      { validateStatus: () => true }
    );
    return res.status === 200 || res.status === 201;
  });
});


Then('el empleado guardado debe estar en la base de datos', async function () {
  const client = this.httpClient(this.urls.employees);
  const res = await client.get(`/employees/${this.employeeId}`);
  assert.strictEqual(
    res.status,
    200,
    `El empleado ${this.employeeId} no se encontró en la base de datos`
  );
  assert.strictEqual(res.data.email, this.employeeEmail);
});

// ─── Flujo de reset de contraseña ────────────────────────────────────────────

When('el empleado solicita recuperar su contraseña', async function () {
  const axios = require('axios');
  // Llama al endpoint de recuperación — devuelve 200 si el usuario existe y está activo.
  // El token de reset se emite vía RabbitMQ ('user.recovered') y no se expone en el body.
  this.response = await axios.post(
    `${this.urls.auth}/auth/recover-password`,
    { email: this.employeeEmail },
    { validateStatus: () => true }
  );
});

When('el empleado establece la contraseña {string}', async function (nuevaPassword) {
  const axios = require('axios');
  // Si no tenemos el token directamente, intentamos obtenerlo vía el endpoint de notificaciones
  // buscando la notificación 'user.recovered' que contiene el token
  if (!this.resetToken) {
    // Esperar a que la notificación con el token aparezca
    await esperarHastaQue(async () => {
      const res = await axios.get(
        `${this.urls.notifications}/notifications/${this.employeeId}`,
        {
          headers: { Authorization: `Bearer ${this.token}` },
          validateStatus: () => true,
        }
      );
      if (res.status !== 200) return false;
      const notifConToken = res.data.find((n) => n.type === 'PASSWORD_RECOVERY' || n.message?.includes('token'));
      if (notifConToken && notifConToken.resetToken) {
        this.resetToken = notifConToken.resetToken;
        return true;
      }
      return false;
    });
  }

  assert.ok(this.resetToken, 'No se pudo obtener el token de reset de contraseña');

  const res = await axios.post(
    `${this.urls.auth}/auth/reset-password`,
    { token: this.resetToken, newPassword: nuevaPassword },
    { validateStatus: () => true }
  );
  assert.ok(
    res.status === 200 || res.status === 201,
    `El reset de contraseña falló con código ${res.status}: ${JSON.stringify(res.data)}`
  );
});

Then('el empleado puede iniciar sesión con la contraseña {string}', async function (password) {
  await this.autenticar(this.employeeEmail, password);
  assert.ok(this.token, 'El empleado no pudo iniciar sesión — el token es nulo');
});
