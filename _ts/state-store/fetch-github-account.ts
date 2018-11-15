import { github } from "../github";
import { GitHubAccount } from "../github/github-account";

/**
 * Fetches the specified GitHub account and its repos, and then calls the given callback function
 * to update the app state.
 */
export async function fetchGitHubAccount(account: GitHubAccount, callback: (account: GitHubAccount) => void) {
  // Fetch the GitHub account and repos at the same time
  let safeResults = await Promise.all([
    safeResolve(github.fetchAccount(account)),
    safeResolve(github.fetchRepos(account)),
  ]);

  // @ts-ignore - This line totally confuses the TypeScript compiler
  let [{ result: accountPOJO, error: accountError }, { result: repos, error: repoError }] = safeResults;

  if (accountError) {
    // An error occurred while fetching the account
    account = new GitHubAccount({
      ...account,
      error: accountError.message,
    });
  }
  else {
    // We successfully fetched the GitHub account
    account = new GitHubAccount(accountPOJO);

    if (repoError) {
      // An error occurred while fetching the repos, so add the error message to the account
      account.error = repoError.message;
    }
    else {
      // We successfully fetched the GitHub repos
      account.repos = repos!;
    }
  }

  callback(account);
}


async function safeResolve<T>(promise: Promise<T>): Promise<{ result?: T; error?: Error }> {
  let result: T | undefined;
  let error: Error | undefined;

  try {
    result = await promise;
  }
  catch (err) {
    error = err as Error;
  }

  return { result, error };
}
