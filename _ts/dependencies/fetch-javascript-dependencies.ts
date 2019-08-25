import { fetch, FetchError, FetchResponse } from "../fetch";
import { GitHubRepoKey } from "../github/github-repo";
import { JsonPOJO } from "../util";
import { Dependencies, DependencyTotals } from "./dependencies";
import { dependenciesResponse } from "./dependencies-response";

/**
 * Fetches JavaScript dependencies for the specified GitHub repo from David-DM
 */
export async function fetchJavaScriptDependencies(repo: GitHubRepoKey): Promise<FetchResponse<Dependencies>> {
  let [devDepsResponse, runtimeDepsResponse] = await Promise.all([
    fetchDependencyTotals(repo, "dev"),
    fetchDependencyTotals(repo, "runtime"),
  ]);

  let dependencies = new Dependencies({
    last_refresh: new Date(),
  });

  if (devDepsResponse.ok) {
    dependencies.dev = devDepsResponse.body;
  }

  if (runtimeDepsResponse.ok) {
    dependencies.runtime = runtimeDepsResponse.body;
  }

  return dependenciesResponse({ body: dependencies });
}

/**
 * Fetches the development or runtime dependency totals from David-DM
 */
async function fetchDependencyTotals(repo: GitHubRepoKey, type: "dev" | "runtime"):
Promise<FetchResponse<DependencyTotals>> {
  let url: string, html_url: string;

  if (type === "dev") {
    url = `https://david-dm.org/${repo.full_name}/dev-info.json`;
    html_url = `https://david-dm.org/${repo.full_name}?type=dev`;
  }
  else {
    url = `https://david-dm.org/${repo.full_name}/info.json`;
    html_url = `https://david-dm.org/${repo.full_name}`;
  }

  return fetch(url, (response) => {
    if (!isDavidResponseBody(response.rawBody)) {
      throw new FetchError(url, "returned an invalid dependency object", response.rawBody);
    }

    let { totals } = response.rawBody;

    return {
      ...response,
      ok: true,
      error: undefined,
      body: {
        total: totals.upToDate + totals.outOfDate,
        up_to_date: totals.upToDate,
        out_of_date: totals.outOfDate,
        advisories: totals.advisories,
        html_url,
      },
    };
  });
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
