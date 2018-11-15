import { GitHubRepo } from "./github-repo";

/**
 * A GitHub user or organization account, as returned from the GitHub REST API
 */
export interface GitHubAccountPOJO {
  login: string;
  name: string;
  avatar_url: string;
  bio: string;
  html_url: string;
}

/**
 * Additional GitHub account properties that we need for this app
 */
export class GitHubAccount implements GitHubAccountPOJO {
  public login = "";
  public name = "";
  public avatar_url = "";
  public bio = "";
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
  return typeof account === "object" &&
    "login" in account && typeof account.login === "string" &&
    "name" in account && typeof account.name === "string" &&
    "bio" in account && typeof account.bio === "string" &&
    "avatar_url" in account && typeof account.avatar_url === "string";
}
