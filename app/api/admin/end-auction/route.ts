// app/api/admin/end-auction/route.ts
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { verifyAdmin } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const isAdmin = await verifyAdmin(request);
    if (!isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = await createClient();

    // End any active auctions
    const { error } = await supabase
      .from('auction_config')
      .update({ status: 'ended' })
      .eq('status', 'active');

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('End auction error:', error);
    return NextResponse.json({ error: 'Failed to end auction' }, { status: 500 });
  }
}