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
