export const dom = {
  createElement,

  edit: {
    dialog: getElement("edit_dialog") as HTMLDialogElement,
    form: getElement("edit_url_form") as HTMLFontElement,
    repoOwner: getElement("repo_owner") as HTMLInputElement,
    repoName: getElement("repo_name") as HTMLInputElement,
    include: getElement("include_button") as HTMLButtonElement,
    exclude: getElement("exclude_button") as HTMLButtonElement,
    cancel: getElement("cancel_button") as HTMLButtonElement,
    ok: getElement("ok_button") as HTMLButtonElement,
  }
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
