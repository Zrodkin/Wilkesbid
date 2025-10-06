// lib/stripe/client.ts
import Stripe from 'stripe';

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY is not set in environment variables');
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2025-09-30.clover',
  typescript: true,
});

/**
 * Create a Stripe instance for a connected account
 * @param connectedAccountId - Stripe account ID (acct_xxx)
 * @returns Stripe instance configured for connected account
 */
export function getStripeForConnectedAccount(connectedAccountId: string) {
  return new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2025-09-30.clover',
    typescript: true,
    stripeAccount: connectedAccountId,
  });
}