import { describe, it, expect, vi, afterEach } from "vitest";
import { analyzeFile } from "./api.js";

describe("analyzeFile", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("sends a POST to /api/v1/analyze with base64-encoded content", async () => {
    const mockResponse = {
      type: "x509",
      entries: [],
      issues: [],
    };

    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockResponse,
    });
    vi.stubGlobal("fetch", fetchMock);

    // Create a minimal fake File with 3 bytes.
    const bytes = new Uint8Array([0x41, 0x42, 0x43]); // "ABC"
    const file = new File([bytes], "test.pem", { type: "text/plain" });

    const result = await analyzeFile(file);
    expect(result).toEqual(mockResponse);

    expect(fetchMock).toHaveBeenCalledOnce();
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("/api/v1/analyze");
    expect(init.method).toBe("POST");

    const body = JSON.parse(init.body as string);
    expect(body.filename).toBe("test.pem");
    // base64("ABC") = "QUJD"
    expect(body.content).toBe("QUJD");
    expect(body.password).toBeUndefined();
  });

  it("includes password when provided", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ type: "pkcs7", entries: [], issues: [] }),
    });
    vi.stubGlobal("fetch", fetchMock);

    const file = new File([new Uint8Array([0x30])], "test.p12");
    await analyzeFile(file, "secret");

    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    const body = JSON.parse(init.body as string);
    expect(body.password).toBe("secret");
  });

  it("throws on non-ok response", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      status: 400,
      text: async () => "bad request",
    });
    vi.stubGlobal("fetch", fetchMock);

    const file = new File([new Uint8Array([0x00])], "bad.pem");
    await expect(analyzeFile(file)).rejects.toThrow("API error 400");
  });
});
