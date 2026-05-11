-- ═══════════════════════════════════════════════════════════════
-- LUMINARY — Advanced SQL Analytics Layer
-- PostgreSQL · Window Functions · CTEs · Triggers · Procedures
-- ═══════════════════════════════════════════════════════════════


-- ── 1. INDEXES (performance) ────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_mobility_zone_recorded
  ON "MobilityEvent" ("zoneId", "recordedAt" DESC);

CREATE INDEX IF NOT EXISTS idx_mobility_recorded
  ON "MobilityEvent" ("recordedAt" DESC);

CREATE INDEX IF NOT EXISTS idx_anomaly_zone_detected
  ON "Anomaly" ("zoneId", "detectedAt" DESC);

CREATE INDEX IF NOT EXISTS idx_anomaly_severity_unresolved
  ON "Anomaly" ("severity", "resolved")
  WHERE "resolved" = FALSE;

CREATE INDEX IF NOT EXISTS idx_risk_snapshot_date
  ON "RiskSnapshot" ("snapshotDate" DESC);

CREATE INDEX IF NOT EXISTS idx_sentiment_zone_recorded
  ON "SentimentLog" ("zoneId", "recordedAt" DESC);


-- ── 2. VIEWS ────────────────────────────────────────────────────

-- Zone Risk Intelligence (core analytics view)
CREATE OR REPLACE VIEW v_zone_risk_intelligence AS
WITH thirty_day_metrics AS (
  SELECT
    z.id                          AS zone_id,
    z.name                        AS zone_name,
    z."zoneType"                  AS zone_type,
    d.name                        AS district,
    z.lat, z.lng,
    AVG(m."mobilityScore")        AS avg_mobility,
    STDDEV(m."mobilityScore")     AS mobility_stddev,
    COUNT(DISTINCT DATE(m."recordedAt")) AS days_active,
    COUNT(a.id)                   AS anomaly_count,
    COUNT(a.id) FILTER (WHERE a."severity" = 'CRITICAL') AS critical_count,
    MAX(m."recordedAt")           AS last_event_at
  FROM "Zone" z
  LEFT JOIN "District" d ON d.id = z."districtId"
  LEFT JOIN "MobilityEvent" m ON m."zoneId" = z.id
    AND m."recordedAt" >= NOW() - INTERVAL '30 days'
  LEFT JOIN "Anomaly" a ON a."zoneId" = z.id
    AND a."detectedAt" >= NOW() - INTERVAL '7 days'
  GROUP BY z.id, z.name, z."zoneType", d.name, z.lat, z.lng
),
week_comparison AS (
  SELECT
    "zoneId",
    AVG("mobilityScore") FILTER (
      WHERE "recordedAt" >= NOW() - INTERVAL '7 days'
    ) AS this_week_avg,
    AVG("mobilityScore") FILTER (
      WHERE "recordedAt" BETWEEN NOW() - INTERVAL '14 days' AND NOW() - INTERVAL '7 days'
    ) AS last_week_avg
  FROM "MobilityEvent"
  WHERE "recordedAt" >= NOW() - INTERVAL '14 days'
  GROUP BY "zoneId"
),
risk_scored AS (
  SELECT
    m.*,
    wc.this_week_avg,
    wc.last_week_avg,
    -- Composite risk score (0–100)
    ROUND((
      (COALESCE(m.mobility_stddev, 0) / NULLIF(m.avg_mobility, 0)) * 35 +
      (LEAST(m.anomaly_count, 10) / 10.0) * 45 +
      (LEAST(m.critical_count, 3) / 3.0) * 20
    )::numeric, 2) AS risk_score
  FROM thirty_day_metrics m
  LEFT JOIN week_comparison wc ON wc."zoneId" = m.zone_id
)
SELECT
  zone_id, zone_name, zone_type, district, lat, lng,
  ROUND(avg_mobility::numeric, 1)    AS avg_mobility,
  ROUND(risk_score, 1)               AS risk_score,
  DENSE_RANK() OVER (ORDER BY risk_score DESC) AS risk_rank,
  CASE
    WHEN risk_score > 70 THEN 'CRITICAL'
    WHEN risk_score > 45 THEN 'ELEVATED'
    ELSE 'NOMINAL'
  END AS risk_tier,
  anomaly_count,
  critical_count,
  ROUND(
    ((this_week_avg - last_week_avg) / NULLIF(last_week_avg, 0) * 100)::numeric, 1
  ) AS weekly_drift_pct,
  last_event_at
