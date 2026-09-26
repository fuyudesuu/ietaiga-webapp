import { describe, expect, it } from "vitest";
import { parseRoute } from "./router";

describe("parseRoute", () => {
  it("maps hashes to routes", () => {
    expect(parseRoute("")).toEqual({ name: "overview" });
    expect(parseRoute("#/wallet/trips")).toEqual({ name: "wallet", tab: "trips" });
    expect(parseRoute("#/concerts/c-1")).toEqual({ name: "concert", id: "c-1" });
    expect(parseRoute("#/trips/t-1")).toEqual({ name: "trip", id: "t-1" });
    expect(parseRoute("#/nope")).toEqual({ name: "overview" });
  });
});
