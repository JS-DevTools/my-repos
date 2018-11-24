// tslint:disable:unified-signatures
import { Component, ComponentClass, VirtualElementComponent } from "./component";
import { VirtualElement, VirtualElementOf, VirtualElementProps } from "./virtual-element";
import { VirtualNode, VirtualNodesOrPrimitives } from "./virtual-node";

const emptyArray = Object.freeze([]) as unknown as VirtualNode[];
const emptyObject = Object.freeze({}) as object;

type VirtualElementFactory<P extends object = {}> =
  (props: Readonly<P>, children: ReadonlyArray<VirtualNode>) => VirtualElement | VirtualElement[] | null;

/**
 * Creates a VirtualElement for the specified HTML or SVG tag
 */
export function h<T extends keyof DomElements, E extends DomElements[T]>(
  tag: T,
  props: VirtualElementProps<E> | null,
  ...children: VirtualNodesOrPrimitives
): VirtualElementOf<T, E> | null;

/**
 * Creates a VirtualElement using a function component
 */
export function h<P extends object = {}>(
  factory: VirtualElementFactory<P>,
  props?: P | null,
  ...children: VirtualNodesOrPrimitives
): VirtualElement<P> | null;

/**
 * Creates a VirtualElement using a component class
 */
export function h<P extends object = {}>(
  factory: ComponentClass<P>,
  props?: P | null,
  ...children: VirtualNodesOrPrimitives
): VirtualElement<P> | null;

/**
 * Creates a VirtualNode object.  Children are converted to VirtualNodes, if necessary.
 */
export function h(
  tagOrFactory: keyof DomElements | VirtualElementFactory | ComponentClass,
  props: object | null,
  ...children: VirtualNodesOrPrimitives
): VirtualNode | VirtualNode[] | null {

  props = props || emptyObject;
  let childNodes = createChildNodes(children);

  switch (typeof tagOrFactory) {
    case "string":
      return {
        tag: tagOrFactory,
        props,
        children: childNodes,
      };

    case "function":
      if (tagOrFactory.prototype instanceof Component) {
        let Class = tagOrFactory as ComponentClass;
        let component = new Class(props, childNodes);
        let node = component.render();
        if (node) {
          (node as VirtualElementComponent).component = component;
        }
        return node;
      }
      else {
        let factory = tagOrFactory as VirtualElementFactory;
        return factory(props, childNodes);
      }

    default:
      throw new TypeError(`Invalid node type: ${typeof tagOrFactory}`);
  }
}

/**
 * Filters and converts children to VirtualNodes, if necessary.
 */
function createChildNodes(children: VirtualNodesOrPrimitives): VirtualNode[] {
  if (children.length === 0) {
    return emptyArray;
  }

  let childNodes: VirtualNode[] = [];

  for (let child of children) {
    if (child) {
      switch (typeof child) {
        case "string":
          childNodes.push({ text: child });
          break;

        case "object":
          if (Array.isArray(child)) {
            let nodes = createChildNodes(child);
            childNodes.push(...nodes);
          }
          else {
            childNodes.push(child);
          }
          break;

        default:
          throw new TypeError(`Invalid child node type: ${typeof child}`);
      }
    }
  }

  return childNodes;
}
