import React, { useRef, useState } from 'react';
import { ArrowRight, ArrowLeft, FileUp, Lock } from 'lucide-react';
import { WorkflowState } from '@/types';
import { fromLibrary, fromQuickStart, QuickStartAnswers, validateQuickStart } from '@/lib/engine/startFlows';
import { libraryFunctionsFor, libraryIndustries, libraryWorkflows, LibraryWorkflow } from '@/lib/data/library';
import { readDocumentFile, readText } from '@/lib/extraction/readers';
import { extractWorkflow } from '@/lib/extraction/extract';
import { ExtractionResult } from '@/lib/extraction/types';
import { UploadError, MAX_UPLOAD_BYTES } from '@/lib/extraction/limits';
import { SAMPLE_PROCEDURE } from '@/lib/data/sampleProcedure';
import { ExtractionReview } from './ExtractionReview';
import { Pill } from '@/components/common/Provenance';

interface StartViewProps {
  onCreate: (w: WorkflowState) => void;
  onNavigate: (view: string) => void;
  initialMode?: Mode;
}

type Mode = 'choose' | 'quick' | 'upload' | 'library';

const field = 'w-full rounded-xl border border-navy-100 bg-white px-4 py-3 text-[15px] placeholder:text-navy-600/50 focus:border-navy-900 focus:outline-none focus:ring-2 focus:ring-ai/30';

