export enum BuildStatus {
  Unknown,
  Success,
  Failed,
  Errored,
  Cacneled,
}

/**
 * Information about a GitHub repo's latest CI build
 */
export class Build {
  /**
   * The result of the latest CI build
   */
  public status = BuildStatus.Unknown;

  /**
   * The link to a web page that shows the latest build results
   */
  public html_url = "";

  /**
   * The date/time that the dependencies were last fetched from GitHub
   */
  public last_refresh = new Date(0);

  public constructor(props: Partial<Build> = {}) {
    Object.assign(this, props);
  }
}
