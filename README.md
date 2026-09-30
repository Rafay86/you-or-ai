# You, AI, or Both? Studio

> **Turn real business workflows into practical, measurable, evidence-based AI transformation plans.**

---

## 📌 Executive Summary

**You, AI, or Both? Studio** is a premium, executive-grade web application built for CEOs, COOs, CFOs, CIOs, enterprise architects, and transformation leaders. It helps business leaders evaluate complex workflows, classify tasks into Human (**YOU**), AI-led (**AI**), or Hybrid (**BOTH**), model transparent ROI ranges, enforce implementation dependencies, track pilot metrics, and generate board-ready executive reports.

Unlike typical AI tools that rely on black-box scoring or expensive paid LLM APIs, this studio operates **100% deterministically through transparent rule-based logic and mathematical models**.

---

## 🎨 Visual System & Design Philosophy

The application uses a restrained executive color palette designed for high-level leadership workshops:

| Color Role | Hex Code | Purpose |
| :--- | :--- | :--- |
| **Deep Navy** | `#0B132B` | Primary headers, key decision cards, brand anchors |
| **Charcoal** | `#111827` | High-contrast body typography & structural elements |
| **Warm White** | `#F8FAFC` | Primary background canvas |
| **Slate** | `#64748B` | Subtitle text, metadata labels, secondary borders |
| **Soft Gold** | `#C8A96B` | Executive accents, highlights, primary CTAs |

> [!NOTE]
> **No AI Clutter**: No neon purple/cyan gradients, no glowing AI brain graphics, no gamified progress bars, and no arbitrary "AI Scores". Every visual component answers a direct business question.

---

## 🚀 The 7-Stage Transformation Journey

The product guides users through an end-to-end evidence-based lifecycle:

```text
01 Discover ──► 02 Assess ──► 03 Redesign ──► 04 Business Case ──► 05 Roadmap ──► 06 Pilot ──► 07 Decide
```

### 1. `01 Discover` — Workflow Scope & Intake
- Capture identity (name, purpose, owner, business function, frequency, triggers, outcomes).
- Record team members, systems involved (Excel, SAP, Salesforce, Slack, SharePoint), weekly/monthly volumes, labor costs ($/hr), cycle times, and friction pain point tags.

### 2. `02 Assess` — Task Classification Matrix
- Displays all workflow steps in a structured matrix table.
- Runs the deterministic rule engine (`assessTask`) evaluating repeatability, data readiness, judgment required, sensitivity, error impact, output checkability, exception rate, and human relationship value.
- **Detail Drawer & Override System**: Opens a right-side panel showing transparent rule rationale, risk flags, suggested AI/Human role splits, and an override form that logs changes to an immutable audit trace.

### 3. `03 Redesign` — Future-State Workflow Canvas
- Visual node graph allowing side-by-side comparison between **Current State** (legacy manual handoffs) and **Proposed State** (automated target architecture with human review gates).

### 4. `04 Scenario Comparison`
- Compare **Scenario A (Cautious Human-Led)** vs **Scenario B (More Automated)** across human effort hours, AI involvement %, implementation weeks, operating costs, and required controls.

### 5. `05 Business Case` — Financial ROI & Live Assumptions
- Calculates baseline labor expenditure, future time released ranges (min/max hrs), implementation costs, and net annual financial benefit ranges.
- Evaluates data completeness with a **Confidence Rating** (`High`, `Medium`, `Low`).
- Features a live **Assumption Panel** to edit hourly rates, volume, automation percentages, and operating expenses with real-time recalculation.

### 6. `06 Roadmap` — 30/60/90-Day Implementation & Dependency Engine
- 3-column Kanban board for implementation milestones.
- Enforces task dependencies (**🔒 Blocked status**): downstream tasks cannot be started until prerequisite tasks are completed, unless a manual override reason is recorded.

### 7. `07 Pilot` — Metric Baseline vs Target vs Actual Tracking
- Track empirical pilot performance across Time, Quality, Adoption, Cost, and Error Rate.
- Includes interactive Recharts bar chart visualizers and metric status badges (`Achieved`, `Partially achieved`, `Not achieved`).

