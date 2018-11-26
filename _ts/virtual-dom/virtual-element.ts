import { VirtualNode, VirtualNodeOrPrimitive } from "./virtual-node";

export interface VirtualElement<P extends object = {}> {
  domNode?: Element;
  tag: keyof DomElements;
  props: P & IntrinsicProps;
  children: VirtualNode[];
}

export interface VirtualElementOf<T extends keyof DomElements, E extends DomElements[T]> extends VirtualElement {
  domNode?: DomElements[T];
  tag: T;
  props: VirtualElementProps<E>;
}

export interface IntrinsicProps {
  key?: string;
}

export type VirtualElementProps<E extends Element = Element> =
  IntrinsicProps &
  DomElementAttributes &
  DomElementProps<E, VirtualNodeOrPrimitive | VirtualNodeOrPrimitive[]>;
