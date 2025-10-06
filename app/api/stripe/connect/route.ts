// app/api/stripe/connect/route.ts
import { NextResponse } from 'next/server';
import { verifyAdmin } from '@/lib/auth';
import { getStripeConnectUrl } from '@/lib/stripe/connect';

export async function GET(request: Request) {
  try {
    // Verify admin
    const isAdmin = await verifyAdmin(request);
    if (!isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Generate OAuth URL
    const connectUrl = getStripeConnectUrl();
    
    // Redirect to Stripe Connect
    return NextResponse.redirect(connectUrl);
  } catch (error) {
    console.error('Stripe Connect initiation error:', error);
    return NextResponse.json(
      { error: 'Failed to initiate Stripe Connect' },
      { status: 500 }
    );
  }
}