FROM risk_scored
ORDER BY risk_score DESC;


-- Daily Mobility Summary
CREATE OR REPLACE VIEW v_daily_mobility_summary AS
SELECT
  DATE("recordedAt")        AS day,
  "zoneId",
  ROUND(AVG("mobilityScore")::numeric, 2)   AS avg_score,
  ROUND(MAX("mobilityScore")::numeric, 2)   AS peak_score,
  ROUND(MIN("mobilityScore")::numeric, 2)   AS trough_score,
  SUM("pedestrianCount")    AS total_pedestrians,
  SUM("vehicularCount")     AS total_vehicles,
  SUM("transitCount")       AS total_transit,
  ROUND(AVG("congestionPct")::numeric, 1)   AS avg_congestion,
  COUNT(*)                  AS sample_count
FROM "MobilityEvent"
GROUP BY DATE("recordedAt"), "zoneId"
ORDER BY day DESC, avg_score DESC;


-- City-wide KPI Dashboard
CREATE OR REPLACE VIEW v_city_kpis AS
WITH latest AS (
  SELECT
    COUNT(DISTINCT z.id)                    AS total_zones,
    COUNT(DISTINCT d.id)                    AS total_districts,
    ROUND(AVG(m."mobilityScore")::numeric, 1) AS overall_mobility_index,
    COUNT(a.id) FILTER (WHERE NOT a.resolved) AS open_anomalies,
    COUNT(a.id) FILTER (WHERE a."severity" = 'CRITICAL' AND NOT a.resolved) AS critical_alerts
  FROM "Zone" z
  LEFT JOIN "District" d ON d.id = z."districtId"
  LEFT JOIN "MobilityEvent" m ON m."zoneId" = z.id
    AND m."recordedAt" >= NOW() - INTERVAL '24 hours'
  LEFT JOIN "Anomaly" a ON a."zoneId" = z.id
),
yesterday AS (
  SELECT ROUND(AVG("mobilityScore")::numeric, 1) AS yesterday_mobility
  FROM "MobilityEvent"
  WHERE "recordedAt" BETWEEN NOW() - INTERVAL '48 hours' AND NOW() - INTERVAL '24 hours'
)
SELECT
  l.*,
  y.yesterday_mobility,
  ROUND(
    ((l.overall_mobility_index - y.yesterday_mobility) / NULLIF(y.yesterday_mobility, 0) * 100)::numeric, 1
  ) AS mobility_delta_pct,
  NOW() AS computed_at
FROM latest l, yesterday y;


-- ── 3. COHORT ANALYSIS ─────────────────────────────────────────

-- Analyst Cohort Retention (monthly)
CREATE OR REPLACE VIEW v_cohort_retention AS
WITH cohorts AS (
  SELECT
    id                                  AS user_id,
    DATE_TRUNC('month', "createdAt")   AS cohort_month
  FROM "User"
  WHERE "createdAt" >= NOW() - INTERVAL '12 months'
),
sessions AS (
  SELECT DISTINCT
    s."userId",
    DATE_TRUNC('month', s.expires)     AS activity_month
  FROM "Session" s
),
cohort_size AS (
  SELECT cohort_month, COUNT(*) AS size FROM cohorts GROUP BY cohort_month
),
cohort_activity AS (
  SELECT
    c.cohort_month,
    s.activity_month,
    COUNT(DISTINCT c.user_id)          AS retained_users,
    EXTRACT(
      EPOCH FROM (s.activity_month - c.cohort_month)
    ) / 2592000                        AS month_number
  FROM cohorts c
  JOIN sessions s ON s."userId" = c.user_id
  GROUP BY c.cohort_month, s.activity_month
)
SELECT
  ca.cohort_month,
  cs.size                              AS cohort_size,
  ca.month_number::int                 AS month_offset,
  ca.retained_users,
  ROUND(
    ca.retained_users * 100.0 / cs.size, 1
  )                                    AS retention_pct,
  -- Running retention drop
  LAG(ROUND(ca.retained_users * 100.0 / cs.size, 1)) OVER (
    PARTITION BY ca.cohort_month ORDER BY ca.month_number
  )                                    AS prev_retention_pct
FROM cohort_activity ca
JOIN cohort_size cs USING (cohort_month)
ORDER BY cohort_month, month_number;


