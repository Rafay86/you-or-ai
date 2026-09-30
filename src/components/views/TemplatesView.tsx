import React from 'react';
import { WorkflowState } from '@/types';
import { sampleTemplates } from '@/lib/data/seedData';
import { Layers, ArrowRight, CheckCircle2 } from 'lucide-react';

interface TemplatesViewProps {
  activeWorkflowId: string;
  onSelectTemplate: (id: string) => void;
  onNavigate: (viewId: string) => void;
}

export const TemplatesView: React.FC<TemplatesViewProps> = ({
  activeWorkflowId,
  onSelectTemplate,
  onNavigate,
}) => {
  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Header */}
      <div className="pb-4 border-b border-navy-100">
        <span className="text-sm text-navy-600">
          Transformation Library
        </span>
        <h1 className="font-display text-3xl font-semibold text-navy-900 mt-1">Workflow Templates</h1>
        <p className="text-xs text-navy-600">
          Pre-configured workflow schemas with realistic example data for fast evaluation.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {sampleTemplates.map((t) => {
          const isCurrent = t.id === activeWorkflowId;
          return (
            <div
              key={t.id}
              className={`p-6 rounded-2xl border transition-all flex flex-col justify-between space-y-4 ${
                isCurrent
                  ? 'bg-white border-navy-900 ring-2 ring-navy-900/10 shadow-lg'
                  : 'bg-white border-navy-100 hover:border-slate-300 shadow-xs'
              }`}
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span
                    className={`text-[10px] font-bold  px-2.5 py-1 rounded-md ${
                      t.isImplemented ? 'bg-emerald-100 text-emerald-800' : 'bg-navy-100 text-navy-700'
                    }`}
                  >
                    {t.isImplemented ? 'Fully Functional Demo' : 'Illustrative Template'}
                  </span>
                  {isCurrent && (
                    <span className="text-xs font-bold text-gold-800 bg-gold-100 px-2 py-0.5 rounded">
                      Active Workspace
                    </span>
                  )}
                </div>

                <h3 className="text-lg font-bold text-navy-900">{t.title}</h3>
                <p className="text-xs text-navy-700 leading-relaxed">{t.description}</p>
              </div>

              <div className="pt-4 border-t border-navy-100 flex items-center justify-between">
                <span className="text-xs text-navy-600">
                  {t.isImplemented ? '11 tasks • Seeded pilot data' : 'Sample schema'}
                </span>
                <button
                  onClick={() => {
                    onSelectTemplate(t.id);
                    onNavigate('overview');
                  }}
                  className="px-4 py-2 bg-navy-900 hover:bg-navy-800 text-white font-bold text-xs rounded-xl transition flex items-center gap-1.5"
                >
                  <span>{isCurrent ? 'Open Active' : 'Load Template'}</span>
                  <ArrowRight className="h-3.5 w-3.5 text-gold-400" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
