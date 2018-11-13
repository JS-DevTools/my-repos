import { GitHubRepo } from "./github-repo";

/**
 * A GitHub user or organization account, as returned from the GitHub REST API
 */
export interface GitHubAccountPOJO {
  readonly id: number;
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
  public readonly id: number;
  public login: string;
  public name: string;
  public avatar_url: string;
  public bio: string;
  public html_url: string;

  /**
   * This account's GitHub repos
   */
  public repos: GitHubRepo[];

  /**
   * Indicates whether we're currently fetching the account info from GitHub
   */
  public loading: boolean;

  /**
   * If an error occurred while fetching account info, then this is the error message
   */
  public error?: string;

  public constructor(props: Partial<GitHubAccount> = {}) {
    this.id = props.id || Math.random();
    this.login = props.login || "";
    this.name = props.name || "";
    this.avatar_url = props.avatar_url || "";
    this.bio = props.bio || "";
    this.repos = props.repos || [];
    this.loading = Boolean(props.loading);
    this.error = props.error;
    this.html_url = props.html_url || "";
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
