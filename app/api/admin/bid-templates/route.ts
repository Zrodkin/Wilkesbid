// app/api/admin/bid-templates/route.ts
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { verifyAdmin } from '@/lib/auth';

// GET - List all bid items for a template
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const templateId = searchParams.get('templateId');

    if (!templateId) {
      return NextResponse.json(
        { error: 'templateId is required' },
        { status: 400 }
      );
    }

    const supabase = await createClient();
    
    const { data, error } = await supabase
      .from('bid_item_templates')
      .select('*')
      .eq('template_id', templateId)
      .order('display_order');
    
    if (error) throw error;
    
    // ✅ DTO TRANSFORMATION: Convert database types to frontend types
    const transformedItems = (data || []).map(item => ({
      id: item.id,
      title: item.title,
      service: item.service,
      honor: item.honor,
      description: item.description || undefined, // null → undefined
      startingBid: Number(item.starting_bid), // string → number
      minimumIncrement: Number(item.minimum_increment), // string → number
      displayOrder: item.display_order,
    }));
    
    return NextResponse.json({ items: transformedItems });
  } catch (error) {
    console.error('Get bid templates error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch bid templates' },
      { status: 500 }
    );
  }
}

// POST - Create or update bid item template
export async function POST(request: Request) {
  try {
    const isAdmin = await verifyAdmin(request);
    if (!isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      id,
      templateId,
      title,
      service,
      honor,
      description,
      startingBid,
      minimumIncrement,
      displayOrder,
    } = body;

    if (!templateId || !title || !service || !honor) {
      return NextResponse.json(
        { error: 'templateId, title, service, and honor are required' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // If id exists, update; otherwise create
    if (id) {
      const { data, error } = await supabase
        .from('bid_item_templates')
        .update({
          title,
          service,
          honor,
          description: description || null,
          starting_bid: startingBid || 18,
          minimum_increment: minimumIncrement || 1,
          display_order: displayOrder || 0,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return NextResponse.json({ item: data });
    } else {
      const { data, error } = await supabase
        .from('bid_item_templates')
        .insert({
          template_id: templateId,
          title,
          service,
          honor,
          description: description || null,
          starting_bid: startingBid || 18,
          minimum_increment: minimumIncrement || 1,
          display_order: displayOrder || 0,
        })
        .select()
        .single();

      if (error) throw error;
      return NextResponse.json({ item: data });
    }
  } catch (error) {
    console.error('Save bid template error:', error);
    return NextResponse.json(
      { error: 'Failed to save bid template' },
      { status: 500 }
    );
  }
}

// DELETE - Remove bid item template
export async function DELETE(request: Request) {
  try {
    const isAdmin = await verifyAdmin(request);
    if (!isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 });
    }

    const supabase = await createClient();

    const { error } = await supabase
      .from('bid_item_templates')
      .delete()
      .eq('id', id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete bid template error:', error);
    return NextResponse.json(
      { error: 'Failed to delete bid template' },
      { status: 500 }
    );
  }
}