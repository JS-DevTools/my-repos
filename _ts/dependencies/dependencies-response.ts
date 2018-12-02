import { TypedResponse } from "../fetch";
import { Dependencies } from "./dependencies";

export function dependenciesResponse(props: Partial<TypedResponse<Dependencies>> = {}): TypedResponse<Dependencies> {
  return {
    ok: true,
    error: undefined,
    status: 200,
    statusText: "OK",
    url: "",
    headers: {
      "content-type": "application/json",
    },
    rawBody: "",
    body: props.body || new Dependencies(),
    ...props,
  };
}
