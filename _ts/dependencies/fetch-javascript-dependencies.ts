import { fetch, FetchError, FetchResponse } from "../fetch";
import { GitHubRepo } from "../github/github-repo";
import { JsonPOJO } from "../util";
import { Dependencies } from "./dependencies";
import { noDependencies } from "./no-dependencies";

/**
 * Fetches JavaScript dependencies for the specified GitHub repo from David-DM
 */
export async function fetchJavaScriptDependencies(repo: GitHubRepo): Promise<FetchResponse<Dependencies>> {
  let url = `https://david-dm.org/${repo.full_name}/info.json`;

  let response = await fetch(url, (rawResponse) => {
    if (!isDavidResponseBody(rawResponse.rawBody)) {
      throw new FetchError(url, "returned an invalid dependency object", rawResponse.rawBody);
    }

    let { totals } = rawResponse.rawBody;

    return {
      ...rawResponse,
      ok: true,
      error: undefined,
      body: new Dependencies({
        total: totals.upToDate + totals.outOfDate,
        up_to_date: totals.upToDate,
        out_of_date: totals.outOfDate,
        advisories: totals.advisories,
        html_url: `https://david-dm.org/${repo.full_name}`,
        last_refresh: new Date(),
      }),
    };
  });

  if (response.error) {
    // David-DM returns an error if it's unable to determine the repo's dependencies.
    return noDependencies(url);
  }

  return response;
}

type VersionNumber = string;

interface DavidResponseBody {
  status: string;
  deps: Array<{
    name: string;
    required: VersionNumber;
    stable: VersionNumber;
    latest: VersionNumber;
    status: string;
    pinned: boolean;
    upToDate: boolean;
    advisories: JsonPOJO[];
  }>;
  totals: {
    upToDate: number;
    outOfDate: number;
    advisories: number;
    pinned: {
      upToDate: number;
      outOfDate: number;
    };
    unpinned: {
      upToDate: number;
      outOfDate: number;
    };
  };
}

// tslint:disable:no-any no-unsafe-any
export function isDavidResponseBody(body: any): body is DavidResponseBody {
  return body &&
    typeof body === "object" &&
    body.totals &&
    typeof body.totals === "object" &&
    typeof body.totals.upToDate === "number" &&
    typeof body.totals.outOfDate === "number" &&
    typeof body.totals.advisories === "number";
}
