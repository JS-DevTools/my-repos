

export class EditDashboardForm extends React.Component<{}, State> {
  public getInitialState() {
    return {
      accountName: ""
    };
  }

  public render() {
    return (
      <form id="add_account_form">
        <div className="clearfix">
          <dl className="form-group">
            <dt className="input-label">
              <label htmlFor="repo_owner">GitHub Username</label>
            </dt>
            <dd className="input-field">
              <input type="text" name="account_name" autoFocus
                maxLength={100} autoCapitalize="off" autoComplete="off" spellCheck={false}
                className="form-control short" />
            </dd>
          </dl>

          <button type="submit" className="btn btn-primary">Add</button>
        </div>
      </form>
    );
  }

  private async addAccount(event: Event) {
    event.preventDefault();
    // let accountName = dom.editDashboard.accountName.value.trim();
    // await fetchRepos(accountName);
    // dom.editDashboard.accountName.value = "";
  }
}


interface State {
  accountName: string;
}
