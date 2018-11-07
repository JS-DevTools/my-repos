import { GitHubAccount } from "../../github";
import { AddAccount } from "../app/state-store";

export interface AddAccountProps {
  accounts: GitHubAccount[];
  addAccount: AddAccount;
  submitButtonText: string;
}