export const StartView: React.FC<StartViewProps> = ({ onCreate, onNavigate, initialMode = 'choose' }) => {
  const [mode, setMode] = useState<Mode>(initialMode);

  if (mode === 'choose') {
    const cards: { id: Mode; title: string; body: string; foot: string }[] = [
      { id: 'quick', title: 'Quick start', body: 'Answer five short questions. You get an editable draft in a minute.', foot: 'Best when you have an idea but no documents' },
      { id: 'upload', title: 'Upload a procedure', body: 'Add a PDF, Word or text file. We pull out the steps, people and decisions, and show where each came from.', foot: 'Read in your browser. Never sent anywhere' },
      { id: 'library', title: 'Start from the library', body: 'Pick an industry and a workflow. We copy an illustrative starter you can edit.', foot: 'Banking, insurance and cross-industry examples' },
    ];
    return (
      <div className="space-y-10">
        <header className="max-w-2xl">
          <h1 className="font-display text-5xl font-semibold leading-[1.05]">How do you want to begin?</h1>
          <p className="mt-4 text-lg text-navy-700">Pick whichever is easiest. You can change everything afterwards.</p>
        </header>
        <div className="grid md:grid-cols-3 gap-5">
          {cards.map((c) => (
            <button
              key={c.id}
              onClick={() => setMode(c.id)}
              className="group text-left rounded-2xl bg-white border border-navy-100 p-7 flex flex-col justify-between min-h-[15rem] hover:border-navy-900 hover:shadow-md transition"
            >
              <div>
                <h2 className="font-display text-2xl font-semibold">{c.title}</h2>
                <p className="mt-3 text-[15px] text-navy-700 leading-relaxed">{c.body}</p>
              </div>
              <div className="mt-6 flex items-center justify-between text-xs text-navy-600">
                <span>{c.foot}</span>
                <ArrowRight className="h-4 w-4 shrink-0 transition-transform group-hover:translate-x-1" />
              </div>
            </button>
          ))}
        </div>
        <p className="text-sm text-navy-600">
          Or <button onClick={() => onNavigate('projects')} className="underline underline-offset-4 font-medium text-navy-900">open a saved project</button>.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <button onClick={() => setMode('choose')} className="inline-flex items-center gap-1.5 text-sm text-navy-600 hover:text-navy-900">
        <ArrowLeft className="h-4 w-4" /> Other ways to begin
      </button>
      {mode === 'quick' && <QuickStart onCreate={onCreate} />}
      {mode === 'upload' && <UploadFlow onCreate={onCreate} />}
      {mode === 'library' && <LibraryPicker onCreate={onCreate} />}
    </div>
  );
};

// ---------------- Quick start ----------------

const QuickStart: React.FC<{ onCreate: (w: WorkflowState) => void }> = ({ onCreate }) => {
  const [a, setA] = useState<QuickStartAnswers>({ work: '', who: '', steps: '', problem: '', result: '' });
  const [tried, setTried] = useState(false);
  const v = validateQuickStart(a);
  const set = (k: keyof QuickStartAnswers) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setA({ ...a, [k]: e.target.value });
  const err = (k: keyof QuickStartAnswers) => tried && v.errors[k] && <p className="mt-1.5 text-sm text-status-redText">{v.errors[k]}</p>;

  return (
    <form
      className="max-w-2xl space-y-7"
      onSubmit={(e) => {
        e.preventDefault();
        setTried(true);
        if (v.ok) onCreate(fromQuickStart(a));
      }}
    >
      <header>
        <h1 className="font-display text-4xl font-semibold">Tell us about the work</h1>
        <p className="mt-3 text-navy-700">Five answers. Everything we draft from them is marked as an early estimate until you add more.</p>
      </header>
      <label className="block">
        <span className="block font-medium mb-2">What work do you want to improve?</span>
        <input className={field} value={a.work} onChange={set('work')} placeholder="e.g. Supplier invoice approval" />
        {err('work')}
      </label>
      <label className="block">
        <span className="block font-medium mb-2">Who does it today?</span>
        <input className={field} value={a.who} onChange={set('who')} placeholder="e.g. Accounts payable team" />
        {err('who')}
      </label>
      <label className="block">
        <span className="block font-medium mb-1">What are the main steps? <span className="font-normal text-navy-600">3 to 7, one per line</span></span>
        <textarea className={`${field} min-h-[10rem]`} value={a.steps} onChange={set('steps')} placeholder={'Receive the invoice\nMatch it to the purchase order\nGet manager approval\nSchedule payment'} />
        {err('steps')}
      </label>
      <label className="block">
        <span className="block font-medium mb-2">What is the biggest delay or problem?</span>
        <input className={field} value={a.problem} onChange={set('problem')} placeholder="e.g. Invoices wait days for approval" />
        {err('problem')}
      </label>
      <label className="block">
        <span className="block font-medium mb-2">What result do you want to improve?</span>
        <input className={field} value={a.result} onChange={set('result')} placeholder="e.g. Pay on time, with fewer errors" />
        {err('result')}
      </label>
      <button type="submit" className="inline-flex items-center gap-2 rounded-full bg-navy-900 hover:bg-navy-800 text-white font-semibold px-6 py-3.5 text-sm transition-colors">
        Build my draft <ArrowRight className="h-4 w-4" />
      </button>
    </form>
  );
};

// ---------------- Upload ----------------

const UploadFlow: React.FC<{ onCreate: (w: WorkflowState) => void }> = ({ onCreate }) => {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ name: string; data: ExtractionResult } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const run = async (name: string, load: () => Promise<ReturnType<typeof readText>>) => {
    setBusy(true);
    setError(null);
    try {
      const sections = await load();
      setResult({ name, data: extractWorkflow(sections) });
    } catch (e) {
      // Log the error type only, never the document text.
      console.warn('Upload could not be read:', e instanceof Error ? `${e.name}: ${e.message}` : 'unknown error');
      setError(e instanceof UploadError ? e.message : 'This file could not be read. Try another file, or use Quick start.');
      setResult(null);
    } finally {
      setBusy(false);
    }
  };

  if (result) {
    return <ExtractionReview fileName={result.name} result={result.data} onCancel={() => setResult(null)} onConfirm={onCreate} />;
  }

  return (
    <div className="max-w-2xl space-y-6">
      <header>
        <h1 className="font-display text-4xl font-semibold">Upload a procedure</h1>
        <p className="mt-3 text-navy-700">We find the steps, who does them, decisions, handoffs and exceptions. You check everything before anything is analysed.</p>
      </header>
      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          const f = e.dataTransfer.files?.[0];
          if (f) run(f.name, () => readDocumentFile(f));
        }}
        className="rounded-2xl border-2 border-dashed border-navy-100 bg-white p-10 text-center"
      >
        <FileUp className="mx-auto h-8 w-8 text-navy-600" />
        <p className="mt-4 font-medium">Drop a file here, or</p>
        <button onClick={() => inputRef.current?.click()} disabled={busy} className="mt-3 rounded-full bg-navy-900 hover:bg-navy-800 text-white text-sm font-semibold px-5 py-2.5 disabled:opacity-50">
          {busy ? 'Reading…' : 'Choose a file'}
        </button>
        <input
          ref={inputRef}
          type="file"
          accept=".pdf,.docx,.txt,.md"
          className="sr-only"
          aria-label="Upload a procedure"
          onChange={(e) => {
            const f = e.target.files?.[0];
            e.target.value = '';
            if (f) run(f.name, () => readDocumentFile(f));
          }}
        />
        <p className="mt-4 text-xs text-navy-600">PDF, Word (.docx) or text. Up to {MAX_UPLOAD_BYTES / 1024 / 1024} MB.</p>
      </div>
      {error && <p role="alert" className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-status-redText">{error}</p>}
      <p className="flex items-start gap-2 text-sm text-navy-600"><Lock className="h-4 w-4 mt-0.5 shrink-0" /> The file is read in your browser. Nothing is uploaded, logged or sent to any AI service.</p>
      <p className="text-sm text-navy-600">
        No document handy?{' '}
        <button onClick={() => run('Sample: Supplier Invoice Approval Procedure', async () => readText(SAMPLE_PROCEDURE))} className="font-medium text-navy-900 underline underline-offset-4">
          Try a sample procedure
        </button>
      </p>
    </div>
  );
};

