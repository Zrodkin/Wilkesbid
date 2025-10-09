// app/api/stripe/webhook/route.ts
import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { stripe } from '@/lib/stripe/client';
import { createClient } from '@/lib/supabase/server';
import Stripe from 'stripe';

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(request: Request) {
  console.log('🔔 WEBHOOK HIT - URL:', request.url);
  console.log('🔔 WEBHOOK HIT - Method:', request.method);
  console.log('🔔 WEBHOOK HIT - Headers:', Object.fromEntries(request.headers));  
  try {
    const body = await request.text();
    const headersList = await headers();
    const signature = headersList.get('stripe-signature');
    
    if (!signature) {
      return NextResponse.json(
        { error: 'No signature' },
        { status: 400 }
      );
    }
    
    // Verify webhook signature
    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err) {
      console.error('Webhook signature verification failed:', err);
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 400 }
      );
    }
    
    // Handle events
    switch (event.type) {
      case 'payment_intent.succeeded':
        await handlePaymentSuccess(event.data.object as Stripe.PaymentIntent);
        break;
        
      case 'payment_intent.payment_failed':
        await handlePaymentFailed(event.data.object as Stripe.PaymentIntent);
        break;
        
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }
    
    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    );
  }
}

async function handlePaymentSuccess(paymentIntent: Stripe.PaymentIntent) {
  const supabase = await createClient();
  
  try {
    // Get item IDs from metadata
    const itemIdsStr = paymentIntent.metadata.item_ids;
    if (!itemIdsStr) {
      console.error('No item_ids in payment intent metadata');
      return;
    }
    
    const itemIds = itemIdsStr.split(',');
    
    // Mark all items as paid
    const { error: updateError } = await supabase
      .from('auction_items')
      .update({ is_paid: true })
      .in('id', itemIds);
    
    if (updateError) {
      console.error('Error marking items as paid:', updateError);
      return;
    }
    
    // Update payment record
    await supabase
      .from('stripe_payments')
      .update({ 
        status: 'succeeded',
        updated_at: new Date().toISOString(),
      })
      .eq('payment_intent_id', paymentIntent.id);
    
    console.log(`Payment succeeded for ${itemIds.length} items:`, itemIds);
  } catch (error) {
    console.error('Error handling payment success:', error);
  }
}

async function handlePaymentFailed(paymentIntent: Stripe.PaymentIntent) {
  const supabase = await createClient();
  
  try {
    // Update payment record with failure
    await supabase
      .from('stripe_payments')
      .update({ 
        status: 'failed',
        metadata: {
          ...paymentIntent.metadata,
          last_payment_error: paymentIntent.last_payment_error?.message || 'Unknown error',
        },
        updated_at: new Date().toISOString(),
      })
      .eq('payment_intent_id', paymentIntent.id);
    
    console.log(`Payment failed for payment intent: ${paymentIntent.id}`);
  } catch (error) {
    console.error('Error handling payment failure:', error);
  }
}