// app/api/stripe/account-status/route.ts
import { NextResponse } from 'next/server';
import { verifyAdmin } from '@/lib/auth';
import { getStripeAccount, deleteStripeAccount } from '@/lib/stripe/database';
import { disconnectStripeAccount } from '@/lib/stripe/connect';

export async function GET(request: Request) {
  try {
    const isAdmin = await verifyAdmin(request);
    if (!isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const account = await getStripeAccount();
    
    return NextResponse.json({
      connected: !!account,
      accountId: account?.stripe_account_id || null,
      connectedAt: account?.created_at || null,
    });
  } catch (error) {
    console.error('Get Stripe account status error:', error);
    return NextResponse.json(
      { error: 'Failed to get account status' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const isAdmin = await verifyAdmin(request);
    if (!isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Get current account
    const account = await getStripeAccount();
    
    if (!account) {
      return NextResponse.json({ error: 'No account connected' }, { status: 404 });
    }
    
    // Revoke access via Stripe API
    await disconnectStripeAccount(account.stripe_account_id);
    
    // Delete from database
    await deleteStripeAccount();
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Disconnect Stripe account error:', error);
    return NextResponse.json(
      { error: 'Failed to disconnect account' },
      { status: 500 }
    );
  }
}