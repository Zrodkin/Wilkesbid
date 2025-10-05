// app/api/admin/delete-item/route.ts
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { verifyAdmin } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const isAdmin = await verifyAdmin(request);
    if (!isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { itemId } = await request.json();
    const supabase = await createClient();

    const { error } = await supabase
      .from('auction_items')
      .delete()
      .eq('id', itemId);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete item error:', error);
    return NextResponse.json({ error: 'Failed to delete item' }, { status: 500 });
  }
}