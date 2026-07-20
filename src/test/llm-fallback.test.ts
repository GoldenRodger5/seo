import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

/**
 * Verifies the Anthropic→OpenAI fallback in api/_lib.ts::callLLM.
 * fetch is mocked; no real API calls are made. Env keys are stubbed and the
 * module is re-imported per test because _lib captures the keys at load time.
 */

type Msg = { role: "user" | "assistant"; content: string };
const args = { system: "sys", messages: [{ role: "user", content: "hi" } as Msg], maxTokens: 100 };

const mockRes = (status: number, body: unknown) => ({
  ok: status >= 200 && status < 300,
  status,
  json: async () => body,
  text: async () => (typeof body === "string" ? body : JSON.stringify(body)),
});
const anthropicOK = { content: [{ type: "text", text: "anthropic answer" }] };
const openaiOK = { choices: [{ message: { content: "openai answer" } }] };

async function loadCallLLM() {
  vi.resetModules();
  return (await import("../../api/_lib.js")).callLLM;
}

describe("callLLM Anthropic→OpenAI fallback", () => {
  beforeEach(() => {
    vi.stubEnv("ANTHROPIC_API_KEY", "test-anthropic");
    vi.stubEnv("OPENAI_API_KEY", "test-openai");
  });
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it("uses Anthropic when it succeeds and never calls OpenAI", async () => {
    const fetchMock = vi.fn(async (url: string) =>
      url.includes("anthropic") ? mockRes(200, anthropicOK) : mockRes(200, openaiOK)
    );
    vi.stubGlobal("fetch", fetchMock);
    const callLLM = await loadCallLLM();
    const out = await callLLM(args);
    expect(out.provider).toBe("anthropic");
    expect(out.text).toBe("anthropic answer");
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect((fetchMock.mock.calls[0][0] as string)).toContain("anthropic");
  });

  it("falls back to OpenAI when Anthropic returns 529 (overloaded)", async () => {
    const fetchMock = vi.fn(async (url: string) =>
      url.includes("anthropic") ? mockRes(529, "overloaded") : mockRes(200, openaiOK)
    );
    vi.stubGlobal("fetch", fetchMock);
    const callLLM = await loadCallLLM();
    const out = await callLLM(args);
    expect(out.provider).toBe("openai");
    expect(out.text).toBe("openai answer");
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("falls back to OpenAI when the Anthropic request throws", async () => {
    const fetchMock = vi.fn(async (url: string) => {
      if (url.includes("anthropic")) throw new Error("network down");
      return mockRes(200, openaiOK);
    });
    vi.stubGlobal("fetch", fetchMock);
    const callLLM = await loadCallLLM();
    const out = await callLLM(args);
    expect(out.provider).toBe("openai");
    expect(out.text).toBe("openai answer");
  });

  it("falls back to OpenAI when Anthropic returns empty content", async () => {
    const fetchMock = vi.fn(async (url: string) =>
      url.includes("anthropic") ? mockRes(200, { content: [] }) : mockRes(200, openaiOK)
    );
    vi.stubGlobal("fetch", fetchMock);
    const callLLM = await loadCallLLM();
    const out = await callLLM(args);
    expect(out.provider).toBe("openai");
  });

  it("sends the system prompt as OpenAI's first message on fallback", async () => {
    const fetchMock = vi.fn(async (url: string, init?: { body?: string }) => {
      if (url.includes("anthropic")) return mockRes(500, "err");
      const body = JSON.parse(init!.body!);
      expect(body.messages[0]).toEqual({ role: "system", content: "sys" });
      expect(body.messages[1]).toEqual({ role: "user", content: "hi" });
      return mockRes(200, openaiOK);
    });
    vi.stubGlobal("fetch", fetchMock);
    const callLLM = await loadCallLLM();
    await callLLM(args);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("throws all_llm_failed when both providers fail", async () => {
    const fetchMock = vi.fn(async () => mockRes(500, "boom"));
    vi.stubGlobal("fetch", fetchMock);
    const callLLM = await loadCallLLM();
    await expect(callLLM(args)).rejects.toThrow("all_llm_failed");
  });

  it("skips Anthropic entirely when only OpenAI is configured", async () => {
    vi.stubEnv("ANTHROPIC_API_KEY", "");
    const fetchMock = vi.fn(async () => mockRes(200, openaiOK));
    vi.stubGlobal("fetch", fetchMock);
    const callLLM = await loadCallLLM();
    const out = await callLLM(args);
    expect(out.provider).toBe("openai");
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect((fetchMock.mock.calls[0][0] as string)).toContain("openai");
  });
});
