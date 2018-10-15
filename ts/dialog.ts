import { dom } from "./dom";
import { params } from "./params";

class EditUrlDialog {
  public constructor() {
    dom.edit.form.addEventListener("submit", this.includeRepo.bind(this));
    dom.edit.exclude.addEventListener("click", this.excludeRepo.bind(this));
  }


  public showModal(): void {
    this.updateUI();
    let me = dom.edit.dialog;

    me.className = "open";

    if (typeof me.showModal === "function") {
      me.showModal();
    }
    else {
      // <dialog> Polyfill
      let backdrop = dom.createElement("div", { className: "backdrop" });
      me.insertAdjacentElement("afterend", backdrop);
      me.setAttribute("open", "");
    }
  }


  public close(): void {
    let me = dom.edit.dialog;

    me.className = "closed";

    if (typeof me.close === "function") {
      me.close();
    }
    else {
      // <dialog> Polyfill
      me.removeAttribute("open");
      let backdrop = me.nextElementSibling;
      if (backdrop && backdrop.className === "backdrop") {
        backdrop.remove();
      }
    }
  }


  private includeRepo(event: Event): void {
    event.preventDefault();

    let repoName = this.getFullRepoName();
    if (!repoName) {
      return;
    }

    params.include(repoName);
    dom.edit.repoOwner.value = "";
    dom.edit.repoName.value = "";
    this.updateUI();
  }


  private excludeRepo(): void {
    let repoName = this.getFullRepoName();
    if (!repoName) {
      return;
    }

    this.updateUI();
  }


  private getFullRepoName(): string | undefined {
    let owner = dom.edit.repoOwner.value.trim().toLowerCase();
    let repo = dom.edit.repoName.value.trim().toLowerCase();

    if (owner && repo) {
      return `${owner}/${repo}`;
    }
  }


  private updateUI(): void {
    if (params.isNew) {
      dom.edit.cancel.style.display = "none";
      dom.edit.ok.innerText = "Show My Dashboard";
    }
    else {
      dom.edit.cancel.style.display = "";
      dom.edit.ok.innerText = "Update Dashboard";
    }

    if (params.isEmpty) {
      dom.edit.ok.disabled = true;
    }
  }
}

export const dialog = new EditUrlDialog();
