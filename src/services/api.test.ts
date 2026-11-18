import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { makeStore } from "@/app/store";
import { authApi } from "@/features/auth/auth-api";
import { sessionReceived } from "@/features/auth/auth-slice";

// The base query against a fake API: the access token expires, the client
// refreshes once (from the cookie) and replays the call.

const user = {
  id: "u1",
  email: "jane@example.com",
  phone: null,
  fullName: "Jane",
  roles: [],
};
const session = (accessToken: string) => ({
  success: true,
  data: { accessToken, tokenType: "Bearer", expiresIn: 900, user },
});
const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });

type Call = { url: string; auth: string | null; lang: string | null };

let calls: Call[];
let refreshAnswers: Response[];

beforeEach(() => {
  calls = [];
  refreshAnswers = [];
  vi.stubGlobal(
    "fetch",
    vi.fn(async (input: Request) => {
      const url = new URL(input.url).pathname;
      const auth = input.headers.get("Authorization");
      calls.push({ url, auth, lang: input.headers.get("X-Lang") });
      if (url === "/v1/auth/refresh") {
        return refreshAnswers.shift() ?? json(401, { success: false });
      }
      if (url === "/v1/me") {
        return auth === "Bearer fresh"
          ? json(200, { success: true, data: { ...user, registeredAt: "x" } })
          : json(401, { success: false, message: "Invalid or expired token" });
      }
      return json(404, { success: false });
    }),
  );
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("baseQueryWithReauth", () => {
  it("refreshes once on a 401, then replays the request", async () => {
    const store = makeStore();
    store.dispatch(sessionReceived(session("stale").data as never));
    refreshAnswers.push(json(200, session("fresh")));

    const result = await store.dispatch(authApi.endpoints.me.initiate());

    expect(result.data?.email).toBe("jane@example.com");
    expect(calls.map((c) => [c.url, c.auth])).toEqual([
      ["/v1/me", "Bearer stale"],
      ["/v1/auth/refresh", "Bearer stale"],
      ["/v1/me", "Bearer fresh"],
    ]);
    expect(store.getState().auth.accessToken).toBe("fresh");
    expect(calls[0].lang).toBeTruthy();
  });

  it("shares one refresh between concurrent 401s", async () => {
    const store = makeStore();
    store.dispatch(sessionReceived(session("stale").data as never));
    refreshAnswers.push(json(200, session("fresh")));

    await Promise.all([
      store.dispatch(
        authApi.endpoints.me.initiate(undefined, { forceRefetch: true }),
      ),
      store.dispatch(authApi.endpoints.refresh.initiate()),
    ]);

    expect(calls.filter((c) => c.url === "/v1/auth/refresh")).toHaveLength(1);
  });

  it("retries the refresh after 409 REFRESH_TOKEN_ROTATED (another tab won)", async () => {
    const store = makeStore();
    refreshAnswers.push(
      json(409, { success: false, code: "REFRESH_TOKEN_ROTATED" }),
      json(200, session("fresh")),
    );

    await store.dispatch(authApi.endpoints.refresh.initiate());

    expect(store.getState().auth.status).toBe("authenticated");
  });

  it("signs out locally when the refresh is refused", async () => {
    const store = makeStore();
    refreshAnswers.push(json(401, { success: false }));

    await store.dispatch(authApi.endpoints.refresh.initiate());

    expect(store.getState().auth).toMatchObject({
      status: "guest",
      accessToken: null,
    });
  });
});
