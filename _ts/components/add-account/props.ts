import { GitHubAccount } from "../../github";

export interface AddAccountProps {
  accounts: GitHubAccount[];
  addAccount(name: string): void;
  submitButtonText: string;
}
