// app/api/admin/create-item/route.ts
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { verifyAdmin } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const isAdmin = await verifyAdmin(request);
    if (!isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { title, description, startingBid, minimumIncrement } = await request.json();
    const supabase = await createClient();

    // Get the current active auction
    const { data: auction } = await supabase
      .from('auction_config')
      .select('id')
      .in('status', ['active', 'ended'])
      .single();

    if (!auction) {
      return NextResponse.json({ error: 'No active auction found' }, { status: 400 });
    }

    // Get the highest display_order
    const { data: maxOrderItem } = await supabase
      .from('auction_items')
      .select('display_order')
      .eq('auction_id', auction.id)
      .order('display_order', { ascending: false })
      .limit(1)
      .single();

    const nextOrder = (maxOrderItem?.display_order || 0) + 1;

    // Create the new item
    const { error } = await supabase
      .from('auction_items')
      .insert({
        auction_id: auction.id,
        title,
        description: description || null,
        starting_bid: startingBid,
        current_bid: startingBid,
        minimum_increment: minimumIncrement,
        display_order: nextOrder,
      });

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Create item error:', error);
    return NextResponse.json({ error: 'Failed to create item' }, { status: 500 });
  }
}