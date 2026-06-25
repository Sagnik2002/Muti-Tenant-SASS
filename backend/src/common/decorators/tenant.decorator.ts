import { createParamDecorator, ExecutionContext, BadRequestException } from '@nestjs/common';

/**
 * Extracts the organization ID from the X-Org-Id header.
 * This is the tenant context for multi-tenancy scoping.
 */
export const TenantId = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): string => {
    const request = ctx.switchToHttp().getRequest();
    const orgId = request.headers['x-org-id'];
    if (!orgId) {
      throw new BadRequestException('X-Org-Id header is required for tenant-scoped operations');
    }
    return orgId;
  },
);
