import { GitHubAccount } from "../github/github-account";
import { LOCAL_DEV_MODE } from "../util";

// The default delay, based on whether we're in "local dev" mode
export const DEFAULT_DELAY = LOCAL_DEV_MODE ? 6000 : 0;

export interface ReadonlyAppState {
  readonly accounts: ReadonlyArray<GitHubAccount>;
  readonly hiddenRepos: ReadonlySet<string>;
  readonly showForks: boolean;
  readonly showArchived: boolean;
  readonly delay: number;
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
   * Creates a new AppState instance, optionally cloning an existing state
   */
  public constructor(props: Partial<ReadonlyAppState> = {}) {
    this.accounts = props.accounts ? props.accounts.slice() : [];
    this.hiddenRepos = props.hiddenRepos ? new Set(props.hiddenRepos) : new Set();
    this.showForks = Boolean(props.showForks);
    this.showArchived = Boolean(props.showArchived);
    this.delay = props.delay || 0;
  }
}