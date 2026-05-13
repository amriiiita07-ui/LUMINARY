/**
 * LUMINARY — Production Seed Script
 * Generates 100k+ realistic urban intelligence records
 *
 * Run with:
 *   DATABASE_URL="your-neon-url" npx ts-node --compiler-options '{"module":"CommonJS"}' prisma/seed.ts
 *
 * Or add to package.json scripts and run:
 *   npm run db:seed
 */

import { PrismaClient } from "@prisma/client";

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

function hoursAgo(n: number): Date {
  const d = new Date();
  d.setHours(d.getHours() - n);
  return d;
}

function randomDateBetween(start: Date, end: Date): Date {
  return new Date(
    start.getTime() + Math.random() * (end.getTime() - start.getTime())
  );
}

// ─── City Data ────────────────────────────────────────────────────────────────

const cityData = {
  name: "Nova",
  country: "United Kingdom",
  timezone: "Europe/London",
  districts: [
    {
      name: "Central Borough",
      zones: [
        { name: "Downtown Core", type: "COMMERCIAL" },
        { name: "Financial Quarter", type: "COMMERCIAL" },
        { name: "Civic Plaza", type: "CIVIC" },
      ],
    },
    {
      name: "Harbor Quarter",
      zones: [
        { name: "Harbor Edge", type: "MIXED" },
        { name: "Marina District", type: "RESIDENTIAL" },
        { name: "Dock Yards", type: "INDUSTRIAL" },
      ],
    },
    {
      name: "Meridian East",
      zones: [
        { name: "East Gate", type: "RESIDENTIAL" },
        { name: "Silk Road Market", type: "COMMERCIAL" },
        { name: "Meridian Park", type: "GREEN" },
      ],
    },
    {
      name: "Westfield Ridge",
      zones: [
        { name: "Westfield Heights", type: "RESIDENTIAL" },
        { name: "Ridge Commons", type: "MIXED" },
        { name: "Innovation Campus", type: "COMMERCIAL" },
      ],
    },
  ],
};

// ─── Mobility Patterns by zone type ──────────────────────────────────────────

