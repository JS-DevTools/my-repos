import { POJO, SVG_NAMESPACE } from "../util";
import { mount, mountTo } from "./mount";
import { setProp } from "./set-prop";
import { unmount, unmountFrom } from "./unmount";
import { VirtualNode, VirtualTextNode } from "./virtual-node";

export function patch(parent: Element, oldChildren: VirtualNode | VirtualNode[], newChildren: VirtualNode | VirtualNode[], isSVG = false): void {
  if (!Array.isArray(oldChildren)) {
    oldChildren = [oldChildren];
  }
  if (!Array.isArray(newChildren)) {
    newChildren = [newChildren];
  }

  isSVG = isSVG || parent.namespaceURI === SVG_NAMESPACE;
  let remainingOldChildren = oldChildren.slice();

  for (let i = 0; i < newChildren.length; i++) {
    let newNode = newChildren[i];
    let newKey = getKey(newNode, i);
    let oldNode = splice(remainingOldChildren, newKey);

    if (oldNode) {
      if (isSameType(oldNode, newNode)) {
        updateNode(oldNode, newNode, isSVG);
      }
      else {
        replaceNode(parent, oldNode, newNode, isSVG);
      }
    }
    else {
      mountTo(parent, newNode, isSVG);
    }
  }

  unmountFrom(parent, remainingOldChildren);
}

function updateNode(oldNode: VirtualNode, newNode: VirtualNode, isSVG: boolean) {
  // The same DOM Node now represents a different VirtualNode
  newNode.domNode = oldNode.domNode;

  // Simple logic for text nodes
  if ("text" in oldNode || "text" in newNode) {
    let oldText = (oldNode as VirtualTextNode).text;
    let newText = (newNode as VirtualTextNode).text;

    if (oldText !== newText) {
      oldNode.domNode!.nodeValue = newText;
    }

    return;
  }

  // Update each property that has changed
  for (let [key, value] of Object.entries(newNode.props)) {
    let oldValue = (oldNode.props as POJO)[key];
    if (value !== oldValue) {
      setProp(newNode.domNode!, key, value);
    }
  }

  // Unset any props that were previous set but aren't anymore
  for (let key in oldNode.props) {
    if (!(key in newNode.props)) {
      setProp(newNode.domNode!, key, undefined);
    }
  }

  // Patch grandchildren
  patch(newNode.domNode!, oldNode.children, newNode.children, isSVG);
}

function replaceNode(parent: Element, oldNode: VirtualNode, newNode: VirtualNode, isSVG: boolean) {
  unmount(oldNode);
  mount(newNode, isSVG);
  parent.replaceChild(newNode.domNode!, oldNode.domNode!);
}

function isSameType(nodeA: VirtualNode, nodeB: VirtualNode): boolean {
  if ("text" in nodeA && "text" in nodeB) {
    // They're both text nodes
    return true;
  }
  else if ("text" in nodeA || "text" in nodeB) {
    // One is a text node, but not the other
    return false;
  }
  else {
    // Are they the same HTML tag?
    return nodeA.tag === nodeB.tag;
  }
}

function getKey(node: VirtualNode, index: number): string | number {
  if ("text" in node) {
    return node.text;
  }
  else {
    return node.props.key || index;
  }
}

function splice(nodes: VirtualNode[], key: string | number): VirtualNode | undefined {
  for (let i = 0; i < nodes.length; i++) {
    let node = nodes[i];
    let nodeKey = getKey(node, i);

    if (nodeKey === key) {
      nodes.splice(i, 1);
      return node;
    }
  }
}
