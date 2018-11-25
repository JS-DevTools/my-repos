import { VirtualNode, VirtualNodesOrNulls } from "./virtual-node";

/**
 * Flattens a possibly-nested array of VirtualNodes, and removes any nulls
 */
export function flattenNodes(nodes: VirtualNodesOrNulls): VirtualNode[] {
  let flattened: VirtualNode[] = [];

  if (Array.isArray(nodes)) {
    for (let node of nodes) {
      if (node) {
        flattened.push(...flattenNodes(node as VirtualNodesOrNulls));
      }
    }
  }
  else if (nodes) {
    flattened.push(nodes);
  }

  return flattened;
}