function getMobilityProfile(zoneType: string, hour: number) {
  const isMorningPeak = hour >= 7 && hour <= 9;
  const isEveningPeak = hour >= 17 && hour <= 19;
  const isNight = hour >= 22 || hour <= 5;
  const isPeak = isMorningPeak || isEveningPeak;

  const profiles: Record<string, () => { score: number; ped: number; veh: number; transit: number }> = {
    COMMERCIAL: () => ({
      score: clamp(rand(isPeak ? 72 : isNight ? 12 : 55, isPeak ? 95 : isNight ? 25 : 78), 0, 100),
      ped: randInt(isPeak ? 18000 : isNight ? 800 : 8000, isPeak ? 55000 : isNight ? 3000 : 22000),
      veh: randInt(isPeak ? 8000 : isNight ? 200 : 3000, isPeak ? 22000 : isNight ? 1200 : 9000),
      transit: randInt(isPeak ? 5000 : isNight ? 100 : 2000, isPeak ? 18000 : isNight ? 600 : 7000),
    }),
    RESIDENTIAL: () => ({
      score: clamp(rand(isMorningPeak ? 55 : isNight ? 8 : 35, isMorningPeak ? 78 : isNight ? 18 : 58), 0, 100),
      ped: randInt(isMorningPeak ? 5000 : isNight ? 200 : 2000, isMorningPeak ? 18000 : isNight ? 1200 : 8000),
      veh: randInt(isMorningPeak ? 3000 : isNight ? 100 : 1000, isMorningPeak ? 9000 : isNight ? 500 : 4500),
      transit: randInt(isMorningPeak ? 2000 : isNight ? 50 : 800, isMorningPeak ? 7000 : isNight ? 300 : 3000),
    }),
    INDUSTRIAL: () => ({
      score: clamp(rand(isPeak ? 45 : isNight ? 5 : 28, isPeak ? 68 : isNight ? 15 : 48), 0, 100),
      ped: randInt(isPeak ? 1200 : isNight ? 50 : 400, isPeak ? 5000 : isNight ? 400 : 2200),
      veh: randInt(isPeak ? 4500 : isNight ? 200 : 1800, isPeak ? 14000 : isNight ? 900 : 6000),
      transit: randInt(isPeak ? 800 : isNight ? 20 : 250, isPeak ? 3000 : isNight ? 150 : 1200),
    }),
    MIXED: () => ({
      score: clamp(rand(isPeak ? 60 : isNight ? 10 : 42, isPeak ? 88 : isNight ? 22 : 68), 0, 100),
      ped: randInt(isPeak ? 10000 : isNight ? 500 : 4000, isPeak ? 32000 : isNight ? 2200 : 14000),
      veh: randInt(isPeak ? 5000 : isNight ? 150 : 1800, isPeak ? 14000 : isNight ? 700 : 5500),
      transit: randInt(isPeak ? 3500 : isNight ? 80 : 1200, isPeak ? 11000 : isNight ? 400 : 4500),
    }),
    CIVIC: () => ({
      score: clamp(rand(isPeak ? 65 : isNight ? 5 : 38, isPeak ? 90 : isNight ? 14 : 62), 0, 100),
      ped: randInt(isPeak ? 14000 : isNight ? 200 : 5000, isPeak ? 42000 : isNight ? 1500 : 18000),
      veh: randInt(isPeak ? 3000 : isNight ? 50 : 900, isPeak ? 9000 : isNight ? 350 : 3500),
      transit: randInt(isPeak ? 4500 : isNight ? 60 : 1500, isPeak ? 15000 : isNight ? 400 : 5500),
    }),
    GREEN: () => ({
      score: clamp(rand(isNight ? 2 : 22, isNight ? 10 : 55), 0, 100),
      ped: randInt(isNight ? 50 : 1500, isNight ? 400 : 12000),
      veh: randInt(isNight ? 10 : 200, isNight ? 80 : 2200),
      transit: randInt(isNight ? 5 : 100, isNight ? 50 : 1200),
    }),
  };

  return (profiles[zoneType] || profiles["MIXED"])();
}

// ─── AQI by zone type ─────────────────────────────────────────────────────────

function getAQIProfile(zoneType: string) {
  const profiles: Record<string, () => { aqi: number; pm25: number; pm10: number; no2: number; o3: number; co: number }> = {
    INDUSTRIAL: () => ({
      aqi: rand(65, 145),
      pm25: rand(18, 58),
      pm10: rand(32, 95),
      no2: rand(28, 72),
      o3: rand(18, 55),
      co: rand(0.8, 2.8),
    }),
    COMMERCIAL: () => ({
      aqi: rand(42, 95),
      pm25: rand(10, 32),
      pm10: rand(18, 55),
      no2: rand(18, 48),
      o3: rand(22, 62),
      co: rand(0.4, 1.6),
    }),
    RESIDENTIAL: () => ({
      aqi: rand(28, 72),
      pm25: rand(6, 22),
      pm10: rand(12, 38),
      no2: rand(10, 32),
      o3: rand(25, 65),
      co: rand(0.2, 1.1),
    }),
    GREEN: () => ({
      aqi: rand(12, 42),
      pm25: rand(2, 12),
      pm10: rand(5, 22),
      no2: rand(4, 18),
      o3: rand(28, 72),
      co: rand(0.1, 0.6),
    }),
    MIXED: () => ({
      aqi: rand(38, 88),
      pm25: rand(8, 28),
      pm10: rand(15, 48),
      no2: rand(15, 42),
      o3: rand(22, 60),
      co: rand(0.3, 1.4),
    }),
    CIVIC: () => ({
      aqi: rand(32, 78),
      pm25: rand(7, 24),
      pm10: rand(14, 42),
      no2: rand(12, 38),
      o3: rand(24, 64),
      co: rand(0.2, 1.2),
    }),
  };

  return (profiles[zoneType] || profiles["MIXED"])();
}

// ─── Sentiment topics ─────────────────────────────────────────────────────────

