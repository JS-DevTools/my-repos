import * as React from "react";
import { stateStore } from "../state-store";
import { accountCountCssClass } from "../util";
import { AddAccount } from "./add-account";

export function PageHeader() {
  let { accounts } = stateStore.state;

  return (
    <header id="page_header" className={accountCountCssClass(accounts)}>
      <div className="responsive-container">
        <img className="logo" src="img/logo.png" alt="logo image" />
        <h1>My GitHub Repos</h1>
        <h2>All your GitHub repos on one page</h2>

        <AddAccount />
      </div>
    </header>
  );
}