### 8. `08 Decide` — Neutral Executive Gate
- Generates automated decision recommendations (**`EXPAND`**, **`IMPROVE & RETEST`**, **`STOP`**) by evaluating target achievement, open operational risks, and evidence completeness.
- Supports executive leadership overrides with logged justifications.

### 9. `09 Executive View & PDF Exporter`
- Board-ready 1-page summary for C-suite review.
- Includes a client-side **Export PDF** engine that compiles the full transformation briefing into a downloadable PDF artifact.

---

## 🛠️ Step-by-Step Local Setup Guide

Follow these instructions to run the application on your local machine.

### 📋 Prerequisites
Make sure you have Node.js and npm installed:
- **Node.js**: `v18.0.0` or higher (Tested on `v24.18.1`)
- **npm**: `v9.0.0` or higher (Tested on `v12.0.2`)

---

### Step 1: Open Terminal & Navigate to Project
```bash
cd c:\Users\mohdr\workspace\you_or_ai
```

---

### Step 2: Install Project Dependencies
Install Next.js, React, Tailwind CSS, Lucide React, Recharts, Vitest, and jsPDF:
```bash
npm install
```

---

### Step 3: Start Development Server
Launch the local Next.js development server:
```bash
npm run dev
```

You should see output confirming the server is ready:
```text
  ▲ Next.js 14.2.15
  - Local:        http://localhost:3000

 ✓ Starting...
 ✓ Ready in 2.6s
```

---

