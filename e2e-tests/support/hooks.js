'use strict';

const { Before, After } = require('@cucumber/cucumber');

/**
 * HOOKS — Ciclo de vida de los escenarios
 *
 * Before: Se ejecuta antes de cada escenario.
 *   - No hace nada por defecto (el World ya tiene una instancia limpia).
 *   - Los Antecedentes (.feature) manejan la preparación de datos.
 *
 * After: Se ejecuta después de cada escenario.
 *   - Limpia empleados y departamentos creados durante el escenario.
 *   - Garantiza que ningún escenario deja "basura" que afecte a otro.
 *   - Usa el token ADMIN para tener permisos de eliminación.
 *
 * ESTRATEGIA DE AISLAMIENTO DE DATOS:
 *   - Cada escenario que crea un empleado genera un email único con UUID parcial
 *     (ver world.js y steps de onboarding/offboarding).
 *   - El hook After limpia los recursos creados usando los IDs almacenados en el World.
 *   - Si la limpieza falla (ej. el recurso ya fue eliminado por el escenario), se ignora.
 */
Before(async function () {
  // Nada — el World constructor ya inicializa el estado limpio
});

After(async function () {
  // Limpiar empleado creado durante el escenario (si aplica)
  if (this.employeeId) {
    try {
      // Necesitamos permisos ADMIN para eliminar
      const adminEmail = process.env.ADMIN_EMAIL || 'admin@empresa.com';
      const adminPassword = process.env.ADMIN_PASSWORD || 'Admin123!';

      // Hacer login como ADMIN si el escenario dejó un token sin permisos
      const axios = require('axios');
      const authRes = await axios.post(
        `${this.urls.auth}/auth/login`,
        { email: adminEmail, password: adminPassword },
        { validateStatus: () => true }
      );

      const adminToken = authRes.data?.access_token;
      if (adminToken) {
        await axios.delete(`${this.urls.employees}/employees/${this.employeeId}`, {
          headers: { Authorization: `Bearer ${adminToken}` },
          validateStatus: () => true,
        });
      }
    } catch (_err) {
      // Ignoramos errores de limpieza — el recurso puede no existir
    }
    this.employeeId = null;
  }

  // Limpiar departamento creado durante el escenario (si aplica)
  if (this.departmentId) {
    try {
      const axios = require('axios');
      const adminEmail = process.env.ADMIN_EMAIL || 'admin@empresa.com';
      const adminPassword = process.env.ADMIN_PASSWORD || 'Admin123!';
      const authRes = await axios.post(
        `${this.urls.auth}/auth/login`,
        { email: adminEmail, password: adminPassword },
        { validateStatus: () => true }
      );
      const adminToken = authRes.data?.access_token;
      if (adminToken) {
        await axios.delete(`${this.urls.departments}/departments/${this.departmentId}`, {
          headers: { Authorization: `Bearer ${adminToken}` },
          validateStatus: () => true,
        });
      }
    } catch (_err) {
      // Ignoramos errores de limpieza
    }
    this.departmentId = null;
  }
});
