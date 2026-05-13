/**
 * LUMINARY — Production Seed Script
 * Matches exact schema: City, District, Zone, MobilityEvent,
 * AirQualityLog, Anomaly, SentimentLog, RiskSnapshot
 *
 * Run:
 *   npx ts-node --project tsconfig.seed.json prisma/seed.ts
 */

import { PrismaClient, Severity, SignalType, RiskTier } from "@prisma/client";

const prisma = new PrismaClient();

// ─── Utilities ────────────────────────────────────────────────────────────────

function rand(min: number, max: number) {
  return Math.random() * (max - min) + min;
}
function randInt(min: number, max: number) {
  return Math.floor(rand(min, max + 1));
}
function randChoice<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}
function clamp(val: number, min: number, max: number) {
  return Math.min(Math.max(val, min), max);
}
function daysAgo(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}
function randomDateBetween(start: Date, end: Date): Date {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}
function round(n: number, decimals = 2) {
  return parseFloat(n.toFixed(decimals));
}

// ─── City & Geography ─────────────────────────────────────────────────────────

const CITY = {
  name: "Nova",
  country: "United Kingdom",
  lat: 51.5074,
  lng: -0.1278,
  timezone: "Europe/London",
  population: 1_240_000,
  areaKm2: 318.4,
};

const DISTRICTS = [
  {
    name: "Central Borough",
    population: 182000,
    zones: [
      { name: "Downtown Core",     code: "NV-CB-001", zoneType: "commercial",  lat: 51.5130, lng: -0.1270, areaKm2: 2.1, population: 28000 },
      { name: "Financial Quarter", code: "NV-CB-002", zoneType: "commercial",  lat: 51.5155, lng: -0.0922, areaKm2: 1.8, population: 12000 },
      { name: "Civic Plaza",       code: "NV-CB-003", zoneType: "mixed",       lat: 51.5098, lng: -0.1337, areaKm2: 1.4, population: 22000 },
    ],
  },
  {
    name: "Harbor Quarter",
    population: 156000,
    zones: [
      { name: "Harbor Edge",       code: "NV-HQ-001", zoneType: "mixed",       lat: 51.5081, lng: -0.0759, areaKm2: 3.2, population: 41000 },
      { name: "Marina District",   code: "NV-HQ-002", zoneType: "residential", lat: 51.4995, lng: -0.0682, areaKm2: 2.8, population: 58000 },
      { name: "Dock Yards",        code: "NV-HQ-003", zoneType: "industrial",  lat: 51.5021, lng: -0.0531, areaKm2: 4.1, population: 8200  },
    ],
  },
  {
    name: "Meridian East",
    population: 198000,
    zones: [
      { name: "East Gate",         code: "NV-ME-001", zoneType: "residential", lat: 51.5242, lng: -0.0523, areaKm2: 3.8, population: 72000 },
      { name: "Silk Road Market",  code: "NV-ME-002", zoneType: "commercial",  lat: 51.5198, lng: -0.0614, areaKm2: 1.6, population: 18000 },
      { name: "Meridian Park",     code: "NV-ME-003", zoneType: "mixed",       lat: 51.5271, lng: -0.0441, areaKm2: 2.9, population: 34000 },
    ],
  },
  {
    name: "Westfield Ridge",
    population: 174000,
    zones: [
      { name: "Westfield Heights", code: "NV-WR-001", zoneType: "residential", lat: 51.5062, lng: -0.2241, areaKm2: 4.4, population: 88000 },
      { name: "Ridge Commons",     code: "NV-WR-002", zoneType: "mixed",       lat: 51.5109, lng: -0.2018, areaKm2: 2.2, population: 46000 },
      { name: "Innovation Campus", code: "NV-WR-003", zoneType: "commercial",  lat: 51.5148, lng: -0.1872, areaKm2: 1.9, population: 14000 },
    ],
  },
];

// ─── Mobility Profile ─────────────────────────────────────────────────────────

