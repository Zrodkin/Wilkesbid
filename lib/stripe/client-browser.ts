// lib/stripe/client-browser.ts
import { loadStripe, Stripe } from '@stripe/stripe-js';

// Store multiple Stripe instances by account ID
const stripeInstances = new Map<string, Promise<Stripe | null>>();

export const getStripe = (connectedAccountId?: string) => {
  if (!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY) {
    throw new Error('NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY is not set');
  }
  
  // Use account ID as key, or 'default' if none
  const key = connectedAccountId || 'default';
  
  if (!stripeInstances.has(key)) {
    const instance = loadStripe(
      process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
      connectedAccountId ? { stripeAccount: connectedAccountId } : undefined
    );
    stripeInstances.set(key, instance);
  }
  
  return stripeInstances.get(key)!;
};