"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var CircuitBreakerService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.CircuitBreakerService = void 0;
const common_1 = require("@nestjs/common");
let CircuitBreakerService = CircuitBreakerService_1 = class CircuitBreakerService {
    logger = new common_1.Logger(CircuitBreakerService_1.name);
    state = 'CLOSED';
    failureCount = 0;
    lastFailureTime = null;
    failureThreshold = 3;
    cooldownMs = 15_000;
    isAvailable() {
        if (this.state === 'CLOSED')
            return true;
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
        return true;
    }
    onSuccess() {
        if (this.state !== 'CLOSED') {
            this.logger.log('Circuit breaker → CLOSED (service recovered)');
        }
        this.state = 'CLOSED';
        this.failureCount = 0;
        this.lastFailureTime = null;
    }
    onFailure() {
        this.failureCount++;
        this.lastFailureTime = Date.now();
        if (this.state === 'HALF_OPEN' || this.failureCount >= this.failureThreshold) {
            this.logger.error(`Circuit breaker → OPEN after ${this.failureCount} failure(s). Will retry in ${this.cooldownMs / 1000}s.`);
            this.state = 'OPEN';
        }
        else {
            this.logger.warn(`Circuit breaker failure count: ${this.failureCount}/${this.failureThreshold}`);
        }
    }
    getState() {
        return this.state;
    }
};
exports.CircuitBreakerService = CircuitBreakerService;
exports.CircuitBreakerService = CircuitBreakerService = CircuitBreakerService_1 = __decorate([
    (0, common_1.Injectable)()
], CircuitBreakerService);
//# sourceMappingURL=circuit-breaker.service.js.map