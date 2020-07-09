import { fetch, FetchError, FetchResponse } from "../fetch";
import { GitHubRepoKey } from "../github/github-repo";
import { Build, BuildStatus } from "./build";

/**
 * Fetches the latest Travis CI build for the specified GitHub repo
 */
export async function fetchTravisBuild(repo: GitHubRepoKey): Promise<FetchResponse<Build>> {
  let url = `https://api.travis-ci.org/repos/${repo.full_name}`;

  let response = await fetch(url, (rawResponse) => {
    if (!isTravisResponseBody(rawResponse.rawBody)) {
      throw new FetchError(url, "returned an invalid build object", rawResponse.rawBody);
    }

    let { active, last_build_id, last_build_status } = rawResponse.rawBody;
    let build = new Build({ last_refresh: new Date() });

    if (active && last_build_id) {
      build.status = mapStatus(last_build_status);
      build.html_url = `https://travis-ci.org/${repo.full_name}/builds/${last_build_id}`;
    }

    return {
      ...rawResponse,
      ok: true,
      error: undefined,
      body: build,
    };
  });

  if (response.status === 404) {
    // This repo isn't on Travis CI.  Don't treat thsi as an error.
    // Treat it as an unknown build status.
    response = {
      ok: true,
      error: undefined,
      status: 200,
      statusText: "OK",
      url: "",
      headers: {
        "content-type": "application/json",
      },
      rawBody: "",
      body: new Build(),
    };
  }

  return response;
}

enum TravisBuildStatus {
  Success = 0,
  Failed = 1,
}

interface TravisResponseBody {
  id: number;
  slug: string;
  description: string;
  public_key: string;
  active: boolean;
  last_build_id: number | null;
  last_build_number: string | null;
  last_build_status: TravisBuildStatus | null;
  last_build_result: TravisBuildStatus | null;
  last_build_duration: number | null;
  last_build_started_at: Date | null;
  last_build_finished_at: Date | null;
}

/**
 * Maps a Travis CI build status to a BuildStatus enumeration value
 */
function mapStatus(last_build_status: TravisBuildStatus | null) {
  switch (last_build_status) {
    case TravisBuildStatus.Failed:
      return BuildStatus.Failed;
    case TravisBuildStatus.Success:
      return BuildStatus.Success;
    default:
      // Null means that the build errored or was canceled
      return BuildStatus.Errored;
  }
}

export function isTravisResponseBody(body: unknown): body is TravisResponseBody {
  let travis = body as TravisResponseBody;

  return travis &&
    typeof travis === "object" &&
    typeof travis.id === "number" &&
    (travis.active === null || typeof travis.active === "boolean") &&
    (travis.last_build_id === null || typeof travis.last_build_id === "number") &&
    (travis.last_build_status === null || typeof travis.last_build_status === "number");
}
