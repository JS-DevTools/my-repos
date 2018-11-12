import { GitHubAccount } from "./github/github-account";
import { GitHubRepo } from "./github/github-repo";

export class Config {
  /**
   * The accounts to show on the dashboard
   */
  public accounts: Set<string>;

  /**
   * Specific repos to hide
   */
  public hide: Set<string>;

  /**
   * Whether to show forked repos on the dashboard
   */
  public forks: boolean;

  /**
   * Delays AJAX responses by a number of milliseconds.
   * This is mostly just used for local development, to simulate network latency.
   */
  public delay: number;

  public constructor(props: Partial<Config> = {}) {
    this.accounts = props.accounts || new Set();
    this.hide = props.accounts || new Set();
    this.forks = props.forks || false;
    this.delay = props.delay || 0;
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
      this.hide.add(repo.full_name);
    }
    else {
      this.hide.delete(repo.full_name);
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
