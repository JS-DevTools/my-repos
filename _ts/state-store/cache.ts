import { GitHubAccount, isGitHubAccountPOJO } from "../github/github-account";
import { GitHubRepo, isGitHubRepoPOJO } from "../github/github-repo";
import { JsonPOJO, POJO } from "../util";

interface CachedGitHubAccount extends GitHubAccount {
  repoNames: string[];
}

/**
 * Caches data to LocalStorage, so we can render the page immediately on subsequent visits,
 * rather than waiting for all data to be fetched from GitHub, David-DM, etc.
 * This also helps protect against API rate limits, since we can fallback to cached data.
 */
export class Cache {
  /**
   * Returns the specified GitHub Account from the cache, if it exists.
   * The account is fully re-hydrated, including its repos.
   */
  public getAccount(login: string): GitHubAccount | undefined {
    let pojo = getItem(login) as CachedGitHubAccount | undefined;

    if (isGitHubAccountPOJO(pojo)) {
      let account = new GitHubAccount(pojo);

      if (Array.isArray(pojo.repoNames)) {
        // Load the account's GitHub repos as well
        for (let repoName of pojo.repoNames) {
          let repo = this.getRepo(repoName);
          if (repo) {
            account.repos.push(repo);
          }
        }
      }

      return account;
    }
  }

  /**
   * Stores the specified GitHub Account and its repos in the cache.
   */
  public setAccount(account: GitHubAccount): void {
    let pojo: CachedGitHubAccount = {
      ...account,
      error: undefined,
      repos: [],
      repoNames: [],
    };

    for (let repo of account.repos) {
      pojo.repoNames.push(repo.full_name);
      this.setRepo(repo);
    }

    setItem(account.login, pojo);
  }

  /**
   * Returns the specified GitHub Repo from the cache, if it exists.
   * The repo is fully re-hydrated, including its dependencies.
   */
  public getRepo(full_name: string): GitHubRepo | undefined {
    let pojo = getItem(full_name);

    if (isGitHubRepoPOJO(pojo)) {
      let repo = new GitHubRepo(pojo);
      return repo;
    }
  }

  /**
   * Stores the specified GitHub Repo in the cache.
   */
  public setRepo(repo: GitHubRepo): void {
    setItem(repo.full_name, repo);
  }
}

/**
 * Returns the parsed value of the specified LocalStorage item
 */
function getItem(key: string): JsonPOJO | undefined {
  try {
    key = key.trim().toLowerCase();
    let json = localStorage.getItem(key);

    if (json) {
      return JSON.parse(json) as JsonPOJO;
    }
    else {
      return undefined;
    }
  }
  catch (error) {
    console.error(`Error loading ${key} from LocalStorage cache`, error);
    return undefined;
  }
}

/**
 * Sets the value of the specified LocalStorage item
 */
function setItem(key: string, value: POJO): void {
  key = key.trim().toLowerCase();
  let json = JSON.stringify(value);
  localStorage.setItem(key, json);
}
