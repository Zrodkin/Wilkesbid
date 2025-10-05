// components/admin/auction-setup.tsx
'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { Plus, X } from 'lucide-react';

interface AuctionItem {
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

export function AuctionSetup({ onSuccess }: AuctionSetupProps) {
  const [endDate, setEndDate] = useState('');
  const [endTime, setEndTime] = useState('');
  const [holidayName, setHolidayName] = useState('Yom Kippur');
  const [services, setServices] = useState<string[]>([
    'Kol Nidrei',
    'Shacharis',
    'Musaf',
    'Mincha',
    'Neilah',
    'Sponsor Break Fast'
  ]);
  const [newService, setNewService] = useState('');
  const [items, setItems] = useState<AuctionItem[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Item form state
  const [itemTitle, setItemTitle] = useState('');
  const [itemService, setItemService] = useState('');
  const [itemHonor, setItemHonor] = useState('');
  const [itemDescription, setItemDescription] = useState('');
  const [itemStartingBid, setItemStartingBid] = useState(18);
  const [itemMinIncrement, setItemMinIncrement] = useState(1);

  const addService = () => {
    if (newService.trim() && !services.includes(newService.trim())) {
      setServices([...services, newService.trim()]);
      setNewService('');
    }
  };

  const removeService = (serviceToRemove: string) => {
    setServices(services.filter(s => s !== serviceToRemove));
    // Also remove any items that use this service
    setItems(items.filter(item => item.service !== serviceToRemove));
  };

  const addItem = () => {
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

    setItems([...items, newItem]);
    
    // Reset form
    setItemTitle('');
    setItemHonor('');
    setItemDescription('');
    setItemStartingBid(18);
    setItemMinIncrement(1);
    
    toast.success('Item added');
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const startAuction = async () => {
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
          holidayName,
          services,
          items: items.map((item, index) => ({
            ...item,
            displayOrder: index,
          })),
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to start auction');
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

  // Preset holiday templates
  const loadHolidayTemplate = (holiday: string) => {
    setHolidayName(holiday);
    
    switch (holiday) {
      case 'Yom Kippur':
        setServices(['Kol Nidrei', 'Shacharis', 'Musaf', 'Mincha', 'Neilah', 'Sponsor Break Fast']);
        break;
      case 'Rosh Hashanah':
        setServices(['Erev Rosh Hashanah', 'Day 1 Shacharis', 'Day 1 Musaf', 'Day 2 Shacharis', 'Day 2 Musaf']);
        break;
      case 'Shabbos':
        setServices(['Kabbalas Shabbos', 'Shacharis', 'Musaf', 'Mincha']);
        break;
      default:
        setServices([]);
    }
  };

  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-6">
      <h2 className="text-2xl font-bold mb-6 text-[#C9A961]">Setup New Auction</h2>

      {/* Holiday Configuration */}
      <div className="mb-6 p-4 border border-neutral-700 rounded-lg bg-neutral-800/50">
        <h3 className="font-semibold mb-4 text-white">Holiday Configuration</h3>
        
        {/* Holiday Name */}
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2 text-neutral-400">Holiday Name</label>
          <input
            type="text"
            value={holidayName}
            onChange={(e) => setHolidayName(e.target.value)}
            placeholder="e.g., Yom Kippur, Rosh Hashanah"
            className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded text-white focus:outline-none focus:ring-2 focus:ring-[#C9A961]/50"
          />
        </div>

        {/* Holiday Templates */}
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2 text-neutral-400">Quick Templates</label>
          <div className="flex gap-2 flex-wrap">
            {['Yom Kippur', 'Rosh Hashanah', 'Shabbos', 'Custom'].map((template) => (
              <button
                key={template}
                onClick={() => loadHolidayTemplate(template)}
                className={`px-3 py-1.5 rounded text-sm transition-colors ${
                  holidayName === template
                    ? 'bg-[#C9A961] text-black'
                    : 'bg-neutral-700 text-white hover:bg-neutral-600'
                }`}
              >
                {template}
              </button>
            ))}
          </div>
        </div>

        {/* Services List */}
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2 text-neutral-400">
            Services ({services.length})
          </label>
          <div className="space-y-2">
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
        </div>

        {/* Add Service */}
        <div className="flex gap-2">
          <input
            type="text"
            value={newService}
            onChange={(e) => setNewService(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && addService()}
            placeholder="Add new service"
            className="flex-1 px-3 py-2 bg-neutral-800 border border-neutral-700 rounded text-white focus:outline-none focus:ring-2 focus:ring-[#C9A961]/50"
          />
          <button
            onClick={addService}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Add
          </button>
        </div>
      </div>

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
              value={itemTitle}
              onChange={(e) => setItemTitle(e.target.value)}
              placeholder="e.g., Petach - Opening the Ark"
              className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded text-white focus:outline-none focus:ring-2 focus:ring-[#C9A961]/50"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1 text-neutral-400">Service</label>
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
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium mb-1 text-neutral-400">Honor Name</label>
          <input
            type="text"
            value={itemHonor}
            onChange={(e) => setItemHonor(e.target.value)}
            placeholder="e.g., Petach, Gelila, Maftir"
            className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded text-white focus:outline-none focus:ring-2 focus:ring-[#C9A961]/50"
          />
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium mb-1 text-neutral-400">Description (Optional)</label>
          <textarea
            value={itemDescription}
            onChange={(e) => setItemDescription(e.target.value)}
            placeholder="Additional details about this honor..."
            className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded text-white focus:outline-none focus:ring-2 focus:ring-[#C9A961]/50"
            rows={2}
          />
        </div>

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium mb-1 text-neutral-400">Starting Bid ($)</label>
            <input
              type="number"
              value={itemStartingBid}
              onChange={(e) => setItemStartingBid(parseFloat(e.target.value) || 0)}
              className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded text-white focus:outline-none focus:ring-2 focus:ring-[#C9A961]/50"
              min="0"
              step="1"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1 text-neutral-400">Min Increment ($)</label>
            <input
              type="number"
              value={itemMinIncrement}
              onChange={(e) => setItemMinIncrement(parseFloat(e.target.value) || 1)}
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
              <div
                key={index}
                className="flex justify-between items-start p-3 bg-neutral-800 border border-neutral-700 rounded"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-white">{item.title}</span>
                    <span className="text-xs bg-[#C9A961] text-black px-2 py-0.5 rounded">
                      {item.service}
                    </span>
                  </div>
                  <div className="text-sm text-neutral-400 mt-1">
                    {item.honor} • Starting at ${item.startingBid.toFixed(2)}
                  </div>
                  {item.description && (
                    <div className="text-xs text-neutral-500 mt-1">{item.description}</div>
                  )}
                </div>
                <button
                  onClick={() => removeItem(index)}
                  className="text-red-500 hover:text-red-400 transition-colors ml-4"
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
        disabled={isSubmitting || items.length === 0 || !endDate || !endTime || services.length === 0}
        className="w-full py-3 bg-[#C9A961] hover:bg-[#B89851] text-black rounded-lg disabled:opacity-50 disabled:cursor-not-allowed font-semibold transition-colors"
      >
        {isSubmitting ? 'Starting Auction...' : 'Start Auction'}
      </button>
    </div>
  );
}