// lib/email/sender.ts
import { Resend } from 'resend';
import { createClient } from '@/lib/supabase/server';

const resend = new Resend(process.env.RESEND_API_KEY);

interface OutbidNotification {
  email: string;
  itemTitle: string;
  itemId: string;
  newBidAmount: number;
  newBidderName: string;
}

interface WinnerInvoiceData {
  name: string;
  items: { title: string; amount: number }[];
  total: number;
}

export async function sendOutbidNotification(options: OutbidNotification) {
  const supabase = await createClient();
  
  try {
    // Check if we already sent this notification recently (within 1 minute)
    const { data: existing } = await supabase
      .from('email_log')
      .select('id')
      .eq('recipient_email', options.email)
      .eq('email_type', 'outbid')
      .eq('auction_item_id', options.itemId)
      .gte('sent_at', new Date(Date.now() - 60000).toISOString())
      .single();
    
    if (existing) {
      console.log('Notification already sent recently');
      return;
    }
    
    await resend.emails.send({
      from: process.env.EMAIL_FROM!,
      to: options.email,
      subject: `You've been outbid on ${options.itemTitle}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #1f2937;">You've been outbid!</h2>
          <p>Hello,</p>
          <p>Someone has placed a higher bid on: <strong>${options.itemTitle}</strong></p>
          <p>New bid amount: <strong>$${options.newBidAmount.toFixed(2)}</strong></p>
          <p>New bidder: ${options.newBidderName}</p>
          <hr style="margin: 20px 0; border: none; border-top: 1px solid #e5e7eb;">
          <p>Don't miss out on this item!</p>
          <p><a href="${process.env.SITE_URL}" style="display: inline-block; padding: 10px 20px; background: #3b82f6; color: white; text-decoration: none; border-radius: 5px;">Place a New Bid</a></p>
        </div>
      `
    });
    
    // Log the sent email
    await supabase.from('email_log').insert({
      recipient_email: options.email,
      email_type: 'outbid',
      auction_item_id: options.itemId,
      status: 'sent'
    });
  } catch (error) {
    console.error('Failed to send outbid notification:', error);
    
    // Log the failure
    await supabase.from('email_log').insert({
      recipient_email: options.email,
      email_type: 'outbid',
      auction_item_id: options.itemId,
      status: 'failed'
    });
  }
}

export async function sendWinnerNotifications(auctionId?: string) {
  const supabase = await createClient();
  
  try {
    // Build query to get all winners
    let query = supabase
      .from('auction_items')
      .select(`
        id,
        service,
        honor,
        current_bid,
        current_bidder_id,
        auction_id,
        current_bidder:bidders!inner(email, full_name)
      `)
      .not('current_bidder_id', 'is', null);
    
    // If auction_id is provided, filter by that specific auction
    if (auctionId) {
      query = query.eq('auction_id', auctionId);
    }
    
    const { data: winners } = await query;
    
    if (!winners || winners.length === 0) {
      console.log('No winners found to notify');
      return;
    }

    console.log(`Found ${winners.length} items with winners for auction ${auctionId || 'all'}`);
    
    // Group by email to send combined invoices
    const winnersByEmail = winners.reduce((acc, item) => {
      // Handle both array and object formats from Supabase
      const bidder = Array.isArray(item.current_bidder) 
        ? item.current_bidder[0] 
        : item.current_bidder;

      if (!bidder) {
        console.log('Warning: Item has no bidder data:', item);
        return acc;
      }
      
      const email = bidder.email;
      if (!acc[email]) {
        acc[email] = {
          name: bidder.full_name,
          items: [],
          total: 0,
          auctionId: item.auction_id // Store auction_id for logging
        };
      }
      acc[email].items.push({
        title: `${item.service} - ${item.honor}`, // ✅ Changed from item.title
        amount: item.current_bid
      });
      acc[email].total += Number(item.current_bid);
      return acc;
    }, {} as Record<string, WinnerInvoiceData & { auctionId: string }>); 
    
    console.log('Winners by email:', JSON.stringify(winnersByEmail, null, 2));
    console.log('Number of unique winner emails:', Object.keys(winnersByEmail).length);
    
    // Send emails
    for (const [email, data] of Object.entries(winnersByEmail)) {
      console.log(`Processing winner email for: ${email}`);
      
      // Check if already sent FOR THIS SPECIFIC AUCTION
      const { data: existing, error: checkError } = await supabase
        .from('email_log')
        .select('id')
        .eq('recipient_email', email)
        .eq('email_type', 'winner')
        .eq('auction_id', data.auctionId)
        .maybeSingle();
      
      if (checkError) {
        console.error(`Error checking email log for ${email}:`, checkError);
      }
      
      if (existing) {
        console.log(`Winner email already sent to ${email} for auction ${data.auctionId}`);
        continue;
      }
      
      console.log(`Preparing to send winner email to ${email}...`);
      
      try {
        const itemsList = data.items.map((item) => 
          `<li>${item.title}: <strong>$${item.amount.toFixed(2)}</strong></li>`
        ).join('');
        
        console.log(`Sending email via Resend to ${email}...`);
        
        const result = await resend.emails.send({
          from: process.env.EMAIL_FROM!,
          to: email,
          subject: 'Congratulations! You won auction items',
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #1f2937;">Congratulations ${data.name}!</h2>
              <p>The auction has ended and you've won the following items:</p>
              <ul style="list-style: none; padding: 0;">
                ${itemsList}
              </ul>
              <hr style="margin: 20px 0; border: none; border-top: 1px solid #e5e7eb;">
              <p style="font-size: 18px;"><strong>Total Amount Due: $${data.total.toFixed(2)}</strong></p>
              <p><a href="${process.env.SITE_URL}" style="display: inline-block; padding: 12px 24px; background: #10b981; color: white; text-decoration: none; border-radius: 5px; font-weight: bold;">Proceed to Payment</a></p>
              <p style="color: #6b7280; margin-top: 20px;">Thank you for participating in our auction!</p>
            </div>
          `
        });
        
        console.log(`Resend API response:`, result);
        console.log(`Winner email sent successfully to ${email}`);
        
        // Log the sent email with auction_id
        await supabase.from('email_log').insert({
          recipient_email: email,
          email_type: 'winner',
          auction_id: data.auctionId,
          status: 'sent'
        });
      } catch (error) {
        console.error(`Failed to send winner email to ${email}:`, error);
        
        // Log the failure
        await supabase.from('email_log').insert({
          recipient_email: email,
          email_type: 'winner',
          auction_id: data.auctionId,
          status: 'failed'
        });
      }
    }
  } catch (error) {
    console.error('Failed to send winner notifications:', error);
  }
}