-- ── 4. WINDOW FUNCTION ANALYTICS ───────────────────────────────

-- 7-Day Rolling Average with Anomaly Flags
CREATE OR REPLACE VIEW v_rolling_mobility AS
SELECT
  "zoneId",
  DATE("recordedAt")                  AS day,
  ROUND(AVG("mobilityScore")::numeric, 2)  AS daily_avg,
  -- 7-day rolling average
  ROUND(AVG(AVG("mobilityScore")) OVER (
    PARTITION BY "zoneId"
    ORDER BY DATE("recordedAt")
    ROWS BETWEEN 6 PRECEDING AND CURRENT ROW
  )::numeric, 2)                      AS rolling_7d_avg,
  -- 30-day rolling average
  ROUND(AVG(AVG("mobilityScore")) OVER (
    PARTITION BY "zoneId"
    ORDER BY DATE("recordedAt")
    ROWS BETWEEN 29 PRECEDING AND CURRENT ROW
  )::numeric, 2)                      AS rolling_30d_avg,
  -- Day-over-day change
  ROUND((AVG("mobilityScore") - LAG(AVG("mobilityScore")) OVER (
    PARTITION BY "zoneId"
    ORDER BY DATE("recordedAt")
  ))::numeric, 2)                     AS dod_delta,
  -- Week-over-week comparison
  ROUND(AVG("mobilityScore")::numeric - LAG(AVG("mobilityScore"), 7) OVER (
    PARTITION BY "zoneId"
    ORDER BY DATE("recordedAt")
  )::numeric, 2)                      AS wow_delta,
  -- Rank on that day
  RANK() OVER (
    PARTITION BY DATE("recordedAt")
    ORDER BY AVG("mobilityScore") DESC
  )                                   AS daily_rank
FROM "MobilityEvent"
WHERE "recordedAt" >= NOW() - INTERVAL '90 days'
GROUP BY "zoneId", DATE("recordedAt")
ORDER BY day DESC, "zoneId";


-- Zone Performance Percentiles
CREATE OR REPLACE VIEW v_zone_percentiles AS
SELECT
  "zoneId",
  ROUND(AVG("mobilityScore")::numeric, 2)        AS avg_score,
  ROUND(PERCENTILE_CONT(0.25) WITHIN GROUP (ORDER BY "mobilityScore")::numeric, 2) AS p25,
  ROUND(PERCENTILE_CONT(0.50) WITHIN GROUP (ORDER BY "mobilityScore")::numeric, 2) AS median,
  ROUND(PERCENTILE_CONT(0.75) WITHIN GROUP (ORDER BY "mobilityScore")::numeric, 2) AS p75,
  ROUND(PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY "mobilityScore")::numeric, 2) AS p95,
  ROUND(STDDEV("mobilityScore")::numeric, 2)     AS stddev,
  ROUND(
    PERCENT_RANK() OVER (ORDER BY AVG("mobilityScore") DESC) * 100
  , 1)                                           AS performance_pct_rank
FROM "MobilityEvent"
WHERE "recordedAt" >= NOW() - INTERVAL '30 days'
GROUP BY "zoneId";


-- ── 5. RECURSIVE CTE — District Hierarchy ──────────────────────

-- Get full zone hierarchy for any city
CREATE OR REPLACE VIEW v_zone_hierarchy AS
WITH RECURSIVE hierarchy AS (
  -- Base: cities
  SELECT
    c.id                AS node_id,
    c.name              AS node_name,
    'city'              AS node_type,
    NULL::text          AS parent_id,
    1                   AS depth,
    c.name              AS path
  FROM "City" c
  UNION ALL
  -- Districts
  SELECT
    d.id, d.name, 'district', d."cityId", 2,
    h.path || ' > ' || d.name
  FROM "District" d
  JOIN hierarchy h ON h.node_id = d."cityId"
  UNION ALL
  -- Zones
  SELECT
    z.id, z.name, 'zone', z."districtId", 3,
    h.path || ' > ' || z.name
  FROM "Zone" z
  JOIN hierarchy h ON h.node_id = z."districtId"
)
SELECT * FROM hierarchy ORDER BY depth, path;


-- ── 6. STORED PROCEDURES ───────────────────────────────────────

