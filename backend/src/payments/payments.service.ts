import { Injectable, Inject, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Payment } from './entities/payment.entity';
import {
  PAYMENT_PROVIDER,
  PaymentProvider,
} from './interfaces/payment-provider.interface';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { PaymentStatus } from '../common/enums';

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);

  constructor(
    @InjectRepository(Payment)
    private readonly paymentRepo: Repository<Payment>,
    @Inject(PAYMENT_PROVIDER)
    private readonly paymentProvider: PaymentProvider,
  ) {}

  async createPayment(orgId: string, dto: CreatePaymentDto) {
    // Call the payment provider
    const result = await this.paymentProvider.createPayment({
      amount: dto.amount,
      currency: dto.currency,
      metadata: dto.metadata,
    });

    // Store in DB
    const payment = this.paymentRepo.create({
      orgId,
      amount: dto.amount,
      currency: dto.currency,
      provider: 'mock', // or 'stripe', 'razorpay'
      providerRef: result.providerRef,
      status: result.status === 'completed' ? PaymentStatus.COMPLETED : PaymentStatus.PENDING,
      metadata: dto.metadata,
    });

    await this.paymentRepo.save(payment);
    this.logger.log(`Payment created: ${payment.id} — ${result.providerRef}`);

    return payment;
  }

  async verifyPayment(paymentId: string, orgId: string) {
    const payment = await this.paymentRepo.findOne({
      where: { id: paymentId, orgId },
    });

    if (!payment) {
      throw new NotFoundException('Payment not found');
    }

    const result = await this.paymentProvider.verifyPayment(payment.providerRef);

    payment.status = result.verified ? PaymentStatus.COMPLETED : PaymentStatus.FAILED;
    await this.paymentRepo.save(payment);

    return { payment, verification: result };
  }

  async refundPayment(paymentId: string, orgId: string) {
    const payment = await this.paymentRepo.findOne({
      where: { id: paymentId, orgId },
    });

    if (!payment) {
      throw new NotFoundException('Payment not found');
    }

    const result = await this.paymentProvider.refundPayment(
      payment.providerRef,
      payment.amount,
    );

    if (result.status === 'refunded') {
      payment.status = PaymentStatus.REFUNDED;
      await this.paymentRepo.save(payment);
    }

    return { payment, refund: result };
  }

  async findByOrg(orgId: string) {
    return this.paymentRepo.find({
      where: { orgId },
      order: { createdAt: 'DESC' },
    });
  }
}
