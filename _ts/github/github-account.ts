import { GitHubRepo } from "./github-repo";

/**
 * The key fields that uniquely identify a GitHub account
 */
export interface GitHubAccountKey {
  login: string;
}

/**
 * A GitHub user or organization account, as returned from the GitHub REST API
 */
export interface GitHubAccountPOJO {
  login: string;
  name: string;
  bio: string;
  avatar_url: string;
  html_url: string;
}

/**
 * Additional GitHub account properties that we need for this app
 */
export class GitHubAccount implements GitHubAccountPOJO {
  public login = "";
  public name = "";
  public bio = "";
  public avatar_url = "";
  public html_url = "";

  /**
   * This account's GitHub repos
   */
  public repos: GitHubRepo[] = [];

  /**
   * Indicates whether we're currently fetching the account info from GitHub
   */
  public loading = false;

  /**
   * The date/time that the repo's data was last fetched from GitHub
   */
  public last_refresh = new Date(0);

  /**
   * If an error occurred while fetching account info, then this is the error message
   */
  public error?: string;

  public constructor(props: Partial<GitHubAccount> = {}) {
    Object.assign(this, props);
  }
}

export function isGitHubAccountPOJO(account: any): account is GitHubAccountPOJO {
  return account &&
    typeof account === "object" &&
    typeof account.login === "string" &&
    account.login.length > 0 &&
    typeof account.name === "string" &&
    account.name.length > 0 &&
    typeof account.avatar_url === "string" &&
    typeof account.html_url === "string";
}
