import React from 'react';
import { WorkflowState } from '@/types';
import { Settings, Database, Shield, Cpu, RotateCcw, Lock } from 'lucide-react';

interface SettingsViewProps {
  workflow: WorkflowState;
  onResetData: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({ workflow, onResetData }) => {
  return (
    <div className="space-y-8 animate-in fade-in duration-300 max-w-4xl">
      {/* Header */}
      <div className="pb-4 border-b border-slate-200">
        <span className="text-xs font-bold uppercase tracking-wider text-gold-600 bg-gold-100 px-2 py-0.5 rounded">
          Workspace Settings
        </span>
        <h1 className="text-2xl font-extrabold text-slate-900 mt-1">Studio Configuration & Architecture</h1>
        <p className="text-xs text-slate-500">
          Local data persistence, decision engine rules, and enterprise production architecture notes.
        </p>
      </div>

      <div className="space-y-6">
        {/* Storage & Engine Card */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Cpu className="h-4 w-4 text-navy-900" />
            Decision Engine & Provider Architecture
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
              <span className="text-[10px] font-bold uppercase text-slate-500">Active Decision Provider</span>
              <div className="font-extrabold text-slate-900">Deterministic Rule Engine v1.0</div>
              <p className="text-slate-600 text-[11px]">100% transparent rules. No paid LLM API required.</p>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
              <span className="text-[10px] font-bold uppercase text-slate-500">Local Persistence Layer</span>
              <div className="font-extrabold text-slate-900">Local Database Repository</div>
              <p className="text-slate-600 text-[11px]">Retains workspace, task overrides, and pilot data across refreshes.</p>
            </div>
          </div>
        </div>

        {/* Data Reset Action */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <RotateCcw className="h-4 w-4 text-amber-600" />
            Reset Demo Data
          </h3>

          <div className="flex items-center justify-between">
            <p className="text-xs text-slate-600 max-w-md">
              Reset the active workflow to initial factory seed data for the <strong>Weekly Management Report</strong>.
            </p>
            <button
              onClick={onResetData}
              className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl transition shadow-xs flex items-center gap-1.5"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Reset to Factory Seed
            </button>
          </div>
        </div>

        {/* Enterprise Deployment Architecture Notes */}
        <div className="bg-navy-900 text-white p-6 rounded-2xl border border-navy-800 shadow-xl space-y-4">
          <h3 className="text-sm font-bold text-gold-400 flex items-center gap-2">
            <Lock className="h-4 w-4 text-gold-400" />
            Enterprise Production Deployment Requirements
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs text-slate-300">
            <div className="p-3 bg-navy-800/80 rounded-lg border border-navy-700">
              <strong className="text-white block mb-0.5">Authentication & SSO</strong>
              OIDC / SAML 2.0 integration with Okta, Azure AD, or Ping.
            </div>
            <div className="p-3 bg-navy-800/80 rounded-lg border border-navy-700">
              <strong className="text-white block mb-0.5">Database Layer</strong>
              Migrate LocalStorage repository adapter to PostgreSQL / Supabase with Prisma ORM.
            </div>
            <div className="p-3 bg-navy-800/80 rounded-lg border border-navy-700">
              <strong className="text-white block mb-0.5">Role-Based Access (RBAC)</strong>
              Fine-grained permissions for Admin, Viewer, Analyst, and Executive Approver.
            </div>
            <div className="p-3 bg-navy-800/80 rounded-lg border border-navy-700">
              <strong className="text-white block mb-0.5">Immutable Audit Logging</strong>
              Append-only audit trail database for all decision overrides and business case assumption changes.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
