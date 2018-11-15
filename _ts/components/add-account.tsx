import { ChangeEvent, FormEvent } from "react";
import { stateStore } from "../state-store";

export interface AddAccountProps {
  submitButtonText?: string;
}

interface State {
  login: string;
  busy: boolean;
}

export class AddAccount extends React.Component<AddAccountProps, State> {
  public readonly state: State = {
    login: "",
    busy: false,
  };

  public render() {
    let { submitButtonText } = this.props;
    let { login, busy } = this.state;

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
              value={login} onChange={this.handleChange} />
          </dd>
        </dl>

        <button type="submit" className="btn btn-primary" disabled={busy}>
          {submitButtonText || "Add"}
        </button>
      </form>
    );
  }

  private readonly handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    this.setState({ login: event.target.value });
  }

  private readonly handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (this.state.login) {
      this.setState({ busy: true });
      await stateStore.addAccount(this.state.login);
      this.setState({ login: "", busy: false });
    }
  }
}
