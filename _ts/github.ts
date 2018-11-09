import { ApiClient } from "./api-client";

/**
 * A GitHub user or organization account, as returned from the GitHub REST API
 */
export interface GitHubAccountPOJO {
  readonly id: number;
  login: string;
  name: string;
  avatar_url: string;
  bio: string;
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
    this.loading = props.loading === undefined ? true : props.loading;
    this.error = props.error;
  }
}

/**
 * A GitHub repository, as returned from the GitHub REST API
 */
export interface GitHubRepoPOJO {
  readonly id: number;
  name: string;
  full_name: string;
  description: string;
  fork: boolean;
  stargazers_count: boolean;
}

/**
 * Additional GitHub repo properties that we need for this app
 */
export interface GitHubRepo extends GitHubRepoPOJO {
  /**
   * Is this repo hidden from the dashboard?
   */
  hidden: boolean;
}

export class GitHub {
  private readonly _client: ApiClient = new ApiClient();

  /**
   * Fetches the specified GitHub account's info, NOT including its repos
   */
  public async fetchAccount(name: string): Promise<GitHubAccount> {
    let accountPOJO = await this._client.fetchObject(`https://api.github.com/users/${name}`);

    if (isGitHubAccountPOJO(accountPOJO)) {
      return new GitHubAccount({
        ...accountPOJO,
        loading: false,
        repos: [],
      });
    }
    else {
      throw this._client.createError("Invalid GitHub account:", accountPOJO);
    }
  }

  /**
   * Fetches the GitHub repos for the specified account
   */
  public async fetchRepos(accountName: string): Promise<GitHubRepo[]> {
    let repoPOJOs = await this._client.fetchArray(`https://api.github.com/users/${accountName}/repos`);

    if (isArrayOfGitHubRepoPOJO(repoPOJOs)) {
      let repos: GitHubRepo[] = [];

      for (let repoPOJO of repoPOJOs) {
        repos.push({
          ...repoPOJO,
          hidden: false,
        } as GitHubRepo);
      }

      return repos;
    }
    else {
      throw this._client.createError("Invalid GitHub repo:", repoPOJOs);
    }
  }
}

/**
 * Singleton instance of the GitHub API client
 */
export const github = new GitHub();


// tslint:disable-next-line:no-any
function isGitHubAccountPOJO(account: any): account is GitHubAccountPOJO {
  return typeof account === "object" &&
    "login" in account && typeof account.login === "string" &&
    "name" in account && typeof account.name === "string" &&
    "bio" in account && typeof account.bio === "string" &&
    "avatar_url" in account && typeof account.avatar_url === "string";
}

// tslint:disable-next-line:no-any
function isArrayOfGitHubRepoPOJO(repos: any[]): repos is GitHubRepoPOJO[] {
  return repos.length > 0 &&
    typeof repos[0] === "object" &&
    typeof repos[0].name === "string";
}
