import { ApiClient } from "../api-client/api-client";
import { ApiError } from "../api-client/api-error";
import { ApiResponse } from "../api-client/api-response";
import { GitHubAccount, isGitHubAccountPOJO } from "./github-account";
import { GitHubRepo, isGitHubRepoPOJO } from "./github-repo";

export class GitHub {
  private readonly _client: ApiClient = new ApiClient();

  /**
   * Fetches the specified GitHub account's info, NOT including its repos
   */
  public async fetchAccount(account: GitHubAccount): Promise<ApiResponse<GitHubAccount>> {
    let request = new Request(`https://api.github.com/users/${account.login}`);

    return this._client.fetch(request, (responseBody: unknown) => {
      if (typeof responseBody !== "object") {
        throw new ApiError(request.url, "did not return a JSON object as expected", responseBody);
      }
      else if (Array.isArray(responseBody)) {
        throw new ApiError(request.url, "returned a JSON array, but a JSON object was expected", responseBody);
      }
      else if (!isGitHubAccountPOJO(responseBody)) {
        throw new ApiError(request.url, "returned an invalid GitHub account", responseBody);
      }

      // Convert the response body to a GitHubAccount object
      return new GitHubAccount({
        ...responseBody,
        loading: false,
        loaded: true,
        repos: [],
      });
    });
  }

  /**
   * Fetches the GitHub repos for the specified account, NOT including pull requests
   */
  public async fetchRepos(account: GitHubAccount): Promise<ApiResponse<GitHubRepo[]>> {
    let request = new Request(`https://api.github.com/users/${account.login}/repos`);

    return this._client.fetch(request, (responseBody: unknown) => {
      if (!Array.isArray(responseBody)) {
        throw new ApiError(request.url, "did not return a JSON array as expected", responseBody);
      }

      let repos: GitHubRepo[] = [];

      for (let repo of responseBody) {
        if (isGitHubRepoPOJO(repo)) {
          repos.push(new GitHubRepo({ ...repo, account }));
        }
        else {
          throw new ApiError(request.url, "returned an invalid GitHub repo", repo);
        }
      }

      return repos;
    });
  }

  /**
   * Fetches the number of open pull requests for the specified GitHub repo
   */
  public async fetchPullCount(repo: GitHubRepo): Promise<number> {
    return 0;
  }
}
