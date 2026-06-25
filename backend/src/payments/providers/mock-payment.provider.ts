import { Injectable, Logger } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import {
  PaymentProvider,
  CreatePaymentInput,
  PaymentResult,
  VerifyPaymentResult,
  RefundResult,
} from '../interfaces/payment-provider.interface';

/**
 * Mock Payment Provider — simulates payment gateway behavior.
 *
 * Replace this with StripePaymentProvider or RazorpayPaymentProvider
 * by implementing the PaymentProvider interface and swapping the
 * provider registration in PaymentsModule.
 */
@Injectable()
export class MockPaymentProvider implements PaymentProvider {
  private readonly logger = new Logger(MockPaymentProvider.name);
  private readonly payments = new Map<string, { amount: number; currency: string; status: string }>();

  async createPayment(input: CreatePaymentInput): Promise<PaymentResult> {
    const providerRef = `mock_pay_${uuidv4().slice(0, 8)}`;

    this.payments.set(providerRef, {
      amount: input.amount,
      currency: input.currency,
      status: 'completed', // Mock always succeeds
    });

    this.logger.log(`[MOCK] Payment created: ${providerRef} — $${input.amount} ${input.currency}`);

    return {
      providerRef,
      status: 'completed',
      rawResponse: { mockId: providerRef, timestamp: new Date().toISOString() },
    };
  }

  async verifyPayment(providerRef: string): Promise<VerifyPaymentResult> {
    const payment = this.payments.get(providerRef);

    if (!payment) {
      this.logger.warn(`[MOCK] Payment not found: ${providerRef}`);
      return { verified: false, status: 'failed' };
    }

    this.logger.log(`[MOCK] Payment verified: ${providerRef}`);
    return {
      verified: true,
      status: 'completed',
      rawResponse: { mockId: providerRef, verifiedAt: new Date().toISOString() },
    };
  }

  async refundPayment(providerRef: string, amount?: number): Promise<RefundResult> {
    const payment = this.payments.get(providerRef);

    if (!payment) {
      this.logger.warn(`[MOCK] Refund failed — payment not found: ${providerRef}`);
      return { refundRef: '', status: 'failed' };
    }

    const refundRef = `mock_ref_${uuidv4().slice(0, 8)}`;
    payment.status = 'refunded';

    this.logger.log(
      `[MOCK] Refund processed: ${refundRef} for payment ${providerRef} — $${amount || payment.amount}`,
    );

    return {
      refundRef,
      status: 'refunded',
      rawResponse: { mockId: refundRef, refundedAt: new Date().toISOString() },
    };
  }
}
