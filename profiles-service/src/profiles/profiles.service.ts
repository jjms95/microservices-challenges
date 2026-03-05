import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Profile } from './entities/profile.entity';
import { UpdateProfileDto } from './dto/update-profile.dto';

export interface EmployeeCreatedPayload {
    id: string;
    name: string;
    email: string;
    departmentId: string;
    hireDate: Date;
}

@Injectable()
export class ProfilesService {
    private readonly logger = new Logger(ProfilesService.name);

    constructor(
        @InjectRepository(Profile)
        private readonly profilesRepository: Repository<Profile>,
    ) { }

    async handleEmployeeCreated(payload: EmployeeCreatedPayload): Promise<void> {
        // Idempotency: don't create duplicate profiles
        const existing = await this.profilesRepository.findOne({
            where: { employeeId: payload.id },
        });

        if (existing) {
            this.logger.warn(`Profile for employee ${payload.id} already exists. Skipping creation.`);
            return;
        }

        const profile = this.profilesRepository.create({
            employeeId: payload.id,
            name: payload.name,
            email: payload.email,
            // Updatable fields default to '' (set in entity)
        });

        await this.profilesRepository.save(profile);
        this.logger.log(`Default profile created for employee: ${payload.id} (${payload.name})`);
    }

    findAll(): Promise<Profile[]> {
        return this.profilesRepository.find({ order: { createdAt: 'DESC' } });
    }

    async findByEmployeeId(employeeId: string): Promise<Profile> {
        const profile = await this.profilesRepository.findOne({ where: { employeeId } });
        if (!profile) {
            throw new NotFoundException(`Profile for employee "${employeeId}" not found.`);
        }
        return profile;
    }

    async update(employeeId: string, updateProfileDto: UpdateProfileDto): Promise<Profile> {
        const profile = await this.findByEmployeeId(employeeId);
        Object.assign(profile, updateProfileDto);
        return this.profilesRepository.save(profile);
    }
}
