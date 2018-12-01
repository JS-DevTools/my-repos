import * as React from "react";
import { GitHubAccount } from "../github/github-account";
import { RepoItem } from "./repo-item";

export interface RepoListProps {
  account: GitHubAccount;
}

export function RepoList(props: RepoListProps) {
  let { account } = props;
  let repos = account.repos.filter((repo) => !repo.isHidden());

  return (
    <ul className="repo-list">
      {repos.map((repo) => <RepoItem key={repo.name} repo={repo} {...props} />)}
    </ul>
  );
}
