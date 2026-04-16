# language: es
Característica: Seguridad y control de acceso
  Como sistema de autenticación centralizado
  Quiero controlar el acceso a todos los recursos protegidos
  Para garantizar que solo los usuarios autorizados realicen operaciones

  Antecedentes:
    Dado que el sistema está desplegado y operativo

  # ─── Escenario dado por el enunciado ─────────────────────────────────────────

  Escenario: Acceso denegado sin token de autenticación
    Cuando consulto la lista de empleados sin token de autenticación
    Entonces la respuesta debe tener código 401

  # ─── Escenarios propios ───────────────────────────────────────────────────────

  Escenario: Acceso denegado con token malformado
    Cuando consulto la lista de empleados con el token "esto-no-es-un-jwt-valido"
    Entonces la respuesta debe tener código 401

  Escenario: Usuario con rol USER puede consultar empleados pero no puede crearlos
    Dado que estoy autenticado como "USER"
    Cuando consulto la lista de empleados con mi token
    Entonces la respuesta debe tener código 200
    Cuando intento crear un empleado con nombre "Test Prohibido" con mi token de USER
    Entonces la respuesta debe tener código 403

  Escenario: Usuario con rol ADMIN puede crear y consultar empleados
    Dado que estoy autenticado como "ADMIN"
    Cuando consulto la lista de empleados con mi token
    Entonces la respuesta debe tener código 200
    Cuando consulto la lista de departamentos con mi token
    Entonces la respuesta debe tener código 200

  Escenario: Login con credenciales incorrectas es rechazado
    Cuando intento hacer login con email "admin@empresa.com" y contraseña "ClaveIncorrecta!"
    Entonces la respuesta debe tener código 401

  Escenario: Usuario inactivo no puede iniciar sesión
    Cuando intento hacer login con email "exempleado@empresa.com" y contraseña "cualquierClave1!"
    Entonces la respuesta debe tener código 401
