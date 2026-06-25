import {
  Injectable,
  NotFoundException,
  Inject,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { Project } from './entities/project.entity';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { ProjectStatus } from '../common/enums';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class ProjectsService {
  private readonly logger = new Logger(ProjectsService.name);

  constructor(
    @InjectRepository(Project)
    private readonly projectRepo: Repository<Project>,
    @Inject(CACHE_MANAGER)
    private readonly cacheManager: Cache,
    private readonly notificationsService: NotificationsService,
  ) {}

  async create(orgId: string, dto: CreateProjectDto, userId: string) {
    const project = this.projectRepo.create({
      ...dto,
      orgId,
      createdById: userId,
    });
    await this.projectRepo.save(project);

    // Invalidate org projects cache
    await this.cacheManager.del(`projects:${orgId}`);

    // Notify org members via WebSocket
    await this.notificationsService.sendToOrg(orgId, 'project:created', {
      projectId: project.id,
      projectName: project.name,
      createdBy: userId,
    });

    this.logger.log(`Project created: ${project.name} in org ${orgId}`);
    return project;
  }

  async findAll(orgId: string) {
    const cacheKey = `projects:${orgId}`;
    const cached = await this.cacheManager.get<Project[]>(cacheKey);
    if (cached) {
      this.logger.debug(`Cache hit for ${cacheKey}`);
      return cached;
    }

    const projects = await this.projectRepo.find({
      where: { orgId },
      relations: ['createdBy'],
      order: { createdAt: 'DESC' },
    });

    // Cache for 5 minutes (in milliseconds for cache-manager v5)
    await this.cacheManager.set(cacheKey, projects, 300000);

    return projects;
  }

  async findById(id: string, orgId: string) {
    const project = await this.projectRepo.findOne({
      where: { id, orgId },
      relations: ['createdBy', 'tasks', 'tasks.assignee'],
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    return project;
  }

  async update(id: string, orgId: string, dto: UpdateProjectDto, userId: string) {
    const project = await this.projectRepo.findOne({ where: { id, orgId } });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    Object.assign(project, dto);
    await this.projectRepo.save(project);

    await this.cacheManager.del(`projects:${orgId}`);

    await this.notificationsService.sendToOrg(orgId, 'project:updated', {
      projectId: project.id,
      projectName: project.name,
      updatedBy: userId,
      changes: dto,
    });

    return project;
  }

  async remove(id: string, orgId: string) {
    const project = await this.projectRepo.findOne({ where: { id, orgId } });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    await this.projectRepo.remove(project);
    await this.cacheManager.del(`projects:${orgId}`);

    return { message: 'Project deleted successfully' };
  }

  async getStats(orgId: string) {
    const totalProjects = await this.projectRepo.count({ where: { orgId } });
    const activeProjects = await this.projectRepo.count({
      where: { orgId, status: ProjectStatus.ACTIVE },
    });
    const archivedProjects = await this.projectRepo.count({
      where: { orgId, status: ProjectStatus.ARCHIVED },
    });
    const completedProjects = await this.projectRepo.count({
      where: { orgId, status: ProjectStatus.COMPLETED },
    });

    return { totalProjects, activeProjects, archivedProjects, completedProjects };
  }
}
