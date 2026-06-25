import { Test, TestingModule } from "@nestjs/testing";
import { ConflictException, UnauthorizedException } from "@nestjs/common";
import { getRepositoryToken } from "@nestjs/typeorm";
import { JwtService } from "@nestjs/jwt";
import { ConfigService } from "@nestjs/config";
import { Repository } from "typeorm";
import * as bcrypt from "bcrypt";
import { AuthService } from "./auth.service";
import { User } from "../users/entities/user.entity";
import { RefreshToken } from "./entities/refresh-token.entity";

describe("AuthService", () => {
  let service: AuthService;
  let userRepo: jest.Mocked<Repository<User>>;
  let refreshTokenRepo: jest.Mocked<Repository<RefreshToken>>;
  let _jwtService: jest.Mocked<JwtService>;

  const mockUser: User = {
    id: "user-uuid",
    email: "test@example.com",
    passwordHash: "$2b$12$hash",
    firstName: "John",
    lastName: "Doe",
    avatarUrl: null as any,
    isActive: true,
    memberships: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: getRepositoryToken(User),
          useValue: {
            findOne: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
            update: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(RefreshToken),
          useValue: {
            find: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
            update: jest.fn(),
          },
        },
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn().mockReturnValue("mock-access-token"),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              const config: Record<string, any> = {
                "jwt.secret": "test-secret",
                "jwt.accessExpiration": "15m",
                "jwt.refreshExpiration": "7d",
              };
              return config[key];
            }),
          },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    userRepo = module.get(getRepositoryToken(User));
    refreshTokenRepo = module.get(getRepositoryToken(RefreshToken));
    _jwtService = module.get(JwtService);
  });

  describe("register", () => {
    it("should throw ConflictException if email already exists", async () => {
      userRepo.findOne.mockResolvedValueOnce(mockUser);

      await expect(
        service.register({
          email: "test@example.com",
          password: "password123",
          firstName: "John",
          lastName: "Doe",
        }),
      ).rejects.toThrow(ConflictException);
    });

    it("should register a new user and return tokens", async () => {
      userRepo.findOne.mockResolvedValueOnce(null as any);
      userRepo.create.mockReturnValueOnce(mockUser);
      userRepo.save.mockResolvedValueOnce(mockUser);
      refreshTokenRepo.create.mockReturnValueOnce({} as any);
      refreshTokenRepo.save.mockResolvedValueOnce({} as any);

      const result = await service.register({
        email: "new@example.com",
        password: "password123",
        firstName: "Jane",
        lastName: "Doe",
      });

      expect(result).toHaveProperty("accessToken");
      expect(result).toHaveProperty("refreshToken");
      expect(result).toHaveProperty("user");
    });
  });

  describe("login", () => {
    it("should throw UnauthorizedException for wrong credentials", async () => {
      userRepo.findOne.mockResolvedValueOnce(null as any);

      await expect(
        service.login({ email: "wrong@example.com", password: "pass" }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it("should return tokens on valid login", async () => {
      const hashedPassword = await bcrypt.hash("password123", 10);
      const userWithHash = { ...mockUser, passwordHash: hashedPassword };

      userRepo.findOne.mockResolvedValueOnce(userWithHash as any);
      refreshTokenRepo.create.mockReturnValueOnce({} as any);
      refreshTokenRepo.save.mockResolvedValueOnce({} as any);

      const result = await service.login({
        email: "test@example.com",
        password: "password123",
      });

      expect(result).toHaveProperty("accessToken", "mock-access-token");
      expect(result.user.email).toBe("test@example.com");
    });
  });

  describe("logout", () => {
    it("should revoke all refresh tokens for user", async () => {
      refreshTokenRepo.update.mockResolvedValueOnce({} as any);

      const result = await service.logout("user-uuid");

      expect(refreshTokenRepo.update).toHaveBeenCalledWith(
        { userId: "user-uuid", revoked: false },
        { revoked: true },
      );
      expect(result.message).toContain("Logged out");
    });
  });
});
