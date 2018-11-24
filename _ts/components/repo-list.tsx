import octicons = require("octicons");
import { OcticonName } from "octicons";
import { GitHubAccount } from "../github/github-account";
import { GitHubRepo } from "../github/github-repo";
import { stateStore } from "../state-store";
import { h } from "../virtual-dom";

export interface RepoListProps {
  account: GitHubAccount;
}

export function RepoList(props: RepoListProps) {
  let { account } = props;
  let repos = account.repos.filter((repo) => !stateStore.isHidden(repo));

  return (
    <ul className="repo-list">
      {repos.map((repo) => <RepoItem repo={repo} {...props} />)}
    </ul>
  );
}

interface RepoItemProps extends RepoListProps {
  repo: GitHubRepo;
}

function RepoItem(props: RepoItemProps) {
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
          <span className="badge-count">{String(repo.forks_count)}</span>
        </a>

        <a href={`${repo.html_url}/stargazers`}
          className={`badge ${repo.stargazers_count ? "badge-ok" : ""} stars`}>
          <Octicon name="star" />
          <span className="badge-label">Stars</span>
          <span className="badge-count">{String(repo.stargazers_count)}</span>
        </a>

        <a href={`${repo.html_url}/watchers`}
          className={`badge ${repo.watchers_count ? "badge-ok" : ""} watchers`}>
          <Octicon name="eye" />
          <span className="badge-label">Watchers</span>
          <span className="badge-count">{String(repo.watchers_count)}</span>
        </a>

        <a href={`${repo.html_url}/issues`}
          className={`badge ${repo.open_issues_count ? "badge-warning" : "badge-ok"} issues`}>
          <Octicon name={repo.open_issues_count ? "issue-opened" : "issue-closed"} />
          <span className="badge-label">Issues</span>
          <span className="badge-count">{String(repo.open_issues_count)}</span>
        </a>

        <DependencyBadge {...props} />
      </nav>
    </li>
  );
}

function Octicon({ name }: { name: OcticonName }) {
  let icon = octicons[name];
  // @ts-ignore - SVGSVGElement's properties are objects, not primitives
  return <svg {...icon.options} innerHTML={icon.path} />;
}

function DependencyBadge(props: RepoItemProps) {
  let { repo } = props;

  if (repo.dependencies.total === 0) {
    // The repo has dependencies, so don't show this badge
    return null;   // tslint:disable-line:no-null-keyword
  }

  let hasError: boolean;
  let label: string;
  let count: number;

  if (repo.dependencies.out_of_date) {
    hasError = true;
    label = "Out of Date";
    count = repo.dependencies.out_of_date;
  }
  else if (repo.dependencies.advisories) {
    hasError = true;
    label = "Insecure";
    count = repo.dependencies.advisories;
  }
  else {
    hasError = false;
    label = "Up-to-Date";
    count = repo.dependencies.up_to_date;
  }

  return (
    <a href={repo.dependencies.html_url}
      className={`badge ${hasError ? "badge-error" : "badge-ok"} dependencies`}>
      <Octicon name="package" />
      <span className="badge-label">{label}</span>
      <span className="badge-count">{`${count} / ${repo.dependencies.total}`}</span>
    </a>
  );
}
