import React, { useState } from 'react';
import { WorkflowState, WorkflowIdentity } from '@/types';
import { Save, Plus, X, Users, Database, Clock, DollarSign, Activity, AlertTriangle } from 'lucide-react';

interface DiscoverViewProps {
  workflow: WorkflowState;
  onSaveIdentity: (updatedIdentity: WorkflowIdentity) => void;
  onNavigate: (viewId: string) => void;
}

export const DiscoverView: React.FC<DiscoverViewProps> = ({
  workflow,
  onSaveIdentity,
  onNavigate,
}) => {
  const [formData, setFormData] = useState<WorkflowIdentity>(workflow.identity);
  const [newSystem, setNewSystem] = useState('');
  const [savedSuccess, setSavedSuccess] = useState(false);

  const availablePainPointTags = [
    'Repetitive',
    'Slow',
    'Manual',
    'Error-prone',
    'Hard to scale',
    'Too many handoffs',
    'Data fragmented',
    'Requires judgment',
    'High sensitivity',
    'Difficult to verify',
  ];

  const handleFieldChange = (field: keyof WorkflowIdentity, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleNestedFieldChange = (parent: 'people' | 'volume' | 'cost' | 'performance', field: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [parent]: {
        ...prev[parent],
        [field]: value,
      },
    }));
  };

  const togglePainPoint = (tag: string) => {
    const current = formData.painPoints || [];
    if (current.includes(tag)) {
      setFormData((prev) => ({ ...prev, painPoints: current.filter((t) => t !== tag) }));
    } else {
      setFormData((prev) => ({ ...prev, painPoints: [...current, tag] }));
    }
  };

  const addSystem = () => {
    if (newSystem.trim() && !formData.systems.includes(newSystem.trim())) {
      setFormData((prev) => ({ ...prev, systems: [...prev.systems, newSystem.trim()] }));
      setNewSystem('');
    }
  };

  const removeSystem = (sys: string) => {
    setFormData((prev) => ({ ...prev, systems: prev.systems.filter((s) => s !== sys) }));
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveIdentity(formData);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  return (
    <form onSubmit={handleSave} className="space-y-8 animate-in fade-in duration-300 max-w-5xl">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-navy-100">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-navy-600">
              Workflow details
            </span>
            {savedSuccess && (
              <span className="text-xs font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded animate-in fade-in">
                ✓ Workflow Intake Saved
              </span>
            )}
          </div>
          <h1 className="font-display text-3xl font-semibold text-navy-900 mt-1">About this workflow</h1>
          <p className="text-xs text-navy-600">The owner, volume, cost, systems and pain points. The business case reads its hours and hourly cost from here.</p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="submit"
            className="px-5 py-2.5 bg-navy-900 hover:bg-navy-800 text-white font-bold rounded-xl text-xs transition shadow-sm flex items-center gap-2"
          >
            <Save className="h-4 w-4 text-gold-400" />
            <span>Save details</span>
          </button>
          <button
            type="button"
            onClick={() => onNavigate('tasks')}
            className="px-4 py-2.5 bg-navy-900 hover:bg-navy-800 text-white font-semibold rounded-full text-sm transition shadow-sm"
          >
            Who does what →
          </button>
        </div>
      </div>

      {/* 1. Workflow Identity */}
      <div className="bg-white p-6 rounded-xl border border-navy-100 shadow-xs space-y-4">
        <h3 className="text-base font-bold text-navy-900 flex items-center gap-2">
          <Activity className="h-4 w-4 text-navy-900" />
          Workflow Identity
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-navy-700 mb-1">Workflow Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => handleFieldChange('name', e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-navy-900 focus:outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-navy-700 mb-1">Business Function</label>
            <input
              type="text"
              value={formData.businessFunction}
              onChange={(e) => handleFieldChange('businessFunction', e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-navy-900 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-navy-700 mb-1">Workflow Owner</label>
            <input
              type="text"
              value={formData.owner}
              onChange={(e) => handleFieldChange('owner', e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-navy-900 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-navy-700 mb-1">Execution Frequency</label>
            <input
              type="text"
              value={formData.frequency}
              onChange={(e) => handleFieldChange('frequency', e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-navy-900 focus:outline-none"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-xs font-semibold text-navy-700 mb-1">Purpose & Business Objective</label>
            <textarea
              rows={2}
              value={formData.purpose}
              onChange={(e) => handleFieldChange('purpose', e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-navy-900 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-navy-700 mb-1">Start Trigger</label>
            <input
              type="text"
              value={formData.startTrigger}
              onChange={(e) => handleFieldChange('startTrigger', e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-navy-900 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-navy-700 mb-1">End Outcome</label>
            <input
              type="text"
              value={formData.endOutcome}
              onChange={(e) => handleFieldChange('endOutcome', e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-navy-900 focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* 2. People & Systems */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl border border-navy-100 shadow-xs space-y-4">
          <h3 className="text-base font-bold text-navy-900 flex items-center gap-2">
            <Users className="h-4 w-4 text-navy-900" />
            People & Governance
          </h3>

          <div className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-navy-700 mb-1">Number of People Involved</label>
              <input
                type="number"
                value={formData.people.numberOfPeople}
                onChange={(e) => handleNestedFieldChange('people', 'numberOfPeople', parseInt(e.target.value) || 1)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-navy-700 mb-1">Teams Involved (comma separated)</label>
              <input
                type="text"
                value={formData.people.teamsInvolved.join(', ')}
                onChange={(e) =>
                  handleNestedFieldChange(
                    'people',
                    'teamsInvolved',
                    e.target.value.split(',').map((s) => s.trim())
                  )
                }
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
              />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-navy-100 shadow-xs space-y-4">
          <h3 className="text-base font-bold text-navy-900 flex items-center gap-2">
            <Database className="h-4 w-4 text-navy-900" />
            Systems & Tools
          </h3>

          <div className="space-y-3">
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Add system (e.g. SAP, Salesforce, Excel)..."
                value={newSystem}
                onChange={(e) => setNewSystem(e.target.value)}
                className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-sm"
              />
              <button
                type="button"
                onClick={addSystem}
                className="px-3 py-2 bg-slate-900 text-white text-xs font-bold rounded-lg hover:bg-slate-800"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>

            <div className="flex flex-wrap gap-2 pt-2">
              {formData.systems.map((sys) => (
                <span
                  key={sys}
                  className="inline-flex items-center gap-1.5 px-3 py-1 bg-navy-100 border border-slate-300 text-navy-800 rounded-lg text-xs font-semibold"
                >
                  {sys}
                  <button type="button" onClick={() => removeSystem(sys)} className="hover:text-red-600">
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 3. Volume & Labor Cost */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl border border-navy-100 shadow-xs space-y-4">
          <h3 className="text-base font-bold text-navy-900 flex items-center gap-2">
            <Clock className="h-4 w-4 text-navy-900" />
            Volume & Frequency
          </h3>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-navy-700 mb-1">Items per Week</label>
              <input
                type="number"
                value={formData.volume.itemsPerWeek}
                onChange={(e) => handleNestedFieldChange('volume', 'itemsPerWeek', parseInt(e.target.value) || 0)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-navy-700 mb-1">Items per Month</label>
              <input
                type="number"
                value={formData.volume.itemsPerMonth}
                onChange={(e) => handleNestedFieldChange('volume', 'itemsPerMonth', parseInt(e.target.value) || 0)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
              />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-navy-100 shadow-xs space-y-4">
          <h3 className="text-base font-bold text-navy-900 flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-navy-900" />
            Labor Cost Metrics
          </h3>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-navy-700 mb-1">Hourly Cost ($/hr)</label>
              <input
                type="number"
                value={formData.cost.estimatedHourlyCost}
                onChange={(e) => handleNestedFieldChange('cost', 'estimatedHourlyCost', parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-navy-700 mb-1">Current Weekly Hours</label>
              <input
                type="number"
                value={formData.cost.currentWeeklyHours}
                onChange={(e) => handleNestedFieldChange('cost', 'currentWeeklyHours', parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
              />
            </div>
          </div>
        </div>
      </div>

      {/* 4. Pain Points */}
      <div className="bg-white p-6 rounded-xl border border-navy-100 shadow-xs space-y-4">
        <h3 className="text-base font-bold text-navy-900 flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-gold-600" />
          Workflow Pain Points & Friction Drivers
        </h3>

        <div className="flex flex-wrap gap-2">
          {availablePainPointTags.map((tag) => {
            const isSelected = formData.painPoints?.includes(tag);
            return (
              <button
                key={tag}
                type="button"
                onClick={() => togglePainPoint(tag)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                  isSelected
                    ? 'bg-navy-900 text-white border border-navy-900 shadow-xs'
                    : 'bg-navy-100 text-navy-700 border border-navy-100 hover:bg-slate-200'
                }`}
              >
                {isSelected ? '✓ ' : '+ '}
                {tag}
              </button>
            );
          })}
        </div>
      </div>
    </form>
  );
};
