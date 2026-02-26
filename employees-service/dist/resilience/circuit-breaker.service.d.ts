type CircuitState = 'CLOSED' | 'OPEN' | 'HALF_OPEN';
export declare class CircuitBreakerService {
    private readonly logger;
    private state;
    private failureCount;
    private lastFailureTime;
    private readonly failureThreshold;
    private readonly cooldownMs;
    isAvailable(): boolean;
    onSuccess(): void;
    onFailure(): void;
    getState(): CircuitState;
}
export {};
