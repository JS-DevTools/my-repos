export const dom = {
  createElement,

  editDashboard: {
    dialog: getElement("edit_dashboard_dialog") as HTMLDialogElement,
    form: getElement("edit_dashboard_form") as HTMLFontElement,
    accountName: getElement("account_name") as HTMLInputElement,
    add: getElement("add_button") as HTMLButtonElement,
    cancel: getElement("cancel_button") as HTMLButtonElement,
    ok: getElement("ok_button") as HTMLButtonElement,
  },
};


function getElement(id: string): HTMLElement {
  let element = document.getElementById(id);
  if (!element) {
    throw new Error(`Unable to find the element "${id}"`);
  }
  return element;
}


function createElement(tagName: string, props: { [key: string]: unknown } = {}): HTMLElement {
  let element = document.createElement(tagName);

  for (let prop of Object.keys(props)) {
    // @ts-ignore
    element[prop] = props[prop];
  }

  return element;
}
