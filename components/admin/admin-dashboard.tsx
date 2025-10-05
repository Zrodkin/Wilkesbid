'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { AuctionSetup } from './auction-setup';
import type { RealtimeChannel } from '@supabase/supabase-js';
import { Search, LogOut, ExternalLink } from 'lucide-react';

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
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-neutral-400">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-[#C9A961]">Admin Dashboard</h1>
          <p className="text-neutral-400 mt-1">Manage auction bids in real-time</p>
        </div>

        {/* Buttons below header */}
        <div className="flex gap-2 mb-8">
          <a href="/" target="_blank" rel="noopener noreferrer">
            <button className="px-4 py-2 border border-neutral-700 text-neutral-400 bg-transparent rounded-md hover:bg-neutral-900 transition-colors flex items-center gap-2">
              <ExternalLink className="h-4 w-4" />
              View Site
            </button>
          </a>
          <button 
            onClick={handleLogout}
            className="px-4 py-2 border border-neutral-700 text-neutral-400 bg-transparent rounded-md hover:bg-neutral-900 transition-colors flex items-center gap-2"
          >
            <LogOut className="h-4 w-4" />
            Logout
          </button>
        </div>

        {!auction ? (
          <AuctionSetup onSuccess={loadAuctionStatus} />
        ) : (
          <>
            {/* Stats */}
            <div className="grid md:grid-cols-4 gap-4 mb-8">
              <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-6">
                <div className="text-neutral-400 text-sm">Status</div>
                <div className="text-3xl font-bold text-white mt-1 uppercase">{auction.status}</div>
              </div>
              <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-6">
                <div className="text-neutral-400 text-sm">Total Items</div>
                <div className="text-3xl font-bold text-white mt-1">{items.length}</div>
              </div>
              <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-6">
                <div className="text-neutral-400 text-sm">Items with Bids</div>
                <div className="text-3xl font-bold text-white mt-1">{itemsWithBids}</div>
              </div>
              <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-6">
                <div className="text-neutral-400 text-sm">Total Bid Amount</div>
                <div className="text-3xl font-bold text-[#C9A961] mt-1">${totalBids.toLocaleString()}</div>
              </div>
            </div>

            {/* Auction Info */}
            <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-6 mb-6">
              <h2 className="text-xl font-semibold mb-4 text-[#C9A961]">
                Auction Information
              </h2>
              <p className="text-neutral-400 mb-2">
                End Time: <span className="font-medium text-white">
                  {new Date(auction.end_time).toLocaleString()}
                </span>
              </p>

              {auction.status === 'active' && (
                <div className="mt-4 p-4 bg-[#C9A961]/10 rounded-lg border border-[#C9A961]/30">
                  <p className="text-neutral-300 mb-3">
                    Auction is currently active. Monitor bids in real-time on the main page.
                  </p>
                  <div className="flex gap-4">
                    <a
                      href="/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-block px-4 py-2 bg-[#C9A961] hover:bg-[#B89851] text-black rounded-lg transition-colors font-medium"
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
                <div className="mt-4 p-4 bg-neutral-800 rounded-lg border border-neutral-700">
                  <p className="text-neutral-300 mb-3">
                    Auction has ended. Winners have been notified by email.
                  </p>
                  <a
                    href="/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block px-4 py-2 bg-[#C9A961] hover:bg-[#B89851] text-black rounded-lg transition-colors font-medium"
                  >
                    View Results
                  </a>
                </div>
              )}
            </div>

            {/* Search */}
            <div className="mb-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-neutral-400" />
                <input
                  type="text"
                  placeholder="Search items..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-neutral-900 border border-neutral-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#C9A961]/50 text-white placeholder:text-neutral-500"
                />
              </div>
            </div>

            {/* Items Table */}
            <div className="bg-neutral-900 border border-neutral-800 rounded-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-neutral-800">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-medium text-neutral-400">Item</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-neutral-400">Description</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-neutral-400">Current Bid</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-neutral-400">Starting Bid</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-800">
                    {filteredItems.map((item, index) => (
                      <tr 
                        key={item.id} 
                        className={index % 2 === 0 ? 'bg-neutral-900' : 'bg-neutral-800/50'}
                      >
                        <td className="px-4 py-3 text-sm text-white font-medium">
                          {item.title}
                        </td>
                        <td className="px-4 py-3 text-sm text-neutral-300">
                          {item.description || '-'}
                        </td>
                        <td className="px-4 py-3 text-sm text-[#C9A961] font-semibold">
                          ${item.current_bid.toLocaleString()}
                        </td>
                        <td className="px-4 py-3 text-sm text-neutral-400">
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