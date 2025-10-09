// app/api/stripe/create-payment-intent/route.ts
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getStripeAccount } from '@/lib/stripe/database';
import { stripe } from '@/lib/stripe/client';
import { 
  calculatePaymentTotal, 
  dollarsToCents, 
  generatePaymentMetadata 
} from '@/lib/stripe/helpers';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { itemIds, bidderEmail, coverProcessingFee = true } = body;
    
    if (!itemIds || !Array.isArray(itemIds) || itemIds.length === 0) {
      return NextResponse.json(
        { error: 'Item IDs are required' },
        { status: 400 }
      );
    }
    
    if (!bidderEmail) {
      return NextResponse.json(
        { error: 'Bidder email is required' },
        { status: 400 }
      );
    }
    
    // Get Stripe account
    const stripeAccount = await getStripeAccount();
    if (!stripeAccount) {
      return NextResponse.json(
        { error: 'Stripe not connected. Please contact administrator.' },
        { status: 503 }
      );
    }
    
    // Get auction items
    const supabase = await createClient();
    const { data: items, error: itemsError } = await supabase
      .from('auction_items')
      .select('id, current_bid, auction_id, service, honor, current_bidder:bidders!current_bidder_id(email)')
      .in('id', itemIds);
    
    if (itemsError || !items || items.length === 0) {
      return NextResponse.json(
        { error: 'Items not found' },
        { status: 404 }
      );
    }
    
    // Verify bidder owns these items
    const allBelongToBidder = items.every(item => {
      const bidder = Array.isArray(item.current_bidder) 
        ? item.current_bidder[0] 
        : item.current_bidder;
      return bidder?.email === bidderEmail;
    });
    
    if (!allBelongToBidder) {
      return NextResponse.json(
        { error: 'Unauthorized - you do not own all these items' },
        { status: 403 }
      );
    }
    
    // Calculate subtotal
    const subtotal = items.reduce((sum, item) => sum + item.current_bid, 0);
    
    // Calculate total with optional fee
    const { total, processingFee } = calculatePaymentTotal(subtotal, coverProcessingFee);
    
    // Create payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: dollarsToCents(total),
      currency: 'usd',
     payment_method_types: [
    'card',
    'cashapp',
    'us_bank_account',
    'link',
    'affirm',
    'klarna',
  ],
      metadata: generatePaymentMetadata(
        itemIds,
        bidderEmail,
        items[0].auction_id
      ),
      description: `Auction payment for ${items.length} item(s)`,
      receipt_email: bidderEmail,
      application_fee_amount: 0, // No platform fee
    }, {
      stripeAccount: stripeAccount.stripe_account_id,
    });
    
    // Store payment record
    await supabase.from('stripe_payments').insert({
      payment_intent_id: paymentIntent.id,
      auction_item_ids: itemIds,
      bidder_email: bidderEmail,
      amount: dollarsToCents(total),
      status: 'pending',
      metadata: {
        subtotal,
        processingFee,
        total,
        coverProcessingFee,
        items: items.map(i => ({
          id: i.id,
          service: i.service,
          honor: i.honor,
          bid: i.current_bid,
        })),
      },
    });
    
    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      amount: total,
      subtotal,
      processingFee,
      stripeAccountId: stripeAccount.stripe_account_id,
    });
  } catch (error) {
    console.error('Create payment intent error:', error);
    return NextResponse.json(
      { error: 'Failed to create payment intent' },
      { status: 500 }
    );
  }
}