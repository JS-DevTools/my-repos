/**
 * Information about a GitHub repo's dependencies
 */
export class Dependencies {
  /**
   * Development dependencies
   */
  public dev: DependencyTotals = {
    total: 0,
    up_to_date: 0,
    out_of_date: 0,
    advisories: 0,
    html_url: "",
  };

  /**
   * Runtime dependencies
   */
  public runtime: DependencyTotals = {
    total: 0,
    up_to_date: 0,
    out_of_date: 0,
    advisories: 0,
    html_url: "",
  };

  /**
   * The date/time that the dependencies were last fetched from GitHub
   */
  public last_refresh = new Date(0);

  public constructor(props: PartialDependencies = {}) {
    Object.assign(this, props);
  }
}

export interface PartialDependencies {
  dev?: Partial<DependencyTotals>;
  runtime?: Partial<DependencyTotals>;
  last_refresh?: Date;
}

export interface DependencyTotals {
  /**
   * The total number of dependencies
   */
  total: number;

  /**
   * The number of dependencies that are up-to-date
   */
  up_to_date: number;

  /**
   * The number of dependencies that are out-of-date
   */
  out_of_date: number;

  /**
   * The number of dependencies that have security advistories
   */
  advisories: number;

  /**
   * The link to a web page that shows the package's dependencies
   */
  html_url: string;
}
