import { MockPaymentProvider } from './mock-payment.provider';

describe('MockPaymentProvider', () => {
  let provider: MockPaymentProvider;

  beforeEach(() => {
    provider = new MockPaymentProvider();
  });

  describe('createPayment', () => {
    it('should return a providerRef and completed status', async () => {
      const result = await provider.createPayment({
        amount: 29.99,
        currency: 'USD',
      });

      expect(result.providerRef).toMatch(/^mock_pay_/);
      expect(result.status).toBe('completed');
    });
  });

  describe('verifyPayment', () => {
    it('should verify an existing payment', async () => {
      const created = await provider.createPayment({ amount: 10, currency: 'USD' });
      const verified = await provider.verifyPayment(created.providerRef);

      expect(verified.verified).toBe(true);
      expect(verified.status).toBe('completed');
    });

    it('should return unverified for non-existent payment', async () => {
      const result = await provider.verifyPayment('non-existent-ref');
      expect(result.verified).toBe(false);
    });
  });

  describe('refundPayment', () => {
    it('should refund an existing payment', async () => {
      const created = await provider.createPayment({ amount: 50, currency: 'USD' });
      const refunded = await provider.refundPayment(created.providerRef);

      expect(refunded.status).toBe('refunded');
      expect(refunded.refundRef).toMatch(/^mock_ref_/);
    });

    it('should fail refund for non-existent payment', async () => {
      const result = await provider.refundPayment('non-existent');
      expect(result.status).toBe('failed');
    });
  });
});
