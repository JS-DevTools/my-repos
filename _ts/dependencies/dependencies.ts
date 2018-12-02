/**
 * Information about a GitHub repo's dependencies
 */
export class Dependencies {
  /**
   * The total number of dependencies
   */
  public total = 0;

  /**
   * The number of dependencies that are up-to-date
   */
  public up_to_date = 0;

  /**
   * The number of dependencies that are out-of-date
   */
  public out_of_date = 0;

  /**
   * The number of dependencies that have security advistories
   */
  public advisories = 0;

  /**
   * The link to a web page that shows the package's dependencies
   */
  public html_url = "";

  /**
   * The date/time that the dependencies were last fetched from GitHub
   */
  public last_refresh = new Date(0);

  public constructor(props: Partial<Dependencies> = {}) {
    Object.assign(this, props);
  }
}
