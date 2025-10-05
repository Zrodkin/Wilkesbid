// app/api/bid/route.ts
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { BidSchema } from '@/lib/validators';
import { sendOutbidNotification } from '@/lib/email/sender';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validatedData = BidSchema.parse(body);
    
    const supabase = await createClient();
    
    // Use database function for atomic bid placement
    const { data, error } = await supabase.rpc('place_bid', {
      p_item_id: validatedData.itemId,
      p_bidder_name: validatedData.fullName,
      p_bidder_email: validatedData.email,
      p_bid_amount: validatedData.bidAmount
    });
    
    if (error) {
      if (error.code === 'P0001') {
        return NextResponse.json(
          { error: error.message }, 
          { status: 400 }
        );
      }
      throw error;
    }
    
    // Send outbid notification if someone was outbid
    if (data.previous_bidder_email) {
      // Fire and forget - don't wait for email
      sendOutbidNotification({
        email: data.previous_bidder_email,
        itemTitle: data.item_title,
        itemId: validatedData.itemId,
        newBidAmount: validatedData.bidAmount,
        newBidderName: validatedData.fullName
      }).catch(console.error);
    }
    
    return NextResponse.json({ 
      success: true,
      currentBid: data.current_bid 
    });
  } catch (error: unknown) { // Use 'unknown' instead of 'any'
    console.error('Bid placement error:', error);
    
    // Type guard to safely check for ZodError
    if (typeof error === 'object' && error !== null && 'name' in error && error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Invalid input data' }, 
        { status: 400 }
      );
    }
    
    // Fallback for all other errors
    return NextResponse.json(
      { error: 'Failed to place bid' }, 
      { status: 500 }
    );
  }
}
