// components/auction/auction-board.tsx
'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { AuctionItem } from './auction-item';
import { Search, Check, ChevronDown } from 'lucide-react';
import type { RealtimeChannel } from '@supabase/supabase-js';

interface AuctionItemData {
  id: string;
  title: string;
  service: string;        // ADDED BACK
  honor: string;          // ADDED BACK
  description?: string;
  current_bid: number;
  starting_bid: number;
  minimum_increment: number;
  display_order: number;
  current_bidder?: {
    full_name: string;
    email: string;
  };
}

interface AuctionBoardProps {
  items: AuctionItemData[];
  isEnded: boolean;
}

type SortFilter = null | "Highest" | "Lowest" | "Newest";

export function AuctionBoard({ items: initialItems, isEnded }: AuctionBoardProps) {
  const [items, setItems] = useState<AuctionItemData[]>(initialItems);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortFilter, setSortFilter] = useState<SortFilter>(null);
  const supabase = createClient();

  useEffect(() => {
    let channel: RealtimeChannel;

    const setupRealtimeSubscription = () => {
      channel = supabase
        .channel('auction_items_changes')
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'auction_items',
          },
          (payload) => {
            setItems((current) =>
              current.map((item) =>
                item.id === payload.new.id 
                  ? { ...item, ...payload.new }
                  : item
              )
            );
          }
        )
        .subscribe();
    };

    setupRealtimeSubscription();

    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [supabase]);

  // UPDATED: Search now includes service and honor
  const filteredItems = items.filter(
    (item) =>
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.honor?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.service?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.current_bidder?.full_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const sortedItems = sortFilter
    ? [...filteredItems].sort((a, b) => {
        switch (sortFilter) {
          case "Highest":
            return b.current_bid - a.current_bid;
          case "Lowest":
            return a.current_bid - b.current_bid;
          case "Newest":
            return b.display_order - a.display_order;
          default:
            return 0;
        }
      })
    : [...filteredItems].sort((a, b) => a.display_order - b.display_order);

  // ADDED BACK: Service list for grouping
const services = [...new Set(items.map(item => item.service))].filter(Boolean);

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Search Bar */}
      <div className="sticky top-0 z-20 pb-6 sm:pb-8 pt-2">
        <div className="relative max-w-3xl mx-auto">
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 sm:h-6 sm:w-6 text-neutral-400 group-focus-within:text-[#C9A961] transition-colors" />
            <input
              type="text"
              placeholder="Search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 sm:pl-14 pr-4 py-5 sm:py-6 md:py-7 text-base sm:text-lg bg-neutral-800 border-2 border-neutral-700 focus:border-[#C9A961] focus:ring-2 focus:ring-[#C9A961]/20 rounded-xl shadow-md focus:shadow-lg transition-all text-white placeholder:text-neutral-500"
            />
          </div>
          {searchQuery && (
            <div className="mt-2 text-sm text-neutral-400 text-center">
              {filteredItems.length} {filteredItems.length === 1 ? "result" : "results"} found
            </div>
          )}
        </div>
      </div>

      {/* Sort Controls and Items */}
      <div className="space-y-8 sm:space-y-10 md:space-y-12">
        {sortFilter ? (
          // WHEN FILTER IS ACTIVE: Show all items in one section
          <section className="space-y-4 sm:space-y-5 md:space-y-6">
            <div className="flex items-center justify-between gap-4">
              <h2 className="font-serif text-2xl sm:text-3xl md:text-4xl font-bold text-[#C9A961] border-b-2 border-[#C9A961] pb-2 sm:pb-3 flex-1">
                All Honors - {sortFilter}
              </h2>
              
              {/* Sort Dropdown */}
              <div className="relative group">
                <button
                  className="flex items-center gap-2 px-4 sm:px-6 py-2 sm:py-2.5 rounded-full border-2 border-[#C9A961] bg-transparent text-white hover:bg-[#C9A961]/10 transition-colors text-sm sm:text-base font-medium"
                  onClick={(e) => {
                    const menu = e.currentTarget.nextElementSibling as HTMLElement;
                    menu.classList.toggle('hidden');
                  }}
                >
                  {sortFilter}
                  <ChevronDown className="h-4 w-4" />
                </button>
                <div className="hidden absolute right-0 mt-2 w-40 bg-neutral-800 border-2 border-neutral-700 rounded-lg shadow-xl z-30">
                  <div className="py-1">
                    {[
                      { value: null, label: "Default" },
                      { value: "Newest", label: "Newest" },
                      { value: "Highest", label: "Highest" },
                      { value: "Lowest", label: "Lowest" },
                    ].map((option) => (
                      <button
                        key={option.label}
                        onClick={() => {
                          setSortFilter(option.value as SortFilter);
                          document.querySelector('.hidden')?.classList.add('hidden');
                        }}
                        className="w-full flex items-center gap-2 px-4 py-2 text-white hover:bg-neutral-700 transition-colors text-left"
                      >
                        {sortFilter === option.value && <Check className="h-4 w-4 text-[#C9A961]" />}
                        <span className={sortFilter !== option.value ? "ml-6" : ""}>
                          {option.label}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Items Grid */}
            <div className="grid gap-3 sm:gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {sortedItems.map((item) => (
                <AuctionItem 
                  key={item.id} 
                  item={item} 
                  isEnded={isEnded}
                />
              ))}
            </div>
          </section>
        ) : (
          // WHEN NO FILTER: Group by service (RESTORED FROM OLD VERSION)
          services.map((service, index) => {
            const serviceItems = sortedItems.filter((item) => item.service === service);
            if (serviceItems.length === 0) return null;

            return (
              <section key={service} className="space-y-4 sm:space-y-5 md:space-y-6">
                <div className="flex items-center justify-between gap-4">
                  <h2 className="font-serif text-2xl sm:text-3xl md:text-4xl font-bold text-[#C9A961] border-b-2 border-[#C9A961] pb-2 sm:pb-3 flex-1">
                    {service}
                  </h2>
                  
                  {/* Show dropdown only on first service */}
                  {index === 0 && (
                    <div className="relative group">
                      <button
                        className="flex items-center gap-2 px-4 sm:px-6 py-2 sm:py-2.5 rounded-full border-2 border-[#C9A961] bg-transparent text-white hover:bg-[#C9A961]/10 transition-colors text-sm sm:text-base font-medium"
                        onClick={(e) => {
                          const menu = e.currentTarget.nextElementSibling as HTMLElement;
                          menu.classList.toggle('hidden');
                        }}
                      >
                        Default
                        <ChevronDown className="h-4 w-4" />
                      </button>
                      <div className="hidden absolute right-0 mt-2 w-40 bg-neutral-800 border-2 border-neutral-700 rounded-lg shadow-xl z-30">
                        <div className="py-1">
                          {[
                            { value: null, label: "Default" },
                            { value: "Newest", label: "Newest" },
                            { value: "Highest", label: "Highest" },
                            { value: "Lowest", label: "Lowest" },
                          ].map((option) => (
                            <button
                              key={option.label}
                              onClick={() => {
                                setSortFilter(option.value as SortFilter);
                                document.querySelector('.hidden')?.classList.add('hidden');
                              }}
                              className="w-full flex items-center gap-2 px-4 py-2 text-white hover:bg-neutral-700 transition-colors text-left"
                            >
                              {sortFilter === option.value && <Check className="h-4 w-4 text-[#C9A961]" />}
                              <span className={sortFilter !== option.value ? "ml-6" : ""}>
                                {option.label}
                              </span>
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Items Grid for this service */}
                <div className="grid gap-3 sm:gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {serviceItems.map((item) => (
                    <AuctionItem 
                      key={item.id} 
                      item={item} 
                      isEnded={isEnded}
                    />
                  ))}
                </div>
              </section>
            );
          })
        )}

        {/* No Results */}
        {sortedItems.length === 0 && (
          <div className="text-center py-12">
            <p className="text-lg text-neutral-400">
              No honors found matching "{searchQuery}"
            </p>
          </div>
        )}
      </div>
    </div>
  );
}