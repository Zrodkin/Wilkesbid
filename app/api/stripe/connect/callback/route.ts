// app/api/stripe/connect/callback/route.ts
import { NextResponse } from 'next/server';
import { exchangeCodeForToken } from '@/lib/stripe/connect';
import { saveStripeAccount } from '@/lib/stripe/database';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const error = searchParams.get('error');
    const errorDescription = searchParams.get('error_description');
    
    // Handle OAuth errors
    if (error) {
      console.error('Stripe OAuth error:', error, errorDescription);
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_SITE_URL}/admin?stripe_error=${encodeURIComponent(errorDescription || error)}`
      );
    }
    
    // Verify we have authorization code
    if (!code) {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_SITE_URL}/admin?stripe_error=missing_code`
      );
    }
    
    // Exchange code for access token
    const credentials = await exchangeCodeForToken(code);
    
    // Save to database
    const savedAccount = await saveStripeAccount(credentials);
    
    if (!savedAccount) {
      throw new Error('Failed to save Stripe account to database');
    }
    
    // Redirect back to admin dashboard with success
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_SITE_URL}/admin?stripe_connected=true`
    );
  } catch (error) {
    console.error('Stripe Connect callback error:', error);
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_SITE_URL}/admin?stripe_error=connection_failed`
    );
  }
}