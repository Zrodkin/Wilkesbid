// components/admin/stripe-connect-button.tsx
'use client';

import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { CreditCard, CheckCircle, XCircle, Loader2 } from 'lucide-react';

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
    
    // Check for OAuth callback params
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
    if (!confirm('Are you sure you want to disconnect your Stripe account? Payments will no longer work.')) {
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
      <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-6">
        <div className="flex items-center gap-3">
          <Loader2 className="h-5 w-5 animate-spin text-neutral-400" />
          <span className="text-neutral-400">Loading Stripe status...</span>
        </div>
      </div>
    );
  }

  if (status.connected) {
    return (
      <div className="bg-green-900/20 border border-green-700 rounded-lg p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            <CheckCircle className="h-6 w-6 text-green-500 mt-1" />
            <div>
              <h3 className="text-lg font-semibold text-white mb-1">
                Stripe Connected
              </h3>
              <p className="text-sm text-neutral-400 mb-2">
                Account ID: <code className="text-green-400">{status.accountId}</code>
              </p>
              <p className="text-xs text-neutral-500">
                Connected on {new Date(status.connectedAt!).toLocaleString()}
              </p>
            </div>
          </div>
          <button
            onClick={handleDisconnect}
            disabled={disconnecting}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {disconnecting ? 'Disconnecting...' : 'Disconnect'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-orange-900/20 border border-orange-700 rounded-lg p-6">
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3">
          <XCircle className="h-6 w-6 text-orange-500 mt-1" />
          <div>
            <h3 className="text-lg font-semibold text-white mb-1">
              Stripe Not Connected
            </h3>
            <p className="text-sm text-neutral-400 mb-3">
              Connect your Stripe account to accept payments from auction winners.
            </p>
            <ul className="text-xs text-neutral-500 space-y-1 mb-4">
              <li>• Winners can pay via credit/debit card</li>
              <li>• Funds deposited directly to your account</li>
              <li>• Automatic payment receipts</li>
              <li>• No platform fees (standard Stripe rates apply)</li>
            </ul>
          </div>
        </div>
        <button
          onClick={handleConnect}
          className="flex items-center gap-2 px-6 py-3 bg-[#635BFF] hover:bg-[#5851EA] text-white rounded-lg transition-colors font-semibold"
        >
          <CreditCard className="h-5 w-5" />
          Connect Stripe
        </button>
      </div>
    </div>
  );
}