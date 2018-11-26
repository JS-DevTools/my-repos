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
      <form class="add-account form" onsubmit={this.handleSubmit}>
        <dl class="form-group">
          <dt class="input-label">
            <label htmlFor="repo_owner">GitHub Username</label>
          </dt>
          <dd class="input-field">
            <input type="text" name="account_name" class="form-control short"
              maxLength={100} autofocus autocapitalize="off" autocomplete="on" spellcheck={false}
              placeholder="GitHub Username" value={login} onchange={this.handleChange} />
          </dd>
        </dl>

        <button type="submit" class="btn btn-primary">
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
