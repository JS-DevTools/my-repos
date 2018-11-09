import { GitHubRepo } from "../../github";
import { RepoListProps } from "./props";

export function RepoList(props: RepoListProps) {
  let { account, toggleRepo } = props;

  return (
    <ul className="repo-list">
      {account.repos.map((repo) => <RepoItem repo={repo} {...props} />)}
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
      <h2>{repo.name}</h2>
      {repo.description && <h3>{repo.description}</h3>}
    </li>
  );
}
