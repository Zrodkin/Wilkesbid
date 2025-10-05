// app/api/admin/bid-templates/update/route.ts
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
      title,
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

    if (!title || !service || !honor) {
      return NextResponse.json(
        { error: 'title, service, and honor are required' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    const { data, error } = await supabase
      .from('bid_item_templates')
      .update({
        title,
        service,
        honor,
        description: description || null,
        starting_bid: startingBid || 18,
        minimum_increment: minimumIncrement || 1,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ item: data });
  } catch (error) {
    console.error('Update bid template error:', error);
    return NextResponse.json(
      { error: 'Failed to update bid template' },
      { status: 500 }
    );
  }
}