function getMobilityProfile(zoneType: string, hour: number) {
  const isMorningPeak = hour >= 7 && hour <= 9;
  const isEveningPeak = hour >= 17 && hour <= 19;
  const isNight = hour >= 22 || hour <= 5;
  const isPeak = isMorningPeak || isEveningPeak;

  const profiles: Record<string, () => any> = {
    commercial: () => ({
      mobilityScore:   clamp(rand(isPeak ? 72 : isNight ? 8  : 52, isPeak ? 96 : isNight ? 22 : 78), 0, 100),
      pedestrianCount: randInt(isPeak ? 18000 : isNight ? 400  : 7000,  isPeak ? 58000 : isNight ? 2200 : 24000),
      vehicularCount:  randInt(isPeak ? 7000  : isNight ? 150  : 2800,  isPeak ? 22000 : isNight ? 900  : 9000),
      transitCount:    randInt(isPeak ? 4500  : isNight ? 80   : 1800,  isPeak ? 18000 : isNight ? 450  : 7000),
      cyclistCount:    randInt(isPeak ? 800   : isNight ? 20   : 300,   isPeak ? 3200  : isNight ? 120  : 1400),
      avgSpeedKmh:     round(rand(isPeak ? 8  : isNight ? 38 : 18, isPeak ? 22 : isNight ? 55 : 42)),
      congestionPct:   round(rand(isPeak ? 58 : isNight ? 2  : 22, isPeak ? 92 : isNight ? 12 : 55)),
    }),
    residential: () => ({
      mobilityScore:   clamp(rand(isMorningPeak ? 52 : isNight ? 4  : 28, isMorningPeak ? 78 : isNight ? 14 : 56), 0, 100),
      pedestrianCount: randInt(isMorningPeak ? 4000  : isNight ? 100 : 1500, isMorningPeak ? 16000 : isNight ? 800  : 7000),
      vehicularCount:  randInt(isMorningPeak ? 2800  : isNight ? 80  : 900,  isMorningPeak ? 9000  : isNight ? 400  : 3800),
      transitCount:    randInt(isMorningPeak ? 1800  : isNight ? 30  : 600,  isMorningPeak ? 7000  : isNight ? 200  : 2800),
      cyclistCount:    randInt(isMorningPeak ? 400   : isNight ? 5   : 120,  isMorningPeak ? 1800  : isNight ? 40   : 700),
      avgSpeedKmh:     round(rand(isPeak ? 14 : isNight ? 42 : 24, isPeak ? 32 : isNight ? 62 : 48)),
      congestionPct:   round(rand(isPeak ? 28 : isNight ? 1  : 8,  isPeak ? 62 : isNight ? 6  : 32)),
    }),
    industrial: () => ({
      mobilityScore:   clamp(rand(isPeak ? 38 : isNight ? 3  : 22, isPeak ? 64 : isNight ? 12 : 46), 0, 100),
      pedestrianCount: randInt(isPeak ? 800  : isNight ? 30  : 280,  isPeak ? 4200  : isNight ? 250 : 1800),
      vehicularCount:  randInt(isPeak ? 4200 : isNight ? 180 : 1600, isPeak ? 14000 : isNight ? 700 : 5800),
      transitCount:    randInt(isPeak ? 600  : isNight ? 15  : 220,  isPeak ? 2800  : isNight ? 100 : 1100),
      cyclistCount:    randInt(isPeak ? 80   : isNight ? 2   : 30,   isPeak ? 420   : isNight ? 18  : 180),
      avgSpeedKmh:     round(rand(isPeak ? 18 : isNight ? 44 : 28, isPeak ? 38 : isNight ? 68 : 52)),
      congestionPct:   round(rand(isPeak ? 32 : isNight ? 1  : 8,  isPeak ? 68 : isNight ? 5  : 28)),
    }),
    mixed: () => ({
      mobilityScore:   clamp(rand(isPeak ? 58 : isNight ? 6  : 38, isPeak ? 88 : isNight ? 18 : 68), 0, 100),
      pedestrianCount: randInt(isPeak ? 9000  : isNight ? 300 : 3800, isPeak ? 32000 : isNight ? 1800 : 14000),
      vehicularCount:  randInt(isPeak ? 4500  : isNight ? 120 : 1600, isPeak ? 14000 : isNight ? 600  : 5500),
      transitCount:    randInt(isPeak ? 3000  : isNight ? 60  : 1100, isPeak ? 11000 : isNight ? 320  : 4200),
      cyclistCount:    randInt(isPeak ? 500   : isNight ? 12  : 180,  isPeak ? 2200  : isNight ? 80   : 900),
      avgSpeedKmh:     round(rand(isPeak ? 10 : isNight ? 40 : 20, isPeak ? 26 : isNight ? 58 : 44)),
      congestionPct:   round(rand(isPeak ? 44 : isNight ? 1  : 14, isPeak ? 82 : isNight ? 8  : 42)),
    }),
  };

  return (profiles[zoneType] || profiles["mixed"])();
}

