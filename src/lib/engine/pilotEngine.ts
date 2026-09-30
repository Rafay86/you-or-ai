import { PilotMetric, MetricStatus } from '@/types';

export interface EvaluatedMetric extends PilotMetric {
  variancePct: number;
  direction: 'reduction' | 'increase';
  summaryText: string;
}

/**
 * Calculates metric variance and evaluates target achievement status.
 */
export function evaluatePilotMetric(metric: PilotMetric): EvaluatedMetric {
  const { baseline, targetMin, targetMax, actual } = metric;

  // Determine direction: if targetMax < baseline, metric is expected to decrease (e.g. time, cost, errors)
  const isReduction = targetMax <= baseline;
  
  let variance = 0;
  let variancePct = 0;

  if (isReduction) {
    variance = baseline - actual;
    variancePct = baseline > 0 ? Math.round((variance / baseline) * 100) : 0;
  } else {
    variance = actual - baseline;
    variancePct = baseline > 0 ? Math.round((variance / baseline) * 100) : 0;
  }

  let status: MetricStatus = 'Insufficient evidence';

  if (actual === 0 && baseline === 0) {
    status = 'Insufficient evidence';
  } else if (isReduction) {
    // Lower is better (e.g. baseline 42h, target 28-32h, actual 31h)
    if (actual <= targetMax) {
      status = 'Achieved';
    } else if (actual < baseline) {
      status = 'Partially achieved';
    } else {
      status = 'Not achieved';
    }
  } else {
    // Higher is better (e.g. baseline 70%, target 85-95%, actual 88%)
    if (actual >= targetMin) {
      status = 'Achieved';
    } else if (actual > baseline) {
      status = 'Partially achieved';
    } else {
      status = 'Not achieved';
    }
  }

  let summaryText = '';
  if (status === 'Achieved') {
    summaryText = `Target range achieved (${actual} ${metric.unit} vs target ${targetMin}–${targetMax} ${metric.unit})`;
  } else if (status === 'Partially achieved') {
    summaryText = `Improvement demonstrated, but target range not fully met (${actual} ${metric.unit})`;
  } else if (status === 'Not achieved') {
    summaryText = `Metric did not achieve expected threshold (${actual} ${metric.unit})`;
  } else {
    summaryText = `Insufficient evidence recorded`;
  }

  return {
    ...metric,
    variance,
    variancePct,
    status,
    direction: isReduction ? 'reduction' : 'increase',
    summaryText,
  };
}

/**
 * Evaluates all pilot metrics for a workflow.
 */
export function evaluateAllPilotMetrics(metrics: PilotMetric[]): EvaluatedMetric[] {
  return metrics.map(evaluatePilotMetric);
}
