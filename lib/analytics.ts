// lib/analytics.ts — All analytics queries via Prisma
import { db } from "./db";

// ── City KPIs ──────────────────────────────────────────────────
export async function getCityKPIs() {
  const [mobilityToday, mobilityYesterday, openAnomalies, criticalAnomalies, zoneCount] =
    await Promise.all([
      db.mobilityEvent.aggregate({
        _avg: { mobilityScore: true },
        where: { recordedAt: { gte: new Date(Date.now() - 86_400_000) } },
      }),
      db.mobilityEvent.aggregate({
        _avg: { mobilityScore: true },
        where: {
          recordedAt: {
            gte: new Date(Date.now() - 172_800_000),
            lt:  new Date(Date.now() - 86_400_000),
          },
        },
      }),
      db.anomaly.count({ where: { resolved: false } }),
      db.anomaly.count({ where: { resolved: false, severity: "CRITICAL" } }),
      db.zone.count(),
    ]);

  const today     = mobilityToday._avg.mobilityScore     ?? 0;
  const yesterday = mobilityYesterday._avg.mobilityScore ?? 1;
  const delta     = yesterday > 0 ? ((today - yesterday) / yesterday) * 100 : 0;

  return {
    mobilityIndex:  Math.round(today * 10) / 10,
    mobilityDelta:  Math.round(delta * 10) / 10,
    openAnomalies,
    criticalAlerts: criticalAnomalies,
    zonesMonitored: zoneCount,
    computedAt:     new Date().toISOString(),
  };
}

// ── Zone Risk List ─────────────────────────────────────────────
export async function getZoneRisk() {
  // Get the most recent snapshot per zone (avoids timezone issues with "today")
  const zones = await db.zone.findMany({
    include: {
      district: true,
      riskSnapshots: {
        orderBy: { snapshotDate: "desc" },
        take: 1,
      },
    },
    orderBy: { name: "asc" },
  });

  const withRisk = zones
    .filter((z) => z.riskSnapshots.length > 0)
    .map((z) => ({
      zoneId:       z.id,
      zoneName:     z.name,
      zoneCode:     z.code,
      district:     z.district.name,
      lat:          z.lat,
      lng:          z.lng,
      riskScore:    Math.round(z.riskSnapshots[0].riskScore * 10) / 10,
      riskTier:     z.riskSnapshots[0].riskTier,
      weeklyDrift:  z.riskSnapshots[0].weeklyDriftPct,
      anomalyCount: z.riskSnapshots[0].anomalyCount,
      avgMobility:  Math.round(z.riskSnapshots[0].avgMobility * 10) / 10,
    }))
    .sort((a, b) => b.riskScore - a.riskScore)
    .map((z, i) => ({ ...z, riskRank: i + 1 }));

  return withRisk;
}

// ── 7-Day Mobility Trend ───────────────────────────────────────
export async function getMobilityTrend(zoneId?: string) {
  const since = new Date(Date.now() - 7 * 86_400_000);

  const events = await db.mobilityEvent.findMany({
    where: {
      recordedAt: { gte: since },
      ...(zoneId ? { zoneId } : {}),
    },
    select: {
      recordedAt:      true,
      mobilityScore:   true,
      pedestrianCount: true,
      vehicularCount:  true,
    },
    orderBy: { recordedAt: "asc" },
  });

  // Bucket by day
  const byDay = new Map<string, { scores: number[]; peds: number; vehs: number }>();
  for (const e of events) {
    const day = e.recordedAt.toISOString().split("T")[0];
    const existing = byDay.get(day) ?? { scores: [], peds: 0, vehs: 0 };
    existing.scores.push(e.mobilityScore);
    existing.peds += e.pedestrianCount;
    existing.vehs += e.vehicularCount;
    byDay.set(day, existing);
  }

  return Array.from(byDay.entries()).map(([day, v]) => ({
    day,
    avgScore:    Math.round((v.scores.reduce((a, b) => a + b, 0) / v.scores.length) * 10) / 10,
    pedestrians: v.peds,
    vehicles:    v.vehs,
  }));
}

// ── Recent Anomaly Feed ────────────────────────────────────────
export async function getAnomalyFeed(limit = 20) {
  return db.anomaly.findMany({
    include: { zone: { include: { district: true } } },
    orderBy: { detectedAt: "desc" },
    take: limit,
  });
}

// ── Sentiment Overview ─────────────────────────────────────────
export async function getSentimentOverview() {
  const logs = await db.sentimentLog.groupBy({
    by:      ["zoneId", "topic"],
    _avg:    { score: true },
    _sum:    { volume: true },
    where:   { recordedAt: { gte: new Date(Date.now() - 7 * 86_400_000) } },
    orderBy: { _avg: { score: "asc" } },
  });

  return logs.map((l) => ({
    zoneId:   l.zoneId,
    topic:    l.topic,
    avgScore: Math.round((l._avg.score ?? 0) * 1000) / 1000,
    volume:   l._sum.volume ?? 0,
    category:
      (l._avg.score ?? 0) > 0.3  ? "POSITIVE" :
      (l._avg.score ?? 0) < -0.3 ? "NEGATIVE" :
      "NEUTRAL",
  }));
}

// ── Air Quality Summary ────────────────────────────────────────
export async function getAirQualitySummary() {
  return db.airQualityLog.groupBy({
    by:      ["zoneId", "category"],
    _avg:    { aqi: true, pm25: true },
    where:   { recordedAt: { gte: new Date(Date.now() - 7 * 86_400_000) } },
    orderBy: { _avg: { aqi: "desc" } },
  });
}
