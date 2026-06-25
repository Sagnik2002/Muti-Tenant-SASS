import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProjectsService } from './projects.service';
import { Project } from './entities/project.entity';
import { ProjectStatus } from '../common/enums';
import { NotificationsService } from '../notifications/notifications.service';
import { CACHE_MANAGER } from '@nestjs/cache-manager';

describe('ProjectsService', () => {
  let service: ProjectsService;
  let projectRepo: jest.Mocked<Repository<Project>>;
  let notificationsService: jest.Mocked<NotificationsService>;
  let cacheManager: jest.Mocked<any>;

  const mockProject: Partial<Project> = {
    id: 'proj-uuid',
    name: 'Test Project',
    description: 'A test project',
    status: ProjectStatus.ACTIVE,
    orgId: 'org-uuid',
    createdById: 'user-uuid',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProjectsService,
        {
          provide: getRepositoryToken(Project),
          useValue: {
            findOne: jest.fn(),
            find: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
            remove: jest.fn(),
            count: jest.fn(),
          },
        },
        {
          provide: NotificationsService,
          useValue: {
            sendToOrg: jest.fn().mockResolvedValue(undefined),
          },
        },
        {
          provide: CACHE_MANAGER,
          useValue: {
            get: jest.fn().mockResolvedValue(null),
            set: jest.fn().mockResolvedValue(undefined),
            del: jest.fn().mockResolvedValue(undefined),
          },
        },
      ],
    }).compile();

    service = module.get<ProjectsService>(ProjectsService);
    projectRepo = module.get(getRepositoryToken(Project));
    notificationsService = module.get(NotificationsService);
    cacheManager = module.get(CACHE_MANAGER);
  });

  describe('create', () => {
    it('should create a project and send notification', async () => {
      projectRepo.create.mockReturnValueOnce(mockProject as Project);
      projectRepo.save.mockResolvedValueOnce(mockProject as Project);

      const result = await service.create('org-uuid', { name: 'Test Project' }, 'user-uuid');

      expect(result.name).toBe('Test Project');
      expect(notificationsService.sendToOrg).toHaveBeenCalledWith(
        'org-uuid',
        'project:created',
        expect.objectContaining({ projectName: 'Test Project' }),
      );
      expect(cacheManager.del).toHaveBeenCalledWith('projects:org-uuid');
    });
  });

  describe('findAll', () => {
    it('should return cached data when available', async () => {
      cacheManager.get.mockResolvedValueOnce([mockProject]);

      const result = await service.findAll('org-uuid');

      expect(result).toHaveLength(1);
      expect(projectRepo.find).not.toHaveBeenCalled();
    });

    it('should fetch from DB and cache when no cache hit', async () => {
      cacheManager.get.mockResolvedValueOnce(null);
      projectRepo.find.mockResolvedValueOnce([mockProject as Project]);

      const result = await service.findAll('org-uuid');

      expect(result).toHaveLength(1);
      expect(projectRepo.find).toHaveBeenCalled();
      expect(cacheManager.set).toHaveBeenCalled();
    });
  });

  describe('findById', () => {
    it('should throw NotFoundException if project not found', async () => {
      projectRepo.findOne.mockResolvedValueOnce(null as any);

      await expect(service.findById('bad-id', 'org-uuid')).rejects.toThrow(NotFoundException);
    });
  });
});