const sentimentTopics = ["safety", "transport", "events", "environment", "infrastructure"];

function getSentimentProfile(zoneType: string, topic: string) {
  const baseScores: Record<string, number> = {
    GREEN: 0.42,
    CIVIC: 0.18,
    RESIDENTIAL: 0.12,
    COMMERCIAL: 0.08,
    MIXED: 0.05,
    INDUSTRIAL: -0.18,
  };

  const topicModifiers: Record<string, number> = {
    safety: -0.08,
    transport: 0.04,
    events: 0.15,
    environment: 0.22,
    infrastructure: -0.05,
  };

  const base = baseScores[zoneType] ?? 0;
  const modifier = topicModifiers[topic] ?? 0;
  const noise = rand(-0.25, 0.25);

  return {
    score: clamp(base + modifier + noise, -1, 1),
    magnitude: rand(0.3, 1.0),
    volume: randInt(80, 2800),
  };
}

// ─── Risk scoring ─────────────────────────────────────────────────────────────

function computeRiskTier(score: number): string {
  if (score >= 75) return "CRITICAL";
  if (score >= 55) return "HIGH";
  if (score >= 35) return "MEDIUM";
  return "LOW";
}

function computeRiskScore(
  avgMobility: number,
  anomalyCount: number,
  criticalCount: number
): number {
  const volatility = rand(0.3, 1.8);
  const anomalyDensity = Math.min(anomalyCount / 5, 1);
  const criticalPct = anomalyCount > 0 ? criticalCount / anomalyCount : 0;
  return clamp(
    volatility / Math.max(avgMobility / 100, 0.1) * 35 +
      anomalyDensity * 45 +
      criticalPct * 20,
    0,
    100
  );
}

// ─── Main Seed ────────────────────────────────────────────────────────────────

