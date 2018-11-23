import { h } from "petit-dom";
import { AccountList } from "./account-list";
import { Component } from "./component";
import { FirstTime } from "./first-time";
import { Options } from "./options";
import { PageHeader } from "./page-header";

export class App extends Component {
  public render() {
    return (
      <body>
        <PageHeader key="page_header" />
        <Options key="options" />
        <AccountList key="account_list" />
        <FirstTime key="first_time" />
      </body>
    );
  }
}
