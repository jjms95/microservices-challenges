import { Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';
import { PrometheusModule } from '@willsoto/nestjs-prometheus';
import { HealthController } from './health.controller';

/**
 * DOC: MonitoringModule para el Reto 7.
 * Agrupa la configuración de Terminus (Health) y Prometheus (Metrics).
 */
@Module({
  imports: [
    TerminusModule,
    // FIX: Configuración de Prometheus. Expone /metrics por defecto.
    PrometheusModule.register({
      path: '/metrics',
      defaultMetrics: {
        enabled: true,
      },
    }),
  ],
  controllers: [HealthController],
})
export class MonitoringModule {}
