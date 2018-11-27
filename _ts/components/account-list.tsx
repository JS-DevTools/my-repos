import * as React from "react";
import { stateStore } from "../state-store";
import { accountCountCssClass } from "../util";
import { AccountItem } from "./account-item";

export function AccountList() {
  let { accounts } = stateStore.state;

  return (
    <main id="account_list" className={accountCountCssClass(accounts)}>
      <div className="responsive-container">
        {accounts.map((account) => <AccountItem account={account} />)}
      </div>
    </main>
  );
}
