import { Component } from "./component";
import { IntrinsicProps, VirtualElement, VirtualElementProps } from "./virtual-element";
import { VirtualNode } from "./virtual-node";

declare global {
  namespace JSX {
    interface Element extends VirtualElement { }

    interface ElementClass extends Component { }

    interface ElementAttributesProperty { props: VirtualElementProps; }

    interface ElementChildrenAttribute { children: VirtualNode[]; }

    interface IntrinsicAttributes extends IntrinsicProps { }

    interface IntrinsicClassAttributes<T> extends IntrinsicProps { }

    type IntrinsicElements = {
      [P in keyof DomElements]: VirtualElementProps<DomElements[P]>;
    };
  }
}
