/* eslint-disable @typescript-eslint/no-invalid-this */
import * as React from "react";
import { MouseEvent } from "react";
import { BuildStatus } from "../ci/build";
import { GitHubRepo } from "../github/github-repo";
import { stateStore } from "../state-store";
import { Octicon } from "./octicon";

interface RepoItemProps {
  repo: GitHubRepo;
}

enum Status {
  OK = "badge-ok",
  Warning = "badge-warning",
  Error = "badge-error",
}

export class RepoItem extends React.Component<RepoItemProps> {
  public render() {
    let { repo } = this.props;

    return (
      <li key={repo.name} className={`repo ${repo.fork ? "forked" : ""} ${repo.archived ? "archived" : ""}`}>
        <h2>
          <a href={repo.html_url}>{repo.name}</a>
          {
            repo.fork &&
            <Octicon name="repo-forked" title="This repo is a fork of another repo" />
          }
          {
            repo.archived &&
            <Octicon name="archive" title="This repo has been archived" />
          }
          <a href={`#hide=${repo.full_name}`} className="remove-repo"
            title={`Hide ${repo.full_name}`} onClick={this.handleHideClick}>
            <Octicon name="x" />
          </a>
        </h2>
        <h3>{repo.description}</h3>

        <nav className="badges">
          <a href={`${repo.html_url}/network/members`}
            className={`badge ${repo.forks_count ? Status.OK : ""} forks`}>
            <Octicon name="repo-forked" />
            <span className="badge-label">Forks</span>
            <span className="badge-count">{repo.forks_count}</span>
          </a>

          <a href={`${repo.html_url}/stargazers`}
            className={`badge ${repo.stargazers_count ? Status.OK : ""} stars`}>
            <Octicon name="star" />
            <span className="badge-label">Stars</span>
            <span className="badge-count">{repo.stargazers_count}</span>
          </a>

          <a href={`${repo.html_url}/watchers`}
            className={`badge ${repo.watchers_count ? Status.OK : ""} watchers`}>
            <Octicon name="eye" />
            <span className="badge-label">Watchers</span>
            <span className="badge-count">{repo.watchers_count}</span>
          </a>

          <a href={`${repo.html_url}/issues`}
            className={`badge ${repo.open_issues_count ? Status.Warning : Status.OK} issues`}>
            <Octicon name={repo.open_issues_count ? "issue-opened" : "issue-closed"} />
            <span className="badge-label">Issues</span>
            <span className="badge-count">{repo.open_issues_count}</span>
          </a>

          <a href={`${repo.html_url}/pulls`}
            className={`badge ${repo.open_pulls_count ? Status.Warning : Status.OK} pulls`}>
            <Octicon name="git-pull-request" />
            <span className="badge-label">PRs</span>
            <span className="badge-count">
              {
                repo.issues_includes_pulls ?
                  repo.open_issues_count === 0 ? 0 : "?" :
                  repo.open_pulls_count
              }
            </span>
          </a>

          <DependencyBadge {...this.props} />
          <BuildBadge {...this.props} />
        </nav>
      </li>
    );
  }

  private readonly handleHideClick = (event: MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault();
    stateStore.toggleHidden(this.props.repo, true);
  };
}

function DependencyBadge(props: RepoItemProps) {
  let { dev, runtime } = props.repo.dependencies;

  let total = dev.total + runtime.total;
  let upToDate = dev.up_to_date + runtime.up_to_date;
  let outOfDate = dev.out_of_date + runtime.out_of_date;
  let advisories = dev.advisories + runtime.advisories;

  if (total === 0) {
    // This repo doesn't have any dependencies, so don't display this badge
    return null;
  }

  let href: string;
  let title: string;
  let className: Status;
  let label: string;
  let count: number;

  if (outOfDate) {
    label = "Out of Date";
    count = outOfDate;

    if (runtime.out_of_date) {
      href = runtime.html_url;
      className = Status.Error;
      title = "Some runtime dependencies need updated";
    }
    else {
      href = dev.html_url;
      className = Status.Warning;
      title = "Some dev dependencies need updated";
    }
  }
  else if (advisories) {
    label = "Insecure";
    count = advisories;

    if (runtime.advisories) {
      href = runtime.html_url;
      className = Status.Error;
      title = "Some runtime dependencies have known security vulnerabilities";
    }
    else {
      href = dev.html_url;
      className = Status.Warning;
      title = "Some dev dependencies have known security vulnerabilities";
    }
  }
  else {
    href = runtime.html_url;
    title = "Dependencies";
    className = Status.OK;
    label = "Up-to-Date";
    count = upToDate;
  }

  return (
    <a href={href} title={title}
      className={`badge ${className} dependencies`}>
      <Octicon name="package" />
      <span className="badge-label">{label}</span>
      <span className="badge-count">{`${count} / ${total}`}</span>
    </a>
  );
}

function BuildBadge(props: RepoItemProps) {
  let { build } = props.repo;

  if (build.status === BuildStatus.Unknown) {
    // We don't know the CI build status for this repo, so don't display this badge
    return null;
  }

  let className: Status;
  let label: string;

  switch (build.status) {
    case BuildStatus.Success:
      className = Status.OK;
      label = "Passing";
      break;

    case BuildStatus.Failed:
      className = Status.Error;
      label = "Failed";
      break;

    case BuildStatus.Cacneled:
      className = Status.Warning;
      label = "Canceled";
      break;

    default:
      className = Status.Error;
      label = "Error";
      break;
  }

  return (
    <a href={build.html_url}
      className={`badge ${className} build`}>
      <Octicon name="gear" />
      <span className="badge-label">{`Build: ${label}`}</span>
    </a>
  );
}
