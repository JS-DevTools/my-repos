import { GitHubAccount } from "../../github";
import { AddAccount } from "../app/state-store";

export interface FirstTimeProps {
  accounts: GitHubAccount[];
  addAccount: AddAccount;
}
