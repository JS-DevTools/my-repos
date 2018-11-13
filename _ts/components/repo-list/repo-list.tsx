import { config } from "../../config";
import { GitHubRepo } from "../../github/github-repo";
import { RepoListProps } from "./props";

export function RepoList(props: RepoListProps) {
  let { account, toggleRepo } = props;
  let repos = config.filterRepos(account.repos);

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
    <li key={repo.id} className={`repo ${repo.fork ? "forked" : ""} ${repo.archived ? "archived" : ""}`}>
      <h2>
        <a href={repo.html_url}>{repo.name}</a>
      </h2>
      {repo.description && <h3>{repo.description}</h3>}

      <nav className="badges">
        <a href={`${repo.html_url}/network/members`}
          className={`badge ${repo.forks_count ? "badge-ok" : ""} forks`}>
          <i className="glyphicon glyphicon-cutlery"></i>
          <span className="badge-label">Forks</span>
          <span className="badge-count">{repo.forks_count}</span>
        </a>

        <a href={`${repo.html_url}/stargazers`}
          className={`badge ${repo.stargazers_count ? "badge-ok" : ""} stars`}>
          <i className="glyphicon glyphicon-star"></i>
          <span className="badge-label">Stars</span>
          <span className="badge-count">{repo.stargazers_count}</span>
        </a>

        <a href={`${repo.html_url}/watchers`}
          className={`badge ${repo.watchers_count ? "badge-ok" : ""} watchers`}>
          <i className="glyphicon glyphicon-eye-open"></i>
          <span className="badge-label">Watchers</span>
          <span className="badge-count">{repo.watchers_count}</span>
        </a>

        <a href={`${repo.html_url}/issues`}
          className={`badge ${repo.open_issues_count ? "badge-warning" : "badge-ok"} issues`}>
          <i className="glyphicon glyphicon-fire"></i>
          <span className="badge-label">Issues</span>
          <span className="badge-count">{repo.open_issues_count}</span>
        </a>

        {DependencyBadge(props)}
      </nav>
    </li>
  );
}

function DependencyBadge(props: RepoItemProps) {
  let { repo } = props;

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
      <i className="glyphicon glyphicon-calendar"></i>
      <span className="badge-label">{label}</span>
      <span className="badge-count">{`${count} / ${repo.dependencies.total}`}</span>
    </a>
  );
}
