import { config } from "../../config";
import { GitHubRepo } from "../../github";
import { RepoListProps } from "./props";

export function RepoList(props: RepoListProps) {
  let { account, toggleRepo } = props;
  let repos = account.repos.filter(byOptions);

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
  let { account, repo } = props;

  return (
    <li key={repo.id} className="repo">
      <h2>
        <a href={`https://github.com/${account.login}/${repo.name}`}>{repo.name}</a>
      </h2>
      {repo.description && <h3>{repo.description}</h3>}
    </li>
  );
}

/**
 * Returns true if the GitHub Repo should be shown, based on the current options
 */
function byOptions(repo: GitHubRepo): boolean {
  if (config.hide.has(repo.full_name)) {
    // This repo has been explicitly hidden
    return false;
  }

  if (repo.fork && !config.forks) {
    // Don't show forked repos
    return false;
  }

  return true;
}
