// components/admin/payment-settings-panel.tsx
'use client';

import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Settings, Loader2 } from 'lucide-react';

export function PaymentSettingsPanel() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [installmentsEnabled, setInstallmentsEnabled] = useState(false);
  const [maxInstallments, setMaxInstallments] = useState(12);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const response = await fetch('/api/payment-settings');
      if (response.ok) {
        const data = await response.json();
        setInstallmentsEnabled(data.installments_enabled || false);
        setMaxInstallments(data.max_installments || 12);
      }
    } catch (error) {
      console.error('Failed to load payment settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    setSaving(true);
    try {
      const response = await fetch('/api/payment-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          installmentsEnabled,
          maxInstallments,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save settings');
      }

      toast.success('Payment settings updated');
    } catch (error) {
      console.error('Save settings error:', error);
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-6">
        <div className="flex items-center gap-3">
          <Loader2 className="h-5 w-5 animate-spin text-neutral-400" />
          <span className="text-neutral-400">Loading payment settings...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="bg-[#C9A961]/10 border border-[#C9A961]/30 rounded-lg p-2">
          <Settings className="h-5 w-5 text-[#C9A961]" />
        </div>
        <h3 className="text-xl font-bold text-white">Global Payment Settings</h3>
      </div>

      <div className="space-y-6">
        {/* Installments Toggle */}
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={installmentsEnabled}
                onChange={(e) => setInstallmentsEnabled(e.target.checked)}
                className="h-5 w-5 rounded border-neutral-700 bg-neutral-800 text-[#C9A961] focus:ring-2 focus:ring-[#C9A961] focus:ring-offset-0"
              />
              <div>
                <div className="text-white font-medium">Enable Installment Payments</div>
                <div className="text-sm text-neutral-400 mt-1">
                  Allow winners to pay in monthly installments instead of full amount upfront
                </div>
              </div>
            </label>
          </div>
        </div>

        {/* Max Installments */}
        {installmentsEnabled && (
          <div className="bg-neutral-800/50 border border-neutral-700 rounded-lg p-4">
            <label className="block mb-3">
              <span className="text-sm font-medium text-neutral-300">Maximum Installments</span>
              <div className="mt-2 flex items-center gap-4">
                <input
                  type="range"
                  min="2"
                  max="12"
                  value={maxInstallments}
                  onChange={(e) => setMaxInstallments(Number(e.target.value))}
                  className="flex-1 h-2 bg-neutral-700 rounded-lg appearance-none cursor-pointer accent-[#C9A961]"
                />
                <div className="w-16 text-center">
                  <div className="text-2xl font-bold text-[#C9A961]">{maxInstallments}</div>
                  <div className="text-xs text-neutral-500">months</div>
                </div>
              </div>
            </label>
            <div className="mt-3 text-xs text-neutral-400">
              Winners can choose to pay over {maxInstallments} months. Example: $120 = ${(120 / maxInstallments).toFixed(2)}/month
            </div>
          </div>
        )}

        {/* Important Note */}
        <div className="bg-blue-900/20 border border-blue-700 rounded-lg p-4">
          <p className="text-sm text-blue-300">
            <strong>Note:</strong> These settings apply globally to all auctions. Processing fees will still apply to each installment payment if the winner chooses to cover fees.
          </p>
        </div>

        {/* Save Button */}
        <button
          onClick={saveSettings}
          disabled={saving}
          className="w-full px-6 py-3 bg-[#C9A961] hover:bg-[#B89851] text-black rounded-lg transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {saving ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              Saving...
            </>
          ) : (
            'Save Payment Settings'
          )}
        </button>
      </div>
    </div>
  );
}