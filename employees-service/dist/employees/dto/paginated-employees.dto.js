"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaginatedEmployeesDto = void 0;
const openapi = require("@nestjs/swagger");
const swagger_1 = require("@nestjs/swagger");
const employee_entity_1 = require("../entities/employee.entity");
class PaginatedEmployeesDto {
    data;
    currentPage;
    totalPages;
    totalItems;
    itemsPerPage;
    static _OPENAPI_METADATA_FACTORY() {
        return { data: { required: true, type: () => [require("../entities/employee.entity").Employee] }, currentPage: { required: true, type: () => Number }, totalPages: { required: true, type: () => Number }, totalItems: { required: true, type: () => Number }, itemsPerPage: { required: true, type: () => Number } };
    }
}
exports.PaginatedEmployeesDto = PaginatedEmployeesDto;
__decorate([
    (0, swagger_1.ApiProperty)({ type: [employee_entity_1.Employee], description: 'List of employees for the current page' }),
    __metadata("design:type", Array)
], PaginatedEmployeesDto.prototype, "data", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 1, description: 'Current page number' }),
    __metadata("design:type", Number)
], PaginatedEmployeesDto.prototype, "currentPage", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 5, description: 'Total number of pages' }),
    __metadata("design:type", Number)
], PaginatedEmployeesDto.prototype, "totalPages", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 48, description: 'Total number of employees matching the filters' }),
    __metadata("design:type", Number)
], PaginatedEmployeesDto.prototype, "totalItems", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 10, description: 'Number of items per page' }),
    __metadata("design:type", Number)
], PaginatedEmployeesDto.prototype, "itemsPerPage", void 0);
//# sourceMappingURL=paginated-employees.dto.js.map