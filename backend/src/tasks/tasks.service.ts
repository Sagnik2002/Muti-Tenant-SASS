import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Task } from './entities/task.entity';
import { Project } from '../projects/entities/project.entity';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class TasksService {
  private readonly logger = new Logger(TasksService.name);

  constructor(
    @InjectRepository(Task)
    private readonly taskRepo: Repository<Task>,
    @InjectRepository(Project)
    private readonly projectRepo: Repository<Project>,
    private readonly notificationsService: NotificationsService,
  ) {}

  async create(orgId: string, dto: CreateTaskDto, userId: string) {
    // Verify project belongs to org
    const project = await this.projectRepo.findOne({
      where: { id: dto.projectId, orgId },
    });
    if (!project) {
      throw new NotFoundException('Project not found in this organization');
    }

    const task = this.taskRepo.create({
      ...dto,
      createdById: userId,
    });
    await this.taskRepo.save(task);

    // Notify if assignee is set
    if (dto.assigneeId) {
      await this.notificationsService.sendToOrg(orgId, 'task:assigned', {
        taskId: task.id,
        taskTitle: task.title,
        assigneeId: dto.assigneeId,
        assignedBy: userId,
        projectName: project.name,
      });
    }

    this.logger.log(`Task created: ${task.title} in project ${project.name}`);
    return task;
  }

  async findByProject(projectId: string, orgId: string) {
    // Verify project belongs to org
    const project = await this.projectRepo.findOne({
      where: { id: projectId, orgId },
    });
    if (!project) {
      throw new NotFoundException('Project not found in this organization');
    }

    return this.taskRepo.find({
      where: { projectId },
      relations: ['assignee', 'createdBy'],
      order: { createdAt: 'DESC' },
    });
  }

  async findById(id: string, orgId: string) {
    const task = await this.taskRepo.findOne({
      where: { id },
      relations: ['assignee', 'createdBy', 'project'],
    });

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    // Verify task's project belongs to org
    if (task.project.orgId !== orgId) {
      throw new ForbiddenException('Task does not belong to this organization');
    }

    return task;
  }

  async update(id: string, orgId: string, dto: UpdateTaskDto, userId: string) {
    const task = await this.findById(id, orgId);

    const previousAssigneeId = task.assigneeId;
    Object.assign(task, dto);
    await this.taskRepo.save(task);

    // Notify on assignment change
    if (dto.assigneeId && dto.assigneeId !== previousAssigneeId) {
      await this.notificationsService.sendToOrg(orgId, 'task:assigned', {
        taskId: task.id,
        taskTitle: task.title,
        assigneeId: dto.assigneeId,
        assignedBy: userId,
        projectName: task.project.name,
      });
    }

    // Notify on status change
    if (dto.status) {
      await this.notificationsService.sendToOrg(orgId, 'task:updated', {
        taskId: task.id,
        taskTitle: task.title,
        newStatus: dto.status,
        updatedBy: userId,
      });
    }

    return task;
  }

  async remove(id: string, orgId: string) {
    const task = await this.findById(id, orgId);
    await this.taskRepo.remove(task);
    return { message: 'Task deleted successfully' };
  }

  async getStatsByOrg(orgId: string) {
    const tasks = await this.taskRepo
      .createQueryBuilder('task')
      .innerJoin('task.project', 'project')
      .where('project.org_id = :orgId', { orgId })
      .select('task.status', 'status')
      .addSelect('COUNT(*)', 'count')
      .groupBy('task.status')
      .getRawMany();

    return tasks.reduce(
      (acc, { status, count }) => {
        acc[status] = parseInt(count, 10);
        return acc;
      },
      {} as Record<string, number>,
    );
  }
}
