import React, { useState } from 'react';
import { WorkflowState } from '@/types';
import {
  LayoutDashboard,
  Search,
  CheckSquare,
  GitBranch,
  Calculator,
  Calendar,
  BarChart3,
  Award,
  FileText,
  ShieldAlert,
  Layers,
  Settings,
  Download,
  RotateCcw,
  Check,
  Menu,
  X,
  User,
} from 'lucide-react';
import { generateExecutivePDF } from '@/lib/engine/pdfExport';

interface AppShellProps {
  workflow: WorkflowState;
  activeView: string;
  onNavigate: (viewId: string) => void;
  onReset: () => void;
  children: React.ReactNode;
}

export const AppShell: React.FC<AppShellProps> = ({
  workflow,
  activeView,
  onNavigate,
  onReset,
  children,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const mainNav = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard, step: 0 },
    { id: 'discover', label: 'Discover', icon: Search, step: 1 },
    { id: 'tasks', label: 'Task Assessment', icon: CheckSquare, step: 2 },
    { id: 'future-state', label: 'Future State', icon: GitBranch, step: 3 },
    { id: 'business-case', label: 'Business Case', icon: Calculator, step: 4 },
    { id: 'roadmap', label: 'Roadmap', icon: Calendar, step: 5 },
    { id: 'pilot', label: 'Pilot Workspace', icon: BarChart3, step: 6 },
    { id: 'decision', label: 'Final Decision', icon: Award, step: 7 },
    { id: 'executive', label: 'Executive View', icon: FileText, step: 8 },
    { id: 'governance', label: 'Governance', icon: ShieldAlert, step: 9 },
  ];

  const bottomNav = [
    { id: 'templates', label: 'Templates', icon: Layers },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  const journeySteps = [
    { id: 'discover', label: '01 Discover', viewId: 'discover', stepNum: 1 },
    { id: 'tasks', label: '02 Assess', viewId: 'tasks', stepNum: 2 },
    { id: 'future-state', label: '03 Redesign', viewId: 'future-state', stepNum: 3 },
    { id: 'business-case', label: '04 Business Case', viewId: 'business-case', stepNum: 4 },
    { id: 'roadmap', label: '05 Roadmap', viewId: 'roadmap', stepNum: 5 },
    { id: 'pilot', label: '06 Pilot', viewId: 'pilot', stepNum: 6 },
    { id: 'decision', label: '07 Decide', viewId: 'decision', stepNum: 7 },
  ];

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

  return (
    <div className="min-h-screen bg-warmwhite flex flex-col font-sans text-slate-900 selection:bg-gold-400 selection:text-navy-900">
      {/* Top Header */}
      <header className="h-16 bg-navy-900 text-white border-b border-navy-800 sticky top-0 z-40 px-4 lg:px-6 flex items-center justify-between shadow-md">
        {/* Left: Mobile Toggle & Workspace Name */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-1.5 rounded-md hover:bg-navy-800 text-slate-300"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>

          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded bg-gold-500 flex items-center justify-center font-bold text-navy-900 text-xs shadow-xs">
              YAB
            </div>
            <div>
              <span className="text-xs font-semibold text-gold-400 uppercase tracking-wider block leading-none">
                Active Workspace
              </span>
              <span className="text-sm font-bold text-white truncate max-w-[200px] sm:max-w-xs block mt-0.5">
                {workflow.identity.name}
              </span>
            </div>
          </div>
        </div>

        {/* Center: Global Progress Journey Stepper */}
        <div className="hidden xl:flex items-center gap-1 bg-navy-800/80 px-3 py-1.5 rounded-lg border border-navy-700">
          {journeySteps.map((s) => {
            const isActive = activeView === s.viewId;
            const isCompleted = workflow.activeStep > s.stepNum;
            return (
              <button
                key={s.id}
                onClick={() => onNavigate(s.viewId)}
                className={`px-2.5 py-1 rounded text-xs font-medium transition flex items-center gap-1 ${
                  isActive
                    ? 'bg-gold-500 text-navy-900 font-bold shadow-xs'
                    : isCompleted
                    ? 'text-emerald-400 hover:bg-navy-700'
                    : 'text-slate-400 hover:text-white hover:bg-navy-700'
                }`}
              >
                {isCompleted && !isActive && <Check className="h-3 w-3" />}
                {s.label}
              </button>
            );
          })}
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="hidden sm:flex items-center gap-1.5 text-xs text-slate-300 bg-navy-800/60 px-2.5 py-1 rounded border border-navy-700">
            <Check className="h-3.5 w-3.5 text-emerald-400" />
            <span>Saved</span>
          </div>

          <button
            onClick={onReset}
            title="Reset workspace to factory demo data"
            className="hidden md:flex items-center gap-1 text-xs font-medium text-slate-300 hover:text-white px-2.5 py-1.5 rounded hover:bg-navy-800 transition border border-transparent hover:border-navy-700"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Reset Data
          </button>

          <button
            onClick={handleExportPDF}
            disabled={isExporting}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-gold-500 hover:bg-gold-400 text-navy-900 text-xs font-bold rounded-md transition shadow-xs disabled:opacity-50"
          >
            <Download className="h-3.5 w-3.5" />
            {isExporting ? 'Exporting...' : 'Export Report'}
          </button>

          <div className="h-7 w-7 rounded-full bg-navy-700 border border-navy-600 flex items-center justify-center text-slate-300">
            <User className="h-4 w-4" />
          </div>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar (Desktop & Mobile drawer) */}
        <aside
          className={`w-64 bg-navy-900 text-white border-r border-navy-800 flex flex-col justify-between transition-all duration-200 z-30 fixed lg:static inset-y-16 lg:inset-y-0 left-0 ${
            mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
          }`}
        >
          {/* Logo Brand Header */}
          <div className="p-5 border-b border-navy-800">
            <h1 className="text-base font-extrabold tracking-tight text-white leading-tight">
              YOU, AI, OR BOTH?
            </h1>
            <p className="text-xs font-semibold text-gold-400 tracking-wider uppercase mt-0.5">
              Transformation Studio
            </p>
          </div>

          {/* Main Navigation */}
          <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
            <div className="px-3 pb-2 text-[10px] font-bold tracking-wider uppercase text-slate-400">
              Transformation Journey
            </div>
            {mainNav.map((item) => {
              const Icon = item.icon;
              const isActive = activeView === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    onNavigate(item.id);
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-medium transition ${
                    isActive
                      ? 'bg-gold-500 text-navy-900 font-bold shadow-sm'
                      : 'text-slate-300 hover:bg-navy-800 hover:text-white'
                  }`}
                >
                  <Icon className={`h-4 w-4 ${isActive ? 'text-navy-900' : 'text-slate-400'}`} />
                  <span className="flex-1 text-left">{item.label}</span>
                </button>
              );
            })}
          </div>

          {/* Bottom Navigation */}
          <div className="p-3 border-t border-navy-800 space-y-1 bg-navy-900">
            <div className="px-3 pb-1 text-[10px] font-bold tracking-wider uppercase text-slate-400">
              Workspace Options
            </div>
            {bottomNav.map((item) => {
              const Icon = item.icon;
              const isActive = activeView === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    onNavigate(item.id);
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition ${
                    isActive
                      ? 'bg-gold-500 text-navy-900 font-bold'
                      : 'text-slate-400 hover:bg-navy-800 hover:text-white'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{item.label}</span>
                </button>
              );
            })}

            <div className="pt-2 px-3 text-[11px] text-slate-400 flex items-center justify-between border-t border-navy-800/60 mt-2">
              <span>Rule Engine v1.0</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-navy-800 text-emerald-400 font-mono">
                Deterministic
              </span>
            </div>
          </div>
        </aside>

        {/* Main Content Workspace */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
          {children}
        </main>
      </div>
    </div>
  );
};
