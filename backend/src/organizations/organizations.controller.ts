import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  UseGuards,
  Put,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiResponse,
  ApiSecurity,
} from '@nestjs/swagger';
import { OrganizationsService } from './organizations.service';
import { CreateOrganizationDto } from './dto/create-organization.dto';
import { AddMemberDto } from './dto/add-member.dto';
import { JwtAuthGuard, RolesGuard, TenantGuard } from '../common/guards';
import { CurrentUser, Roles } from '../common/decorators';
import { Role } from '../common/enums';

@ApiTags('Organizations')
@Controller('organizations')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('access-token')
export class OrganizationsController {
  constructor(private readonly orgService: OrganizationsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new organization' })
  @ApiResponse({ status: 201, description: 'Organization created' })
  async create(
    @Body() dto: CreateOrganizationDto,
    @CurrentUser('sub') userId: string,
  ) {
    return this.orgService.create(dto, userId);
  }

  @Get()
  @ApiOperation({ summary: 'List all organizations for the current user' })
  @ApiResponse({ status: 200, description: 'List of organizations' })
  async findAll(@CurrentUser('sub') userId: string) {
    return this.orgService.findAll(userId);
  }

  @Get(':orgId')
  @UseGuards(TenantGuard)
  @ApiSecurity('org-id')
  @ApiOperation({ summary: 'Get organization details' })
  @ApiResponse({ status: 200, description: 'Organization details' })
  async findOne(@Param('orgId') orgId: string) {
    return this.orgService.findById(orgId);
  }

  @Get(':orgId/members')
  @UseGuards(TenantGuard)
  @ApiSecurity('org-id')
  @ApiOperation({ summary: 'List organization members' })
  @ApiResponse({ status: 200, description: 'List of members' })
  async getMembers(@Param('orgId') orgId: string) {
    return this.orgService.getMembers(orgId);
  }

  @Post(':orgId/members')
  @UseGuards(TenantGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiSecurity('org-id')
  @ApiOperation({ summary: 'Add a member to the organization (ADMIN only)' })
  @ApiResponse({ status: 201, description: 'Member added' })
  async addMember(
    @Param('orgId') orgId: string,
    @Body() dto: AddMemberDto,
  ) {
    return this.orgService.addMember(orgId, dto);
  }

  @Delete(':orgId/members/:membershipId')
  @UseGuards(TenantGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiSecurity('org-id')
  @ApiOperation({ summary: 'Remove a member from the organization (ADMIN only)' })
  @ApiResponse({ status: 200, description: 'Member removed' })
  async removeMember(
    @Param('orgId') orgId: string,
    @Param('membershipId') membershipId: string,
    @CurrentUser('sub') userId: string,
  ) {
    return this.orgService.removeMember(orgId, membershipId, userId);
  }

  @Put(':orgId/members/:membershipId/role')
  @UseGuards(TenantGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiSecurity('org-id')
  @ApiOperation({ summary: 'Update member role (ADMIN only)' })
  @ApiResponse({ status: 200, description: 'Role updated' })
  async updateRole(
    @Param('orgId') orgId: string,
    @Param('membershipId') membershipId: string,
    @Body('role') role: Role,
  ) {
    return this.orgService.updateMemberRole(orgId, membershipId, role);
  }
}
