import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, MaxLength, IsEnum, MinLength } from 'class-validator';
import { ProjectStatus } from '../../common/enums';

export class UpdateProjectDto {
  @ApiProperty({ example: 'Website Redesign v2', required: false })
  @IsString()
  @IsOptional()
  @MinLength(2)
  @MaxLength(200)
  name?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  @MaxLength(2000)
  description?: string;

  @ApiProperty({ enum: ProjectStatus, required: false })
  @IsEnum(ProjectStatus)
  @IsOptional()
  status?: ProjectStatus;
}
