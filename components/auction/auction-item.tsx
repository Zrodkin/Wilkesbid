// components/auction/auction-item.tsx
'use client';

import { useState, useEffect } from 'react';
import { BidModal } from './bid-modal';
import { PaymentModal } from './payment-modal';
import { StripeCheckoutModal } from './stripe-checkout-modal';
import { ChevronDown, ChevronUp, CreditCard } from 'lucide-react';


interface AuctionItemData {
  id: string;
  service: string;
  honor: string;
  description?: string;
  current_bid: number;
  starting_bid: number;
  minimum_increment: number;
  current_bidder?: {
    full_name: string;
    email: string;
  };
  is_paid?: boolean;
}

interface AuctionItemProps {
  item: AuctionItemData;
  isEnded: boolean;
}

export function AuctionItem({ item, isEnded }: AuctionItemProps) {
  const [showBidModal, setShowBidModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showStripeCheckout, setShowStripeCheckout] = useState(false);
  const [showBidHistory, setShowBidHistory] = useState(false);
  const [bidHistory, setBidHistory] = useState<Array<{ bidder_name: string; bid_amount: number }>>([]);
  const [isStripeConnected, setIsStripeConnected] = useState(false);
  const [checkingStripe, setCheckingStripe] = useState(true);

  // Check if Stripe is connected
  useEffect(() => {
    checkStripeConnection();
  }, []);

  const checkStripeConnection = async () => {
    try {
      const response = await fetch('/api/stripe/is-connected');
      const data = await response.json();
      setIsStripeConnected(data.connected);
    } catch (error) {
      console.error('Failed to check Stripe connection:', error);
      setIsStripeConnected(false);
    } finally {
      setCheckingStripe(false);
    }
  };

  // Fetch bid history when dropdown is opened
  const toggleBidHistory = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!showBidHistory && bidHistory.length === 0) {
      try {
        const response = await fetch(`/api/bid-history?item_id=${item.id}`);
        const data = await response.json();
        setBidHistory(data.slice(0, 5)); // Get last 5 bids
      } catch (error) {
        console.error('Failed to fetch bid history:', error);
      }
    }
    setShowBidHistory(!showBidHistory);
  };

  const handlePayNow = () => {
    if (isStripeConnected) {
      setShowStripeCheckout(true);
    } else {
      setShowPaymentModal(true);
    }
  };

  const handleStripeSuccess = () => {
    setShowStripeCheckout(false);
    // Optionally refresh the page or update item state
    window.location.reload();
  };

  const hasWinner = isEnded && item.current_bidder;

  return (
    <>
      <div className="w-full bg-neutral-800 border-2 border-[#C9A961]/30 rounded-2xl p-4 sm:p-5 hover:shadow-xl hover:border-[#C9A961]/50 transition-all">
        {/* Price and Service/Honor */}
        <div className="space-y-2 mb-4">
          <div className="text-3xl sm:text-4xl font-bold text-[#C9A961]">
            ${item.current_bid.toLocaleString()}
          </div>
          <div className="text-base sm:text-lg text-white font-medium leading-tight">
            {item.service} - {item.honor}
          </div>
          {item.description && (
            <div className="text-sm text-neutral-400">
              {item.description}
            </div>
          )}
        </div>

        {/* Winner/Bidder Section */}
        {hasWinner ? (
          <div className="mb-3 pb-3 border-b border-[#C9A961]/20">
            <div className="flex items-center gap-2 mb-2">
              <div className="bg-gradient-to-r from-[#C9A961] to-yellow-600 text-neutral-950 text-xs font-bold px-3 py-1 rounded-full">
                WINNER
              </div>
            </div>
            <div className="text-lg font-bold text-white mb-1">
              {item.current_bidder!.full_name}
            </div>
            <div className="text-sm text-neutral-400">
              Final Price: ${item.current_bid.toLocaleString()}
            </div>
          </div>
        ) : isEnded ? (
          <div className="mb-3 pb-3 border-b border-[#C9A961]/20">
            <div className="text-sm text-neutral-500 italic">No Winner</div>
          </div>
        ) : (
          <div className="mb-3 pb-3 border-b border-[#C9A961]/20">
            <div className="text-xs text-neutral-500 mb-1">
              <span className="sm:hidden">Bidder</span>
              <span className="hidden sm:inline">Highest Bidder</span>
            </div>
            <div className="text-sm font-medium text-white truncate">
              {item.current_bidder?.full_name || 'No bids yet'}
            </div>
          </div>
        )}

        {/* Bid History Dropdown - only show during auction */}
        {!isEnded && (
          <>
            <button
              onClick={toggleBidHistory}
              className="w-full flex items-center justify-between text-sm text-[#C9A961] hover:text-[#C9A961]/80 mb-3 py-1 transition-colors"
            >
              <span className="font-medium">Recent Bids</span>
              {showBidHistory ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </button>

            {showBidHistory && (
              <div className="mb-3 space-y-1 bg-neutral-900/50 rounded-lg p-3 border border-[#C9A961]/20">
                {bidHistory.length > 0 ? (
                  bidHistory.map((bid, index) => (
                    <div key={index} className="flex justify-between text-xs py-1.5">
                      <span className="text-neutral-400">{bid.bidder_name}</span>
                      <span className="font-medium text-[#C9A961]">
                        ${bid.bid_amount.toLocaleString()}
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="text-xs text-neutral-500 text-center py-1">
                    No bid history yet
                  </div>
                )}
              </div>
            )}
          </>
        )}

        {/* Action Button */}
        {hasWinner ? (
          item.is_paid ? (
            <button
              disabled
              className="w-full bg-green-600 text-white font-medium py-2.5 px-4 rounded-lg text-sm cursor-not-allowed opacity-75"
            >
              ✓ Paid
            </button>
          ) : (
            <button
              onClick={handlePayNow}
              disabled={checkingStripe}
              className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-2.5 px-4 rounded-lg transition-colors text-sm flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <CreditCard className="h-4 w-4" />
              {checkingStripe ? 'Loading...' : 'Pay Now'}
            </button>
          )
        ) : isEnded ? (
          <button
            disabled
            className="w-full bg-gray-400 text-gray-600 font-medium py-2.5 px-4 rounded-lg text-sm cursor-not-allowed opacity-50"
          >
            No Winner
          </button>
        ) : (
          <button
            onClick={() => setShowBidModal(true)}
            className="w-full bg-[#C9A961] hover:bg-[#C9A961]/90 text-neutral-950 font-semibold py-2.5 px-4 rounded-lg transition-colors text-sm"
          >
            Place Bid
          </button>
        )}
      </div>

      {showBidModal && (
        <BidModal
          item={item}
          onClose={() => setShowBidModal(false)}
        />
      )}

      {showStripeCheckout && hasWinner && (
        <StripeCheckoutModal
          items={[item]}
          bidderEmail={item.current_bidder!.email}
          onClose={() => setShowStripeCheckout(false)}
          onSuccess={handleStripeSuccess}
        />
      )}

      {showPaymentModal && hasWinner && (
        <PaymentModal
          item={item}
          winner={item.current_bidder!}
          onClose={() => setShowPaymentModal(false)}
        />
      )}
    </>
  );
}