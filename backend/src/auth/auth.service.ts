import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  Logger,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { ConfigService } from "@nestjs/config";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import * as bcrypt from "bcrypt";
import { v4 as uuidv4 } from "uuid";
import { User } from "../users/entities/user.entity";
import { RefreshToken } from "./entities/refresh-token.entity";
import { RegisterDto } from "./dto/register.dto";
import { LoginDto } from "./dto/login.dto";

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private readonly BCRYPT_ROUNDS = 12;

  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(RefreshToken)
    private readonly refreshTokenRepo: Repository<RefreshToken>,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async register(dto: RegisterDto) {
    // Check for existing user
    const existing = await this.userRepo.findOne({
      where: { email: dto.email.toLowerCase() },
    });
    if (existing) {
      throw new ConflictException("Email already registered");
    }

    // Hash password
    const passwordHash = await bcrypt.hash(dto.password, this.BCRYPT_ROUNDS);

    // Create user
    const user = this.userRepo.create({
      email: dto.email.toLowerCase(),
      passwordHash,
      firstName: dto.firstName,
      lastName: dto.lastName,
    });
    await this.userRepo.save(user);

    this.logger.log(`User registered: ${user.email}`);

    // Generate tokens
    return this.generateTokens(user);
  }

  async login(dto: LoginDto) {
    const user = await this.userRepo.findOne({
      where: { email: dto.email.toLowerCase() },
    });

    if (!user) {
      throw new UnauthorizedException("Invalid credentials");
    }

    const isPasswordValid = await bcrypt.compare(
      dto.password,
      user.passwordHash,
    );
    if (!isPasswordValid) {
      throw new UnauthorizedException("Invalid credentials");
    }

    if (!user.isActive) {
      throw new UnauthorizedException("Account is deactivated");
    }

    this.logger.log(`User logged in: ${user.email}`);

    return this.generateTokens(user);
  }

  async refresh(refreshTokenValue: string) {
    // O(1) lookup by SHA-256 hash
    const lookup = RefreshToken.computeLookup(refreshTokenValue);

    const tokenRecord = await this.refreshTokenRepo.findOne({
      where: { tokenLookup: lookup, revoked: false },
      relations: ["user"],
    });

    if (!tokenRecord) {
      throw new UnauthorizedException("Invalid refresh token");
    }

    // Verify with bcrypt (the cryptographic check)
    const isValid = await bcrypt.compare(
      refreshTokenValue,
      tokenRecord.tokenHash,
    );
    if (!isValid) {
      // Possible token forgery — revoke all tokens for this user for safety
      await this.refreshTokenRepo.update(
        { userId: tokenRecord.userId },
        { revoked: true },
      );
      throw new UnauthorizedException("Invalid refresh token");
    }

    if (new Date() > tokenRecord.expiresAt) {
      tokenRecord.revoked = true;
      await this.refreshTokenRepo.save(tokenRecord);
      throw new UnauthorizedException("Refresh token expired");
    }

    // Token rotation: revoke the used token
    tokenRecord.revoked = true;
    await this.refreshTokenRepo.save(tokenRecord);

    return this.generateTokens(tokenRecord.user);
  }

  async pruneExpiredTokens(): Promise<void> {
    await this.refreshTokenRepo
      .createQueryBuilder()
      .delete()
      .where("revoked = true")
      .orWhere("expiresAt < :now", { now: new Date() })
      .execute();
    this.logger.log("Pruned expired/revoked refresh tokens");
  }

  async logout(userId: string) {
    // Revoke all refresh tokens for this user
    await this.refreshTokenRepo.update(
      { userId, revoked: false },
      { revoked: true },
    );

    this.logger.log(`User logged out: ${userId}`);
    return { message: "Logged out successfully" };
  }

  private async generateTokens(user: User) {
    const payload = { sub: user.id, email: user.email };

    const accessToken = this.jwtService.sign(payload, {
      expiresIn: (this.configService.get<string>("jwt.accessExpiration") ??
        "15m") as any,
    });

    // Generate refresh token
    const refreshTokenValue = uuidv4();
    const refreshTokenHash = await bcrypt.hash(refreshTokenValue, 10);
    const tokenLookup = RefreshToken.computeLookup(refreshTokenValue);

    const refreshExpiration = this.configService.get<string>(
      "jwt.refreshExpiration",
    );
    const expiresAt = new Date();
    // Parse "7d" format
    const match = refreshExpiration?.match(/^(\d+)([dhms])$/);
    if (match) {
      const value = parseInt(match[1]);
      const unit = match[2];
      switch (unit) {
        case "d":
          expiresAt.setDate(expiresAt.getDate() + value);
          break;
        case "h":
          expiresAt.setHours(expiresAt.getHours() + value);
          break;
        case "m":
          expiresAt.setMinutes(expiresAt.getMinutes() + value);
          break;
        case "s":
          expiresAt.setSeconds(expiresAt.getSeconds() + value);
          break;
      }
    } else {
      expiresAt.setDate(expiresAt.getDate() + 7); // Default 7 days
    }

    const refreshToken = this.refreshTokenRepo.create({
      userId: user.id,
      tokenHash: refreshTokenHash,
      tokenLookup,
      expiresAt,
    });
    await this.refreshTokenRepo.save(refreshToken);

    return {
      accessToken,
      refreshToken: refreshTokenValue,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        avatarUrl: user.avatarUrl,
      },
    };
  }
}
