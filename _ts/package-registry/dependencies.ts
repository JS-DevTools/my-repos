export class Dependencies {
  public loaded = false;
  public total = 0;
  public out_of_date = 0;
  public up_to_date = 0;
  public advisories = 0;
  public html_url = "";

  public constructor(props: Partial<Dependencies> = {}) {
    Object.assign(this, props);
  }
}
