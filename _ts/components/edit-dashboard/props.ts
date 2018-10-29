import { GitHubAccount } from "../../github";

export interface Props {
  accounts: GitHubAccount[];
  selectedAccount?: GitHubAccount;
  getAccount(id: number): GitHubAccount | undefined;
  addAccount(name: string): void;
  removeAccount(id: number): void;
  selectAccount(id: number): void;
  toggleRepo(accountID: number, repoID: number, include: boolean): void;
}
