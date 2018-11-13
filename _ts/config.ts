import { GitHubAccount } from "./github/github-account";
import { GitHubRepo } from "./github/github-repo";
import { LOCAL_DEV_MODE } from "./util";

export class Config {
  /**
   * The accounts to show on the dashboard
   */
  public accounts: Set<string>;

  /**
   * Specific repos to hide
   */
  public hiddenRepos: Set<string>;

  /**
   * Whether to show forked repos on the dashboard
   */
  public showForks: boolean;

  /**
   * Delays AJAX responses by a number of milliseconds.
   * This is mostly just used for local development, to simulate network latency.
   */
  public delay: number;

  /**
   * The default delay, based on whether we're in "local dev" mode
   */
  public readonly defaultDelay = LOCAL_DEV_MODE ? 1000 : 0;

  public constructor(props: Partial<Config> = {}) {
    this.accounts = props.accounts || new Set();
    this.hiddenRepos = props.accounts || new Set();
    this.showForks = props.showForks || false;
    this.delay = props.delay || this.defaultDelay;
  }

  /**
   * Adds the specified GitHub account to the `accounts` list
   */
  public addAccount(account: GitHubAccount) {
    this.accounts.add(account.login);
  }

  /**
   * Removes the specified GitHub account from the `accounts` list
   */
  public removeAccount(account: GitHubAccount) {
    this.accounts.delete(account.login);
  }

  /**
   * Adds or removes the specified GitHub repo from the `hide` list
   */
  public toggleRepo(account: GitHubAccount, repo: GitHubRepo, hidden: boolean) {
    if (hidden) {
      this.hiddenRepos.add(repo.full_name);
    }
    else {
      this.hiddenRepos.delete(repo.full_name);
    }
  }

  /**
   * Returns only the GitHub repos that should be shown, based on the current config
   */
  public filterRepos(repos: GitHubRepo[]): GitHubRepo[] {
    return repos.filter((repo) => !repo.isHidden(this));
  }
}

/**
 * The singleton instance of the Config class.
 */
export const config = new Config();
