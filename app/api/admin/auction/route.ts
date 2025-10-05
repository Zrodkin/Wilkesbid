// app/api/admin/auction/route.ts
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server'; // Changed from createServiceClient
import { verifyAdmin } from '@/lib/auth';
import { StartAuctionSchema } from '@/lib/validators';

export async function POST(request: Request) {
  try {
    // Verify admin authentication
    const isAdmin = await verifyAdmin(request);
    if (!isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const body = await request.json();
    const validatedData = StartAuctionSchema.parse(body);
    
    const supabase = await createClient(); // Changed to createClient with await
    
    // Use database function to start auction
    const { data, error } = await supabase.rpc('start_auction', {
      p_end_time: validatedData.endDate,
     p_items: validatedData.items
    });if (error) throw error;
    
    // Clear localStorage flags
    return NextResponse.json({ 
      success: true, 
      auctionId: data.auction_id,
      clearStorage: true 
    });
    } catch (error: unknown) {
    console.error('Start auction error:', error);
    
    // Check if the error is a Zod validation error
    if (typeof error === 'object' && error !== null && 'name' in error && error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Invalid input data' }, 
        { status: 400 }
      );
    }
    
    // Handle other potential errors
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
    
    const supabase = await createClient(); // Changed to createClient with await
    
    const { data: auction } = await supabase
      .from('auction_config')
      .select('*')
      .in('status', ['active', 'ended'])
      .single();
    
    return NextResponse.json(auction || null);
 } catch (error) {
    // Add logging here for better debugging
    console.error('Get auction status error:', error); 

    return NextResponse.json(
      { error: 'Failed to get auction status' }, 
      { status: 500 }
    );
  }
}