import { stateStore } from ".";
import { ApiErrorResponse } from "../api-client/api-response";
import { github } from "../github";
import { GitHubAccount } from "../github/github-account";
import { GitHubRepo } from "../github/github-repo";
import { packageRegistry } from "../package-registry";

export type UpdateAccount = (account: Partial<GitHubAccount>) => void;
export type UpdateRepo = (repo: Partial<GitHubRepo>) => void;

/**
 * Begins fetching all the data for the specified GitHub account.  This function returns immediately,
 * but the data is fetched asynchronously, and the specified update callbacks are called as data
 * is received.
 */
export function fetchData(account: GitHubAccount, updateAccount: UpdateAccount, updateRepo: UpdateRepo) {
  Promise.resolve()
    .then(() => fetchDataAsync(account, updateAccount, updateRepo))
    .catch((error) => {
      console.error(`Error fetching data for account: ${account.login}.`, error);
      account.error = (error as Error).message;
      updateAccount(account);
    });
}

/**
 * Fetches all the data for the specified GitHub account.  This requires several API calls,
 * and the specified update callback will be called multiple times.
 */
export async function fetchDataAsync(account: GitHubAccount, updateAccount: UpdateAccount, updateRepo: UpdateRepo) {
  let { cacheDuration } = stateStore.state;

  // We fetch data in two phases:
  //
  // Phase 1 - Only fetch data that we don't already have cached.
  //           This ensures that uncached data will be fetched first
  //
  // Phase 2 - Fetch previously-cached data to ensure we have the latest.
  //           We may run into API rate limits at this point,
  //           but that's ok because we can fallback to the cached data.
  let phases = [
    new Date(0),                            // Phase 1 - Fetch everything that's never been cached
    new Date(Date.now() - cacheDuration),   // Phase 2 - Fetch everything that's was cached before Phase 1
  ];

  for (let phase of phases) {
    // Fetch the account and repos simultaneously
    account = await fetchAccountAndRepos(account, updateAccount, phase);

    // Prioritize the repos by how much we need to refresh their data.
    // This helps ensure that we update the most important repos before running into API rate limits
    let sortedRepos = account.repos.sort((a, b) => {
      let aHidden = a.isHidden();
      let bHidden = b.isHidden();

      if (aHidden === bHidden) {
        // Both repos are hidden or visible, so sort by their last refresh time
        return a.last_pull_count_refresh.getTime() - b.last_pull_count_refresh.getTime();
      }
      else if (aHidden) {
        return 1; // b comes first because it's visible
      }
      else if (bHidden) {
        return -1; // a comes first because it's visible
      }
      else {
        return 0; // Both repos have the same priority
      }
    });

    // Fetch data for each repo
    await Promise.all(sortedRepos.map(
      async (repo) => fetchRepoData(repo, updateRepo, phase))
    );
  }
}

/**
 * Fetches the specified GitHub account and its repos
 */
async function fetchAccountAndRepos(account: GitHubAccount, updateAccount: UpdateAccount, cacheExpiry: Date): Promise<GitHubAccount> {
  if (account.last_refresh > cacheExpiry) {
    // No need to fetch this account, since the cached version is new enough
    return account;
  }

  // Fetch the GitHub account and repos at the same time
  let [accountResponse, reposResponse] = await Promise.all([
    github.fetchAccount(account),
    github.fetchRepos(account),
  ]);

  let diff: Partial<GitHubAccount> = { login: account.login };

  if (accountResponse.error) {
    // An error occurred while fetching the account
    errorHandler(`Error fetching data for account: ${account.login}.`, accountResponse);
    diff.error = accountResponse.error.message;
  }
  else {
    // We successfully fetched the GitHub account
    diff = accountResponse.body;

    if (reposResponse.error) {
      // An error occurred while fetching the repos, so add the error message to the account
      errorHandler(`Error fetching repos for account: ${account.login}.`, reposResponse);
      diff.error = reposResponse.error.message;
    }
    else {
      // We successfully fetched the GitHub repos
      diff.repos = reposResponse.body;
    }
  }

  updateAccount(diff);
  return account;
}

/**
 * Fetches the issues, pull requests, and dependencies for the specified repo.
 * The specified update callback is called as each piece of data is received.
 */
async function fetchRepoData(repo: GitHubRepo, updateRepo: UpdateRepo, cacheExpiry: Date) {
  // Fetch the issues, pull requests, and dependencies at the same time,
  // and call the update callback as each piece of data is received
  return Promise.all([
    fetchIssuesAndPullRequests(repo, updateRepo, cacheExpiry),
    fetchDependencies(repo, updateRepo, cacheExpiry),
  ]);
}

/**
 * Fetches the issues and pull requests for the specified repo,
 * and calls the specified update callback.
 */
async function fetchIssuesAndPullRequests(repo: GitHubRepo, updateRepo: UpdateRepo, cacheExpiry: Date) {
  if (repo.last_pull_count_refresh > cacheExpiry) {
    // No need to fetch this repo, since the cached version is new enough
    return;
  }

  if (repo.issues_includes_pulls && repo.open_issues_count === 0) {
    // There are no open issues or PRs.  No need to fetch anything.
    return;
  }

  let prCountResponse = await github.fetchPullCount(repo);

  if (prCountResponse.error) {
    errorHandler(`Error retrieving the number of open PRs for ${repo.full_name}.`, prCountResponse);
  }
  else {
    let open_pulls_count = prCountResponse.body;
    let { open_issues_count, issues_includes_pulls } = repo;

    if (issues_includes_pulls) {
      // The `open_issues_count` field actually includes open issues AND open PRs.
      // So remove the PRs from the count
      open_issues_count = open_issues_count - open_pulls_count;
      issues_includes_pulls = false;
    }

    // Update the app state with the "correct" numbers
    updateRepo({
      login: repo.login,
      full_name: repo.full_name,
      open_issues_count,
      open_pulls_count,
      issues_includes_pulls,
      last_pull_count_refresh: new Date(),
    });
  }
}

/**
 * Fetches the dependencies for the specified repo, and calls the specified update callback.
 */
async function fetchDependencies(repo: GitHubRepo, updateRepo: UpdateRepo, cacheExpiry: Date) {
  if (repo.dependencies.last_refresh > cacheExpiry) {
    // No need to fetch this repo's dependencies, since the cached version is new enough
    return;
  }

  let dependenciesResponse = await packageRegistry.fetchDependencies(repo);

  if (dependenciesResponse.error) {
    errorHandler(`Error fetching dependency stats for ${repo.full_name}.`, dependenciesResponse);
  }
  else {
    let dependencies = dependenciesResponse.body;

    // Update the app state with the repo's dependencies
    updateRepo({
      login: repo.login,
      full_name: repo.full_name,
      dependencies,
    });
  }
}

/**
 * Log errors to the console.  Log API rate limit errors as warnings.
 */
function errorHandler(message: string, response: ApiErrorResponse) {
  if (response.status === 403 && response.headers["x-ratelimit-remaining"] === "0") {
    console.warn(`GitHub API rate limit exceeded. Unable to fetch \n${response.url}`);
  }
  else {
    console.error(message, response.error);
  }
}
