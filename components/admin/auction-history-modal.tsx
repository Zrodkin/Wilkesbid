// components/admin/auction-history-modal.tsx
'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { X, Calendar, DollarSign, Package, Users, Trash2 } from 'lucide-react';

interface Auction {
  id: number;
  created_at: string;
  start_time: string;
  end_time: string;
  status: 'active' | 'ended';
  holiday_name?: string;
  services?: string[];
}

interface AuctionWithStats extends Auction {
  totalItems: number;
  totalBids: number;
  totalAmount: number;
  paidAmount: number;
}

interface AuctionHistoryModalProps {
  onClose: () => void;
  onSelectAuction: (auctionId: number) => void;
}

export function AuctionHistoryModal({ onClose, onSelectAuction }: AuctionHistoryModalProps) {
  const [auctions, setAuctions] = useState<AuctionWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const supabase = createClient();

  useEffect(() => {
    loadAuctions();
  }, []);

  const loadAuctions = async () => {
    try {
      // Get all auctions
      const { data: auctionsData } = await supabase
        .from('auction_config')
        .select('*')
        .order('created_at', { ascending: false });

      if (!auctionsData) {
        setLoading(false);
        return;
      }

      // Get stats for each auction
      const auctionsWithStats = await Promise.all(
        auctionsData.map(async (auction) => {
       const { data: items } = await supabase
  .from('auction_items')
  .select('current_bid, starting_bid, current_bidder_id, is_paid')
  .eq('auction_id', auction.id);

          const totalItems = items?.length || 0;
          const totalBids = items?.filter((item) => item.current_bidder_id).length || 0;
const totalAmount = items?.reduce((sum, item) => {
  return item.current_bid > item.starting_bid ? sum + item.current_bid : sum;
}, 0) || 0;
          const paidAmount =
            items?.filter((item) => item.is_paid).reduce((sum, item) => sum + item.current_bid, 0) || 0;

          return {
            ...auction,
            totalItems,
            totalBids,
            totalAmount,
            paidAmount,
          };
        })
      );

      setAuctions(auctionsWithStats);
    } catch (error) {
      console.error('Failed to load auctions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAuction = async (auctionId: number, auctionName: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent triggering the auction selection

    const confirmMessage = `Are you sure you want to permanently delete the "${auctionName}" auction?\n\nThis will delete:\n- The auction configuration\n- All ${auctions.find(a => a.id === auctionId)?.totalItems || 0} auction items\n- All bid history\n\nThis action cannot be undone.`;

    if (!confirm(confirmMessage)) return;

    setDeletingId(auctionId);

    try {
      const response = await fetch('/api/admin/delete-auction', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ auctionId }),
      });

      if (!response.ok) {
        throw new Error('Failed to delete auction');
      }

      // Reload the auctions list
      await loadAuctions();
    } catch (error) {
      console.error('Delete auction error:', error);
      alert('Failed to delete auction. Please try again.');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-neutral-900 rounded-lg w-full max-w-4xl max-h-[80vh] overflow-hidden border border-neutral-800">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-neutral-800">
          <h2 className="text-2xl font-bold text-[#C9A961]">Auction History</h2>
          <button onClick={onClose} className="text-neutral-400 hover:text-white transition-colors">
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(80vh-80px)]">
          {loading ? (
            <div className="text-center py-8 text-neutral-400">Loading auctions...</div>
          ) : auctions.length === 0 ? (
            <div className="text-center py-8 text-neutral-400">No auctions found</div>
          ) : (
            <div className="space-y-4">
              {auctions.map((auction) => (
                <div
                  key={auction.id}
                  className="bg-neutral-800 border border-neutral-700 rounded-lg p-5 hover:border-[#C9A961]/50 transition-colors cursor-pointer relative group"
                  onClick={() => {
                    onSelectAuction(auction.id);
                    onClose();
                  }}
                >
                  {/* Delete Button */}
                  <button
                    onClick={(e) => handleDeleteAuction(auction.id, auction.holiday_name || 'Unnamed Auction', e)}
                    disabled={deletingId === auction.id}
                    className="absolute top-4 right-4 p-2 text-neutral-400 hover:text-red-500 hover:bg-red-950 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Delete auction"
                  >
                    {deletingId === auction.id ? (
                      <div className="h-4 w-4 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                  </button>

                  <div className="flex items-start justify-between mb-4 pr-10">
                    <div>
                      <h3 className="text-xl font-semibold text-white mb-1">
                        {auction.holiday_name || 'Unnamed Auction'}
                      </h3>
                      <div className="flex items-center gap-2 text-sm text-neutral-400">
                        <Calendar className="h-4 w-4" />
                        <span>
                          {new Date(auction.start_time || auction.created_at).toLocaleDateString()} -{' '}
                          {new Date(auction.end_time).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    <span
                      className={`px-3 py-1 rounded text-sm font-medium ${
                        auction.status === 'active'
                          ? 'bg-green-500/20 text-green-500'
                          : 'bg-orange-500/20 text-orange-500'
                      }`}
                    >
                      {auction.status === 'active' ? 'Active' : 'Ended'}
                    </span>
                  </div>

                  {/* Services */}
                  {auction.services && auction.services.length > 0 && (
                    <div className="mb-4">
                      <div className="flex flex-wrap gap-2">
                        {auction.services.map((service) => (
                          <span key={service} className="text-xs bg-[#C9A961] text-black px-2 py-1 rounded">
                            {service}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Stats Grid */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-neutral-900 rounded p-3">
                      <div className="flex items-center gap-2 text-neutral-400 text-xs mb-1">
                        <Package className="h-3 w-3" />
                        <span>Total Items</span>
                      </div>
                      <div className="text-lg font-bold text-white">{auction.totalItems}</div>
                    </div>

                    <div className="bg-neutral-900 rounded p-3">
                      <div className="flex items-center gap-2 text-neutral-400 text-xs mb-1">
                        <Users className="h-3 w-3" />
                        <span>Items with Bids</span>
                      </div>
                      <div className="text-lg font-bold text-white">{auction.totalBids}</div>
                    </div>

                    <div className="bg-neutral-900 rounded p-3">
                      <div className="flex items-center gap-2 text-neutral-400 text-xs mb-1">
                        <DollarSign className="h-3 w-3" />
                        <span>Total Amount</span>
                      </div>
                      <div className="text-lg font-bold text-[#C9A961]">${auction.totalAmount.toLocaleString()}</div>
                    </div>

                    <div className="bg-neutral-900 rounded p-3">
                      <div className="flex items-center gap-2 text-neutral-400 text-xs mb-1">
                        <DollarSign className="h-3 w-3" />
                        <span>Paid Amount</span>
                      </div>
                      <div className="text-lg font-bold text-green-500">${auction.paidAmount.toLocaleString()}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}