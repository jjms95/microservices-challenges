import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User, UserRole } from '../entities/user.entity';

/**
 * Seeds default users into the database on application startup.
 *
 * Created users cover all reto4 validation scenarios:
 *
 * 1. ADMIN seed user        → Full access, can create/delete employees (step 10)
 * 2. Regular USER            → Read-only access, gets 403 on write ops (step 9)
 * 3. USER without password   → Must reset password before login (step 5)
 * 4. Inactive USER           → Login must fail with 401/403 (step 11)
 */
@Injectable()
export class SeedService implements OnModuleInit {
  private readonly logger = new Logger(SeedService.name);

  constructor(
    @InjectRepository(User) private usersRepository: Repository<User>,
  ) {}

  async onModuleInit() {
    await this.seedUsers();
  }

  private async seedUsers() {
    const usersCount = await this.usersRepository.count();
    if (usersCount > 0) {
      this.logger.log('Users already exist in database, skipping seed.');
      return;
    }

    this.logger.log('Seeding default users for reto4 testing...');

    const defaultPassword = 'Admin123!';
    const salt = await bcrypt.genSalt();
    const hashedPassword = await bcrypt.hash(defaultPassword, salt);

    const userPassword = 'User123!';
    const hashedUserPassword = await bcrypt.hash(userPassword, salt);

    const seedUsers: Partial<User>[] = [
      // ─────────────────────────────────────────────
      // 1. ADMIN seed user (usuario "semilla")
      //    - Has password set, ready to login immediately
      //    - Used to: create employees (step 2), delete employees (step 10)
      // ─────────────────────────────────────────────
      {
        email: 'admin@empresa.com',
        password: hashedPassword,
        role: UserRole.ADMIN,
        isActive: true,
      },

      // ─────────────────────────────────────────────
      // 2. Regular USER with password set
      //    - Can login and access read-only endpoints
      //    - Used to: test GET /empleados (step 7), test 403 on DELETE (step 9)
      // ─────────────────────────────────────────────
      {
        email: 'usuario@empresa.com',
        password: hashedUserPassword,
        role: UserRole.USER,
        isActive: true,
      },

      // ─────────────────────────────────────────────
      // 3. USER without password (simulates new employee onboarding)
      //    - Password is null, must go through reset-password flow
      //    - Used to: test "Please reset your password before logging in" (step 5)
      // ─────────────────────────────────────────────
      {
        email: 'nuevo.empleado@empresa.com',
        password: undefined,
        role: UserRole.USER,
        isActive: true,
      },

      // ─────────────────────────────────────────────
      // 4. Inactive/deactivated USER (simulates offboarded employee)
      //    - isActive = false, login must fail
      //    - Used to: test login denial for deleted employees (step 11)
      // ─────────────────────────────────────────────
      {
        email: 'exempleado@empresa.com',
        password: hashedUserPassword,
        role: UserRole.USER,
        isActive: false,
      },
    ];

    for (const userData of seedUsers) {
      const user = this.usersRepository.create(userData);
      await this.usersRepository.save(user);
      this.logger.log(
        `Seeded user: ${user.email} | role: ${user.role} | active: ${user.isActive} | has password: ${!!user.password}`,
      );
    }

    this.logger.log('──────────────────────────────────────────────────');
    this.logger.log('  Default users seeded successfully!');
    this.logger.log('──────────────────────────────────────────────────');
    this.logger.log('  ADMIN  → admin@empresa.com      / Admin123!');
    this.logger.log('  USER   → usuario@empresa.com    / User123!');
    this.logger.log('  USER   → nuevo.empleado@empresa.com (no password - needs reset)');
    this.logger.log('  USER   → exempleado@empresa.com (INACTIVE - login denied)');
    this.logger.log('──────────────────────────────────────────────────');
  }
}
