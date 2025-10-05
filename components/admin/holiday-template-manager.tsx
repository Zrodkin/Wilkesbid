// components/admin/holiday-template-manager.tsx
'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { Plus, X, Trash2 } from 'lucide-react';

interface HolidayTemplate {
  id: string;
  name: string;
  services: string[];
}

interface HolidayTemplateManagerProps {
  templates: HolidayTemplate[];
  onTemplateCreated: () => void;
  onTemplateDeleted: () => void;
}

const DEFAULT_TEMPLATE_NAMES = ['Yom Kippur', 'Rosh Hashanah', 'Shabbos'];

export function HolidayTemplateManager({
  templates,
  onTemplateCreated,
  onTemplateDeleted,
}: HolidayTemplateManagerProps) {
  const [isCreating, setIsCreating] = useState(false);
  const [newTemplateName, setNewTemplateName] = useState('');
  const [newTemplateServices, setNewTemplateServices] = useState<string[]>([]);
  const [newService, setNewService] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const addService = () => {
    if (newService.trim() && !newTemplateServices.includes(newService.trim())) {
      setNewTemplateServices([...newTemplateServices, newService.trim()]);
      setNewService('');
    }
  };

  const removeService = (serviceToRemove: string) => {
    setNewTemplateServices(newTemplateServices.filter(s => s !== serviceToRemove));
  };

  const handleCreateTemplate = async () => {
    if (!newTemplateName.trim()) {
      toast.error('Please enter a template name');
      return;
    }

    if (newTemplateServices.length === 0) {
      toast.error('Please add at least one service');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/admin/holiday-templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newTemplateName.trim(),
          services: newTemplateServices,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create template');
      }

      toast.success('Holiday template created successfully');
      setNewTemplateName('');
      setNewTemplateServices([]);
      setIsCreating(false);
      onTemplateCreated();
    } catch (error) {
      console.error('Create template error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to create template');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteTemplate = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete the "${name}" template?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/holiday-templates/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete template');
      }

      toast.success('Template deleted successfully');
      onTemplateDeleted();
    } catch (error) {
      console.error('Delete template error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to delete template');
    }
  };

  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-bold text-[#C9A961]">Holiday Templates</h3>
        {!isCreating && (
          <button
            onClick={() => setIsCreating(true)}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
          >
            <Plus className="h-4 w-4" />
            New Template
          </button>
        )}
      </div>

      {/* Create New Template Form */}
      {isCreating && (
        <div className="mb-6 p-4 border border-neutral-700 rounded-lg bg-neutral-800/50">
          <h4 className="font-semibold mb-4 text-white">Create New Holiday Template</h4>

          {/* Template Name */}
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2 text-neutral-400">
              Template Name
            </label>
            <input
              type="text"
              value={newTemplateName}
              onChange={(e) => setNewTemplateName(e.target.value)}
              placeholder="e.g., Chanukah, Purim, Pesach"
              className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded text-white focus:outline-none focus:ring-2 focus:ring-[#C9A961]/50"
            />
          </div>

          {/* Services List */}
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2 text-neutral-400">
              Services ({newTemplateServices.length})
            </label>
            <div className="space-y-2 mb-2">
              {newTemplateServices.map((service) => (
                <div
                  key={service}
                  className="flex items-center justify-between bg-neutral-800 px-3 py-2 rounded"
                >
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

            {/* Add Service */}
            <div className="flex gap-2">
              <input
                type="text"
                value={newService}
                onChange={(e) => setNewService(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && addService()}
                placeholder="Add service (e.g., Mincha, Maariv)"
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

          {/* Action Buttons */}
          <div className="flex gap-2">
            <button
              onClick={handleCreateTemplate}
              disabled={isSubmitting}
              className="px-4 py-2 bg-[#C9A961] text-black rounded hover:bg-[#B89851] transition-colors disabled:opacity-50"
            >
              {isSubmitting ? 'Creating...' : 'Create Template'}
            </button>
            <button
              onClick={() => {
                setIsCreating(false);
                setNewTemplateName('');
                setNewTemplateServices([]);
                setNewService('');
              }}
              className="px-4 py-2 bg-neutral-700 text-white rounded hover:bg-neutral-600 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Templates List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {templates.map((template) => {
          const isDefault = DEFAULT_TEMPLATE_NAMES.includes(template.name);
          return (
            <div
              key={template.id}
              className="p-4 bg-neutral-800 border border-neutral-700 rounded-lg"
            >
              <div className="flex items-start justify-between mb-2">
                <h4 className="font-semibold text-white">{template.name}</h4>
                {!isDefault && (
                  <button
                    onClick={() => handleDeleteTemplate(template.id, template.name)}
                    className="text-red-500 hover:text-red-400 transition-colors"
                    title="Delete template"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
              {isDefault && (
                <span className="inline-block text-xs bg-blue-600 text-white px-2 py-0.5 rounded mb-2">
                  Default
                </span>
              )}
              <div className="text-sm text-neutral-400">
                <div className="font-medium mb-1">Services:</div>
                <ul className="list-disc list-inside space-y-0.5">
                  {template.services.map((service) => (
                    <li key={service}>{service}</li>
                  ))}
                </ul>
              </div>
            </div>
          );
        })}
      </div>

      {templates.length === 0 && !isCreating && (
        <div className="text-center py-8 text-neutral-400">
          No holiday templates yet. Click &quot;New Template&quot; to create one.
        </div>
      )}
    </div>
  );
}