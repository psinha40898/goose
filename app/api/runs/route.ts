import { createRun, listRuns } from "../../../lib/db";
import type { CampaignFields, CompanyFields } from "../../../lib/types";

export const dynamic = "force-dynamic";

const companyKeys: Array<keyof CompanyFields> = ["companyName", "productName", "productType", "pricePoint", "targetCustomer", "visualIdentity", "valueProposition", "tone"];
const campaignKeys: Array<keyof CampaignFields> = ["campaignName", "funnelStage", "messageAngle", "audienceSegment", "objective", "placement", "aspectRatio"];

export async function GET() {
  return Response.json({ runs: await listRuns() });
}

export async function POST(request: Request) {
  const body = (await request.json()) as { company?: CompanyFields; campaign?: CampaignFields };
  if (!body.company || !body.campaign) return Response.json({ error: "Company and campaign are required" }, { status: 400 });
  const missing = [...companyKeys.filter((key) => !body.company?.[key]?.trim()), ...campaignKeys.filter((key) => !body.campaign?.[key]?.trim())];
  if (missing.length) return Response.json({ error: "Complete all required fields" }, { status: 400 });
  return Response.json({ run: await createRun(body.company, body.campaign) }, { status: 201 });
}
