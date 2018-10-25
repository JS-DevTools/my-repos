import { ChangeEvent, FormEvent } from "react";

interface Props {
  addAccount(name: string): void;
}

interface State {
  accountName: string;
}

export class AddAccountForm extends React.Component<Props, State> {
  public readonly state: State = {
    accountName: "",
  };

  public render() {
    return (
      <form id="add_account_form" onSubmit={this.handleSubmit}>
        <div className="clearfix">
          <dl className="form-group">
            <dt className="input-label">
              <label htmlFor="repo_owner">GitHub Username</label>
            </dt>
            <dd className="input-field">
              <input type="text" name="account_name" className="form-control short"
                maxLength={100} autoFocus autoCapitalize="off" autoComplete="off" spellCheck={false}
                value={this.state.accountName} onChange={this.handleChange} />
            </dd>
          </dl>

          <button type="submit" className="btn btn-primary">Add</button>
        </div>
      </form>
    );
  }

  private handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    this.setState({ accountName: event.target.value });
  }

  private handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (this.state.accountName) {
      this.props.addAccount(this.state.accountName);
      this.setState({ accountName: "" });
    }
  }
}
