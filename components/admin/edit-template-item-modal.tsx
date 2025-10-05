// components/admin/edit-template-item-modal.tsx
'use client';

import { useState } from 'react';
import { X } from 'lucide-react';
import { toast } from 'sonner';

interface AuctionItem {
  id?: string;
  title: string;
  service: string;
  honor: string;
  description?: string;
  startingBid: number;
  minimumIncrement: number;
}

interface EditTemplateItemModalProps {
  item: AuctionItem;
  services: string[];
  onClose: () => void;
  onItemUpdated: (updatedItem: AuctionItem) => void;
}

export function EditTemplateItemModal({ item, services, onClose, onItemUpdated }: EditTemplateItemModalProps) {
  const [title, setTitle] = useState(item.title);
  const [service, setService] = useState(item.service);
  const [honor, setHonor] = useState(item.honor);
  const [description, setDescription] = useState(item.description || '');
  const [startingBid, setStartingBid] = useState(item.startingBid);
  const [minimumIncrement, setMinimumIncrement] = useState(item.minimumIncrement);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!title || !service || !honor) {
      toast.error('Please fill in title, service, and honor');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/admin/bid-templates/update', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: item.id,
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
        throw new Error(error.error || 'Failed to update item');
      }

      const updatedItem: AuctionItem = {
        ...item,
        title,
        service,
        honor,
        description: description || undefined,
        startingBid,
        minimumIncrement,
      };

      onItemUpdated(updatedItem);
      toast.success('Item updated successfully');
      onClose();
    } catch (error) {
      console.error('Update template item error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to update item');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-neutral-900 border-2 border-[#C9A961]/30 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-neutral-900 border-b border-neutral-800 px-6 py-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-[#C9A961]">Edit Item</h2>
          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-white transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1 text-neutral-400">
              Title *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Shacharit Aliyah"
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
                onChange={(e) => setStartingBid(Number(e.target.value))}
                min="0"
                step="1"
                className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded text-white focus:outline-none focus:ring-2 focus:ring-[#C9A961]/50"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1 text-neutral-400">
                Minimum Increment ($)
              </label>
              <input
                type="number"
                value={minimumIncrement}
                onChange={(e) => setMinimumIncrement(Number(e.target.value))}
                min="1"
                step="1"
                className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded text-white focus:outline-none focus:ring-2 focus:ring-[#C9A961]/50"
              />
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-neutral-800 text-white rounded hover:bg-neutral-700 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="flex-1 px-4 py-2 bg-[#C9A961] text-black font-semibold rounded hover:bg-[#B89851] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Updating...' : 'Update Item'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}