import React, { useState } from 'react';
import { WorkflowState } from '@/types';
import { Download, RotateCcw, Check, Menu, X } from 'lucide-react';
import { generateExecutivePDF } from '@/lib/engine/pdfExport';
import { OverlapMark } from '@/components/common/Overlap';

interface AppShellProps {
  workflow: WorkflowState;
  activeView: string;
  onNavigate: (viewId: string) => void;
  onReset: () => void;
  children: React.ReactNode;
}

// The steps are a real sequence, so they are numbered. Everything else is not.
const journey = [
  { id: 'start', label: 'Begin', hint: 'Choose how to start' },
  { id: 'current-state', label: 'Confirm the work', hint: 'How it really happens' },
  { id: 'tasks', label: 'Who does what', hint: 'You, AI or both' },
  { id: 'future-state', label: 'Redesign', hint: 'Today and proposed' },
  { id: 'people', label: 'People and controls', hint: 'Skills, owners, checks' },
  { id: 'business-case', label: 'Business case', hint: 'What it is worth' },
  { id: 'roadmap', label: 'Roadmap', hint: '30, 60, 90 days' },
  { id: 'pilot', label: 'Pilot', hint: 'Prove it small' },
  { id: 'decision', label: 'Decide', hint: 'Expand, improve or stop' },
];

const beyond = [
  { id: 'executive', label: 'Executive summary' },
  { id: 'governance', label: 'Governance and risks' },
];

const library = [
  { id: 'discover', label: 'Workflow details' },
  { id: 'projects', label: 'Saved projects' },
  { id: 'templates', label: 'Industry library' },
  { id: 'settings', label: 'Settings' },
];

/** A step counts as done when the evidence for it exists in the workspace, not because someone clicked past it. */
function stepDone(id: string, w: WorkflowState): boolean {
  const tasks = w.tasks;
  switch (id) {
    case 'start': return true;
    case 'current-state': return tasks.length > 0 && w.reviewConfirmed !== false && !tasks.some((t) => t.needsReview);
    case 'tasks': return tasks.length > 0 && !tasks.some((t) => t.recommendation === 'NEEDS_ASSESSMENT');
    case 'people': return (w.changePlan ?? []).length > 0 && (w.changePlan ?? []).every((c) => c.prerequisites.every((p) => p.met));
    case 'business-case': return w.assumptions.length > 0 && w.assumptions.every((a) => a.provenance !== 'estimate');
    case 'roadmap': return w.roadmap.length > 0 && w.roadmap.every((r) => r.status === 'Complete');
    case 'pilot': return w.pilotMetrics.length > 0 && w.pilotMetrics.every((m) => m.recorded !== false);
    case 'decision': return !!w.finalDecision?.decidedAt;
    default: return false;
  }
}

