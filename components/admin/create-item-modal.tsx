// components/admin/create-item-modal.tsx
'use client';

import { useState } from 'react';
import { X } from 'lucide-react';
import { toast } from 'sonner';

interface CreateItemModalProps {
  onClose: () => void;
  onItemCreated: () => void;
  services: string[];
}

export function CreateItemModal({ onClose, onItemCreated, services }: CreateItemModalProps) {
  const [title, setTitle] = useState('');
  const [service, setService] = useState('');
  const [honor, setHonor] = useState('');
  const [description, setDescription] = useState('');
  const [startingBid, setStartingBid] = useState(18);
  const [minimumIncrement, setMinimumIncrement] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!title || !service || !honor) {
      toast.error('Please fill in title, service, and honor');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/admin/create-item', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          service,
          honor,
          description: description || null,
          startingBid,
          minimumIncrement,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create item');
      }

      toast.success('Item created successfully');
      onItemCreated();
    } catch (error) {
      console.error('Create item error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to create item');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-neutral-900 border border-neutral-800 rounded-lg w-full max-w-md">
        <div className="flex justify-between items-center p-6 border-b border-neutral-800">
          <h3 className="text-xl font-bold text-white">Add New Item</h3>
          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1 text-neutral-400">
              Item Title *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Petach - Opening the Ark"
              className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded text-white focus:outline-none focus:ring-2 focus:ring-[#C9A961]/50"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1 text-neutral-400">
              Service *
            </label>
            <select
              value={service}
              onChange={(e) => setService(e.target.value)}
              className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded text-white focus:outline-none focus:ring-2 focus:ring-[#C9A961]/50"
            >
              <option value="">Select service...</option>
              {services.map((svc) => (
                <option key={svc} value={svc}>
                  {svc}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1 text-neutral-400">
              Honor Name *
            </label>
            <input
              type="text"
              value={honor}
              onChange={(e) => setHonor(e.target.value)}
              placeholder="e.g., Petach, Gelila, Maftir"
              className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded text-white focus:outline-none focus:ring-2 focus:ring-[#C9A961]/50"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1 text-neutral-400">
              Description (Optional)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Additional details..."
              rows={3}
              className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded text-white focus:outline-none focus:ring-2 focus:ring-[#C9A961]/50"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1 text-neutral-400">
                Starting Bid ($)
              </label>
              <input
                type="number"
                value={startingBid}
                onChange={(e) => setStartingBid(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded text-white focus:outline-none focus:ring-2 focus:ring-[#C9A961]/50"
                min="0"
                step="1"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1 text-neutral-400">
                Min Increment ($)
              </label>
              <input
                type="number"
                value={minimumIncrement}
                onChange={(e) => setMinimumIncrement(parseFloat(e.target.value) || 1)}
                className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded text-white focus:outline-none focus:ring-2 focus:ring-[#C9A961]/50"
                min="1"
                step="0.01"
              />
            </div>
          </div>
        </div>

        <div className="flex gap-3 p-6 border-t border-neutral-800">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-white rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting || !title || !service || !honor}
            className="flex-1 px-4 py-2 bg-[#C9A961] hover:bg-[#B89851] text-black rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
          >
            {isSubmitting ? 'Creating...' : 'Create Item'}
          </button>
        </div>
      </div>
    </div>
  );
}