// components/admin/admin-dashboard.tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { AuctionSetup } from './auction-setup';
import type { RealtimeChannel } from '@supabase/supabase-js';

interface Auction {
  id: number;
  created_at: string;
  end_time: string;
  status: 'active' | 'ended';
}

interface AuctionItemData {
  id: string;
  title: string;
  description?: string;
  current_bid: number;
  starting_bid: number;
  minimum_increment: number;
  display_order: number;
  current_bidder_id?: string;
}

export function AdminDashboard() {
  const [auction, setAuction] = useState<Auction | null>(null);
  const [items, setItems] = useState<AuctionItemData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const router = useRouter();
  const supabase = createClient();

  const loadAuctionStatus = useCallback(async () => {
    const { data: auctionData } = await supabase
      .from('auction_config')
      .select('*')
      .in('status', ['active', 'ended'])
      .single();

    setAuction(auctionData);

    if (auctionData) {
      const { data: itemsData } = await supabase
        .from('auction_items')
        .select('*')
        .eq('auction_id', auctionData.id)
        .order('display_order');
      
      setItems(itemsData || []);
    }

    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    loadAuctionStatus();
  }, [loadAuctionStatus]);

  useEffect(() => {
    if (!auction) return;

    let channel: RealtimeChannel;

    const setupRealtimeSubscription = () => {
      channel = supabase
        .channel('admin_auction_changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'auction_items',
          },
          (payload) => {
            if (payload.eventType === 'UPDATE') {
              setItems((current) =>
                current.map((item) => 
                  item.id === payload.new.id ? (payload.new as AuctionItemData) : item
                )
              );
            } else if (payload.eventType === 'INSERT') {
              setItems((current) => [...current, payload.new as AuctionItemData]);
            } else if (payload.eventType === 'DELETE') {
              setItems((current) => current.filter((item) => item.id !== payload.old.id));
            }
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
  }, [supabase, auction]);

  const handleLogout = async () => {
    await fetch('/api/admin/auth', { method: 'DELETE' });
    router.push('/admin/login');
  };

  const handleEndAuction = async () => {
    if (!confirm('Are you sure you want to end the auction early?')) return;

    try {
      const response = await fetch('/api/admin/end-auction', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      if (response.ok) {
        await loadAuctionStatus();
      }
    } catch (error) {
      console.error('Failed to end auction:', error);
      alert('Failed to end auction. Please try again.');
    }
  };

  const filteredItems = items.filter(
    (item) =>
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalBids = items.reduce((sum, item) => sum + item.current_bid, 0);
  const itemsWithBids = items.filter((item) => item.current_bidder_id).length;

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F5F3EF] flex items-center justify-center">
        <div className="text-[#5C5347]">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F5F3EF]">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-[#2C2416]">Admin Dashboard</h1>
          <button
            onClick={handleLogout}
            className="px-4 py-2 bg-[#4A7C7E] text-white rounded-lg hover:bg-[#3A6C6E] transition-colors font-medium"
          >
            Logout
          </button>
        </div>

        {!auction ? (
          <AuctionSetup onSuccess={loadAuctionStatus} />
        ) : (
          <>
            {/* Stats */}
            <div className="grid md:grid-cols-4 gap-4 mb-8">
              <div className="bg-white border-2 border-[#4A7C7E] rounded-lg p-6">
                <div className="text-[#5C5347] text-sm font-medium">Status</div>
                <div className="text-2xl font-bold text-[#2C2416] mt-1 uppercase">
                  {auction.status}
                </div>
              </div>
              <div className="bg-white border-2 border-[#4A7C7E] rounded-lg p-6">
                <div className="text-[#5C5347] text-sm font-medium">Total Items</div>
                <div className="text-2xl font-bold text-[#2C2416] mt-1">{items.length}</div>
              </div>
              <div className="bg-white border-2 border-[#4A7C7E] rounded-lg p-6">
                <div className="text-[#5C5347] text-sm font-medium">Items with Bids</div>
                <div className="text-2xl font-bold text-[#2C2416] mt-1">{itemsWithBids}</div>
              </div>
              <div className="bg-white border-2 border-[#4A7C7E] rounded-lg p-6">
                <div className="text-[#5C5347] text-sm font-medium">Total Bid Amount</div>
                <div className="text-2xl font-bold text-[#4A7C7E] mt-1">
                  ${totalBids.toLocaleString()}
                </div>
              </div>
            </div>

            {/* Auction Info */}
            <div className="bg-white border-2 border-[#4A7C7E] rounded-lg p-6 mb-6">
              <h2 className="text-xl font-semibold mb-4 text-[#2C2416]">
                Auction Information
              </h2>
              <p className="text-[#5C5347] mb-2">
                End Time: <span className="font-medium text-[#2C2416]">
                  {new Date(auction.end_time).toLocaleString()}
                </span>
              </p>

              {auction.status === 'active' && (
                <div className="mt-4 p-4 bg-[#4A7C7E]/10 rounded-lg border border-[#4A7C7E]/30">
                  <p className="text-[#2C2416] mb-3">
                    Auction is currently active. Monitor bids in real-time on the main page.
                  </p>
                  <div className="flex gap-4">
                    <a
                      href="/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-block px-4 py-2 bg-[#4A7C7E] text-white rounded-lg hover:bg-[#3A6C6E] transition-colors font-medium"
                    >
                      View Live Auction
                    </a>
                    <button
                      onClick={handleEndAuction}
                      className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors font-medium"
                    >
                      End Auction Early
                    </button>
                  </div>
                </div>
              )}

              {auction.status === 'ended' && (
                <div className="mt-4 p-4 bg-gray-100 rounded-lg border border-gray-300">
                  <p className="text-[#2C2416] mb-3">
                    Auction has ended. Winners have been notified by email.
                  </p>
                  <a
                    href="/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block px-4 py-2 bg-[#4A7C7E] text-white rounded-lg hover:bg-[#3A6C6E] transition-colors font-medium"
                  >
                    View Results
                  </a>
                </div>
              )}
            </div>

            {/* Search */}
            <div className="mb-6">
              <input
                type="text"
                placeholder="Search items..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-2 border-2 border-[#4A7C7E] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4A7C7E]/50 bg-white text-[#2C2416]"
              />
            </div>

            {/* Items Table */}
            <div className="bg-white border-2 border-[#4A7C7E] rounded-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-[#4A7C7E] text-white">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-semibold">Item</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold">Description</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold">Current Bid</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold">Starting Bid</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {filteredItems.map((item, index) => (
                      <tr 
                        key={item.id} 
                        className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}
                      >
                        <td className="px-4 py-3 text-sm text-[#2C2416] font-medium">
                          {item.title}
                        </td>
                        <td className="px-4 py-3 text-sm text-[#5C5347]">
                          {item.description || '-'}
                        </td>
                        <td className="px-4 py-3 text-sm text-[#4A7C7E] font-semibold">
                          ${item.current_bid.toLocaleString()}
                        </td>
                        <td className="px-4 py-3 text-sm text-[#5C5347]">
                          ${item.starting_bid.toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}