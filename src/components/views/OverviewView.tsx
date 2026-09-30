import React from 'react';
import { WorkflowState, TemplateDefinition } from '@/types';
import { sampleTemplates } from '@/lib/data/seedData';
import { ArrowRight, Sparkles, ShieldCheck, CheckCircle2, AlertCircle } from 'lucide-react';

interface OverviewViewProps {
  workflow: WorkflowState;
  onNavigate: (viewId: string) => void;
  onSelectTemplate: (templateId: string) => void;
}

export const OverviewView: React.FC<OverviewViewProps> = ({
  workflow,
  onNavigate,
  onSelectTemplate,
}) => {
  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* First-Run / Example Data Banner */}
      {workflow.isTemplateExample && (
        <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-amber-100 text-amber-800">
              <AlertCircle className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider bg-amber-200 px-2 py-0.5 rounded text-amber-900">
                  Example data
                </span>
                <h4 className="text-sm font-bold">Weekly Management Reporting Template Loaded</h4>
              </div>
              <p className="text-xs text-amber-800 mt-0.5">
                All numbers and task assessments below represent seeded illustrative sample data for executive evaluation.
              </p>
            </div>
          </div>
          <button
            onClick={() => onNavigate('discover')}
            className="px-4 py-2 bg-amber-900 hover:bg-amber-800 text-white text-xs font-bold rounded-lg transition shadow-xs whitespace-nowrap"
          >
            Explore Workflow
          </button>
        </div>
      )}

      {/* Hero Header */}
      <div className="bg-navy-900 text-white rounded-2xl p-8 sm:p-10 border border-navy-800 shadow-xl relative overflow-hidden">
        <div className="relative z-10 max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-navy-800 border border-navy-700 text-xs font-semibold text-gold-400">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Deterministic AI Opportunity Assessment & Executive Canvas</span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white leading-tight">
            Turn work into a measurable AI transformation plan.
          </h1>

          <p className="text-base text-slate-300 leading-relaxed">
            Break down business workflows into discrete tasks, evaluate where human judgment is required, model financial ROI ranges, track pilot evidence, and generate C-suite decision reports.
          </p>

          <div className="pt-4 flex flex-wrap items-center gap-4">
            <button
              onClick={() => onNavigate('tasks')}
              className="px-6 py-3 bg-gold-500 hover:bg-gold-400 text-navy-900 font-bold rounded-xl text-sm transition shadow-md flex items-center gap-2"
            >
              <span>Start with a workflow</span>
              <ArrowRight className="h-4 w-4" />
            </button>

            <button
              onClick={() => onNavigate('templates')}
              className="px-6 py-3 bg-navy-800 hover:bg-navy-700 text-white font-semibold rounded-xl text-sm border border-navy-700 transition"
            >
              Explore templates
            </button>
          </div>
        </div>

        {/* Executive Principles Card */}
        <div className="mt-8 pt-6 border-t border-navy-800/80 grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-slate-300">
          <div className="flex items-start gap-2">
            <ShieldCheck className="h-4 w-4 text-gold-400 shrink-0 mt-0.5" />
            <span><strong>Transparent Rules:</strong> Zero black-box AI scores. 100% deterministic decision logic.</span>
          </div>
          <div className="flex items-start gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
            <span><strong>Human Oversight:</strong> Full override tracking with immutable audit trail.</span>
          </div>
          <div className="flex items-start gap-2">
            <Sparkles className="h-4 w-4 text-gold-400 shrink-0 mt-0.5" />
            <span><strong>Evidence-Based:</strong> Pilot metrics baseline vs actual before C-suite expansion.</span>
          </div>
        </div>
      </div>

      {/* Starter Templates Picker */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Transformation Templates</h2>
            <p className="text-xs text-slate-500">Select a pre-configured workflow template to evaluate transformation potential</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {sampleTemplates.map((template: TemplateDefinition) => {
            const isCurrent = workflow.identity.id === template.id;
            return (
              <div
                key={template.id}
                className={`p-6 rounded-xl border transition-all flex flex-col justify-between ${
                  isCurrent
                    ? 'bg-white border-navy-900 ring-2 ring-navy-900/10 shadow-md'
                    : 'bg-white border-slate-200 hover:border-slate-300 shadow-xs'
                }`}
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-md ${
                        template.isImplemented
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {template.isImplemented ? 'Fully Functional Demo' : 'Illustrative Template'}
                    </span>
                    {isCurrent && (
                      <span className="text-xs font-bold text-gold-700 bg-gold-100 px-2 py-0.5 rounded">
                        Active Workspace
                      </span>
                    )}
                  </div>

                  <h3 className="text-lg font-bold text-slate-900">{template.title}</h3>
                  <p className="text-xs text-slate-600 leading-relaxed">{template.description}</p>
                </div>

                <div className="pt-6 border-t border-slate-100 mt-6 flex items-center justify-between">
                  <span className="text-xs text-slate-500 font-medium">
                    {template.isImplemented ? '11 tasks • Full pilot data' : 'Sample schema available'}
                  </span>
                  <button
                    onClick={() => onSelectTemplate(template.id)}
                    className={`px-4 py-2 text-xs font-bold rounded-lg transition flex items-center gap-1.5 ${
                      isCurrent
                        ? 'bg-navy-900 text-white hover:bg-navy-800'
                        : 'bg-slate-100 text-slate-800 hover:bg-slate-200'
                    }`}
                  >
                    <span>{isCurrent ? 'Open Active Workspace' : 'Load Template'}</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
