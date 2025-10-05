// app/api/bid-history/route.ts
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

interface BidHistoryEntry {
  bid_amount: number;
  created_at: string;
  bidder: {
    full_name: string;
    email: string;
  } | {
    full_name: string;
    email: string;
  }[] | null;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const itemId = searchParams.get('item_id');

    if (!itemId) {
      return NextResponse.json(
        { error: 'item_id is required' },
        { status: 400 }
      );
    }

    const supabase = await createClient();
    
    // Fetch bid history with bidder info via join
    // Exclude the current winning bid (is_winning_bid = false)
    const { data, error } = await supabase
      .from('bid_history')
      .select(`
        bid_amount,
        created_at,
        bidder:bidders!bidder_id(full_name, email)
      `)
      .eq('auction_item_id', itemId)
      .eq('is_winning_bid', false)
      .order('created_at', { ascending: false })
      .limit(5); // Return last 5 previous bids
    
    if (error) {
      console.error('Error fetching bid history:', error);
      return NextResponse.json(
        { error: 'Failed to fetch bid history' },
        { status: 500 }
      );
    }
    
    // Transform the data to match the expected format
    const transformedData = ((data || []) as BidHistoryEntry[]).map(entry => ({
      bidder_name: Array.isArray(entry.bidder) 
        ? entry.bidder[0]?.full_name || 'Anonymous'
        : entry.bidder?.full_name || 'Anonymous',
      bid_amount: entry.bid_amount,
      created_at: entry.created_at
    }));
    
    return NextResponse.json(transformedData);
  } catch (error) {
    console.error('Bid history error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch bid history' },
      { status: 500 }
    );
  }
}