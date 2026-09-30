import React, { useEffect, useState } from 'react';
import { WorkflowState } from '@/types';
import { db, ProjectSummary, VersionEntry } from '@/lib/storage/db';
import { Pill } from '@/components/common/Provenance';

interface Props {
  workflow: WorkflowState;
  onOpen: (id: string) => void;
  onDelete: (id: string) => void;
  onRestore: (versionId: string) => void;
  onNavigate: (view: string) => void;
}

const modeLabel: Record<string, string> = { 'quick-start': 'Quick start', upload: 'Uploaded', library: 'From library', example: 'Example' };

export const ProjectsView: React.FC<Props> = ({ workflow, onOpen, onDelete, onRestore, onNavigate }) => {
  const [projects, setProjects] = useState<ProjectSummary[]>([]);
  const [versions, setVersions] = useState<VersionEntry[]>([]);
  const [label, setLabel] = useState('');
  const [note, setNote] = useState('');

  const refresh = () => {
    setProjects(db.listProjects());
    setVersions(db.listVersions(workflow.id));
  };
  useEffect(refresh, [workflow.id, workflow.lastUpdated]);

  const saveVersion = () => {
    const v = db.saveVersion(workflow, label);
    setNote(v ? `Saved “${v.label}”.` : 'Could not save. Browser storage may be full.');
    setLabel('');
    refresh();
  };

  return (
    <div className="space-y-12">
      <header className="max-w-2xl">
        <h1 className="font-display text-4xl font-semibold">Saved projects</h1>
        <p className="mt-3 text-navy-700">Projects are saved in this browser only. Save a version before a big change so you can go back.</p>
      </header>

      <section>
        <ul className="space-y-3">
          {projects.map((p) => (
            <li key={p.id} className={`flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-white p-5 border ${p.id === workflow.id ? 'border-navy-900' : 'border-navy-100'}`}>
              <div>
                <p className="font-display text-lg font-semibold">{p.name}</p>
                <p className="text-xs text-navy-600 mt-1 flex flex-wrap items-center gap-2">
                  {p.startMode && <Pill tone="template">{modeLabel[p.startMode] ?? p.startMode}</Pill>}
                  {p.isEarlyEstimate && <Pill tone="estimate">Early estimate</Pill>}
                  Updated {new Date(p.updatedAt).toLocaleString()}
                </p>
              </div>
              <div className="flex gap-2">
                {p.id !== workflow.id && <button onClick={() => onOpen(p.id)} className="rounded-full bg-navy-900 text-white text-sm font-semibold px-4 py-2">Open</button>}
                {p.id === workflow.id && <span className="text-sm text-navy-600 px-3 py-2">Open now</span>}
                {p.id !== 'weekly-management-report' && (
                  <button
                    onClick={() => { if (window.confirm(`Delete “${p.name}” and its saved versions? This cannot be undone.`)) { onDelete(p.id); setTimeout(refresh, 0); } }}
                    className="rounded-full text-sm font-semibold px-4 py-2 hover:bg-red-50 text-status-redText"
                  >
                    Delete
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
        <button onClick={() => onNavigate('start')} className="mt-4 rounded-full bg-white border border-navy-100 hover:border-navy-900 px-5 py-3 text-sm font-semibold">Start a new project</button>
      </section>

      <section className="max-w-3xl">
        <h2 className="font-display text-2xl font-semibold">Versions of “{workflow.identity.name}”</h2>
        <div className="mt-4 flex flex-wrap gap-2">
          <input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Name this version, e.g. Before the pilot" className="flex-1 min-w-[14rem] rounded-xl border border-navy-100 bg-white px-4 py-2.5 text-sm focus:border-navy-900 focus:outline-none focus:ring-2 focus:ring-ai/30" />
          <button onClick={saveVersion} className="rounded-full bg-navy-900 hover:bg-navy-800 text-white text-sm font-semibold px-5 py-2.5">Save a version</button>
        </div>
        {note && <p role="status" className="mt-2 text-sm text-both-ink">{note}</p>}
        <ul className="mt-4 divide-y divide-navy-100">
          {versions.length === 0 && <li className="py-3 text-sm text-navy-600">No saved versions yet.</li>}
          {versions.map((v) => (
            <li key={v.versionId} className="py-3 flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-medium">{v.label}</p>
                <p className="text-xs text-navy-600">{new Date(v.savedAt).toLocaleString()}</p>
              </div>
              <button onClick={() => { if (window.confirm('Replace the current project with this version? Save a version first if you want to keep the current one.')) onRestore(v.versionId); }} className="text-sm font-semibold underline underline-offset-4">Restore</button>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
};
