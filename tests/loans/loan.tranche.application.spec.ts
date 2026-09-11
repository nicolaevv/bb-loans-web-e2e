import { expect, test } from '../../src/fixtures/page.fixture';
import type { ApplicationOutcome } from '../../src/pages/loans/application.result.dialog';
import { trancheApplication } from '../../src/data/loans/tranche.data';
import { ApplicationStatusTracker } from '../../src/utils/loans/application.status.tracker';
import { ApplicationDocumentsTracker } from '../../src/utils/loans/application.documents.tracker';
import { ENV } from '../../src/config/env.config';
import { Logger } from '../../src/utils/logger';

const PROCESSING_TIMEOUT_MS = 20_000;

/** One status poll is 3 s; the refetch it triggers is a plain GET, so this is generous. */
const DOCUMENTS_REFRESH_TIMEOUT_MS = 30_000;

/** Either ending is a pass: the test environment decides whether a tranche disburses straight away. */
const ACCEPTED_OUTCOMES = ['DISBURSED', 'BACK_OFFICE_PROCESSING'] as const satisfies readonly ApplicationOutcome[];

/** Guards against looping forever if the flow keeps asking for signatures. */
const MAX_DOCUMENTS = 5;

test.describe('Tranche disbursement', { tag: '@msign' }, () => {
  test.skip(ENV.flags.isCi, 'Requires a physical eSignature token and a local MoldSign client.');

  test.beforeEach(async ({ cleanApplications }) => {
    await cleanApplications('TRANCHE');
  });

  test('requests a tranche and signs it with eSemnătura', async ({
    page,
    loansPage,
    creditLineDialog,
    trancheFormDialog,
    processingDialog,
    resultDialog,
  }) => {
    const tracker = ApplicationStatusTracker.attach(page);
    const documents = ApplicationDocumentsTracker.attach(page);
    const data = trancheApplication();

    try {
      await test.step('Open the loans module for the tranche company', async () => {
        await loansPage.openForCompany(ENV.companies.get('TRANCHE'));
      });

      await test.step('Start a new tranche', async () => {
        await loansPage.startNewTranche();
      });

      await test.step('Pick the first available credit line', async () => {
        await creditLineDialog.waitForLines();
        await expect(creditLineDialog.emptyState).toBeHidden();

        await creditLineDialog.selectFirstLine();
        await expect(creditLineDialog.busyAlert).toBeHidden();
      });

      await test.step('Fill in and submit the tranche form', async () => {
        await trancheFormDialog.waitForForm();
        await expect(trancheFormDialog.currencySelect.value).not.toBeEmpty();

        const applicationId = await trancheFormDialog.apply(data);
        Logger.info(`Created tranche application ${applicationId}`);

        await expect(trancheFormDialog.errorToast).toBeHidden();
      });

      // The document sidebar is not asserted here: while the application is still in the
      // PREPARING_* statuses the screen is a full-width loader with no sidebar at all.
      await test.step('The flow switches to processing', async () => {
        await expect(trancheFormDialog.title).toBeHidden({ timeout: PROCESSING_TIMEOUT_MS });
        await expect(processingDialog.processingLoader).toBeVisible({
          timeout: PROCESSING_TIMEOUT_MS,
        });
      });

      await test.step('Sign every requested document', async () => {
        let signed = 0;

        while ((await processingDialog.waitForNextSignature()) === 'sign-required') {
          if (signed >= MAX_DOCUMENTS) {
            throw new Error(`The flow asked for more than ${MAX_DOCUMENTS} signatures — aborting.`);
          }

          Logger.info(`Signing document #${signed + 1}`);
          await processingDialog.signWithESignature();
          signed++;
        }

        Logger.info(`Signed ${signed} document(s)`);
        expect(signed).toBeGreaterThan(0);
      });

      // Regression guard: the app refetches the document list only on the statuses its flow widget
      // lists as document-changing. PROCESSING_DISBURSEMENT was missing from that list, so once the
      // last signature moved the application off DOCS_PENDING_CUSTOMER_SIGNING nothing refreshed the
      // list again and the sidebar kept showing the document it had just signed as unsigned.
      await test.step('The document list refreshes once the tranche moves to disbursement', async () => {
        const disbursementAt = tracker.changedAt('PROCESSING_DISBURSEMENT');

        // The test environment decides whether a tranche disburses at all; on the back-office path
        // the status never shows up and there is nothing to check.
        if (disbursementAt === undefined) {
          const skipped = `The application never reached PROCESSING_DISBURSEMENT; status chain: ${tracker.history.join(' → ')}`;

          Logger.info(skipped);
          test.info().annotations.push({ type: 'not-applicable', description: skipped });

          return;
        }

        await expect
          .poll(() => documents.fetchedSince(disbursementAt), {
            timeout: DOCUMENTS_REFRESH_TIMEOUT_MS,
            message: 'The app never refetched the document list after PROCESSING_DISBURSEMENT',
          })
          .toBeDefined();

        const refreshed = documents.fetchedSince(disbursementAt);

        expect(refreshed?.documents, 'The refreshed list came back empty').not.toHaveLength(0);
        expect(
          refreshed?.documents.every((document) => document.signed),
          `The refreshed list still reports unsigned documents: ${JSON.stringify(refreshed?.documents)}`
        ).toBe(true);

        await expect(
          processingDialog.signedMark(),
          'The sidebar does not mark the tranche document as signed'
        ).toBeVisible();
      });

      await test.step('Accept the final outcome', async () => {
        const outcome = await resultDialog.waitForOutcome();

        Logger.info(
          `Tranche flow finished with "${outcome}"; status chain: ${tracker.history.join(' → ')}`
        );
        test.info().annotations.push({ type: 'outcome', description: outcome });

        expect(ACCEPTED_OUTCOMES).toContain(outcome);
        await resultDialog.close();
      });
    } finally {
      tracker.detach();
      documents.detach();
    }
  });
});
