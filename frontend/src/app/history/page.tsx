"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Clock, Zap, FileText } from "lucide-react";

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
    fetch(`${API}/api/sessions?limit=50`, { headers: { "X-Vellum-Key": "vellum-2024-secure-key" } })
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
      month: "short", day: "numeric", year: "numeric",
      hour: "2-digit", minute: "2-digit",
    });
  };

  const scoreColor = (s: number | null) => {
    if (!s) return "text-zinc-500";
    return s >= 7.5 ? "text-[#00e5a0]" : s >= 5.5 ? "text-[#ffb347]" : "text-[#ff4757]";
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white font-sans">
      {/* Header */}
      <div className="border-b border-white/10 bg-black">
        <div className="max-w-5xl mx-auto px-6 h-14 flex items-center gap-4">
          <Link href="/" className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors">
            <ArrowLeft size={16} />
            <span className="text-xs font-mono tracking-widest uppercase">Back</span>
          </Link>
          <span className="text-[#f5a623] font-mono">/</span>
          <span className="text-xs font-mono tracking-widest uppercase">SESSION HISTORY</span>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-5xl mx-auto px-6 py-8">
        <h1 className="text-2xl font-bold mb-1">Past BRD Generations</h1>
        <p className="text-zinc-500 text-sm mb-8">All your generated Business Requirement Documents</p>

        {loading ? (
          <div className="flex items-center gap-2 text-zinc-500 text-sm">
            <Zap size={14} className="animate-pulse" />
            Loading sessions...
          </div>
        ) : sessions.length === 0 ? (
          <div className="text-center py-20 text-zinc-600">
            <FileText size={40} className="mx-auto mb-3 opacity-50" />
            <p className="text-sm">No BRD sessions yet.</p>
            <Link href="/generate" className="text-[#f5a623] text-sm mt-2 inline-block hover:underline">
              Generate your first BRD →
            </Link>
          </div>
        ) : (
          <div className="space-y-2">
            {sessions.map((s) => (
              <Link
                key={s.id}
                href={`/results/${s.id}`}
                className="block border border-white/5 rounded-lg p-4 hover:border-white/15 hover:bg-white/[0.02] transition-all group"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <FileText size={16} className="text-zinc-600 group-hover:text-[#f5a623] transition-colors" />
                    <div>
                      <p className="font-semibold text-sm group-hover:text-[#f5a623] transition-colors">
                        {s.startup_name}
                      </p>
                      <p className="text-zinc-600 text-xs font-mono mt-0.5">
                        {s.id.substring(0, 8)}...
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-6 text-xs">
                    {s.vellum_score !== null && (
                      <span className={`font-black text-lg ${scoreColor(s.vellum_score)}`}>
                        {s.vellum_score.toFixed(1)}
                      </span>
                    )}
                    {s.processing_time_ms && (
                      <span className="text-zinc-500 flex items-center gap-1">
                        <Clock size={12} />
                        {(s.processing_time_ms / 1000).toFixed(1)}s
                      </span>
                    )}
                    <span className="text-zinc-600 w-36 text-right">
                      {formatDate(s.created_at)}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
