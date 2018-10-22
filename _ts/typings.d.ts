/**
 * React global (served from CDN)
 */
declare var React: {
  createElement: Function;
  Component: ComponentConstructor;
};

/**
 * React-DOM global (served from CDN)
 */
declare var ReactDOM: {
  render: Function;
};

declare interface ComponentConstructor {
  new <P, S>(): Component<P, S>;
}

declare class Component<P, S> {
  context: any;
  props: P;
  state: S;
  refs: {};

  getDefaultProps?(): P;
  getInitialState(): S;
  setState(state: S, callback?: () => void): void;
  render(): void;
  componentDidMount(): void;
  componentWillUnmount(): void;
  componentDidUpdate(prevProps: P, prevState: S): void;
  forceUpdate(callBack?: () => void): void;
}
