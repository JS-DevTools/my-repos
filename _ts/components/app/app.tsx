import { AccountList } from "../account-list/account-list";
import { FirstTime } from "../first-time/first-time";
import { AddAccount, AppState, RemoveAccount, ReplaceAccount, StateStore, SyncWithHash, ToggleRepo } from "./state-store";

export class App extends React.Component<{}, AppState> implements StateStore {
  public readonly state!: AppState;
  public readonly syncWithHash!: SyncWithHash;
  public readonly addAccount!: AddAccount;
  public readonly replaceAccount!: ReplaceAccount;
  public readonly removeAccount!: RemoveAccount;
  public readonly toggleRepo!: ToggleRepo;

  public constructor(props: Readonly<{}>) {
    super(props);
    StateStore.mixin(this);
  }

  public render() {
    return [
      <FirstTime key="first_time" addAccount={this.addAccount} />,
      <AccountList key="account_list"
        addAccount={this.addAccount}
        removeAccount={this.removeAccount}
        toggleRepo={this.toggleRepo}
        {...this.state}
      />,
    ];
  }
}
