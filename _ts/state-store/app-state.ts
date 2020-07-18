import { GitHubAccount } from "../github/github-account";
import { DEFAULT_CACHE_DURATION, DEFAULT_DELAY } from "../util";

export interface ReadonlyAppState {
  readonly accounts: readonly GitHubAccount[];
  readonly hiddenRepos: ReadonlySet<string>;
  readonly showForks: boolean;
  readonly showArchived: boolean;
  readonly delay: number;
  readonly cacheDuration: number;
}

export class AppState implements ReadonlyAppState {
  /**
   * The GitHub accounts shown on the dashboard
   */
  public accounts: GitHubAccount[];

  /**
   * Specific repos to hide
   */
  public hiddenRepos: Set<string>;

  /**
   * Whether to show forked repos on the dashboard
   */
  public showForks: boolean;

  /**
   * Whether to show archived repos on the dashboard
   */
  public showArchived: boolean;

  /**
   * Delays AJAX responses by a number of milliseconds.
   * This is mostly just used for local development, to simulate network latency.
   */
  public delay: number;

  /**
   * Re-use cached data for the specified number of milliseconds, before re-fretching it.
   * This is mostly just used for local development, to avoid hitting API rate limits.
   */
  public cacheDuration: number;

  /**
   * Creates a new AppState instance, optionally cloning an existing state
   */
  public constructor(props: Partial<ReadonlyAppState> = {}) {
    this.accounts = props.accounts ? props.accounts.slice() : [];
    this.hiddenRepos = props.hiddenRepos ? new Set(props.hiddenRepos) : new Set();
    this.showForks = Boolean(props.showForks);
    this.showArchived = Boolean(props.showArchived);
    this.delay = props.delay || DEFAULT_DELAY;
    this.cacheDuration = props.cacheDuration || DEFAULT_CACHE_DURATION;
  }
}
