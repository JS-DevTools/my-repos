import { stateStore } from "../state-store";
import { Component, h } from "../virtual-dom";

export interface AddAccountProps {
  submitButtonText?: string;
}

export class AddAccount extends Component<AddAccountProps> {
  private login = "";

  public render() {
    let { submitButtonText } = this.props;
    let { login } = this;

    return (
      <form className="add-account form" onsubmit={this.handleSubmit}>
        <dl className="form-group">
          <dt className="input-label">
            <label htmlFor="repo_owner">GitHub Username</label>
          </dt>
          <dd className="input-field">
            <input type="text" name="account_name" className="form-control short"
              maxLength={100} autofocus autocapitalize="off" autocomplete="on" spellcheck={false}
              placeholder="GitHub Username" value={login} onchange={this.handleChange} />
          </dd>
        </dl>

        <button type="submit" className="btn btn-primary">
          {submitButtonText || "Add"}
        </button>
      </form>
    );
  }

  private readonly handleChange = (event: Event) => {
    let textInput = event.target as HTMLInputElement;
    this.login = textInput.value;
  }

  private readonly handleSubmit = async (event: Event) => {
    event.preventDefault();

    if (this.login) {
      stateStore.addAccount(this.login);
    }
  }
}
