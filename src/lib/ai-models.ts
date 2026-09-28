export type AIProviderName = "gemini" | "openai";

export interface AIModelOption {
  value: string;
  label: string;
  provider: AIProviderName;
  description: string;
}

export const DEFAULT_CONTENT_MODEL = "gemini-3.8-flash";
export const DEFAULT_IMAGE_MODEL = "gpt-image-2.5-flare";

export const CONTENT_MODEL_OPTIONS: AIModelOption[] = [
  {
    value: "gemini-3.8-flash",
    label: "Gemini 3.8 Flash",
    provider: "gemini",
    description: "Latest GA Gemini Flash model",
  },
  {
    value: "gemini-3.5-flash",
    label: "Gemini 3.5 Flash",
    provider: "gemini",
    description: "Stable general-purpose Gemini model",
  },
  {
    value: "gemini-3.1-flash-lite",
    label: "Gemini 3.1 Flash-Lite",
    provider: "gemini",
    description: "Fast, cost-efficient Gemini model",
  },
  {
    value: "gpt-6-astra",
    label: "GPT-6 Astra",
    provider: "openai",
    description: "OpenAI's most capable flagship model",
  },
  {
    value: "gpt-6-sol",
    label: "GPT-6 Sol",
    provider: "openai",
    description: "Balanced flagship model for complex work",
  },
  {
    value: "gpt-6-luna",
    label: "GPT-6 Luna",
    provider: "openai",
    description: "Fast, efficient model for high-volume work",
  },
];

export const IMAGE_MODEL_OPTIONS: AIModelOption[] = [
  {
    value: "gpt-image-2.5-sunburst",
    label: "GPT Image 2.5 Sunburst",
    provider: "openai",
    description: "Highest-quality OpenAI image generation and editing",
  },
  {
    value: "gpt-image-2.5-flare",
    label: "GPT Image 2.5 Flare",
    provider: "openai",
    description: "Fast, high-quality everyday image generation",
  },
  {
    value: "gpt-image-2",
    label: "GPT Image 2",
    provider: "openai",
    description: "Stable GPT Image model",
  },
  {
    value: "gemini-3.1-flash-image",
    label: "Gemini 3.1 Flash Image (Nano Banana 2)",
    provider: "gemini",
    description: "Google's mainstream image model",
  },
  {
    value: "gemini-3.1-flash-lite-image",
    label: "Gemini 3.1 Flash Lite Image",
    provider: "gemini",
    description: "Low-latency, cost-efficient Google image model",
  },
  {
    value: "gemini-3-pro-image",
    label: "Gemini 3 Pro Image (Nano Banana Pro)",
    provider: "gemini",
    description: "Google's high-quality professional image model",
  },
];

const CONTENT_MODEL_IDS = new Set(CONTENT_MODEL_OPTIONS.map(({ value }) => value));
const IMAGE_MODEL_IDS = new Set(IMAGE_MODEL_OPTIONS.map(({ value }) => value));

export function normalizeContentModel(model?: string): string {
  return model && CONTENT_MODEL_IDS.has(model) ? model : DEFAULT_CONTENT_MODEL;
}

export function normalizeImageModel(model?: string): string {
  return model && IMAGE_MODEL_IDS.has(model) ? model : DEFAULT_IMAGE_MODEL;
}

export function getModelProvider(model: string): AIProviderName {
  return model.startsWith("gpt-") ? "openai" : "gemini";
}

export function getModelLabel(model: string): string {
  return (
    CONTENT_MODEL_OPTIONS.find(({ value }) => value === model)?.label ??
    IMAGE_MODEL_OPTIONS.find(({ value }) => value === model)?.label ??
    model
  );
}
