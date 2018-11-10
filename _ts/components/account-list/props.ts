import { GitHubAccount } from "../../github";
import { RemoveAccount, ToggleRepo } from "../app/state-store";

export interface AccountListProps {
  accounts: GitHubAccount[];
  removeAccount: RemoveAccount;
  toggleRepo: ToggleRepo;
}
