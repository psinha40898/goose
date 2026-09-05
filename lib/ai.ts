import { fal } from "@fal-ai/client";
import type { CampaignFields, CompanyFields, PerformanceData } from "./types";

async function callLlm(instructions: string, input: string): Promise<string> {
  const key = process.env.OPENAI_API_KEY;
  if (!key) throw new Error("OPENAI_API_KEY is not configured");
  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: process.env.OPENAI_MODEL || "gpt-5.6-luna",
      instructions,
      input,
      store: false,
      max_output_tokens: 1800,
    }),
  });
  if (!response.ok) throw new Error(`LLM request failed (${response.status})`);
  const result = (await response.json()) as { output_text?: string; output?: Array<{ content?: Array<{ text?: string }> }> };
  const text = result.output_text || result.output?.flatMap((item) => item.content || []).map((item) => item.text || "").join("");
  if (!text) throw new Error("LLM returned an empty response");
  return text.trim();
}

export async function generateContext(
  companyFields: CompanyFields,
  campaignFields: CampaignFields,
  iteration: 0,
): Promise<string> {
  return callLlm(
    "You are an expert performance-ad creative director. Return only one production-ready image-generation prompt, with no preface or markdown. Preserve every supplied fact. Specify subject, composition, hierarchy, brand expression, lighting, mood, offer treatment, placement, aspect ratio, and negative constraints. Keep any requested ad copy very short and legible. Do not invent product claims.",
    JSON.stringify({ companyFields, campaignFields, iteration }),
  );
}

export type PerformanceUpgrade = {
  upgradedContext: string;
  adjustmentSummary: string;
  metricInterpretation: string;
};

export async function generatePerformanceUpgrade(
  mockData: PerformanceData,
  context: string,
): Promise<PerformanceUpgrade> {
  const text = await callLlm(
    `You improve an existing image-generation prompt using simulated ad performance data.

Evidence hierarchy you must follow:
1. CTR is the primary and most diagnosable creative signal. Use it to reason about stopping power, visual hierarchy, message clarity, audience relevance, and the hook.
2. CVR is a weaker secondary signal. It may suggest message-to-offer or expectation alignment, but conversion also depends on the landing page, checkout, product, and other post-click factors. Be cautious.
3. CPA is contextual only. Do not diagnose what is wrong with the creative from CPA and do not claim a creative change will fix CPA, because CPA depends heavily on the cost of the ad space/media auction as well as downstream conversion.

Preserve all brand and campaign facts. Make targeted changes, not a wholly different campaign. Return valid JSON only with exactly these string keys: upgradedContext, adjustmentSummary, metricInterpretation. The summary must name the specific creative changes. The interpretation must explicitly distinguish the confidence assigned to CTR, CVR, and CPA. Do not claim improvement is guaranteed or proven.`,
    JSON.stringify({ mockPerformanceData: mockData, originalContext: context }),
  );
  try {
    const cleaned = text.replace(/^```json\s*/i, "").replace(/```$/, "").trim();
    return JSON.parse(cleaned) as PerformanceUpgrade;
  } catch {
    throw new Error("LLM returned an invalid performance upgrade");
  }
}

export async function generateImage(context: string, aspectRatio: string) {
  const key = process.env.FAL_API_KEY;
  if (!key) throw new Error("FAL_API_KEY is not configured");
  fal.config({ credentials: key });
  const sizes: Record<string, "square_hd" | "portrait_4_3" | "portrait_16_9" | "landscape_16_9"> = {
    "1:1": "square_hd",
    "4:5": "portrait_4_3",
    "9:16": "portrait_16_9",
    "16:9": "landscape_16_9",
  };
  const result = await fal.subscribe("fal-ai/flux/schnell", {
    input: {
      prompt: context,
      image_size: sizes[aspectRatio] || "square_hd",
      num_images: 1,
      enable_safety_checker: true,
      output_format: "jpeg",
    },
  });
  const data = result.data as { images?: Array<{ url?: string }> };
  const url = data.images?.[0]?.url;
  if (!url) throw new Error("Image model returned no image");
  return { url, providerRequestId: result.requestId, model: "fal-ai/flux/schnell" };
}
