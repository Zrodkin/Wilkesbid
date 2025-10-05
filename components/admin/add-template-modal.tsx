// components/admin/add-template-modal.tsx
'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { Plus, X } from 'lucide-react';

interface AddTemplateModalProps {
  onClose: () => void;
  onTemplateCreated: () => void;
}

export function AddTemplateModal({ onClose, onTemplateCreated }: AddTemplateModalProps) {
  const [templateName, setTemplateName] = useState('');
  const [services, setServices] = useState<string[]>([]);
  const [newService, setNewService] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const addService = () => {
    if (newService.trim() && !services.includes(newService.trim())) {
      setServices([...services, newService.trim()]);
      setNewService('');
    }
  };

  const removeService = (serviceToRemove: string) => {
    setServices(services.filter(s => s !== serviceToRemove));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!templateName.trim()) {
      toast.error('Please enter a template name');
      return;
    }

    if (services.length === 0) {
      toast.error('Please add at least one service');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/admin/holiday-templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: templateName.trim(),
          services: services,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create template');
      }

      toast.success('Template created successfully');
      onTemplateCreated();
      onClose();
    } catch (error) {
      console.error('Create template error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to create template');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-neutral-900 border-2 border-[#C9A961]/30 rounded-2xl p-6 max-w-md w-full shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-[#C9A961]">Add New Template</h2>
          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-white transition-colors"
            disabled={isSubmitting}
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Template Name */}
          <div>
            <label className="block text-sm font-medium text-neutral-300 mb-2">
              Template Name
            </label>
            <input
              type="text"
              value={templateName}
              onChange={(e) => setTemplateName(e.target.value)}
              placeholder="e.g., Chanukah, Purim, Pesach"
              className="w-full px-4 py-3 bg-neutral-800 border-2 border-neutral-700 rounded-lg text-white placeholder:text-neutral-500 focus:outline-none focus:border-[#C9A961] focus:ring-2 focus:ring-[#C9A961]/20 transition-all"
              disabled={isSubmitting}
            />
          </div>

          {/* Services List */}
          <div>
            <label className="block text-sm font-medium text-neutral-300 mb-2">
              Services ({services.length})
            </label>
            
            {services.length > 0 && (
              <div className="space-y-2 mb-3 max-h-48 overflow-y-auto">
                {services.map((service) => (
                  <div
                    key={service}
                    className="flex items-center justify-between bg-neutral-800 px-3 py-2 rounded-lg border border-neutral-700"
                  >
                    <span className="text-white text-sm">{service}</span>
                    <button
                      type="button"
                      onClick={() => removeService(service)}
                      className="text-red-500 hover:text-red-400 transition-colors"
                      disabled={isSubmitting}
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Add Service Input */}
            <div className="flex gap-2">
              <input
                type="text"
                value={newService}
                onChange={(e) => setNewService(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addService();
                  }
                }}
                placeholder="Add service (e.g., Mincha, Maariv)"
                className="flex-1 px-4 py-3 bg-neutral-800 border-2 border-neutral-700 rounded-lg text-white placeholder:text-neutral-500 focus:outline-none focus:border-[#C9A961] focus:ring-2 focus:ring-[#C9A961]/20 transition-all"
                disabled={isSubmitting}
              />
              <button
                type="button"
                onClick={addService}
                className="px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2 disabled:opacity-50"
                disabled={isSubmitting}
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 border-2 border-neutral-700 rounded-lg text-neutral-300 hover:bg-neutral-800 transition-colors font-medium disabled:opacity-50"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-3 bg-[#C9A961] text-black rounded-lg hover:bg-[#B89851] transition-colors font-semibold disabled:opacity-50"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Creating...' : 'Create Template'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}