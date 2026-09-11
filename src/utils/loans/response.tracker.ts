import type { Page, Response } from '@playwright/test';

/**
 * Shared plumbing for the passive response trackers of the loan flows.
 *
 * A tracker listens to responses and never blocks, so the waits in a spec stay driven by what the
 * user can see. What it collects is a timeline the spec can assert on afterwards — the only way to
 * check something that happens inside a minutes-long wait without racing it.
 */
export abstract class ResponseTracker {
  private readonly listener = (response: Response): void => {
    void this.consume(response);
  };

  protected constructor(protected readonly page: Page) {
    page.on('response', this.listener);
  }

  detach(): void {
    this.page.off('response', this.listener);
  }

  /** Matched against the URL pathname, so query strings never break the anchor. */
  protected abstract get url(): RegExp;

  /** `at` is when the request went out — see `issuedAt`. */
  protected abstract record(response: Response, at: number): Promise<void>;

  /**
   * When the request was issued, not when it came back. The app reacts to a status by firing a
   * request, so a call that was already in flight and merely lands after that status must not be
   * mistaken for the reaction to it.
   */
  private issuedAt(response: Response): number {
    const { startTime } = response.request().timing();

    return startTime > 0 ? startTime : Date.now();
  }

  private async consume(response: Response): Promise<void> {
    if (!response.ok() || !this.url.test(new URL(response.url()).pathname)) {
      return;
    }

    const at = this.issuedAt(response);

    try {
      await this.record(response, at);
    } catch {
      // The body is gone on aborted responses — nothing to record, and nothing worth failing over.
    }
  }
}
