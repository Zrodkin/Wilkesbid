// COMPLETE auction-setup.tsx with edit functionality
// components/admin/auction-setup.tsx
'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { toast } from 'sonner';
import { Plus, X, Loader2, Check, Edit } from 'lucide-react';
import { AddTemplateModal } from './add-template-modal';
import { EditTemplateItemModal } from './edit-template-item-modal';

interface AuctionItem {
  id?: string;
  title: string;
  service: string;
  honor: string;
  description?: string;
  startingBid: number;
  minimumIncrement: number;
}

interface AuctionSetupProps {
  onSuccess: () => void;
}

interface HolidayTemplate {
  id: string;
  name: string;
  services: string[];
}

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

export function AuctionSetup({ onSuccess }: AuctionSetupProps) {
  const [endDate, setEndDate] = useState('');
  const [endTime, setEndTime] = useState('');
  const [services, setServices] = useState<string[]>([]);
  const [newService, setNewService] = useState('');
  const [items, setItems] = useState<AuctionItem[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [templates, setTemplates] = useState<HolidayTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<HolidayTemplate | null>(null);
  const [showAddTemplateModal, setShowAddTemplateModal] = useState(false);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const [editingItem, setEditingItem] = useState<AuctionItem | null>(null);

  // Item form state
  const [itemTitle, setItemTitle] = useState('');
  const [itemService, setItemService] = useState('');
  const [itemHonor, setItemHonor] = useState('');
  const [itemDescription, setItemDescription] = useState('');
  const [itemStartingBid, setItemStartingBid] = useState(18);
  const [itemMinIncrement, setItemMinIncrement] = useState(1);

  // Debounce timer ref
  const saveTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Load templates from database
  const loadTemplates = async () => {
    try {
      const response = await fetch('/api/admin/holiday-templates');
      if (response.ok) {
        const data = await response.json();
        setTemplates(data.templates || []);
      }
    } catch (error) {
      console.error('Failed to load templates:', error);
    }
  };

  // Load bid items for selected template
  const loadTemplateItems = useCallback(async (templateId: string) => {
    try {
      const response = await fetch(`/api/admin/bid-templates?templateId=${templateId}`);
      if (response.ok) {
        const data = await response.json();
        setItems(data.items || []);
        
        // Save to localStorage as backup
        localStorage.setItem('auction_setup_items', JSON.stringify(data.items || []));
      }
    } catch (error) {
      console.error('Failed to load template items:', error);
      toast.error('Failed to load template items');
    }
  }, []);

  useEffect(() => {
    loadTemplates();
    
    // Try to restore from localStorage
    const savedTemplateId = localStorage.getItem('selected_template_id');
    const saved = localStorage.getItem('auction_setup_items');
    if (saved && savedTemplateId) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setItems(parsed);
        }
      } catch (e) {
        console.error('Failed to parse saved items:', e);
      }
    }
  }, []);

  // Handle template selection
  const handleTemplateSelect = (template: HolidayTemplate) => {
    setSelectedTemplate(template);
    setServices(template.services);
    loadTemplateItems(template.id);
    
    // Save template selection to localStorage
    localStorage.setItem('selected_template_id', template.id);
  };

  // Auto-save function (debounced)
  const autoSaveItems = useCallback(async (itemsToSave: AuctionItem[]) => {
    if (!selectedTemplate) return;

    setSaveStatus('saving');

    try {
      // Save all items with their display order
      const savePromises = itemsToSave.map((item, index) =>
        fetch('/api/admin/bid-templates', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: item.id,
            templateId: selectedTemplate.id,
            title: item.title,
            service: item.service,
            honor: item.honor,
            description: item.description,
            startingBid: item.startingBid,
            minimumIncrement: item.minimumIncrement,
            displayOrder: index,
          }),
        })
      );

      await Promise.all(savePromises);
      
      // Also save to localStorage as backup
      localStorage.setItem('auction_setup_items', JSON.stringify(itemsToSave));
      
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2000);
    } catch (error) {
      console.error('Auto-save failed:', error);
      setSaveStatus('error');
      toast.error('Failed to auto-save items');
    }
  }, [selectedTemplate]);

  // Debounced auto-save (fires 500ms after items change)
  useEffect(() => {
    if (items.length === 0 || !selectedTemplate) return;

    // Clear existing timer
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
    }

    // Set new timer (500ms delay)
    saveTimerRef.current = setTimeout(() => {
      autoSaveItems(items);
    }, 500);

    return () => {
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
      }
    };
  }, [items, selectedTemplate, autoSaveItems]);

  const addService = () => {
    if (newService.trim() && !services.includes(newService.trim())) {
      setServices([...services, newService.trim()]);
      setNewService('');
    }
  };

  const removeService = (serviceToRemove: string) => {
    setServices(services.filter(s => s !== serviceToRemove));
    setItems(items.filter(item => item.service !== serviceToRemove));
  };

  const addItem = async () => {
    if (!selectedTemplate) {
      toast.error('Please select a template first');
      return;
    }

    if (!itemTitle || !itemService || !itemHonor) {
      toast.error('Please fill in title, service, and honor');
      return;
    }

    const newItem: AuctionItem = {
      title: itemTitle,
      service: itemService,
      honor: itemHonor,
      description: itemDescription || undefined,
      startingBid: itemStartingBid,
      minimumIncrement: itemMinIncrement,
    };

    // Immediately save to database
    try {
      setSaveStatus('saving');
      const response = await fetch('/api/admin/bid-templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          templateId: selectedTemplate.id,
          title: newItem.title,
          service: newItem.service,
          honor: newItem.honor,
          description: newItem.description,
          startingBid: newItem.startingBid,
          minimumIncrement: newItem.minimumIncrement,
          displayOrder: items.length,
        }),
      });

      if (!response.ok) throw new Error('Failed to save item');

      const { item } = await response.json();
      
      const updatedItems = [...items, { ...newItem, id: item.id }];
      setItems(updatedItems);
      
      // Save to localStorage
      localStorage.setItem('auction_setup_items', JSON.stringify(updatedItems));
      
      // Reset form
      setItemTitle('');
      setItemHonor('');
      setItemDescription('');
      setItemStartingBid(18);
      setItemMinIncrement(1);
      
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2000);
      toast.success('Item added and saved');
    } catch (error) {
      console.error('Failed to add item:', error);
      setSaveStatus('error');
      toast.error('Failed to save item');
    }
  };

  const removeItem = async (index: number) => {
    const itemToRemove = items[index];
    
    if (itemToRemove.id) {
      try {
        await fetch(`/api/admin/bid-templates?id=${itemToRemove.id}`, {
          method: 'DELETE',
        });
      } catch (error) {
        console.error('Failed to delete item:', error);
        toast.error('Failed to delete item from template');
        return;
      }
    }

    const updatedItems = items.filter((_, i) => i !== index);
    setItems(updatedItems);
    localStorage.setItem('auction_setup_items', JSON.stringify(updatedItems));
    toast.success('Item removed');
  };

  const handleItemUpdated = (updatedItem: AuctionItem) => {
    const updatedItems = items.map(item => 
      item.id === updatedItem.id ? updatedItem : item
    );
    setItems(updatedItems);
    localStorage.setItem('auction_setup_items', JSON.stringify(updatedItems));
  };

  const startAuction = async () => {
  if (!selectedTemplate) {
    toast.error('Please select a template');
    return;
  }

  if (items.length === 0) {
    toast.error('Please add at least one auction item');
    return;
  }

  if (!endDate || !endTime) {
    toast.error('Please set an end date and time');
    return;
  }

  if (services.length === 0) {
    toast.error('Please add at least one service');
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
        holidayName: selectedTemplate.name,
        services,
        items: items.map((item, index) => ({
          title: item.title,
          service: item.service,
          honor: item.honor,
          // ✅ DEFENSIVE: Normalize null/undefined to null explicitly
          description: item.description || null,
          // ✅ DEFENSIVE: Ensure numbers are actual numbers (not strings)
          startingBid: Number(item.startingBid),
          minimumIncrement: Number(item.minimumIncrement),
          displayOrder: index,
        })),
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to start auction');
    }

    toast.success('Auction started successfully!');
    
    // Clear localStorage
    localStorage.removeItem('auction_setup_items');
    localStorage.removeItem('selected_template_id');
    
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
    <div className="space-y-6">
      {showAddTemplateModal && (
        <AddTemplateModal
          onClose={() => setShowAddTemplateModal(false)}
          onTemplateCreated={() => {
            loadTemplates();
          }}
        />
      )}

      {editingItem && (
        <EditTemplateItemModal
          item={editingItem}
          services={services}
          onClose={() => setEditingItem(null)}
          onItemUpdated={handleItemUpdated}
        />
      )}

      <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-[#C9A961]">Setup New Auction</h2>
          
          {/* Save Status Indicator */}
          {saveStatus !== 'idle' && (
            <div className="flex items-center gap-2 text-sm">
              {saveStatus === 'saving' && (
                <>
                  <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
                  <span className="text-blue-500">Saving...</span>
                </>
              )}
              {saveStatus === 'saved' && (
                <>
                  <Check className="h-4 w-4 text-green-500" />
                  <span className="text-green-500">Saved</span>
                </>
              )}
              {saveStatus === 'error' && (
                <span className="text-red-500">Save failed</span>
              )}
            </div>
          )}
        </div>

        {/* Template Selection */}
        <div className="mb-6 p-4 border border-neutral-700 rounded-lg bg-neutral-800/50">
          <h3 className="font-semibold mb-4 text-white">Select Template</h3>
          
          <div className="flex gap-2 flex-wrap">
            {templates.map((template) => (
              <button
                key={template.id}
                onClick={() => handleTemplateSelect(template)}
                className={`px-3 py-1.5 rounded text-sm transition-colors ${
                  selectedTemplate?.id === template.id
                    ? 'bg-[#C9A961] text-black'
                    : 'bg-neutral-700 text-white hover:bg-neutral-600'
                }`}
              >
                {template.name}
              </button>
            ))}
            <button
              onClick={() => setShowAddTemplateModal(true)}
              className="px-3 py-1.5 rounded text-sm transition-colors bg-green-600 text-white hover:bg-green-700 flex items-center gap-1"
            >
              <Plus className="h-4 w-4" />
              Add Template
            </button>
          </div>

          {!selectedTemplate && (
            <p className="text-sm text-neutral-400 mt-3">
              Please select a template to begin adding auction items
            </p>
          )}
        </div>

        {selectedTemplate && (
          <>
            {/* Services Section */}
            <div className="mb-6 p-4 border border-neutral-700 rounded-lg bg-neutral-800/50">
              <h3 className="font-semibold mb-4 text-white">
                Services for {selectedTemplate.name} ({services.length})
              </h3>
              
              <div className="space-y-2 mb-4">
                {services.map((service) => (
                  <div key={service} className="flex items-center justify-between bg-neutral-800 px-3 py-2 rounded">
                    <span className="text-white">{service}</span>
                    <button
                      onClick={() => removeService(service)}
                      className="text-red-500 hover:text-red-400"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>

              <div className="flex gap-2">
                <input
                  type="text"
                  value={newService}
                  onChange={(e) => setNewService(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && addService()}
                  placeholder="Add a service..."
                  className="flex-1 px-3 py-2 bg-neutral-800 border border-neutral-700 rounded text-white focus:outline-none focus:ring-2 focus:ring-[#C9A961]/50"
                />
                <button
                  onClick={addService}
                  className="px-4 py-2 bg-[#C9A961] text-black rounded hover:bg-[#B89851] transition-colors"
                >
                  Add
                </button>
              </div>
            </div>

            {/* Add Item Form */}
            <div className="mb-6 p-4 border border-neutral-700 rounded-lg bg-neutral-800/50">
              <h3 className="font-semibold mb-4 text-white">Add New Item</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium mb-2 text-neutral-400">Title</label>
                  <input
                    type="text"
                    value={itemTitle}
                    onChange={(e) => setItemTitle(e.target.value)}
                    placeholder="e.g., Shacharit Aliyah"
                    className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded text-white focus:outline-none focus:ring-2 focus:ring-[#C9A961]/50"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2 text-neutral-400">Service</label>
                  <select
                    value={itemService}
                    onChange={(e) => setItemService(e.target.value)}
                    className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded text-white focus:outline-none focus:ring-2 focus:ring-[#C9A961]/50"
                  >
                    <option value="">Select service...</option>
                    {services.map((service) => (
                      <option key={service} value={service}>
                        {service}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2 text-neutral-400">Honor</label>
                  <input
                    type="text"
                    value={itemHonor}
                    onChange={(e) => setItemHonor(e.target.value)}
                    placeholder="e.g., Chazzan, Opening Ark"
                    className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded text-white focus:outline-none focus:ring-2 focus:ring-[#C9A961]/50"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2 text-neutral-400">Starting Bid ($)</label>
                  <input
                    type="number"
                    value={itemStartingBid}
                    onChange={(e) => setItemStartingBid(Number(e.target.value))}
                    min="0"
                    step="1"
                    className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded text-white focus:outline-none focus:ring-2 focus:ring-[#C9A961]/50"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-2 text-neutral-400">Description (Optional)</label>
                  <textarea
                    value={itemDescription}
                    onChange={(e) => setItemDescription(e.target.value)}
                    placeholder="Additional details..."
                    rows={2}
                    className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded text-white focus:outline-none focus:ring-2 focus:ring-[#C9A961]/50"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2 text-neutral-400">Minimum Increment ($)</label>
                  <input
                    type="number"
                    value={itemMinIncrement}
                    onChange={(e) => setItemMinIncrement(Number(e.target.value))}
                    min="1"
                    step="1"
                    className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded text-white focus:outline-none focus:ring-2 focus:ring-[#C9A961]/50"
                  />
                </div>
              </div>

              <button
                onClick={addItem}
                className="mt-4 w-full px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Add Item
              </button>
            </div>

            {/* Items List */}
            {items.length > 0 && (
              <div className="mb-6 p-4 border border-neutral-700 rounded-lg bg-neutral-800/50">
                <h3 className="font-semibold mb-4 text-white">Auction Items ({items.length})</h3>
                
                <div className="space-y-2">
                  {items.map((item, index) => (
                    <div
                      key={index}
                      className="flex items-start justify-between bg-neutral-800 p-3 rounded border border-neutral-700"
                    >
                      <div className="flex-1">
                        <div className="font-medium text-white">{item.title}</div>
                        <div className="text-sm text-neutral-400">
                          {item.service} • {item.honor} • ${item.startingBid}
                        </div>
                        {item.description && (
                          <div className="text-xs text-neutral-500 mt-1">{item.description}</div>
                        )}
                      </div>
                      <div className="flex gap-2 ml-4">
                        <button
                          onClick={() => setEditingItem(item)}
                          className="text-[#C9A961] hover:text-[#B89851] transition-colors"
                          title="Edit item"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => removeItem(index)}
                          className="text-red-500 hover:text-red-400 transition-colors"
                          title="Remove item"
                        >
                          <X className="h-5 w-5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* End Date/Time */}
            <div className="mb-6 grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2 text-neutral-400">End Date</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded text-white focus:outline-none focus:ring-2 focus:ring-[#C9A961]/50"
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

            {/* Start Auction Button */}
            <button
              onClick={startAuction}
              disabled={isSubmitting}
              className="w-full px-6 py-3 bg-[#C9A961] text-black font-semibold rounded-lg hover:bg-[#B89851] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Starting Auction...' : 'Start Auction'}
            </button>
          </>
        )}
      </div>
    </div>
  );
}