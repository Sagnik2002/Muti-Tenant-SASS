import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Membership } from '../../organizations/entities/membership.entity';

/**
 * Validates that the authenticated user is a member of the organization
 * specified in the X-Org-Id header, and attaches the org role to the request.
 */
@Injectable()
export class TenantGuard implements CanActivate {
  constructor(
    @InjectRepository(Membership)
    private readonly membershipRepo: Repository<Membership>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const orgId = request.headers['x-org-id'];

    if (!orgId) {
      throw new BadRequestException('X-Org-Id header is required');
    }

    if (!user) {
      return false;
    }

    const membership = await this.membershipRepo.findOne({
      where: {
        userId: user.sub,
        orgId,
      },
    });

    if (!membership) {
      throw new ForbiddenException('You are not a member of this organization');
    }

    // Attach the org role to the user object for downstream guards
    request.user.orgRole = membership.role;
    request.user.orgId = orgId;

    return true;
  }
}
