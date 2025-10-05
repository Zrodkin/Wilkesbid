// app/page.tsx
import { createClient } from '@/lib/supabase/server';
import { AuctionBoard } from '@/components/auction/auction-board';
import { CountdownTimer } from '@/components/auction/countdown-timer';
import Image from 'next/image';

export default async function Home() {
  const supabase = await createClient();
  
  // Get active auction
  const { data: auction, error: auctionError } = await supabase
    .from('auction_config')
    .select('*')
    .in('status', ['active', 'ended'])
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  
  if (auctionError) {
    console.error('Error loading auction:', auctionError);
  }
  
  if (!auction) {
    return (
      <div className="min-h-screen bg-neutral-950 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-[#C9A961] mb-2">No Active Auction</h1>
          <p className="text-neutral-400">Please check back later</p>
        </div>
      </div>
    );
  }
  
  // Get auction items
  const { data: items, error: itemsError } = await supabase
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
    .eq('auction_id', auction.id)
    .order('display_order');

  if (itemsError) {
    console.error('Error loading items:', itemsError);
  }

  // Transform the data to fix current_bidder
  const transformedItems = items?.map(item => ({
    ...item,
    current_bidder: Array.isArray(item.current_bidder) 
      ? item.current_bidder[0] 
      : item.current_bidder
  })) || [];
  
  const isAuctionEnded = auction.status === 'ended';
  const holidayName = auction.holiday_name || 'Yom Kippur';

  return (
    <main className="min-h-screen bg-neutral-950">
      {/* Header */}
      <div className="border-b border-neutral-800/50">
        <div className="container mx-auto px-4 sm:px-6 py-4 sm:py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 sm:gap-4">
              <Image
                src="/bais-menachem-logo.png"
                alt="Bais Menachem"
                width={60}
                height={60}
                className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 object-contain"
              />
              <h2 className="font-sans text-xl sm:text-2xl md:text-3xl font-bold text-[#C9A961]/70 tracking-tight">
                Bais Menachem
              </h2>
            </div>
            <div className="text-[#C9A961]/70 text-lg sm:text-xl md:text-2xl font-semibold">ב״ה</div>
          </div>
        </div>
      </div>

      {/* Hero Section */}
      <div className="border-b border-neutral-800">
        <div className="container mx-auto px-4 sm:px-6 py-8 sm:py-12 md:py-16 lg:py-20">
          <div className="max-w-4xl mx-auto text-center space-y-8 sm:space-y-10 md:space-y-12">
            {/* Title */}
            <div className="space-y-3 sm:space-y-4">
              <h1 className="font-sans text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-[#C9A961] tracking-tight leading-tight">
                {holidayName} Honors Auction
              </h1>
              <p className="text-base sm:text-lg md:text-xl text-[#C9A961]/80 max-w-2xl mx-auto leading-relaxed">
                Bid on meaningful honors for the High Holy Days
              </p>
            </div>

            {/* Countdown Timer */}
            <CountdownTimer 
              endTime={auction.end_time} 
              status={auction.status}
            />
          </div>
        </div>
      </div>

      {/* Auction Items */}
      <div className="bg-neutral-900">
        <div className="container mx-auto px-4 sm:px-6 py-8 sm:py-10 md:py-12">
          <AuctionBoard 
            items={transformedItems} 
            isEnded={isAuctionEnded}
          />
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-neutral-950 border-t border-neutral-800/50">
        <div className="container mx-auto px-4 sm:px-6 py-12 sm:py-16 md:py-20">
          <div className="text-center space-y-6">
            <h3 className="font-sans text-xl sm:text-2xl md:text-3xl font-bold text-[#C9A961] tracking-tight">
              BAIS MENACHEM YOUTH DEVELOPMENT PROGRAM
            </h3>

            <div className="space-y-2 text-neutral-400">
              <p className="text-base sm:text-lg">3333 Evergreen Ln, Canadensis, PA 18325</p>
              <p className="text-base sm:text-lg">570-970-2480</p>
            </div>

            <div className="space-y-4">
              <p className="text-sm text-neutral-500">
                Powered by{" "}
                <a
                  href="https://shulpad.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-neutral-400 transition-colors"
                >
                  ShulPad.com
                </a>{" "}
                © 2025
              </p>

              <a
                href="https://www.facebook.com/BaisMenachemYDP/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-neutral-800 hover:bg-neutral-700 transition-colors"
                aria-label="Visit our Facebook page"
              >
                <svg className="w-5 h-5 text-neutral-400" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path
                    fillRule="evenodd"
                    d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z"
                    clipRule="evenodd"
                  />
                </svg>
              </a>
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}