export const AppShell: React.FC<AppShellProps> = ({ workflow, activeView, onNavigate, onReset, children }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const go = (id: string) => {
    onNavigate(id);
    setMobileMenuOpen(false);
  };

  const handleExportPDF = async () => {
    try {
      setIsExporting(true);
      await generateExecutivePDF(workflow);
    } catch (e) {
      console.error('PDF export failed:', e);
    } finally {
      setIsExporting(false);
    }
  };

  const linkBase =
    'group w-full flex items-center gap-3 rounded-xl px-3 py-2 text-left text-[13px] transition-colors';
  const linkState = (active: boolean) =>
    active ? 'bg-navy-900 text-white' : 'text-navy-700 hover:bg-navy-100/70';

  return (
    <div className="min-h-screen bg-warmwhite text-navy-900 flex">
      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-[17rem] bg-warmwhite border-r border-navy-100 flex flex-col transition-transform duration-200 lg:sticky lg:top-0 lg:h-screen lg:translate-x-0 ${
          mobileMenuOpen ? 'translate-x-0 shadow-xl' : '-translate-x-full'
        }`}
      >
        <button onClick={() => go('overview')} className="flex items-center gap-3 px-6 pt-7 pb-6 text-left">
          <OverlapMark size={26} />
          <span className="font-display text-[17px] font-semibold leading-none tracking-tight">
            You, AI, or Both?
          </span>
        </button>

        <nav className="flex-1 overflow-y-auto px-3 pb-4" aria-label="Main">
          <button
            onClick={() => go('overview')}
            className={`${linkBase} ${linkState(activeView === 'overview')} font-medium`}
          >
            <span className="w-6 text-center text-base leading-none">⌂</span>
            Home
          </button>

          <p className="px-3 pt-6 pb-2 text-[11px] font-medium text-navy-600/80">The nine steps</p>
          <ol className="relative">
            <span className="absolute left-[21px] top-4 bottom-4 w-px bg-navy-100" aria-hidden="true" />
            {journey.map((s, i) => {
              const active = activeView === s.id;
              const done = stepDone(s.id, workflow);
              return (
                <li key={s.id} className="relative">
                  <button onClick={() => go(s.id)} className={`${linkBase} ${linkState(active)}`}>
                    <span
                      className={`relative z-10 grid h-6 w-6 shrink-0 place-items-center rounded-full text-[11px] font-semibold font-mono ${
                        active
                          ? 'bg-gold-400 text-navy-900'
                          : done
                          ? 'bg-both text-white'
                          : 'bg-white border border-navy-100 text-navy-600'
                      }`}
                    >
                      {done && !active ? <Check className="h-3 w-3" strokeWidth={3} /> : i + 1}
                    </span>
                    <span className="flex flex-col leading-tight">
                      <span className="font-medium">{s.label}</span>
                      <span className={`text-[11px] ${active ? 'text-white/60' : 'text-navy-600/70'}`}>{s.hint}</span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ol>

          <p className="px-3 pt-6 pb-2 text-[11px] font-medium text-navy-600/80">Share it</p>
          {beyond.map((s) => (
            <button key={s.id} onClick={() => go(s.id)} className={`${linkBase} ${linkState(activeView === s.id)} pl-12`}>
              {s.label}
            </button>
          ))}

          <p className="px-3 pt-6 pb-2 text-[11px] font-medium text-navy-600/80">Workspace</p>
          {library.map((s) => (
            <button key={s.id} onClick={() => go(s.id)} className={`${linkBase} ${linkState(activeView === s.id)} pl-12`}>
              {s.label}
            </button>
          ))}
        </nav>

        <div className="px-6 py-4 border-t border-navy-100 text-[11px] text-navy-600/80 leading-relaxed">
          Every score here comes from a rule you can read. No black box, no API keys.
        </div>
      </aside>

      {mobileMenuOpen && (
        <div className="fixed inset-0 z-30 bg-navy-900/30 lg:hidden" onClick={() => setMobileMenuOpen(false)} />
      )}

      {/* Main */}
      <div className="flex-1 min-w-0 flex flex-col">
        <header className="sticky top-0 z-20 bg-warmwhite/85 backdrop-blur border-b border-navy-100/70 px-4 lg:px-10 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 -ml-2 rounded-lg hover:bg-navy-100/70"
              aria-label="Toggle navigation"
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
            <div className="min-w-0">
              <p className="text-[11px] text-navy-600/80 leading-none">Working on</p>
              <p className="font-display text-[15px] font-semibold truncate mt-1">{workflow.identity.name}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="hidden sm:inline-flex items-center gap-1.5 text-xs text-navy-600 px-2">
              <Check className="h-3.5 w-3.5 text-both" strokeWidth={3} /> Saved on this device
            </span>
            <button
              onClick={onReset}
              title="Restore the original example data"
              className="hidden md:inline-flex items-center gap-1.5 text-xs font-medium text-navy-700 px-3 py-2 rounded-full hover:bg-navy-100/70 transition-colors"
            >
              <RotateCcw className="h-3.5 w-3.5" /> Start over
            </button>
            <button
              onClick={handleExportPDF}
              disabled={isExporting}
              className="inline-flex items-center gap-1.5 whitespace-nowrap px-4 py-2 bg-navy-900 hover:bg-navy-800 text-white text-xs font-semibold rounded-full transition-colors disabled:opacity-50"
            >
              <Download className="h-3.5 w-3.5" />
              {isExporting ? 'Preparing…' : (<>Download<span className="hidden sm:inline">&nbsp;report</span></>)}
            </button>
          </div>
        </header>

        <main className="flex-1 w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-10 py-8 lg:py-12">{children}</main>
      </div>
    </div>
  );
};
