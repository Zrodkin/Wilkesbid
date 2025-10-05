// app/api/admin/auction-items/update/route.ts
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { verifyAdmin } from '@/lib/auth';

export async function PUT(request: Request) {
  try {
    const isAdmin = await verifyAdmin(request);
    if (!isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      id,
      service,
      honor,
      description,
      startingBid,
      minimumIncrement,
    } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'id is required' },
        { status: 400 }
      );
    }

    if (!service || !honor) {
      return NextResponse.json(
        { error: 'service and honor are required' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Get current item to check if we need to reset current_bid
    const { data: currentItem } = await supabase
      .from('auction_items')
      .select('current_bid, starting_bid')
      .eq('id', id)
      .single();

    // If starting bid is being changed and current bid equals old starting bid, update current bid too
    const shouldUpdateCurrentBid = 
      currentItem && 
      currentItem.current_bid === currentItem.starting_bid && 
      startingBid !== currentItem.starting_bid;

    const updateData: Record<string, unknown> = {
      service,
      honor,
      description: description || null,
      starting_bid: startingBid || 18,
      minimum_increment: minimumIncrement || 1,
    };

    // If current bid should be updated (item hasn't been bid on yet)
    if (shouldUpdateCurrentBid) {
      updateData.current_bid = startingBid;
    }

    const { data, error } = await supabase
      .from('auction_items')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ item: data });
  } catch (error) {
    console.error('Update auction item error:', error);
    return NextResponse.json(
      { error: 'Failed to update auction item' },
      { status: 500 }
    );
  }
}