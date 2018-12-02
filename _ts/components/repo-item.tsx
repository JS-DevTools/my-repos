import * as React from "react";
import { GitHubRepo } from "../github/github-repo";
import { Octicon } from "./octicon";

interface RepoItemProps {
  repo: GitHubRepo;
}

export function RepoItem(props: RepoItemProps) {
  let { repo } = props;

  return (
    <li key={repo.name} className={`repo ${repo.fork ? "forked" : ""} ${repo.archived ? "archived" : ""}`}>
      <h2>
        <a href={repo.html_url}>{repo.name}</a>
      </h2>
      {repo.description && <h3>{repo.description}</h3>}

      <nav className="badges">
        <a href={`${repo.html_url}/network/members`}
          className={`badge ${repo.forks_count ? "badge-ok" : ""} forks`}>
          <Octicon name="repo-forked" />
          <span className="badge-label">Forks</span>
          <span className="badge-count">{repo.forks_count}</span>
        </a>

        <a href={`${repo.html_url}/stargazers`}
          className={`badge ${repo.stargazers_count ? "badge-ok" : ""} stars`}>
          <Octicon name="star" />
          <span className="badge-label">Stars</span>
          <span className="badge-count">{repo.stargazers_count}</span>
        </a>

        <a href={`${repo.html_url}/watchers`}
          className={`badge ${repo.watchers_count ? "badge-ok" : ""} watchers`}>
          <Octicon name="eye" />
          <span className="badge-label">Watchers</span>
          <span className="badge-count">{repo.watchers_count}</span>
        </a>

        <a href={`${repo.html_url}/issues`}
          className={`badge ${repo.open_issues_count ? "badge-warning" : "badge-ok"} issues`}>
          <Octicon name={repo.open_issues_count ? "issue-opened" : "issue-closed"} />
          <span className="badge-label">Issues</span>
          <span className="badge-count">{repo.open_issues_count}</span>
        </a>

        <a href={`${repo.html_url}/pulls`}
          className={`badge ${repo.open_pulls_count ? "badge-warning" : "badge-ok"} pulls`}>
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

        <DependencyBadge {...props} />
      </nav>
    </li>
  );
}

function DependencyBadge(props: RepoItemProps) {
  let { dev, runtime } = props.repo.dependencies;

  let total = dev.total + runtime.total;
  let upToDate = dev.up_to_date + runtime.up_to_date;
  let outOfDate = dev.out_of_date + runtime.out_of_date;
  let advisories = dev.advisories + runtime.advisories;

  if (total === 0) {
    // This repo doesn't have any dependencies, so don't display this badge
    return null;   // tslint:disable-line:no-null-keyword
  }

  let href: string;
  let title: string;
  let className: string;
  let label: string;
  let count: number;

  if (outOfDate) {
    label = "Out of Date";
    count = outOfDate;

    if (runtime.out_of_date) {
      href = runtime.html_url;
      className = "badge-error";
      title = "Some runtime dependencies need updated";
    }
    else {
      href = dev.html_url;
      className = "badge-warning";
      title = "Some dev dependencies need updated";
    }
  }
  else if (advisories) {
    label = "Insecure";
    count = advisories;

    if (runtime.advisories) {
      href = runtime.html_url;
      className = "badge-error";
      title = "Some runtime dependencies have known security vulnerabilities";
    }
    else {
      href = dev.html_url;
      className = "badge-warning";
      title = "Some dev dependencies have known security vulnerabilities";
    }
  }
  else {
    href = runtime.html_url;
    title = "Dependencies";
    className = "badge-ok";
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
