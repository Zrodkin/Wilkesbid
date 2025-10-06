// components/auction/stripe-checkout-modal.tsx
'use client';

import { useState, useEffect } from 'react';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { getStripe } from '@/lib/stripe/client-browser';
import { X, Loader2, CreditCard, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { formatCurrency } from '@/lib/stripe/helpers';

interface StripeCheckoutModalProps {
  items: Array<{
    id: string;
    service: string;
    honor: string;
    current_bid: number;
  }>;
  bidderEmail: string;
  onClose: () => void;
  onSuccess: () => void;
}

export function StripeCheckoutModal({ items, bidderEmail, onClose, onSuccess }: StripeCheckoutModalProps) {
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [coverFee, setCoverFee] = useState(true);
  const [paymentDetails, setPaymentDetails] = useState({
    subtotal: 0,
    processingFee: 0,
    total: 0,
  });

  useEffect(() => {
    createPaymentIntent();
  }, [coverFee]);

  const createPaymentIntent = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/stripe/create-payment-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          itemIds: items.map(i => i.id),
          bidderEmail,
          coverProcessingFee: coverFee,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create payment');
      }

      const data = await response.json();
      setClientSecret(data.clientSecret);
      setPaymentDetails({
        subtotal: data.subtotal,
        processingFee: data.processingFee,
        total: data.amount,
      });
    } catch (error) {
      console.error('Payment intent error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to initialize payment');
      onClose();
    } finally {
      setLoading(false);
    }
  };

  const stripePromise = getStripe();

  if (!clientSecret || loading) {
    return (
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="bg-neutral-900 border-2 border-neutral-700 rounded-2xl p-8 max-w-md w-full text-center">
          <Loader2 className="h-12 w-12 animate-spin text-[#C9A961] mx-auto mb-4" />
          <p className="text-white">Preparing payment...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-neutral-900 border-2 border-[#C9A961]/30 rounded-2xl p-6 sm:p-8 max-w-lg w-full my-8">
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="bg-[#C9A961]/10 border border-[#C9A961]/30 rounded-lg p-2">
              <CreditCard className="h-6 w-6 text-[#C9A961]" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">Complete Payment</h2>
              <p className="text-sm text-neutral-400">{items.length} item(s)</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-white transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Items Summary */}
        <div className="bg-neutral-800/50 border border-neutral-700 rounded-lg p-4 mb-6 max-h-48 overflow-y-auto">
          <h3 className="text-sm font-semibold text-neutral-400 mb-3">Your Items:</h3>
          <div className="space-y-2">
            {items.map((item) => (
              <div key={item.id} className="flex justify-between text-sm">
                <span className="text-white">{item.service} - {item.honor}</span>
                <span className="text-[#C9A961] font-semibold">{formatCurrency(item.current_bid)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Processing Fee Checkbox */}
        <div className="bg-blue-900/20 border border-blue-700 rounded-lg p-4 mb-6">
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={coverFee}
              onChange={(e) => setCoverFee(e.target.checked)}
              className="mt-1 h-5 w-5 rounded border-blue-500 bg-neutral-800 text-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-offset-0"
            />
            <div className="flex-1">
              <div className="text-white font-medium mb-1">
                Cover processing fees (recommended)
              </div>
              <div className="text-xs text-neutral-400">
                Help us maximize your donation by covering the {formatCurrency(paymentDetails.processingFee)} credit card processing fee.
              </div>
            </div>
          </label>
        </div>

        {/* Payment Breakdown */}
        <div className="bg-neutral-800/50 border border-neutral-700 rounded-lg p-4 mb-6 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-neutral-400">Subtotal:</span>
            <span className="text-white font-semibold">{formatCurrency(paymentDetails.subtotal)}</span>
          </div>
          {coverFee && (
            <div className="flex justify-between text-sm">
              <span className="text-neutral-400">Processing Fee:</span>
              <span className="text-white font-semibold">{formatCurrency(paymentDetails.processingFee)}</span>
            </div>
          )}
          <div className="border-t border-neutral-700 pt-2 mt-2">
            <div className="flex justify-between">
              <span className="text-white font-bold">Total:</span>
              <span className="text-[#C9A961] font-bold text-xl">{formatCurrency(paymentDetails.total)}</span>
            </div>
          </div>
        </div>

        {/* Stripe Elements */}
        <Elements
          stripe={stripePromise}
          options={{
            clientSecret,
            appearance: {
              theme: 'night',
              variables: {
                colorPrimary: '#C9A961',
                colorBackground: '#171717',
                colorText: '#ffffff',
                colorDanger: '#ef4444',
                borderRadius: '8px',
              },
            },
          }}
        >
          <CheckoutForm
            onSuccess={onSuccess}
            onClose={onClose}
            bidderEmail={bidderEmail}
            total={paymentDetails.total}
          />
        </Elements>
      </div>
    </div>
  );
}

function CheckoutForm({ onSuccess, onClose, bidderEmail, total }: {
  onSuccess: () => void;
  onClose: () => void;
  bidderEmail: string;
  total: number;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setProcessing(true);
    setError(null);

    try {
      const { error: submitError } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/payment-success`,
          receipt_email: bidderEmail,
        },
        redirect: 'if_required',
      });

      if (submitError) {
        setError(submitError.message || 'Payment failed');
        toast.error(submitError.message || 'Payment failed');
      } else {
        toast.success('Payment successful!');
        onSuccess();
      }
    } catch (err) {
      console.error('Payment error:', err);
      setError('An unexpected error occurred');
      toast.error('Payment failed');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-neutral-300 mb-2">
          Payment Details
        </label>
        <PaymentElement />
      </div>

      {error && (
        <div className="bg-red-900/20 border border-red-700 rounded-lg p-3 flex items-start gap-2">
          <AlertCircle className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}

      <div className="flex gap-3">
        <button
          type="button"
          onClick={onClose}
          disabled={processing}
          className="flex-1 px-4 py-3 bg-neutral-800 hover:bg-neutral-700 text-white rounded-lg transition-colors font-medium disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={!stripe || processing}
          className="flex-1 px-4 py-3 bg-[#C9A961] hover:bg-[#B89851] text-black rounded-lg transition-colors font-bold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {processing ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              Processing...
            </>
          ) : (
            `Pay ${formatCurrency(total)}`
          )}
        </button>
      </div>
    </form>
  );
}