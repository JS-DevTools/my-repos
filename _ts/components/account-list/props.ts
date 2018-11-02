import { GitHubAccount } from "../../github";

export interface AccountListProps {
  accounts: GitHubAccount[];
  addAccount(name: string): void;
  removeAccount(id: number): void;
  toggleRepo(accountID: number, repoID: number, include: boolean): void;
}
