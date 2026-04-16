'use strict';

/**
 * POLLING — Estrategia para verificar resultados asincrónicos
 *
 * En un sistema basado en eventos, los servicios procesan mensajes de RabbitMQ
 * de forma asincrónica. No podemos verificar el resultado inmediatamente.
 *
 * PARÁMETROS ELEGIDOS y JUSTIFICACIÓN:
 *   - maxIntentos: 15  → cubre cortes de red cortos y carga alta en el broker
 *   - intervaloMs: 2000 → balance entre velocidad y carga en los servicios
 *   - timeoutTotal: ~30s → el evento debería propagarse en < 5s normalmente;
 *     30s es un margen muy holgado para CI/CD o máquinas lentas
 *
 * Por qué NO usamos sleep fijo:
 *   - Si el evento se procesa en 1s, la prueba termina en 1s, no en 30s.
 *   - Si el sistema tarda más de lo usual, el polling lo tolera sin fallar.
 *   - Elimina pruebas intermitentes (flaky tests) por variaciones de timing.
 *
 * @param {Function} condicion - función async que retorna true cuando el evento ocurrió
 * @param {number} maxIntentos - número máximo de reintentos
 * @param {number} intervaloMs - milisegundos entre intentos
 * @returns {Promise<void>} resuelve si la condición se cumple, lanza si se agota
 */
async function esperarHastaQue(
  condicion,
  maxIntentos = parseInt(process.env.POLLING_MAX_ATTEMPTS) || 15,
  intervaloMs = parseInt(process.env.POLLING_INTERVAL_MS) || 2000
) {
  for (let intento = 1; intento <= maxIntentos; intento++) {
    try {
      const resultado = await condicion();
      if (resultado === true) {
        return; // Condición cumplida — éxito
      }
    } catch (_err) {
      // Todavía no está listo, se reintenta
    }
    if (intento < maxIntentos) {
      await new Promise((resolve) => setTimeout(resolve, intervaloMs));
    }
  }
  const timeoutTotal = (maxIntentos * intervaloMs) / 1000;
  throw new Error(
    `Timeout: condición no cumplida después de ${maxIntentos} intentos (~${timeoutTotal}s)`
  );
}

module.exports = { esperarHastaQue };
