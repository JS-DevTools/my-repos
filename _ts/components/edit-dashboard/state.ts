/**
 * A map of GitHub accounts, keyed by the lowercase name
 */
export interface GitHubAccountMap extends Map<string, GitHubAccount> { }

/**
 * A GitHub user or organization account
 */
export interface GitHubAccount {
  /**
   * The username or organization name
   */
  readonly name: string;

  /**
   * A map of GitHub accounts, keyed by the lowercase name
   */
  readonly repos: Map<string, GitHubRepo>;
}

/**
 * A GitHub repository
 */
export interface GitHubRepo {
  /**
   * The name of the GitHub repository (without the user/org name)
   */
  readonly name: string;

  /**
   * Should this repo be included in the dashboard?
   */
  include: boolean;
}
