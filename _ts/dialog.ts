import { dom } from "./dom";

export abstract class Dialog {
  private _element: HTMLDialogElement;


  protected constructor(element: HTMLDialogElement) {
    this._element = element;
  }


  public showModal(): void {
    this.updateUI();

    this._element.className = "open";

    if (typeof this._element.showModal === "function") {
      this._element.showModal();
    }
    else {
      // <dialog> Polyfill
      let backdrop = dom.createElement("div", { className: "backdrop" });
      this._element.insertAdjacentElement("afterend", backdrop);
      this._element.setAttribute("open", "");
    }
  }


  public close(): void {
    this._element.className = "closed";

    if (typeof this._element.close === "function") {
      this._element.close();
    }
    else {
      // <dialog> Polyfill
      this._element.removeAttribute("open");
      let backdrop = this._element.nextElementSibling;
      if (backdrop && backdrop.className === "backdrop") {
        backdrop.remove();
      }
    }
  }


  protected abstract updateUI(): void;
}
