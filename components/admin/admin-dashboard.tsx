// components/admin/admin-dashboard.tsx (Enhanced Version)
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { AuctionSetup } from './auction-setup';
import { EditBidModal } from './edit-bid-modal';
import { MoveBidModal } from './move-bid-modal';
import { BidHistoryModal } from './bid-history-modal';
import { CreateItemModal } from './create-item-modal';
import type { RealtimeChannel } from '@supabase/supabase-js';
import { Search, LogOut, ExternalLink, Edit, ArrowRightLeft, History, Plus } from 'lucide-react';

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
  current_bidder?: {
    full_name: string;
    email: string;
  };
}

type ModalType = 'edit' | 'move' | 'history' | 'create' | null;

export function AdminDashboard() {
  const [auction, setAuction] = useState<Auction | null>(null);
  const [items, setItems] = useState<AuctionItemData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeModal, setActiveModal] = useState<ModalType>(null);
  const [selectedItem, setSelectedItem] = useState<AuctionItemData | null>(null);
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
        .select(`
          *,
          current_bidder:bidders(full_name, email)
        `)
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
          () => {
            loadAuctionStatus();
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
  }, [supabase, auction, loadAuctionStatus]);

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

  const openModal = (type: ModalType, item?: AuctionItemData) => {
    setActiveModal(type);
    setSelectedItem(item || null);
  };

  const closeModal = () => {
    setActiveModal(null);
    setSelectedItem(null);
    loadAuctionStatus();
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

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-2 mb-8">
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
          {auction && (
            <button 
              onClick={() => openModal('create')}
              className="px-4 py-2 bg-[#C9A961] text-black rounded-md hover:bg-[#B89851] transition-colors flex items-center gap-2 font-medium ml-auto"
            >
              <Plus className="h-4 w-4" />
              Create New Item
            </button>
          )}
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
                </div>
              )}
            </div>

            {/* Search Bar */}
            <div className="mb-6">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-neutral-400" />
                <input
                  type="text"
                  placeholder="Search items..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-neutral-900 border border-neutral-700 rounded-lg text-white placeholder:text-neutral-500 focus:outline-none focus:border-[#C9A961] focus:ring-2 focus:ring-[#C9A961]/20"
                />
              </div>
            </div>

            {/* Items Table */}
            <div className="bg-neutral-900 border border-neutral-800 rounded-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-neutral-800 bg-neutral-800/50">
                      <th className="px-4 py-3 text-left text-sm font-semibold text-neutral-400">Item</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-neutral-400">Current Bid</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-neutral-400">Bidder</th>
                      <th className="px-4 py-3 text-right text-sm font-semibold text-neutral-400">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredItems.map((item, index) => (
                      <tr
                        key={item.id}
                        className={index % 2 === 0 ? 'bg-neutral-900' : 'bg-neutral-800/50'}
                      >
                        <td className="px-4 py-3">
                          <div className="text-sm text-white font-medium">{item.title}</div>
                          {item.description && (
                            <div className="text-xs text-neutral-400 mt-1">{item.description}</div>
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm text-[#C9A961] font-semibold">
                          ${item.current_bid.toLocaleString()}
                        </td>
                        <td className="px-4 py-3 text-sm text-neutral-300">
                          {item.current_bidder?.full_name || '-'}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => openModal('edit', item)}
                              className="p-2 text-neutral-400 hover:text-[#C9A961] hover:bg-neutral-800 rounded transition-colors"
                              title="Edit Bid"
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => openModal('move', item)}
                              className="p-2 text-neutral-400 hover:text-[#C9A961] hover:bg-neutral-800 rounded transition-colors"
                              title="Move Bid"
                              disabled={!item.current_bidder}
                            >
                              <ArrowRightLeft className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => openModal('history', item)}
                              className="p-2 text-neutral-400 hover:text-[#C9A961] hover:bg-neutral-800 rounded transition-colors"
                              title="Bid History"
                            >
                              <History className="h-4 w-4" />
                            </button>
                          </div>
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

      {/* Modals */}
      {activeModal === 'edit' && selectedItem && (
        <EditBidModal item={selectedItem} onClose={closeModal} />
      )}
      {activeModal === 'move' && selectedItem && (
        <MoveBidModal item={selectedItem} onClose={closeModal} allItems={items} />
      )}
      {activeModal === 'history' && selectedItem && (
        <BidHistoryModal item={selectedItem} onClose={closeModal} />
      )}
      {activeModal === 'create' && (
        <CreateItemModal onClose={closeModal} onItemCreated={closeModal} />
      )}
    </div>
  );
}