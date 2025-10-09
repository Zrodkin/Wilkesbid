// components/admin/stripe-connect-button.tsx
'use client';

import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { CheckCircle, AlertCircle, Loader2, ExternalLink } from 'lucide-react';

interface AccountStatus {
  connected: boolean;
  accountId: string | null;
  connectedAt: string | null;
}

export function StripeConnectButton() {
  const [status, setStatus] = useState<AccountStatus>({
    connected: false,
    accountId: null,
    connectedAt: null,
  });
  const [loading, setLoading] = useState(true);
  const [disconnecting, setDisconnecting] = useState(false);

  useEffect(() => {
    loadStatus();
    
    const params = new URLSearchParams(window.location.search);
    if (params.get('stripe_connected') === 'true') {
      toast.success('Stripe account connected successfully!');
      window.history.replaceState({}, '', '/admin');
      loadStatus();
    } else if (params.get('stripe_error')) {
      toast.error(`Stripe connection failed: ${params.get('stripe_error')}`);
      window.history.replaceState({}, '', '/admin');
    }
  }, []);

  const loadStatus = async () => {
    try {
      const response = await fetch('/api/stripe/account-status');
      if (response.ok) {
        const data = await response.json();
        setStatus(data);
      }
    } catch (error) {
      console.error('Error loading Stripe status:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = () => {
    window.location.href = '/api/stripe/connect';
  };

  const handleDisconnect = async () => {
    if (!confirm('Disconnect Stripe? Credit card payments will no longer work.')) {
      return;
    }

    setDisconnecting(true);
    try {
      const response = await fetch('/api/stripe/account-status', {
        method: 'DELETE',
      });

      if (response.ok) {
        toast.success('Stripe account disconnected');
        setStatus({
          connected: false,
          accountId: null,
          connectedAt: null,
        });
      } else {
        throw new Error('Failed to disconnect');
      }
    } catch (error) {
      console.error('Disconnect error:', error);
      toast.error('Failed to disconnect Stripe account');
    } finally {
      setDisconnecting(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-4 mb-6">
        <div className="flex items-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin text-neutral-400" />
          <span className="text-sm text-neutral-400">Loading payment status...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-4 mb-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        {/* Left: Status Info */}
        <div className="flex items-start gap-3">
          {status.connected ? (
            <>
              <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-medium text-white">Stripe Connected</span>
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-500/10 text-green-500">
                    Active
                  </span>
                </div>
                <p className="text-xs text-neutral-400 mt-1 break-all">
                  {status.accountId}
                </p>
              </div>
            </>
          ) : (
            <>
              <AlertCircle className="h-5 w-5 text-orange-500 flex-shrink-0 mt-0.5" />
              <div className="min-w-0 flex-1">
                <span className="text-sm font-medium text-white block">Payment Processing</span>
                <p className="text-xs text-neutral-400 mt-1">
                  Connect Stripe to accept credit card payments
                </p>
              </div>
            </>
          )}
        </div>

        {/* Right: Action Button */}
        <div className="flex-shrink-0">
          {status.connected ? (
            <button
              onClick={handleDisconnect}
              disabled={disconnecting}
              className="w-full sm:w-auto px-4 py-2 text-sm font-medium text-red-400 hover:text-red-300 border border-red-700 hover:bg-red-950 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {disconnecting ? 'Disconnecting...' : 'Disconnect'}
            </button>
          ) : (
            <button
              onClick={handleConnect}
              className="w-full sm:w-auto px-4 py-2 text-sm font-semibold text-white bg-[#635BFF] hover:bg-[#5851EA] rounded-lg transition-colors inline-flex items-center justify-center gap-2"
            >
              <span>Connect with Stripe</span>
              <ExternalLink className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}