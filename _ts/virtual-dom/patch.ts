import { POJO, SVG_NAMESPACE } from "../util";
import { flattenNodes } from "./flatten-nodes";
import { mount, mountTo } from "./mount";
import { setProp } from "./set-prop";
import { unmount, unmountFrom } from "./unmount";
import { VirtualNode, VirtualNodesOrNulls, VirtualTextNode } from "./virtual-node";

export function patch(parent: Element, oldChildren: VirtualNodesOrNulls, newChildren: VirtualNodesOrNulls, isSVG = false): void {
  isSVG = isSVG || parent.namespaceURI === SVG_NAMESPACE;
  let nodePairs = matchNodes(flattenNodes(oldChildren), flattenNodes(newChildren));

  for (let [oldNode, newNode] of nodePairs) {
    if (oldNode && newNode) {
      if (isSameType(oldNode, newNode)) {
        updateNode(oldNode, newNode, isSVG);
      }
      else {
        replaceNode(parent, oldNode, newNode, isSVG);
      }
    }
    else if (newNode) {
      mountTo(parent, newNode, isSVG);
    }
    else {
      unmountFrom(parent, oldNode!);
    }
  }
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
  if (oldNode.children.length > 0 || newNode.children.length > 0) {
    patch(newNode.domNode!, oldNode.children, newNode.children, isSVG);
  }
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

function getKey(node: VirtualNode | undefined, index: number): string | number {
  if (!node) {
    return index;
  }

  if ("text" in node) {
    return node.text;
  }
  else {
    return node.props.key || index;
  }
}

function matchNodes(oldNodes: VirtualNode[], newNodes: VirtualNode[]): Array<[VirtualNode?, VirtualNode?]> {
  let pairs: Array<[VirtualNode?, VirtualNode?]> = [];

  for (let i = 0; i < oldNodes.length; i++) {
    let oldNode = oldNodes[i];
    let oldKey = getKey(oldNode, i);
    let matchFound = false;

    for (let j = 0; j < newNodes.length; j++) {
      let newNode = newNodes[j];
      let newKey = getKey(newNode, j);

      if (oldKey === newKey) {
        matchFound = true;
        pairs.push([oldNode, newNode]);

        // Remove this node from the array so it won't be paired again.
        // Setting it to undefined ensures that the index of other nodes remain the same.
        // tslint:disable-next-line:no-any
        newNodes[j] = undefined as any;

        break;
      }
    }

    if (!matchFound) {
      pairs.push([oldNode, undefined]);
    }
  }

  // Any remaining newNodes have no corresponding oldNode
  for (let newNode of newNodes) {
    if (newNode) {
      pairs.push([undefined, newNode]);
    }
  }

  return pairs;
}
