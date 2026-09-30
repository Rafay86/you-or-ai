# You, AI, or Both? Studio

Work out which tasks in a real workflow should be done by **you**, by **AI**, or by **both**, then plan the change, build the business case, and track a pilot.

Everything runs in the browser with transparent rules. No API keys, no paid AI service, and uploaded documents never leave the machine.

## Run it

```bash
npm install
npm run dev        # http://localhost:3000
npm test           # 59 tests
npm run build      # production build
```

Node 18 or newer. No Docker needed.

## The journey

| # | Step | What it does |
|---|------|--------------|
| 1 | **Begin** | Quick start (five questions), upload a PDF/Word/text procedure, or copy a starter from the industry library |
| 2 | **Confirm the work** | Edit every step: output, owner, systems, volume, time, delays, handoffs, exceptions, judgment, sensitivity, error cost. Add steps that happen in practice but aren't documented. Each step shows its source |
| 3 | **Who does what** | Rule engine recommends You / AI / Both / Needs Assessment with plain-language reasons. Overrides record who and why |
| 4 | **Redesign** | Today and proposed side by side, plus a scenario comparison (cautious vs more automated) with net benefit, payback, a 60%-of-saving downside, and pointers from your own workflow |
| 5 | **People and controls** | One row per changed task: roles, skills, training, owners, controls, testing, approval, prerequisites, open risks |
| 6 | **Business case** | Ranges, editable assumptions, each labelled as your fact, a template default, or a product estimate |
| 7 | **Roadmap** | 30/60/90 days generated from the changes. Anything with an unmet prerequisite shows as blocked |
| 8 | **Pilot** | Enter actual results, see which assumptions were wrong |
| 9 | **Decide** | Expand, improve and retest, or stop, with evidence |

Also: executive summary, governance and open risks, saved projects with named versions, and a PDF report that labels early estimates and unconfirmed items.

## Architecture

Next.js 14 (App Router) + TypeScript + Tailwind. Client-side only for now.

```
src/
  app/                    page shell and state handlers
  components/
    views/                one file per screen
    common/               badges, provenance labels
    layout/               sidebar and header
  lib/
    engine/               pure rules and calculations (no React, no I/O)
      decisionEngine      task -> You / AI / Both / Needs Assessment
      changePlanEngine    tasks -> skills, controls, tests, prerequisites
      roadmapEngine       changes -> 30/60/90 actions with dependencies
      dependencyEngine    blocked / unblocked
      calculationEngine   business-case ranges
      pilotEngine         actual vs target
      assumptionCheck     which assumptions the pilot disproved
      workflowBuilder     one path from steps to a full workspace
      startFlows          Quick start and library entry points
      inference           guesses task attributes from wording (labelled as assumptions)
      pdfExport           report
    extraction/           document reading and step extraction (browser only)
    storage/              localStorage repository, migration, versions
    data/                 seed example, industry library, sample procedure
  types/                  data model
```

Separation: the decision engine, extraction, business-case maths, and UI don't import each other's internals. Engines take plain objects and return plain objects, which is why they are unit-tested without a browser.

**Why client-side and localStorage.** The brief requires that documents stay confidential and that the product work without a paid API. Doing extraction in the browser makes that true by construction: there is no server to log or leak a file. The cost is single-device storage. `lib/storage/db.ts` is the only file that touches storage, so swapping in a server database means replacing that one class.

## Data model

`WorkflowState` (see `src/types/index.ts`) holds one project:

- `identity`: name, owner, volume, cost, pain points
- `tasks[]`: the steps. Each has the assessment attributes plus `source` (`document` with page/section and excerpt, `template`, or `user`), `origin` (`documented` or `observed`), systems, delays, handoffs, exceptions, `openQuestions`, and `needsReview`
- `changePlan[]`: one `ChangeItem` per changed task (skills, controls, owners, prerequisites)
- `canvas`, `scenarios[]`, `assumptions[]` (each with `provenance`), `roadmap[]`, `pilotMetrics[]` (with `recorded`), `governanceItems[]`, `finalDecision`
- `startMode`, `isEarlyEstimate`, `reviewConfirmed`, `guidance`, `schemaVersion`

Old saved projects are upgraded on load by `migrateWorkflow`; it only fills missing fields and never overwrites anything the user entered.

## Decision logic

`assessTask` scores eight attributes plus system access. Nothing is hidden.

