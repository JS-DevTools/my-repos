import { mount, patch, PetitDom, unmount } from "petit-dom";

export abstract class Component<P extends object = object> implements PetitDom.Component<P> {
  private _props: P;
  private _content: PetitDom.Content[];
  private _vnode?: PetitDom.VNode;

  public get props(): Readonly<P> {
    return this._props;
  }

  public get content(): ReadonlyArray<Readonly<PetitDom.Content>> {
    return this._content;
  }

  // @ts-ignore - Not sure why TypeScript doesn't like assigning {} to P
  public constructor(props: P = {}, content: PetitDom.Content[] = []) {
    this._props = props;
    this._content = content;
  }

  public mount(): Element {
    this._vnode = this.render();
    let domNode = mount(this._vnode);
    return domNode;
  }

  public patch(element: Element, props: P, old: P, content: PetitDom.Content[]): Element {
    this._props = props;
    this._content = content;
    this.updateUI();
    return element;
  }

  public unmount(): void {
    unmount(this._vnode!);
  }

  public updateUI(): void {
    let oldVNode = this._vnode!;
    let newVNode = this._vnode = this.render();
    patch(newVNode, oldVNode);
  }

  public abstract render(): PetitDom.VNode;
}
