# language: es
Característica: Offboarding de empleados
  Como administrador del sistema
  Quiero desvincular empleados correctamente
  Para que sus accesos sean revocados y se notifique su salida de forma asincrónica

  # Cada escenario prepara su propio empleado con credenciales activas desde cero
  # usando los Antecedentes, sin depender de otros escenarios.
  # Los hooks limpian cualquier recurso residual al finalizar.

  Antecedentes:
    Dado que estoy autenticado como "ADMIN"
    Y que existe un departamento de prueba para el escenario
    Y que existe un empleado con credenciales activas para el escenario de offboarding

  Escenario: Desvinculación completa genera notificación de tipo OFFBOARDING
    Cuando elimino al empleado del sistema
    Entonces la respuesta debe tener código 204
    Y eventualmente el servicio de notificaciones debe haber registrado una notificación de tipo "OFFBOARDING" para el empleado

  Escenario: El empleado desvinculado no puede iniciar sesión
    Cuando elimino al empleado del sistema
    Entonces la respuesta debe tener código 204
    Y eventualmente el empleado desvinculado no puede hacer login

  Escenario: La recuperación de contraseña falla para un empleado desvinculado
    Cuando elimino al empleado del sistema
    Entonces la respuesta debe tener código 204
    Y eventualmente la solicitud de recuperación de contraseña del empleado desvinculado es rechazada
