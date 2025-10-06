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
import { AuctionHistoryModal } from './auction-history-modal';
import {
  Search,
  LogOut,
  Edit,
  ArrowRightLeft,
  History,
  Plus,
  Trash2,
  CheckCircle,
  Download,
  Clock,
} from 'lucide-react';
import { exportToCSV, exportToExcel, exportToPDF } from '@/lib/export-utils';
import { StripeConnectButton } from './stripe-connect-button';
import { PaymentSettingsPanel } from './payment-settings-panel';

interface Auction {
  id: number;
  created_at: string;
  start_time: string;
  end_time: string;
  status: 'active' | 'ended';
  holiday_name?: string;
  services?: string[];
}

interface AuctionItemData {
  id: string;
  service: string;
  honor: string;
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
  is_paid?: boolean;
}

type ModalType = 'edit' | 'move' | 'history' | 'create' | 'auction-history' | null;

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

  const loadAuctionStatus = useCallback(
    async (auctionId?: number) => {
      setLoading(true);
      let auctionData: Auction | null = null;

      if (auctionId) {
        const { data } = await supabase
          .from('auction_config')
          .select('*')
          .eq('id', auctionId)
          .maybeSingle();
        auctionData = data;
      } else {
        const { data } = await supabase
          .from('auction_config')
          .select('*')
          .in('status', ['active', 'ended'])
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();
        auctionData = data;
      }

      setAuction(auctionData || null);

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
      } else {
        setItems([]);
      }

      setLoading(false);
    },
    [supabase]
  );

  useEffect(() => {
    loadAuctionStatus();
  }, [loadAuctionStatus]);

  useEffect(() => {
    if (!auction) return;

    const channel = supabase
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

    return () => {
      supabase.removeChannel(channel);
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
      } else {
        throw new Error('Server returned non-OK response');
      }
    } catch (error) {
      console.error('Failed to end auction:', error);
      alert('Failed to end auction. Please try again.');
    }
  };

  const handleStartNewAuction = () => {
    setShowSetup(true);
  };

  const handleDeleteItem = async (itemId: string) => {
    if (!confirm('Are you sure you want to permanently delete this auction item?')) return;

    try {
      const response = await fetch('/api/admin/delete-item', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemId }),
      });

      if (!response.ok) {
        throw new Error('Failed to delete item');
      } else {
        // refresh list
        await loadAuctionStatus();
      }
    } catch (err) {
      console.error('Delete item error:', err);
      alert('Failed to delete item. Please try again.');
    }
  };

  const handleTogglePaid = async (itemId: string, currentPaidStatus: boolean) => {
    try {
      const response = await fetch('/api/admin/mark-paid', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemId, isPaid: !currentPaidStatus }),
      });

      if (!response.ok) {
        throw new Error('Failed to update paid status');
      } else {
        await loadAuctionStatus();
      }
    } catch (err) {
      console.error('Mark paid error:', err);
      alert('Failed to update paid status. Please try again.');
    }
  };

  const handleExport = (format: 'csv' | 'excel' | 'pdf') => {
    try {
      const timestamp = new Date().toISOString().split('T')[0];
      const auctionName = (auction?.holiday_name || 'auction').replace(/\s+/g, '-').toLowerCase();
      const filename = `${auctionName}-${timestamp}`;

      switch (format) {
        case 'csv':
          exportToCSV(items, `${filename}.csv`);
          break;
        case 'excel':
          exportToExcel(items, `${filename}.xlsx`);
          break;
        case 'pdf':
          exportToPDF(items, `${filename}.pdf`);
          break;
      }
    } catch (error) {
      console.error('Export error:', error);
      alert('Failed to export data. Please try again.');
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

  const q = searchQuery.trim().toLowerCase();
  const filteredItems = items.filter((item) => {
    return (
      (item.service || '').toLowerCase().includes(q) ||
      (item.honor || '').toLowerCase().includes(q) ||
      (item.description || '').toLowerCase().includes(q) ||
      (item.current_bidder?.full_name || '').toLowerCase().includes(q)
    );
  });

  const totalBids = items.reduce((sum, item) => sum + (item.current_bid || 0), 0);
  const itemsWithBids = items.filter((item) => !!item.current_bidder).length;
  const paidItems = items.filter((item) => item.is_paid).length;
  const totalPaidAmount = items.filter((item) => item.is_paid).reduce((sum, item) => sum + (item.current_bid || 0), 0);

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

        {/* Stripe Connect Banner */}
        <StripeConnectButton />

        {/* Payment Settings - Show only when auction exists */}
        {auction && <PaymentSettingsPanel />}

        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-[#C9A961]">Admin Dashboard</h1>
          <div className="flex gap-2">
            <button
              onClick={() => openModal('auction-history')}
              className="flex items-center gap-2 px-4 py-2 bg-neutral-800 hover:bg-neutral-700 rounded-lg transition-colors"
            >
              <Clock className="h-4 w-4" />
              Auction History
            </button>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 bg-neutral-800 hover:bg-neutral-700 rounded-lg transition-colors"
            >
              <LogOut className="h-4 w-4" />
              Logout
            </button>
          </div>
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
                  <h2 className="text-xl font-bold text-white mb-2">{auction.holiday_name || 'Yom Kippur'} Auction</h2>
                  <p className="text-neutral-400">
                    Status:{' '}
                    <span className={auction.status === 'active' ? 'text-green-500' : 'text-orange-500'}>
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
                          <span key={service} className="text-xs bg-[#C9A961] text-black px-2 py-1 rounded">
                            {service}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {auction.status === 'active' && (
                <div className="mt-4 p-4 bg-neutral-800 rounded-lg border border-neutral-700">
                  <p className="text-neutral-300 mb-3">Monitor bids in real-time on the main page.</p>
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
                  <p className="text-neutral-300 mb-3">Auction has ended. Winners have been notified by email.</p>
                  <button
                    onClick={handleStartNewAuction}
                    className="px-4 py-2 bg-[#C9A961] hover:bg-[#B89851] text-black rounded-lg transition-colors font-medium"
                  >
                    Start New Auction
                  </button>
                </div>
              )}
            </div>

            {/* Stats */}
            <div className="grid md:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
              <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-6">
                <div className="text-neutral-400 text-sm">Total Items</div>
                <div className="text-3xl font-bold text-white mt-1">{items.length}</div>
              </div>
              <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-6">
                <div className="text-neutral-400 text-sm">Items with Bids</div>
                <div className="text-3xl font-bold text-white mt-1">{itemsWithBids}</div>
              </div>
              <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-6">
                <div className="text-neutral-400 text-sm">Paid Items</div>
                <div className="text-3xl font-bold text-green-500 mt-1">{paidItems}</div>
              </div>
              <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-6">
                <div className="text-neutral-400 text-sm">Total Bid Amount</div>
                <div className="text-3xl font-bold text-[#C9A961] mt-1">${totalBids.toLocaleString()}</div>
              </div>
              <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-6">
                <div className="text-neutral-400 text-sm">Total Paid Amount</div>
                <div className="text-3xl font-bold text-green-500 mt-1">${totalPaidAmount.toLocaleString()}</div>
              </div>
            </div>

            {/* Search and Actions */}
            <div className="mb-6 flex flex-col md:flex-row gap-3">
              <div className="relative w-full md:flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-neutral-400" />
                <input
                  type="text"
                  placeholder="Search items, services, honors, or bidders..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-neutral-900 border border-neutral-800 rounded-lg text-white placeholder:text-neutral-500 focus:outline-none focus:border-[#C9A961]"
                />
              </div>
              <div className="flex flex-col md:flex-row gap-2">
                <div className="flex gap-2">
                  <button
                    onClick={() => handleExport('csv')}
                    className="flex-1 sm:flex-none md:w-[100px] flex items-center justify-center gap-2 px-3 py-2 bg-[#C9A961]/10 border border-[#C9A961]/30 text-[#C9A961] hover:bg-[#C9A961]/20 rounded-lg transition-colors text-sm font-medium"
                  >
                    <Download className="h-4 w-4" />
                    CSV
                  </button>
                  <button
                    onClick={() => handleExport('excel')}
                    className="flex-1 sm:flex-none md:w-[100px] flex items-center justify-center gap-2 px-3 py-2 bg-[#C9A961]/10 border border-[#C9A961]/30 text-[#C9A961] hover:bg-[#C9A961]/20 rounded-lg transition-colors text-sm font-medium"
                  >
                    <Download className="h-4 w-4" />
                    Excel
                  </button>
                  <button
                    onClick={() => handleExport('pdf')}
                    className="flex-1 sm:flex-none md:w-[100px] flex items-center justify-center gap-2 px-3 py-2 bg-[#C9A961]/10 border border-[#C9A961]/30 text-[#C9A961] hover:bg-[#C9A961]/20 rounded-lg transition-colors text-sm font-medium"
                  >
                    <Download className="h-4 w-4" />
                    PDF
                  </button>
                </div>
                <button
                  onClick={() => openModal('create')}
                  className="w-full md:w-40 flex items-center justify-center gap-2 px-4 py-2 bg-[#C9A961] hover:bg-[#B89851] text-black rounded-lg transition-colors font-medium"
                >
                  <Plus className="h-4 w-4" />
                  Add Item
                </button>
              </div>
            </div>

            {/* Desktop Table */}
            <div className="hidden md:block bg-neutral-900 border border-neutral-800 rounded-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-neutral-800">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-medium text-neutral-400">Service</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-neutral-400">Honor</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-neutral-400">Current Bid</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-neutral-400">Bidder</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-neutral-400 w-24">Status</th>
                      <th className="px-4 py-3 text-right text-sm font-medium text-neutral-400">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-800">
                    {filteredItems.map((item) => (
                      <tr key={item.id} className="hover:bg-neutral-800/50">
                        <td className="px-4 py-3 text-sm text-white font-medium">{item.service}</td>
                        <td className="px-4 py-3 text-sm text-neutral-300">{item.honor}</td>
                        <td className="px-4 py-3 text-sm text-[#C9A961] font-semibold">${(item.current_bid || 0).toLocaleString()}</td>
                        <td className="px-4 py-3 text-sm text-neutral-300">{item.current_bidder?.full_name || 'No bids'}</td>
                        <td className="px-4 py-3 text-sm w-24">
                          {item.is_paid ? (
                            <span className="inline-flex items-center gap-1 text-green-500 font-medium">
                              <CheckCircle className="h-4 w-4" />
                              Paid
                            </span>
                          ) : (
                            <span className="text-neutral-500">Unpaid</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => openModal('edit', item)}
                              className="px-3 py-1.5 bg-[#C9A961] hover:bg-[#B89851] text-black rounded text-xs font-medium flex items-center gap-1.5"
                            >
                              <Edit className="h-3 w-3" />
                              Edit
                            </button>
                            <button
                              onClick={() => openModal('move', item)}
                              className="px-3 py-1.5 bg-neutral-700 hover:bg-neutral-600 text-white rounded text-xs font-medium flex items-center gap-1.5"
                            >
                              <ArrowRightLeft className="h-3 w-3" />
                              Move
                            </button>
                            <button
                              onClick={() => openModal('history', item)}
                              className="px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 text-white rounded text-xs font-medium flex items-center gap-1.5"
                            >
                              <History className="h-3 w-3" />
                              History
                            </button>
                            {auction.status === 'ended' && item.current_bidder && (
                              <button
                                onClick={() => handleTogglePaid(item.id, item.is_paid || false)}
                                className={`px-3 py-1.5 rounded text-xs font-medium flex items-center gap-1.5 ${
                                  item.is_paid ? 'bg-neutral-700 hover:bg-neutral-600 text-white' : 'bg-green-600 hover:bg-green-700 text-white'
                                }`}
                              >
                                <CheckCircle className="h-3 w-3" />
                                {item.is_paid ? 'Unpaid' : 'Mark Paid'}
                              </button>
                            )}
                            <button
                              onClick={() => handleDeleteItem(item.id)}
                              className="px-2 py-1.5 border border-red-700 text-red-500 hover:bg-red-950 bg-transparent rounded text-xs"
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Mobile Cards */}
            <div className="md:hidden space-y-4">
              {filteredItems.map((item) => (
                <div key={item.id} className="bg-neutral-900 border border-neutral-800 rounded-lg p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="text-base font-semibold text-white mb-2">{item.service} - {item.honor}</div>
                      <div className="flex flex-wrap gap-2 mb-2">
                        {item.service && <span className="text-xs bg-[#C9A961] text-black px-2 py-0.5 rounded">{item.service}</span>}
                        {item.honor && <span className="text-xs bg-neutral-700 text-neutral-300 px-2 py-0.5 rounded">{item.honor}</span>}
                      </div>
                      <div className="flex items-center gap-4 mb-2">
                        <div>
                          <div className="text-xs text-neutral-400">Current Bid</div>
                          <div className="text-lg font-bold text-[#C9A961]">${(item.current_bid || 0).toLocaleString()}</div>
                        </div>
                        <div>
                          <div className="text-xs text-neutral-400">Bidder</div>
                          <div className="text-sm text-neutral-300">{item.current_bidder?.full_name || 'No bids'}</div>
                        </div>
                      </div>
                      {item.is_paid && (
                        <div className="inline-flex items-center gap-1 text-green-500 text-sm font-medium">
                          <CheckCircle className="h-4 w-4" />
                          Paid
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2 mb-2">
                    <button
                      onClick={() => openModal('edit', item)}
                      className="flex-1 px-3 py-2 bg-[#C9A961] hover:bg-[#B89851] text-black rounded text-xs font-medium flex items-center justify-center gap-1.5"
                    >
                      <Edit className="h-3 w-3" />
                      Edit
                    </button>
                    <button
                      onClick={() => openModal('move', item)}
                      className="flex-1 px-3 py-2 bg-neutral-700 hover:bg-neutral-600 text-white rounded text-xs font-medium flex items-center justify-center gap-1.5"
                    >
                      <ArrowRightLeft className="h-3 w-3" />
                      Move
                    </button>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => openModal('history', item)}
                      className="flex-1 px-3 py-2 bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 text-white rounded text-xs font-medium flex items-center justify-center gap-1.5"
                    >
                      <History className="h-3 w-3" />
                      History
                    </button>
                    {auction.status === 'ended' && item.current_bidder && (
                      <button
                        onClick={() => handleTogglePaid(item.id, item.is_paid || false)}
                        className={`flex-1 px-3 py-2 rounded text-xs font-medium flex items-center justify-center gap-1.5 ${
                          item.is_paid ? 'bg-neutral-700 hover:bg-neutral-600 text-white' : 'bg-green-600 hover:bg-green-700 text-white'
                        }`}
                      >
                        <CheckCircle className="h-3 w-3" />
                        {item.is_paid ? 'Unpaid' : 'Paid'}
                      </button>
                    )}
                    <button
                      onClick={() => handleDeleteItem(item.id)}
                      className="px-3 py-2 border border-red-700 text-red-500 hover:bg-red-950 bg-transparent rounded text-xs"
                    >
                      <Trash2 className="h-3 w-3" />
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
        <EditBidModal item={selectedItem} onClose={closeModal} services={auction?.services || []} />
      )}
      {activeModal === 'move' && selectedItem && (
        <MoveBidModal item={selectedItem} onClose={closeModal} allItems={items} />
      )}
      {activeModal === 'history' && selectedItem && (
        <BidHistoryModal item={selectedItem} onClose={closeModal} />
      )}
      {activeModal === 'create' && auction && (
        <CreateItemModal onClose={closeModal} onItemCreated={closeModal} services={auction.services || []} />
      )}
      {activeModal === 'auction-history' && (
        <AuctionHistoryModal onClose={closeModal} onSelectAuction={(auctionId) => loadAuctionStatus(auctionId)} />
      )}
    </div>
  );
}