### Step 4: Open Application in Browser
Open your web browser and visit:
👉 **[http://localhost:3000](http://localhost:3000)**

---

### Step 5: Run Automated Engine Test Suite
To run the Vitest unit tests verifying decision rules, financial math, dependency blocking, and pilot metrics:
```bash
npm test
```

Expected output:
```text
 ✓ src/lib/engine/__tests__/dependencyEngine.test.ts (4 tests)
 ✓ src/lib/engine/__tests__/decisionEngine.test.ts (4 tests)
 ✓ src/lib/engine/__tests__/calculationEngine.test.ts (3 tests)

 Test Files  3 passed (3)
      Tests  11 passed (11)
```

---

### Step 6: Build for Production
To create an optimized production build:
```bash
npm run build
npm start
```

---

## 💡 Walkthrough of Default Seeded Demo

The studio comes pre-loaded with a complete seed dataset: **Weekly Management Reporting**.

### Try This Demo Flow in your browser:
1. **Open App**: Visit `http://localhost:3000`. Click **Start with a workflow** or **Explore Workflow**.
2. **Inspect Tasks (02 Assess)**:
   - Click **Task Assessment** in the left sidebar.
   - Click **Step 7: Draft management commentary**.
   - Notice the badge showing **BOTH (Human + AI)** and an active override logged by `Priya Sharma (VP Ops)`.
   - Click **Override Recommendation** to test recording a new override with a custom reason.
3. **View Visual Canvas (03 Redesign)**:
   - Click **Future State** in the left sidebar.
   - Toggle between **Current State Workflow** and **Proposed State (Human + AI Target)**.
4. **Compare Scenarios**:
   - Click **Scenario Comparison** and toggle selection between Scenario A (Cautious) and Scenario B (More Automated).
5. **Adjust Financial Model (04 Business Case)**:
   - Click **Business Case**.
   - Click **View & Edit Assumptions**.
   - Edit **Estimated Hourly Labor Cost** (e.g., change `$65` to `$85`). Observe the Net Annual Benefit range update live!
6. **Test Dependency Locking (05 Roadmap)**:
   - Click **Roadmap**.
   - Find task **"Run controlled 4-week pilot"** (marked **🔒 Blocked**).
   - Try changing its status to **In progress**. An alert modal will appear explaining that prerequisite tasks must be completed first.
7. **View Pilot Results (06 Pilot)**:
   - Click **Pilot Workspace**. View baseline vs actual bar charts.
   - Click **Edit Actual** next to any metric to test entering new numbers.
8. **Export Executive PDF (08 Executive View)**:
   - Click **Executive View** or the **Export Report** button in the top bar.
   - Click **Export Executive PDF** to download the official board briefing document.

---

## 🏗️ Project Architecture & Directory Structure

```text
you_or_ai/
├── src/
│   ├── app/
│   │   ├── globals.css         # Global Tailwind directives & styling
│   │   ├── layout.tsx          # Root Next.js layout metadata wrapper
│   │   └── page.tsx            # Main application router & state controller
│   ├── components/
│   │   ├── common/
│   │   │   ├── AssumptionPanel.tsx     # Editable financial assumptions modal
│   │   │   ├── Badge.tsx               # Executive badges (YOU, AI, BOTH)
│   │   │   ├── ConfidenceIndicator.tsx # Completeness confidence indicator
│   │   │   └── DecisionTrace.tsx       # Immutable audit trace log viewer
│   │   ├── layout/
│   │   │   └── AppShell.tsx            # Navigation sidebar, topbar & stepper
│   │   └── views/
│   │       ├── OverviewView.tsx        # Hero promise & starter templates
│   │       ├── DiscoverView.tsx        # Workflow intake form
│   │       ├── TaskAssessmentView.tsx  # Matrix table & recommendation drawer
│   │       ├── FutureStateView.tsx     # Interactive visual node canvas
│   │       ├── ScenarioComparisonView.tsx # Scenario A vs B matrix
│   │       ├── BusinessCaseView.tsx    # ROI calculations & ranges
│   │       ├── RoadmapView.tsx         # 30/60/90 board & dependency locking
│   │       ├── PilotView.tsx           # Baseline vs actual charts & table
│   │       ├── FinalDecisionView.tsx   # Neutral evidence decision gate
│   │       ├── ExecutiveView.tsx       # 1-page board-ready summary
│   │       ├── GovernanceView.tsx      # Risk, oversight & testing checklist
│   │       ├── TemplatesView.tsx       # Transformation template picker
│   │       └── SettingsView.tsx        # System architecture & data reset
│   ├── lib/
│   │   ├── data/
│   │   │   └── seedData.ts         # Weekly Management Reporting demo data
│   │   ├── engine/
│   │   │   ├── decisionEngine.ts   # assessTask() transparent rule scoring
│   │   │   ├── calculationEngine.ts# Cost, time savings & confidence math
│   │   │   ├── dependencyEngine.ts # Prerequisite validation & task locking
│   │   │   ├── pilotEngine.ts      # Metric variance & status analysis
│   │   │   ├── finalDecisionEngine.ts # EXPAND / RETEST / STOP evidence logic
│   │   │   ├── aiProvider.ts       # Optional AI provider abstraction interface
│   │   │   ├── pdfExport.ts        # Client-side Executive PDF generator
│   │   │   └── __tests__/          # Vitest unit test suite
│   │   └── storage/
│   │       └── db.ts               # Persistent LocalStorage database repository
│   └── types/
│       └── index.ts                # TypeScript domain interfaces & types
├── next.config.js                  # Next.js configuration
├── tailwind.config.js              # Executive color system configuration
├── tsconfig.json                   # TypeScript compiler configuration
├── vitest.config.ts                # Vitest test runner configuration
└── package.json                    # Project metadata & npm dependencies
```

---

## 🔒 Enterprise Deployment Roadmap

For production deployment in large enterprises, the architecture is designed to support:

| Layer | Studio Demo | Enterprise Production Requirement |
| :--- | :--- | :--- |
| **Authentication** | Local Profile | OIDC / SAML 2.0 (Okta, Azure AD, Ping) |
| **Database** | LocalStorage DB Repository (`db.ts`) | PostgreSQL / Supabase with Prisma ORM |
| **Access Control** | Single User | Role-Based Access Control (RBAC: Admin, Analyst, Approver) |
| **Audit Logging** | Client Decision Trace | Append-only PostgreSQL Audit Trail Table |
| **AI Integration** | Built-in Rule Engine | Optional LLM Hooks behind `AIProvider` Interface |
| **Compliance** | Governance Checklist | SOC 2 Type II, ISO 27001, Data Encryption at Rest |
