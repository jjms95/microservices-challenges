# language: es
Característica: Onboarding de empleados con verificación asincrónica
  Como administrador del sistema
  Quiero registrar nuevos empleados
  Para que su proceso de onboarding se complete automáticamente via eventos

  # Cada escenario crea su propio departamento y empleado con email único
  # para garantizar independencia total. Los hooks limpian los datos al final.

  Antecedentes:
    Dado que estoy autenticado como "ADMIN"
    Y que existe un departamento de prueba para el escenario

  Escenario: Registro exitoso genera credenciales de acceso automáticamente
    Cuando registro un empleado nuevo con datos únicos
    Entonces la respuesta debe tener código 201
    Y eventualmente el servicio de autenticación debe haber creado un usuario para el empleado
    Y el empleado guardado debe estar en la base de datos

  Escenario: Registro exitoso genera una notificación de bienvenida
    Cuando registro un empleado nuevo con datos únicos
    Entonces la respuesta debe tener código 201
    Y eventualmente el servicio de notificaciones debe haber registrado una notificación de tipo "WELCOME" para el empleado

  Escenario: El nuevo empleado puede solicitar recuperación de contraseña
    # El token de reset viaja por RabbitMQ → notificaciones → email simulado.
    # No es accesible vía HTTP, por lo que verificamos que:
    #   1. La cuenta fue creada en auth (async) → polling
    #   2. El endpoint de recuperación acepta la solicitud (usuario activo) → 200
    Cuando registro un empleado nuevo con datos únicos
    Entonces la respuesta debe tener código 201
    Y eventualmente el servicio de autenticación debe haber creado un usuario para el empleado
    Cuando el empleado solicita recuperar su contraseña
    Entonces la respuesta debe tener código 201

  Escenario: Registro falla con departamento inexistente
    Cuando intento registrar un empleado con un departamento que no existe
    Entonces la respuesta debe tener código 400

  Escenario: Registro falla cuando faltan campos obligatorios
    Cuando intento registrar un empleado sin email
    Entonces la respuesta debe tener código 400
