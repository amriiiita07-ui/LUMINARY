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
  const delta     = ((today - yesterday) / yesterday) * 100;

  return {
    mobilityIndex:    Math.round(today * 10) / 10,
    mobilityDelta:    Math.round(delta * 10) / 10,
    openAnomalies,
    criticalAlerts:   criticalAnomalies,
    zonesMonitored:   zoneCount,
    computedAt:       new Date().toISOString(),
  };
}

// ── Zone Risk List ─────────────────────────────────────────────
export async function getZoneRisk() {
  const snapshots = await db.riskSnapshot.findMany({
    where: {
      snapshotDate: {
        gte: new Date(new Date().setHours(0, 0, 0, 0)),
      },
    },
    include: { zone: { include: { district: true } } },
    orderBy: { riskScore: "desc" },
    take: 20,
  });

  return snapshots.map((s, i) => ({
    zoneId:        s.zoneId,
    zoneName:      s.zone.name,
    zoneCode:      s.zone.code,
    district:      s.zone.district.name,
    lat:           s.zone.lat,
    lng:           s.zone.lng,
    riskScore:     s.riskScore,
    riskTier:      s.riskTier,
    riskRank:      i + 1,
    weeklyDrift:   s.weeklyDriftPct,
    anomalyCount:  s.anomalyCount,
    avgMobility:   s.avgMobility,
  }));
}

// ── 7-Day Mobility Trend ───────────────────────────────────────
export async function getMobilityTrend(zoneId?: string) {
  const where = {
    recordedAt: { gte: new Date(Date.now() - 7 * 86_400_000) },
    ...(zoneId ? { zoneId } : {}),
  };

  const events = await db.mobilityEvent.groupBy({
    by:      ["recordedAt"],
    _avg:    { mobilityScore: true },
    _sum:    { pedestrianCount: true, vehicularCount: true },
    where,
    orderBy: { recordedAt: "asc" },
  });

  // Bucket by day
  const byDay = new Map<string, { scores: number[]; peds: number; vehs: number }>();
  for (const e of events) {
    const day = e.recordedAt.toISOString().split("T")[0];
    const existing = byDay.get(day) ?? { scores: [], peds: 0, vehs: 0 };
    existing.scores.push(e._avg.mobilityScore ?? 0);
    existing.peds += e._sum.pedestrianCount ?? 0;
    existing.vehs += e._sum.vehicularCount  ?? 0;
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
