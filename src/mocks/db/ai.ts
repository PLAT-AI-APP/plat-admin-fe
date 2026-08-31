import type { AiModelCatalogItem, AiModelStatus, AiProvider } from "@/type/ai";
import { randomInt } from "../utils";

/** 카탈로그 원본 메타. 단가만 seed 난수로 채운다. */
const CATALOG_SEEDS: {
  model: string;
  displayName: string;
  provider: AiProvider;
  contextWindow: number;
  status: AiModelStatus;
}[] = [
  {
    model: "claude-opus-4-5",
    displayName: "Claude Opus 4.5",
    provider: "ANTHROPIC",
    contextWindow: 200_000,
    status: "AVAILABLE",
  },
  {
    model: "claude-sonnet-4-5",
    displayName: "Claude Sonnet 4.5",
    provider: "ANTHROPIC",
    contextWindow: 200_000,
    status: "AVAILABLE",
  },
  {
    model: "claude-haiku-4-5",
    displayName: "Claude Haiku 4.5",
    provider: "ANTHROPIC",
    contextWindow: 200_000,
    status: "AVAILABLE",
  },
  {
    model: "gpt-5.1",
    displayName: "GPT-5.1",
    provider: "OPENAI",
    contextWindow: 400_000,
    status: "AVAILABLE",
  },
  {
    model: "gpt-5-mini",
    displayName: "GPT-5 mini",
    provider: "OPENAI",
    contextWindow: 400_000,
    status: "AVAILABLE",
  },
  {
    model: "gpt-4o",
    displayName: "GPT-4o",
    provider: "OPENAI",
    contextWindow: 128_000,
    status: "DEPRECATED",
  },
  {
    model: "gemini-3-pro",
    displayName: "Gemini 3 Pro",
    provider: "GOOGLE",
    contextWindow: 1_000_000,
    status: "AVAILABLE",
  },
  {
    model: "gemini-2.5-flash",
    displayName: "Gemini 2.5 Flash",
    provider: "GOOGLE",
    contextWindow: 1_000_000,
    status: "AVAILABLE",
  },
  {
    model: "llama-4-maverick",
    displayName: "Llama 4 Maverick",
    provider: "META",
    contextWindow: 256_000,
    status: "AVAILABLE",
  },
  {
    model: "llama-3.3-70b",
    displayName: "Llama 3.3 70B",
    provider: "META",
    contextWindow: 128_000,
    status: "UNAVAILABLE",
  },
];

/** 1M 토큰 기준 단가(원). 출력 단가는 입력 단가의 3~6배로 둔다. */
export const modelCatalog: AiModelCatalogItem[] = CATALOG_SEEDS.map(
  (item, index) => {
    const seed = index + 1;
    const inputPricePerMillion = randomInt(seed * 3, 1, 24) * 500;

    return {
      ...item,
      inputPricePerMillion,
      outputPricePerMillion: inputPricePerMillion * randomInt(seed * 7, 3, 6),
    };
  },
);
