import { ChangeEvent, FormEvent } from "react";
import { AddAccountProps } from "./props";

interface State {
  accountName: string;
}

export class AddAccount extends React.Component<AddAccountProps, State> {
  public readonly state: State = {
    accountName: "",
  };

  public render() {
    let { submitButtonText } = this.props;

    return (
      <form className="add-account form" onSubmit={this.handleSubmit}>
        <dl className="form-group">
          <dt className="input-label">
            <label htmlFor="repo_owner">GitHub Username</label>
          </dt>
          <dd className="input-field">
            <input type="text" name="account_name" className="form-control short"
              maxLength={100} autoFocus autoCapitalize="off" autoComplete="on" spellCheck={false}
              placeholder="GitHub Username"
              value={this.state.accountName} onChange={this.handleChange} />
          </dd>
        </dl>

        <button type="submit" className="btn btn-primary">{submitButtonText}</button>
      </form>
    );
  }

  private handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    this.setState({ accountName: event.target.value });
  }

  private handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (this.state.accountName) {
      this.props.addAccount(this.state.accountName.trim());
      this.setState({ accountName: "" });
    }
  }
}
