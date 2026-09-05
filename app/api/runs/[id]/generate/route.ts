import { generateContext, generateImage } from "../../../../../lib/ai";
import { getRun, updateRun } from "../../../../../lib/db";
import { DEMO_METRICS } from "../../../../../lib/types";

export async function POST(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const run = await getRun(id);
  if (!run) return Response.json({ error: "Run not found" }, { status: 404 });
  try {
    await updateRun(id, { status: "generating_context", current_iteration: 0, error_message: null });
    const context = run.context0 || (await generateContext(run.company, run.campaign, 0));
    await updateRun(id, { context_0: context, status: "generating_image" });
    const image = await generateImage(context, run.campaign.aspectRatio);
    await updateRun(id, {
      image_0: image.url,
      request_id_0: image.providerRequestId,
      metrics_json: JSON.stringify(DEMO_METRICS),
      status: "completed",
    });
    return Response.json({ run: await getRun(id) });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Generation failed";
    await updateRun(id, { status: "failed", error_message: message });
    return Response.json({ error: message }, { status: 500 });
  }
}
