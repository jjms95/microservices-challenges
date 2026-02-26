import { Employee } from '../entities/employee.entity';
export declare class PaginatedEmployeesDto {
    data: Employee[];
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
}
