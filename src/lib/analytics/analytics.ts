/**
 * Anonymous usage analytics (Firebase / GA4). Off unless configured, and off if the user opts out.
 *
 * Privacy rules, enforced in code:
 *  - only events from ALLOWED_EVENTS are sent;
 *  - only ALLOWED_PARAMS are attached, and only short strings or numbers, so workflow text, task names,
 *    file names and document contents can never leave the browser through this module.
 */

export const ALLOWED_EVENTS = [
  'screen_view_studio',
  'project_created',
  'upload_read',
  'report_exported',
  'scenario_chosen',
  'decision_recorded',
] as const;
export type AnalyticsEvent = (typeof ALLOWED_EVENTS)[number];

/** Parameter names and the exact values each may take. Free text is never allowed. */
const ALLOWED_PARAMS: Record<string, readonly (string | number | boolean)[] | 'number'> = {
  view: ['start', 'current-state', 'tasks', 'future-state', 'scenario-comparison', 'people', 'business-case', 'roadmap', 'pilot', 'decision', 'executive', 'governance', 'discover', 'projects', 'templates', 'settings', 'overview', 'guide'],
  mode: ['quick-start', 'upload', 'library', 'example'],
  file_type: ['pdf', 'docx', 'txt', 'md', 'other'],
  ok: [true, false],
  scenario: ['scenario-a', 'scenario-b'],
  outcome: ['EXPAND', 'IMPROVE_AND_RETEST', 'STOP'],
  steps: 'number',
};

const OPT_OUT_KEY = 'you_ai_studio_analytics_off';

export function sanitizeParams(params: Record<string, unknown> = {}): Record<string, string | number | boolean> {
  const out: Record<string, string | number | boolean> = {};
  for (const [k, v] of Object.entries(params)) {
    const rule = ALLOWED_PARAMS[k];
    if (!rule) continue;
    if (rule === 'number') {
      if (typeof v === 'number' && Number.isFinite(v) && v >= 0 && v <= 1000) out[k] = Math.round(v);
    } else if ((rule as readonly unknown[]).includes(v)) {
      out[k] = v as string | number | boolean;
    }
  }
  return out;
}

export interface FirebaseWebConfig {
  apiKey?: string;
  authDomain?: string;
  projectId?: string;
  storageBucket?: string;
  messagingSenderId?: string;
  appId?: string;
  measurementId?: string;
}

/** Read from build-time env. NEXT_PUBLIC_ variables are inlined by Next. */
export function readConfig(): FirebaseWebConfig {
  return {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
    measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
  };
}

export const isConfigured = (c: FirebaseWebConfig = readConfig()) => !!(c.apiKey && c.projectId && c.appId && c.measurementId);

export function isOptedOut(): boolean {
  if (typeof window === 'undefined') return true;
  try {
    return localStorage.getItem(OPT_OUT_KEY) === '1';
  } catch {
    return false;
  }
}

export function setOptOut(off: boolean): void {
  try {
    if (off) localStorage.setItem(OPT_OUT_KEY, '1');
    else localStorage.removeItem(OPT_OUT_KEY);
  } catch {
    /* storage unavailable: nothing to persist */
  }
  // Tell GA to stop or resume collection in this session too.
  if (isConfigured()) {
    (window as any)[`ga-disable-${readConfig().measurementId}`] = off;
  }
}

let ready: Promise<((name: string, params: Record<string, unknown>) => void) | null> | null = null;

async function load() {
  const cfg = readConfig();
  if (typeof window === 'undefined' || !isConfigured(cfg)) return null;
  try {
    const [{ initializeApp, getApps, getApp }, { getAnalytics, isSupported, logEvent }] = await Promise.all([import('firebase/app'), import('firebase/analytics')]);
    if (!(await isSupported())) return null;
    const app = getApps().length ? getApp() : initializeApp(cfg as Record<string, string>);
    const analytics = getAnalytics(app);
    return (name: string, params: Record<string, unknown>) => logEvent(analytics, name, params);
  } catch (e) {
    console.warn('Analytics unavailable:', e instanceof Error ? e.name : 'error');
    return null;
  }
}

/** Fire and forget. Never throws and never blocks the UI. */
export function track(event: AnalyticsEvent, params?: Record<string, unknown>): void {
  if (!(ALLOWED_EVENTS as readonly string[]).includes(event)) return;
  if (typeof window === 'undefined' || isOptedOut() || !isConfigured()) return;
  ready = ready ?? load();
  ready.then((send) => send?.(event, sanitizeParams(params))).catch(() => undefined);
}

export const fileTypeOf = (name: string): 'pdf' | 'docx' | 'txt' | 'md' | 'other' => {
  const ext = name.slice(name.lastIndexOf('.') + 1).toLowerCase();
  return ext === 'pdf' || ext === 'docx' || ext === 'txt' || ext === 'md' ? ext : 'other';
};
