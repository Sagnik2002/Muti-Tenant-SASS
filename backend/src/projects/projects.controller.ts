import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiResponse,
  ApiSecurity,
} from '@nestjs/swagger';
import { ProjectsService } from './projects.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { JwtAuthGuard, TenantGuard, RolesGuard } from '../common/guards';
import { CurrentUser, Roles, TenantId } from '../common/decorators';
import { Role } from '../common/enums';

@ApiTags('Projects')
@Controller('projects')
@UseGuards(JwtAuthGuard, TenantGuard)
@ApiBearerAuth('access-token')
@ApiSecurity('org-id')
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.EDITOR)
  @ApiOperation({ summary: 'Create a new project (ADMIN, EDITOR)' })
  @ApiResponse({ status: 201, description: 'Project created' })
  async create(
    @TenantId() orgId: string,
    @Body() dto: CreateProjectDto,
    @CurrentUser('sub') userId: string,
  ) {
    return this.projectsService.create(orgId, dto, userId);
  }

  @Get()
  @ApiOperation({ summary: 'List all projects in the organization' })
  @ApiResponse({ status: 200, description: 'List of projects' })
  async findAll(@TenantId() orgId: string) {
    return this.projectsService.findAll(orgId);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get project statistics for the organization' })
  @ApiResponse({ status: 200, description: 'Project stats' })
  async getStats(@TenantId() orgId: string) {
    return this.projectsService.getStats(orgId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get project details with tasks' })
  @ApiResponse({ status: 200, description: 'Project details' })
  async findOne(
    @Param('id') id: string,
    @TenantId() orgId: string,
  ) {
    return this.projectsService.findById(id, orgId);
  }

  @Put(':id')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.EDITOR)
  @ApiOperation({ summary: 'Update a project (ADMIN, EDITOR)' })
  @ApiResponse({ status: 200, description: 'Project updated' })
  async update(
    @Param('id') id: string,
    @TenantId() orgId: string,
    @Body() dto: UpdateProjectDto,
    @CurrentUser('sub') userId: string,
  ) {
    return this.projectsService.update(id, orgId, dto, userId);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Delete a project (ADMIN only)' })
  @ApiResponse({ status: 200, description: 'Project deleted' })
  async remove(
    @Param('id') id: string,
    @TenantId() orgId: string,
  ) {
    return this.projectsService.remove(id, orgId);
  }
}
