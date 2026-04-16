# language: es
Característica: Verificación del sistema (Prueba de humo)
  Como equipo de calidad
  Quiero verificar que todos los microservicios están operativos
  Para garantizar que el sistema está listo para ejecutar la suite completa

  # Un servicio que responde 401 está VIVO — rechaza correctamente peticiones sin token.
  # Un servicio apagado daría error de conexión (ECONNREFUSED), no un código HTTP.

  Escenario: El servicio de empleados está operativo
    Dado que el sistema está desplegado y operativo
    Entonces la respuesta debe tener código 401

  Escenario: El servicio de departamentos está operativo
    Dado que el servicio de departamentos está disponible
    Entonces la respuesta debe tener código 401

  Escenario: El servicio de autenticación está operativo
    Dado que el servicio de autenticación está disponible
    Entonces la respuesta debe tener código 400

  Escenario: El servicio de notificaciones está operativo
    Dado que el servicio de notificaciones está disponible
    Entonces la respuesta debe tener código 401
