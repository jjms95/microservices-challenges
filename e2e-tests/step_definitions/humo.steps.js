'use strict';

const { Given } = require('@cucumber/cucumber');

// ─── Escenario de humo — verifica que cada servicio responde ─────────────────

Given('que el sistema está desplegado y operativo', async function () {
  const client = this.httpClient(this.urls.employees);
  this.response = await client.get('/employees');
});

Given('que el servicio de departamentos está disponible', async function () {
  const client = this.httpClient(this.urls.departments);
  this.response = await client.get('/departments');
});

Given('que el servicio de autenticación está disponible', async function () {
  const client = this.httpClient(this.urls.auth);
  // POST /auth/login con body vacío → 400 (validación de campos requeridos)
  // Esto prueba que el servicio está corriendo; un 404 indicaría que el servicio no existe.
  this.response = await client.post('/auth/login', {});
});

Given('que el servicio de notificaciones está disponible', async function () {
  const client = this.httpClient(this.urls.notifications);
  this.response = await client.get('/notifications');
});


