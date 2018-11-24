import { IntrinsicProps, VirtualElement } from "./virtual-element";
import { VirtualNode } from "./virtual-node";

export type ComponentProps<P extends object> = P & IntrinsicProps;

export interface VirtualElementComponent<P extends object = {}> extends VirtualElement {
  component: Component<P>;
}

export interface ComponentClass<P extends object = {}> {
  new(props: P, children: VirtualNode[]): Component<P>;
}

export abstract class Component<P extends object = {}> {
  public props: ComponentProps<P>;
  public children: VirtualNode[];

  public constructor(props?: ComponentProps<P>, children?: VirtualNode[]) {
    this.props = props || {} as ComponentProps<P>;
    this.children = children || [];
  }

  public abstract render(): VirtualElement | null;

  // tslint:disable-next-line:no-empty
  public onUnmount() { }
}
