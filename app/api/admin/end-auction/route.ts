// app/api/admin/end-auction/route.ts
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { verifyAdmin } from '@/lib/auth';
import { sendWinnerNotifications } from '@/lib/email/sender';

export async function POST(request: Request) {
  try {
    const isAdmin = await verifyAdmin(request);
    if (!isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = await createClient();

    // Get the active auction before ending it
    const { data: activeAuction } = await supabase
      .from('auction_config')
      .select('id')
      .eq('status', 'active')
      .single();

    // End any active auctions
    const { error } = await supabase
      .from('auction_config')
      .update({ status: 'ended' })
      .eq('status', 'active');

    if (error) throw error;

    // Send winner notifications for the specific auction that was just ended
    if (activeAuction) {
      await sendWinnerNotifications(activeAuction.id);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('End auction error:', error);
    return NextResponse.json({ error: 'Failed to end auction' }, { status: 500 });
  }
}