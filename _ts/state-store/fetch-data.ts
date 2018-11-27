import { github } from "../github";
import { GitHubAccount } from "../github/github-account";
import { GitHubRepo } from "../github/github-repo";
import { packageRegistry } from "../package-registry";

export type UpdateAccount = (account: GitHubAccount) => void;
export type UpdateRepo = (repo: GitHubRepo) => void;

/**
 * Begins fetching all the data for the specified GitHub account.  This function returns immediately,
 * but the data is fetched asynchronously, and the specified update callbacks are called as data
 * is received.
 */
export function fetchData(account: GitHubAccount, updateAccount: UpdateAccount, updateRepo: UpdateRepo) {
  fetchDataAsync(account, updateAccount, updateRepo)
    .catch((error) => {
      account.error = (error as Error).message;
      updateAccount(account);
    });
}

/**
 * Fetches all the data for the specified GitHub account.  This requires several API calls,
 * and the specified update callback will be called multiple times.
 */
export async function fetchDataAsync(account: GitHubAccount, updateAccount: UpdateAccount, updateRepo: UpdateRepo) {
  // Fetch the account and repos simultaneously
  account = await fetchAccountAndRepos(account);

  // Immediately update the app state with the account & repo info
  updateAccount(account);

  // Fetch additional data for each repo
  await Promise.all(account.repos.map(async (repo) => fetchRepoData(repo, updateRepo)));

  // TODO: Perform a second-pass without cache
}

/**
 * Fetches the specified GitHub account and its repos
 */
async function fetchAccountAndRepos(account: GitHubAccount): Promise<GitHubAccount> {
  // Fetch the GitHub account and repos at the same time
  let [accountResponse, reposResponse] = await Promise.all([
    github.fetchAccount(account),
    github.fetchRepos(account),
  ]);

  if (accountResponse.error) {
    // An error occurred while fetching the account
    account = new GitHubAccount({
      ...account,
      error: accountResponse.error.message,
    });
  }
  else {
    // We successfully fetched the GitHub account
    account = accountResponse.body!;

    if (reposResponse.error) {
      // An error occurred while fetching the repos, so add the error message to the account
      account.error = reposResponse.error.message;
    }
    else {
      // We successfully fetched the GitHub repos
      account.repos = reposResponse.body!;
    }
  }

  return account;
}

/**
 * Fetches the issues, pull requests, and dependencies for the specified repo.
 * The specified update callback is called as each piece of data is received.
 */
async function fetchRepoData(repo: GitHubRepo, updateRepo: UpdateRepo) {
  // Fetch the issues, pull requests, and dependencies at the same time,
  // and call the update callback as each piece of data is received
  await Promise.all([
    fetchIssuesAndPullRequests(repo, updateRepo),
    fetchDependencies(repo, updateRepo),
  ]);
}

/**
 * Fetches the issues and pull requests for the specified repo,
 * and calls the specified update callback.
 */
async function fetchIssuesAndPullRequests(repo: GitHubRepo, updateRepo: UpdateRepo) {
  let prCountResponse = await github.fetchPullCount(repo);

  if (prCountResponse.ok) {
    let open_pulls_count = prCountResponse.body!;
    let { open_issues_count, issues_includes_pulls } = repo;

    if (issues_includes_pulls) {
      // The `open_issues_count` field actually includes open issues AND open PRs.
      // So remove the PRs from the count
      open_issues_count = open_issues_count - open_pulls_count;
      issues_includes_pulls = false;
    }

    // Update the app state with the "correct" numbers
    repo = new GitHubRepo({
      ...repo,
      open_issues_count,
      open_pulls_count,
      issues_includes_pulls,
    });

    updateRepo(repo);
  }
}

/**
 * Fetches the dependencies for the specified repo, and calls the specified update callback.
 */
async function fetchDependencies(repo: GitHubRepo, updateRepo: UpdateRepo) {
  let dependenciesResponse = await packageRegistry.fetchDependencies(repo);

  if (dependenciesResponse.ok) {
    // Update the app state with the repo's dependencies
    repo = new GitHubRepo({
      ...repo,
      dependencies: dependenciesResponse.body!,
    });

    updateRepo(repo);
  }
}
