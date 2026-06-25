import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Organization } from './entities/organization.entity';
import { Membership } from './entities/membership.entity';
import { User } from '../users/entities/user.entity';
import { CreateOrganizationDto } from './dto/create-organization.dto';
import { AddMemberDto } from './dto/add-member.dto';
import { Role } from '../common/enums';

@Injectable()
export class OrganizationsService {
  constructor(
    @InjectRepository(Organization)
    private readonly orgRepo: Repository<Organization>,
    @InjectRepository(Membership)
    private readonly membershipRepo: Repository<Membership>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {}

  async create(dto: CreateOrganizationDto, userId: string) {
    // Check slug uniqueness
    const existing = await this.orgRepo.findOne({ where: { slug: dto.slug } });
    if (existing) {
      throw new ConflictException('Organization slug already taken');
    }

    const org = this.orgRepo.create(dto);
    await this.orgRepo.save(org);

    // Creator becomes ADMIN
    const membership = this.membershipRepo.create({
      userId,
      orgId: org.id,
      role: Role.ADMIN,
    });
    await this.membershipRepo.save(membership);

    return org;
  }

  async findAll(userId: string) {
    const memberships = await this.membershipRepo.find({
      where: { userId },
      relations: ['organization'],
    });

    return memberships.map((m) => ({
      ...m.organization,
      role: m.role,
    }));
  }

  async findById(orgId: string) {
    const org = await this.orgRepo.findOne({
      where: { id: orgId },
      relations: ['memberships', 'memberships.user'],
    });
    if (!org) {
      throw new NotFoundException('Organization not found');
    }
    return org;
  }

  async getMembers(orgId: string) {
    const memberships = await this.membershipRepo.find({
      where: { orgId },
      relations: ['user'],
    });

    return memberships.map((m) => ({
      id: m.id,
      userId: m.user.id,
      email: m.user.email,
      firstName: m.user.firstName,
      lastName: m.user.lastName,
      role: m.role,
      joinedAt: m.createdAt,
    }));
  }

  async addMember(orgId: string, dto: AddMemberDto) {
    const user = await this.userRepo.findOne({
      where: { email: dto.email.toLowerCase() },
    });
    if (!user) {
      throw new NotFoundException('User not found with this email');
    }

    const existing = await this.membershipRepo.findOne({
      where: { userId: user.id, orgId },
    });
    if (existing) {
      throw new ConflictException('User is already a member of this organization');
    }

    const membership = this.membershipRepo.create({
      userId: user.id,
      orgId,
      role: dto.role,
    });

    await this.membershipRepo.save(membership);
    return {
      id: membership.id,
      userId: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: membership.role,
    };
  }

  async removeMember(orgId: string, membershipId: string, requestingUserId: string) {
    const membership = await this.membershipRepo.findOne({
      where: { id: membershipId, orgId },
    });

    if (!membership) {
      throw new NotFoundException('Membership not found');
    }

    // Prevent removing yourself if you're the last admin
    if (membership.userId === requestingUserId) {
      const adminCount = await this.membershipRepo.count({
        where: { orgId, role: Role.ADMIN },
      });
      if (adminCount <= 1 && membership.role === Role.ADMIN) {
        throw new ForbiddenException(
          'Cannot remove the last admin from the organization',
        );
      }
    }

    await this.membershipRepo.remove(membership);
    return { message: 'Member removed successfully' };
  }

  async updateMemberRole(orgId: string, membershipId: string, role: Role) {
    const membership = await this.membershipRepo.findOne({
      where: { id: membershipId, orgId },
    });

    if (!membership) {
      throw new NotFoundException('Membership not found');
    }

    membership.role = role;
    await this.membershipRepo.save(membership);

    return membership;
  }
}
