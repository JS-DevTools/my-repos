import { Build } from "../ci";
import { Dependencies } from "../dependencies";
import { stateStore } from "../state-store";

/**
 * The key fields that uniquely identify a GitHub repo
 */
export interface GitHubRepoKey {
  /**
   * The GitHub login name (e.g. "JS-DevTools")
   */
  login: string;

  /**
   * The fully-qualified repo name (e.g. "JS-DevTools/my-repos")
   */
  full_name: string;
}

/**
 * A GitHub repository, as returned from the GitHub REST API
 */
export interface GitHubRepoPOJO {
  name: string;
  full_name: string;
  description?: string;
  archived: boolean;
  fork: boolean;
  forks_count: number;
  stargazers_count: number;
  watchers_count: number;
  open_issues_count: number;
  language?: string;
  html_url: string;
}

/**
 * Additional GitHub repo properties that we need for this app
 */
export class GitHubRepo implements GitHubRepoPOJO {
  public name = "";
  public full_name = "";
  public description = "";
  public archived = false;
  public fork = false;
  public forks_count = 0;
  public stargazers_count = 0;
  public watchers_count = 0;
  public open_issues_count = 0;
  public language?: string;
  public html_url = "";

  /**
   * The number of open pull requests for this GitHub repo.
   * This is separate from the number of open issues.
   */
  public open_pulls_count = 0;

  /**
   * Indicates whether the `open_issues_count` field includes both issues and PRs.
   * The GitHub API only returns the combined number, so this flag is initially true.
   * But once we determine the two different numbers, this flag is set to false.
   */
  public issues_includes_pulls = true;

  /**
   * The GitHub account login that this repo belongs to.
   */
  public login!: string;

  /**
   * Information about this repo's dependencies.
   */
  public dependencies = new Dependencies();

  /**
   * Information about this repo's latest CI build.
   */
  public build = new Build();

  /**
   * The date/time that the repo's data was last fetched from GitHub
   */
  public last_refresh = new Date(0);

  /**
   * The date/time that the repo's PR count was last fetched from GitHub
   */
  public last_pull_count_refresh = new Date(0);

  public constructor(props: Partial<GitHubRepo>) {
    if (!props.login) {
      throw new Error(`No parent account was specified for GitHub repo "${props.name}"`);
    }

    Object.assign(this, props);
  }

  /**
   * Determines whether the GitHub Repo is currently hidden
   */
  public isHidden(): boolean {
    const { hiddenRepos, showForks, showArchived } = stateStore.state;

    if (hiddenRepos.has(this.full_name)) {
      // This repo has been explicitly hidden
      return true;
    }

    if (this.fork && !showForks) {
      // Don't show forked repos
      return true;
    }

    if (this.archived && !showArchived) {
      // Don't show archived repos
      return true;
    }

    return false;
  }
}

export function isGitHubRepoPOJO(repo: any): repo is GitHubRepoPOJO {
  return repo &&
    typeof repo === "object" &&
    typeof repo.name === "string" &&
    repo.name.length > 0 &&
    typeof repo.full_name === "string" &&
    repo.full_name.length > 0 &&
    typeof repo.html_url === "string";
}
