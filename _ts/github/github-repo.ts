import { GitHubAccount } from "./github-account";

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
  language: string;
  html_url: string;
}

/**
 * Additional GitHub repo properties that we need for this app
 */
export class GitHubRepo implements GitHubRepoPOJO {
  public readonly account: GitHubAccount;
  public name = "";
  public full_name = "";
  public description = "";
  public archived = false;
  public fork = false;
  public forks_count = 0;
  public pull_count = 0;
  public stargazers_count = 0;
  public watchers_count = 0;
  public open_issues_count = 0;
  public language = "";
  public html_url = "";

  // TEMPORARY
  public dependencies = {
    total: 0,
    out_of_date: 0,
    up_to_date: 0,
    advisories: 0,
    html_url: "",
  };

  public constructor(props: Partial<GitHubRepo>) {
    if (!props.account) {
      throw new Error(`No parent account was specified for GitHub repo "${props.name}"`);
    }

    this.account = props.account;
    Object.assign(this, props);
  }
}

// tslint:disable:no-any no-unsafe-any
export function isGitHubRepoPOJO(repo: any): repo is GitHubRepoPOJO {
  return repo &&
    typeof repo === "object" &&
    typeof repo.name === "string" &&
    repo.name.length > 0 &&
    typeof repo.full_name === "string" &&
    repo.full_name.length > 0 &&
    typeof repo.html_url === "string";
}
