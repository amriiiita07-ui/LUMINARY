"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { timeAgo, formatNumber, formatDelta } from "@/lib/utils";

// ── Types ───────────────────────────────────────────────────────
interface KPI { mobilityIndex: number; mobilityDelta: number; openAnomalies: number; criticalAlerts: number; zonesMonitored: number; }
interface Zone { zoneId: string; zoneName: string; district: string; riskScore: number; riskTier: string; weeklyDrift: number; anomalyCount: number; avgMobility: number; }
interface Anomaly { id: string; zoneId: string; signalType: string; zScore: number; severity: string; resolved: boolean; detectedAt: string; zone: { name: string; district: { name: string } } }
interface MobilityPoint { day: string; avgScore: number; pedestrians: number; vehicles: number; }

// ── Subcomponents ───────────────────────────────────────────────
function KpiCard({ label, value, delta, deltaLabel, accent }: { label: string; value: string; delta?: number; deltaLabel?: string; accent?: string; }) {
  return (
    <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}
      className="glass rounded-2xl p-6 relative overflow-hidden group hover:-translate-y-0.5 transition-transform duration-300">
      <div className="absolute top-0 left-0 right-0 h-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-400"
        style={{ background: `linear-gradient(90deg, transparent, ${accent ?? "#c8a96e"}, transparent)` }} />
      <div className="text-2xs font-semibold tracking-widest uppercase text-ink-soft mb-3">{label}</div>
      <div className="font-display text-4xl font-light text-ink leading-none">{value}</div>
      {delta !== undefined && (
        <div className={`text-2xs font-semibold mt-2 ${delta >= 0 ? "text-green-600" : "text-rose"}`}>
          {formatDelta(delta)} {deltaLabel}
        </div>
      )}
    </motion.div>
  );
}

function RiskBadge({ tier }: { tier: string }) {
  const colors: Record<string, string> = {
    CRITICAL: "bg-rose/10 text-rose border-rose/25",
    ELEVATED: "bg-gold/10 text-gold border-gold/25",
    NOMINAL:  "bg-green-500/8 text-green-700 border-green-500/20",
  };
  return (
    <span className={`text-2xs font-bold tracking-wider uppercase px-2 py-0.5 rounded border ${colors[tier] ?? colors.NOMINAL}`}>
      {tier}
    </span>
  );
}

function SeverityDot({ s }: { s: string }) {
  const colors: Record<string, string> = { CRITICAL: "bg-rose", HIGH: "bg-amber-500", MEDIUM: "bg-gold", LOW: "bg-sage" };
  return <span className={`inline-block w-2 h-2 rounded-full ${colors[s] ?? colors.LOW}`} />;
}

// ── Mini inline bar chart ────────────────────────────────────────
function SparkBar({ data }: { data: MobilityPoint[] }) {
  if (!data.length) return null;
  const max = Math.max(...data.map(d => d.avgScore), 1);
  return (
    <div className="flex items-end gap-1 h-16">
      {data.map((d, i) => (
        <div key={i} className="flex-1 rounded-t transition-all duration-300 hover:opacity-80 cursor-default"
          title={`${d.day}: ${d.avgScore}`}
          style={{
            height: `${(d.avgScore / max) * 100}%`,
            background: i === data.length - 1
              ? "linear-gradient(to top,rgba(196,129,122,0.5),rgba(196,129,122,0.9))"
              : "linear-gradient(to top,rgba(200,169,110,0.25),rgba(200,169,110,0.75))",
          }} />
      ))}
    </div>
  );
}

// ── Skeleton loader ──────────────────────────────────────────────
function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`shimmer rounded-lg bg-gold/8 ${className}`} />;
}

