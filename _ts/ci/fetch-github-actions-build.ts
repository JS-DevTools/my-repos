import { fetch, FetchError, FetchResponse } from "../fetch";
import { GitHubRepoKey } from "../github/github-repo";
import { Build, BuildStatus } from "./build";

/**
 * Fetches the latest GitHub Actions build for the specified GitHub repo
 */
export async function fetchGitHubActionsBuild(repo: GitHubRepoKey): Promise<FetchResponse<Build>> {
  let url = `https://api.github.com/repos/${repo.full_name}/actions/runs?branch=master&per_page=1`;

  let response = await fetch(url, (rawResponse) => {
    if (!isGitHubActionsResponseBody(rawResponse.rawBody)) {
      throw new FetchError(url, "returned an invalid build object", rawResponse.rawBody);
    }

    let { workflow_runs } = rawResponse.rawBody;
    let build = new Build({ last_refresh: new Date() });

    if (workflow_runs.length > 0) {
      // The first run in the array is the most recent one
      let run = workflow_runs[0];

      build.status = mapStatus(run);
      build.html_url = run.html_url;
    }

    return {
      ...rawResponse,
      ok: true,
      error: undefined,
      body: build,
    };
  });

  if (response.status === 404) {
    // This repo isn't using GitHub Actions.  Don't treat thsi as an error.
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

interface GitHubActionsResponseBody {
  total_count: number;
  workflow_runs: GitHubActionsRun[];
}

interface GitHubActionsRun {
  id: number;
  workflow_id: number;
  run_number: number;
  event: "push" | "schedule";
  status: "queued" | "in_progress" | "completed";
  conclusion: null | "success" | "failure" | "neutral" | "cancelled" | "skipped" | "stale" | "timed_out" | "action_required";
  html_url: string;
  created_at: string;
  updated_at: string;
}

/**
 * Maps a GitHub Actions build status to a BuildStatus enumeration value
 */
function mapStatus(run: GitHubActionsRun) {
  switch (run.conclusion) {
    case "success":
      return BuildStatus.Success;

    case "failure":
      return BuildStatus.Failed;

    case "neutral":
    case "cancelled":
    case "skipped":
    case "stale":
      return BuildStatus.Cacneled;

    case "timed_out":
    case "action_required":
    default:
      return BuildStatus.Errored;
  }
}

export function isGitHubActionsResponseBody(body: unknown): body is GitHubActionsResponseBody {
  let github = body as GitHubActionsResponseBody;

  return github &&
    typeof github === "object" &&
    typeof github.total_count === "number" &&
    Array.isArray(github.workflow_runs) &&
    github.workflow_runs.every((run) =>
      typeof run.id === "number" &&
      typeof run.workflow_id === "number" &&
      typeof run.run_number === "number" &&
      typeof run.event === "string" &&
      typeof run.status === "string" &&
      (run.conclusion === null || typeof run.conclusion === "string") &&
      typeof run.html_url === "string" &&
      typeof run.created_at === "string" &&
      typeof run.updated_at === "string"
    );
}
