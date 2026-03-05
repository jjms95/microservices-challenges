import { IsString, IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateProfileDto {
    @ApiPropertyOptional({ example: '+57 300 123 4567' })
    @IsString()
    @IsOptional()
    phone?: string;

    @ApiPropertyOptional({ example: 'Calle 123 #45-67' })
    @IsString()
    @IsOptional()
    address?: string;

    @ApiPropertyOptional({ example: 'Bogotá' })
    @IsString()
    @IsOptional()
    city?: string;

    @ApiPropertyOptional({ example: 'Software engineer with 5 years of experience.' })
    @IsString()
    @IsOptional()
    biography?: string;
}
