import { Department } from '../entities/department.entity';
export declare class PaginatedDepartmentsDto {
    data: Department[];
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
}
