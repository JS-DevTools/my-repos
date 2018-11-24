import { VirtualNode } from "./virtual-node";

/**
 * Removes the actual DOM Nodes that correspond to the specified VirtualNodes
 */
export function unmountFrom(parent: Element, nodes: VirtualNode | VirtualNode[]): void {
  if (!Array.isArray(nodes)) {
    nodes = [nodes];
  }

  for (let node of nodes) {
    unmount(node);
    parent.removeChild(node.domNode!);
  }
}

/**
 * Triggers the "onUnload" logic for the given VirtualNode and its descendants
 */
export function unmount(node: VirtualNode): void {
  if ("children" in node) {
    for (let child of node.children) {
      unmount(child);
    }
  }

  if ("component" in node) {
    node.component.onUnmount();
  }
}
