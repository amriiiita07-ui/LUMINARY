import { NextResponse } from "next/server";
import { getMobilityTrend } from "@/lib/analytics";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const zoneId = searchParams.get("zoneId") ?? undefined;
    const data   = await getMobilityTrend(zoneId);
    return NextResponse.json({ trend: data });
  } catch (err) {
    console.error("[/api/mobility]", err);
    return NextResponse.json({ error: "Failed to fetch mobility" }, { status: 500 });
  }
}
