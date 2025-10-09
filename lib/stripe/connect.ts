// lib/stripe/connect.ts
import { stripe } from './client';

if (!process.env.STRIPE_CLIENT_ID) {
  throw new Error('STRIPE_CLIENT_ID is not set in environment variables');
}

const STRIPE_CLIENT_ID = process.env.STRIPE_CLIENT_ID;
// Define SITE_URL from environment or set a default value
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

/**
 * Generate Stripe Connect OAuth URL
 * @returns OAuth URL for admin to authorize
 */
export function getStripeConnectUrl(): string {
  const params = new URLSearchParams({
    client_id: STRIPE_CLIENT_ID!,
    state: generateRandomState(),
    scope: 'read_write',
    redirect_uri: `${SITE_URL}/api/stripe/connect/callback`,
    response_type: 'code',
    'stripe_user[business_type]': 'non_profit',
    'stripe_user[email]': '', // Admin can fill this in
  });
  
  return `https://connect.stripe.com/oauth/authorize?${params.toString()}`;
}

/**
 * Exchange authorization code for access token
 * @param code - Authorization code from OAuth callback
 * @returns Stripe account credentials
 */
export async function exchangeCodeForToken(code: string) {
  try {
    const response = await stripe.oauth.token({
      grant_type: 'authorization_code',
      code,
    });
    
    // Ensure stripe_user_id exists
    if (!response.stripe_user_id) {
      throw new Error('No stripe_user_id received from Stripe OAuth');
    }
    
    return {
      stripe_account_id: response.stripe_user_id,
      access_token: response.access_token || undefined,
      refresh_token: response.refresh_token || undefined,
      stripe_user_id: response.stripe_user_id,
    };
  } catch (error) {
    console.error('Error exchanging code for token:', error);
    throw error;
  }
}

/**
 * Disconnect Stripe account (revoke access)
 * @param stripeAccountId - Stripe account ID to disconnect
 */
export async function disconnectStripeAccount(stripeAccountId: string) {
  try {
    await stripe.oauth.deauthorize({
      client_id: STRIPE_CLIENT_ID!,
      stripe_user_id: stripeAccountId,
    });
    
    return { success: true };
  } catch (error) {
    console.error('Error disconnecting Stripe account:', error);
    throw error;
  }
}

/**
 * Generate random state for OAuth security
 */
function generateRandomState(): string {
  return Math.random().toString(36).substring(2, 15) + 
         Math.random().toString(36).substring(2, 15);
}