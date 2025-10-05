// app/api/admin/reset-bid/route.ts
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { verifyAdmin } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const isAdmin = await verifyAdmin(request);
    if (!isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { itemId, startingBid } = await request.json();
    const supabase = await createClient();

    const { error } = await supabase
      .from('auction_items')
      .update({
        current_bid: startingBid,
        current_bidder_id: null,
      })
      .eq('id', itemId);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Reset bid error:', error);
    return NextResponse.json({ error: 'Failed to reset bid' }, { status: 500 });
  }
}