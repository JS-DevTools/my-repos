import { VirtualElementComponent } from "./component";
import { VirtualElement } from "./virtual-element";

export type VirtualNode = VirtualElement | VirtualTextNode | VirtualElementComponent;
export type VirtualNodeOrPrimitive = VirtualNode | string | null | undefined | boolean;
export type VirtualNodesOrPrimitives = Array<VirtualNodeOrPrimitive | VirtualNodeOrPrimitive[]>;

export interface VirtualTextNode {
  domNode?: Node;
  text: string;
}
