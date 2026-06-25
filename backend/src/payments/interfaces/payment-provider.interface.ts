/**
 * Payment Provider Interface — Strategy Pattern
 *
 * This interface defines the contract for all payment providers.
 * To add Stripe or Razorpay, implement this interface and register
 * the provider in the PaymentsModule — no business logic changes needed.
 */
export interface CreatePaymentInput {
  amount: number;
  currency: string;
  metadata?: Record<string, any>;
}

export interface PaymentResult {
  providerRef: string;
  status: 'pending' | 'completed' | 'failed';
  rawResponse?: Record<string, any>;
}

export interface VerifyPaymentResult {
  verified: boolean;
  status: 'completed' | 'failed' | 'pending';
  rawResponse?: Record<string, any>;
}

export interface RefundResult {
  refundRef: string;
  status: 'refunded' | 'failed';
  rawResponse?: Record<string, any>;
}

export const PAYMENT_PROVIDER = 'PAYMENT_PROVIDER';

export interface PaymentProvider {
  /** Create a new payment intent or order */
  createPayment(input: CreatePaymentInput): Promise<PaymentResult>;

  /** Verify payment completion (e.g., webhook callback or polling) */
  verifyPayment(providerRef: string): Promise<VerifyPaymentResult>;

  /** Issue a refund for a completed payment */
  refundPayment(providerRef: string, amount?: number): Promise<RefundResult>;
}
