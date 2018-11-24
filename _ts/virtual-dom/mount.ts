import { SVG_NAMESPACE } from "../util";
import { setProp } from "./set-prop";
import { VirtualNode } from "./virtual-node";

/**
 * Creates actual DOM Nodes from VirtualNodes, and adds them as children of the specifid DOM element
 */
export function mountTo(parent: Element, children: VirtualNode | VirtualNode[], isSVG = false): void {
  if (!Array.isArray(children)) {
    children = [children];
  }

  isSVG = isSVG || parent.namespaceURI === SVG_NAMESPACE;

  for (let child of children) {
    let domNode = mount(child, isSVG);
    parent.appendChild(domNode);
  }
}

/**
 * Creates an actual DOM Node from the given VirtualNode
 */
export function mount(node: VirtualNode, isSVG = false): Node {
  if ("text" in node) {
    // Create a DOM text node
    node.domNode = document.createTextNode(node.text);
  }
  else {
    isSVG = isSVG || node.tag === "svg";

    // Create the DOM element
    if (isSVG) {
      node.domNode = document.createElementNS(SVG_NAMESPACE, node.tag);
    }
    else {
      node.domNode = document.createElement(node.tag);
    }

    // Set the element's properties and attributes
    for (let [key, value] of Object.entries(node.props)) {
      setProp(node.domNode, key, value);
    }

    // Mount child nodes to the newly-created element
    mountTo(node.domNode, node.children, isSVG);
  }

  return node.domNode;
}
