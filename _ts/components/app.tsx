import * as React from "react";
import { stateStore } from "../state-store";
import { ReadonlyAppState } from "../state-store/app-state";
import { AccountList } from "./account-list";
import { FirstTime } from "./first-time";
import { Options } from "./options";
import { PageHeader } from "./page-header";

export class App extends React.Component<object, ReadonlyAppState> {
  public readonly state: ReadonlyAppState;

  public constructor(props: Readonly<object>) {
    super(props);

    // Connect the StateStore with this app instance
    this.state = stateStore.state;
    stateStore.onStateChange(() => this.setState(stateStore.state));
  }

  public render() {
    return [
      <PageHeader key="page_header" />,
      <Options key="options" />,
      <AccountList key="account_list" />,
      <FirstTime key="first_time" />,
    ];
  }
}
