import { describe, expect, it } from "vitest";
import { guestAuthService } from "./auth-service";

describe("guestAuthService", () => {
  it("always returns a guest actor", async () => {
    expect(await guestAuthService.getActor()).toEqual({ kind: "guest" });
  });
});
