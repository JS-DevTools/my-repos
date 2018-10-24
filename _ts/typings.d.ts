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
  new <P, S>(props: Readonly<P>): Component<P, S>;
}

declare class Component<P, S> {
  public readonly props: Readonly<P>;
  public readonly state: Readonly<S>;

  public getDefaultProps?(): P;
  public setState(state: S, callback?: () => void): void;
  public render(): void;
  public componentDidMount(): void;
  public componentWillUnmount(): void;
  public shouldComponentUpdate(nextProps: Readonly<P>, nextState: Readonly<S>, nextContext: any): boolean;
  public componentDidUpdate(prevProps: Readonly<P>, prevState: Readonly<S>): void;
  public forceUpdate(callBack?: () => void): void;

  // deprecated members
  public context: any;
  public refs: {};
}
