/**
 * A GitHub user or organization account
 */
export interface GitHubAccount {
  /**
   * The username or organization name
   */
  readonly name: string;

  /**
   * This account's GitHub repos
   */
  readonly repos: GitHubRepo[];
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