// ─── AQI Profile ──────────────────────────────────────────────────────────────

function getAQICategory(aqi: number): string {
  if (aqi <= 50)  return "Good";
  if (aqi <= 100) return "Moderate";
  if (aqi <= 150) return "Unhealthy for Sensitive Groups";
  if (aqi <= 200) return "Unhealthy";
  return "Hazardous";
}

function getAQIProfile(zoneType: string) {
  const profiles: Record<string, () => any> = {
    industrial:  () => ({ aqi: randInt(65, 148), pm25: round(rand(18, 62)), pm10: round(rand(32, 98)), no2: round(rand(28, 74)), o3: round(rand(18, 56)), co: round(rand(0.8, 2.9), 3) }),
    commercial:  () => ({ aqi: randInt(42, 98),  pm25: round(rand(10, 34)), pm10: round(rand(18, 58)), no2: round(rand(18, 50)), o3: round(rand(22, 64)), co: round(rand(0.4, 1.7), 3) }),
    residential: () => ({ aqi: randInt(25, 72),  pm25: round(rand(5,  22)), pm10: round(rand(10, 38)), no2: round(rand(9,  32)), o3: round(rand(25, 66)), co: round(rand(0.2, 1.1), 3) }),
    mixed:       () => ({ aqi: randInt(35, 92),  pm25: round(rand(8,  29)), pm10: round(rand(14, 50)), no2: round(rand(14, 44)), o3: round(rand(22, 62)), co: round(rand(0.3, 1.5), 3) }),
  };
  const p = (profiles[zoneType] || profiles["mixed"])();
  return { ...p, category: getAQICategory(p.aqi) };
}

// ─── Sentiment Profile ────────────────────────────────────────────────────────

const TOPICS = ["safety", "transport", "events", "environment", "infrastructure"];

function getSentimentProfile(zoneType: string, topic: string) {
  const base:     Record<string, number> = { commercial: 0.08, residential: 0.14, industrial: -0.22, mixed: 0.06 };
  const topicMod: Record<string, number> = { safety: -0.08, transport: 0.04, events: 0.16, environment: 0.24, infrastructure: -0.06 };
  const score = clamp((base[zoneType] ?? 0) + (topicMod[topic] ?? 0) + rand(-0.28, 0.28), -1, 1);
  return { score: round(score, 3), magnitude: round(rand(0.28, 1.0), 3), volume: randInt(60, 3200) };
}

// ─── Risk Tier ────────────────────────────────────────────────────────────────

