/* eslint-disable @typescript-eslint/no-invalid-this */
import * as React from "react";
import { ChangeEvent, FormEvent } from "react";
import { stateStore } from "../state-store";

export interface AddAccountProps {
  submitButtonText?: string;
}

interface State {
  login: string;
}

export class AddAccount extends React.Component<AddAccountProps, State> {
  public readonly state: State = {
    login: "",
  };

  public render() {
    let { submitButtonText } = this.props;
    let { login } = this.state;

    return (
      <form className="add-account form" onSubmit={this.handleSubmit}>
        <dl className="form-group">
          <dt className="input-label">
            <label htmlFor="repo_owner">GitHub Username</label>
          </dt>
          <dd className="input-field">
            <input type="text" name="account_name" className="form-control short"
              maxLength={100} autoFocus autoCapitalize="off" autoComplete="on" spellCheck={false}
              placeholder="GitHub Username" value={login} onChange={this.handleChange} />
          </dd>
        </dl>

        <button type="submit" className="btn btn-primary">
          {submitButtonText || "Add"}
        </button>
      </form>
    );
  }

  private readonly handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    this.setState({ login: event.target.value });
  };

  private readonly handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (this.state.login) {
      stateStore.addAccount(this.state);
      this.setState({ login: "" });
    }
  };
}
