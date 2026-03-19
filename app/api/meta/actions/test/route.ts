import { NextResponse } from "next/server";
import { getAdSets } from "@/lib/meta/client";
import { getAdSetMetrics } from "@/lib/meta/actions";

export async function GET() {
  try {
    // Step 1: list all ad sets in the account
    const adSetsRes = await getAdSets();

    if (adSetsRes.data.length === 0) {
      return NextResponse.json({
        ok: true,
        message: "No ad sets found in this account",
        adsets: [],
      });
    }

    // Step 2: pull metrics for up to the first 5 ad sets (avoid hammering the API)
    const targets = adSetsRes.data.slice(0, 5);

    const results = await Promise.all(
      targets.map(async (adset) => {
        const metrics = await getAdSetMetrics(adset.id);
        return {
          adset_id: adset.id,
          adset_name: adset.name,
          adset_status: adset.status,
          metrics: metrics.ok ? metrics.data : null,
          error: metrics.ok ? null : metrics.error,
        };
      })
    );

    return NextResponse.json({ ok: true, count: results.length, adsets: results });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: (err as Error).message },
      { status: 500 }
    );
  }
}
