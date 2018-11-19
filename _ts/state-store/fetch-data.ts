import { github } from "../github";
import { GitHubAccount } from "../github/github-account";

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

  update(account);
}