// ── Main Dashboard ───────────────────────────────────────────────
export default function DashboardPage() {
  const [kpis, setKpis]         = useState<KPI | null>(null);
  const [zones, setZones]       = useState<Zone[]>([]);
  const [anomalies, setAnomalies] = useState<Anomaly[]>([]);
  const [trend, setTrend]       = useState<MobilityPoint[]>([]);
  const [loading, setLoading]   = useState(true);
  const [activeTab, setActiveTab] = useState<"zones" | "anomalies">("zones");

  useEffect(() => {
    async function fetchAll() {
      try {
        const [kpiRes, zoneRes, anomalyRes, trendRes] = await Promise.all([
          fetch("/api/analytics"), fetch("/api/zones"),
          fetch("/api/anomalies?limit=15"), fetch("/api/mobility"),
        ]);
        const [kpiData, zoneData, anomalyData, trendData] = await Promise.all([
          kpiRes.json(), zoneRes.json(), anomalyRes.json(), trendRes.json(),
        ]);
        setKpis(kpiData);
        setZones(zoneData.zones ?? []);
        setAnomalies(anomalyData.anomalies ?? []);
        setTrend(trendData.trend ?? []);
      } catch (e) {
        console.error("Dashboard fetch error:", e);
      } finally {
        setLoading(false);
      }
    }
    fetchAll();
    const interval = setInterval(fetchAll, 30_000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-ivory text-ink">

      {/* ── TOP NAV ────────────────────────────────────── */}
      <nav className="sticky top-0 z-40 glass border-b border-gold/10 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link href="/">
            <span className="font-display text-xl font-light tracking-wider">
              LUM<span className="text-gold italic">I</span>NARY
            </span>
          </Link>
          <span className="hidden md:block w-px h-5 bg-gold/20" />
          <span className="hidden md:block text-2xs font-semibold tracking-widest uppercase text-ink-soft">City Intelligence Console</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5 text-2xs font-semibold text-green-600">
            <span className="live-dot" /> Live · Nova City
          </span>
          <div className="w-8 h-8 rounded-full bg-gold/15 border border-gold/25 flex items-center justify-center text-xs font-bold text-gold">A</div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">

        {/* ── KPI CARDS ──────────────────────────────────── */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {loading ? (
            Array(5).fill(0).map((_, i) => <Skeleton key={i} className="h-36" />)
          ) : kpis ? (
            <>
              <KpiCard label="Mobility Index"   value={String(kpis.mobilityIndex)} delta={kpis.mobilityDelta} deltaLabel="vs yesterday" accent="#c8a96e" />
              <KpiCard label="Open Anomalies"   value={String(kpis.openAnomalies)} accent="#c4817a" />
              <KpiCard label="Critical Alerts"  value={String(kpis.criticalAlerts)} accent="#c4817a" />
              <KpiCard label="Zones Monitored"  value={String(kpis.zonesMonitored)} accent="#ddd5e8" />
              <KpiCard label="Data Points / Day" value="4.2B" accent="#b8a8d0" />
            </>
          ) : null}
        </div>

        {/* ── MOBILITY TREND + ANOMALY SUMMARY ───────────── */}
        <div className="grid md:grid-cols-3 gap-6">
          <div className="md:col-span-2 glass rounded-2xl p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <div className="text-2xs font-semibold tracking-widest uppercase text-ink-soft mb-1">7-Day Mobility Trend</div>
                <div className="font-display text-2xl font-light text-ink">City-wide Performance</div>
              </div>
              <div className="text-2xs font-mono text-ink-soft">All Zones · Daily Average</div>
            </div>
            {loading ? <Skeleton className="h-40" /> : <SparkBar data={trend} />}
            <div className="flex justify-between mt-2">
              {trend.map((d, i) => (
                <span key={i} className="flex-1 text-center font-mono text-2xs text-ink-soft">
                  {new Date(d.day).toLocaleDateString("en",{ weekday:"short" }).slice(0,1)}
                </span>
              ))}
            </div>
          </div>

          <div className="glass rounded-2xl p-6">
            <div className="text-2xs font-semibold tracking-widest uppercase text-ink-soft mb-1">Anomaly Severity Mix</div>
            <div className="font-display text-2xl font-light text-ink mb-6">Signal Distribution</div>
            {loading ? <Skeleton className="h-40" /> : (
              <div className="space-y-3">
                {(["CRITICAL","HIGH","MEDIUM","LOW"] as const).map(sev => {
                  const count = anomalies.filter(a => a.severity === sev).length;
                  const pct   = anomalies.length ? Math.round(count / anomalies.length * 100) : 0;
                  const colors: Record<string,string> = { CRITICAL:"#c4817a", HIGH:"#d4a574", MEDIUM:"#c8a96e", LOW:"#8a7a72" };
                  return (
                    <div key={sev}>
                      <div className="flex justify-between mb-1">
                        <span className="text-2xs font-semibold tracking-wider uppercase" style={{ color: colors[sev] }}>{sev}</span>
                        <span className="font-mono text-2xs text-ink-soft">{count} · {pct}%</span>
                      </div>
                      <div className="h-1.5 bg-ink/5 rounded-full overflow-hidden">
                        <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }}
                          transition={{ duration: 0.8, ease: "easeOut" }}
                          className="h-full rounded-full" style={{ background: colors[sev] }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* ── ZONES + ANOMALIES TABS ──────────────────────── */}
        <div className="glass rounded-2xl overflow-hidden">
          <div className="flex border-b border-gold/10">
            {(["zones","anomalies"] as const).map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab)}
                className={`flex-1 py-4 text-2xs font-bold tracking-widest uppercase transition-all duration-300 ${
                  activeTab === tab ? "text-ink border-b-2 border-gold bg-gold/4" : "text-ink-soft hover:text-ink"
                }`}>
                {tab === "zones" ? `Risk Zones (${zones.length})` : `Anomaly Feed (${anomalies.length})`}
              </button>
            ))}
          </div>

          {/* ZONES TABLE */}
          {activeTab === "zones" && (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gold/8">
                    {["Rank","Zone","District","Risk Score","Risk Tier","Mobility Avg","Weekly Drift","Anomalies"].map(h => (
                      <th key={h} className="px-5 py-3.5 text-left text-2xs font-semibold tracking-widest uppercase text-ink-soft whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    Array(6).fill(0).map((_, i) => (
                      <tr key={i} className="border-b border-gold/5">
                        {Array(8).fill(0).map((_, j) => (
                          <td key={j} className="px-5 py-4"><Skeleton className="h-4" /></td>
                        ))}
                      </tr>
                    ))
                  ) : zones.map((z, i) => (
                    <motion.tr key={z.zoneId} initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}
                      className="border-b border-gold/5 hover:bg-gold/3 transition-colors duration-200 group">
                      <td className="px-5 py-4 font-mono text-2xs text-ink-soft">#{i+1}</td>
                      <td className="px-5 py-4">
                        <div className="text-sm font-semibold text-ink">{z.zoneName}</div>
                      </td>
                      <td className="px-5 py-4 text-xs text-ink-soft">{z.district}</td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-1.5 bg-ink/5 rounded-full overflow-hidden">
                            <div className="h-full rounded-full transition-all"
                              style={{ width: `${z.riskScore}%`, background: z.riskTier === "CRITICAL" ? "#c4817a" : z.riskTier === "ELEVATED" ? "#c8a96e" : "#6ab04c" }} />
                          </div>
                          <span className="font-mono text-xs font-semibold text-ink">{z.riskScore}</span>
                        </div>
                      </td>
                      <td className="px-5 py-4"><RiskBadge tier={z.riskTier} /></td>
                      <td className="px-5 py-4 font-mono text-xs text-ink-mid">{z.avgMobility?.toFixed(1)}</td>
                      <td className="px-5 py-4">
                        <span className={`font-mono text-xs font-semibold ${(z.weeklyDrift ?? 0) >= 0 ? "text-green-600" : "text-rose"}`}>
                          {formatDelta(z.weeklyDrift ?? 0)}
                        </span>
                      </td>
                      <td className="px-5 py-4 font-mono text-xs text-ink-mid">{z.anomalyCount}</td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* ANOMALY FEED */}
          {activeTab === "anomalies" && (
            <div className="divide-y divide-gold/5">
              {loading ? (
                Array(6).fill(0).map((_, i) => (
                  <div key={i} className="px-6 py-4 flex items-center gap-4">
                    <Skeleton className="w-2 h-2 rounded-full" />
                    <Skeleton className="h-4 flex-1" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                ))
              ) : anomalies.map((a, i) => (
                <motion.div key={a.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.03 }}
                  className="px-6 py-4 flex flex-wrap items-center gap-4 hover:bg-gold/3 transition-colors duration-200">
                  <SeverityDot s={a.severity} />
                  <div className="flex-1 min-w-48">
                    <div className="text-sm font-semibold text-ink">{a.zone?.name ?? "Unknown Zone"}</div>
                    <div className="text-2xs text-ink-soft">{a.zone?.district?.name} · {a.signalType}</div>
                  </div>
                  <div className="font-mono text-xs text-ink-mid">Z = {a.zScore?.toFixed(2)}</div>
                  <RiskBadge tier={a.severity === "CRITICAL" || a.severity === "HIGH" ? "CRITICAL" : a.severity === "MEDIUM" ? "ELEVATED" : "NOMINAL"} />
                  <span className={`text-2xs font-semibold ${a.resolved ? "text-green-600" : "text-rose"}`}>
                    {a.resolved ? "✓ Resolved" : "● Open"}
                  </span>
                  <span className="font-mono text-2xs text-ink-soft ml-auto">{timeAgo(a.detectedAt)}</span>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
