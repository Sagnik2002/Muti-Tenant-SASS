import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiResponse,
  ApiSecurity,
} from '@nestjs/swagger';
import { PaymentsService } from './payments.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { JwtAuthGuard, TenantGuard, RolesGuard } from '../common/guards';
import { Roles, TenantId } from '../common/decorators';
import { Role } from '../common/enums';

@ApiTags('Payments')
@Controller('payments')
@UseGuards(JwtAuthGuard, TenantGuard)
@ApiBearerAuth('access-token')
@ApiSecurity('org-id')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Create a payment (ADMIN only)' })
  @ApiResponse({ status: 201, description: 'Payment created' })
  async create(
    @TenantId() orgId: string,
    @Body() dto: CreatePaymentDto,
  ) {
    return this.paymentsService.createPayment(orgId, dto);
  }

  @Get()
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'List payments for the organization' })
  @ApiResponse({ status: 200, description: 'List of payments' })
  async findAll(@TenantId() orgId: string) {
    return this.paymentsService.findByOrg(orgId);
  }

  @Post(':id/verify')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Verify a payment' })
  @ApiResponse({ status: 200, description: 'Payment verification result' })
  async verify(
    @Param('id') id: string,
    @TenantId() orgId: string,
  ) {
    return this.paymentsService.verifyPayment(id, orgId);
  }

  @Post(':id/refund')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Refund a payment (ADMIN only)' })
  @ApiResponse({ status: 200, description: 'Refund result' })
  async refund(
    @Param('id') id: string,
    @TenantId() orgId: string,
  ) {
    return this.paymentsService.refundPayment(id, orgId);
  }
}
