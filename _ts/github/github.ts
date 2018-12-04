import { Dependencies } from "../dependencies";
import { ErrorResponse, fetch, FetchError, FetchResponse, ResponseMapper } from "../fetch";
import { byName } from "../util";
import { GitHubAccount, GitHubAccountKey, isGitHubAccountPOJO } from "./github-account";
import { GitHubRepo, GitHubRepoKey, isGitHubRepoPOJO } from "./github-repo";

// Once this flag is true, we'll stop making requests to the GitHub API,
// since any further requests would also exceed the rate limit
let githubRateLimitExceeded = false;

export class GitHub {
  /**
   * Fetches the specified GitHub account's info, NOT including its repos
   */
  public async fetchAccount(account: GitHubAccountKey): Promise<Readonly<FetchResponse<GitHubAccount>>> {
    const url = `https://api.github.com/users/${account.login}`;

    return this._gitHubApiRequest(url, (response) => {
      if (typeof response.rawBody !== "object") {
        throw new FetchError(url, "did not return a JSON object as expected", response.rawBody);
      }
      else if (Array.isArray(response.rawBody)) {
        throw new FetchError(url, "returned a JSON array, but a JSON object was expected", response.rawBody);
      }
      else if (!isGitHubAccountPOJO(response.rawBody)) {
        throw new FetchError(url, "returned an invalid GitHub account", response.rawBody);
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
  public async fetchRepos(account: GitHubAccount): Promise<Readonly<FetchResponse<GitHubRepo[]>>> {
    const url = `https://api.github.com/users/${account.login}/repos`;

    return this._gitHubApiRequest(url, (response) => {
      if (!Array.isArray(response.rawBody)) {
        throw new FetchError(url, "did not return a JSON array as expected", response.rawBody);
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
          throw new FetchError(url, "returned an invalid GitHub repo", repo as unknown);
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
  public async fetchPullCount(repo: GitHubRepoKey): Promise<Readonly<FetchResponse<number>>> {
    const url = `https://api.github.com/repos/${repo.full_name}/pulls?state=open&per_page=1`;

    return this._gitHubApiRequest(url, (response) => {
      if (!Array.isArray(response.rawBody)) {
        throw new FetchError(url, "did not return a JSON array as expected", response.rawBody);
      }

      let prCount = 0;

      if (response.headers.link) {
        let match = /&page=(\d+)>; rel="last"/.exec(response.headers.link);
        if (!match) {
          throw new FetchError(url, "returned an invalid Link header");
        }

        prCount = parseInt(match[1], 10);
        if (prCount <= 0) {
          throw new FetchError(url, "returned an invalid PR count", match[1]);
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

  /**
   * Determines whether the given HTTP response is a GitHub Rate Limit Exceeded error.
   */
  public isRateLimitExceeded(response: ErrorResponse): boolean {
    return response.status === 403 && response.headers["x-ratelimit-remaining"] === "0";
  }

  /**
   * Common logic for all GitHub API requests
   */
  private async _gitHubApiRequest<T>(url: string, mapper: ResponseMapper<T>): Promise<Readonly<FetchResponse<T>>> {
    if (githubRateLimitExceeded) {
      // We can't make any more requests to the GitHub API
      return {
        ok: false,
        error: new FetchError("https://api.github.com", `GitHub API rate limit exceeded`),
        status: 403,
        statusText: "Forbidden",
        url: "https://api.github.com",
        headers: {
          "x-ratelimit-remaining": "0"
        },
        rawBody: "",
      };
    }

    // Send the request
    let response = await fetch(url, mapper);

    // If the response is a Rate Limit Exceeded error, then set the flag
    // so we don't send any more requests to the GitHub API
    if (response.error && !githubRateLimitExceeded && this.isRateLimitExceeded(response)) {
      console.warn(`GitHub API rate limit exceeded`);
      githubRateLimitExceeded = true;
    }

    return response;
  }
}
