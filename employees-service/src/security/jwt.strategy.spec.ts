import { Test, TestingModule } from '@nestjs/testing';
import { JwtStrategy } from './jwt.strategy';
import { UnauthorizedException } from '@nestjs/common';

describe('JwtStrategy', () => {
    let strategy: JwtStrategy;

    beforeEach(async () => {
        // Set environment variable for JWT_SECRET
        process.env.JWT_SECRET = 'test-secret';

        const module: TestingModule = await Test.createTestingModule({
            providers: [JwtStrategy],
        }).compile();

        strategy = module.get<JwtStrategy>(JwtStrategy);
    });

    afterEach(() => {
        delete process.env.JWT_SECRET;
    });

    it('should be defined', () => {
        expect(strategy).toBeDefined();
    });

    it('should return mapped payload if valid', async () => {
        const payload = { sub: 'uuid-123', role: 'ADMIN', type: 'ACCESS' };
        const result = await strategy.validate(payload);
        expect(result).toEqual({ id: 'uuid-123', role: 'ADMIN' });
    });

    it('should throw UnauthorizedException if token type is RESET_PASSWORD', async () => {
        const payload = { sub: 'uuid-123', role: 'USER', type: 'RESET_PASSWORD' };
        await expect(strategy.validate(payload)).rejects.toThrow(UnauthorizedException);
    });
});
