import type { TrancheFormData } from '../../pages/loans/tranche.form.dialog';

/**
 * Fixed, not generated: a random amount can land above the line's available limit or below the
 * minimum, which would turn a validation failure into a flaky test.
 */
const DEFAULT_AMOUNT = '1000';

/** The purpose carries a timestamp so the application can be found in the back office afterwards. */
export const trancheApplication = (overrides: Partial<TrancheFormData> = {}): TrancheFormData => ({
  amount: DEFAULT_AMOUNT,
  purpose: `Achitare marfă — test automat E2E ${new Date().toISOString()}`,
  ...overrides,
});
