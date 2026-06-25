import { Test, TestingModule } from "@nestjs/testing";
import { ConflictException } from "@nestjs/common";
import { getRepositoryToken } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { OrganizationsService } from "./organizations.service";
import { Organization } from "./entities/organization.entity";
import { Membership } from "./entities/membership.entity";
import { User } from "../users/entities/user.entity";
import { Role } from "../common/enums";

describe("OrganizationsService", () => {
  let service: OrganizationsService;
  let orgRepo: jest.Mocked<Repository<Organization>>;
  let membershipRepo: jest.Mocked<Repository<Membership>>;
  let _userRepo: jest.Mocked<Repository<User>>;

  const mockOrg: Organization = {
    id: "org-uuid",
    name: "Acme Corp",
    slug: "acme-corp",
    plan: "free",
    memberships: [],
    projects: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrganizationsService,
        {
          provide: getRepositoryToken(Organization),
          useValue: {
            findOne: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
            count: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(Membership),
          useValue: {
            findOne: jest.fn(),
            find: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
            remove: jest.fn(),
            count: jest.fn(),
            update: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(User),
          useValue: {
            findOne: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<OrganizationsService>(OrganizationsService);
    orgRepo = module.get(getRepositoryToken(Organization));
    membershipRepo = module.get(getRepositoryToken(Membership));
    _userRepo = module.get(getRepositoryToken(User));
  });

  describe("create", () => {
    it("should throw ConflictException if slug already taken", async () => {
      orgRepo.findOne.mockResolvedValueOnce(mockOrg);

      await expect(
        service.create({ name: "Test", slug: "acme-corp" }, "user-id"),
      ).rejects.toThrow(ConflictException);
    });

    it("should create org and assign ADMIN role to creator", async () => {
      orgRepo.findOne.mockResolvedValueOnce(null as any);
      orgRepo.create.mockReturnValueOnce(mockOrg);
      orgRepo.save.mockResolvedValueOnce(mockOrg);
      membershipRepo.create.mockReturnValueOnce({ role: Role.ADMIN } as any);
      membershipRepo.save.mockResolvedValueOnce({} as any);

      const result = await service.create(
        { name: "Acme Corp", slug: "acme-corp" },
        "user-uuid",
      );

      expect(result.slug).toBe("acme-corp");
      expect(membershipRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ role: Role.ADMIN }),
      );
    });
  });

  describe("findAll", () => {
    it("should return list of organizations for user", async () => {
      membershipRepo.find.mockResolvedValueOnce([
        { organization: mockOrg, role: Role.ADMIN } as any,
      ]);

      const result = await service.findAll("user-uuid");

      expect(result).toHaveLength(1);
      expect(result[0].role).toBe(Role.ADMIN);
    });
  });
});
