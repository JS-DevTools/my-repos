import { apiClient } from "./api-client";

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
export interface GitHubAccount extends GitHubAccountPOJO {
  /**
   * This account's GitHub repos
   */
  repos: GitHubRepo[];

  /**
   * If an error occurred while fetching account info, then this is the error message
   */
  error?: string;
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

export const github = {
  /**
   * Fetches the specified GitHub account's info, NOT including its repos
   */
  async fetchAccount(name: string): Promise<GitHubAccount> {
    let accountPOJO = await apiClient.fetchObject(`https://api.github.com/users/${name}`);

    if (isGitHubAccountPOJO(accountPOJO)) {
      return {
        ...accountPOJO,
        repos: [],
      };
    }
    else {
      throw apiClient.createError("Invalid GitHub account object:", accountPOJO);
    }
  },

  /**
   * Fetches the GitHub repos for the specified account
   */
  async fetchRepos(accountName: string): Promise<GitHubRepo[]> {
    let repoPOJOs = await apiClient.fetchArray(`https://api.github.com/users/${accountName}/repos`);

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
      throw apiClient.createError("Invalid GitHub repos:", repoPOJOs);
    }
  },
};

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
