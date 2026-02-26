import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ILike, Repository } from 'typeorm';
import { Department } from './entities/department.entity';
import { CreateDepartmentDto } from './dto/create-department.dto';
import { UpdateDepartmentDto } from './dto/update-department.dto';
import { FindDepartmentsQueryDto } from './dto/find-departments-query.dto';
import { PaginatedDepartmentsDto } from './dto/paginated-departments.dto';

@Injectable()
export class DepartmentsService {
    constructor(
        @InjectRepository(Department)
        private readonly departmentsRepository: Repository<Department>,
    ) { }

    async create(createDepartmentDto: CreateDepartmentDto): Promise<Department> {
        const department = this.departmentsRepository.create(createDepartmentDto);
        return this.departmentsRepository.save(department);
    }

    async findAll(query: FindDepartmentsQueryDto): Promise<PaginatedDepartmentsDto> {
        const { name, page = 1, limit = 10 } = query;

        const [data, totalItems] = await this.departmentsRepository.findAndCount({
            where: name ? { name: ILike(`%${name}%`) } : undefined,
            skip: (page - 1) * limit,
            take: limit,
            order: { name: 'ASC' },
        });

        return {
            data,
            currentPage: page,
            totalPages: Math.ceil(totalItems / limit),
            totalItems,
            itemsPerPage: limit,
        };
    }

    async findOne(id: string): Promise<Department> {
        const department = await this.departmentsRepository.findOne({ where: { id } });
        if (!department) {
            throw new NotFoundException(`Department with id "${id}" not found.`);
        }
        return department;
    }

    async update(id: string, updateDepartmentDto: UpdateDepartmentDto): Promise<Department> {
        const department = await this.findOne(id);
        Object.assign(department, updateDepartmentDto);
        return this.departmentsRepository.save(department);
    }

    async remove(id: string): Promise<void> {
        const department = await this.findOne(id);
        await this.departmentsRepository.remove(department);
    }
}
