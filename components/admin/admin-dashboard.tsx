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
import { Search, LogOut, Edit, ArrowRightLeft, History, Plus, RefreshCw, X } from 'lucide-react';

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
  const [showSetup, setShowSetup] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const loadAuctionStatus = useCallback(async () => {
    // FIXED: Get the most recent active/ended auction, handle multiple or zero results
    const { data: auctionData, error: auctionError } = await supabase
      .from('auction_config')
      .select('*')
      .in('status', ['active', 'ended'])
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle(); // ✅ Changed from .single() to .maybeSingle()

    if (auctionError) {
      console.error('Error loading auction:', auctionError);
    }

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

  const handleStartNewAuction = () => {
    setShowSetup(true);
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
        {(!auction || showSetup) && (
          <AuctionSetup 
            onSuccess={() => {
              setShowSetup(false);
              loadAuctionStatus();
            }} 
          />
        )}

        {auction && !showSetup && (
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
                  <button
                    onClick={handleStartNewAuction}
                    className="px-4 py-2 bg-[#C9A961] hover:bg-[#B89851] text-black rounded-lg transition-colors font-medium"
                  >
                    Start New Auction
                  </button>
                </div>
              )}
            </div>

            {/* Search */}
            <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-4 mb-6">
              <div className="flex items-center gap-3">
                <Search className="h-5 w-5 text-neutral-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search items, services, honors, or bidders..."
                  className="flex-1 bg-transparent text-white placeholder:text-neutral-500 focus:outline-none"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="text-neutral-400 hover:text-white"
                  >
                    <X className="h-5 w-5" />
                  </button>
                )}
              </div>
            </div>

            {/* Items Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredItems.map((item) => (
                <div
                  key={item.id}
                  className="bg-neutral-900 border border-neutral-800 rounded-lg p-4 hover:border-[#C9A961]/50 transition-colors"
                >
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                      <h3 className="font-semibold text-white mb-1">{item.title}</h3>
                      <div className="flex gap-2 mb-2">
                        {item.service && (
                          <span className="text-xs bg-[#C9A961] text-black px-2 py-0.5 rounded">
                            {item.service}
                          </span>
                        )}
                        {item.honor && (
                          <span className="text-xs bg-neutral-700 text-neutral-300 px-2 py-0.5 rounded">
                            {item.honor}
                          </span>
                        )}
                      </div>
                      {item.description && (
                        <p className="text-sm text-neutral-400 mb-2">{item.description}</p>
                      )}
                    </div>
                  </div>

                  <div className="mb-3">
                    <div className="text-2xl font-bold text-[#C9A961]">
                      ${item.current_bid.toFixed(2)}
                    </div>
                    {item.current_bidder && (
                      <div className="text-sm text-neutral-400 mt-1">
                        <span className="font-medium text-white">{item.current_bidder.full_name}</span>
                        <br />
                        <span className="text-xs">{item.current_bidder.email}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => openModal('edit', item)}
                      className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-neutral-800 hover:bg-neutral-700 rounded transition-colors text-sm"
                    >
                      <Edit className="h-4 w-4" />
                      Edit
                    </button>
                    <button
                      onClick={() => openModal('move', item)}
                      className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-neutral-800 hover:bg-neutral-700 rounded transition-colors text-sm"
                    >
                      <ArrowRightLeft className="h-4 w-4" />
                      Move
                    </button>
                    <button
                      onClick={() => openModal('history', item)}
                      className="flex items-center justify-center gap-2 px-3 py-2 bg-neutral-800 hover:bg-neutral-700 rounded transition-colors text-sm"
                    >
                      <History className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {filteredItems.length === 0 && (
              <div className="text-center py-12 text-neutral-400">
                {searchQuery ? 'No items match your search' : 'No auction items yet'}
              </div>
            )}
          </>
        )}
      </div>

      {/* Modals */}
     {activeModal === 'edit' && selectedItem && (
  <EditBidModal 
    item={selectedItem} 
    onClose={closeModal} 
    services={auction?.services || []}
  />
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