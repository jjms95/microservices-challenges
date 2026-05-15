import { Controller, Get } from '@nestjs/common';
import { HealthCheckService, TypeOrmHealthIndicator, HealthCheck, HealthCheckResult } from '@nestjs/terminus';

/**
 * DOC: HealthController para el Reto 7.
 * Expone el endpoint /health con chequeos de la base de datos PostgreSQL.
 */
@Controller('health')
export class HealthController {
  constructor(
    private health: HealthCheckService,
    private db: TypeOrmHealthIndicator,
  ) {}

  @Get()
  @HealthCheck()
  check(): Promise<HealthCheckResult> {
    return this.health.check([
      () => this.db.pingCheck('database'),
      // FIX: Se pueden agregar más chequeos aquí (ej. RabbitMQ) en fases posteriores.
    ]);
  }
}
