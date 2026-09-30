import React from 'react';
import { InfoSource, Provenance } from '@/types';

const styles: Record<string, string> = {
  confirmed: 'bg-both-soft text-both-ink',
  template: 'bg-navy-100 text-navy-700',
  estimate: 'bg-gold-100 text-gold-800',
  review: 'bg-red-50 text-status-redText',
  document: 'bg-ai-soft text-ai-ink',
};

export const Pill: React.FC<{ tone: keyof typeof styles; children: React.ReactNode; title?: string }> = ({ tone, children, title }) => (
  <span title={title} className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium whitespace-nowrap ${styles[tone]}`}>
    {children}
  </span>
);

/** Labels an assumption as your fact, a template default, or the product's own estimate. */
export const ProvenanceBadge: React.FC<{ value?: Provenance }> = ({ value }) => {
  if (value === 'user') return <Pill tone="confirmed" title="You supplied this">Your fact</Pill>;
  if (value === 'template') return <Pill tone="template" title="Comes from a starter template">From template</Pill>;
  return <Pill tone="estimate" title="The product's own estimate. Replace it with a real figure.">Estimate</Pill>;
};

/** Labels where a step came from, and whether it still needs the user's confirmation. */
export const SourceBadge: React.FC<{ source?: InfoSource; needsReview?: boolean; origin?: 'documented' | 'observed' }> = ({ source, needsReview, origin }) => (
  <span className="inline-flex flex-wrap items-center gap-1.5">
    {source?.kind === 'document' && <Pill tone="document" title={source.excerpt}>From document{source.ref ? `: ${source.ref}` : ''}</Pill>}
    {source?.kind === 'template' && <Pill tone="template">From template</Pill>}
    {source?.kind === 'user' && <Pill tone="confirmed">You entered</Pill>}
    {origin === 'observed' && <Pill tone="estimate" title="Happens in practice but is not in the formal procedure">Happens in practice</Pill>}
    {needsReview && <Pill tone="review">Needs your check</Pill>}
  </span>
);

export const EarlyEstimateBanner: React.FC<{ onFix?: () => void }> = ({ onFix }) => (
  <div className="rounded-xl border border-gold-200 bg-gold-50 px-4 py-3 text-sm text-gold-800 flex flex-wrap items-center justify-between gap-2">
    <span>
      <strong>Early estimate.</strong> This draft comes from a few answers. Recommendations, the roadmap and the numbers will change
      as you add real details.
    </span>
    {onFix && (
      <button onClick={onFix} className="font-semibold underline underline-offset-4 decoration-gold-500">
        Add details
      </button>
    )}
  </div>
);