// ---------------- Library ----------------

const LibraryPicker: React.FC<{ onCreate: (w: WorkflowState) => void }> = ({ onCreate }) => {
  const [industry, setIndustry] = useState(libraryIndustries[0]);
  const [fn, setFn] = useState<string | null>(null);
  const [open, setOpen] = useState<LibraryWorkflow | null>(null);

  const functions = libraryFunctionsFor(industry);
  const options = libraryWorkflows.filter((w) => w.industry === industry && (!fn || w.function === fn));
  const chip = (active: boolean) => `rounded-full px-4 py-2 text-sm font-medium transition-colors ${active ? 'bg-navy-900 text-white' : 'bg-white border border-navy-100 hover:border-navy-900'}`;

  return (
    <div className="space-y-8">
      <header className="max-w-2xl">
        <h1 className="font-display text-4xl font-semibold">Industry workflow library</h1>
        <p className="mt-3 text-navy-700">Choose an industry, then a function, then a workflow. We copy it into your workspace so you can change anything.</p>
        <p className="mt-2 text-sm text-navy-600">These are fictional, illustrative starting points. They are not your process and not regulatory requirements.</p>
      </header>

      <div className="space-y-3">
        <div className="flex flex-wrap gap-2" role="group" aria-label="Industry">
          {libraryIndustries.map((i) => (
            <button key={i} className={chip(i === industry)} onClick={() => { setIndustry(i); setFn(null); setOpen(null); }}>{i}</button>
          ))}
        </div>
        <div className="flex flex-wrap gap-2" role="group" aria-label="Function">
          <button className={chip(fn === null)} onClick={() => setFn(null)}>All functions</button>
          {functions.map((f) => (
            <button key={f} className={chip(fn === f)} onClick={() => setFn(f)}>{f}</button>
          ))}
        </div>
      </div>

      <div className="grid lg:grid-cols-[1fr_1.2fr] gap-6 items-start">
        <ul className="space-y-3">
          {options.map((w) => (
            <li key={w.id}>
              <button onClick={() => setOpen(w)} className={`w-full text-left rounded-2xl bg-white p-5 border transition ${open?.id === w.id ? 'border-navy-900 shadow-md' : 'border-navy-100 hover:border-navy-600'}`}>
                <p className="text-xs text-navy-600">{w.function}</p>
                <h3 className="font-display text-xl font-semibold mt-1">{w.title}</h3>
                <p className="text-sm text-navy-700 mt-2">{w.summary}</p>
              </button>
            </li>
          ))}
        </ul>

        {open ? (
          <article className="rounded-2xl bg-white border border-navy-100 p-7 space-y-6">
            <div>
              <Pill tone="template">Illustrative starter</Pill>
              <h2 className="font-display text-2xl font-semibold mt-3">{open.title}</h2>
              <p className="text-sm text-navy-700 mt-2">{open.summary}</p>
            </div>
            {open.steps.length > 0 && (
              <Block title="Typical steps">
                <ol className="list-decimal pl-5 space-y-1.5 text-sm">
                  {open.steps.map((s) => (
                    <li key={s.name}><span className="font-medium">{s.name}</span> <span className="text-navy-600">· {s.owner}</span></li>
                  ))}
                </ol>
              </Block>
            )}
            <Block title="Roles">{open.roles.join(', ')}</Block>
            <Block title="Common problems"><Bullets items={open.commonProblems} /></Block>
            <Block title="Questions to verify with your own team"><Bullets items={open.questionsToVerify} /></Block>
            <Block title="Possible AI opportunities"><Bullets items={open.aiOpportunities} /></Block>
            <Block title="Skills people will need"><Bullets items={open.skills} /></Block>
            <Block title="Controls to consider"><Bullets items={open.controls} /></Block>
            <Block title="Suggested measures"><Bullets items={open.measures} /></Block>
            <button onClick={() => onCreate(fromLibrary(open))} className="inline-flex items-center gap-2 rounded-full bg-navy-900 hover:bg-navy-800 text-white font-semibold px-6 py-3 text-sm">
              Copy into my workspace <ArrowRight className="h-4 w-4" />
            </button>
          </article>
        ) : (
          <p className="text-navy-600 text-sm pt-2">Pick a workflow to see what’s inside.</p>
        )}
      </div>
    </div>
  );
};

const Block: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <section>
    <h3 className="text-sm font-semibold mb-1.5">{title}</h3>
    <div className="text-sm text-navy-700">{children}</div>
  </section>
);
const Bullets: React.FC<{ items: string[] }> = ({ items }) => (
  <ul className="list-disc pl-5 space-y-1">{items.map((i) => <li key={i}>{i}</li>)}</ul>
);
