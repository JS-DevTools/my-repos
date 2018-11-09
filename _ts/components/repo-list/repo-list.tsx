import { GitHubRepo } from "../../github";
import { hash } from "../../hash";
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
  if (repo.fork && !hash.options.forks) {
    // Don't show forked repos
    return false;
  }
  else {
    return true;
  }
}
