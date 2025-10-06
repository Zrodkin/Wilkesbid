// app/api/stripe/is-connected/route.ts
import { NextResponse } from 'next/server';
import { getStripeAccount } from '@/lib/stripe/database';

export async function GET() {
  try {
    const account = await getStripeAccount();
    
    return NextResponse.json({
      connected: !!account && !!account.stripe_account_id,
    });
  } catch (error) {
    console.error('Check Stripe connection error:', error);
    return NextResponse.json(
      { connected: false },
      { status: 200 } // Return 200 with false rather than error
    );
  }
}