-- Calculate and store daily risk snapshots
CREATE OR REPLACE FUNCTION refresh_risk_snapshots()
RETURNS void AS $$
DECLARE
  v_snapshot_date DATE := CURRENT_DATE;
  zone_rec RECORD;
  v_risk_score FLOAT;
  v_anomaly_count INT;
  v_avg_mobility FLOAT;
  v_drift_pct FLOAT;
BEGIN
  -- Loop over all zones and compute risk
  FOR zone_rec IN SELECT id FROM "Zone" LOOP

    -- Get anomaly count (last 7 days)
    SELECT COUNT(*) INTO v_anomaly_count
    FROM "Anomaly"
    WHERE "zoneId" = zone_rec.id
      AND "detectedAt" >= NOW() - INTERVAL '7 days';

    -- Get average mobility (last 7 days)
    SELECT AVG("mobilityScore") INTO v_avg_mobility
    FROM "MobilityEvent"
    WHERE "zoneId" = zone_rec.id
      AND "recordedAt" >= NOW() - INTERVAL '7 days';

    -- Week-over-week drift
    SELECT
      ROUND(((
        AVG("mobilityScore") FILTER (WHERE "recordedAt" >= NOW() - INTERVAL '7 days') -
        AVG("mobilityScore") FILTER (WHERE "recordedAt" BETWEEN NOW() - INTERVAL '14 days' AND NOW() - INTERVAL '7 days')
      ) / NULLIF(
        AVG("mobilityScore") FILTER (WHERE "recordedAt" BETWEEN NOW() - INTERVAL '14 days' AND NOW() - INTERVAL '7 days'),
        0
      ) * 100)::numeric, 1)
    INTO v_drift_pct
    FROM "MobilityEvent"
    WHERE "zoneId" = zone_rec.id
      AND "recordedAt" >= NOW() - INTERVAL '14 days';

    -- Compute composite risk score
    v_risk_score := LEAST(100, GREATEST(0,
      (v_anomaly_count::float / 5.0) * 60 +
      CASE WHEN v_avg_mobility < 40 THEN 40 ELSE 0 END
    ));

    -- Upsert risk snapshot
    INSERT INTO "RiskSnapshot" (
      id, "zoneId", "riskScore", "riskTier", "riskRank",
      "weeklyDriftPct", "anomalyCount", "avgMobility", "snapshotDate"
    )
    VALUES (
      gen_random_uuid()::text,
      zone_rec.id,
      v_risk_score,
      CASE
        WHEN v_risk_score > 70 THEN 'CRITICAL'::"RiskTier"
        WHEN v_risk_score > 45 THEN 'ELEVATED'::"RiskTier"
        ELSE 'NOMINAL'::"RiskTier"
      END,
      0, -- rank updated below
      COALESCE(v_drift_pct, 0),
      v_anomaly_count,
      COALESCE(v_avg_mobility, 0),
      v_snapshot_date
    )
    ON CONFLICT ("zoneId", "snapshotDate")
    DO UPDATE SET
      "riskScore"      = EXCLUDED."riskScore",
      "riskTier"       = EXCLUDED."riskTier",
      "weeklyDriftPct" = EXCLUDED."weeklyDriftPct",
      "anomalyCount"   = EXCLUDED."anomalyCount",
      "avgMobility"    = EXCLUDED."avgMobility";

  END LOOP;

  -- Update ranks in a second pass
  UPDATE "RiskSnapshot" rs
  SET "riskRank" = sub.rank
  FROM (
    SELECT id, RANK() OVER (ORDER BY "riskScore" DESC) AS rank
    FROM "RiskSnapshot"
    WHERE "snapshotDate" = v_snapshot_date
  ) sub
  WHERE rs.id = sub.id;

  RAISE NOTICE 'Risk snapshots refreshed for %', v_snapshot_date;
END;
$$ LANGUAGE plpgsql;


-- ── 7. TRIGGERS — Anomaly Auto-Detection ──────────────────────

CREATE OR REPLACE FUNCTION fn_detect_mobility_anomaly()
RETURNS TRIGGER AS $$
DECLARE
  v_mean      FLOAT;
  v_stddev    FLOAT;
  v_zscore    FLOAT;
  v_severity  TEXT;
