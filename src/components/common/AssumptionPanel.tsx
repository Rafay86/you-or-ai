import { ProvenanceBadge } from './Provenance';
import React, { useState } from 'react';
import { BusinessCaseAssumption } from '@/types';
import { Sliders, Check, RotateCcw, X } from 'lucide-react';

interface AssumptionPanelProps {
  assumptions: BusinessCaseAssumption[];
  onUpdateAssumption: (id: string, newValue: number) => void;
  onReset: () => void;
  isOpen: boolean;
  onClose: () => void;
}

export const AssumptionPanel: React.FC<AssumptionPanelProps> = ({
  assumptions,
  onUpdateAssumption,
  onReset,
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy-900/60 backdrop-blur-xs p-4">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in duration-200">
        {/* Header */}
        <div className="px-6 py-4 bg-navy-900 text-white flex items-center justify-between border-b border-navy-800">
          <div className="flex items-center gap-2">
            <Sliders className="h-5 w-5 text-gold-400" />
            <div>
              <h3 className="text-lg font-bold">Business Case Calculation Assumptions</h3>
              <p className="text-xs text-slate-300">Edit values to test custom scenario sensitivities</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-navy-800 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-4">
          <div className="p-3 rounded-md bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-start gap-2">
            <span className="font-bold">Transparent Math Notice:</span>
            <span>
              Calculations adjust dynamically as parameters are modified. Values represent model assumptions, not guaranteed outcomes.
            </span>
          </div>

          <div className="space-y-4">
            {assumptions.map((ass) => (
              <div
                key={ass.id}
                className="p-4 rounded-lg border border-slate-200 bg-slate-50 hover:bg-white transition space-y-2"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-slate-500 bg-slate-200 px-2 py-0.5 rounded">
                      {ass.category}
                    </span>
                    <ProvenanceBadge value={ass.provenance} />
                    <h4 className="text-sm font-bold text-slate-900 mt-1">{ass.name}</h4>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      value={ass.value}
                      onChange={(e) => onUpdateAssumption(ass.id, parseFloat(e.target.value) || 0)}
                      className="w-28 px-3 py-1.5 border border-slate-300 rounded-md font-bold text-sm text-right focus:outline-none focus:ring-2 focus:ring-navy-900 focus:border-transparent bg-white shadow-xs"
                    />
                    <span className="text-xs font-semibold text-slate-600 w-12">{ass.unit}</span>
                  </div>
                </div>
                <p className="text-xs text-slate-600">{ass.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <button
            onClick={onReset}
            className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 transition"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Reset to defaults
          </button>
          <button
            onClick={onClose}
            className="flex items-center gap-2 px-5 py-2 bg-navy-900 text-white rounded-lg text-sm font-semibold hover:bg-navy-800 transition shadow-sm"
          >
            <Check className="h-4 w-4" />
            Apply Assumptions
          </button>
        </div>
      </div>
    </div>
  );
};
