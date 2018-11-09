import { GitHubAccount } from "../../github";
import { ToggleRepo } from "../app/state-store";

export interface RepoListProps {
  account: GitHubAccount;
  toggleRepo: ToggleRepo;
}
