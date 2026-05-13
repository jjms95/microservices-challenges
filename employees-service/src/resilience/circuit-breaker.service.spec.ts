import { Test, TestingModule } from '@nestjs/testing';
import { CircuitBreakerService } from './circuit-breaker.service';

describe('CircuitBreakerService', () => {
    let service: CircuitBreakerService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [CircuitBreakerService],
        }).compile();

        service = module.get<CircuitBreakerService>(CircuitBreakerService);
        jest.useFakeTimers();
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    it('should be defined and start in CLOSED state', () => {
        expect(service).toBeDefined();
        expect(service.getState()).toBe('CLOSED');
        expect(service.isAvailable()).toBe(true);
    });

    it('should transition to OPEN state after consecutive failures', () => {
        service.onFailure();
        service.onFailure();
        expect(service.getState()).toBe('CLOSED');
        
        service.onFailure(); // 3rd failure (threshold is 3)
        expect(service.getState()).toBe('OPEN');
        expect(service.isAvailable()).toBe(false);
    });

    it('should transition to HALF_OPEN after cooldown', () => {
        service.onFailure();
        service.onFailure();
        service.onFailure();
        expect(service.getState()).toBe('OPEN');

        // Advance time by cooldown (15000ms)
        jest.advanceTimersByTime(15000);

        // Next availability check should transition it to HALF_OPEN
        expect(service.isAvailable()).toBe(true);
        expect(service.getState()).toBe('HALF_OPEN');
    });

    it('should recover to CLOSED on success from HALF_OPEN', () => {
        service.onFailure();
        service.onFailure();
        service.onFailure();
        jest.advanceTimersByTime(15000);
        service.isAvailable(); // transitions to HALF_OPEN

        service.onSuccess();
        expect(service.getState()).toBe('CLOSED');
    });

    it('should return to OPEN if failure happens during HALF_OPEN', () => {
        service.onFailure();
        service.onFailure();
        service.onFailure();
        jest.advanceTimersByTime(15000);
        service.isAvailable(); // transitions to HALF_OPEN

        service.onFailure();
        expect(service.getState()).toBe('OPEN');
    });
});
