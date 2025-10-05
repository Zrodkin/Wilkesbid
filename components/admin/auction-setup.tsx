'use client';

import { useState } from 'react';
import { toast } from 'sonner';

interface AuctionSetupProps {
  onSuccess: () => void;
}

interface AuctionItem {
  title: string;
  description: string;
  startingBid: number;
  minimumIncrement: number;
}

export function AuctionSetup({ onSuccess }: AuctionSetupProps) {
  const [items, setItems] = useState<AuctionItem[]>([]);
  const [currentItem, setCurrentItem] = useState<AuctionItem>({
    title: '',
    description: '',
    startingBid: 0,
    minimumIncrement: 1
  });
  const [endDate, setEndDate] = useState('');
  const [endTime, setEndTime] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const addItem = () => {
    if (!currentItem.title) {
      toast.error('Item title is required');
      return;
    }
    
    setItems([...items, currentItem]);
    setCurrentItem({
      title: '',
      description: '',
      startingBid: 0,
      minimumIncrement: 1
    });
    toast.success('Item added');
  };
  
  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };
  
  const startAuction = async () => {
    if (!endDate || !endTime) {
      toast.error('Please set end date and time');
      return;
    }
    
    if (items.length === 0) {
      toast.error('Please add at least one item');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const endDateTime = new Date(`${endDate}T${endTime}`).toISOString();
      
      const response = await fetch('/api/admin/auction', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          endDate: endDateTime,
          items
        })
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to start auction');
      }
      
      if (result.clearStorage) {
        localStorage.removeItem('winner_notifications_sent');
        Object.keys(localStorage).forEach(key => {
          if (key.startsWith('auction_confetti_')) {
            localStorage.removeItem(key);
          }
        });
      }
      
      toast.success('Auction started successfully!');
      onSuccess();
    } catch (error: unknown) {
      let message = 'Failed to start auction';
      if (error instanceof Error) {
        message = error.message;
      }
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-6">
      <h2 className="text-2xl font-bold mb-6 text-[#C9A961]">Setup New Auction</h2>
      
      {/* End Date/Time */}
      <div className="mb-6 grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-2 text-neutral-400">End Date</label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded text-white focus:outline-none focus:ring-2 focus:ring-[#C9A961]/50"
            min={new Date().toISOString().split('T')[0]}
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-2 text-neutral-400">End Time</label>
          <input
            type="time"
            value={endTime}
            onChange={(e) => setEndTime(e.target.value)}
            className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded text-white focus:outline-none focus:ring-2 focus:ring-[#C9A961]/50"
          />
        </div>
      </div>
      
      {/* Add Item Form */}
      <div className="mb-6 p-4 border border-neutral-700 rounded-lg bg-neutral-800/50">
        <h3 className="font-semibold mb-4 text-white">Add Auction Item</h3>
        
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium mb-1 text-neutral-400">Item Title</label>
            <input
              type="text"
              value={currentItem.title}
              onChange={(e) => setCurrentItem({...currentItem, title: e.target.value})}
              className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded text-white placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-[#C9A961]/50"
              placeholder="e.g., Vintage Watch"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 text-neutral-400">Description (optional)</label>
            <input
              type="text"
              value={currentItem.description}
              onChange={(e) => setCurrentItem({...currentItem, description: e.target.value})}
              className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded text-white placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-[#C9A961]/50"
              placeholder="Brief description"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 text-neutral-400">Starting Bid ($)</label>
            <input
              type="number"
              value={currentItem.startingBid}
              onChange={(e) => setCurrentItem({...currentItem, startingBid: parseFloat(e.target.value) || 0})}
              className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded text-white focus:outline-none focus:ring-2 focus:ring-[#C9A961]/50"
              min="0"
              step="0.01"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 text-neutral-400">Minimum Increment ($)</label>
            <input
              type="number"
              value={currentItem.minimumIncrement}
              onChange={(e) => setCurrentItem({...currentItem, minimumIncrement: parseFloat(e.target.value) || 1})}
              className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded text-white focus:outline-none focus:ring-2 focus:ring-[#C9A961]/50"
              min="1"
              step="0.01"
            />
          </div>
        </div>
        
        <button
          onClick={addItem}
          className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
        >
          Add Item
        </button>
      </div>
      
      {/* Items List */}
      {items.length > 0 && (
        <div className="mb-6">
          <h3 className="font-semibold mb-2 text-white">Auction Items ({items.length})</h3>
          <div className="space-y-2">
            {items.map((item, index) => (
              <div key={index} className="flex justify-between items-center p-3 bg-neutral-800 border border-neutral-700 rounded">
                <div>
                  <span className="font-medium text-white">{item.title}</span>
                  <span className="text-sm text-neutral-400 ml-2">
                    Starting at ${item.startingBid.toFixed(2)}
                  </span>
                </div>
                <button
                  onClick={() => removeItem(index)}
                  className="text-red-500 hover:text-red-400 transition-colors"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Start Auction Button */}
      <button
        onClick={startAuction}
        disabled={isSubmitting || items.length === 0 || !endDate || !endTime}
        className="w-full py-3 bg-[#C9A961] hover:bg-[#B89851] text-black rounded-lg disabled:opacity-50 disabled:cursor-not-allowed font-semibold transition-colors"
      >
        {isSubmitting ? 'Starting Auction...' : 'Start Auction'}
      </button>
    </div>
  );
}