import { ApiClient } from "../api-client/api-client";
import { ApiError } from "../api-client/api-error";
import { ApiResponse } from "../api-client/api-response";
import { Dependencies } from "../package-registry/dependencies";
import { byName } from "../util";
import { GitHubAccount, isGitHubAccountPOJO } from "./github-account";
import { GitHubRepo, isGitHubRepoPOJO } from "./github-repo";

export class GitHub {
  private readonly _client: ApiClient = new ApiClient();

  /**
   * Fetches the specified GitHub account's info, NOT including its repos
   */
  public async fetchAccount(account: GitHubAccount): Promise<Readonly<ApiResponse<GitHubAccount>>> {
    let request = new Request(`https://api.github.com/users/${account.login}`);

    return this._client.fetch(request, (response) => {
      // tslint:disable-next-line:strict-type-predicates
      if (typeof response.rawBody !== "object") {
        throw new ApiError(request.url, "did not return a JSON object as expected", response.rawBody);
      }
      else if (Array.isArray(response.rawBody)) {
        throw new ApiError(request.url, "returned a JSON array, but a JSON object was expected", response.rawBody);
      }
      else if (!isGitHubAccountPOJO(response.rawBody)) {
        throw new ApiError(request.url, "returned an invalid GitHub account", response.rawBody);
      }

      // Convert the response body to a GitHubAccount object
      let body = new GitHubAccount({
        ...response.rawBody,
        repos: [],
        loading: false,
        last_refresh: new Date(),
      });

      return {
        ...response,
        ok: true,
        error: undefined,
        body,
      };
    });
  }

  /**
   * Fetches the GitHub repos for the specified account, NOT including pull requests
   */
  public async fetchRepos(account: GitHubAccount): Promise<Readonly<ApiResponse<GitHubRepo[]>>> {
    let request = new Request(`https://api.github.com/users/${account.login}/repos`);

    return this._client.fetch(request, (response) => {
      if (!Array.isArray(response.rawBody)) {
        throw new ApiError(request.url, "did not return a JSON array as expected", response.rawBody);
      }

      let repos: GitHubRepo[] = [];

      for (let repo of response.rawBody) {
        if (isGitHubRepoPOJO(repo)) {
          // Merge additional data from the old repo state
          let oldRepoState = account.repos.find(byName(repo.full_name));
          let { last_pull_count_refresh, dependencies } =
            oldRepoState ? oldRepoState : {
              last_pull_count_refresh: new Date(0),
              dependencies: new Dependencies(),
            };

          repos.push(new GitHubRepo({
            ...repo,
            login: account.login,
            last_refresh: new Date(),
            last_pull_count_refresh,
            dependencies,
          }));
        }
        else {
          throw new ApiError(request.url, "returned an invalid GitHub repo", repo as unknown);
        }
      }

      return {
        ...response,
        ok: true,
        error: undefined,
        body: repos,
      };
    });
  }

  /**
   * Fetches the number of open pull requests for the specified GitHub repo.
   * This is necessary because the `open_issues_count` field on the GitHubRepo object
   * actually includes open issues AND open PRs.
   */
  public async fetchPullCount(repo: GitHubRepo): Promise<Readonly<ApiResponse<number>>> {
    let request = new Request(`https://api.github.com/repos/${repo.full_name}/pulls?state=open&per_page=1`);

    return this._client.fetch(request, (response) => {
      if (!Array.isArray(response.rawBody)) {
        throw new ApiError(request.url, "did not return a JSON array as expected", response.rawBody);
      }

      let prCount = 0;

      if (response.headers.link) {
        let match = /&page=(\d+)>; rel="last"/.exec(response.headers.link);
        if (!match) {
          throw new ApiError(request.url, "returned an invalid Link header");
        }

        prCount = parseInt(match[1], 10);
        if (prCount <= 0) {
          throw new ApiError(request.url, "returned an invalid PR count", match[1]);
        }
      }

      return {
        ...response,
        ok: true,
        error: undefined,
        body: prCount,
      };
    });
  }
}
