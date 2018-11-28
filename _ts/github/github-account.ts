import { GitHubRepo } from "./github-repo";

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
  public loading: boolean = false;

  /**
   * Indicates whether we've fetched the account info from GitHub
   * - regardless of whether it succeeded or failed
   */
  public loaded: boolean = false;

  /**
   * If an error occurred while fetching account info, then this is the error message
   */
  public error?: string;

  public constructor(props: Partial<GitHubAccount> = {}) {
    Object.assign(this, props);
  }
}

// tslint:disable:no-any no-unsafe-any
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
