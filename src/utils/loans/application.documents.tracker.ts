import type { Page, Response } from '@playwright/test';
import type { DocumentMetadata, GetDocumentsMetadata200 } from '../../api/generated/api';
import { Logger } from '../logger';
import { ResponseTracker } from './response.tracker';

export type DocumentsSnapshot = {
  documents: DocumentMetadata[];
  at: number;
};

/**
 * Records every document list the app fetches during a flow.
 *
 * The document sidebar renders nothing but this payload — a step is ticked off when its document
 * comes back with `signed: true`. The app refetches the list only when the workflow status moves
 * into one it treats as document-changing, so "was the list refetched after status X" and "does
 * the sidebar still show the document as unsigned" are the same question.
 */
export class ApplicationDocumentsTracker extends ResponseTracker {
  private readonly fetches: DocumentsSnapshot[] = [];

  private constructor(page: Page) {
    super(page);
  }

  static attach(page: Page): ApplicationDocumentsTracker {
    return new ApplicationDocumentsTracker(page);
  }

  /** Anchored, so the per-document `/documents/{id}` content calls stay out of the timeline. */
  protected get url(): RegExp {
    return /\/loans\/applications\/[^/]+\/documents$/;
  }

  get last(): DocumentsSnapshot | undefined {
    return this.fetches.at(-1);
  }

  /** The first list requested at or after the given moment — the refresh a status change owes us. */
  fetchedSince(timestamp: number): DocumentsSnapshot | undefined {
    return this.fetches.find(({ at }) => at >= timestamp);
  }

  protected async record(response: Response, at: number): Promise<void> {
    const { documents = [] } = (await response.json()) as GetDocumentsMetadata200;
    const listed = documents.map(
      ({ documentType, signed }) => `${documentType}=${signed ? 'signed' : 'unsigned'}`
    );

    Logger.info(`Documents refreshed: ${listed.join(', ') || 'none'}`);
    this.fetches.push({ documents, at });
  }
}
