import { NextResponse } from "next/server";
import { getAnomalyFeed } from "@/lib/analytics";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get("limit") ?? "20");
    const data  = await getAnomalyFeed(limit);
    return NextResponse.json({ anomalies: data, total: data.length });
  } catch (err) {
    console.error("[/api/anomalies]", err);
    return NextResponse.json({ error: "Failed to fetch anomalies" }, { status: 500 });
  }
}
