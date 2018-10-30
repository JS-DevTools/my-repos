import { github, GitHubAccount, GitHubAccountPOJO } from "../../github";

type ReplaceAccountCallback = (oldAccountID: number, newAccount: GitHubAccount) => void;

/**
 * Fetches the specified GitHub account and its repos, and then calls the given callback function
 * to update the app state.
 */
export async function fetchGitHubAccount(accountPOJO: GitHubAccountPOJO, replaceAccount: ReplaceAccountCallback) {
  // Fetch the GitHub account and repos at the same time
  let safeResults = await Promise.all([
    safeResolve(github.fetchAccount(accountPOJO.login)),
    safeResolve(github.fetchRepos(accountPOJO.login)),
    artificialDelay(),
  ]);

  // @ts-ignore - This line totally confuses the TypeScript compiler
  let [{ result: account, error: accountError }, { result: repos, error: repoError }] = safeResults;

  if (accountError) {
    // An error occurred while fetching the account, so create a dummy account
    // with the error message
    account = {
      ...accountPOJO,
      repos: [],
      error: accountError.message,
    };
  }
  else if (account && repoError) {
    // An error occurred while fetching the repos, so add the error message to the account
    account.error = repoError.message;
  }
  else if (account && repos) {
    // Everything succeeded, so add the repos to the account
    account.repos = repos;
  }

  replaceAccount(accountPOJO.id, account!);
}


async function safeResolve<T>(promise: Promise<T>): Promise<{ result?: T; error?: Error }> {
  let result, error;

  try {
    result = await promise;
  }
  catch (err) {
    error = err;
  }

  return { result, error };
}


function artificialDelay() {
  let milliseconds: number = 0;

  if (location.hostname === "localhost") {
    milliseconds = 800;
  }

  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}