| Factor | Pushes toward AI | Pushes toward a person |
|--------|------------------|------------------------|
| Repeatability | High | Low |
| Data readiness | Structured | Unstructured |
| Judgment | Low | High |
| Sensitivity | | Confidential, Strictly restricted |
| Error impact | | High, Critical |
| Ease of checking output | Easy | Difficult |
| Exception rate | Low | High |
| Relationship value | | High |
| System access | | Unconfirmed |

- **Needs Assessment** when essential information is missing: description under 12 characters, no owner, or data readiness "Missing". The engine never guesses.
- **AI never means unattended.** AI tasks always carry a review or exception route, and confidence is capped below High when system access is unconfirmed.
- Overrides win, and are logged with user, time, and reason.

Quick start and uploads have less detail, so `inference.ts` guesses attributes from wording. Those guesses are shown on the step as "Assumed or missing" and the whole draft is labelled an early estimate.

## Upload and extraction

- PDF (`pdfjs-dist`), Word (`mammoth`), plain text and Markdown. Max 5 MB. Type is checked by extension **and** file signature.
- Read in the browser. Nothing is uploaded, sent to an AI service, or logged. Only error names are logged, never text.
- Extraction finds steps, owners, systems, decisions, handoffs, exceptions and controls with heuristics. Each item keeps its page or section and an excerpt.
- Anything unclear is flagged, not guessed. The user must review and tick a confirmation before analysis runs.
- Scanned PDFs (no text layer) are rejected with a clear message. There is no OCR.

`public/pdf.worker.min.mjs` is a copy of the pdf.js worker from `node_modules/pdfjs-dist/legacy/build/`. Refresh it if you upgrade `pdfjs-dist`.

## Sample workflows

- **Weekly management report** (built-in worked example, cross-industry). AI gathers and consolidates updates, manager and AI examine unusual movements together, and the manager keeps the escalation decision and the team conversation.
- **Banking:** customer onboarding and identity review, retail loan document check, customer complaint triage.
- **Insurance:** motor claim intake and triage, policy renewal review.
- A sample procedure for trying upload without your own document.

All fictional. None is presented as a real procedure or a regulatory requirement.

## What was tested

59 automated tests cover: decision rules including Needs Assessment and system access; the acceptance example; change-plan derivation; roadmap generation and blocked propagation; migration of old saves; Quick start validation; library contents; extraction from text, a real PDF and a real DOCX; upload validation; pilot and assumption checks; scenario comparison and its hints; and PDF contents.

Checked by hand in the browser, on a project created from the library: override, redesign, editing an assumption, prerequisites, roadmap rebuild and status change, pilot entry, decision, executive summary, governance, plus Quick start, upload of a real PDF (development and production builds), sample upload, all four failure paths (wrong type, fake PDF, oversize, empty), library copy, saved projects and versions, and loading a save that predates the new fields.

## Limitations

- **Single device.** Projects live in this browser's localStorage. No accounts, sharing, or sync.
- **Extraction is heuristic.** It reads clear numbered or bulleted procedures well and messy prose poorly. It is why the review step is mandatory.
- **No OCR**, no tables or diagrams from documents.
- **Attribute inference from wording is crude.** Quick-start verdicts are early estimates and are labelled so.
- **Business-case maths is simple.** Time released is a function of task classes and editable assumptions. It is not validated against real programmes.
- **Controls are prompts, not compliance.** Nothing is mapped to a regulation.
- **Not tested:** Word files with tracked changes or embedded objects, very large PDFs, non-English documents, screen readers beyond basic labelling, browsers other than Chromium.
- The built-in example's proposed workflow is hand-drawn and does not redraw when you override a task. Projects you create do redraw (or offer to) when decisions change.
- Some older views (Discover, Future State, Scenario, Governance) keep their earlier layout and copy.

## Before an enterprise launch

1. Server storage with authentication, roles, and per-project sharing.
2. Audit log that cannot be edited from the browser.
3. Optional AI-assisted extraction, off by default, with an explicit consent screen stating exactly what is sent.
4. OCR for scanned procedures.
5. Real calibration of the business case against pilot data.
6. Policy packs: let a company load its own controls and approval rules instead of the generic prompts.
7. Accessibility audit and a full cross-browser pass.
8. Bring the remaining older views onto the new design.
9. End-to-end browser tests (Playwright) for the main journeys.
