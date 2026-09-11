/**
 * Entirely client-side fake payment processor. No network calls, no backend.
 * Behavior is driven by well-known Stripe-style test card numbers so the
 * demo can exercise success, decline, and "transient failure then success on
 * retry" without any real payment infrastructure.
 */

export const TEST_CARDS = {
  SUCCESS: '4242424242424242',
  DECLINE: '4000000000000002',
  FAIL_THEN_SUCCEED: '4000000000000341',
} as const;

export type PaymentOutcome =
  | { status: 'success' }
  | { status: 'declined'; message: string }
  | { status: 'failed'; message: string };

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * `attemptNumber` is 1 on the first submit of a given card number in this
 * session, 2 on the next, etc. — it's how FAIL_THEN_SUCCEED knows to
 * succeed on retry.
 */
export async function simulatePayment(
  cardNumberDigits: string,
  attemptNumber: number
): Promise<PaymentOutcome> {
  await delay(1100 + Math.random() * 600);

  if (cardNumberDigits === TEST_CARDS.SUCCESS) {
    return { status: 'success' };
  }
  if (cardNumberDigits === TEST_CARDS.DECLINE) {
    return {
      status: 'declined',
      message: 'Your card was declined. Please try a different card.',
    };
  }
  if (cardNumberDigits === TEST_CARDS.FAIL_THEN_SUCCEED) {
    if (attemptNumber <= 1) {
      return {
        status: 'failed',
        message: 'A network error occurred while processing your payment. Please try again.',
      };
    }
    return { status: 'success' };
  }

  // Any other well-formed card number: default to a decline so the demo
  // stays predictable for numbers outside the three documented test cards.
  return {
    status: 'declined',
    message: 'Your card was declined. Please try a different card.',
  };
}
