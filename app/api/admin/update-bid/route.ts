// app/api/admin/update-bid/route.ts
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { verifyAdmin } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const isAdmin = await verifyAdmin(request);
    if (!isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { itemId, currentBid, bidderName, bidderEmail } = await request.json();
    const supabase = await createClient();

    // If bidder info is provided, find or create bidder
    let bidderId = null;
    if (bidderName && bidderEmail) {
      const { data: existingBidder } = await supabase
        .from('bidders')
        .select('id')
        .eq('email', bidderEmail)
        .single();

      if (existingBidder) {
        bidderId = existingBidder.id;
      } else {
        const { data: newBidder } = await supabase
          .from('bidders')
          .insert({ full_name: bidderName, email: bidderEmail })
          .select('id')
          .single();
        bidderId = newBidder?.id;
      }
    }

    // Update the auction item
    const { error } = await supabase
      .from('auction_items')
      .update({
        current_bid: currentBid,
        current_bidder_id: bidderId,
      })
      .eq('id', itemId);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Update bid error:', error);
    return NextResponse.json({ error: 'Failed to update bid' }, { status: 500 });
  }
}