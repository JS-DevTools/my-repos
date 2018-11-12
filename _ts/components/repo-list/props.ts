import { GitHubAccount } from "../../github/github-account";
import { ToggleRepo } from "../app/state-store";

export interface RepoListProps {
  account: GitHubAccount;
  toggleRepo: ToggleRepo;
}
