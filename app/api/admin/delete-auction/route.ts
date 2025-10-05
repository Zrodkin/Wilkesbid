// app/api/admin/delete-auction/route.ts
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { verifyAdmin } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const isAdmin = await verifyAdmin(request);
    if (!isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { auctionId } = await request.json();
    const supabase = await createClient();

    // First, delete all auction items associated with this auction
    const { error: itemsError } = await supabase
      .from('auction_items')
      .delete()
      .eq('auction_id', auctionId);

    if (itemsError) throw itemsError;

    // Then delete the auction itself
    const { error: auctionError } = await supabase
      .from('auction_config')
      .delete()
      .eq('id', auctionId);

    if (auctionError) throw auctionError;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete auction error:', error);
    return NextResponse.json({ error: 'Failed to delete auction' }, { status: 500 });
  }
}