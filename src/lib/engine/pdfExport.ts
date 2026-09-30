import { WorkflowState } from '@/types';
import { calculateCurrentCost, calculateFutureCost, calculateConfidence } from './calculationEngine';
import { evaluateAllPilotMetrics } from './pilotEngine';
import { effectiveClassification } from './effective';
import { checkAssumptions } from './assumptionCheck';
import { compareScenarios, scenarioHints } from './scenarioCompare';

/**
 * Generates an executive PDF report and initiates browser download.
 */
export async function generateExecutivePDF(workflow: WorkflowState): Promise<void> {
  if (typeof window === 'undefined') return;

  const current = calculateCurrentCost(workflow.identity);
  const future = calculateFutureCost(workflow.identity, workflow.tasks, workflow.scenarios.find((s) => s.isSelected), workflow.assumptions);
  const confidence = calculateConfidence(workflow.identity, workflow.tasks, workflow.assumptions, { earlyEstimate: workflow.isEarlyEstimate });
  const evaluatedPilot = evaluateAllPilotMetrics(workflow.pilotMetrics);

  // Dynamic import of jsPDF to ensure client-side rendering
  const { jsPDF } = await import('jspdf');
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 15;
  const contentWidth = pageWidth - margin * 2;

  let y = margin;

  // Colors
  const navy = [27, 25, 52];
  const charcoal = [17, 24, 39];
  const slate = [100, 116, 139];
  const gold = [242, 178, 51];
  const white = [255, 255, 255];
  const lightBg = [248, 250, 252];

  // Helper functions
  const outcomeName: Record<string, string> = { EXPAND: 'Expand', IMPROVE_AND_RETEST: 'Improve and retest', STOP: 'Stop' };
  const clsName: Record<string, string> = { YOU: 'You', AI: 'AI', BOTH: 'Both', NEEDS_ASSESSMENT: 'Needs assessment' };
  const fmt = (v: number, unit: string) => (unit.startsWith('$') ? `$${Math.round(v).toLocaleString()}${unit.slice(1)}` : `${v} ${unit}`);
  const decided = !!workflow.finalDecision.decidedAt;
  const money = (n: number) => `${n < 0 ? '-' : ''}$${Math.abs(Math.round(n / 100) / 10).toLocaleString()}k`;

  // A page break redraws the header and footer, so put the font, size and colour back afterwards.
  const checkPageBreak = (needed: number) => {
    if (y + needed > pageHeight - margin) {
      const font = doc.getFont();
      const size = doc.getFontSize();
      const colour = doc.getTextColor();
      doc.addPage();
      y = margin;
      drawHeaderFooter();
      doc.setFont(font.fontName, font.fontStyle);
      doc.setFontSize(size);
      doc.setTextColor(colour);
    }
  };

  const drawHeaderFooter = () => {
    // Header bar
    doc.setFillColor(navy[0], navy[1], navy[2]);
    doc.rect(0, 0, pageWidth, 10, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(gold[0], gold[1], gold[2]);
    doc.text('YOU, AI, OR BOTH? STUDIO — EXECUTIVE TRANSFORMATION REPORT', margin, 7);

    // Footer bar
    doc.setFillColor(lightBg[0], lightBg[1], lightBg[2]);
    doc.rect(0, pageHeight - 10, pageWidth, 10, 'F');
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(slate[0], slate[1], slate[2]);
    doc.text(`Workflow: ${workflow.identity.name} | Generated: ${new Date().toLocaleDateString()}`, margin, pageHeight - 4);
    const totalPages = doc.getNumberOfPages();
    doc.text(`Page ${totalPages}`, pageWidth - margin - 10, pageHeight - 4);
  };

  drawHeaderFooter();
  y = 18;

  // Title Block
  doc.setFillColor(navy[0], navy[1], navy[2]);
  doc.rect(margin, y, contentWidth, 24, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(white[0], white[1], white[2]);
  doc.text(workflow.identity.name, margin + 6, y + 10);

  doc.setFontSize(9);
  doc.setTextColor(gold[0], gold[1], gold[2]);
  doc.text(`EXECUTIVE BRIEFING & AI TRANSFORMATION DECISION`, margin + 6, y + 18);
  y += 30;

  if (workflow.isEarlyEstimate) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(178, 110, 10);
    const note = doc.splitTextToSize('EARLY ESTIMATE: this draft was built from a few answers. Recommendations, the roadmap and the numbers will change as real details are added.', contentWidth);
    doc.text(note, margin, y);
    y += note.length * 4 + 4;
  }

  // 1. Executive Summary
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(navy[0], navy[1], navy[2]);
  doc.text('1. EXECUTIVE SUMMARY', margin, y);
  y += 4;
  doc.setDrawColor(gold[0], gold[1], gold[2]);
  doc.setLineWidth(0.5);
  doc.line(margin, y, margin + 40, y);
  y += 6;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(charcoal[0], charcoal[1], charcoal[2]);
  const nAI = workflow.tasks.filter((t) => effectiveClassification(t) === 'AI').length;
  const nBoth = workflow.tasks.filter((t) => effectiveClassification(t) === 'BOTH').length;
  const nYou = workflow.tasks.filter((t) => effectiveClassification(t) === 'YOU').length;
  const nOpen = workflow.tasks.length - nAI - nBoth - nYou;
  const summaryText = `This report reviews "${workflow.identity.name}" task by task. Of ${workflow.tasks.length} tasks, ${nAI} are rated suitable for AI within defined limits, ${nBoth} are shared between AI and a person, ${nYou} stay with people${nOpen > 0 ? `, and ${nOpen} still need assessment` : ''}. Every recommendation comes from a stated rule and can be overridden by a named person.`;
  const splitSummary = doc.splitTextToSize(summaryText, contentWidth);
  doc.text(splitSummary, margin, y);
  y += splitSummary.length * 5 + 4;

  // Key Metrics Box
  doc.setFillColor(lightBg[0], lightBg[1], lightBg[2]);
  doc.rect(margin, y, contentWidth, 22, 'F');
  doc.setDrawColor(slate[0], slate[1], slate[2]);
  doc.setLineWidth(0.1);
  doc.rect(margin, y, contentWidth, 22, 'S');

  const colW = contentWidth / 4;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(slate[0], slate[1], slate[2]);

  doc.text('CURRENT EFFORT', margin + 4, y + 6);
  doc.text('EST. TIME RELEASE', margin + colW + 4, y + 6);
  doc.text('EST. NET BENEFIT / YR', margin + colW * 2 + 4, y + 6);
  doc.text('DECISION', margin + colW * 3 + 4, y + 6);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(navy[0], navy[1], navy[2]);
  doc.text(`${current.weeklyHours} hrs/week`, margin + 4, y + 14);
  doc.text(`${future.automationMinPct}% – ${future.automationMaxPct}%`, margin + colW + 4, y + 14);
  doc.text(`$${(future.netAnnualBenefitMin / 1000).toFixed(0)}k – $${(future.netAnnualBenefitMax / 1000).toFixed(0)}k`, margin + colW * 2 + 4, y + 14);

  doc.setTextColor(178, 110, 10);
  doc.setFontSize(9);
  doc.text(decided ? outcomeName[workflow.finalDecision.selectedOutcome] : 'Not decided yet', margin + colW * 3 + 4, y + 14);
  y += 25;

  const placeholders = workflow.assumptions.filter((a) => (a.id === 'hourly_cost' || a.id === 'current_monthly_hours') && a.provenance === 'estimate');
  if (placeholders.length > 0) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(178, 110, 10);
    const warn = doc.splitTextToSize('Note: current hours or hourly cost are placeholders, not measured figures. Every cost and saving in this report inherits that uncertainty.', contentWidth);
    doc.text(warn, margin, y);
    y += warn.length * 3.6 + 3;
  } else {
    y += 3;
  }

  // 2. Workflow Overview & Intake
  checkPageBreak(35);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(navy[0], navy[1], navy[2]);
  doc.text('2. WORKFLOW SCOPE & INTAKE', margin, y);
  y += 4;
  doc.line(margin, y, margin + 40, y);
  y += 6;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(charcoal[0], charcoal[1], charcoal[2]);
  doc.text(`Owner: ${workflow.identity.owner}`, margin, y);
  doc.text(`Frequency: ${workflow.identity.frequency}`, margin + 80, y);
  y += 5;
  if (workflow.identity.people.teamsInvolved.length > 0) {
    doc.text(`Teams involved: ${workflow.identity.people.teamsInvolved.join(', ')}`, margin, y);
    y += 5;
  }
  if (workflow.identity.systems.length > 0) {
    const sysLines = doc.splitTextToSize(`Systems: ${workflow.identity.systems.join(', ')}`, contentWidth);
    doc.text(sysLines, margin, y);
    y += sysLines.length * 4.5;
  }
  y += 4;

  // 3. Task Assessment Matrix
  checkPageBreak(50);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(navy[0], navy[1], navy[2]);
  doc.text('3. TASK ASSESSMENT MATRIX & OVERRIDES', margin, y);
  y += 4;
  doc.line(margin, y, margin + 50, y);
  y += 6;

  // Table header
  doc.setFillColor(navy[0], navy[1], navy[2]);
  doc.rect(margin, y, contentWidth, 7, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(white[0], white[1], white[2]);
  doc.text('#', margin + 2, y + 5);
  doc.text('Task Name', margin + 8, y + 5);
  doc.text('Current Owner', margin + 65, y + 5);
  doc.text('Rule Rec', margin + 110, y + 5);
  doc.text('Final Classification', margin + 140, y + 5);
  y += 7;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);

  workflow.tasks.forEach((t, idx) => {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    const nameLines = doc.splitTextToSize(t.name, 54).slice(0, 3);
    const ownerLines = doc.splitTextToSize(t.currentOwner || 'Not named', 40).slice(0, 2);
    const rowH = Math.max(nameLines.length, ownerLines.length) * 3.6 + 2.6;
    checkPageBreak(rowH + 2);
    if (idx % 2 === 1) {
      doc.setFillColor(lightBg[0], lightBg[1], lightBg[2]);
      doc.rect(margin, y, contentWidth, rowH, 'F');
    }
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(charcoal[0], charcoal[1], charcoal[2]);
    doc.text(`${t.stepNumber}`, margin + 2, y + 4);
    doc.text(nameLines, margin + 8, y + 4);
    doc.text(ownerLines, margin + 65, y + 4);
    doc.text(clsName[t.recommendation] ?? t.recommendation, margin + 110, y + 4);

    const finalCls = t.override ? `${clsName[t.override.newClassification]} (override)` : clsName[t.recommendation] ?? t.recommendation;
    doc.setFont('helvetica', t.override ? 'bold' : 'normal');
    if (t.override) doc.setTextColor(178, 110, 10);
    doc.text(finalCls, margin + 140, y + 4);
    y += rowH;
  });

  y += 6;

  // 4. Decision Trace Log
  if (workflow.decisionTrace.length > 0) {
    checkPageBreak(30);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(navy[0], navy[1], navy[2]);
    doc.text('DECISION TRACE & OVERRIDE LOG', margin, y);
    y += 5;

    workflow.decisionTrace.forEach((tr) => {
      checkPageBreak(12);
      doc.setFillColor(254, 252, 232); // soft amber
      doc.rect(margin, y, contentWidth, 10, 'F');
      doc.setDrawColor(gold[0], gold[1], gold[2]);
      doc.rect(margin, y, contentWidth, 10, 'S');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.setTextColor(charcoal[0], charcoal[1], charcoal[2]);
      doc.text(`${tr.user} changed the recommendation from ${clsName[tr.previousRecommendation] ?? tr.previousRecommendation} to ${clsName[tr.newClassification] ?? tr.newClassification}`, margin + 3, y + 4);
      doc.setFont('helvetica', 'normal');
      doc.text(`Reason: ${tr.reason}`, margin + 3, y + 8);
      y += 13;
    });
  }

  // 5. Scenario & Business Case
  checkPageBreak(40);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(navy[0], navy[1], navy[2]);
  doc.text('4. SCENARIO COMPARISON & BUSINESS CASE', margin, y);
  y += 4;
  doc.line(margin, y, margin + 55, y);
  y += 6;

  const selScenario = workflow.scenarios.find((s) => s.isSelected) || workflow.scenarios[0];
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(charcoal[0], charcoal[1], charcoal[2]);
  doc.text(`Selected Transformation Scenario: ${selScenario.name}`, margin, y);
  y += 5;
  doc.text(`Confidence: ${confidence.level} (${confidence.score}% of the checklist satisfied)${confidence.missingInformation.length ? `. Not yet met: ${confidence.missingInformation.join('; ')}` : ''}`, margin, y, { maxWidth: contentWidth });
  y += confidence.missingInformation.length ? 9 : 6;

  // Scenario comparison table
  const outcomes = compareScenarios(workflow);
  if (outcomes.length > 0) {
    checkPageBreak(12 + outcomes.length * 9);
    doc.setFillColor(navy[0], navy[1], navy[2]);
    doc.rect(margin, y, contentWidth, 6, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(white[0], white[1], white[2]);
    const cx = [2, 52, 78, 104, 124, 146];
    ['Scenario', 'People, hrs/mo', 'Released, hrs/mo', 'Set-up', 'Run, /mo', 'Net /yr (if 60%)'].forEach((h, i) => doc.text(h, margin + cx[i], y + 4.3));
    y += 6;
    outcomes.forEach((o, i) => {
      checkPageBreak(10);
      if (i % 2 === 1) {
        doc.setFillColor(lightBg[0], lightBg[1], lightBg[2]);
        doc.rect(margin, y, contentWidth, 8, 'F');
      }
      // Draw every row with the same height so the table reads evenly.
      doc.setFont('helvetica', o.scenario.isSelected ? 'bold' : 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(charcoal[0], charcoal[1], charcoal[2]);
      const label = `${o.scenario.name.replace(/^Scenario [AB]\s*[:—–-]\s*/, '')}${o.scenario.isSelected ? ' (chosen)' : ''}`;
      doc.text(doc.splitTextToSize(label, 46).slice(0, 1), margin + cx[0], y + 3.6);
      doc.text(`${o.scenario.humanEffortHoursMonthly}`, margin + cx[1], y + 3.6);
      doc.text(`${o.hoursReleasedMonthly}`, margin + cx[2], y + 3.6);
      doc.text(`${money(o.implementationCost)}, ${o.scenario.implementationEffortWeeks} wks`, margin + cx[3] - 4, y + 3.6);
      doc.text(`$${o.runCostMonthly.toLocaleString()}`, margin + cx[4], y + 3.6);
      doc.text(`${money(o.netAnnual)} (${money(o.netAnnualIfSixtyPct)})`, margin + cx[5], y + 3.6);
      y += 8;
    });
    y += 2;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(charcoal[0], charcoal[1], charcoal[2]);
    const hintText = scenarioHints(workflow).map((h) => `${h.toward === 'cautious' ? 'Toward cautious' : h.toward === 'automated' ? 'Toward automated' : 'Note'}: ${h.text}`);
    hintText.forEach((line) => {
      const split = doc.splitTextToSize(`- ${line}`, contentWidth);
      checkPageBreak(split.length * 3.6 + 1);
      doc.text(split, margin, y);
      y += split.length * 3.6 + 0.8;
    });
    y += 4;
  }

  // Business Case Summary Table
  checkPageBreak(30);
  doc.setFillColor(lightBg[0], lightBg[1], lightBg[2]);
  doc.rect(margin, y, contentWidth, 22, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(slate[0], slate[1], slate[2]);
  doc.text('BASELINE COST', margin + 4, y + 5);
  doc.text('FUTURE ESTIMATE', margin + 45, y + 5);
  doc.text('IMPLEMENTATION', margin + 90, y + 5);
  doc.text('NET ANNUAL BENEFIT RANGE', margin + 135, y + 5);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(navy[0], navy[1], navy[2]);
  doc.text(`$${(current.annualLaborCost / 1000).toFixed(1)}k / yr`, margin + 4, y + 13);
  doc.text(`$${(future.futureMonthlyCostMin * 12 / 1000).toFixed(1)}k–$${(future.futureMonthlyCostMax * 12 / 1000).toFixed(1)}k / yr`, margin + 45, y + 13);
  doc.text(`$${(future.implementationCost / 1000).toFixed(0)}k`, margin + 90, y + 13);
  doc.setTextColor(gold[0], gold[1], gold[2]);
  doc.text(`$${(future.netAnnualBenefitMin / 1000).toFixed(0)}k – $${(future.netAnnualBenefitMax / 1000).toFixed(0)}k`, margin + 135, y + 13);
  y += 28;

  // 6. Pilot Results
  checkPageBreak(40);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(navy[0], navy[1], navy[2]);
  doc.text('5. PILOT PERFORMANCE & EVIDENCE', margin, y);
  y += 4;
  doc.line(margin, y, margin + 50, y);
  y += 6;

  doc.setFillColor(navy[0], navy[1], navy[2]);
  doc.rect(margin, y, contentWidth, 6, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(white[0], white[1], white[2]);
  doc.text('Metric Name', margin + 2, y + 4.5);
  doc.text('Baseline', margin + 65, y + 4.5);
  doc.text('Target Range', margin + 95, y + 4.5);
  doc.text('Actual Result', margin + 130, y + 4.5);
  doc.text('Status', margin + 152, y + 4.5);
  y += 6;

  evaluatedPilot.forEach((m, i) => {
    checkPageBreak(7);
    if (i % 2 === 1) {
      doc.setFillColor(lightBg[0], lightBg[1], lightBg[2]);
      doc.rect(margin, y, contentWidth, 6, 'F');
    }
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(charcoal[0], charcoal[1], charcoal[2]);
    doc.text(m.name, margin + 2, y + 4.5);
    const unrecorded = m.recorded === false;
    doc.text(fmt(m.baseline, m.unit), margin + 65, y + 4.5);
    doc.text(m.unit.startsWith('$') ? `$${Math.round(m.targetMin).toLocaleString()}–$${Math.round(m.targetMax).toLocaleString()}${m.unit.slice(1)}` : `${m.targetMin}–${m.targetMax} ${m.unit}`, margin + 95, y + 4.5);
    doc.text(unrecorded ? 'Not recorded' : fmt(m.actual, m.unit), margin + 128, y + 4.5);

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(
      m.status === 'Achieved' ? 16 : 180,
      m.status === 'Achieved' ? 120 : 100,
      m.status === 'Achieved' ? 80 : 0
    );
    doc.text(unrecorded ? 'No evidence yet' : m.status, margin + 152, y + 4.5);
    y += 6;
  });

  y += 8;

  // 7. Executive Decision & Next Steps
  checkPageBreak(35);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(navy[0], navy[1], navy[2]);
  doc.text('6. EXECUTIVE DECISION & NEXT ACTION', margin, y);
  y += 4;
  doc.line(margin, y, margin + 50, y);
  y += 6;

  doc.setFillColor(navy[0], navy[1], navy[2]);
  doc.rect(margin, y, contentWidth, 18, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(gold[0], gold[1], gold[2]);
  doc.text(decided ? `DECISION: ${outcomeName[workflow.finalDecision.selectedOutcome].toUpperCase()}` : 'DECISION: NOT DECIDED YET', margin + 6, y + 7);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(white[0], white[1], white[2]);
  doc.text(`${decided ? `Decided by ${workflow.finalDecision.decidedBy || 'an unnamed person'} on ${new Date(workflow.finalDecision.decidedAt).toLocaleDateString()}` : 'Nobody has recorded a decision. Run the pilot and record results first.'}`, margin + 6, y + 13);
  y += 24;

  // 7. People, skills and controls
  const heading = (title: string) => {
    checkPageBreak(30);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(navy[0], navy[1], navy[2]);
    doc.text(title, margin, y);
    y += 4;
    doc.line(margin, y, margin + 50, y);
    y += 6;
  };
  const lines = (text: string, bold = false, size = 8.5) => {
    doc.setFont('helvetica', bold ? 'bold' : 'normal');
    doc.setFontSize(size);
    doc.setTextColor(charcoal[0], charcoal[1], charcoal[2]);
    const split = doc.splitTextToSize(text, contentWidth);
    checkPageBreak(split.length * 4.2 + 2);
    doc.setFont('helvetica', bold ? 'bold' : 'normal');
    doc.setFontSize(size);
    doc.setTextColor(charcoal[0], charcoal[1], charcoal[2]);
    doc.text(split, margin, y);
    y += split.length * 4.2 + 1.5;
  };

  const plan = workflow.changePlan ?? [];
  heading('7. PEOPLE, SKILLS AND CONTROLS');
  if (plan.length === 0) lines('No task changes are planned yet.');
  plan.forEach((c) => {
    const t = workflow.tasks.find((x) => x.id === c.taskId);
    if (!t) return;
    checkPageBreak(32); // keep a step's heading with its first lines
    lines(`Step ${t.stepNumber}: ${t.name.length > 90 ? `${t.name.slice(0, 87)}…` : t.name} (${clsName[effectiveClassification(t)]})`, true, 9);
    lines(`Owners: business, ${c.businessOwner}; technical, ${c.technicalOwner}`);
    if (c.skillsNeeded.length) lines(`Skills: ${c.skillsNeeded.join('; ')}`);
    c.controls.forEach((k) => lines(`- ${k.area}: ${k.text}`));
    lines(`Testing: ${c.testingRequired} Approval: ${c.approvalRequired}`);
    const open = c.prerequisites.filter((p) => !p.met);
    if (open.length) {
      const kind = (id: string) => (id.endsWith('-data') ? 'source data in a machine-readable form' : id.endsWith('-access') ? 'system access confirmed' : id.endsWith('-policy') ? 'data policy confirms AI may process it' : 'missing details supplied');
      lines(`Still needed: ${open.map((p) => kind(p.id)).join('; ')}`);
    }
    y += 2;
  });
  lines('Controls are prompts to check against your own policies. This report makes no claim of regulatory compliance.', false, 7.5);
  y += 4;

  // 8. What is confirmed, assumed and missing
  heading('8. CONFIRMED, ASSUMED AND MISSING');
  const count = (k: 'user' | 'template' | 'estimate') => workflow.assumptions.filter((a) => (a.provenance ?? 'template') === k).length;
  const unchecked = workflow.tasks.filter((t) => t.needsReview).length;
  const openPre = plan.reduce((n, c) => n + c.prerequisites.filter((p) => !p.met).length, 0);
  const unrecorded = workflow.pilotMetrics.filter((m) => m.recorded === false).length;
  lines(`Facts you provided: ${count('user')} assumptions. Template assumptions: ${count('template')}. Product estimates: ${count('estimate')}.`);
  lines(`Steps not yet confirmed by you: ${unchecked}. Steps marked "needs assessment": ${workflow.tasks.filter((t) => t.recommendation === 'NEEDS_ASSESSMENT').length}.`);
  lines(`Prerequisites still missing: ${openPre}. Pilot measures with no result yet: ${unrecorded}.`);
  const findings = checkAssumptions(workflow.pilotMetrics, workflow.assumptions).filter((f) => f.verdict === 'wrong');
  if (findings.length) lines(`Assumptions the pilot showed to be wrong: ${findings.map((f) => f.label).join('; ')}.`);
  if (workflow.finalDecision.evidenceGaps.length) lines(`Evidence gaps: ${workflow.finalDecision.evidenceGaps.join('; ')}`);
  y += 4;

  // Trigger Save
  doc.save(`${workflow.identity.id}_executive_report.pdf`);
}
