// components/admin/admin-dashboard.tsx
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
  holiday_name?: string;
  services?: string[];
}

interface AuctionItemData {
  id: string;
  title: string;
  service?: string;
  honor?: string;
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
      item.service?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.honor?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.current_bidder?.full_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-950 flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-950 text-white p-6">
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-8">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-[#C9A961]">Admin Dashboard</h1>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2 bg-neutral-800 hover:bg-neutral-700 rounded-lg transition-colors"
          >
            <LogOut className="h-4 w-4" />
            Logout
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto">
        {!auction && <AuctionSetup onSuccess={loadAuctionStatus} />}

        {auction && (
          <>
            {/* Auction Info */}
            <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-6 mb-6">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-xl font-bold text-white mb-2">
                    {auction.holiday_name || 'Yom Kippur'} Auction
                  </h2>
                  <p className="text-neutral-400">
                    Status: <span className={auction.status === 'active' ? 'text-green-500' : 'text-orange-500'}>
                      {auction.status === 'active' ? 'Active' : 'Ended'}
                    </span>
                  </p>
                  <p className="text-neutral-400">
                    Ends: {new Date(auction.end_time).toLocaleString()}
                  </p>
                  {auction.services && auction.services.length > 0 && (
                    <div className="mt-2">
                      <p className="text-neutral-400 text-sm mb-1">Services:</p>
                      <div className="flex flex-wrap gap-2">
                        {auction.services.map((service) => (
                          <span
                            key={service}
                            className="text-xs bg-[#C9A961] text-black px-2 py-1 rounded"
                          >
                            {service}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                <button
                  onClick={() => openModal('create')}
                  className="flex items-center gap-2 px-4 py-2 bg-[#C9A961] hover:bg-[#B89851] text-black rounded-lg transition-colors font-medium"
                >
                  <Plus className="h-4 w-4" />
                  Add Item
                </button>
              </div>

              {auction.status === 'active' && (
                <div className="mt-4 p-4 bg-neutral-800 rounded-lg border border-neutral-700">
                  <p className="text-neutral-300 mb-3">
                    Monitor bids in real-time on the main page.
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
                      <th className="px-4 py-3 text-left text-sm font-semibold text-neutral-400">Service</th>
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
                          {item.honor && (
                            <div className="text-xs text-neutral-500 mt-1">{item.honor}</div>
                          )}
                          {item.description && (
                            <div className="text-xs text-neutral-400 mt-1">{item.description}</div>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          {item.service && (
                            <span className="text-xs bg-[#C9A961] text-black px-2 py-1 rounded">
                              {item.service}
                            </span>
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
      {activeModal === 'create' && auction && (
        <CreateItemModal 
          onClose={closeModal} 
          onItemCreated={closeModal}
          services={auction.services || []}
        />
      )}
    </div>
  );
}