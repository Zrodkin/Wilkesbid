// components/auction/bid-modal.tsx
'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { X } from 'lucide-react';

interface BidModalProps {
  item: {
    id: string;
    title: string;
    current_bid: number;
    minimum_increment: number;
  };
  onClose: () => void;
}

type BidFormData = {
  fullName: string;
  email: string;
  bidAmount: number;
};

export function BidModal({ item, onClose }: BidModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm<BidFormData>();
  
  const minimumBid = item.current_bid + item.minimum_increment;
  
  const onSubmit = async (data: BidFormData) => {
    setIsSubmitting(true);
    
    try {
      const response = await fetch('/api/bid', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          itemId: item.id,
          fullName: data.fullName,
          email: data.email,
          bidAmount: data.bidAmount
        })
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to place bid');
      }
      
      toast.success('Bid placed successfully!');
      onClose();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-neutral-800 border-2 border-[#C9A961]/30 rounded-2xl p-6 sm:p-8 max-w-md w-full mx-4 shadow-2xl">
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold text-[#C9A961] mb-2">
              Place Bid
            </h2>
            <p className="text-white font-medium">{item.title}</p>
          </div>
          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-white transition-colors"
            disabled={isSubmitting}
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Current Bid Info */}
        <div className="bg-neutral-900/50 border border-[#C9A961]/20 rounded-lg p-4 mb-6">
          <div className="flex justify-between items-center">
            <span className="text-sm text-neutral-400">Current Bid</span>
            <span className="text-2xl font-bold text-[#C9A961]">
              ${item.current_bid.toLocaleString()}
            </span>
          </div>
        </div>
        
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          {/* Full Name */}
          <div>
            <label className="block text-sm font-medium text-neutral-300 mb-2">
              Full Name
            </label>
            <input
              {...register('fullName', { required: 'Name is required' })}
              className="w-full px-4 py-3 bg-neutral-900 border-2 border-neutral-700 rounded-lg text-white placeholder:text-neutral-500 focus:outline-none focus:border-[#C9A961] focus:ring-2 focus:ring-[#C9A961]/20 transition-all"
              placeholder=""
            />
            {errors.fullName && (
              <p className="text-red-400 text-sm mt-1.5">{errors.fullName.message}</p>
            )}
          </div>
          
          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-neutral-300 mb-2">
              Email
            </label>
            <input
              {...register('email', { 
                required: 'Email is required',
                pattern: {
                  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                  message: 'Invalid email address'
                }
              })}
              type="email"
              className="w-full px-4 py-3 bg-neutral-900 border-2 border-neutral-700 rounded-lg text-white placeholder:text-neutral-500 focus:outline-none focus:border-[#C9A961] focus:ring-2 focus:ring-[#C9A961]/20 transition-all"
              placeholder=""
            />
            {errors.email && (
              <p className="text-red-400 text-sm mt-1.5">{errors.email.message}</p>
            )}
          </div>
          
          {/* Bid Amount */}
          <div>
            <label className="block text-sm font-medium text-neutral-300 mb-2">
              Your Bid Amount
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#C9A961] font-bold text-lg">
                $
              </span>
              <input
                {...register('bidAmount', { 
                  required: 'Bid amount is required',
                  valueAsNumber: true,
                  min: {
                    value: minimumBid,
                    message: `Bid must be at least ${minimumBid.toLocaleString()}`
                  }
                })}
                type="number"
                step="0.01"
                className="w-full pl-8 pr-4 py-3 bg-neutral-900 border-2 border-neutral-700 rounded-lg text-white placeholder:text-neutral-500 focus:outline-none focus:border-[#C9A961] focus:ring-2 focus:ring-[#C9A961]/20 transition-all text-lg font-semibold"
                placeholder={`Minimum Bid: ${minimumBid.toLocaleString()}`}
              />
            </div>
            {errors.bidAmount && (
              <p className="text-red-400 text-sm mt-1.5">{errors.bidAmount.message}</p>
            )}
          </div>
          
          {/* Buttons */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 border-2 border-neutral-600 text-neutral-300 rounded-lg hover:bg-neutral-700 transition-colors font-medium"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-3 bg-[#C9A961] text-neutral-950 rounded-lg hover:bg-[#C9A961]/90 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Placing Bid...' : 'Place Bid'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}