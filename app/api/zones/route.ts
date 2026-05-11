import { NextResponse } from "next/server";
import { getZoneRisk } from "@/lib/analytics";

export async function GET() {
  try {
    const zones = await getZoneRisk();
    return NextResponse.json({ zones, total: zones.length });
  } catch (err) {
    console.error("[/api/zones]", err);
    return NextResponse.json({ error: "Failed to fetch zones" }, { status: 500 });
  }
}
