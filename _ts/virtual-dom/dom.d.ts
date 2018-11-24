interface DomElements extends HTMLElementTagNameMap, SVGElementTagNameMap {
  "main": HTMLMainElement;
}

// The "C" type parameter is used to override the Element.children property
// so it accepts VirtuaNodes rather than Elements.  This is hacky, but
// required to satisfy TypeScript's JSX type checking
type DomElementProps<E extends Element, C> = {
  [P in keyof E]?: E[P] extends HTMLCollection ? C : E[P];
};
