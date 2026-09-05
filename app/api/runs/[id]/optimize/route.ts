import { generateImage, generatePerformanceUpgrade } from "../../../../../lib/ai";
import { getRun, updateRun } from "../../../../../lib/db";

export async function POST(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const run = await getRun(id);
  if (!run) return Response.json({ error: "Run not found" }, { status: 404 });
  if (!run.context0 || !run.image0 || !run.metrics) return Response.json({ error: "Iteration 0 must be completed first" }, { status: 409 });
  if (run.image1) return Response.json({ error: "Iteration 1 already exists" }, { status: 409 });
  try {
    await updateRun(id, { status: "generating_upgrade", current_iteration: 1, error_message: null });
    const upgrade = run.context1 && run.adjustmentSummary && run.metricInterpretation
      ? { upgradedContext: run.context1, adjustmentSummary: run.adjustmentSummary, metricInterpretation: run.metricInterpretation }
      : await generatePerformanceUpgrade(run.metrics, run.context0);
    await updateRun(id, {
      context_1: upgrade.upgradedContext,
      adjustment_summary: upgrade.adjustmentSummary,
      metric_interpretation: upgrade.metricInterpretation,
      status: "generating_image",
    });
    const image = await generateImage(upgrade.upgradedContext, run.campaign.aspectRatio);
    await updateRun(id, { image_1: image.url, request_id_1: image.providerRequestId, status: "completed" });
    return Response.json({ run: await getRun(id) });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Optimization failed";
    await updateRun(id, { status: "failed", error_message: message });
    return Response.json({ error: message }, { status: 500 });
  }
}
