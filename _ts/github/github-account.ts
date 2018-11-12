import { GitHubRepo } from "./github-repo";

/**
 * Additional GitHub account properties that we need for this app
 */
export class GitHubAccount {
  public readonly id: number;
  public login: string;
  public name: string;
  public avatar_url: string;
  public bio: string;

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
  }
}
