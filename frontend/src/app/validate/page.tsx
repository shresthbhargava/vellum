"use client";

import React, { useState } from "react";
import Link from "next/link";
import AnimatedBackground from "@/components/AnimatedBackground";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Sparkles,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Loader2,
  Target,
  TrendingUp,
  Shield,
  Zap,
  DollarSign,
  BarChart3,
} from "lucide-react";

interface DimensionScore {
  dimension: string;
  score: number;
  explanation: string;
}

interface ValidationResponse {
  idea_summary: string;
  dimensions: DimensionScore[];
  overall_score: number;
  verdict: string;
  recommendation: string;
  confidence: number;
}

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://${BACKEND_URL}";

const DIMENSION_META: Record<string, { icon: React.ReactNode; label: string; color: string }> = {
  market_need: { icon: <Target size={16} />, label: "Market Need", color: "#3b82f6" },
  technical_feasibility: { icon: <Zap size={16} />, label: "Technical Feasibility", color: "#8b5cf6" },
  competitive_landscape: { icon: <Shield size={16} />, label: "Competitive Landscape", color: "#f59e0b" },
  scalability: { icon: <TrendingUp size={16} />, label: "Scalability", color: "#10b981" },
  revenue_potential: { icon: <DollarSign size={16} />, label: "Revenue Potential", color: "#06b6d4" },
};

const VERDICT_CONFIG: Record<string, { label: string; color: string; bg: string; icon: React.ReactNode }> = {
  strong_candidate: { label: "Strong Candidate", color: "text-green-400", bg: "bg-green-500/10 border-green-500/30", icon: <CheckCircle size={18} /> },
  promising_with_gaps: { label: "Promising with Gaps", color: "text-amber-400", bg: "bg-amber-500/10 border-amber-500/30", icon: <AlertTriangle size={18} /> },
  high_risk: { label: "High Risk", color: "text-red-400", bg: "bg-red-500/10 border-red-500/30", icon: <XCircle size={18} /> },
  not_recommended: { label: "Not Recommended", color: "text-red-500", bg: "bg-red-500/10 border-red-500/30", icon: <XCircle size={18} /> },
};

const RadarChart = ({ dimensions }: { dimensions: DimensionScore[] }) => {
  const size = 280;
  const center = size / 2;
  const maxRadius = 110;
  const levels = 5;

  const getPoint = (index: number, radius: number) => {
    const angle = (Math.PI * 2 * index) / 5 - Math.PI / 2;
    return { x: center + radius * Math.cos(angle), y: center + radius * Math.sin(angle) };
  };

  const gridPolygons = Array.from({ length: levels }, (_, level) => {
    const r = (maxRadius * (level + 1)) / levels;
    return Array.from({ length: 5 }, (_, i) => { const p = getPoint(i, r); return `${p.x},${p.y}`; }).join(" ");
  });

  const dataPoints = dimensions.map((dim, i) => {
    const r = (dim.score / 10) * maxRadius;
    const p = getPoint(i, r);
    return `${p.x},${p.y}`;
  }).join(" ");

  const vertexCircles = dimensions.map((dim, i) => {
    const r = (dim.score / 10) * maxRadius;
    const p = getPoint(i, r);
    const meta = DIMENSION_META[dim.dimension] || { color: "#3b82f6" };
    return <circle key={i} cx={p.x} cy={p.y} r={5} fill={meta.color} stroke="#09090b" strokeWidth={2} />;
  });

  return (
    <svg viewBox={`0 0 ${size} ${size}`} className="w-full max-w-[280px] mx-auto">
      {gridPolygons.map((points, i) => <polygon key={i} points={points} fill="none" stroke="#27272a" strokeWidth={1} />)}
      {Array.from({ length: 5 }, (_, i) => { const p = getPoint(i, maxRadius); return <line key={i} x1={center} y1={center} x2={p.x} y2={p.y} stroke="#27272a" strokeWidth={1} />; })}
      <polygon points={dataPoints} fill="rgba(59, 130, 246, 0.15)" stroke="#3b82f6" strokeWidth={2} />
      {vertexCircles}
    </svg>
  );
};

