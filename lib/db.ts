import { mkdirSync } from "node:fs";
import { join } from "node:path";
import Database from "better-sqlite3";
import type { CampaignFields, CampaignRun, CompanyFields, PerformanceData, RunStatus } from "./types";

const dataDirectory = join(process.cwd(), "data");
let connection: Database.Database | null = null;

type RunRow = {
  id: string; status: RunStatus; current_iteration: number;
  company_json: string; campaign_json: string;
  context_0: string | null; image_0: string | null; request_id_0: string | null;
  metrics_json: string | null; context_1: string | null; image_1: string | null; request_id_1: string | null;
  adjustment_summary: string | null; metric_interpretation: string | null; error_message: string | null;
  created_at: string; updated_at: string;
};

function database() {
  if (!connection) {
    mkdirSync(dataDirectory, { recursive: true });
    connection = new Database(join(dataDirectory, "demo.db"));
    connection.exec(`CREATE TABLE IF NOT EXISTS campaign_runs (
      id TEXT PRIMARY KEY,
      status TEXT NOT NULL,
      current_iteration INTEGER NOT NULL DEFAULT 0,
      company_json TEXT NOT NULL,
      campaign_json TEXT NOT NULL,
      context_0 TEXT,
      image_0 TEXT,
      request_id_0 TEXT,
      metrics_json TEXT,
      context_1 TEXT,
      image_1 TEXT,
      request_id_1 TEXT,
      adjustment_summary TEXT,
      metric_interpretation TEXT,
      error_message TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    )`);
  }
  return connection;
}

function mapRun(row: RunRow): CampaignRun {
  return {
    id: row.id,
    status: row.status,
    currentIteration: row.current_iteration as 0 | 1,
    company: JSON.parse(row.company_json) as CompanyFields,
    campaign: JSON.parse(row.campaign_json) as CampaignFields,
    context0: row.context_0,
    image0: row.image_0,
    requestId0: row.request_id_0,
    metrics: row.metrics_json ? JSON.parse(row.metrics_json) as PerformanceData : null,
    context1: row.context_1,
    image1: row.image_1,
    requestId1: row.request_id_1,
    adjustmentSummary: row.adjustment_summary,
    metricInterpretation: row.metric_interpretation,
    errorMessage: row.error_message,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function createRun(company: CompanyFields, campaign: CampaignFields) {
  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  database().prepare("INSERT INTO campaign_runs (id, status, current_iteration, company_json, campaign_json, created_at, updated_at) VALUES (?, 'queued', 0, ?, ?, ?, ?)")
    .run(id, JSON.stringify(company), JSON.stringify(campaign), now, now);
  return getRun(id);
}

export async function listRuns() {
  return (database().prepare("SELECT * FROM campaign_runs ORDER BY created_at DESC").all() as RunRow[]).map(mapRun);
}

export async function getRun(id: string) {
  const row = database().prepare("SELECT * FROM campaign_runs WHERE id = ?").get(id) as RunRow | undefined;
  return row ? mapRun(row) : null;
}

export async function updateRun(id: string, fields: Record<string, string | number | null>) {
  const allowed = new Set(["status", "current_iteration", "context_0", "image_0", "request_id_0", "metrics_json", "context_1", "image_1", "request_id_1", "adjustment_summary", "metric_interpretation", "error_message"]);
  const entries = Object.entries(fields).filter(([key]) => allowed.has(key));
  if (!entries.length) return;
  const setClause = [...entries.map(([key]) => `${key} = ?`), "updated_at = ?"].join(", ");
  database().prepare(`UPDATE campaign_runs SET ${setClause} WHERE id = ?`)
    .run(...entries.map(([, value]) => value), new Date().toISOString(), id);
}

export async function resetRuns() {
  database().prepare("DELETE FROM campaign_runs").run();
}
