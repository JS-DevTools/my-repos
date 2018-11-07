import { GitHubAccount } from "../../github";
import { AddAccount, RemoveAccount, ToggleRepo } from "../app/state-store";

export interface AccountListProps {
  accounts: GitHubAccount[];
  addAccount: AddAccount;
  removeAccount: RemoveAccount;
  toggleRepo: ToggleRepo;
}
