import { TypedResponse } from "../fetch";
import { Dependencies } from "./dependencies";

export function noDependencies(url: string = ""): TypedResponse<Dependencies> {
  return {
    ok: true,
    error: undefined,
    status: 200,
    statusText: "OK",
    url,
    headers: {
      "content-type": "application/json",
    },
    rawBody: "",
    body: new Dependencies({
      last_refresh: new Date(),
    }),
  };
}
