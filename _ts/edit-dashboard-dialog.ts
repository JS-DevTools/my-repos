import { Dialog } from "./dialog";
import { dom } from "./dom";
import { params } from "./params";

class EditDashboardDialog extends Dialog {
  public constructor() {
    super(dom.editDashboard.dialog);

    dom.editDashboard.form.addEventListener("submit", this.addAccount.bind(this));
    dom.editDashboard.add.addEventListener("click", this.addAccount.bind(this));
  }


  protected updateUI(): void {
    if (params.isEmpty) {
      dom.editDashboard.ok.disabled = true;
    }
  }


  private async addAccount(event: Event) {
    event.preventDefault();
    let accountName = dom.editDashboard.accountName.value.trim();
    // await fetchRepos(accountName);
    dom.editDashboard.accountName.value = "";
  }
}

export const editDashboardDialog = new EditDashboardDialog();