function getRiskTier(score: number): RiskTier {
  if (score >= 65) return RiskTier.CRITICAL;
  if (score >= 38) return RiskTier.ELEVATED;
  return RiskTier.NOMINAL;
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log("\n✦  LUMINARY — Database Seed\n" + "━".repeat(52));

  // Clean all tables
  console.log("🧹 Clearing existing data...");
  await prisma.savedReport.deleteMany();
  await prisma.session.deleteMany();
  await prisma.account.deleteMany();
  await prisma.riskSnapshot.deleteMany();
  await prisma.sentimentLog.deleteMany();
  await prisma.anomaly.deleteMany();
  await prisma.airQualityLog.deleteMany();
  await prisma.mobilityEvent.deleteMany();
  await prisma.zone.deleteMany();
  await prisma.district.deleteMany();
  await prisma.city.deleteMany();
  await prisma.user.deleteMany();
  console.log("✅ Cleared\n");

  // City
  console.log("🏙️  Creating city: Nova, UK...");
  const city = await prisma.city.create({ data: CITY });

  // Districts & Zones
  const zoneRecords: Array<{ id: string; name: string; zoneType: string }> = [];

  for (const d of DISTRICTS) {
    const district = await prisma.district.create({
      data: { name: d.name, cityId: city.id, population: d.population },
    });
    for (const z of d.zones) {
      const zone = await prisma.zone.create({
        data: { name: z.name, code: z.code, districtId: district.id, cityId: city.id, lat: z.lat, lng: z.lng, areaKm2: z.areaKm2, population: z.population, zoneType: z.zoneType },
      });
      zoneRecords.push({ id: zone.id, name: zone.name, zoneType: zone.zoneType });
    }
  }
  console.log(`✅ ${zoneRecords.length} zones across ${DISTRICTS.length} districts\n`);

  const DAYS  = 90;
  const CHUNK = 2000;

  // Mobility Events
  console.log("🚶 Seeding mobility events (90 days × 24h × 12 zones)...");
  const mobilityBatch: any[] = [];
  for (let day = DAYS; day >= 0; day--) {
    for (let hour = 0; hour < 24; hour++) {
      const ts = daysAgo(day);
      ts.setHours(hour, randInt(0, 59), randInt(0, 59), 0);
      for (const zone of zoneRecords) {
        const p = getMobilityProfile(zone.zoneType, hour);
        mobilityBatch.push({
          zoneId: zone.id,
          mobilityScore:   round(p.mobilityScore),
          pedestrianCount: p.pedestrianCount,
          vehicularCount:  p.vehicularCount,
          transitCount:    p.transitCount,
          cyclistCount:    p.cyclistCount,
          avgSpeedKmh:     p.avgSpeedKmh,
          congestionPct:   p.congestionPct,
          dataSource:      randChoice(["gtfs", "sensor", "model"]),
          recordedAt:      new Date(ts),
        });
      }
    }
  }
  for (let i = 0; i < mobilityBatch.length; i += CHUNK) {
    await prisma.mobilityEvent.createMany({ data: mobilityBatch.slice(i, i + CHUNK) });
    process.stdout.write(`\r  → ${Math.min(i + CHUNK, mobilityBatch.length).toLocaleString()} / ${mobilityBatch.length.toLocaleString()}`);
  }
  console.log(`\n✅ ${mobilityBatch.length.toLocaleString()} mobility events\n`);

  // Air Quality
  console.log("💨 Seeding air quality logs...");
  const aqiBatch: any[] = [];
  for (let day = DAYS; day >= 0; day--) {
    for (const hour of [0, 6, 12, 18]) {
      const ts = daysAgo(day);
      ts.setHours(hour, 0, 0, 0);
      for (const zone of zoneRecords) {
        const p = getAQIProfile(zone.zoneType);
        aqiBatch.push({ zoneId: zone.id, ...p, recordedAt: new Date(ts) });
      }
    }
  }
  for (let i = 0; i < aqiBatch.length; i += CHUNK) {
    await prisma.airQualityLog.createMany({ data: aqiBatch.slice(i, i + CHUNK) });
  }
  console.log(`✅ ${aqiBatch.length.toLocaleString()} air quality logs\n`);

  // Sentiment
  console.log("💬 Seeding sentiment logs...");
  const sentimentBatch: any[] = [];
  for (let day = DAYS; day >= 0; day--) {
    for (const topic of TOPICS) {
      const ts = daysAgo(day);
      ts.setHours(randInt(8, 20), randInt(0, 59), 0, 0);
      for (const zone of zoneRecords) {
        const p = getSentimentProfile(zone.zoneType, topic);
        sentimentBatch.push({ zoneId: zone.id, score: p.score, magnitude: p.magnitude, volume: p.volume, topic, source: randChoice(["public_data", "social_media", "survey"]), recordedAt: new Date(ts) });
      }
    }
  }
  for (let i = 0; i < sentimentBatch.length; i += CHUNK) {
    await prisma.sentimentLog.createMany({ data: sentimentBatch.slice(i, i + CHUNK) });
  }
  console.log(`✅ ${sentimentBatch.length.toLocaleString()} sentiment logs\n`);

  // Anomalies
  console.log("⚠️  Seeding anomalies...");
  const anomalyBatch: any[] = [];
  const severities:  Severity[]   = [Severity.LOW, Severity.LOW, Severity.MEDIUM, Severity.MEDIUM, Severity.HIGH, Severity.CRITICAL];
  const signalTypes: SignalType[]  = [SignalType.MOBILITY, SignalType.AIR_QUALITY, SignalType.NOISE, SignalType.SENTIMENT, SignalType.ENERGY, SignalType.SAFETY];

  for (const zone of zoneRecords) {
    for (let i = 0; i < randInt(10, 32); i++) {
      const severity    = randChoice(severities);
      const zScoreMin   = severity === Severity.LOW ? 2.0 : severity === Severity.MEDIUM ? 2.5 : severity === Severity.HIGH ? 3.0 : 3.8;
      const zScoreMax   = severity === Severity.LOW ? 2.6 : severity === Severity.MEDIUM ? 3.2 : severity === Severity.HIGH ? 3.9 : 5.5;
      const baselineVal = round(rand(32, 88));
      const multiplier  = severity === Severity.LOW ? rand(1.1, 1.3) : severity === Severity.MEDIUM ? rand(1.3, 1.6) : rand(1.6, 2.5);
      const detectedAt  = randomDateBetween(daysAgo(60), new Date());
      const resolved    = Math.random() > 0.38;
      anomalyBatch.push({
        zoneId: zone.id,
        signalType:  randChoice(signalTypes),
        zScore:      round(rand(zScoreMin, zScoreMax), 3),
        baselineVal,
        actualVal:   round(baselineVal * multiplier),
        severity,
        resolved,
        notes:      resolved ? "Resolved after investigation." : null,
        detectedAt,
        resolvedAt: resolved ? new Date(detectedAt.getTime() + randInt(30, 480) * 60000) : null,
      });
    }
  }
  await prisma.anomaly.createMany({ data: anomalyBatch });
  console.log(`✅ ${anomalyBatch.length} anomalies\n`);

  // Risk Snapshots
  console.log("📊 Seeding risk snapshots...");
  const riskBatch: any[] = [];
  const anomalyByZone: Record<string, { total: number; critical: number }> = {};
  for (const zone of zoneRecords) {
    const za = anomalyBatch.filter((a) => a.zoneId === zone.id);
    anomalyByZone[zone.id] = { total: za.length, critical: za.filter((a) => a.severity === Severity.CRITICAL).length };
  }

  for (let day = DAYS; day >= 0; day--) {
    const snapshotDate = daysAgo(day);
    snapshotDate.setHours(3, 0, 0, 0);
    const dayScores: Array<{ zoneId: string; score: number }> = [];

    for (const zone of zoneRecords) {
      const avgMobility    = rand(30, 90);
      const counts         = anomalyByZone[zone.id];
      const anomalyDensity = Math.min(counts.total / 30, 1);
      const criticalPct    = counts.total > 0 ? counts.critical / counts.total : 0;
      const riskScore      = clamp(round(rand(0.2, 1.9) / Math.max(avgMobility / 100, 0.1) * 35 + anomalyDensity * 45 + criticalPct * 20), 0, 100);
      dayScores.push({ zoneId: zone.id, score: riskScore });
    }

    dayScores.sort((a, b) => b.score - a.score);
    for (let i = 0; i < dayScores.length; i++) {
      const { zoneId, score } = dayScores[i];
      riskBatch.push({
        zoneId,
        riskScore:      score,
        riskTier:       getRiskTier(score),
        riskRank:       i + 1,
        weeklyDriftPct: round(score - clamp(score + rand(-8, 8), 0, 100), 2),
        anomalyCount:   anomalyByZone[zoneId].total,
        avgMobility:    round(rand(30, 90)),
        snapshotDate,
      });
    }
  }

  for (let i = 0; i < riskBatch.length; i += CHUNK) {
    await prisma.riskSnapshot.createMany({ data: riskBatch.slice(i, i + CHUNK), skipDuplicates: true });
  }
  console.log(`✅ ${riskBatch.length.toLocaleString()} risk snapshots\n`);

  // Demo User
  console.log("👤 Creating demo user...");
  await prisma.user.create({
    data: { name: "Luminary Admin", email: "admin@luminary.city", image: "https://avatars.githubusercontent.com/u/249793749?v=4", role: "ADMIN" },
  });
  console.log("✅ admin@luminary.city\n");

  const total = mobilityBatch.length + aqiBatch.length + sentimentBatch.length + anomalyBatch.length + riskBatch.length;
  console.log("━".repeat(52));
  console.log("✦  SEED COMPLETE");
  console.log("━".repeat(52));
  console.log(`  Zones          : ${zoneRecords.length}`);
  console.log(`  Mobility       : ${mobilityBatch.length.toLocaleString()}`);
  console.log(`  Air Quality    : ${aqiBatch.length.toLocaleString()}`);
  console.log(`  Sentiment      : ${sentimentBatch.length.toLocaleString()}`);
  console.log(`  Anomalies      : ${anomalyBatch.length}`);
  console.log(`  Risk Snapshots : ${riskBatch.length.toLocaleString()}`);
  console.log(`  TOTAL          : ${total.toLocaleString()}`);
  console.log("━".repeat(52));
  console.log("\n🚀 Dashboard ready → /dashboard\n");
}

main()
  .catch((e) => { console.error("❌ Seed failed:", e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
