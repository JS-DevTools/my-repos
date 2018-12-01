import { ApiClient } from "../api-client/api-client";
import { ApiResponse } from "../api-client/api-response";
import { mapResponse } from "../api-client/map-response";
import { GitHubRepo } from "../github/github-repo";
import { Dependencies } from "./dependencies";

export class PackageRegistry {
  private readonly _client: ApiClient = new ApiClient();

  /**
   * Fetches the dependencies for the specified GitHub repo
   */
  public async fetchDependencies(repo: GitHubRepo): Promise<ApiResponse<Dependencies>> {
    if (repo.language !== "JavaScript" && repo.language !== "TypeScript") {
      // Not yet implemented for this language
    }

    let rawResponse = new Response();
    return mapResponse<Dependencies>(rawResponse, (response) => ({
      ...response,
      ok: true,
      error: undefined,
      body: new Dependencies(),
    }));
  }
}
