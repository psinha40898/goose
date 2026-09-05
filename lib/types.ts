export type CompanyFields = {
  companyName: string;
  productName: string;
  productType: string;
  pricePoint: string;
  targetCustomer: string;
  visualIdentity: string;
  valueProposition: string;
  tone: string;
};

export type CampaignFields = {
  campaignName: string;
  funnelStage: string;
  offer?: string;
  season?: string;
  messageAngle: string;
  audienceSegment: string;
  objective: string;
  placement: string;
  aspectRatio: string;
  additionalConstraints?: string;
};

export type PerformanceData = {
  impressions: number;
  clicks: number;
  conversions: number;
  spendCents: number;
  ctr: number;
  cvr: number;
  cpaCents: number;
};

export type RunStatus =
  | "queued"
  | "generating_context"
  | "generating_upgrade"
  | "generating_image"
  | "completed"
  | "failed";

export type CampaignRun = {
  id: string;
  status: RunStatus;
  currentIteration: 0 | 1;
  company: CompanyFields;
  campaign: CampaignFields;
  context0: string | null;
  image0: string | null;
  requestId0: string | null;
  metrics: PerformanceData | null;
  context1: string | null;
  image1: string | null;
  requestId1: string | null;
  adjustmentSummary: string | null;
  metricInterpretation: string | null;
  errorMessage: string | null;
  createdAt: string;
  updatedAt: string;
};

export const DEMO_METRICS: PerformanceData = {
  impressions: 100_000,
  clicks: 1_800,
  conversions: 45,
  spendCents: 225_000,
  ctr: 0.018,
  cvr: 0.025,
  cpaCents: 5_000,
};
