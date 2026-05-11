// ─────────────────────────────────────────────────────────────
// LUMINARY — Database Seed
// Realistic urban data for demo / development
// ─────────────────────────────────────────────────────────────

import { PrismaClient, Severity, SignalType, RiskTier, UserRole } from "@prisma/client";

const db = new PrismaClient();

// ── Helpers ────────────────────────────────────────────────

function rand(min: number, max: number) {
  return Math.random() * (max - min) + min;
}
function randInt(min: number, max: number) {
  return Math.floor(rand(min, max + 1));
}
function randomItem<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}
function daysAgo(n: number) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}
function hoursAgo(n: number) {
  const d = new Date();
  d.setHours(d.getHours() - n);
  return d;
}

// ── Main Seed ──────────────────────────────────────────────

async function main() {
  console.log("🌱  Seeding LUMINARY database...\n");

  // ── 1. City ─────────────────────────────────────────────
  const city = await db.city.upsert({
    where: { name: "Nova City" },
    update: {},
    create: {
      name:       "Nova City",
      country:    "US",
      lat:        40.7128,
      lng:        -74.006,
      timezone:   "America/New_York",
      population: 8400000,
      areaKm2:    783.8,
    },
  });
  console.log(`✅  City created: ${city.name}`);

  // ── 2. Districts ─────────────────────────────────────────
  const districtData = [
    { name: "Central Borough", population: 1800000 },
    { name: "Harbor Quarter",  population: 950000  },
    { name: "North Ridge",     population: 1200000 },
    { name: "East Corridor",   population: 780000  },
    { name: "South Commons",   population: 1100000 },
  ];

  const districts = await Promise.all(
    districtData.map((d) =>
      db.district.upsert({
        where: { name_cityId: { name: d.name, cityId: city.id } },
        update: {},
        create: { ...d, cityId: city.id },
      })
    )
  );
  console.log(`✅  ${districts.length} districts created`);

  // ── 3. Zones ─────────────────────────────────────────────
  const zoneTemplates = [
    // Central Borough
    { name: "Downtown Core",      code: "NC-CB-001", district: 0, lat: 40.7589, lng: -73.9851, area: 2.8,  pop: 85000,  type: "commercial"   },
    { name: "Financial District",  code: "NC-CB-002", district: 0, lat: 40.7074, lng: -74.0113, area: 1.9,  pop: 42000,  type: "commercial"   },
    { name: "Midtown Arts",        code: "NC-CB-003", district: 0, lat: 40.7549, lng: -73.9840, area: 3.1,  pop: 68000,  type: "mixed"        },
    // Harbor Quarter
    { name: "Harbor Edge",         code: "NC-HQ-001", district: 1, lat: 40.6892, lng: -74.0445, area: 4.2,  pop: 92000,  type: "mixed"        },
    { name: "Waterfront Promenade",code: "NC-HQ-002", district: 1, lat: 40.6995, lng: -74.0187, area: 1.5,  pop: 28000,  type: "residential"  },
    // North Ridge
    { name: "North Quarter",       code: "NC-NR-001", district: 2, lat: 40.8448, lng: -73.8648, area: 5.8,  pop: 124000, type: "residential"  },
    { name: "Ridge Tech Corridor", code: "NC-NR-002", district: 2, lat: 40.8199, lng: -73.9442, area: 3.3,  pop: 55000,  type: "commercial"   },
    // East Corridor
    { name: "East Village Gate",   code: "NC-EC-001", district: 3, lat: 40.7265, lng: -73.9815, area: 2.1,  pop: 78000,  type: "mixed"        },
    { name: "Industrial Reach",    code: "NC-EC-002", district: 3, lat: 40.7181, lng: -73.9566, area: 6.4,  pop: 22000,  type: "industrial"   },
    // South Commons
    { name: "South Market",        code: "NC-SC-001", district: 4, lat: 40.6782, lng: -73.9442, area: 3.7,  pop: 98000,  type: "mixed"        },
    { name: "Civic Green",         code: "NC-SC-002", district: 4, lat: 40.6501, lng: -73.9496, area: 2.2,  pop: 61000,  type: "residential"  },
  ];

  const zones = await Promise.all(
    zoneTemplates.map((z) =>
      db.zone.upsert({
        where: { code: z.code },
        update: {},
        create: {
          name:       z.name,
          code:       z.code,
          districtId: districts[z.district].id,
          cityId:     city.id,
          lat:        z.lat,
          lng:        z.lng,
          areaKm2:    z.area,
          population: z.pop,
          zoneType:   z.type,
        },
      })
    )
  );
  console.log(`✅  ${zones.length} zones created`);

  // ── 4. Mobility Events (90 days × 24 hrs × zones) ────────
  console.log("📊  Seeding mobility events (this may take a moment)...");
  const mobilityBatch: Parameters<typeof db.mobilityEvent.create>[0]["data"][] = [];

  for (const zone of zones) {
    const baseScore = zone.zoneType === "commercial" ? 75 : zone.zoneType === "industrial" ? 45 : 60;

    for (let day = 89; day >= 0; day--) {
      // 8 samples per day (every 3 hrs)
      for (let h = 0; h < 8; h++) {
        const hourOfDay = h * 3;
        const isRushHour = hourOfDay === 8 || hourOfDay === 17;
        const isWeekend  = (new Date(daysAgo(day))).getDay() % 6 === 0;

        const modifier   = isRushHour ? 1.35 : isWeekend ? 0.7 : 1.0;
        const noise      = rand(-8, 8);
        const score      = Math.min(100, Math.max(0, baseScore * modifier + noise));

        const recordedAt = new Date(daysAgo(day));
        recordedAt.setHours(hourOfDay);

        mobilityBatch.push({
          zoneId:          zone.id,
          mobilityScore:   Math.round(score * 10) / 10,
          pedestrianCount: randInt(200, 8000),
          vehicularCount:  randInt(50,  3000),
          transitCount:    randInt(10,  500),
          cyclistCount:    randInt(5,   200),
          avgSpeedKmh:     Math.round(rand(8, 55) * 10) / 10,
          congestionPct:   Math.round(rand(5, 85) * 10) / 10,
          dataSource:      "gtfs",
          recordedAt,
        });
      }
    }
  }

  // Batch insert in chunks of 500
  const chunkSize = 500;
  for (let i = 0; i < mobilityBatch.length; i += chunkSize) {
    await db.mobilityEvent.createMany({ data: mobilityBatch.slice(i, i + chunkSize) as any });
  }
  console.log(`✅  ${mobilityBatch.length} mobility events seeded`);

  // ── 5. Air Quality Logs ────────────────────────────────
  const aqiCategories = ["Good", "Moderate", "Unhealthy for Sensitive Groups", "Unhealthy"];
  const aqiBatch: Parameters<typeof db.airQualityLog.create>[0]["data"][] = [];

  for (const zone of zones) {
    for (let day = 29; day >= 0; day--) {
      const baseAqi = zone.zoneType === "industrial" ? 80 : zone.zoneType === "commercial" ? 55 : 35;
      const aqi = Math.min(200, Math.max(0, randInt(baseAqi - 20, baseAqi + 30)));

      aqiBatch.push({
        zoneId:    zone.id,
        aqi,
        pm25:      Math.round(rand(4, 45)  * 10) / 10,
        pm10:      Math.round(rand(10, 80) * 10) / 10,
        no2:       Math.round(rand(5, 60)  * 10) / 10,
        o3:        Math.round(rand(20, 80) * 10) / 10,
        co:        Math.round(rand(0.2, 3) * 100) / 100,
        category:  aqi < 50 ? "Good" : aqi < 100 ? "Moderate" : aqi < 150 ? "Unhealthy for Sensitive Groups" : "Unhealthy",
        recordedAt: daysAgo(day),
      });
    }
  }

  await db.airQualityLog.createMany({ data: aqiBatch as any });
  console.log(`✅  ${aqiBatch.length} air quality records seeded`);

  // ── 6. Anomalies ────────────────────────────────────────
  const anomalyData = [
    { zone: 0, signal: SignalType.MOBILITY,    zScore: 3.8, baseline: 72, actual: 38, severity: Severity.HIGH,     resolved: true,  daysAgo: 15 },
    { zone: 1, signal: SignalType.AIR_QUALITY, zScore: 4.2, baseline: 45, actual: 118, severity: Severity.CRITICAL, resolved: false, daysAgo: 2  },
    { zone: 3, signal: SignalType.MOBILITY,    zScore: 2.9, baseline: 65, actual: 91, severity: Severity.MEDIUM,   resolved: true,  daysAgo: 8  },
    { zone: 7, signal: SignalType.NOISE,       zScore: 3.1, baseline: 52, actual: 78, severity: Severity.HIGH,     resolved: false, daysAgo: 1  },
    { zone: 2, signal: SignalType.SENTIMENT,   zScore: -3.4, baseline: 0.2, actual: -0.7, severity: Severity.HIGH, resolved: false, daysAgo: 3  },
    { zone: 5, signal: SignalType.ENERGY,      zScore: 2.7, baseline: 840, actual: 1260, severity: Severity.MEDIUM, resolved: true, daysAgo: 5  },
    { zone: 9, signal: SignalType.MOBILITY,    zScore: 3.3, baseline: 58, actual: 21, severity: Severity.HIGH,     resolved: false, daysAgo: 0  },
    { zone: 4, signal: SignalType.AIR_QUALITY, zScore: 2.6, baseline: 38, actual: 72, severity: Severity.MEDIUM,   resolved: true,  daysAgo: 12 },
  ];

  await db.anomaly.createMany({
    data: anomalyData.map((a) => ({
      zoneId:      zones[a.zone].id,
      signalType:  a.signal,
      zScore:      a.zScore,
      baselineVal: a.baseline,
      actualVal:   a.actual,
      severity:    a.severity,
      resolved:    a.resolved,
      detectedAt:  daysAgo(a.daysAgo),
      resolvedAt:  a.resolved ? hoursAgo(randInt(2, 48)) : null,
    })),
  });
  console.log(`✅  ${anomalyData.length} anomalies seeded`);

  // ── 7. Sentiment Logs ──────────────────────────────────
  const topics = ["safety", "transport", "events", "environment", "infrastructure"];
  const sentimentBatch: Parameters<typeof db.sentimentLog.create>[0]["data"][] = [];

  for (const zone of zones) {
    for (let day = 29; day >= 0; day--) {
      const score = Math.round(rand(-0.8, 0.9) * 100) / 100;
      sentimentBatch.push({
        zoneId:    zone.id,
        score,
        magnitude: Math.round(rand(0.1, 0.9) * 100) / 100,
        volume:    randInt(50, 2000),
        topic:     randomItem(topics),
        source:    "public_data",
        recordedAt: daysAgo(day),
      });
    }
  }

  await db.sentimentLog.createMany({ data: sentimentBatch as any });
  console.log(`✅  ${sentimentBatch.length} sentiment logs seeded`);

  // ── 8. Risk Snapshots (last 30 days) ──────────────────
  const riskBatch: Parameters<typeof db.riskSnapshot.create>[0]["data"][] = [];

  for (const zone of zones) {
    for (let day = 29; day >= 0; day--) {
      const riskScore = Math.round(rand(20, 90) * 10) / 10;
      riskBatch.push({
        zoneId:        zone.id,
        riskScore,
        riskTier:      riskScore > 70 ? RiskTier.CRITICAL : riskScore > 45 ? RiskTier.ELEVATED : RiskTier.NOMINAL,
        riskRank:      randInt(1, 11),
        weeklyDriftPct: Math.round(rand(-15, 15) * 10) / 10,
        anomalyCount:  randInt(0, 5),
        avgMobility:   Math.round(rand(30, 95) * 10) / 10,
        snapshotDate:  daysAgo(day),
      });
    }
  }

  await db.riskSnapshot.createMany({ data: riskBatch as any });
  console.log(`✅  ${riskBatch.length} risk snapshots seeded`);

  // ── 9. Users ───────────────────────────────────────────
  await db.user.upsert({
    where: { email: "admin@luminary.city" },
    update: {},
    create: {
      email: "admin@luminary.city",
      name:  "Admin User",
      role:  UserRole.ADMIN,
    },
  });
  await db.user.upsert({
    where: { email: "analyst@luminary.city" },
    update: {},
    create: {
      email: "analyst@luminary.city",
      name:  "Nova Analyst",
      role:  UserRole.ANALYST,
    },
  });
  console.log("✅  Demo users created");

  console.log("\n🎉  LUMINARY database seeded successfully!\n");
  console.log("   City:     Nova City");
  console.log(`   Zones:    ${zones.length}`);
  console.log(`   Mobility: ${mobilityBatch.length} events`);
  console.log(`   Anomalies: ${anomalyData.length}`);
  console.log(`   AQI Logs: ${aqiBatch.length}`);
  console.log("\n   Run `npm run db:studio` to inspect your data.\n");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => db.$disconnect());
