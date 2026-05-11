"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useInView, useScroll, useTransform } from "framer-motion";
import Link from "next/link";

// ── Reusable reveal wrapper ────────────────────────────────────
function Reveal({ children, delay = 0, className = "" }: {
  children: React.ReactNode; delay?: number; className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 40 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.8, delay, ease: [0.16, 1, 0.3, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// ── Stat counter ───────────────────────────────────────────────
function AnimatedStat({ end, suffix = "", label }: { end: number; suffix?: string; label: string }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true });

  useEffect(() => {
    if (!inView) return;
    const start = Date.now();
    const duration = 1800;
    const raf = requestAnimationFrame(function tick() {
      const elapsed = Date.now() - start;
      const progress = Math.min(elapsed / duration, 1);
      const ease = 1 - Math.pow(1 - progress, 3);
      setCount(Math.round(end * ease * 10) / 10);
      if (progress < 1) requestAnimationFrame(tick);
    });
    return () => cancelAnimationFrame(raf);
  }, [inView, end]);

  return (
    <div ref={ref} className="text-center group">
      <div className="font-display text-5xl font-light text-ink leading-none tracking-tight">
        {count}{suffix}
      </div>
      <div className="mt-2 text-2xs font-semibold tracking-widest uppercase text-ink-soft">{label}</div>
    </div>
  );
}

export default function LandingPage() {
  const { scrollY } = useScroll();
  const heroY = useTransform(scrollY, [0, 600], [0, -80]);

  const features = [
    { icon: "🗺️", name: "Spatial Mobility Engine", desc: "Geospatial flow analysis across transit zones — detecting corridors, congestion, and modal-shift signals using recursive CTEs and PostGIS.", tag: "PostGIS · Window Functions", color: "rose" },
    { icon: "⚠️", name: "Anomaly Intelligence",    desc: "Real-time Z-score anomaly detection across 40+ city signals. PostgreSQL triggers fire automated risk alerts in under 2 seconds.", tag: "Triggers · Z-Score · Lead/Lag", color: "gold" },
    { icon: "🔮", name: "Predictive Pulse",         desc: "Time-series forecasting of footfall, energy demand and civic stress using rolling window aggregations and stored procedures.", tag: "Rolling Windows · CTEs", color: "lav" },
    { icon: "👥", name: "Cohort Behavioral Lab",    desc: "Citizen cohort retention, churn prediction and behavioral drift analysis using advanced SQL cohort patterns across temporal segments.", tag: "Cohort SQL · Retention", color: "rose" },
    { icon: "💬", name: "Sentiment Mesh",           desc: "NLP-powered civic sentiment aggregation from geo-tagged data streams, mapped against zone-level events and infrastructure stress.", tag: "NLP · Sentiment API", color: "gold" },
    { icon: "📊", name: "Executive Story Layer",    desc: "Scroll-triggered animated storytelling dashboards transforming raw analytics into cinematic narratives for city planners.", tag: "Framer Motion · GSAP · ECharts", color: "lav" },
  ];

  const techStack = [
    { icon: "⚡", name: "Next.js 14",      role: "App Router · RSC · API Routes" },
    { icon: "🎨", name: "Framer Motion",   role: "Scroll Animations · Transitions" },
    { icon: "🌊", name: "GSAP + Lenis",    role: "Cinematic Scroll · Parallax" },
    { icon: "🗄️", name: "PostgreSQL",      role: "Advanced SQL · Views · Triggers" },
    { icon: "🔷", name: "Prisma ORM",      role: "Schema · Migrations · Seed" },
    { icon: "📈", name: "ECharts + D3",    role: "Animated Data Visualization" },
    { icon: "🔐", name: "Auth.js v5",      role: "Protected Routes · JWT" },
    { icon: "🚀", name: "Vercel + Neon",   role: "Edge Deploy · Serverless DB" },
  ];

  const marqueItems = [
    "Urban Mobility Intelligence", "Predictive Anomaly Detection", "Cohort Behavioral Analytics",
    "Real-Time Event Clustering", "Smart City Data Fusion", "Window Function Analytics",
    "PostgreSQL Intelligence Layer", "Next.js · Prisma · Framer Motion",
  ];

  return (
    <div className="min-h-screen bg-silk text-ink overflow-x-hidden">

      {/* ── NAV ──────────────────────────────────────────── */}
      <nav className="fixed top-0 inset-x-0 z-50 flex items-center justify-between px-8 py-5 glass border-b border-gold/10">
        <span className="font-display text-2xl font-light tracking-wider">
          LUM<span className="text-gold italic">I</span>NARY
        </span>
        <ul className="hidden md:flex gap-10">
          {["Platform","Intelligence","Stack","Deploy"].map(item => (
            <li key={item}>
              <a href={`#${item.toLowerCase()}`}
                className="text-2xs font-semibold tracking-widest uppercase text-ink-soft hover:text-gold transition-colors duration-300">
                {item}
              </a>
            </li>
          ))}
        </ul>
        <Link href="/dashboard">
          <button className="text-2xs font-bold tracking-wider uppercase px-5 py-2.5 bg-ink text-silk rounded-sm hover:bg-gold hover:text-ink transition-all duration-300">
            Open Dashboard →
          </button>
        </Link>
      </nav>

      {/* ── HERO ─────────────────────────────────────────── */}
      <section className="relative min-h-screen flex flex-col items-center justify-center text-center px-6 pt-24 pb-16 overflow-hidden">
        {/* Background orbs */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-32 -left-32 w-[600px] h-[600px] rounded-full bg-petal/40 blur-3xl animate-breathe" />
          <div className="absolute bottom-0 -right-32 w-[500px] h-[500px] rounded-full bg-lavender/35 blur-3xl animate-breathe" style={{ animationDelay: "3s" }} />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 w-[300px] h-[300px] rounded-full bg-gold/8 blur-3xl animate-float" />
        </div>

        <motion.div style={{ y: heroY }} className="relative z-10">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: "easeOut" }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gold/10 border border-gold/25 text-2xs font-semibold tracking-widest uppercase text-gold mb-10"
          >
            <span className="live-dot" />
            Urban Intelligence Platform · 2025
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
            className="font-display text-[clamp(4rem,10vw,9rem)] font-light leading-[0.92] tracking-tight text-ink"
          >
            The <em className="text-rose not-italic">pulse</em><br />
            of every<br />
            <span className="gradient-gold">city.</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.35 }}
            className="font-mono text-sm text-ink-soft mt-8 max-w-xl mx-auto leading-relaxed"
          >
            LUMINARY transforms fragmented urban data streams into predictive intelligence —<br />
            revealing the hidden rhythms of mobility, commerce, climate and human behaviour.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.5 }}
            className="flex gap-4 justify-center mt-10 flex-wrap"
          >
            <Link href="/dashboard">
              <button className="px-8 py-3.5 bg-ink text-silk text-2xs font-bold tracking-wider uppercase rounded-sm hover:bg-gold hover:text-ink transition-all duration-400 hover:-translate-y-0.5">
                Explore Platform
              </button>
            </Link>
            <a href="https://github.com/yourusername/luminary" target="_blank" rel="noopener noreferrer">
              <button className="px-8 py-3.5 bg-transparent text-ink border border-ink/25 text-2xs font-semibold tracking-wider uppercase rounded-sm hover:border-gold hover:text-gold transition-all duration-400 hover:-translate-y-0.5">
                View on GitHub →
              </button>
            </a>
          </motion.div>
        </motion.div>
      </section>

      {/* ── MARQUEE ─────────────────────────────────────── */}
      <div className="overflow-hidden border-y border-gold/12 bg-gold/4 py-3.5">
        <div className="flex animate-marquee w-max gap-12">
          {[...marqueItems, ...marqueItems].map((item, i) => (
            <span key={i} className="text-2xs font-semibold tracking-widest uppercase text-ink-soft whitespace-nowrap">
              {i % 2 === 1 ? <span className="text-gold mx-4">✦</span> : null}{item}
            </span>
          ))}
        </div>
      </div>

      {/* ── STATS ───────────────────────────────────────── */}
      <section className="grid grid-cols-2 md:grid-cols-4 border-b border-gold/10">
        {[
          { end: 4.2,  suffix: "B",  label: "Daily Data Points" },
          { end: 18,   suffix: "k",  label: "Urban Zones Monitored" },
          { end: 99.7, suffix: "%",  label: "Prediction Accuracy" },
          { end: 2,    suffix: "s",  label: "Real-Time Latency" },
        ].map((stat, i) => (
          <Reveal key={i} delay={i * 0.08}>
            <div className="py-14 px-8 border-r border-gold/10 last:border-r-0 hover:bg-gold/4 transition-colors duration-400 relative group cursor-default">
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 h-0.5 bg-gold w-0 group-hover:w-16 transition-all duration-500" />
              <AnimatedStat end={stat.end} suffix={stat.suffix} label={stat.label} />
            </div>
          </Reveal>
        ))}
      </section>

      {/* ── PLATFORM OVERVIEW ────────────────────────────── */}
      <section id="platform" className="py-28 px-8 bg-ivory">
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-20 items-center">
          <div>
            <Reveal>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-px bg-gold" />
                <span className="text-2xs font-semibold tracking-widest uppercase text-gold">Platform Overview</span>
              </div>
            </Reveal>
            <Reveal delay={0.1}>
              <h2 className="font-display text-5xl md:text-6xl font-light leading-[1.05] text-ink">
                Intelligence<br />that <em className="text-rose not-italic">breathes</em><br />with your city.
              </h2>
            </Reveal>
            <Reveal delay={0.2}>
              <p className="mt-6 text-sm text-ink-mid leading-relaxed max-w-md">
                LUMINARY is a full-stack urban analytics platform that ingests, fuses, and transforms
                heterogeneous city data — transit flows, air quality, commercial density, event clusters —
                into predictive models and decision-grade dashboards.
              </p>
            </Reveal>
            <Reveal delay={0.3}>
              <div className="flex flex-wrap gap-2 mt-8">
                {["Mobility Analytics","Predictive ML","Cohort Analysis","Anomaly Detection","Risk Scoring","NLP Pulse"].map(tag => (
                  <span key={tag} className="text-2xs font-semibold tracking-wider uppercase px-3 py-1.5 rounded-full border border-gold/25 text-gold bg-gold/6 hover:-translate-y-0.5 transition-transform duration-300 cursor-default">
                    {tag}
                  </span>
                ))}
              </div>
            </Reveal>
          </div>

          {/* Mini dashboard card */}
          <Reveal delay={0.15}>
            <div className="glass rounded-2xl p-6 shadow-glass-lg relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 rounded-full bg-petal/30 blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
              <div className="flex items-center justify-between mb-5">
                <span className="text-2xs font-semibold tracking-widest uppercase text-ink-soft">City Intelligence Console</span>
                <span className="flex items-center gap-1.5 text-2xs font-semibold text-green-600">
                  <span className="live-dot" /> Live
                </span>
              </div>
              <div className="grid grid-cols-3 gap-3 mb-5">
                {[
                  { label: "Mobility Index", value: "87.4", delta: "↑ 3.2%", up: true },
                  { label: "Risk Zones",     value: "12",   delta: "↑ 4 flagged", up: false },
                  { label: "Open Alerts",    value: "6",    delta: "↓ 1 resolved", up: true },
                ].map((kpi) => (
                  <div key={kpi.label} className="bg-silk border border-gold/12 rounded-xl p-3 hover:-translate-y-0.5 transition-transform duration-300">
                    <div className="text-2xs tracking-wider uppercase text-ink-soft mb-1">{kpi.label}</div>
                    <div className="font-display text-3xl font-light text-ink leading-none">{kpi.value}</div>
                    <div className={`text-2xs font-semibold mt-1 ${kpi.up ? "text-green-600" : "text-rose"}`}>{kpi.delta}</div>
                  </div>
                ))}
              </div>
              {/* Mini bar chart */}
              <div className="bg-silk border border-gold/12 rounded-xl p-4">
                <div className="text-2xs tracking-wider uppercase text-ink-soft mb-3">7-Day Mobility Volume</div>
                <div className="flex items-end gap-1.5 h-14">
                  {[68,82,75,91,88,62,79].map((v, i) => (
                    <div key={i} className="flex-1 rounded-t transition-all duration-300 hover:opacity-80"
                      style={{
                        height: `${v}%`,
                        background: i === 3 ? "linear-gradient(to top,rgba(196,129,122,0.5),rgba(196,129,122,1))"
                                            : "linear-gradient(to top,rgba(200,169,110,0.3),rgba(200,169,110,0.85))"
                      }} />
                  ))}
                </div>
                <div className="flex justify-between mt-1">
                  {["M","T","W","T","F","S","S"].map((d,i) => (
                    <span key={i} className="flex-1 text-center font-mono text-2xs text-ink-soft">{d}</span>
                  ))}
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── FEATURES ─────────────────────────────────────── */}
      <section id="intelligence" className="py-28 px-8 bg-silk">
        <div className="text-center max-w-xl mx-auto mb-16">
          <Reveal>
            <span className="text-2xs font-semibold tracking-widest uppercase text-gold">Intelligence Modules</span>
          </Reveal>
          <Reveal delay={0.1}>
            <h2 className="font-display text-5xl md:text-6xl font-light leading-[1.05] mt-3 text-ink">
              Six layers of<br /><em className="text-rose not-italic">urban understanding.</em>
            </h2>
          </Reveal>
        </div>

        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 border border-gold/12">
          {features.map((f, i) => (
            <Reveal key={f.name} delay={i * 0.07}>
              <div className="p-8 border-r border-b border-gold/10 last:border-r-0 hover:bg-ivory group relative overflow-hidden transition-colors duration-400">
                <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-gold to-transparent scale-x-0 group-hover:scale-x-100 transition-transform duration-500" />
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl mb-5 ${
                  f.color === "rose" ? "bg-rose/10" : f.color === "gold" ? "bg-gold/10" : "bg-lavender/15"
                }`}>
                  {f.icon}
                </div>
                <h3 className="font-display text-2xl font-light text-ink mb-2">{f.name}</h3>
                <p className="text-xs text-ink-soft leading-relaxed">{f.desc}</p>
                <div className="mt-4 text-2xs font-semibold tracking-wider text-gold">→ {f.tag}</div>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ── SQL DARK SECTION ─────────────────────────────── */}
      <section className="py-28 px-8 bg-ink relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-0 w-96 h-96 rounded-full bg-gold/6 blur-3xl" />
          <div className="absolute bottom-0 right-0 w-96 h-96 rounded-full bg-lavender/5 blur-3xl" />
        </div>
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-20 items-center relative z-10">
          <div>
            <Reveal>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-px bg-gold-light" />
                <span className="text-2xs font-semibold tracking-widest uppercase text-gold-light">SQL Intelligence</span>
              </div>
            </Reveal>
            <Reveal delay={0.1}>
              <h2 className="font-display text-5xl font-light leading-[1.05] text-silk">
                Queries that<br /><em className="text-gold not-italic">think</em> like<br />analysts.
              </h2>
            </Reveal>
            <Reveal delay={0.2}>
              <p className="mt-6 text-sm text-silk/50 leading-relaxed">
                Every insight is powered by production-grade PostgreSQL — recursive CTEs,
                window functions, materialized views, and behavioral cohort queries.
              </p>
            </Reveal>
            <Reveal delay={0.3}>
              <div className="mt-8 flex flex-col gap-2">
                {[
                  "7-day rolling mobility avg with lag comparison",
                  "Zone risk score with percentile ranking",
                  "Cohort retention matrix — monthly segments",
                  "Recursive district hierarchy traversal",
                  "Anomaly trigger + audit log procedure",
                ].map((q, i) => (
                  <div key={i} className="flex items-center gap-3 px-4 py-3 bg-silk/4 border border-silk/8 rounded-lg hover:bg-gold/8 hover:border-gold/20 transition-all duration-300 cursor-default group">
                    <span className="font-mono text-2xs text-gold-light min-w-5">{String(i+1).padStart(2,"0")}</span>
                    <span className="text-xs text-silk/55 group-hover:text-silk/75 transition-colors">{q}</span>
                  </div>
                ))}
              </div>
            </Reveal>
          </div>

          {/* SQL code card */}
          <Reveal delay={0.2}>
            <div className="glass-dark rounded-2xl p-6 overflow-hidden">
              <div className="flex items-center gap-2 mb-5">
                <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
                <div className="w-2.5 h-2.5 rounded-full bg-yellow-400" />
                <div className="w-2.5 h-2.5 rounded-full bg-green-400" />
                <span className="ml-auto font-mono text-2xs text-silk/30">zone_risk_intelligence.sql</span>
              </div>
              <pre className="font-mono text-xs leading-relaxed text-silk/55 overflow-x-auto whitespace-pre-wrap">
{`<span style="color:#d4bc89">WITH</span> zone_metrics <span style="color:#d4bc89">AS</span> (
  <span style="color:#d4bc89">SELECT</span>
    z.zone_id, z.zone_name,
    <span style="color:#e8b5ae">AVG</span>(m.mobility_score)  <span style="color:#d4bc89">AS</span> avg_mobility,
    <span style="color:#e8b5ae">STDDEV</span>(m.mobility_score) <span style="color:#d4bc89">AS</span> volatility,
    <span style="color:#e8b5ae">LAG</span>(<span style="color:#e8b5ae">AVG</span>(m.mobility_score), 7)
      <span style="color:#d4bc89">OVER</span> (<span style="color:#d4bc89">PARTITION BY</span> z.zone_id
            <span style="color:#d4bc89">ORDER BY</span> m.recorded_at)
      <span style="color:#d4bc89">AS</span> week_ago_score
  <span style="color:#d4bc89">FROM</span> zones z
  <span style="color:#d4bc89">LEFT JOIN</span> mobility_events m <span style="color:#d4bc89">USING</span> (zone_id)
  <span style="color:#d4bc89">GROUP BY</span> z.zone_id, z.zone_name
)
<span style="color:#d4bc89">SELECT</span>
  zone_name,
  risk_score,
  <span style="color:#e8b5ae">DENSE_RANK</span>() <span style="color:#d4bc89">OVER</span> (
    <span style="color:#d4bc89">ORDER BY</span> risk_score <span style="color:#d4bc89">DESC</span>
  ) <span style="color:#d4bc89">AS</span> risk_rank,
  <span style="color:#d4bc89">CASE</span>
    <span style="color:#d4bc89">WHEN</span> risk_score > 70 <span style="color:#d4bc89">THEN</span> <span style="color:#b8a8d0">'CRITICAL'</span>
    <span style="color:#d4bc89">WHEN</span> risk_score > 45 <span style="color:#d4bc89">THEN</span> <span style="color:#b8a8d0">'ELEVATED'</span>
    <span style="color:#d4bc89">ELSE</span> <span style="color:#b8a8d0">'NOMINAL'</span>
  <span style="color:#d4bc89">END</span> <span style="color:#d4bc89">AS</span> risk_tier
<span style="color:#d4bc89">FROM</span> risk_scored
<span style="color:#d4bc89">ORDER BY</span> risk_score <span style="color:#d4bc89">DESC</span>;`}
              </pre>
              <div className="mt-4 pt-4 border-t border-silk/8">
                <div className="text-2xs font-mono text-silk/30 mb-3 uppercase tracking-wider">Result Preview</div>
                {[
                  { zone: "Downtown Core · CB", score: "82.4", tier: "CRITICAL", trend: "+7.2%" },
                  { zone: "Harbor Edge · HQ",   score: "67.1", tier: "ELEVATED", trend: "-2.8%" },
                  { zone: "North Quarter · NR", score: "41.8", tier: "NOMINAL",  trend: "+1.1%" },
                ].map((r) => (
                  <div key={r.zone} className="flex items-center justify-between py-2 border-b border-silk/5 last:border-0 font-mono text-2xs">
                    <span className="text-silk/50">{r.zone}</span>
                    <span className="text-gold-light">{r.score}</span>
                    <span className={r.tier === "CRITICAL" ? "text-rose-light" : r.tier === "ELEVATED" ? "text-gold-light" : "text-green-400"}>{r.tier}</span>
                    <span className={r.trend.startsWith("+") ? "text-green-400" : "text-rose-light"}>{r.trend}</span>
                  </div>
                ))}
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── TECH STACK ───────────────────────────────────── */}
      <section id="stack" className="py-28 px-8 bg-champagne">
        <div className="text-center mb-14">
          <Reveal><span className="text-2xs font-semibold tracking-widest uppercase text-gold">Tech Stack</span></Reveal>
          <Reveal delay={0.1}><h2 className="font-display text-5xl font-light mt-3 text-ink">Built with the <em className="text-rose not-italic">right tools.</em></h2></Reveal>
        </div>
        <div className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-4">
          {techStack.map((t, i) => (
            <Reveal key={t.name} delay={i * 0.06}>
              <div className="bg-silk border border-gold/12 rounded-2xl p-5 text-center hover:-translate-y-1 hover:shadow-glass transition-all duration-350 group">
                <div className="text-3xl mb-3">{t.icon}</div>
                <div className="text-xs font-bold tracking-wider uppercase text-ink mb-1">{t.name}</div>
                <div className="text-2xs text-ink-soft leading-snug">{t.role}</div>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────────── */}
      <section className="py-32 px-8 bg-ink text-center relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_50%_50%,rgba(200,169,110,0.08),transparent)]" />
        </div>
        <Reveal>
          <div className="text-2xs font-semibold tracking-widest uppercase text-gold-light mb-6">Ready to Build</div>
          <h2 className="font-display text-[clamp(3rem,7vw,7rem)] font-light leading-[0.92] text-silk relative z-10">
            Make recruiters<br />say <em className="text-gold not-italic">"how?"</em>
          </h2>
          <p className="font-mono text-sm text-silk/40 mt-8 leading-relaxed">
            LUMINARY is not a template. It is a statement.<br />
            Build it. Ship it. Own the narrative.
          </p>
          <div className="flex gap-4 justify-center mt-10 flex-wrap">
            <Link href="/dashboard">
              <button className="px-8 py-3.5 bg-gold text-ink text-2xs font-bold tracking-wider uppercase rounded-sm hover:-translate-y-0.5 hover:bg-gold-muted transition-all duration-300">
                Open Dashboard
              </button>
            </Link>
            <a href="https://github.com/yourusername/luminary" target="_blank" rel="noopener noreferrer">
              <button className="px-8 py-3.5 border border-silk/20 text-silk text-2xs font-semibold tracking-wider uppercase rounded-sm hover:border-gold hover:text-gold transition-all duration-300">
                GitHub Repo →
              </button>
            </a>
          </div>
        </Reveal>
      </section>

      {/* ── FOOTER ───────────────────────────────────────── */}
      <footer className="bg-ink border-t border-silk/6 px-8 py-6 flex flex-wrap items-center justify-between gap-4 text-2xs tracking-wider uppercase text-silk/30">
        <span className="font-display text-base italic text-gold tracking-widest not-uppercase">Luminary</span>
        <span>Urban Intelligence Platform · Portfolio Project 2025</span>
        <span>Next.js · PostgreSQL · Framer Motion</span>
      </footer>
    </div>
  );
}
