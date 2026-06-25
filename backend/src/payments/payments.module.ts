import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';
import { Payment } from './entities/payment.entity';
import { Membership } from '../organizations/entities/membership.entity';
import { PAYMENT_PROVIDER } from './interfaces/payment-provider.interface';
import { MockPaymentProvider } from './providers/mock-payment.provider';

@Module({
  imports: [TypeOrmModule.forFeature([Payment, Membership])],
  controllers: [PaymentsController],
  providers: [
    PaymentsService,
    {
      provide: PAYMENT_PROVIDER,
      useClass: MockPaymentProvider,
      // To switch to Stripe:   useClass: StripePaymentProvider
      // To switch to Razorpay: useClass: RazorpayPaymentProvider
    },
  ],
  exports: [PaymentsService],
})
export class PaymentsModule {}
