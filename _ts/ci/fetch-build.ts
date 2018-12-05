import { FetchResponse } from "../fetch";
import { GitHubRepoKey } from "../github/github-repo";
import { Build } from "./build";
import { fetchTravisBuild } from "./fetch-travis-build";

/**
 * Fetches the dependencies for the specified GitHub repo
 */
export async function fetchBuild(repo: GitHubRepoKey): Promise<FetchResponse<Build>> {
  try {
    // We currently only support Travis CI
    return fetchTravisBuild(repo);
  }
  catch (error) {
    return {
      ok: false,
      error: error as Error,
      status: 400,
      statusText: "Client Error",
      url: "",
      headers: {},
      rawBody: "",
    };
  }
}
