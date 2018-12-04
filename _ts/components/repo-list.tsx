import * as React from "react";
import { GitHubRepo } from "../github/github-repo";
import { RepoItem } from "./repo-item";

export interface RepoListProps {
  repos: GitHubRepo[];
}

export function RepoList(props: RepoListProps) {
  let { repos } = props;

  return (
    <ul className="repo-list">
      {repos.map((repo) => <RepoItem key={repo.name} repo={repo} {...props} />)}
    </ul>
  );
}
