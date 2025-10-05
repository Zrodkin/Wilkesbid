// app/api/admin/auction/route.ts
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { verifyAdmin } from '@/lib/auth';
import { z } from 'zod';

const StartAuctionSchema = z.object({
  endDate: z.string().datetime(),
  holidayName: z.string().min(1, 'Holiday name is required'),
  services: z.array(z.string()).min(1, 'At least one service is required'),
  items: z.array(z.object({
    title: z.string().min(1, 'Title is required'),
    service: z.string().min(1, 'Service is required'),
    honor: z.string().min(1, 'Honor is required'),
    description: z.string().optional(),
    startingBid: z.number().min(0),
    minimumIncrement: z.number().min(1).default(1),
    displayOrder: z.number(),
  })).min(1, 'At least one item is required')
});

export async function POST(request: Request) {
  try {
    const isAdmin = await verifyAdmin(request);
    if (!isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const body = await request.json();
    const validatedData = StartAuctionSchema.parse(body);
    
    const supabase = await createClient();
    
    // End any active auctions
    await supabase
      .from('auction_config')
      .update({ status: 'ended' })
      .eq('status', 'active');
    
    // Create new auction with holiday config
    const { data: auction, error: auctionError } = await supabase
      .from('auction_config')
      .insert({
        end_time: validatedData.endDate,
        status: 'active',
        holiday_name: validatedData.holidayName,
        services: validatedData.services,
      })
      .select()
      .single();
    
    if (auctionError) throw auctionError;
    
    // Create auction items with service and honor
    const itemsToInsert = validatedData.items.map((item) => ({
      auction_id: auction.id,
      title: item.title,
      service: item.service,
      honor: item.honor,
      description: item.description || null,
      starting_bid: item.startingBid,
      current_bid: item.startingBid,
      minimum_increment: item.minimumIncrement,
      display_order: item.displayOrder,
    }));
    
    const { error: itemsError } = await supabase
      .from('auction_items')
      .insert(itemsToInsert);
    
    if (itemsError) throw itemsError;
    
    return NextResponse.json({ 
      success: true, 
      auctionId: auction.id,
      clearStorage: true 
    });
  } catch (error: unknown) {
    console.error('Start auction error:', error);
    
    if (typeof error === 'object' && error !== null && 'name' in error && error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Invalid input data' }, 
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to start auction' }, 
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  try {
    const isAdmin = await verifyAdmin(request);
    if (!isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const supabase = await createClient();
    
    const { data: auction } = await supabase
      .from('auction_config')
      .select('*')
      .in('status', ['active', 'ended'])
      .single();
    
    return NextResponse.json(auction || null);
  } catch (error) {
    console.error('Get auction status error:', error);
    return NextResponse.json(
      { error: 'Failed to get auction status' }, 
      { status: 500 }
    );
  }
}