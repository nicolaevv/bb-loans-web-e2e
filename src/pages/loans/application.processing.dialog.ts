import { Locator } from '@playwright/test';
import type { LoanApplicationWorkflowStatus } from '../../api/generated/api';
import { BaseDialog } from '../base.dialog';
import { Step } from '../../utils/step.decorator';

/**
 * Loader captions the processing screen shows per status. Anything not listed here — including
 * PREPARING_DOCUMENTS, PENDING_BANK_AUTHORIZATION and BANK_SIGNING — falls back to
 * "Generăm documente...".
 */
export const PROCESSING_MESSAGES = {
  AWAITING_UNDERWRITING_REVIEW: 'Cererea este în curs de verificare',
  REFRESHING_DATA: 'Verificăm datele cererii',
  VALIDATING_DOCUMENTS: 'Verificarea semnăturii',
  PROCESSING_DISBURSEMENT: 'Procesăm tranșa dumneavoastră.',
} as const satisfies Partial<Record<LoanApplicationWorkflowStatus, string>>;

export type ProcessingMessageStatus = keyof typeof PROCESSING_MESSAGES;

export type SignatureRequest = 'sign-required' | 'completed';

const PDF_TIMEOUT_MS = 60_000;

const DOCUMENT_READY_TIMEOUT_MS = 300_000;

const MSIGN_TIMEOUT_MS = 300_000;

/**
 * Third step of the tranche flow: the bank prepares the documents, the customer signs them.
 *
 * Processing and signing are one page object on purpose — the sign button lives on the processing
 * screen, the method picker opens on top of it and control comes back here afterwards. With more
 * than one document the flow loops between the two, so splitting them would make the spec bounce
 * between two objects inside a while loop.
 */
export class ApplicationProcessingDialog extends BaseDialog {
  static readonly TRANCHE_DOCUMENT = 'Cerere de acordare a tranșei creditului';

  static readonly SIGN_OPTIONS_TITLE = 'Opțiuni de semnare a documentelor';

  static readonly LOADER_SUBTITLE = 'Acest proces poate dura până la câteva minute';

  protected get root(): Locator {
    return this.flowDialog;
  }

  /**
   * Subtitle of the processing loader. The title above it changes with the status, this line does
   * not, which makes it the one stable anchor for "the bank is working on it".
   */
  get processingLoader(): Locator {
    return this.root.getByText(ApplicationProcessingDialog.LOADER_SUBTITLE);
  }

  /** The document sidebar only appears once the backend has returned documents. */
  get documentStepper(): Locator {
    return this.root.getByText(ApplicationProcessingDialog.TRANCHE_DOCUMENT);
  }

  /**
   * The tick the stepper draws inside a document's circle once the list reports it signed. The
   * circle is a bare `<svg>` with no text, aria state or data attribute, and the label is its only
   * sibling — hence stepping up from the label rather than matching a class of the row itself.
   */
  signedMark(document = ApplicationProcessingDialog.TRANCHE_DOCUMENT): Locator {
    return this.root.getByText(document, { exact: true }).locator('xpath=..').locator('svg');
  }

  /** The document is rendered inline by react-pdf into a canvas — no iframe, no download link. */
  get documentPreview(): Locator {
    return this.root.locator('canvas.react-pdf__Page__canvas');
  }

  get documentLoadError(): Locator {
    return this.root.getByText('Nu s-a putut încărca documentul');
  }

  /** Spelled without the diacritic in this namespace — do not "fix" it to "Semnează". */
  get signButton(): Locator {
    return this.root.getByRole('button', { name: 'Semneaza', exact: true });
  }

  get signOptionsDialog(): Locator {
    return this.dialogWith(ApplicationProcessingDialog.SIGN_OPTIONS_TITLE);
  }

  get eSignatureButton(): Locator {
    return this.signOptionsDialog.getByRole('button', { name: 'eSemnătura' });
  }

  get certificateError(): Locator {
    return this.page.getByText('Nu a fost detectat un certificat eSignature valid.');
  }

  get signatureRejectedAlert(): Locator {
    return this.page
      .getByRole('alertdialog')
      .filter({ has: this.page.getByRole('button', { name: 'Reîncearcă' }) });
  }

  /** The final outcome dialogs are the only alert dialogs carrying a "Închide" button. */
  private get finalAlert(): Locator {
    return this.page
      .getByRole('alertdialog')
      .filter({ has: this.page.getByRole('button', { name: 'Închide' }) });
  }

  statusMessage(status: ProcessingMessageStatus): Locator {
    return this.root.getByText(PROCESSING_MESSAGES[status]);
  }

  /**
   * Races the sign button against the final alert. The button is not a reliable exit condition on
   * its own: it also disappears while a signature is being validated, before the next document
   * brings it back.
   */
  @Step('Wait for the next document to sign, or for the flow to finish')
  async waitForNextSignature(timeout = DOCUMENT_READY_TIMEOUT_MS): Promise<SignatureRequest> {
    await this.signButton.or(this.finalAlert).first().waitFor({ state: 'visible', timeout });

    return (await this.signButton.isVisible()) ? 'sign-required' : 'completed';
  }

  /**
   * Signs through mSign. The app talks to the MoldSign client running on the tester's machine;
   * the PIN prompt appears in that desktop window, outside the browser, so this waits on the
   * outcome rather than driving it.
   */
  @Step('Sign the current document with eSemnătura')
  async signWithESignature(timeout = MSIGN_TIMEOUT_MS): Promise<void> {
    await this.documentPreview
      .or(this.documentLoadError)
      .first()
      .waitFor({ state: 'visible', timeout: PDF_TIMEOUT_MS });

    if (await this.documentLoadError.isVisible()) {
      throw new Error('The document preview failed to load — the flow cannot be signed.');
    }

    await this.clickElement(this.signButton);
    await this.signOptionsDialog.waitFor({ state: 'visible' });
    await this.clickElement(this.eSignatureButton);

    // Not a bare waitForResponse: with no certificate the PATCH never happens and we would hang
    // for the full timeout instead of failing with something readable.
    await Promise.race([
      this.signOptionsDialog.waitFor({ state: 'detached', timeout }),
      this.certificateError
        .or(this.signatureRejectedAlert)
        .first()
        .waitFor({ state: 'visible', timeout }),
    ]);

    if (await this.certificateError.isVisible()) {
      throw new Error(
        'mSign found no valid eSignature certificate — is the token plugged in and the MoldSign client running?'
      );
    }

    if (await this.signatureRejectedAlert.isVisible()) {
      throw new Error(`The signature was rejected: ${await this.signatureRejectedAlert.innerText()}`);
    }
  }
}
