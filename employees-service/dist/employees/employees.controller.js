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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmployeesController = void 0;
const openapi = require("@nestjs/swagger");
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const employees_service_1 = require("./employees.service");
const create_employee_dto_1 = require("./dto/create-employee.dto");
const find_employees_query_dto_1 = require("./dto/find-employees-query.dto");
const paginated_employees_dto_1 = require("./dto/paginated-employees.dto");
const employee_entity_1 = require("./entities/employee.entity");
let EmployeesController = class EmployeesController {
    employeesService;
    constructor(employeesService) {
        this.employeesService = employeesService;
    }
    create(createEmployeeDto) {
        return this.employeesService.create(createEmployeeDto);
    }
    findAll(query) {
        return this.employeesService.findAll(query);
    }
    findOne(id) {
        return this.employeesService.findOne(id);
    }
};
exports.EmployeesController = EmployeesController;
__decorate([
    (0, common_1.Post)(),
    (0, swagger_1.ApiOperation)({ summary: 'Create a new employee', description: 'Validates department existence before saving' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Employee created successfully.', type: employee_entity_1.Employee }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Invalid input or department not found.' }),
    openapi.ApiResponse({ status: 201, type: require("./entities/employee.entity").Employee }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_employee_dto_1.CreateEmployeeDto]),
    __metadata("design:returntype", Promise)
], EmployeesController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({
        summary: 'List all employees',
        description: 'Returns a paginated list of employees. Optionally filter by name and/or email (partial, case-insensitive).',
    }),
    (0, swagger_1.ApiQuery)({ name: 'name', required: false, type: String, description: 'Filter by employee name (partial, case-insensitive)', example: 'John' }),
    (0, swagger_1.ApiQuery)({ name: 'email', required: false, type: String, description: 'Filter by employee email (partial, case-insensitive)', example: 'john@company.com' }),
    (0, swagger_1.ApiQuery)({ name: 'page', required: false, type: Number, description: 'Page number (starts at 1)', example: 1 }),
    (0, swagger_1.ApiQuery)({ name: 'limit', required: false, type: Number, description: 'Number of items per page', example: 10 }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Paginated list of employees with metadata.',
        type: paginated_employees_dto_1.PaginatedEmployeesDto,
    }),
    openapi.ApiResponse({ status: 200, type: require("./dto/paginated-employees.dto").PaginatedEmployeesDto }),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [find_employees_query_dto_1.FindEmployeesQueryDto]),
    __metadata("design:returntype", Promise)
], EmployeesController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Get an employee by UUID' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Employee UUID', type: 'string' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Employee found.', type: employee_entity_1.Employee }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Employee not found.' }),
    openapi.ApiResponse({ status: 200, type: require("./entities/employee.entity").Employee }),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], EmployeesController.prototype, "findOne", null);
exports.EmployeesController = EmployeesController = __decorate([
    (0, swagger_1.ApiTags)('employees'),
    (0, common_1.Controller)('employees'),
    __metadata("design:paramtypes", [employees_service_1.EmployeesService])
], EmployeesController);
//# sourceMappingURL=employees.controller.js.map