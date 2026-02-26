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
exports.DepartmentsController = void 0;
const openapi = require("@nestjs/swagger");
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const departments_service_1 = require("./departments.service");
const create_department_dto_1 = require("./dto/create-department.dto");
const update_department_dto_1 = require("./dto/update-department.dto");
const find_departments_query_dto_1 = require("./dto/find-departments-query.dto");
const paginated_departments_dto_1 = require("./dto/paginated-departments.dto");
const department_entity_1 = require("./entities/department.entity");
let DepartmentsController = class DepartmentsController {
    departmentsService;
    constructor(departmentsService) {
        this.departmentsService = departmentsService;
    }
    create(createDepartmentDto) {
        return this.departmentsService.create(createDepartmentDto);
    }
    findAll(query) {
        return this.departmentsService.findAll(query);
    }
    findOne(id) {
        return this.departmentsService.findOne(id);
    }
    update(id, updateDepartmentDto) {
        return this.departmentsService.update(id, updateDepartmentDto);
    }
    remove(id) {
        return this.departmentsService.remove(id);
    }
};
exports.DepartmentsController = DepartmentsController;
__decorate([
    (0, common_1.Post)(),
    (0, swagger_1.ApiOperation)({ summary: 'Create a new department' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Department created successfully.', type: department_entity_1.Department }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Invalid input data.' }),
    openapi.ApiResponse({ status: 201, type: require("./entities/department.entity").Department }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_department_dto_1.CreateDepartmentDto]),
    __metadata("design:returntype", Promise)
], DepartmentsController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({
        summary: 'List all departments',
        description: 'Returns a paginated list of departments. Optionally filter by name (partial, case-insensitive).',
    }),
    (0, swagger_1.ApiQuery)({ name: 'name', required: false, type: String, description: 'Filter by department name (partial, case-insensitive)', example: 'Tech' }),
    (0, swagger_1.ApiQuery)({ name: 'page', required: false, type: Number, description: 'Page number (starts at 1)', example: 1 }),
    (0, swagger_1.ApiQuery)({ name: 'limit', required: false, type: Number, description: 'Number of items per page', example: 10 }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Paginated list of departments with metadata.', type: paginated_departments_dto_1.PaginatedDepartmentsDto }),
    openapi.ApiResponse({ status: 200, type: require("./dto/paginated-departments.dto").PaginatedDepartmentsDto }),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [find_departments_query_dto_1.FindDepartmentsQueryDto]),
    __metadata("design:returntype", Promise)
], DepartmentsController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Get a department by UUID' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Department UUID', type: 'string' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Department found.', type: department_entity_1.Department }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Department not found.' }),
    openapi.ApiResponse({ status: 200, type: require("./entities/department.entity").Department }),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], DepartmentsController.prototype, "findOne", null);
__decorate([
    (0, common_1.Put)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Update a department by UUID' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Department UUID', type: 'string' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Department updated.', type: department_entity_1.Department }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Department not found.' }),
    openapi.ApiResponse({ status: 200, type: require("./entities/department.entity").Department }),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_department_dto_1.UpdateDepartmentDto]),
    __metadata("design:returntype", Promise)
], DepartmentsController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, common_1.HttpCode)(common_1.HttpStatus.NO_CONTENT),
    (0, swagger_1.ApiOperation)({ summary: 'Delete a department by UUID' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Department UUID', type: 'string' }),
    (0, swagger_1.ApiResponse)({ status: 204, description: 'Department deleted.' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Department not found.' }),
    openapi.ApiResponse({ status: common_1.HttpStatus.NO_CONTENT }),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], DepartmentsController.prototype, "remove", null);
exports.DepartmentsController = DepartmentsController = __decorate([
    (0, swagger_1.ApiTags)('departments'),
    (0, common_1.Controller)('departments'),
    __metadata("design:paramtypes", [departments_service_1.DepartmentsService])
], DepartmentsController);
//# sourceMappingURL=departments.controller.js.map