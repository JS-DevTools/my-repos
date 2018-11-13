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
    <li key={repo.id} className="repo">
      <h2>
        <a href={repo.html_url}>{repo.name}</a>
      </h2>
      {repo.description && <h3>{repo.description}</h3>}

      <nav className="badges">
        <a href={`${repo.html_url}/network/members`}
          className={`badge ${repo.forks_count ? "badge-ok" : ""} forks`}>
          <i className="glyphicon glyphicon-cutlery"></i> Forks
          <span>{repo.forks_count}</span>
        </a>

        <a href={`${repo.html_url}/stargazers`}
          className={`badge ${repo.stargazers_count ? "badge-ok" : ""} stars`}>
          <i className="glyphicon glyphicon-star"></i> Stars
          <span>{repo.stargazers_count}</span>
        </a>

        <a href={`${repo.html_url}/watchers`}
          className={`badge ${repo.watchers_count ? "badge-ok" : ""} watchers`}>
          <i className="glyphicon glyphicon-eye-open"></i> Watchers
          <span>{repo.watchers_count}</span>
        </a>

        <a href={`${repo.html_url}/issues`}
          className={`badge ${repo.open_issues_count ? "badge-warning" : "badge-ok"} issues`}>
          <i className="glyphicon glyphicon-fire"></i> Issues
          <span>{repo.open_issues_count}</span>
        </a>
      </nav>
    </li>
  );
}