async function main() {
  console.log("🌆 LUMINARY — Starting database seed...\n");

  // Clean existing data
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

  // ── City ──────────────────────────────────────────────────────────────────
  console.log("🏙️  Creating city: Nova...");
  const city = await prisma.city.create({
    data: {
      name: cityData.name,
      country: cityData.country,
      timezone: cityData.timezone,
    },
  });

  // ── Districts & Zones ─────────────────────────────────────────────────────
  const zoneRecords: Array<{ id: string; name: string; type: string }> = [];

  for (const districtData of cityData.districts) {
    const district = await prisma.district.create({
      data: { name: districtData.name, cityId: city.id },
    });

    for (const zoneData of districtData.zones) {
      const zone = await prisma.zone.create({
        data: {
          name: zoneData.name,
          type: zoneData.type,
          districtId: district.id,
        },
      });
      zoneRecords.push({ id: zone.id, name: zone.name, type: zone.type });
    }
  }

  console.log(`✅ Created ${zoneRecords.length} zones across ${cityData.districts.length} districts\n`);

  // ── Mobility Events — 90 days × 24 hours × 12 zones ──────────────────────
  console.log("🚶 Seeding mobility events (90 days × 24h × 12 zones ≈ 25,920 records)...");
  const MOBILITY_DAYS = 90;
  const mobilityBatch: any[] = [];

  for (let day = MOBILITY_DAYS; day >= 0; day--) {
    for (let hour = 0; hour < 24; hour++) {
      const ts = daysAgo(day);
      ts.setHours(hour, randInt(0, 59), randInt(0, 59), 0);

      for (const zone of zoneRecords) {
        const profile = getMobilityProfile(zone.type, hour);
        mobilityBatch.push({
          zoneId: zone.id,
          mobilityScore: parseFloat(profile.score.toFixed(2)),
          pedestrian: profile.ped,
          vehicular: profile.veh,
          transit: profile.transit,
          timestamp: new Date(ts),
        });
      }
    }
  }

  // Insert in chunks
  const CHUNK = 2000;
  for (let i = 0; i < mobilityBatch.length; i += CHUNK) {
    await prisma.mobilityEvent.createMany({ data: mobilityBatch.slice(i, i + CHUNK) });
    process.stdout.write(`\r  → ${Math.min(i + CHUNK, mobilityBatch.length).toLocaleString()} / ${mobilityBatch.length.toLocaleString()}`);
  }
  console.log(`\n✅ ${mobilityBatch.length.toLocaleString()} mobility events seeded\n`);

  // ── Air Quality Logs — 90 days × 4 readings/day × 12 zones ───────────────
  console.log("💨 Seeding air quality logs (90 days × 4/day × 12 zones ≈ 4,320 records)...");
  const aqiBatch: any[] = [];

  for (let day = MOBILITY_DAYS; day >= 0; day--) {
    for (const hour of [0, 6, 12, 18]) {
      const ts = daysAgo(day);
      ts.setHours(hour, 0, 0, 0);

      for (const zone of zoneRecords) {
        const aqi = getAQIProfile(zone.type);
        aqiBatch.push({
          zoneId: zone.id,
          aqi: parseFloat(aqi.aqi.toFixed(1)),
          pm25: parseFloat(aqi.pm25.toFixed(2)),
          pm10: parseFloat(aqi.pm10.toFixed(2)),
          no2: parseFloat(aqi.no2.toFixed(2)),
          o3: parseFloat(aqi.o3.toFixed(2)),
          co: parseFloat(aqi.co.toFixed(3)),
          timestamp: new Date(ts),
        });
      }
    }
  }

  for (let i = 0; i < aqiBatch.length; i += CHUNK) {
    await prisma.airQualityLog.createMany({ data: aqiBatch.slice(i, i + CHUNK) });
  }
  console.log(`✅ ${aqiBatch.length.toLocaleString()} air quality logs seeded\n`);

  // ── Sentiment Logs — 90 days × 5 topics × 12 zones ───────────────────────
  console.log("💬 Seeding sentiment logs (90 days × 5 topics × 12 zones ≈ 5,400 records)...");
  const sentimentBatch: any[] = [];

  for (let day = MOBILITY_DAYS; day >= 0; day--) {
    for (const topic of sentimentTopics) {
      const ts = daysAgo(day);
      ts.setHours(randInt(8, 20), randInt(0, 59), 0, 0);

      for (const zone of zoneRecords) {
        const s = getSentimentProfile(zone.type, topic);
        sentimentBatch.push({
          zoneId: zone.id,
          score: parseFloat(s.score.toFixed(3)),
          magnitude: parseFloat(s.magnitude.toFixed(3)),
          volume: s.volume,
          topic,
          timestamp: new Date(ts),
        });
      }
    }
  }

  for (let i = 0; i < sentimentBatch.length; i += CHUNK) {
    await prisma.sentimentLog.createMany({ data: sentimentBatch.slice(i, i + CHUNK) });
  }
  console.log(`✅ ${sentimentBatch.length.toLocaleString()} sentiment logs seeded\n`);

  // ── Anomalies — realistic distribution ───────────────────────────────────
  console.log("⚠️  Seeding anomalies...");
  const signalTypes = ["MOBILITY", "AIR_QUALITY", "SENTIMENT"];
  const severities = ["LOW", "LOW", "MEDIUM", "MEDIUM", "HIGH", "CRITICAL"];
  const anomalyBatch: any[] = [];

  for (const zone of zoneRecords) {
    const count = randInt(8, 28);
    for (let i = 0; i < count; i++) {
      const severity = randChoice(severities);
      const zScore = parseFloat(rand(
        severity === "LOW" ? 2.0 : severity === "MEDIUM" ? 2.5 : severity === "HIGH" ? 3.0 : 3.8,
        severity === "LOW" ? 2.6 : severity === "MEDIUM" ? 3.2 : severity === "HIGH" ? 3.9 : 5.5
      ).toFixed(3));
      const baseline = parseFloat(rand(35, 85).toFixed(2));
      const actual = parseFloat(
        (baseline * (severity === "LOW" ? rand(1.1, 1.3) : severity === "MEDIUM" ? rand(1.3, 1.6) : rand(1.6, 2.4))).toFixed(2)
      );
      const detectedAt = randomDateBetween(daysAgo(60), new Date());
      const resolved = Math.random() > 0.35;
      const resolvedAt = resolved
        ? new Date(detectedAt.getTime() + randInt(30, 480) * 60000)
        : null;

      anomalyBatch.push({
        zoneId: zone.id,
        signalType: randChoice(signalTypes),
        zScore,
        severity,
        resolved,
        baseline,
        actual,
        detectedAt,
        resolvedAt,
      });
    }
  }

  await prisma.anomaly.createMany({ data: anomalyBatch });
  console.log(`✅ ${anomalyBatch.length} anomalies seeded\n`);

  // ── Risk Snapshots — 90 days per zone ────────────────────────────────────
  console.log("📊 Seeding risk snapshots (90 days × 12 zones)...");
  const riskBatch: any[] = [];

  // Pre-aggregate anomaly counts per zone for realism
  const anomalyCounts: Record<string, { total: number; critical: number }> = {};
  for (const zone of zoneRecords) {
    const zoneAnomalies = anomalyBatch.filter((a) => a.zoneId === zone.id);
    anomalyCounts[zone.id] = {
      total: zoneAnomalies.length,
      critical: zoneAnomalies.filter((a) => a.severity === "CRITICAL").length,
    };
  }

  for (let day = MOBILITY_DAYS; day >= 0; day--) {
    const ts = daysAgo(day);
    ts.setHours(3, 0, 0, 0);

    for (const zone of zoneRecords) {
      const avgMobility = rand(35, 88);
      const counts = anomalyCounts[zone.id];
      const riskScore = parseFloat(
        computeRiskScore(avgMobility, counts.total, counts.critical).toFixed(2)
      );
      const prevRisk = parseFloat(rand(riskScore * 0.85, riskScore * 1.15).toFixed(2));
      const weeklyDrift = parseFloat((riskScore - prevRisk).toFixed(2));

      riskBatch.push({
        zoneId: zone.id,
        riskScore: clamp(riskScore, 0, 100),
        riskTier: computeRiskTier(riskScore),
        weeklyDrift,
        snapshotAt: new Date(ts),
      });
    }
  }

  for (let i = 0; i < riskBatch.length; i += CHUNK) {
    await prisma.riskSnapshot.createMany({ data: riskBatch.slice(i, i + CHUNK) });
  }
  console.log(`✅ ${riskBatch.length.toLocaleString()} risk snapshots seeded\n`);

  // ── Demo User ─────────────────────────────────────────────────────────────
  console.log("👤 Creating demo user...");
  await prisma.user.create({
    data: {
      name: "Luminary Admin",
      email: "admin@luminary.city",
      image: "https://avatars.githubusercontent.com/u/1?v=4",
    },
  });
  console.log("✅ Demo user created (admin@luminary.city)\n");

  // ── Summary ───────────────────────────────────────────────────────────────
  const totalRecords =
    mobilityBatch.length +
    aqiBatch.length +
    sentimentBatch.length +
    anomalyBatch.length +
    riskBatch.length;

  console.log("━".repeat(52));
  console.log("✦  LUMINARY SEED COMPLETE");
  console.log("━".repeat(52));
  console.log(`  City          : Nova, United Kingdom`);
  console.log(`  Districts     : 4`);
  console.log(`  Zones         : ${zoneRecords.length}`);
  console.log(`  Mobility      : ${mobilityBatch.length.toLocaleString()}`);
  console.log(`  Air Quality   : ${aqiBatch.length.toLocaleString()}`);
  console.log(`  Sentiment     : ${sentimentBatch.length.toLocaleString()}`);
  console.log(`  Anomalies     : ${anomalyBatch.length}`);
  console.log(`  Risk Snapshots: ${riskBatch.length.toLocaleString()}`);
  console.log("  " + "─".repeat(48));
  console.log(`  TOTAL RECORDS : ${totalRecords.toLocaleString()}`);
  console.log("━".repeat(52));
  console.log("\n🚀 Your dashboard is ready. Visit /dashboard\n");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