BEGIN
  -- Compute baseline statistics (last 7 days for this zone)
  SELECT
    AVG("mobilityScore"),
    STDDEV("mobilityScore")
  INTO v_mean, v_stddev
  FROM "MobilityEvent"
  WHERE "zoneId" = NEW."zoneId"
    AND "recordedAt" >= NOW() - INTERVAL '7 days'
    AND id != NEW.id;

  -- Need at least some history and variance
  IF v_stddev IS NULL OR v_stddev = 0 OR v_mean IS NULL THEN
    RETURN NEW;
  END IF;

  -- Calculate Z-score
  v_zscore := (NEW."mobilityScore" - v_mean) / v_stddev;

  -- Only flag if statistically significant (|z| > 2.5)
  IF ABS(v_zscore) > 2.5 THEN
    -- Determine severity tier
    v_severity := CASE
      WHEN ABS(v_zscore) > 4.0 THEN 'CRITICAL'
      WHEN ABS(v_zscore) > 3.2 THEN 'HIGH'
      WHEN ABS(v_zscore) > 2.8 THEN 'MEDIUM'
      ELSE 'LOW'
    END;

    -- Avoid duplicate anomalies within 2 hours for same zone + signal
    IF NOT EXISTS (
      SELECT 1 FROM "Anomaly"
      WHERE "zoneId"     = NEW."zoneId"
        AND "signalType" = 'MOBILITY'
        AND "resolved"   = FALSE
        AND "detectedAt" >= NOW() - INTERVAL '2 hours'
    ) THEN
      INSERT INTO "Anomaly" (
        id, "zoneId", "signalType", "zScore",
        "baselineVal", "actualVal", "severity", "detectedAt"
      ) VALUES (
        gen_random_uuid()::text,
        NEW."zoneId",
        'MOBILITY',
        ROUND(v_zscore::numeric, 3),
        ROUND(v_mean::numeric, 2),
        NEW."mobilityScore",
        v_severity::"Severity",
        NOW()
      );
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Attach trigger to MobilityEvent
DROP TRIGGER IF EXISTS trg_mobility_anomaly ON "MobilityEvent";
CREATE TRIGGER trg_mobility_anomaly
  AFTER INSERT ON "MobilityEvent"
  FOR EACH ROW
  EXECUTE FUNCTION fn_detect_mobility_anomaly();


-- ── 8. ANALYTICAL QUERIES ────────────────────────────────────--

-- Top anomaly zones with zone metadata
CREATE OR REPLACE VIEW v_anomaly_feed AS
SELECT
  a.id              AS anomaly_id,
  z.name            AS zone_name,
  z.code            AS zone_code,
  d.name            AS district,
  a."signalType"    AS signal_type,
  a."zScore",
  a."baselineVal",
  a."actualVal",
  a.severity,
  a.resolved,
  a."detectedAt",
  a."resolvedAt",
  -- How long open?
  EXTRACT(EPOCH FROM (COALESCE(a."resolvedAt", NOW()) - a."detectedAt")) / 3600
                    AS hours_open,
  -- Deviation direction
  CASE WHEN a."actualVal" > a."baselineVal" THEN 'SPIKE' ELSE 'DROP' END AS deviation_dir
FROM "Anomaly" a
JOIN "Zone" z ON z.id = a."zoneId"
JOIN "District" d ON d.id = z."districtId"
ORDER BY a."detectedAt" DESC;


-- Sentiment trend by zone (last 30 days)
CREATE OR REPLACE VIEW v_sentiment_trend AS
SELECT
  s."zoneId",
  z.name AS zone_name,
  DATE(s."recordedAt") AS day,
  s.topic,
  ROUND(AVG(s.score)::numeric, 3)     AS avg_sentiment,
  SUM(s.volume)                        AS total_volume,
  -- 7-day rolling sentiment
  ROUND(AVG(AVG(s.score)) OVER (
    PARTITION BY s."zoneId", s.topic
    ORDER BY DATE(s."recordedAt")
    ROWS BETWEEN 6 PRECEDING AND CURRENT ROW
  )::numeric, 3)                       AS rolling_7d_sentiment,
  CASE
    WHEN AVG(s.score) > 0.3  THEN 'POSITIVE'
    WHEN AVG(s.score) < -0.3 THEN 'NEGATIVE'
    ELSE 'NEUTRAL'
  END AS sentiment_category
FROM "SentimentLog" s
JOIN "Zone" z ON z.id = s."zoneId"
WHERE s."recordedAt" >= NOW() - INTERVAL '30 days'
GROUP BY s."zoneId", z.name, DATE(s."recordedAt"), s.topic
ORDER BY day DESC, total_volume DESC;
