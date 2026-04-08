import { Controller, Get, Put, Body, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { ProfilesService } from './profiles.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { Profile } from './entities/profile.entity';
import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../security/jwt-auth.guard';
import { RolesGuard } from '../security/roles.guard';
import { Roles } from '../security/roles.decorator';
import { ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('profiles')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('profiles')
export class ProfilesController {
    constructor(private readonly profilesService: ProfilesService) { }

    @Get()
    @Roles('USER', 'ADMIN')
    @ApiOperation({ summary: 'List all profiles' })
    @ApiResponse({ status: 200, description: 'List of all profiles.', type: [Profile] })
    findAll(): Promise<Profile[]> {
        return this.profilesService.findAll();
    }

    @Get(':employeeId')
    @Roles('USER', 'ADMIN')
    @ApiOperation({ summary: 'Get profile for a specific employee' })
    @ApiParam({ name: 'employeeId', description: 'Employee UUID', type: 'string' })
    @ApiResponse({ status: 200, description: 'Profile found.', type: Profile })
    @ApiResponse({ status: 404, description: 'Profile not found for the given employee.' })
    findByEmployeeId(@Param('employeeId') employeeId: string): Promise<Profile> {
        return this.profilesService.findByEmployeeId(employeeId);
    }

    @Put(':employeeId')
    @Roles('ADMIN')
    @ApiOperation({
        summary: 'Update profile for a specific employee',
        description: 'Updates editable fields: phone, address, city, biography. Name and email come from events and are not editable.',
    })
    @ApiParam({ name: 'employeeId', description: 'Employee UUID', type: 'string' })
    @ApiResponse({ status: 200, description: 'Profile updated.', type: Profile })
    @ApiResponse({ status: 404, description: 'Profile not found for the given employee.' })
    update(
        @Param('employeeId') employeeId: string,
        @Body() updateProfileDto: UpdateProfileDto,
    ): Promise<Profile> {
        return this.profilesService.update(employeeId, updateProfileDto);
    }
}
