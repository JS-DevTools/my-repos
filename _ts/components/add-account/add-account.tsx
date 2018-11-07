import { ChangeEvent, FormEvent } from "react";
import { AddAccountProps } from "./props";

interface State {
  accountName: string;
  busy: boolean;
}

export class AddAccount extends React.Component<AddAccountProps, State> {
  public readonly state: State = {
    accountName: "",
    busy: false,
  };

  public render() {
    let { submitButtonText } = this.props;
    let { accountName, busy } = this.state;

    return (
      <form className={`add-account form ${busy ? "busy" : ""}`} onSubmit={this.handleSubmit}>
        <dl className="form-group">
          <dt className="input-label">
            <label htmlFor="repo_owner">GitHub Username</label>
          </dt>
          <dd className="input-field">
            <input type="text" name="account_name" className="form-control short"
              maxLength={100} autoFocus autoCapitalize="off" autoComplete="on" spellCheck={false}
              placeholder="GitHub Username" disabled={busy}
              value={accountName} onChange={this.handleChange} />
          </dd>
        </dl>

        <button type="submit" className="btn btn-primary" disabled={busy}>
          {submitButtonText}
        </button>
      </form>
    );
  }

  private handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    this.setState({ accountName: event.target.value });
  }

  private handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (this.state.accountName) {
      this.setState({ busy: true });
      await this.props.addAccount(this.state.accountName.trim());
      this.setState({ accountName: "", busy: false });
    }
  }
}
