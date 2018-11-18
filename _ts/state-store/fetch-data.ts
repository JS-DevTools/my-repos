import { github } from "../github";
import { GitHubAccount } from "../github/github-account";


/**
 * Fetches the data for the specified GitHub account and its repos, and invokes the specified update
 * callback.  Fetching account data requires several API calls, so the update callback will be called
 * multiple times.
 */
export async function fetchData(account: GitHubAccount, update: (account: GitHubAccount) => void) {
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
