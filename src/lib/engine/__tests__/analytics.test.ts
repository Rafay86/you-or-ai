import { describe, it, expect } from 'vitest';
import { sanitizeParams, isConfigured, fileTypeOf, track } from '../../analytics/analytics';

describe('analytics privacy', () => {
  it('drops free text, unknown keys and anything that could identify a workflow', () => {
    const out = sanitizeParams({
      view: 'tasks',
      workflow_name: 'Customer onboarding at Acme Bank',
      task: 'Screen against sanctions lists',
      file_name: 'Q3 procedure.pdf',
      mode: 'a very long free text answer that must not be sent',
      ok: true,
      steps: 6,
    });
    expect(out).toEqual({ view: 'tasks', ok: true, steps: 6 });
  });
  it('rejects out-of-range numbers and non-allowed values', () => {
    expect(sanitizeParams({ steps: 5000 })).toEqual({});
    expect(sanitizeParams({ steps: NaN })).toEqual({});
    expect(sanitizeParams({ outcome: 'MAYBE' })).toEqual({});
    expect(sanitizeParams({ view: '<script>' })).toEqual({});
  });
  it('is off when config is missing', () => {
    expect(isConfigured({})).toBe(false);
    expect(isConfigured({ apiKey: 'k', projectId: 'p', appId: 'a' })).toBe(false);
    expect(isConfigured({ apiKey: 'k', projectId: 'p', appId: 'a', measurementId: 'G-1' })).toBe(true);
  });
  it('reduces a file name to its type only', () => {
    expect(fileTypeOf('Acme confidential.PDF')).toBe('pdf');
    expect(fileTypeOf('notes.exe')).toBe('other');
    expect(fileTypeOf('noextension')).toBe('other');
  });
  it('does nothing outside a browser and never throws', () => {
    expect(() => track('project_created', { mode: 'library' })).not.toThrow();
  });
});
