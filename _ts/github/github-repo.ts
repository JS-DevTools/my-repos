import { Config } from "../config";

/**
 * A GitHub repository, as returned from the GitHub REST API
 */
export interface GitHubRepoPOJO {
  readonly id: number;
  name: string;
  full_name: string;
  description: string;
  archived: boolean;
  fork: boolean;
  forks_count: number;
  stargazers_count: number;
  watchers_count: number;
  open_issues_count: number;
  html_url: string;
}

/**
 * Additional GitHub repo properties that we need for this app
 */
export class GitHubRepo implements GitHubRepoPOJO {
  public readonly id: number;
  public name: string;
  public full_name: string;
  public description: string;
  public fork: boolean;
  public stargazers_count: number;

  /**
   * Is this repo hidden from the dashboard?
   */
  public hidden: boolean;

  public constructor(props: Partial<GitHubRepo>) {
    this.id = props.id || Math.random();
    this.name = props.name || "";
    this.full_name = props.full_name || "";
    this.description = props.description || "";
    this.fork = props.fork || false;
    this.stargazers_count = props.stargazers_count || 0;
    this.hidden = props.hidden || false;
  }

  /**
   * Determines whether the GitHub Repo should be hidden, based on the specified config
   */
  public isHidden(config: Config): boolean {
    if (config.hiddenRepos.has(this.full_name)) {
      // This repo has been explicitly hidden
      return true;
    }

    if (this.fork && !config.showForks) {
      // Don't show forked repos
      return true;
    }

    return false;
  }
}

// tslint:disable-next-line:no-any
export function isArrayOfGitHubRepoPOJO(repos: any[]): repos is GitHubRepoPOJO[] {
  return repos.length > 0 &&
    typeof repos[0] === "object" &&
    typeof repos[0].name === "string";
}
