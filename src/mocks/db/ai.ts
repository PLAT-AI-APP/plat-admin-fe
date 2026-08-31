import type {
  AiModel,
  AiModelCatalogItem,
  AiModelStatus,
  AiProvider,
} from "@/type/ai";
import { daysAgo, pickOne, randomInt } from "../utils";

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

const MODEL_MEMOS = [
  "장문 서사와 감정 표현 품질이 가장 안정적입니다.",
  "일반 대화 기본값. 비용과 품질의 균형이 좋습니다.",
  "짧은 응답과 요약 작업에 사용합니다.",
  "이미지 설명 생성 실험용으로만 열어 둡니다.",
  "비용 절감 실험 중. 장문에서는 품질 편차가 있습니다.",
];

/** 운영에서 실제로 쓰는 모델 5개. 카탈로그 상위 5개를 가져온다. */
export const aiModels: AiModel[] = modelCatalog
  .slice(0, 5)
  .map((catalogItem, index) => {
    const seed = index + 1;

    return {
      modelId: seed,
      model: catalogItem.model,
      displayName: catalogItem.displayName,
      provider: catalogItem.provider,
      // 기본 모델은 항상 정확히 1개만 존재한다.
      isEnabled: index !== 4,
      isDefault: index === 1,
      creditCost: randomInt(seed * 4, 1, 12),
      maxOutputTokens: pickOne(seed * 6, [2_048, 4_096, 8_192]),
      temperature: randomInt(seed * 8, 4, 12) / 10,
      memo: MODEL_MEMOS[index],
      updatedAt: daysAgo(index * 4 + 1, 17),
    };
  });
