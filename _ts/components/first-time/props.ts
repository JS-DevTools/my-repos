import { GitHubAccount } from "../../github";

export interface FirstTimeProps {
  accounts: GitHubAccount[];
  addAccount(name: string): void;
}
