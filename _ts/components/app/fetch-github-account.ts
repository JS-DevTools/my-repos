import { github } from "../../github/github";
import { GitHubAccount } from "../../github/github-account";

type ReplaceAccountCallback = (oldAccountID: number, newAccount: GitHubAccount) => void;

/**
 * Fetches the specified GitHub account and its repos, and then calls the given callback function
 * to update the app state.
 */
export async function fetchGitHubAccount(account: GitHubAccount, replaceAccount: ReplaceAccountCallback) {
  // Fetch the GitHub account and repos at the same time
  let safeResults = await Promise.all([
    safeResolve(github.fetchAccount(account)),
    safeResolve(github.fetchRepos(account)),
  ]);

  // @ts-ignore - This line totally confuses the TypeScript compiler
  let [{ result: accountPOJO, error: accountError }, { result: repos, error: repoError }] = safeResults;
  let newAccount: GitHubAccount;

  if (accountError) {
    // An error occurred while fetching the account, so create a dummy account
    // with the error message
    newAccount = new GitHubAccount({
      ...account,
      error: accountError.message,
    });
  }
  else if (accountPOJO && repoError) {
    // An error occurred while fetching the repos, so add the error message to the account
    newAccount = new GitHubAccount({
      ...accountPOJO,
      error: repoError.message,
    });
  }
  else if (accountPOJO && repos) {
    // Everything succeeded, so add the repos to the account
    newAccount = new GitHubAccount({
      ...accountPOJO,
      repos,
    });
  }
  else {
    newAccount = account;
  }

  replaceAccount(account.id, newAccount);
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
