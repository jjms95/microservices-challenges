import { Injectable, Logger } from '@nestjs/common';

type CircuitState = 'CLOSED' | 'OPEN' | 'HALF_OPEN';

/**
 * Simple Circuit Breaker implementation.
 *
 * States:
 *  - CLOSED  → Normal operation. Requests flow through.
 *  - OPEN    → Too many failures. Requests are rejected immediately (fail-fast).
 *  - HALF_OPEN → Cooldown elapsed. One probe request is allowed through to test recovery.
 */
@Injectable()
export class CircuitBreakerService {
    private readonly logger = new Logger(CircuitBreakerService.name);

    private state: CircuitState = 'CLOSED';
    private failureCount = 0;
    private lastFailureTime: number | null = null;

    // Thresholds
    private readonly failureThreshold = 3;    // failures before opening
    private readonly cooldownMs = 15_000;      // 15s before switching to HALF_OPEN

    /** Returns true if a request should be allowed through. */
    isAvailable(): boolean {
        if (this.state === 'CLOSED') return true;

        if (this.state === 'OPEN') {
            const elapsed = Date.now() - (this.lastFailureTime ?? 0);
            if (elapsed >= this.cooldownMs) {
                this.logger.warn('Circuit breaker → HALF_OPEN (probing departments-service)');
                this.state = 'HALF_OPEN';
                return true;
            }
            this.logger.warn(`Circuit breaker OPEN – rejecting request (cooldown: ${Math.round((this.cooldownMs - elapsed) / 1000)}s left)`);
            return false;
        }

        // HALF_OPEN: allow the probe through
        return true;
    }

    /** Call this when a request succeeds. */
    onSuccess(): void {
        if (this.state !== 'CLOSED') {
            this.logger.log('Circuit breaker → CLOSED (service recovered)');
        }
        this.state = 'CLOSED';
        this.failureCount = 0;
        this.lastFailureTime = null;
    }

    /** Call this when a request fails due to a connectivity/server error. */
    onFailure(): void {
        this.failureCount++;
        this.lastFailureTime = Date.now();

        if (this.state === 'HALF_OPEN' || this.failureCount >= this.failureThreshold) {
            this.logger.error(
                `Circuit breaker → OPEN after ${this.failureCount} failure(s). Will retry in ${this.cooldownMs / 1000}s.`,
            );
            this.state = 'OPEN';
        } else {
            this.logger.warn(`Circuit breaker failure count: ${this.failureCount}/${this.failureThreshold}`);
        }
    }

    getState(): CircuitState {
        return this.state;
    }
}
