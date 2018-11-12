import { ApiClient } from "../api-client";
import { GitHubAccount } from "./github-account";
import { GitHubRepo } from "./github-repo";

export class GitHub {
  private readonly _client: ApiClient = new ApiClient();

  /**
   * Fetches the specified GitHub account's info, NOT including its repos
   */
  public async fetchAccount(account: GitHubAccount): Promise<GitHubAccount> {
    let accountPOJO = await this._client.fetchObject(`https://api.github.com/users/${account.login}`);

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
  public async fetchRepos(account: GitHubAccount): Promise<GitHubRepo[]> {
    let repoPOJOs = await this._client.fetchArray(`https://api.github.com/users/${account.login}/repos`);

    if (isArrayOfGitHubRepoPOJO(repoPOJOs)) {
      let repos: GitHubRepo[] = [];

      for (let repoPOJO of repoPOJOs) {
        repos.push(new GitHubRepo({
          ...repoPOJO,
          hidden: false,
        }));
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

/**
 * A GitHub user or organization account, as returned from the GitHub REST API
 */
interface GitHubAccountPOJO {
  readonly id: number;
  login: string;
  name: string;
  avatar_url: string;
  bio: string;
}

/**
 * A GitHub repository, as returned from the GitHub REST API
 */
interface GitHubRepoPOJO {
  readonly id: number;
  name: string;
  full_name: string;
  description: string;
  fork: boolean;
  stargazers_count: number;
}

// tslint:disable:no-any no-unsafe-any
function isGitHubAccountPOJO(account: any): account is GitHubAccountPOJO {
  return typeof account === "object" &&
    "login" in account && typeof account.login === "string" &&
    "name" in account && typeof account.name === "string" &&
    "bio" in account && typeof account.bio === "string" &&
    "avatar_url" in account && typeof account.avatar_url === "string";
}

function isArrayOfGitHubRepoPOJO(repos: any[]): repos is GitHubRepoPOJO[] {
  return repos.length > 0 &&
    typeof repos[0] === "object" &&
    typeof repos[0].name === "string";
}
