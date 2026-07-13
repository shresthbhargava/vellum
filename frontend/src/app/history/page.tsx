"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Clock, Zap, FileText, TrendingUp, Activity, BarChart3 } from "lucide-react";

const API = process.env.NEXT_PUBLIC_API_URL || "https://vellum-ai-service.onrender.com";

interface Session {
  id: string;
  startup_name: string;
  vellum_score: number | null;
  status: string;
  processing_time_ms: number | null;
  created_at: string | null;
}

export default function HistoryPage() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API}/api/sessions?limit=50`, {
      headers: { "X-Vellum-Key": "vellum-2024-secure-key" },
    })
      .then((r) => r.json())
      .then((data) => {
        setSessions(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const formatDate = (iso: string | null) => {
    if (!iso) return "";
    const d = new Date(iso);
    return d.toLocaleDateString("en-US", {
      month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
    });
  };

  const scoreColor = (s: number | null) => {
    if (!s) return "text-zinc-500";
    return s >= 7.5 ? "text-emerald-400" : s >= 5.5 ? "text-amber-400" : "text-red-400";
  };

  const scoreBg = (s: number | null) => {
    if (!s) return "bg-zinc-800/50";
    return s >= 7.5 ? "bg-emerald-500/10 border-emerald-500/20" : s >= 5.5 ? "bg-amber-500/10 border-amber-500/20" : "bg-red-500/10 border-red-500/20";
  };

  const avgScore = sessions.filter(s => s.vellum_score).length > 0
    ? (sessions.filter(s => s.vellum_score).reduce((a, b) => a + (b.vellum_score || 0), 0) / sessions.filter(s => s.vellum_score).length).toFixed(1)
    : "—";

  const totalSessions = sessions.length;
  const avgTime = sessions.filter(s => s.processing_time_ms).length > 0
    ? (sessions.filter(s => s.processing_time_ms).reduce((a, b) => a + (b.processing_time_ms || 0), 0) / sessions.filter(s => s.processing_time_ms).length / 1000).toFixed(1)
    : "—";

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white font-sans">
      {/* Top bar */}
      <div className="border-b border-white/[0.06] bg-black/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 h-12 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/generate" className="text-zinc-500 hover:text-white transition-colors">
              <ArrowLeft size={16} />
            </Link>
            <span className="text-zinc-700">|</span>
            <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-[0.2em]">Session Archive</span>
          </div>
          <Link href="/generate" className="text-[10px] font-mono text-[#f5a623] hover:text-[#ffc857] uppercase tracking-widest transition-colors">
            + New BRD
          </Link>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-10">
        {/* Stats row */}
        {!loading && sessions.length > 0 && (
          <div className="grid grid-cols-3 gap-4 mb-10">
            <div className="border border-white/[0.06] rounded-lg p-4 bg-white/[0.01]">
              <div className="flex items-center gap-2 mb-2">
                <FileText size={13} className="text-zinc-600" />
                <span className="text-[9px] font-mono text-zinc-600 uppercase tracking-widest">Total BRDs</span>
              </div>
              <span className="text-2xl font-black text-white">{totalSessions}</span>
            </div>
            <div className="border border-white/[0.06] rounded-lg p-4 bg-white/[0.01]">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp size={13} className="text-zinc-600" />
                <span className="text-[9px] font-mono text-zinc-600 uppercase tracking-widest">Avg Vellum Score</span>
              </div>
              <span className={`text-2xl font-black ${scoreColor(parseFloat(avgScore) || null)}`}>{avgScore}</span>
            </div>
            <div className="border border-white/[0.06] rounded-lg p-4 bg-white/[0.01]">
              <div className="flex items-center gap-2 mb-2">
                <Activity size={13} className="text-zinc-600" />
                <span className="text-[9px] font-mono text-zinc-600 uppercase tracking-widest">Avg Latency</span>
              </div>
              <span className="text-2xl font-black text-white">{avgTime}<span className="text-sm font-normal text-zinc-500 ml-1">s</span></span>
            </div>
          </div>
        )}

        {/* Section header */}
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-sm font-bold text-zinc-300 uppercase tracking-widest font-mono">All Generations</h1>
          <span className="text-[9px] font-mono text-zinc-700">{sessions.length} records</span>
        </div>

        {/* List */}
        {loading ? (
          <div className="flex items-center gap-2 text-zinc-600 text-xs py-20 justify-center">
            <Zap size={14} className="animate-pulse" />
            <span className="font-mono">LOADING SESSIONS...</span>
          </div>
        ) : sessions.length === 0 ? (
          <div className="text-center py-24 border border-dashed border-white/[0.06] rounded-lg">
            <div className="w-12 h-12 rounded-full border border-white/[0.08] flex items-center justify-center mx-auto mb-4">
              <BarChart3 size={20} className="text-zinc-700" />
            </div>
            <p className="text-zinc-600 text-sm font-mono">NO SESSIONS FOUND</p>
            <p className="text-zinc-700 text-xs mt-1">Generate your first BRD to see it here</p>
            <Link
              href="/generate"
              className="inline-block mt-5 px-4 py-2 border border-[#f5a623]/30 text-[#f5a623] text-[10px] font-mono uppercase tracking-widest hover:bg-[#f5a623]/10 transition-colors"
            >
              Generate BRD
            </Link>
          </div>
        ) : (
          <div className="space-y-1.5">
            {sessions.map((s, i) => (
              <Link
                key={s.id}
                href={`/results/${s.id}`}
                className="group flex items-center justify-between px-4 py-3.5 border border-transparent hover:border-white/[0.06] hover:bg-white/[0.015] rounded-lg transition-all duration-200"
              >
                {/* Left: index + name + id */}
                <div className="flex items-center gap-4 min-w-0">
                  <span className="text-[9px] font-mono text-zinc-700 w-5 text-right shrink-0">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-zinc-300 group-hover:text-white transition-colors truncate">
                      {s.startup_name}
                    </p>
                    <p className="text-[10px] font-mono text-zinc-700 mt-0.5">
                      {s.id.substring(0, 12)}...
                    </p>
                  </div>
                </div>

                {/* Right: score + time + date */}
                <div className="flex items-center gap-6 shrink-0">
                  {s.vellum_score !== null && (
                    <div className={`px-2.5 py-1 rounded-md border text-xs font-black ${scoreColor(s.vellum_score)} ${scoreBg(s.vellum_score)}`}>
                      {s.vellum_score.toFixed(1)}
                    </div>
                  )}
                  {s.processing_time_ms && (
                    <span className="text-[10px] font-mono text-zinc-600 flex items-center gap-1 w-14 justify-end">
                      <Clock size={10} />
                      {(s.processing_time_ms / 1000).toFixed(1)}s
                    </span>
                  )}
                  <span className="text-[10px] font-mono text-zinc-700 w-28 text-right">
                    {formatDate(s.created_at)}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
