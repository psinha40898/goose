import { resetRuns } from "../../../../lib/db";

export async function POST() {
  await resetRuns();
  return Response.json({ ok: true });
}
