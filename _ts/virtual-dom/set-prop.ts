import { POJO } from "../util";

const knownProps: ReadonlySet<string> = new Set([
  "className", "value", "checked", "selected", "innerHTML"
]);

/**
 * Updates the specified property or attribute of the given DOM Element.
 */
export function setProp(element: Element, key: string, value: unknown): void {
  if (isProperty(key, value)) {
    (element as POJO)[key] = value;
  }
  else {
    if (value === true) {
      element.setAttribute(key, "");
    }
    else if (value === false) {
      element.removeAttribute(key);
    }
    else {
      element.setAttribute(key, String(value));
    }
  }
}

function isProperty(key: string, value: unknown): boolean {
  if (knownProps.has(key) || key.startsWith("on")) {
    return true;
  }

  let type = typeof value;
  return value && (type === "object" || type === "function");
}
