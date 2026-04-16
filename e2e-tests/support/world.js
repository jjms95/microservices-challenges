'use strict';

require('dotenv').config({ path: __dirname + '/../../.env' });

const { setWorldConstructor, World } = require('@cucumber/cucumber');
const axios = require('axios');

/**
 * MUNDO COMPARTIDO (World)
 *
 * Una instancia nueva se crea por ESCENARIO, garantizando el aislamiento
 * total de estado entre escenarios. Almacena:
 *   - token de autenticación activo
 *   - último response HTTP recibido
 *   - IDs generados durante el escenario (para limpieza en hooks)
 */
class MundoBDD extends World {
  constructor(options) {
    super(options);

    // URLs base desde variables de entorno
    this.urls = {
      employees: process.env.EMPLOYEES_URL || 'http://localhost:8080',
      departments: process.env.DEPARTMENTS_URL || 'http://localhost:8081',
      auth: process.env.AUTH_URL || 'http://localhost:8085',
      notifications: process.env.NOTIFICATIONS_URL || 'http://localhost:8084',
      profiles: process.env.PROFILES_URL || 'http://localhost:8083',
    };

    // Estado del escenario
    this.token = null;          // JWT del usuario autenticado actualmente
    this.response = null;       // Último response HTTP recibido
    this.employeeId = null;     // ID del empleado creado en el escenario
    this.departmentId = null;   // ID del departamento creado en el escenario
    this.resetToken = null;     // Token de reset de contraseña
    this.employeeEmail = null;  // Email del empleado del escenario
  }

  /**
   * Construye un cliente axios configurado con el token actual si existe.
   * @param {string} baseURL - URL base del servicio
   * @returns {import('axios').AxiosInstance}
   */
  httpClient(baseURL) {
    const headers = { 'Content-Type': 'application/json' };
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }
    return axios.create({
      baseURL,
      headers,
      validateStatus: () => true, // Nunca lanza error por status HTTP — los manejamos en steps
    });
  }

  /**
   * Realiza login y almacena el token en this.token.
   * @param {string} email
   * @param {string} password
   */
  async autenticar(email, password) {
    const client = this.httpClient(this.urls.auth);
    const res = await client.post('/auth/login', { email, password });
    if (res.status !== 200 && res.status !== 201) {
      throw new Error(
        `Autenticación fallida para ${email}: status ${res.status} - ${JSON.stringify(res.data)}`
      );
    }
    this.token = res.data.access_token;
  }
}

setWorldConstructor(MundoBDD);
module.exports = { MundoBDD };