const ScoreRing = ({ score }: { score: number }) => {
  const getColor = (s: number) => s >= 8 ? "#00e5a0" : s >= 6 ? "#ffb347" : "#ff4757";
  const color = getColor(score);
  const radius = 52;
  const circumference = 2 * Math.PI * radius;
  const progress = score / 10;
  const dashOffset = circumference * (1 - progress);

  return (
    <div className="relative w-36 h-36">
      <svg className="w-full h-full" viewBox="0 0 120 120" style={{ transform: "rotate(-90deg)" }}>
        <circle cx="60" cy="60" r={radius} fill="none" stroke="#27272a" strokeWidth="10" />
        <circle cx="60" cy="60" r={radius} fill="none" stroke={color} strokeWidth="10" strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={dashOffset} style={{ transition: "stroke-dashoffset 1s ease-out, stroke 0.4s ease" }} />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-black leading-none" style={{ color, textShadow: `0 0 20px ${color}55` }}>{score.toFixed(1)}</span>
        <span className="text-zinc-400 text-xs font-mono mt-0.5">/ 10</span>
      </div>
    </div>
  );
};

export default function ValidatePage() {
  const [idea, setIdea] = useState("");
  const [industry, setIndustry] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ValidationResponse | null>(null);
  const [error, setError] = useState("");

  const handleValidate = async () => {
    if (!idea.trim()) return;
    setLoading(true); setError(""); setResult(null);
    try {
      const res = await fetch(`${BACKEND_URL}/api/validation/validate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idea: idea.trim(), industry: industry.trim() || undefined }),
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => null);
        throw new Error(errData?.detail || `Server error: ${res.status}`);
      }
      const data: ValidationResponse = await res.json();
      setResult(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally { setLoading(false); }
  };

  const verdictConfig = result ? VERDICT_CONFIG[result.verdict] || VERDICT_CONFIG.high_risk : null;

  return (
    <div className="min-h-screen bg-[#09090b] text-white relative overflow-hidden">
      <AnimatedBackground />
      <div className="relative z-10 max-w-4xl mx-auto px-6 py-12">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
          <Link href="/generate" className="inline-flex items-center gap-2 text-zinc-400 hover:text-white transition-colors mb-6 group">
            <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
            <span className="text-sm font-mono">BACK TO HOME</span>
          </Link>
          <div className="flex items-center gap-3 mb-2">
            <Sparkles className="text-blue-400" size={28} />
            <h1 className="text-3xl font-bold font-mono tracking-tight">IDEA VALIDATION</h1>
          </div>
          <p className="text-zinc-400 text-sm max-w-xl">Get an instant AI-powered assessment of your startup idea across 5 critical dimensions. Validate before you invest time in a full BRD.</p>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="border border-zinc-800 rounded-xl p-6 bg-zinc-950/80 backdrop-blur-sm mb-8">
          <div className="mb-4">
            <label className="block text-sm font-mono text-zinc-400 uppercase tracking-widest mb-2">YOUR STARTUP IDEA <span className="text-red-400">*</span></label>
            <textarea value={idea} onChange={(e) => setIdea(e.target.value)} placeholder="e.g. An AI-powered platform that matches rescue dogs with adopters based on lifestyle compatibility..." rows={4} className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-3 text-white text-sm placeholder-zinc-600 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20 resize-none transition-colors" />
          </div>
          <div className="mb-5">
            <label className="block text-sm font-mono text-zinc-400 uppercase tracking-widest mb-2">INDUSTRY <span className="text-zinc-600">(optional)</span></label>
            <input type="text" value={industry} onChange={(e) => setIndustry(e.target.value)} placeholder="e.g. EdTech, HealthTech, FinTech..." className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-3 text-white text-sm placeholder-zinc-600 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20 transition-colors" />
          </div>
          <button onClick={handleValidate} disabled={loading || !idea.trim()} className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 disabled:bg-zinc-800 disabled:text-zinc-500 text-white font-semibold py-3 px-6 rounded-lg transition-all text-sm">
            {loading ? (<><Loader2 size={18} className="animate-spin" />ANALYZING WITH AI...</>) : (<><BarChart3 size={18} />VALIDATE IDEA</>)}
          </button>
        </motion.div>

        {error && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="border border-red-500/30 bg-red-500/5 rounded-xl p-4 mb-8">
            <div className="flex items-center gap-2 text-red-400 text-sm"><AlertTriangle size={16} /><span>{error}</span></div>
          </motion.div>
        )}

        {loading && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="border border-zinc-800 rounded-xl p-12 bg-zinc-950/80 backdrop-blur-sm mb-8 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-500/10 border border-blue-500/20 mb-4">
              <Loader2 size={28} className="animate-spin text-blue-400" />
            </div>
            <p className="text-zinc-300 font-mono text-sm">AI is analyzing your idea across 5 dimensions...</p>
            <p className="text-zinc-600 text-xs mt-2">Using llama-3.3-70b for deep analysis</p>
          </motion.div>
        )}

        {result && !loading && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            <div className="border border-zinc-800 rounded-xl p-6 bg-zinc-950/80 backdrop-blur-sm">
              <h3 className="text-sm font-mono text-zinc-400 uppercase tracking-widest mb-3">IDEA SUMMARY</h3>
              <p className="text-zinc-200 text-sm leading-relaxed">{result.idea_summary}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="border border-zinc-800 rounded-xl p-6 bg-zinc-950/80 backdrop-blur-sm flex flex-col items-center justify-center">
                <h3 className="text-sm font-mono text-zinc-400 uppercase tracking-widest mb-4">OVERALL SCORE</h3>
                <ScoreRing score={result.overall_score} />
              </div>
              <div className="border border-zinc-800 rounded-xl p-6 bg-zinc-950/80 backdrop-blur-sm flex flex-col items-center justify-center">
                <h3 className="text-sm font-mono text-zinc-400 uppercase tracking-widest mb-4">VERDICT</h3>
                <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border ${verdictConfig?.bg}`}>
                  <span className={verdictConfig?.color}>{verdictConfig?.icon}</span>
                  <span className={`text-sm font-semibold ${verdictConfig?.color}`}>{verdictConfig?.label}</span>
                </div>
                <div className="mt-4 text-center">
                  <p className="text-zinc-500 text-xs font-mono mb-1">CONFIDENCE</p>
                  <p className="text-white text-lg font-bold">{(result.confidence * 100).toFixed(0)}%</p>
                </div>
              </div>
              <div className="border border-zinc-800 rounded-xl p-6 bg-zinc-950/80 backdrop-blur-sm">
                <h3 className="text-sm font-mono text-zinc-400 uppercase tracking-widest mb-2 text-center">DIMENSION RADAR</h3>
                <RadarChart dimensions={result.dimensions} />
              </div>
            </div>

            <div className="border border-zinc-800 rounded-xl p-6 bg-zinc-950/80 backdrop-blur-sm">
              <h3 className="text-sm font-mono text-zinc-400 uppercase tracking-widest mb-3">RECOMMENDATION</h3>
              <p className="text-zinc-200 text-sm leading-relaxed">{result.recommendation}</p>
            </div>

            <div className="border border-zinc-800 rounded-xl p-6 bg-zinc-950/80 backdrop-blur-sm">
              <h3 className="text-sm font-mono text-zinc-400 uppercase tracking-widest mb-5">DIMENSION BREAKDOWN</h3>
              <div className="space-y-5">
                {result.dimensions.map((dim, i) => {
                  const meta = DIMENSION_META[dim.dimension] || { icon: <BarChart3 size={16} />, label: dim.dimension, color: "#3b82f6" };
                  const barWidth = (dim.score / 10) * 100;
                  return (
                    <div key={i}>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span style={{ color: meta.color }}>{meta.icon}</span>
                          <span className="text-sm font-medium text-zinc-200">{meta.label}</span>
                        </div>
                        <span className="text-sm font-bold font-mono" style={{ color: meta.color }}>{dim.score}/10</span>
                      </div>
                      <div className="w-full bg-zinc-800 rounded-full h-2 mb-2">
                        <div className="h-2 rounded-full transition-all duration-700" style={{ width: `${barWidth}%`, backgroundColor: meta.color }} />
                      </div>
                      <p className="text-zinc-400 text-xs leading-relaxed">{dim.explanation}</p>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="border border-blue-500/20 bg-blue-500/5 rounded-xl p-6 text-center">
              <p className="text-zinc-300 text-sm mb-3">Want a complete Business Requirements Document for this idea?</p>
              <Link href="/generate" className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold py-2.5 px-6 rounded-lg transition-colors text-sm">
                <Sparkles size={16} />GENERATE FULL BRD
              </Link>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}