import { describe, expect, it } from "vitest";
import {
  extractCodexBaseUrl,
  extractCodexModelName,
  setCodexBaseUrl,
  setCodexModelName,
} from "@/utils/providerConfigUtils";

describe("Codex TOML utils", () => {
  it("prefers target model provider section when extracting base_url", () => {
    const input = [
      'model_provider = "openai"',
      'base_url = "https://top.example/v1"',
      "",
      "[model_providers.openai]",
      'base_url = "https://section.example/v1"',
      "",
    ].join("\n");

    expect(extractCodexBaseUrl(input)).toBe("https://section.example/v1");
  });

  it("removes base_url line when set to empty", () => {
    const input = [
      'model_provider = "openai"',
      'base_url = "https://api.example.com/v1"',
      'model = "gpt-5-codex"',
      "",
    ].join("\n");

    const output = setCodexBaseUrl(input, "");

    expect(output).not.toMatch(/^\s*base_url\s*=/m);
    expect(extractCodexBaseUrl(output)).toBeUndefined();
    expect(extractCodexModelName(output)).toBe("gpt-5-codex");
  });

  it("removes model line when set to empty", () => {
    const input = [
      'model_provider = "openai"',
      'base_url = "https://api.example.com/v1"',
      'model = "gpt-5-codex"',
      "",
    ].join("\n");

    const output = setCodexModelName(input, "");

    expect(output).not.toMatch(/^\s*model\s*=/m);
    expect(extractCodexModelName(output)).toBeUndefined();
    expect(extractCodexBaseUrl(output)).toBe("https://api.example.com/v1");
  });

  it("updates existing values when non-empty", () => {
    const input = [
      'model_provider = "openai"',
      "base_url = 'https://old.example/v1'",
      'model = "old-model"',
      "",
    ].join("\n");

    const output1 = setCodexBaseUrl(input, " https://new.example/v1 \n");
    expect(extractCodexBaseUrl(output1)).toBe("https://new.example/v1");

    const output2 = setCodexModelName(output1, " new-model \n");
    expect(extractCodexModelName(output2)).toBe("new-model");
  });

  it("writes base_url into the active model provider section", () => {
    const input = [
      'model_provider = "openai"',
      "",
      "[model_providers.openai]",
      'api_key = "test"',
      "",
    ].join("\n");

    const output = setCodexBaseUrl(input, "https://section-write.example/v1");

    expect(output).toContain("[model_providers.openai]");
    expect(output).toContain('base_url = "https://section-write.example/v1"');
    expect(extractCodexBaseUrl(output)).toBe("https://section-write.example/v1");
  });

  it("inserts model after model_provider at top level", () => {
    const input = ['model_provider = "openai"', ""].join("\n");

    const output = setCodexModelName(input, "gpt-5-codex");

    expect(output).toMatch(
      /model_provider\s*=\s*"openai"\nmodel\s*=\s*"gpt-5-codex"/,
    );
    expect(extractCodexModelName(output)).toBe("gpt-5-codex");
  });
});
