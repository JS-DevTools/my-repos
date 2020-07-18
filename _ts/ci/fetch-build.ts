import { FetchResponse } from "../fetch";
import { GitHubRepoKey } from "../github/github-repo";
import { Build, BuildStatus } from "./build";
import { fetchGitHubActionsBuild } from "./fetch-github-actions-build";
import { fetchTravisBuild } from "./fetch-travis-build";

/**
 * Fetches the dependencies for the specified GitHub repo
 */
export async function fetchBuild(repo: GitHubRepoKey): Promise<FetchResponse<Build>> {
  try {
    // Try to get the CI build from GitHub Actions first
    let response = await fetchGitHubActionsBuild(repo);

    if (response.ok && response.body.status !== BuildStatus.Unknown) {
      return response;
    }
    else {
      // There's no GitHub Actions build, so try Travis CI instead
      return await fetchTravisBuild(repo);
    }
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
