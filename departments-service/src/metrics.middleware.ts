import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { Counter, Histogram } from 'prom-client';
import { InjectMetric } from '@willsoto/nestjs-prometheus';

// We can register custom metrics via providers in AppModule, but for simplicity
// and to avoid issues with @willsoto/nestjs-prometheus singletons, we can create
// them globally here or use the providers. Let's create them directly using prom-client's global registry.

import * as client from 'prom-client';

const httpRequestsTotal = new client.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'status', 'path'],
});

const httpRequestDuration = new client.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'status', 'path'],
  buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
});

@Injectable()
export class MetricsMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    const end = httpRequestDuration.startTimer();
    res.on('finish', () => {
      let path = req.route ? req.route.path : req.path;
      // To prevent cardinality explosion, we could normalize paths, but for this exercise we keep it simple.
      const labels = {
        method: req.method,
        status: res.statusCode.toString(),
        path: path,
      };
      httpRequestsTotal.inc(labels);
      end(labels);
    });
    next();
  }
}
