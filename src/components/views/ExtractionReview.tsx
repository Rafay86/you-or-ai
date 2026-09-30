import React, { useState } from 'react';
import { WorkflowState } from '@/types';
import { ExtractedStep, ExtractionResult } from '@/lib/extraction/types';
import { buildWorkflow, DraftTask } from '@/lib/engine/workflowBuilder';
import { newWorkflowId } from '@/lib/engine/startFlows';
import { inferTaskAttributes } from '@/lib/engine/inference';
import { Pill } from '@/components/common/Provenance';

interface Props {
  fileName: string;
  result: ExtractionResult;
  onCancel: () => void;
  onConfirm: (w: WorkflowState) => void;
}

const input = 'w-full rounded-lg border border-navy-100 bg-white px-3 py-2 text-sm focus:border-navy-900 focus:outline-none focus:ring-2 focus:ring-ai/30';
const kindLabel: Record<string, string> = { decision: 'Decisions', exception: 'Exceptions', control: 'Controls stated', handoff: 'Handoffs', role: 'Roles found', system: 'Systems' };

/** The user must review and correct extracted items before any analysis happens. */
export const ExtractionReview: React.FC<Props> = ({ fileName, result, onCancel, onConfirm }) => {
  const [steps, setSteps] = useState<ExtractedStep[]>(result.steps);
  const [reviewed, setReviewed] = useState(false);

  const patch = (id: string, p: Partial<ExtractedStep>) => setSteps((s) => s.map((x) => (x.id === id ? { ...x, ...p } : x)));
  const included = steps.filter((s) => s.include);
  const missingOwner = included.filter((s) => !s.owner.trim()).length;
  const canConfirm = included.length > 0 && reviewed;

  const confirm = () => {
    const tasks: DraftTask[] = included.map((s) => {
      const { attrs, assumed } = inferTaskAttributes(s.name, s.description);
      return {
        name: s.name,
        description: s.description,
        currentOwner: s.owner.trim(),
        ...attrs,
        systems: s.systems,
        exceptions: s.exceptions.join(' '),
        handoffs: s.handoffs.join(' '),
        source: { kind: 'document' as const, ref: s.ref, excerpt: s.excerpt },
        origin: 'documented' as const,
        needsReview: false,
        openQuestions: [...s.unclear.filter((u) => (u.startsWith('No responsible') ? !s.owner.trim() : true)), ...assumed],
      };
    });
    onConfirm(
      buildWorkflow({
        id: newWorkflowId(),
        name: fileName.replace(/\.[a-z0-9]+$/i, ''),
        startMode: 'upload',
        reviewConfirmed: true,
        sourceDocumentName: fileName,
        tasks,
        painPoints: [],
      })
    );
  };

  const otherItems = result.items.filter((i) => i.kind !== 'role');

  return (
    <div className="space-y-8">
      <header className="max-w-3xl">
        <h1 className="font-display text-4xl font-semibold">Check what we found</h1>
        <p className="mt-3 text-navy-700">
          From <strong>{fileName}</strong>. Nothing is analysed until you confirm. Fix names and owners, untick anything that isn’t a real step.
        </p>
      </header>

      {result.warnings.length > 0 && (
        <ul className="rounded-xl bg-gold-50 border border-gold-200 p-4 text-sm text-gold-800 space-y-1" aria-label="Things to check">
          {result.warnings.map((w) => <li key={w}>• {w}</li>)}
        </ul>
      )}

      {steps.length === 0 ? (
        <p className="text-navy-700">No steps were found, so there is nothing to confirm. Go back and try another file or use Quick start.</p>
      ) : (
        <ul className="space-y-3">
          {steps.map((s, i) => (
            <li key={s.id} className={`rounded-2xl border p-5 grid md:grid-cols-[auto_1fr] gap-x-4 gap-y-3 ${s.include ? 'bg-white border-navy-100' : 'bg-navy-50 border-transparent opacity-60'}`}>
              <label className="flex items-center gap-2 text-sm font-medium md:row-span-2">
                <input type="checkbox" checked={s.include} onChange={(e) => patch(s.id, { include: e.target.checked })} className="h-4 w-4 accent-navy-900" aria-label={`Include step ${i + 1}`} />
                <span className="font-mono text-xs text-navy-600">{i + 1}</span>
              </label>
              <div className="grid md:grid-cols-[1.6fr_1fr_1fr] gap-3">
                <label className="text-xs text-navy-600">Step
                  <input className={`${input} mt-1 text-navy-900`} value={s.name} onChange={(e) => patch(s.id, { name: e.target.value, description: e.target.value })} />
                </label>
                <label className="text-xs text-navy-600">Who does it
                  <input className={`${input} mt-1 text-navy-900 ${s.include && !s.owner.trim() ? 'border-status-red' : ''}`} value={s.owner} onChange={(e) => patch(s.id, { owner: e.target.value })} placeholder="Not found" />
                </label>
                <label className="text-xs text-navy-600">Systems
                  <input className={`${input} mt-1 text-navy-900`} value={s.systems.join(', ')} onChange={(e) => patch(s.id, { systems: e.target.value.split(',').map((x) => x.trim()).filter(Boolean) })} placeholder="None found" />
                </label>
              </div>
              <div className="md:col-start-2 space-y-2">
                <p className="text-xs text-navy-600"><Pill tone="document">{s.ref}</Pill> <span className="italic">“{s.excerpt}”</span></p>
                {s.unclear.length > 0 && <p className="text-xs text-status-redText">Unclear: {s.unclear.join(' ')}</p>}
                {(s.exceptions.length > 0 || s.handoffs.length > 0 || s.controls.length > 0) && (
                  <p className="text-xs text-navy-700">
                    {s.exceptions.length > 0 && <span className="mr-3">Exception noted</span>}
                    {s.handoffs.length > 0 && <span className="mr-3">Handoff noted</span>}
                    {s.controls.length > 0 && <span>Control noted</span>}
                  </p>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}

      {otherItems.length > 0 && (
        <section className="space-y-4">
          <h2 className="font-display text-2xl font-semibold">Also found in the document</h2>
          {(['decision', 'exception', 'control', 'handoff'] as const).map((k) => {
            const list = otherItems.filter((i) => i.kind === k);
            if (!list.length) return null;
            return (
              <div key={k}>
                <h3 className="text-sm font-semibold mb-1.5">{kindLabel[k]}</h3>
                <ul className="space-y-1.5 text-sm text-navy-700">
                  {list.map((i) => (
                    <li key={i.id}><Pill tone="document">{i.ref}</Pill> {i.text}</li>
                  ))}
                </ul>
              </div>
            );
          })}
        </section>
      )}

      <div className="rounded-2xl bg-white border border-navy-100 p-5 space-y-4 max-w-3xl">
        <label className="flex items-start gap-3 text-sm">
          <input type="checkbox" className="mt-0.5 h-4 w-4 accent-navy-900" checked={reviewed} onChange={(e) => setReviewed(e.target.checked)} />
          <span>I’ve checked these steps against the document and corrected what was wrong.{missingOwner > 0 && ` ${missingOwner} step${missingOwner > 1 ? 's have' : ' has'} no owner and will be marked “needs assessment”.`}</span>
        </label>
        <div className="flex flex-wrap gap-3">
          <button onClick={confirm} disabled={!canConfirm} className="rounded-full bg-navy-900 hover:bg-navy-800 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-semibold px-6 py-3">
            Confirm and analyse
          </button>
          <button onClick={onCancel} className="rounded-full text-sm font-semibold px-5 py-3 hover:bg-navy-100/70">Choose another file</button>
        </div>
      </div>
    </div>
  );
};
