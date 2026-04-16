'use strict';

const { Given, When } = require('@cucumber/cucumber');
const assert = require('assert');

// ─── Autenticación ───────────────────────────────────────────────────────────

Given('que estoy autenticado como {string}', async function (rol) {
  let email, password;
  if (rol === 'ADMIN') {
    email = process.env.ADMIN_EMAIL || 'admin@empresa.com';
    password = process.env.ADMIN_PASSWORD || 'Admin123!';
  } else if (rol === 'USER') {
    email = process.env.USER_EMAIL || 'usuario@empresa.com';
    password = process.env.USER_PASSWORD || 'User123!';
  } else {
    throw new Error(`Rol desconocido: ${rol}. Use "ADMIN" o "USER".`);
  }
  await this.autenticar(email, password);
});

// ─── Peticiones sin token ─────────────────────────────────────────────────────

When('consulto la lista de empleados sin token de autenticación', async function () {
  this.token = null;
  const client = this.httpClient(this.urls.employees);
  this.response = await client.get('/employees');
});

When('consulto la lista de empleados con el token {string}', async function (tokenInvalido) {
  this.token = tokenInvalido;
  const client = this.httpClient(this.urls.employees);
  this.response = await client.get('/employees');
});

// ─── Peticiones con token del World ──────────────────────────────────────────

When('consulto la lista de empleados con mi token', async function () {
  const client = this.httpClient(this.urls.employees);
  this.response = await client.get('/employees');
});

When('consulto la lista de departamentos con mi token', async function () {
  const client = this.httpClient(this.urls.departments);
  this.response = await client.get('/departments');
});

// ─── Intento de creación como USER (debe fallar con 403) ─────────────────────

When('intento crear un empleado con nombre {string} con mi token de USER', async function (nombre) {
  const client = this.httpClient(this.urls.employees);
  this.response = await client.post('/employees', {
    name: nombre,
    email: 'blocked@example.com',
    departmentId: '00000000-0000-0000-0000-000000000000',
    hireDate: '2024-01-01',
  });
});

// ─── Login explícito ─────────────────────────────────────────────────────────

When('intento hacer login con email {string} y contraseña {string}', async function (email, password) {
  const client = this.httpClient(this.urls.auth);
  this.response = await client.post('/auth/login', { email, password });
});
