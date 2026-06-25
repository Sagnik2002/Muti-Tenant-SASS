import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiResponse,
  ApiSecurity,
  ApiQuery,
} from '@nestjs/swagger';
import { TasksService } from './tasks.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { JwtAuthGuard, TenantGuard, RolesGuard } from '../common/guards';
import { CurrentUser, Roles, TenantId } from '../common/decorators';
import { Role } from '../common/enums';

@ApiTags('Tasks')
@Controller('tasks')
@UseGuards(JwtAuthGuard, TenantGuard)
@ApiBearerAuth('access-token')
@ApiSecurity('org-id')
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.EDITOR)
  @ApiOperation({ summary: 'Create a new task (ADMIN, EDITOR)' })
  @ApiResponse({ status: 201, description: 'Task created' })
  async create(
    @TenantId() orgId: string,
    @Body() dto: CreateTaskDto,
    @CurrentUser('sub') userId: string,
  ) {
    return this.tasksService.create(orgId, dto, userId);
  }

  @Get()
  @ApiOperation({ summary: 'List tasks for a project' })
  @ApiQuery({ name: 'projectId', required: true })
  @ApiResponse({ status: 200, description: 'List of tasks' })
  async findByProject(
    @Query('projectId') projectId: string,
    @TenantId() orgId: string,
  ) {
    return this.tasksService.findByProject(projectId, orgId);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get task statistics for the organization' })
  @ApiResponse({ status: 200, description: 'Task stats by status' })
  async getStats(@TenantId() orgId: string) {
    return this.tasksService.getStatsByOrg(orgId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get task details' })
  @ApiResponse({ status: 200, description: 'Task details' })
  async findOne(
    @Param('id') id: string,
    @TenantId() orgId: string,
  ) {
    return this.tasksService.findById(id, orgId);
  }

  @Put(':id')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.EDITOR)
  @ApiOperation({ summary: 'Update a task (ADMIN, EDITOR)' })
  @ApiResponse({ status: 200, description: 'Task updated' })
  async update(
    @Param('id') id: string,
    @TenantId() orgId: string,
    @Body() dto: UpdateTaskDto,
    @CurrentUser('sub') userId: string,
  ) {
    return this.tasksService.update(id, orgId, dto, userId);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Delete a task (ADMIN only)' })
  @ApiResponse({ status: 200, description: 'Task deleted' })
  async remove(
    @Param('id') id: string,
    @TenantId() orgId: string,
  ) {
    return this.tasksService.remove(id, orgId);
  }
}
