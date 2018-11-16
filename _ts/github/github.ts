import { ApiClient } from "../api-client";
import { GitHubAccount, isGitHubAccountPOJO } from "./github-account";
import { GitHubRepo, isArrayOfGitHubRepoPOJO } from "./github-repo";

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
        loaded: true,
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
        repos.push(new GitHubRepo({ ...repoPOJO, account }));
      }

      return repos;
    }
    else {
      throw this._client.createError("Invalid GitHub repo:", repoPOJOs);
    }
  }
}
