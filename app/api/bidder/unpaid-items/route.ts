// app/api/bidder/unpaid-items/route.ts
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Get all unpaid items where this email is the winner
    const { data: items, error } = await supabase
      .from('auction_items')
      .select(`
        id,
        service,
        honor,
        description,
        current_bid,
        starting_bid,
        minimum_increment,
        display_order,
        is_paid,
        current_bidder:bidders!current_bidder_id(full_name, email)
      `)
      .eq('is_paid', false)
      .not('current_bidder_id', 'is', null);

    if (error) {
      console.error('Error fetching unpaid items:', error);
      return NextResponse.json(
        { error: 'Failed to fetch unpaid items' },
        { status: 500 }
      );
    }

    // Transform and filter by email
    const transformedItems = (items || [])
      .map(item => ({
        ...item,
        current_bidder: Array.isArray(item.current_bidder)
          ? item.current_bidder[0]
          : item.current_bidder
      }))
      .filter(item => item.current_bidder?.email === email);

    return NextResponse.json({ items: transformedItems });
  } catch (error) {
    console.error('Get unpaid items error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch unpaid items' },
      { status: 500 }
    );
  }
}