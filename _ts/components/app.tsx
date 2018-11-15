import { stateStore } from "../state-store";
import { ReadonlyAppState } from "../state-store/app-state";
import { AccountList } from "./account-list";
import { FirstTime } from "./first-time";
import { PageHeader } from "./page-header";

export class App extends React.Component<{}, ReadonlyAppState> {
  public readonly state: ReadonlyAppState;

  public constructor(props: Readonly<{}>) {
    super(props);

    // Connect the StateStore with this app instance
    this.state = stateStore.state;
    stateStore.onStateChange((event) => this.setState(event.detail.state, event.detail.callback));  //tslint:disable-line:no-unbound-method
  }

  public render() {
    return [
      <PageHeader key="page_header" />,
      // <Options key="options" />,
      <AccountList key="account_list" />,
      <FirstTime key="first_time" />,
    ];
  }
}
