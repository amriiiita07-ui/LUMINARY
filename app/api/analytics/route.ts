import { NextResponse } from "next/server";
import { getCityKPIs } from "@/lib/analytics";

export async function GET() {
  try {
    const data = await getCityKPIs();
    return NextResponse.json(data);
  } catch (err) {
    console.error("[/api/analytics]", err);
    return NextResponse.json({ error: "Failed to fetch KPIs" }, { status: 500 });
  }
}
