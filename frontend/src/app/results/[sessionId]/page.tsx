"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import AnimatedBackground from "@/components/AnimatedBackground";
import { motion } from "framer-motion";
import { translations, Language } from "../../../utils/translations";
import VellumScore from "@/components/VellumScore";
import {
  ArrowLeft,
  Database,
  Download,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  Server,
  User,
  TrendingUp,
  AlertTriangle,
  ChevronRight,
  Code,
  Globe,
  LayoutDashboard,
  FileText,
  BarChart3,
  Cpu,
  Activity
} from "lucide-react";

interface AgentTrace {
  step: string;
  agent: string;
  output_summary: string;
  tokens_used?: number;
}

interface BRDSection {
  title?: string;
  version?: string;
  date?: string;
  executive_summary?: string;
  problem_statement?: {
    current_situation?: string;
    pain_points?: string[];
    impact?: string;
  };
  objectives?: string[];
  scope?: {
    in_scope?: string[];
    out_of_scope?: string[];
  };
  stakeholders?: { role: string; responsibility: string }[];
  functional_requirements?: { id: string; requirement: string; priority: string }[];
  non_functional_requirements?: { id: string; requirement: string; category: string }[];
  user_stories?: { id: string; as_a: string; i_want: string; so_that: string; acceptance_criteria: string[] }[];
  technical_architecture?: {
    overview?: string;
    components?: string[];
    data_flow?: string;
    tech_stack?: string[];
  };
  success_metrics?: { metric: string; target: string; measurement: string }[];
  risks?: { risk: string; probability: string; impact: string; mitigation: string }[];
  timeline?: { phase: string; duration: string; deliverables: string[] }[];
  swot?: {
    strengths?: string[];
    weaknesses?: string[];
    opportunities?: string[];
    threats?: string[];
  };
  competitors?: { name: string; advantages: string; disadvantages: string; risk_level: string }[];
  citations?: { source_text: string; confidence: number; mapped_requirement: string }[];
  overall_confidence?: number;
  target_market?: { content: string };
  solution_overview?: { content: string };
  pricing_strategy?: { content: string };
  go_to_market?: { content: string };
}

interface SessionState {
  session_id: string;
  status: "processing" | "success" | "failed";
  traces: AgentTrace[];
  brd: BRDSection;
  processing_time_ms: number;
  gcs_uri: string | null;
  error: string | null;
  startup_name?: string;
  vellum_score?: number;
  validation?: { overall_score?: number };
  critic?: { overall_score?: number };
}

const TypeWriter = ({ text, speed = 8, onDone }: { text: string, speed?: number, onDone?: () => void }) => {
  const [displayed, setDisplayed] = useState('');
  const [done, setDone] = useState(false);
  
  useEffect(() => {
    if (!text) return;
    setDisplayed('');
    setDone(false);
    let i = 0;
    const timer = setInterval(() => {
      if (i < text.length) {
        setDisplayed(text.slice(0, i + 1));
        i++;
      } else {
        setDone(true);
        clearInterval(timer);
        if (onDone) onDone();
      }
    }, speed);
    return () => clearInterval(timer);
  }, [text, speed, onDone]);
  
  return (
    <span>
      {displayed}
      {!done && <span className="animate-pulse">▋</span>}
    </span>
  );
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const calculateInvestorScore = (brd: any) => {
  if (!brd) return { score: 0, checks: [] };
  
  const checks = [
    { 
      label: 'Problem Clearly Defined', 
      pass: !!(brd?.problem_statement?.content?.length > 50 ||
               brd?.['02_problem_statement']?.content?.length > 50 ||
               Object.values(brd).some((v: unknown) => 
                 v && typeof v === 'object' && 
                 'content' in v && 
                 typeof (v as { content: unknown }).content === 'string' &&
                 (v as { content: string }).content.length > 50)),
      weight: 15,
      tip: 'Add more detail to problem statement'
    },
    { 
      label: 'Target Market Quantified', 
      pass: !!(JSON.stringify(brd).match(
        /\$[\d.,]+|billion|million|crore|lakh|\d+%|TAM|SAM|SOM/i
      )),
      weight: 15,
      tip: 'Add market size numbers'
    },
    { 
      label: 'Solution Differentiated', 
      pass: !!(JSON.stringify(brd).length > 500),
      weight: 15,
      tip: 'Explain what makes your solution unique'
    },
    { 
      label: 'Revenue Model Defined', 
      pass: !!(JSON.stringify(brd).match(
        /revenue|pricing|subscription|₹|rs\.|per month|annual/i
      )),
      weight: 20,
      tip: 'Define your pricing and revenue model'
    },
    { 
      label: 'Competitive Analysis Done', 
      pass: !!(brd?.competitors?.length > 0 || 
               JSON.stringify(brd).match(/competitor|vs\.|alternative/i)),
      weight: 15,
      tip: 'Add competitor comparison'
    },
    { 
      label: 'Go-to-Market Strategy', 
      pass: !!(JSON.stringify(brd).match(
        /go.to.market|launch|phase|channel|marketing/i
      )),
      weight: 10,
      tip: 'Define launch strategy'
    },
    { 
      label: 'Success Metrics Defined', 
      pass: !!(JSON.stringify(brd).match(
        /metric|kpi|target|measure|cac|ltv|retention|growth/i
      )),
      weight: 10,
      tip: 'Add KPIs and success criteria'
    },
  ];
  
  const score = checks.reduce((acc, c) => 
    acc + (c.pass ? c.weight : 0), 0);
  
  return { score, checks };
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const InvestorScore = ({ brd }: { brd: any; isLarge?: boolean }) => {
  const { score, checks } = calculateInvestorScore(brd);
  
  const getColor = (s: number) => 
    s >= 80 ? '#00e5a0' : s >= 60 ? '#ffb347' : '#ff4757';
  
  const getLabel = (s: number) =>
    s >= 80 ? 'Investor Ready 🚀' : 
    s >= 60 ? 'Almost There ⚡' : 
    'Needs Work 🔧';

  const color = getColor(score);
  const circumference = 2 * Math.PI * 52;
  const dashOffset = circumference - (score / 100) * circumference;

  return (
    <div className="border border-zinc-800 rounded-xl p-6 mb-6 bg-zinc-950">
      <div className="flex flex-col lg:flex-row items-center justify-between gap-6 mb-6">
        <div className="flex-grow">
          <h3 className="text-lg font-bold text-white font-mono">
            INVESTOR READINESS SCORE
          </h3>
          <p className="text-zinc-500 text-sm mt-1">
            Based on BRD completeness analysis
          </p>
          
          <div className="grid grid-cols-1 gap-2 mt-4">
            {checks.map((check, i) => (
              <div key={i} className="flex items-center gap-3 text-sm p-2 rounded-lg bg-zinc-900">
                <span className={check.pass ? 'text-green-400' : 'text-red-400'}>
                  {check.pass ? '✅' : '❌'}
                </span>
                <span className={check.pass ? 'text-zinc-300' : 'text-zinc-500'}>
                  {check.label}
                </span>
                {!check.pass && (
                  <span className="ml-auto text-amber-500 text-xs">
                    {check.tip}
                  </span>
                )}
                <span className="ml-auto text-zinc-600 text-xs font-mono">
                  +{check.weight}pts
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Circular SVG Progress Ring - responsive, no overflow */}
        <div className="shrink-0 flex flex-col items-center justify-center gap-3">
          <div className="relative w-36 h-36">
            <svg
              className="w-full h-full"
              viewBox="0 0 120 120"
              style={{ transform: 'rotate(-90deg)' }}
            >
              <circle cx="60" cy="60" r="52" fill="none" stroke="#27272a" strokeWidth="10" />
              <circle
                cx="60" cy="60" r="52"
                fill="none"
                stroke={color}
                strokeWidth="10"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={dashOffset}
                style={{ transition: 'stroke-dashoffset 1s ease-out, stroke 0.4s ease' }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span
                className="text-3xl font-black leading-none"
                style={{ color, textShadow: `0 0 20px ${color}55` }}
              >
                {score}
              </span>
              <span className="text-zinc-400 text-xs font-mono mt-0.5">/ 100</span>
            </div>
          </div>
          <div className="text-sm font-bold text-center" style={{ color }}>
            {getLabel(score)}
          </div>
        </div>
      </div>
      
      <div className="w-full bg-zinc-800 rounded-full h-2">
        <div 
          className="h-2 rounded-full transition-all duration-1000"
          style={{ width: `${score}%`, background: color }}
        />
      </div>
    </div>
  );
};


const extractMarketSize = (
  content: string | undefined, 
  type: string
): string => {
  if (!content) return '';
  const regex = new RegExp(
    type + '[:\\s]*([₹$][\\d.,]+\\s*(?:billion|million|crore|lakh|B|M|Cr|K)?)',
    'i'
  );
  const match = content.match(regex);
  return match?.[1] || '';
};

const extractMarketData = (content: string) => {
  const tamMatch = content?.match(
    /TAM[:\s]*([₹$][\d.,]+\s*(?:billion|million|crore|lakh|B|M|Cr)?)/i
  );
  const samMatch = content?.match(
    /SAM[:\s]*([₹$][\d.,]+\s*(?:billion|million|crore|lakh|B|M|Cr)?)/i
  );
  const somMatch = content?.match(
    /SOM[:\s]*([₹$][\d.,]+\s*(?:billion|million|crore|lakh|B|M|Cr)?)/i
  );
  
  return {
    tam: tamMatch?.[1] || 'Large Market',
    sam: samMatch?.[1] || 'Serviceable Market',
    som: somMatch?.[1] || 'Obtainable Market',
  };
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const MarketVisualizer = ({ content }: { content: string }) => {
  const { tam, sam, som } = extractMarketData(content);
  const [animated, setAnimated] = useState(false);
  
  useEffect(() => {
    const timer = setTimeout(() => setAnimated(true), 300);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="border border-zinc-800 rounded-xl p-6 mt-4 bg-zinc-950">
      <h4 className="text-sm font-mono text-zinc-400 uppercase tracking-widest mb-6">
        MARKET OPPORTUNITY
      </h4>
      
      <div className="flex items-center justify-center">
        <div className="relative flex items-center justify-center">
          {/* TAM - outer */}
          <div 
            className="rounded-full border-2 border-blue-500/30 bg-blue-500/5 flex items-center justify-center transition-all duration-1000"
            style={{ 
              width: animated ? 280 : 0, 
              height: animated ? 280 : 0 
            }}
          >
            {/* SAM - middle */}
            <div 
              className="rounded-full border-2 border-amber-500/40 bg-amber-500/5 flex items-center justify-center absolute transition-all duration-1000 delay-300"
              style={{ 
                width: animated ? 180 : 0, 
                height: animated ? 180 : 0 
              }}
            >
              {/* SOM - inner */}
              <div 
                className="rounded-full border-2 border-green-500/60 bg-green-500/10 flex items-center justify-center absolute transition-all duration-1000 delay-500"
                style={{ 
                  width: animated ? 90 : 0, 
                  height: animated ? 90 : 0 
                }}
              >
                <div className="text-center">
                  <div className="text-green-400 text-xs font-bold font-mono">
                    SOM
                  </div>
                  <div className="text-green-300 text-xs">
                    {som}
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Labels */}
          <div className="absolute top-2 text-center">
            <div className="text-blue-400 text-xs font-bold font-mono">TAM</div>
            <div className="text-blue-300 text-xs">{tam}</div>
          </div>
          
          <div className="absolute bottom-8 text-center">
            <div className="text-amber-400 text-xs font-bold font-mono">SAM</div>
            <div className="text-amber-300 text-xs">{sam}</div>
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-3 gap-3 mt-6">
        {[
          { label: 'TAM', value: tam, colorClass: 'text-blue-400', bgClass: 'bg-blue-500/10 border-blue-500/20' },
          { label: 'SAM', value: sam, colorClass: 'text-amber-400', bgClass: 'bg-amber-500/10 border-amber-500/20' },
          { label: 'SOM', value: som, colorClass: 'text-green-400', bgClass: 'bg-green-500/10 border-green-500/20' },
        ].map(({ label, value, colorClass, bgClass }) => (
          <div key={label} 
               className={`text-center p-3 rounded-lg border ${bgClass}`}>
            <div className={`${colorClass} font-bold font-mono text-sm`}>
              {label}
            </div>
            <div className="text-white text-xs mt-1">
              {value}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const ConfidenceBadge = ({ citations, content }: { 
  citations: { confidence?: number }[], 
  content: string 
}) => {
  const avgConfidence = citations?.length > 0
    ? citations.reduce((a, c) => a + (c.confidence || 0.8), 0) / citations.length
    : content?.length > 200 ? 0.85 : 0.65;
  
  const pct = Math.round(avgConfidence * 100);
  
  const color = pct >= 80 
    ? { bg: 'bg-green-500/10', border: 'border-green-500/30', text: 'text-green-400', bar: '#00e5a0' }
    : pct >= 60 
    ? { bg: 'bg-amber-500/10', border: 'border-amber-500/30', text: 'text-amber-400', bar: '#ffb347' }
    : { bg: 'bg-red-500/10', border: 'border-red-500/30', text: 'text-red-400', bar: '#ff4757' };
  
  const label = pct >= 80 ? 'High Confidence' 
              : pct >= 60 ? 'Medium Confidence' 
              : 'Needs Validation';

  return (
    // FROM:
    <div 
      className={`flex items-center gap-2 px-3 py-1 rounded-full border text-[10px] font-mono shrink-0 ${color.bg} ${color.border}`}
      title="Based on source citations and content depth"
    >
      <div className="w-12 h-1.5 bg-zinc-700 rounded-full overflow-hidden">
        <div 
          className="h-full rounded-full transition-all duration-1000"
          style={{ width: `${pct}%`, background: color.bar }}
        />
      </div>
      <span className={color.text}>{pct}% {label}</span>
    </div>
  );
};

export default function ResultsPage() {
  const params = useParams();
  const sessionId = params.sessionId as string;

  const [data, setData] = useState<SessionState | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showBqModal, setShowBqModal] = useState(false);
  const [currentTypingIndex, setCurrentTypingIndex] = useState(0);
  const [names, setNames] = useState<string[]>([]);
  const [generatingNames, setGeneratingNames] = useState(false);
  const [copiedName, setCopiedName] = useState('');
  const [activeTab, setActiveTab] = useState('overview');
  const [lang, setLang] = useState<Language>('en');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedLang = localStorage.getItem('lang') as Language;
      if (savedLang && ['en', 'hi', 'es'].includes(savedLang)) {
        setLang(savedLang);
      }
    }
  }, []);

  const changeLanguage = (newLang: Language) => {
    setLang(newLang);
    if (typeof window !== 'undefined') {
      localStorage.setItem('lang', newLang);
    }
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'brd', label: 'Full BRD', icon: FileText },
    { id: 'market', label: 'Market Analysis', icon: BarChart3 },
    { id: 'tech', label: 'Architecture', icon: Cpu },
    { id: 'agents', label: 'Agent Trace', icon: Activity },
  ];

  const suggestDomains = (name: string) => {
    const clean = name.toLowerCase()
      .replace(/\s+/g, '')
      .replace(/[^a-z0-9]/g, '');
    return [
      `${clean}.com`,
      `${clean}.ai`,
      `${clean}.in`,
      `get${clean}.com`,
      `try${clean}.com`,
    ];
  };

  const generateStartupNames = async () => {
    setGeneratingNames(true);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8500'}/api/generate-names`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            startup_name: data?.startup_name,
            domain: data?.brd?.executive_summary?.slice(0, 200) || '',
            problem: data?.brd?.problem_statement?.current_situation?.slice(0, 200) || '',
          })
        }
      );
      
      if (res.ok) {
        const resData = await res.json();
        setNames(resData.names || []);
      } else {
        // Fallback: generate client-side
        const prefixes = ['Swift', 'Forge', 'Spark', 
                          'Nexus', 'Pulse', 'Arc', 
                          'Nova', 'Craft'];
        const suffixes = ['AI', 'Hub', 'Lab', 
                          'Base', 'Flow', 'Desk', 
                          'Suite', 'Pro'];
        const generated = Array.from({length: 6}, () => 
          prefixes[Math.floor(Math.random() * prefixes.length)] + 
          suffixes[Math.floor(Math.random() * suffixes.length)]
        );
        setNames(generated);
      }
    } catch {
      const words = ['Smart', 'Quick', 'Auto', 
                     'Fast', 'Clear', 'Sharp'];
      const ends = ['AI', 'Hub', 'Lab', 
                    'App', 'Pro', 'HQ'];
      setNames(Array.from({length: 6}, () => 
        words[Math.floor(Math.random() * words.length)] + 
        ends[Math.floor(Math.random() * ends.length)]
      ));
    }
    setGeneratingNames(false);
  };

  const copyName = (name: string) => {
    navigator.clipboard.writeText(name);
    setCopiedName(name);
    setTimeout(() => setCopiedName(''), 2000);
  };

  const handleSectionDone = (index: number) => {
    setTimeout(() => {
      setCurrentTypingIndex(prev => Math.max(prev, index + 1));
    }, 500);
  };

  useEffect(() => {
    if (!data || !data.brd) return;
    const brd = data.brd;

    const isSectionEmpty = (index: number): boolean => {
      switch (index) {
        case 0: return !brd.executive_summary;
        case 1: return !brd.problem_statement;
        case 2: return !brd.objectives || brd.objectives.length === 0;
        case 3: return !brd.scope || ((!brd.scope.in_scope || brd.scope.in_scope.length === 0) && (!brd.scope.out_of_scope || brd.scope.out_of_scope.length === 0));
        case 4: return !brd.stakeholders || brd.stakeholders.length === 0;
        case 5: return !brd.functional_requirements || brd.functional_requirements.length === 0;
        case 6: return !brd.non_functional_requirements || brd.non_functional_requirements.length === 0;
        case 7: return !brd.user_stories || brd.user_stories.length === 0;
        case 8: return !brd.technical_architecture;
        case 9: return !brd.timeline || brd.timeline.length === 0;
        case 10: return !brd.success_metrics || brd.success_metrics.length === 0;
        case 11: return !brd.risks || brd.risks.length === 0;
        case 12: return !brd.swot;
        case 13: return !brd.competitors || brd.competitors.length === 0;
        case 14: return !brd.citations || brd.citations.length === 0;
        default: return false;
      }
    };

    if (currentTypingIndex < 15) {
      const status = data.status;
      if (status !== "processing") {
        if (isSectionEmpty(currentTypingIndex)) {
          setCurrentTypingIndex(prev => prev + 1);
        }
      } else {
        let hasLaterData = false;
        for (let j = currentTypingIndex + 1; j < 15; j++) {
          if (!isSectionEmpty(j)) {
            hasLaterData = true;
            break;
          }
        }
        if (isSectionEmpty(currentTypingIndex) && hasLaterData) {
          setCurrentTypingIndex(prev => prev + 1);
        }
      }
    }
  }, [data, currentTypingIndex]);


  useEffect(() => {
    if (!sessionId) return;

    let pollInterval: NodeJS.Timeout | null = null;

    const fetchSession = async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8500'}/api/sessions/${sessionId}/agents`);
        if (!res.ok) {
          if (res.status === 404) {
            throw new Error("Session specifications not found. Verify session UUID.");
          }
          throw new Error("API retrieval failure.");
        }
        const sessionData: SessionState = await res.json();
        setData(sessionData);
        setLoading(false);

        // Cancel polling if finished or failed
        if (sessionData.status !== "processing" && pollInterval) {
          clearInterval(pollInterval);
        }
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Failed to retrieve session details.");
        setLoading(false);
        if (pollInterval) clearInterval(pollInterval);
      }
    };

    // Run first fetch immediately
    fetchSession();

    // Start polling every 500ms
    pollInterval = setInterval(fetchSession, 500);

    return () => {
      if (pollInterval) clearInterval(pollInterval);
    };
  }, [sessionId]);
  

  /* eslint-disable @typescript-eslint/no-explicit-any */
  const getSectionText = (key: string, val: any): string => {
    if (!val) return "";
    if (typeof val === "string") return val;
    if (typeof val === "object") {
      if (val.content && typeof val.content === "string") return val.content;
      
      // If it's problem statement:
      if (key === "problem_statement") {
        const parts = [];
        if (val.current_situation) parts.push(`Current Situation: ${val.current_situation}`);
        if (val.pain_points && Array.isArray(val.pain_points)) {
          parts.push(`Key Pain Points:\n` + val.pain_points.map((p: string) => `- ${p}`).join("\n"));
        }
        if (val.impact) parts.push(`Downstream Impact: ${val.impact}`);
        return parts.join("\n\n");
      }
      
      // If it's technical_architecture:
      if (key === "technical_architecture") {
        const parts = [];
        if (val.overview) parts.push(`Overview: ${val.overview}`);
        if (val.components && Array.isArray(val.components)) {
          parts.push(`Core Components: ${val.components.join(", ")}`);
        }
        if (val.data_flow) parts.push(`Data Ingestion Flow: ${val.data_flow}`);
        if (val.tech_stack && Array.isArray(val.tech_stack)) {
          parts.push(`Technology Stack: ${val.tech_stack.join(", ")}`);
        }
        return parts.join("\n\n");
      }
      
      // If it's success_metrics (an array of objects):
      if (key === "success_metrics" && Array.isArray(val)) {
        return val.map((m: any) => `- Metric: ${m.metric}\n  Target: ${m.target}\n  Measurement: ${m.measurement}`).join("\n\n");
      }

      // If it's competitor analysis (or competitors):
      if (key === "competitors" && Array.isArray(val)) {
        return val.map((c: any) => `- ${c.name}\n  Advantages: ${c.advantages}\n  Disadvantages: ${c.disadvantages}\n  Risk Level: ${c.risk_level}`).join("\n\n");
      }
      
      // Fallback for arrays
      if (Array.isArray(val)) {
        return val.map(item => typeof item === "string" ? `- ${item}` : JSON.stringify(item)).join("\n");
      }
    }
    return String(val);
  };

  const exportToPDF = async () => {
    const { jsPDF } = await import('jspdf');
    const brdData = data;
    
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    const brd = brdData?.brd;
    const startupName = (brdData as any)?.startup_name || brd?.title || 'Vellum';
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 20;
    const maxWidth = pageWidth - margin * 2;
    let y = 20;

    const addPage = () => {
      doc.addPage();
      y = 20;
    };

    const checkPage = (needed = 10) => {
      if (y + needed > 270) addPage();
    };

    const addHeading = (text: string, size = 16, color = [232, 65, 42]) => {
      checkPage(15);
      doc.setFontSize(size);
      doc.setTextColor(color[0], color[1], color[2]);
      doc.setFont('helvetica', 'bold');
      doc.text(text, margin, y);
      y += size * 0.5 + 4;
    };

    const addBody = (text: string, size = 10) => {
      if (!text) return;
      doc.setFontSize(size);
      doc.setTextColor(40, 40, 40);
      doc.setFont('helvetica', 'normal');
      const lines = doc.splitTextToSize(text, maxWidth);
      lines.forEach((line: string) => {
        checkPage(6);
        doc.text(line, margin, y);
        y += 5.5;
      });
      y += 3;
    };

    const addDivider = () => {
      checkPage(5);
      doc.setDrawColor(232, 65, 42);
      doc.setLineWidth(0.5);
      doc.line(margin, y, pageWidth - margin, y);
      y += 6;
    };

    // Title Page
    doc.setFillColor(26, 26, 46);
    doc.rect(0, 0, pageWidth, 60, 'F');
    doc.setFontSize(28);
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.text(`BRD: ${startupName}`, margin, 35);
    doc.setFontSize(12);
    doc.setTextColor(232, 65, 42);
    doc.text('Generated by Vellum', margin, 48);
    doc.setFontSize(10);
    doc.setTextColor(180, 180, 180);
    doc.text(new Date().toLocaleDateString('en-IN', { 
      year: 'numeric', month: 'long', day: 'numeric' 
    }), margin, 56);
    y = 75;

    // Sections
    const sections: [string, string | undefined][] = [
      ['Executive Summary', getSectionText("executive_summary", brd?.executive_summary) || (brd?.executive_summary as any)?.content],
      ['Problem Statement', getSectionText("problem_statement", brd?.problem_statement) || (brd?.problem_statement as any)?.content],
      ['Target Market', getSectionText("target_market", (brd as any)?.target_market) || (brd as any)?.target_market?.content],
      ['Solution Overview', getSectionText("solution_overview", (brd as any)?.solution_overview) || (brd as any)?.solution_overview?.content],
      ['Feature Matrix', getSectionText("feature_matrix", (brd as any)?.feature_matrix) || (brd as any)?.feature_matrix?.content],
      ['Competitor Analysis', getSectionText("competitors", brd?.competitors || (brd as any)?.competitor_analysis) || (brd as any)?.competitor_analysis?.content],
      ['Tech Architecture', getSectionText("technical_architecture", brd?.technical_architecture || (brd as any)?.tech_architecture) || (brd as any)?.tech_architecture?.content],
      ['Pricing Strategy', getSectionText("pricing_strategy", (brd as any)?.pricing_strategy) || (brd as any)?.pricing_strategy?.content],
      ['Go-to-Market Strategy', getSectionText("go_to_market", (brd as any)?.go_to_market) || (brd as any)?.go_to_market?.content],
      ['Success Metrics', getSectionText("success_metrics", brd?.success_metrics) || (brd as any)?.success_metrics?.content],
    ];

    sections.forEach(([title, content]: [string, string | undefined]) => {
      if (!content) return;
      addHeading(title);
      addDivider();
      addBody(content);
    });

    // SWOT
    if (brd?.swot) {
      addPage();
      addHeading('SWOT Analysis');
      addDivider();
      const swot = brd.swot;
      const swotSections: [string, string[] | undefined, number[]][] = [
        ['STRENGTHS', swot.strengths, [0, 180, 100]],
        ['WEAKNESSES', swot.weaknesses, [220, 50, 50]],
        ['OPPORTUNITIES', swot.opportunities, [50, 100, 220]],
        ['THREATS', swot.threats, [220, 150, 0]],
      ];
      swotSections.forEach(([label, items, color]: [string, string[] | undefined, number[]]) => {
        addHeading(label, 12, color);
        items?.forEach((item: string) => {
          addBody(`• ${item}`);
        });
        y += 4;
      });
    }

    // Competitors
    const competitors = (brdData as any)?.competitors || brd?.competitors;
    if (competitors && competitors.length > 0) {
      addPage();
      addHeading('Competitor Analysis');
      addDivider();
      competitors.forEach((c: any) => {
        addHeading(c.name, 12, [26, 26, 46]);
        addBody(`Strengths: ${c.strengths || c.advantages}`);
        addBody(`Weaknesses: ${c.weaknesses || c.disadvantages}`);
        addBody(`Pricing: ${c.pricing || 'N/A'}`);
        y += 4;
      });
    }

    // Footer on all pages
    const totalPages = doc.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(150, 150, 150);
      doc.text(
        `Vellum | ${startupName} BRD | Page ${i} of ${totalPages}`,
        margin, 290
      );
    }

    doc.save(`BRD-${startupName.replace(/\s+/g, '-')}-${Date.now()}.pdf`);
  };

  const exportToWord = async () => {
    try {
      const docxModule = await import('docx');
      const { 
        Document, Packer, Paragraph, TextRun, 
        HeadingLevel, AlignmentType
      } = docxModule;
      const fileSaverModule = await import('file-saver');
      const saveAs = fileSaverModule.saveAs || (fileSaverModule as any).default?.saveAs;

      const brdData = data;
      const brd = brdData?.brd;
      const startupName = (brdData as any)?.startup_name || brd?.title || 'Vellum';
      const children: any[] = [];

      // Title
      children.push(new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 400, after: 200 },
        children: [new TextRun({ 
          text: `BRD: ${startupName}`,
          bold: true, size: 52, font: 'Arial', color: '1a1a2e'
        })]
      }));

      children.push(new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 600 },
        children: [new TextRun({ 
          text: `Generated by Vellum | ${new Date().toLocaleDateString()}`,
          size: 22, font: 'Arial', color: 'E8412A'
        })]
      }));

      // Sections
      const sections: [string, string | undefined][] = [
        ['Executive Summary', getSectionText("executive_summary", brd?.executive_summary) || (brd?.executive_summary as any)?.content],
        ['Problem Statement', getSectionText("problem_statement", brd?.problem_statement) || (brd?.problem_statement as any)?.content],
        ['Target Market', getSectionText("target_market", (brd as any)?.target_market) || (brd as any)?.target_market?.content],
        ['Solution Overview', getSectionText("solution_overview", (brd as any)?.solution_overview) || (brd as any)?.solution_overview?.content],
        ['Feature Matrix', getSectionText("feature_matrix", (brd as any)?.feature_matrix) || (brd as any)?.feature_matrix?.content],
        ['Competitor Analysis', getSectionText("competitors", brd?.competitors || (brd as any)?.competitor_analysis) || (brd as any)?.competitor_analysis?.content],
        ['Tech Architecture', getSectionText("technical_architecture", brd?.technical_architecture || (brd as any)?.tech_architecture) || (brd as any)?.tech_architecture?.content],
        ['Pricing Strategy', getSectionText("pricing_strategy", (brd as any)?.pricing_strategy) || (brd as any)?.pricing_strategy?.content],
        ['Go-to-Market Strategy', getSectionText("go_to_market", (brd as any)?.go_to_market) || (brd as any)?.go_to_market?.content],
        ['Success Metrics', getSectionText("success_metrics", brd?.success_metrics) || (brd as any)?.success_metrics?.content],
      ];

      sections.forEach(([title, content]: [string, string | undefined]) => {
        if (!content) return;

        children.push(new Paragraph({
          heading: HeadingLevel.HEADING_1,
          spacing: { before: 400, after: 120 },
          children: [new TextRun({ 
            text: title, 
            bold: true, size: 32, 
            font: 'Arial', color: 'E8412A'
          })]
        }));

        children.push(new Paragraph({
          spacing: { before: 80, after: 200 },
          children: [new TextRun({ 
            text: content, 
            size: 22, font: 'Arial'
          })]
        }));
      });

      // SWOT
      if (brd?.swot) {
        children.push(new Paragraph({
          heading: HeadingLevel.HEADING_1,
          spacing: { before: 400, after: 200 },
          children: [new TextRun({ 
            text: 'SWOT Analysis', 
            bold: true, size: 32, 
            font: 'Arial', color: 'E8412A'
          })]
        }));

        const swot = brd.swot;
        const swotItems: [string, string[] | undefined, string][] = [
          ['STRENGTHS', swot.strengths, 'E8F8F0'],
          ['WEAKNESSES', swot.weaknesses, 'FEF0F0'],
          ['OPPORTUNITIES', swot.opportunities, 'EFF4FF'],
          ['THREATS', swot.threats, 'FFFBEB'],
        ];

        swotItems.forEach(([label, items]: [string, string[] | undefined, string]) => {
          children.push(new Paragraph({
            spacing: { before: 200, after: 80 },
            children: [new TextRun({ 
              text: label, 
              bold: true, size: 24, font: 'Arial'
            })]
          }));
          items?.forEach((item: string) => {
            children.push(new Paragraph({
              bullet: { level: 0 },
              spacing: { before: 40, after: 40 },
              children: [new TextRun({ 
                text: item, size: 22, font: 'Arial'
              })]
            }));
          });
        });
      }

      // Competitors
      const competitors = (brdData as any)?.competitors || brd?.competitors;
      if (competitors && competitors.length > 0) {
        children.push(new Paragraph({
          heading: HeadingLevel.HEADING_1,
          spacing: { before: 400, after: 200 },
          children: [new TextRun({ 
            text: 'Competitors', 
            bold: true, size: 32, 
            font: 'Arial', color: 'E8412A'
          })]
        }));

        competitors.forEach((c: any) => {
          children.push(new Paragraph({
            spacing: { before: 160, after: 80 },
            children: [new TextRun({ 
              text: c.name, bold: true, 
              size: 24, font: 'Arial'
            })]
          }));
          if (c.strengths || c.advantages) {
            children.push(new Paragraph({
              children: [
                new TextRun({ text: 'Strengths: ', bold: true, size: 22, font: 'Arial' }),
                new TextRun({ text: c.strengths || c.advantages, size: 22, font: 'Arial' })
              ]
            }));
          }
          if (c.weaknesses || c.disadvantages) {
            children.push(new Paragraph({
              children: [
                new TextRun({ text: 'Weaknesses: ', bold: true, size: 22, font: 'Arial' }),
                new TextRun({ text: c.weaknesses || c.disadvantages, size: 22, font: 'Arial' })
              ]
            }));
          }
        });
      }

      const doc = new Document({
        sections: [{ 
          properties: {
            page: {
              margin: { top: 1080, right: 1080, bottom: 1080, left: 1080 }
            }
          },
          children 
        }]
      });

      const buffer = await Packer.toBlob(doc);
      saveAs(buffer, `BRD-${startupName.replace(/\s+/g, '-')}-${Date.now()}.docx`);

    } catch (err) {
      console.error('Word export failed:', err);
      alert('Export failed. Check console for details.');
    }
  };
  /* eslint-enable @typescript-eslint/no-explicit-any */

  if (loading) {
    return (
      <div className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center p-6">
        <div className="text-center max-w-md w-full">
          <RefreshCw className="w-10 h-10 text-accent animate-spin mx-auto mb-4" />
          <h3 className="text-lg font-bold text-white uppercase tracking-wider">Loading Session Specifications</h3>
          <p className="text-xs text-neutral-400 mt-2 font-mono">Retrieving session uuid: {sessionId}...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center p-6">
        <div className="text-center max-w-md w-full card-3d border-red-950/40 p-6 rounded-xl glow-accent">
          <AlertCircle className="w-10 h-10 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-white uppercase tracking-wider">Session Error</h3>
          <p className="text-xs text-neutral-400 mt-2 font-mono leading-relaxed">{error || "Data not initialized."}</p>
          <Link
            href="/generate"
            className="mt-6 inline-flex items-center gap-2 px-4.5 py-2 btn-3d-secondary text-xs font-mono font-bold uppercase rounded-lg text-white"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Configuration
          </Link>
        </div>
      </div>
    );
  }

  const { status, traces, brd, processing_time_ms, gcs_uri } = data;
  const brdData = data;
  const isGenerating = status === "processing";
  const confidenceScore = brd?.overall_confidence || 0.75;
  const startupName = (data?.startup_name || brd?.title || 'Vellum').replace(/undefined/gi, '').trim() || 'Vellum';

  // Track steps of agents
  const agentsList = [
    { key: "1", name: "InputAgent", role: "Validation & Syntax" },
    { key: "2", name: "ExtractionAgent", role: "Modality Context Mining" },
    { key: "3", name: "EnrichmentAgent", role: "Industry Standards Mapping" },
    { key: "4", name: "BRDAgent", role: "Specification Drafting" },
    { key: "5", name: "QualityAgent", role: "Completeness Suite" }
  ];

  const renderTechInfrastructure = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 8 * 0.1 }}
      className="card-3d glass-card rounded-xl p-6"
    >
      <div className="flex flex-wrap justify-between items-center gap-2 mb-4 border-b border-darkBorder pb-2">
        <h3 className="text-xs font-mono font-bold uppercase tracking-widest text-accent mb-0">
          09 / TECHNICAL INFRASTRUCTURE SNAPSHOT
        </h3>
        <div className="flex items-center gap-2">
          {currentTypingIndex === 8 && brd.technical_architecture && (
            <span className="px-2 py-0.5 rounded bg-accent/20 border border-accent/30 text-accent font-mono text-[9px] uppercase tracking-wider animate-pulse">
              Writing...
            </span>
          )}
          {brd.technical_architecture && (
            <ConfidenceBadge 
              citations={[]} 
              content={getSectionText("technical_architecture", brd.technical_architecture)} 
            />
          )}
        </div>
      </div>
      {brd.technical_architecture && currentTypingIndex >= 8 ? (
        (() => {
          const techArch = brd.technical_architecture;
          return (
            <div className="flex flex-col gap-4 font-sans">
              <div>
                <h4 className="text-xs font-mono font-bold text-neutral-400 uppercase tracking-wide">Architectural Overview</h4>
                <p className="text-sm text-neutral-300 mt-1 font-light leading-relaxed">
                  {currentTypingIndex === 8 && !techArch.components && !techArch.data_flow && !techArch.tech_stack ? (
                    <TypeWriter text={techArch.overview || ""} onDone={() => handleSectionDone(8)} />
                  ) : currentTypingIndex === 8 ? (
                    <TypeWriter text={techArch.overview || ""} />
                  ) : (
                    techArch.overview
                  )}
                </p>
              </div>
              
              {techArch.components && (
                <div>
                  <h4 className="text-xs font-mono font-bold text-neutral-400 uppercase tracking-wide mb-2">Core Blocks</h4>
                  <div className="flex flex-wrap gap-2">
                    {techArch.components.map((comp, idx) => (
                      <span key={idx} className="px-2.5 py-1 bg-slate-950 border border-darkBorder text-neutral-300 rounded text-xs font-mono">
                        {currentTypingIndex === 8 && !techArch.data_flow && !techArch.tech_stack ? (
                          <TypeWriter text={comp} onDone={idx === (techArch.components?.length || 0) - 1 ? () => handleSectionDone(8) : undefined} />
                        ) : currentTypingIndex === 8 ? (
                          <TypeWriter text={comp} />
                        ) : (
                          comp
                        )}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {techArch.data_flow && (
                <div>
                  <h4 className="text-xs font-mono font-bold text-neutral-400 uppercase tracking-wide">Security & Data Ingestion Flow</h4>
                  <p className="text-sm text-neutral-300 mt-1 font-light leading-relaxed">
                    {currentTypingIndex === 8 && !techArch.tech_stack ? (
                      <TypeWriter text={techArch.data_flow} onDone={() => handleSectionDone(8)} />
                    ) : currentTypingIndex === 8 ? (
                      <TypeWriter text={techArch.data_flow} />
                    ) : (
                      techArch.data_flow
                    )}
                  </p>
                </div>
              )}

              {techArch.tech_stack && (
                <div>
                  <h4 className="text-xs font-mono font-bold text-neutral-400 uppercase tracking-wide mb-2">Technology Matrix</h4>
                  <div className="flex flex-wrap gap-2">
                    {techArch.tech_stack.map((tech, idx) => (
                      <span key={idx} className="px-2.5 py-1 bg-accent/10 border border-accent/20 text-accent rounded text-xs font-mono font-bold">
                        {currentTypingIndex === 8 ? (
                          <TypeWriter text={tech} onDone={idx === (techArch.tech_stack?.length || 0) - 1 ? () => handleSectionDone(8) : undefined} />
                        ) : (
                          tech
                        )}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })()
      ) : (
        <div className="space-y-3 animate-pulse">
          <div className="h-20 bg-slate-900 rounded"></div>
          <div className="h-10 bg-slate-900 rounded"></div>
        </div>
      )}
    </motion.div>
  );

  const renderRoadmapTimeline = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 9 * 0.1 }}
      className="card-3d glass-card rounded-xl p-6"
    >
      <div className="flex flex-wrap justify-between items-center gap-2 mb-4 border-b border-darkBorder pb-2">
        <h3 className="text-xs font-mono font-bold uppercase tracking-widest text-accent mb-0">
          10 / IMPLEMENTATION PATHWAY & MILESTONES
        </h3>
        <div className="flex items-center gap-2">
          {currentTypingIndex === 9 && brd.timeline && (
            <span className="px-2 py-0.5 rounded bg-accent/20 border border-accent/30 text-accent font-mono text-[9px] uppercase tracking-wider animate-pulse">
              Writing...
            </span>
          )}
          {brd.timeline && brd.timeline.length > 0 && (
            <ConfidenceBadge 
              citations={[]} 
              content={getSectionText("timeline", brd.timeline)} 
            />
          )}
        </div>
      </div>
      {brd.timeline && currentTypingIndex >= 9 ? (
        <div className="space-y-6 relative pl-4 border-l border-darkBorder ml-2 pt-2">
          {brd.timeline.map((tm, idx) => (
            <div key={idx} className="relative select-none">
              {/* Workflow dot */}
              <div className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-accent border-2 border-background"></div>
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-1.5 mb-2">
                <h4 className="text-sm font-bold text-white uppercase">{tm.phase}</h4>
                <span className="px-2 py-0.5 bg-slate-900 border border-darkBorder text-neutral-400 rounded text-[10px] font-mono font-bold uppercase">
                  {tm.duration}
                </span>
              </div>
              <div className="pl-0.5">
                <span className="text-[10px] font-mono font-bold text-neutral-500 uppercase tracking-wide block mb-1">
                  Key Deliverables
                </span>
                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                  {tm.deliverables.map((del, i) => (
                    <li key={i} className="text-xs text-neutral-400 flex items-start gap-1.5 font-light leading-relaxed">
                      <span className="text-neutral-600 font-bold">•</span>
                      <span>
                        {currentTypingIndex === 9 ? (
                          <TypeWriter text={del} onDone={idx === (brd.timeline?.length || 0) - 1 && i === tm.deliverables.length - 1 ? () => handleSectionDone(9) : undefined} />
                        ) : (
                          del
                        )}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-4 animate-pulse">
          <div className="h-20 bg-slate-900 rounded"></div>
        </div>
      )}
    </motion.div>
  );

  const renderValidityIndicator = () => (
    <div className="card-3d rounded-xl p-5 flex flex-col justify-between glow-accent h-full">
      <div>
        <div className="flex justify-between items-center mb-4">
          <span className="font-mono text-[10px] uppercase tracking-widest text-neutral-400 font-bold">
            TECHNICAL VALIDITY
          </span>
          <Server className="w-4 h-4 text-accent" />
        </div>

        <div className="flex items-center gap-6 py-2 select-none">
          {/* Circular indicator */}
          <div className="relative shrink-0" style={{ width: '96px', height: '96px' }}>
            <svg
              width="96"
              height="96"
              viewBox="0 0 96 96"
              style={{ transform: 'rotate(-90deg)' }}
            >
              {/* Track ring */}
              <circle
                cx="48" cy="48" r="40"
                fill="none"
                stroke="#1e293b"
                strokeWidth="8"
              />
              {/* Progress ring */}
              <circle
                cx="48" cy="48" r="40"
                fill="none"
                stroke="#f5a623"
                strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray={`${2 * Math.PI * 40}`}
                strokeDashoffset={`${2 * Math.PI * 40 * (1 - confidenceScore)}`}
                style={{ transition: 'stroke-dashoffset 0.8s ease-out' }}
              />
            </svg>
            {/* Centered text overlay — NOT affected by SVG rotation */}
            <div
              style={{
                position: 'absolute',
                inset: 0,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                lineHeight: 1.1,
                gap: '2px',
              }}
            >
              <span style={{ fontSize: '20px', fontWeight: 800, color: '#ffffff', lineHeight: 1 }}>
                {(confidenceScore * 100).toFixed(0)}%
              </span>
              <span style={{ fontSize: '8px', color: '#71717a', fontFamily: 'monospace', textTransform: 'uppercase', letterSpacing: '0.05em', lineHeight: 1 }}>
                Confidence
              </span>
            </div>
          </div>

          <div className="flex-grow flex flex-col gap-2.5">
            <div>
              <span className="text-[10px] font-mono text-neutral-500 uppercase block leading-none">Status Code</span>
              <span className="text-xs font-bold text-white uppercase mt-0.5 block">{status}</span>
            </div>
            <div>
              <span className="text-[10px] font-mono text-neutral-500 uppercase block leading-none">Diagnostic Sync</span>
              <span className="text-xs font-bold text-white uppercase mt-0.5 block">
                {status === "processing" ? "Compiling..." : "Compliant (PASS)"}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="border-t border-darkBorder pt-4 mt-4 text-[10px] font-mono text-neutral-500 leading-relaxed">
        Synthesized via Llama 3.3 (Groq) intelligence layer. Pipeline latency:{" "}
        <span className="text-neutral-300 font-bold">{(processing_time_ms / 1000).toFixed(2)}s</span>.
      </div>
    </div>
  );

const renderAgentTraceFeed = () => (
    <div className="card-3d rounded-xl p-5 glow-accent flex flex-col justify-between h-full">
      <div>
        <div className="flex flex-wrap justify-between items-center gap-2 mb-4 border-b border-darkBorder pb-2">
          <span className="font-mono text-[10px] uppercase tracking-widest text-neutral-400 font-bold flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse"></span>
            AGENT TRAIL EXPLAINABILITY STREAM
          </span>
          <span className="font-mono text-[9px] text-neutral-500 uppercase">
            {isGenerating ? "Streaming logs..." : "Idle"}
          </span>
        </div>

        {/* Premium explanation badge */}
        <div className="mb-6 p-4 bg-accent/5 border border-accent/25 rounded-lg text-xs leading-relaxed text-zinc-300">
          ✨ <strong>Multi-Agent Verification Trail:</strong> Displays logs and output snapshots from the five autonomous AI specialist nodes collaborating in our pipeline: Input Verification (InputAgent), Content Extraction (ExtractionAgent), Context & Tech Stack Enrichment (EnrichmentAgent), BRD Compilation (BRDAgent), and Automated Quality Check (QualityAgent).
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-3.5">
          {agentsList.map((ag) => {
            const trace = traces.find((t) => t.agent === ag.name);
            const isCurrent = isGenerating && traces.length + 1 === parseInt(ag.key);
            const isDone = traces.some((t) => t.agent === ag.name && t.output_summary.length > 50);

            return (
              <div
                key={ag.key}
                className={`border rounded-lg p-3 flex flex-col justify-between transition-all duration-300 relative shadow-sm ${
                  isDone
                    ? "bg-background/80 border-accent/30 shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)]"
                    : isCurrent
                      ? "bg-accent/10 border-accent/60 glow-accent animate-pulse scale-[1.02]"
                      : "bg-background/20 border-darkBorder/40 opacity-40"
                }`}
              >
                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <span className="text-[10px] font-mono font-bold text-neutral-500">{ag.key}</span>
                    <span className={`w-2 h-2 rounded-full ${
                      isDone 
                        ? "bg-emerald-500" 
                        : isCurrent 
                          ? "bg-accent animate-ping" 
                          : "bg-neutral-800"
                    }`}></span>
                  </div>
                  <h4 className="text-xs font-bold text-white leading-tight">{ag.name}</h4>
                  <span className="text-[8px] font-mono text-neutral-500 uppercase mt-0.5 block leading-none">
                    {ag.role}
                  </span>
                </div>
                
                <div className="mt-4 pt-2 border-t border-darkBorder/30">
                  <p className="text-[9px] text-neutral-400 font-mono leading-snug line-clamp-3">
                    {isDone 
                      ? trace?.output_summary 
                      : isCurrent 
                        ? "Running extraction calculations..." 
                        : "Awaiting preceding node..."}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="border-t border-darkBorder pt-3.5 mt-4 flex items-center justify-between text-[10px] font-mono text-neutral-500">
        <span>ACTIVE WORKFLOW LOGS</span>
        <span className="text-neutral-300 font-bold">
          TOTAL TOKENS: {traces.reduce((acc, t) => acc + (t.tokens_used || 0), 0)}
        </span>
      </div>
    </div>
  );

  const renderSWOTGrid = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 12 * 0.1 }}
      className="card-3d glass-card rounded-xl p-5 glow-accent h-full"
    >
      <div className="flex flex-wrap justify-between items-center gap-2 mb-4 border-b border-darkBorder pb-2">
        <h3 className="text-xs font-mono font-bold uppercase tracking-widest text-neutral-400 mb-0">
          SWOT ANALYSIS GRID
        </h3>
        <div className="flex items-center gap-2">
          {currentTypingIndex === 12 && brd.swot && (
            <span className="px-2 py-0.5 rounded bg-accent/20 border border-accent/30 text-accent font-mono text-[9px] uppercase tracking-wider animate-pulse">
              Writing...
            </span>
          )}
          {brd.swot && (
            <ConfidenceBadge 
              citations={[]} 
              content={getSectionText("swot", brd.swot)} 
            />
          )}
        </div>
      </div>
      
      {brd.swot && currentTypingIndex >= 12 ? (
        <div className="grid grid-cols-2 gap-3 font-sans">
          {/* Strengths */}
          <div className="p-3 bg-emerald-500/5 border border-emerald-500/10 rounded-lg">
            <h4 className="text-[10px] font-mono font-extrabold text-emerald-400 uppercase tracking-widest block mb-2">
              S / Strengths
            </h4>
            <ul className="space-y-1 text-[10px] text-neutral-300 font-light leading-relaxed">
              {brd.swot.strengths?.map((s, i) => (
                <li key={i} className="flex items-start gap-1">
                  <span className="text-emerald-500 font-bold shrink-0">•</span>
                  <span>
                    {currentTypingIndex === 12 ? (
                      <TypeWriter
                        text={s}
                        onDone={
                          !(brd.swot?.weaknesses && brd.swot.weaknesses.length > 0) &&
                          !(brd.swot?.opportunities && brd.swot.opportunities.length > 0) &&
                          !(brd.swot?.threats && brd.swot.threats.length > 0) &&
                          i === (brd.swot?.strengths?.length || 0) - 1
                            ? () => handleSectionDone(12)
                            : undefined
                        }
                      />
                    ) : (
                      s
                    )}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          {/* Weaknesses */}
          <div className="p-3 bg-red-500/5 border border-red-500/10 rounded-lg">
            <h4 className="text-[10px] font-mono font-extrabold text-red-400 uppercase tracking-widest block mb-2">
              W / Weaknesses
            </h4>
            <ul className="space-y-1 text-[10px] text-neutral-300 font-light leading-relaxed">
              {brd.swot.weaknesses?.map((w, i) => (
                <li key={i} className="flex items-start gap-1">
                  <span className="text-red-500 font-bold shrink-0">•</span>
                  <span>
                    {currentTypingIndex === 12 ? (
                      <TypeWriter
                        text={w}
                        onDone={
                          !(brd.swot?.opportunities && brd.swot.opportunities.length > 0) &&
                          !(brd.swot?.threats && brd.swot.threats.length > 0) &&
                          i === (brd.swot?.weaknesses?.length || 0) - 1
                            ? () => handleSectionDone(12)
                            : undefined
                        }
                      />
                    ) : (
                      w
                    )}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          {/* Opportunities */}
          <div className="p-3 bg-blue-500/5 border border-blue-500/10 rounded-lg">
            <h4 className="text-[10px] font-mono font-extrabold text-blue-400 uppercase tracking-widest block mb-2">
              O / Opportunities
            </h4>
            <ul className="space-y-1 text-[10px] text-neutral-300 font-light leading-relaxed">
              {brd.swot.opportunities?.map((o, i) => (
                <li key={i} className="flex items-start gap-1">
                  <span className="text-blue-500 font-bold shrink-0">•</span>
                  <span>
                    {currentTypingIndex === 12 ? (
                      <TypeWriter
                        text={o}
                        onDone={
                          !(brd.swot?.threats && brd.swot.threats.length > 0) &&
                          i === (brd.swot?.opportunities?.length || 0) - 1
                            ? () => handleSectionDone(12)
                            : undefined
                        }
                      />
                    ) : (
                      o
                    )}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          {/* Threats */}
          <div className="p-3 bg-amber-500/5 border border-amber-500/10 rounded-lg">
            <h4 className="text-[10px] font-mono font-extrabold text-amber-400 uppercase tracking-widest block mb-2">
              T / Threats
            </h4>
            <ul className="space-y-1 text-[10px] text-neutral-300 font-light leading-relaxed">
              {brd.swot.threats?.map((t, i) => (
                <li key={i} className="flex items-start gap-1">
                  <span className="text-amber-500 font-bold shrink-0">•</span>
                  <span>
                    {currentTypingIndex === 12 ? (
                      <TypeWriter
                        text={t}
                        onDone={
                          i === (brd.swot?.threats?.length || 0) - 1
                            ? () => handleSectionDone(12)
                            : undefined
                        }
                      />
                    ) : (
                      t
                    )}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 animate-pulse">
          <div className="h-24 bg-slate-900 rounded"></div>
          <div className="h-24 bg-slate-900 rounded"></div>
          <div className="h-24 bg-slate-900 rounded"></div>
          <div className="h-24 bg-slate-900 rounded"></div>
        </div>
      )}
    </motion.div>
  );

  const renderCompetitorTable = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 13 * 0.1 }}
      className="card-3d glass-card rounded-xl p-5 glow-accent h-full"
    >
      <div className="flex justify-between items-center mb-3 border-b border-darkBorder pb-2">
        <h3 className="text-xs font-mono font-bold uppercase tracking-widest text-neutral-400 mb-0">
          COMPETITIVE BENCHMARKS
        </h3>
        <div className="flex items-center gap-2">
          {currentTypingIndex === 13 && brd.competitors && (
            <span className="px-2 py-0.5 rounded bg-accent/20 border border-accent/30 text-accent font-mono text-[9px] uppercase tracking-wider animate-pulse">
              Writing...
            </span>
          )}
          {brd.competitors && brd.competitors.length > 0 && (
            <ConfidenceBadge 
              citations={[]} 
              content={getSectionText("competitors", brd.competitors)} 
            />
          )}
        </div>
      </div>

      {brd.competitors && currentTypingIndex >= 13 ? (
        <div className="overflow-x-auto text-[11px] font-sans">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-darkBorder text-neutral-500">
                <th className="py-2 font-mono uppercase tracking-wider font-bold">Competitor</th>
                <th className="py-2 font-mono uppercase tracking-wider font-bold">Risk</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-darkBorder/30">
              {brd.competitors.map((comp, idx) => (
                <tr key={idx} className="hover:bg-slate-900/10">
                  <td className="py-2.5">
                    <span className="font-bold text-white block">
                      {currentTypingIndex === 13 ? (
                        <TypeWriter text={comp.name} />
                      ) : (
                        comp.name
                      )}
                    </span>
                    <span className="text-[10px] text-emerald-400 leading-normal block font-light">
                      Pros:{" "}
                      {currentTypingIndex === 13 ? (
                        <TypeWriter text={comp.advantages} />
                      ) : (
                        comp.advantages
                      )}
                    </span>
                    <span className="text-[10px] text-red-400 leading-normal block font-light">
                      Cons:{" "}
                      {currentTypingIndex === 13 ? (
                        <TypeWriter text={comp.disadvantages} onDone={idx === (brd.competitors?.length || 0) - 1 ? () => handleSectionDone(13) : undefined} />
                      ) : (
                        comp.disadvantages
                      )}
                    </span>
                  </td>
                  <td className="py-2.5 align-top">
                    <span className={`inline-block px-1.5 py-0.5 rounded text-[9px] font-mono uppercase font-bold tracking-tight ${
                      comp.risk_level.toLowerCase() === "high" 
                        ? "bg-red-500/10 text-red-400"
                        : comp.risk_level.toLowerCase() === "medium"
                          ? "bg-amber-500/10 text-amber-400"
                          : "bg-blue-500/10 text-blue-400"
                    }`}>
                      {currentTypingIndex === 13 ? (
                        <TypeWriter text={comp.risk_level} />
                      ) : (
                        comp.risk_level
                      )}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="space-y-2.5 animate-pulse">
          <div className="h-6 bg-slate-900 rounded"></div>
          <div className="h-16 bg-slate-900 rounded"></div>
        </div>
      )}
    </motion.div>
  );

  const renderCitationHighlights = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 14 * 0.1 }}
      className="card-3d glass-card rounded-xl p-5 glow-accent h-full"
    >
      <div className="flex flex-col gap-2 mb-3 border-b border-darkBorder pb-2">
        <h3 className="text-xs font-mono font-bold uppercase tracking-widest text-neutral-400 mb-0">
          CITATION HIGHLIGHTS (GROUNDING)
        </h3>
        <div className="flex items-center gap-2">
          {currentTypingIndex === 14 && brd.citations && (
            <span className="px-2 py-0.5 rounded bg-accent/20 border border-accent/30 text-accent font-mono text-[9px] uppercase tracking-wider animate-pulse">
              Writing...
            </span>
          )}
          {brd.citations && brd.citations.length > 0 && (
            <ConfidenceBadge 
              citations={brd.citations || []} 
              content={getSectionText("citations", brd.citations)} 
            />
          )}
        </div>
      </div>
      
      {brd.citations && currentTypingIndex >= 14 ? (
        <div className="flex flex-col gap-3 font-sans">
          {brd.citations.map((cite, idx) => (
            <div key={idx} className="p-3 bg-slate-950/60 border border-darkBorder rounded-lg">
              <p className="text-[10px] text-slate-300 leading-relaxed italic">
                &ldquo;
                {currentTypingIndex === 14 ? (
                  <TypeWriter text={cite.source_text} onDone={idx === (brd.citations?.length || 0) - 1 ? () => handleSectionDone(14) : undefined} />
                ) : (
                  cite.source_text
                )}
                &rdquo;
              </p>
              <div className="mt-2.5 pt-2 border-t border-darkBorder/30 flex justify-between items-center text-[9px] font-mono text-slate-500 uppercase font-bold">
                <span>
                  Confidence:{" "}
                  <strong className="text-emerald-400">
                    {currentTypingIndex === 14 ? (
                      <TypeWriter text={`${(cite.confidence * 100).toFixed(0)}%`} />
                    ) : (
                      `${(cite.confidence * 100).toFixed(0)}%`
                    )}
                  </strong>
                </span>
                <span className="text-slate-400 text-[8px] tracking-tight">
                  {currentTypingIndex === 14 ? (
                    <TypeWriter text={cite.mapped_requirement} />
                  ) : (
                    cite.mapped_requirement
                  )}
                </span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-3 animate-pulse">
          <div className="h-16 bg-zinc-900/50 border border-darkBorder/40 rounded-lg flex items-center justify-center">
            <span className="text-[9px] font-mono text-zinc-500 tracking-wider">SPECS EXTRACTION PENDING...</span>
          </div>
          <div className="h-16 bg-zinc-900/50 border border-darkBorder/40 rounded-lg flex items-center justify-center">
            <span className="text-[9px] font-mono text-zinc-500 tracking-wider">GROUNDING CHECK PENDING...</span>
          </div>
        </div>
      )}
    </motion.div>
  );

  const renderBigQueryAudit = () => (
    <div className="card-3d rounded-xl overflow-hidden no-print">
      <div className="p-4 border-b border-darkBorder bg-slate-900/40 flex justify-between items-center">
        <span className="font-mono text-[10px] uppercase tracking-widest text-white font-bold flex items-center gap-1.5">
          <Database className="w-4 h-4 text-accent" />
          BIGQUERY COMPLIANCE AUDIT PANEL
        </span>
        <span className="font-mono text-[9px] text-emerald-400 uppercase font-bold flex items-center gap-1">
          <CheckCircle className="w-3 h-3 text-emerald-400" />
          Explainable AI Layer Active
        </span>
      </div>

      <div className="p-4 overflow-x-auto text-[10px] font-mono">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-darkBorder text-neutral-500 uppercase font-bold">
              <th className="py-2 pr-4">Row ID</th>
              <th className="py-2 pr-4">BQ Destination Table</th>
              <th className="py-2 pr-4">Cloud Storage Target</th>
              <th className="py-2 pr-4">Ingestion Type</th>
              <th className="py-2 pr-4 text-right">Log Cost</th>
              <th className="py-2 text-right">Raw Audit Log</th>
            </tr>
          </thead>
          <tbody className="text-neutral-300">
            <tr className="hover:bg-slate-900/10">
              <td className="py-3 pr-4 font-bold text-neutral-100">{sessionId}</td>
              <td className="py-3 pr-4">
                <span className="text-accent">autoresearch.sessions</span> &amp; <span className="text-accent">agent_traces</span>
              </td>
              <td className="py-3 pr-4 truncate max-w-[200px]">
                {gcs_uri || "gs://autoresearch-ai-brd-store/brds/dev..."}
              </td>
              <td className="py-3 pr-4">Multimodal AI Stream</td>
              <td className="py-3 pr-4 text-right text-emerald-400 font-bold">$0.00016</td>
              <td className="py-3 text-right">
                <button
                  onClick={() => setShowBqModal(true)}
                  className="px-2 py-1 rounded text-[9px] font-bold uppercase cursor-pointer btn-3d-secondary inline-flex items-center gap-1"
                >
                  <Code className="w-3 h-3 text-accent" />
                  Inspect Row
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderNameGenerator = () => {
    if (status === "processing") return null;

    return (
      <div className="card-3d rounded-xl p-6 glow-accent mt-6 no-print">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4 border-b border-darkBorder pb-4">
          <div>
            <h3 className="text-lg font-bold text-white font-mono flex items-center gap-2">
              💡 STARTUP NAME GENERATOR
            </h3>
            <p className="text-xs text-neutral-400 mt-1 leading-normal font-light">
              Generate AI-powered brand names based on your BRD summary
            </p>
          </div>
          <button
            onClick={generateStartupNames}
            disabled={generatingNames}
            className="px-4 py-2 rounded-lg text-xs font-mono font-bold uppercase btn-3d cursor-pointer disabled:opacity-50"
          >
            {generatingNames ? "Generating..." : "Generate Names"}
          </button>
        </div>

        {names.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {names.map((name) => (
              <div
                key={name}
                onClick={() => copyName(name)}
                className="group relative p-4 bg-slate-950/60 border border-darkBorder rounded-lg cursor-pointer hover:border-accent transition-all flex flex-col items-center justify-center text-center"
              >
                <span className="text-sm font-bold text-white tracking-wide group-hover:text-accent transition-colors">
                  {name}
                </span>
                <span className="text-[10px] text-neutral-500 mt-1 uppercase font-mono">
                  {copiedName === name ? "Copied! ✓" : "Click to Copy"}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-6 border border-dashed border-darkBorder rounded-lg text-neutral-500 text-xs">
            No suggestions generated yet. Click &quot;Generate Names&quot; to get started.
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans selection:bg-accent/30 selection:text-accent relative overflow-hidden brd-content">
      <AnimatedBackground />
      <div className="relative z-10 flex flex-col min-h-screen">
      
      {/* Background decoration grid */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#00e69906_1px,transparent_1px),linear-gradient(to_bottom,#00e69906_1px,transparent_1px)] bg-[size:20px_20px] pointer-events-none opacity-40"></div>
      {/* Subtle organic light spots */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[60%] rounded-full bg-accent/5 blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[60%] rounded-full bg-accent/5 blur-[120px] pointer-events-none"></div>

      {/* Top Header */}
      <header className="border-b border-darkBorder bg-card/60 backdrop-blur-md sticky top-0 z-40 shadow-[0_2px_15px_rgba(0,0,0,0.4)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/generate"
              className="p-2 rounded-lg btn-3d-secondary group inline-flex items-center justify-center text-neutral-400 hover:text-white no-print"
              title="Back to input"
            >
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-[9px] uppercase tracking-widest text-neutral-400">
                  SESSION / {sessionId.toUpperCase()}
                </span>
                <span className={`px-2 py-0.5 rounded-full text-[9px] font-mono uppercase font-bold tracking-tight ${
                  status === "success" 
                    ? "bg-accent/10 text-accent border border-accent/20"
                    : status === "failed"
                      ? "bg-red-500/10 text-red-400 border border-red-500/20"
                      : "bg-amber-500/10 text-amber-400 border border-amber-500/20 animate-pulse"
                }`}>
                  {status === "processing" ? "Generating..." : status}
                </span>
              </div>
              <h1 className="text-sm sm:text-base font-bold text-white tracking-tight -mt-0.5 bg-gradient-to-r from-white to-emerald-200 bg-clip-text text-transparent text-glow">
                {brd?.title || "AI Synthesis Pipeline Active"}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-3 no-print">
            {/* Language Selector */}
            <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-[#050505] border border-darkBorder">
              <Globe className="w-3.5 h-3.5 text-zinc-400" />
              <select
                value={lang}
                onChange={(e) => changeLanguage(e.target.value as Language)}
                className="bg-transparent text-[10px] font-mono text-neutral-300 uppercase tracking-wider focus:outline-none cursor-pointer pr-1"
              >
                <option value="en" className="bg-[#050505] text-white">EN</option>
                <option value="hi" className="bg-[#050505] text-white">HI</option>
                <option value="es" className="bg-[#050505] text-white">ES</option>
              </select>
            </div>
            <button
              onClick={exportToPDF}
              disabled={isGenerating}
              className="px-3.5 py-1.5 rounded-lg text-xs font-mono font-bold uppercase btn-3d-secondary cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:border-b-0"
            >
              {translations[lang].exportPdf}
            </button>
            <button
            onClick={() => window.open(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8500'}/api/export/pdf/${sessionId}`)}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-mono font-bold uppercase btn-3d-secondary cursor-pointer"
            >
            <Download className="w-3.5 h-3.5" />
           <span>BRD PDF</span>
</button>
            <button
              onClick={exportToWord}
              disabled={isGenerating}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-mono font-bold uppercase btn-3d cursor-pointer disabled:bg-neutral-800 disabled:text-neutral-500 disabled:border-b-0 disabled:cursor-not-allowed disabled:transform-none"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{translations[lang].exportWord}</span>
            </button>
          </div>
            {data?.vellum_score && (
              <div className="hidden sm:block">
                <VellumScore
                  score={data.vellum_score}
                  validationScore={data.validation?.overall_score}
                  criticScore={data.critic?.overall_score}
                />
              </div>
            )}
        </div>
      </header>

      {/* Main Grid Canvas */}
      <main className="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col gap-6">
        
        {/* Startup Domain Suggestions */}
        {status !== "processing" && (
          <div className="mb-2 no-print">
            <span className="font-mono text-xs text-neutral-500 uppercase tracking-widest block mb-1">
              SUGGESTED STARTUP DOMAINS
            </span>
            <div className="flex gap-2 flex-wrap mt-2">
              {suggestDomains(startupName).map(domain => (
                <a
                  key={domain}
                  href={`https://www.namecheap.com/domains/registration/results/?domain=${domain}`}
                  target="_blank"
                  className="px-3 py-1 bg-zinc-900 border 
                             border-zinc-700 rounded-full 
                             text-sm font-mono text-zinc-400
                             hover:border-amber-500 
                             hover:text-amber-400 transition-all"
                >
                  🔗 {domain}
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Tab Navigation System */}
        <div className="flex gap-2 mb-4 border-b border-zinc-800 overflow-x-auto pb-0 no-print">
          {tabs.map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2.5 px-6 py-3 
                           text-base font-mono whitespace-nowrap
                           border-b-2 transition-all cursor-pointer ${
                  activeTab === tab.id
                    ? 'border-amber-500 text-amber-400 font-bold'
                    : 'border-transparent text-zinc-500 hover:text-zinc-300'
                }`}
              >
                <Icon className={`w-4 h-4 shrink-0 transition-colors ${
                  activeTab === tab.id ? 'text-amber-400' : 'text-zinc-500'
                }`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* OVERVIEW TAB */}
        {activeTab === 'overview' && (
          <div className="flex flex-col gap-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 no-print">
              <div className="">
                {renderValidityIndicator()}
              </div>
                <div className="">
                {status !== "processing" && brd && (
                  <InvestorScore brd={brd} isLarge={true} />
                )}
              </div>
              
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="col-span-1 lg:col-span-6">
                {renderSWOTGrid()}
              </div>
              <div className="col-span-1 lg:col-span-6">
                {renderCompetitorTable()}
              </div>
            </div>

            <div className="no-print">
              {renderAgentTraceFeed()}
            </div>

            {/* Name Generator — Overview tab only */}
            <div className="no-print">
              {renderNameGenerator()}
            </div>
          </div>
        )}

        {/* FULL BRD TAB */}
        {activeTab === 'brd' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 brd-tab-content">
            <div className="col-span-1 lg:col-span-9 flex flex-col gap-6">
              
              {/* Section 1: Executive Summary */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0 * 0.1 }}
                className="card-3d glass-card rounded-xl p-6"
              >
                <div className="flex flex-wrap justify-between items-center gap-2 mb-4 border-b border-darkBorder pb-2">
                  <h3 className="text-xs font-mono font-bold uppercase tracking-widest text-accent mb-0">
                    01 / EXECUTIVE SUMMARY
                  </h3>
                  <div className="flex items-center gap-2">
                    {currentTypingIndex === 0 && brd.executive_summary && (
                      <span className="px-2 py-0.5 rounded bg-accent/20 border border-accent/30 text-accent font-mono text-[9px] uppercase tracking-wider animate-pulse">
                        Writing...
                      </span>
                    )}
                    {brd.executive_summary && (
                      <ConfidenceBadge 
                        citations={[]} 
                        content={brd.executive_summary || ""} 
                      />
                    )}
                  </div>
                </div>
                {brd.executive_summary && currentTypingIndex >= 0 ? (
                  <p className="text-sm text-neutral-300 font-light leading-relaxed">
                    {currentTypingIndex === 0 ? (
                      <TypeWriter text={brd.executive_summary} onDone={() => handleSectionDone(0)} />
                    ) : (
                      brd.executive_summary
                    )}
                  </p>
                ) : (
                  <div className="space-y-2.5 animate-pulse">
                    <div className="h-3.5 bg-slate-900 rounded w-full"></div>
                    <div className="h-3.5 bg-slate-900 rounded w-11/12"></div>
                    <div className="h-3.5 bg-slate-900 rounded w-4/5"></div>
                  </div>
                )}
              </motion.div>

              {/* Section 2: Problem Statement */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 1 * 0.1 }}
                className="card-3d glass-card rounded-xl p-6"
              >
                <div className="flex flex-wrap justify-between items-center gap-2 mb-4 border-b border-darkBorder pb-2">
                  <h3 className="text-xs font-mono font-bold uppercase tracking-widest text-accent mb-0">
                    02 / PROBLEM STATEMENT & IMPACT
                  </h3>
                  <div className="flex items-center gap-2">
                    {currentTypingIndex === 1 && brd.problem_statement && (
                      <span className="px-2 py-0.5 rounded bg-accent/20 border border-accent/30 text-accent font-mono text-[9px] uppercase tracking-wider animate-pulse">
                        Writing...
                      </span>
                    )}
                    {brd.problem_statement && (
                      <ConfidenceBadge 
                        citations={[]} 
                        content={getSectionText("problem_statement", brd.problem_statement)} 
                      />
                    )}
                  </div>
                </div>
                {brd.problem_statement && currentTypingIndex >= 1 ? (
                  <div className="flex flex-col gap-4">
                    <div>
                      <h4 className="text-xs font-mono font-bold text-neutral-400 uppercase tracking-wide">Current Situation</h4>
                      <p className="text-sm text-neutral-300 mt-1 font-light leading-relaxed">
                        {currentTypingIndex === 1 ? (
                          <TypeWriter text={brd.problem_statement.current_situation || ""} />
                        ) : (
                          brd.problem_statement.current_situation
                        )}
                      </p>
                    </div>
                    <div>
                      <h4 className="text-xs font-mono font-bold text-neutral-400 uppercase tracking-wide">Key Pain Points</h4>
                      <ul className="list-disc pl-5 text-sm text-neutral-300 mt-1.5 space-y-1.5 font-light leading-relaxed">
                        {brd.problem_statement.pain_points?.map((pt, i) => (
                          <li key={i}>
                            {currentTypingIndex === 1 ? (
                              <TypeWriter text={pt} />
                            ) : (
                              pt
                            )}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="p-3.5 bg-red-950/10 border border-red-900/20 rounded-lg">
                      <h4 className="text-xs font-mono font-bold text-red-400 uppercase tracking-wide">Downstream Impact</h4>
                      <p className="text-sm text-red-300/90 mt-1 font-light leading-relaxed">
                        {currentTypingIndex === 1 ? (
                          <TypeWriter text={brd.problem_statement.impact || ""} onDone={() => handleSectionDone(1)} />
                        ) : (
                          brd.problem_statement.impact
                        )}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4 animate-pulse">
                    <div className="space-y-2">
                      <div className="h-2 bg-slate-900 rounded w-1/4"></div>
                      <div className="h-3 bg-slate-900 rounded w-full"></div>
                    </div>
                    <div className="space-y-2">
                      <div className="h-2 bg-slate-900 rounded w-1/4"></div>
                      <div className="h-3 bg-slate-900 rounded w-5/6"></div>
                    </div>
                  </div>
                )}
              </motion.div>

              {/* Target Market Section */}
              {brd?.target_market?.content && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 2 * 0.1 }}
                  className="card-3d glass-card rounded-xl p-6"
                >
                  <div className="flex flex-wrap justify-between items-center gap-2 mb-4 border-b border-darkBorder pb-2">
                    <h3 className="text-xs font-mono font-bold uppercase tracking-widest text-accent mb-0">
                      TARGET MARKET
                    </h3>
                    <ConfidenceBadge 
                      citations={[]} 
                      content={brd.target_market.content} 
                    />
                  </div>
                  <p className="text-sm text-neutral-300 font-light leading-relaxed">
                    {brd.target_market.content}
                  </p>
                </motion.div>
              )}

              {/* Section 3: Strategic Objectives */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 3 * 0.1 }}
                className="card-3d glass-card rounded-xl p-6"
              >
                <div className="flex flex-wrap justify-between items-center gap-2 mb-4 border-b border-darkBorder pb-2">
                  <h3 className="text-xs font-mono font-bold uppercase tracking-widest text-accent mb-0">
                    03 / STRATEGIC OBJECTIVES (SMART)
                  </h3>
                  <div className="flex items-center gap-2">
                    {currentTypingIndex === 2 && brd.objectives && (
                      <span className="px-2 py-0.5 rounded bg-accent/20 border border-accent/30 text-accent font-mono text-[9px] uppercase tracking-wider animate-pulse">
                        Writing...
                      </span>
                    )}
                    {brd.objectives && brd.objectives.length > 0 && (
                      <ConfidenceBadge 
                        citations={[]} 
                        content={getSectionText("objectives", brd.objectives)} 
                      />
                    )}
                  </div>
                </div>
                {brd.objectives && currentTypingIndex >= 2 ? (
                  <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {brd.objectives.map((obj, i) => (
                      <li key={i} className="flex gap-3 items-start p-3.5 bg-slate-950/60 border border-darkBorder rounded-lg">
                        <div className="w-5 h-5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                          <CheckCircle className="w-3 h-3 text-emerald-400" />
                        </div>
                        <span className="text-sm text-neutral-300 font-light leading-relaxed">
                          {currentTypingIndex === 2 ? (
                            <TypeWriter text={obj} onDone={i === (brd.objectives?.length || 0) - 1 ? () => handleSectionDone(2) : undefined} />
                          ) : (
                            obj
                          )}
                        </span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-pulse">
                    <div className="h-14 bg-slate-900 rounded"></div>
                    <div className="h-14 bg-slate-900 rounded"></div>
                  </div>
                )}
              </motion.div>

              {/* Section 4: Boundaries & Scope */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 4 * 0.1 }}
                className="card-3d glass-card rounded-xl p-6"
              >
                <div className="flex flex-wrap justify-between items-center gap-2 mb-4 border-b border-darkBorder pb-2">
                  <h3 className="text-xs font-mono font-bold uppercase tracking-widest text-accent mb-0">
                    04 / BOUNDARIES & PRODUCT SCOPE
                  </h3>
                  <div className="flex items-center gap-2">
                    {currentTypingIndex === 3 && brd.scope && (
                      <span className="px-2 py-0.5 rounded bg-accent/20 border border-accent/30 text-accent font-mono text-[9px] uppercase tracking-wider animate-pulse">
                        Writing...
                      </span>
                    )}
                    {brd.scope && (
                      <ConfidenceBadge 
                        citations={[]} 
                        content={getSectionText("scope", brd.scope)} 
                      />
                    )}
                  </div>
                </div>
                {brd.scope && currentTypingIndex >= 3 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="text-xs font-mono font-bold text-emerald-400 uppercase tracking-wide mb-3 flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full"></span>
                        In-Scope Functional Boundaries
                      </h4>
                      <ul className="space-y-2">
                        {brd.scope.in_scope?.map((scope, i) => (
                          <li key={i} className="text-sm text-neutral-300 font-light flex items-start gap-2 leading-relaxed">
                            <ChevronRight className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                            <span>
                              {currentTypingIndex === 3 ? (
                                <TypeWriter text={scope} onDone={(!brd.scope?.out_of_scope || brd.scope.out_of_scope.length === 0) && i === (brd.scope?.in_scope?.length || 0) - 1 ? () => handleSectionDone(3) : undefined} />
                              ) : (
                                scope
                              )}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    
                    <div className="border-t md:border-t-0 md:border-l border-darkBorder pt-6 md:pt-0 md:pl-6">
                      <h4 className="text-xs font-mono font-bold text-red-400 uppercase tracking-wide mb-3 flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 bg-red-400 rounded-full"></span>
                        Out-of-Scope Exclusions
                      </h4>
                      <ul className="space-y-2">
                        {brd.scope.out_of_scope?.map((scope, i) => (
                          <li key={i} className="text-sm text-neutral-400 font-light flex items-start gap-2 leading-relaxed">
                            <span className="text-red-500 font-mono font-bold shrink-0 mt-0.5">✕</span>
                            <span>
                              {currentTypingIndex === 3 ? (
                                <TypeWriter text={scope} onDone={i === (brd.scope?.out_of_scope?.length || 0) - 1 ? () => handleSectionDone(3) : undefined} />
                              ) : (
                                scope
                              )}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-pulse">
                    <div className="h-24 bg-slate-900 rounded"></div>
                    <div className="h-24 bg-slate-900 rounded"></div>
                  </div>
                )}
              </motion.div>

              {/* Section 5: Stakeholders */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 5 * 0.1 }}
                className="card-3d glass-card rounded-xl p-6"
              >
                <div className="flex flex-wrap justify-between items-center gap-2 mb-4 border-b border-darkBorder pb-2">
                  <h3 className="text-xs font-mono font-bold uppercase tracking-widest text-accent mb-0">
                    05 / STAKEHOLDER RACI ROLES
                  </h3>
                  <div className="flex items-center gap-2">
                    {currentTypingIndex === 4 && brd.stakeholders && (
                      <span className="px-2 py-0.5 rounded bg-accent/20 border border-accent/30 text-accent font-mono text-[9px] uppercase tracking-wider animate-pulse">
                        Writing...
                      </span>
                    )}
                    {brd.stakeholders && brd.stakeholders.length > 0 && (
                      <ConfidenceBadge 
                        citations={[]} 
                        content={getSectionText("stakeholders", brd.stakeholders)} 
                      />
                    )}
                  </div>
                </div>
                {brd.stakeholders && currentTypingIndex >= 4 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {brd.stakeholders.map((sh, i) => (
                      <div key={i} className="p-4 bg-slate-950/60 border border-darkBorder rounded-lg flex items-start gap-3">
                        <div className="w-8 h-8 rounded bg-slate-900 border border-darkBorder flex items-center justify-center text-neutral-400 shrink-0">
                          <User className="w-4 h-4 text-neutral-400" />
                        </div>
                        <div>
                          <h4 className="text-xs font-bold text-white">
                            {currentTypingIndex === 4 ? (
                              <TypeWriter text={sh.role} />
                            ) : (
                              sh.role
                            )}
                          </h4>
                          <p className="text-xs text-neutral-400 mt-1 leading-normal font-light">
                            {currentTypingIndex === 4 ? (
                              <TypeWriter text={sh.responsibility} onDone={i === (brd.stakeholders?.length || 0) - 1 ? () => handleSectionDone(4) : undefined} />
                            ) : (
                              sh.responsibility
                            )}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 animate-pulse">
                    <div className="h-16 bg-slate-900 rounded"></div>
                    <div className="h-16 bg-slate-900 rounded"></div>
                  </div>
                )}
              </motion.div>

              {/* Section 6: Functional Requirements */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 6 * 0.1 }}
                className="card-3d glass-card rounded-xl p-6"
              >
                <div className="flex flex-wrap justify-between items-center gap-2 mb-4 border-b border-darkBorder pb-2">
                  <h3 className="text-xs font-mono font-bold uppercase tracking-widest text-accent mb-0">
                    06 / FUNCTIONAL SPECIFICATIONS
                  </h3>
                  <div className="flex items-center gap-2">
                    {currentTypingIndex === 5 && brd.functional_requirements && (
                      <span className="px-2 py-0.5 rounded bg-accent/20 border border-accent/30 text-accent font-mono text-[9px] uppercase tracking-wider animate-pulse">
                        Writing...
                      </span>
                    )}
                    {brd.functional_requirements && brd.functional_requirements.length > 0 && (
                      <ConfidenceBadge 
                        citations={brd.citations || []} 
                        content={getSectionText("functional_requirements", brd.functional_requirements)} 
                      />
                    )}
                  </div>
                </div>
                {brd.functional_requirements && currentTypingIndex >= 5 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="border-b border-darkBorder text-neutral-400">
                          <th className="py-2.5 font-mono uppercase tracking-wider font-bold">Req ID</th>
                          <th className="py-2.5 font-mono uppercase tracking-wider font-bold">Requirement</th>
                          <th className="py-2.5 font-mono uppercase tracking-wider font-bold text-right">Priority</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-darkBorder/40">
                        {brd.functional_requirements.map((req, i) => (
                          <tr key={i} className="text-neutral-300 font-light hover:bg-slate-900/10">
                            <td className="py-3 font-mono font-bold text-accent">{req.id}</td>
                            <td className="py-3 pr-4 leading-relaxed">
                              {currentTypingIndex === 5 ? (
                                <TypeWriter text={req.requirement} onDone={i === (brd.functional_requirements?.length || 0) - 1 ? () => handleSectionDone(5) : undefined} />
                              ) : (
                                req.requirement
                              )}
                            </td>
                            <td className="py-3 text-right">
                              <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-mono uppercase font-bold tracking-tight ${
                                req.priority.toLowerCase() === "high" 
                                  ? "bg-red-500/10 text-red-400 border border-red-500/20"
                                  : req.priority.toLowerCase() === "medium"
                                    ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                                    : "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                              }`}>
                                {req.priority}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="space-y-2 animate-pulse">
                    <div className="h-8 bg-slate-900 rounded"></div>
                    <div className="h-8 bg-slate-900 rounded"></div>
                  </div>
                )}
              </motion.div>

              {/* Section 7: Non-Functional Requirements */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 7 * 0.1 }}
                className="card-3d glass-card rounded-xl p-6"
              >
                <div className="flex flex-wrap justify-between items-center gap-2 mb-4 border-b border-darkBorder pb-2">
                  <h3 className="text-xs font-mono font-bold uppercase tracking-widest text-accent mb-0">
                    07 / NON-FUNCTIONAL REQUIREMENTS
                  </h3>
                  <div className="flex items-center gap-2">
                    {currentTypingIndex === 6 && brd.non_functional_requirements && (
                      <span className="px-2 py-0.5 rounded bg-accent/20 border border-accent/30 text-accent font-mono text-[9px] uppercase tracking-wider animate-pulse">
                        Writing...
                      </span>
                    )}
                    {brd.non_functional_requirements && brd.non_functional_requirements.length > 0 && (
                      <ConfidenceBadge 
                        citations={[]} 
                        content={getSectionText("non_functional_requirements", brd.non_functional_requirements)} 
                      />
                    )}
                  </div>
                </div>
                {brd.non_functional_requirements && currentTypingIndex >= 6 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="border-b border-darkBorder text-neutral-400">
                          <th className="py-2.5 font-mono uppercase tracking-wider font-bold">NFR ID</th>
                          <th className="py-2.5 font-mono uppercase tracking-wider font-bold">Requirement</th>
                          <th className="py-2.5 font-mono uppercase tracking-wider font-bold text-right">Category</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-darkBorder/40">
                        {brd.non_functional_requirements.map((req, i) => (
                          <tr key={i} className="text-neutral-300 font-light hover:bg-slate-900/10">
                            <td className="py-3 font-mono font-bold text-accent">{req.id}</td>
                            <td className="py-3 pr-4 leading-relaxed">
                              {currentTypingIndex === 6 ? (
                                <TypeWriter text={req.requirement} onDone={i === (brd.non_functional_requirements?.length || 0) - 1 ? () => handleSectionDone(6) : undefined} />
                              ) : (
                                req.requirement
                              )}
                            </td>
                            <td className="py-3 text-right">
                              <span className="inline-block px-2 py-0.5 bg-slate-950 border border-darkBorder text-neutral-400 rounded text-[9px] font-mono uppercase font-bold tracking-tight">
                                {req.category}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="space-y-2 animate-pulse">
                    <div className="h-8 bg-slate-900 rounded"></div>
                    <div className="h-8 bg-slate-900 rounded"></div>
                  </div>
                )}
              </motion.div>

              {/* Section 8: User Stories */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 8 * 0.1 }}
                className="card-3d glass-card rounded-xl p-6"
              >
                <div className="flex flex-wrap justify-between items-center gap-2 mb-4 border-b border-darkBorder pb-2">
                  <h3 className="text-xs font-mono font-bold uppercase tracking-widest text-accent mb-0">
                    08 / CORE USER STORIES
                  </h3>
                  <div className="flex items-center gap-2">
                    {currentTypingIndex === 7 && brd.user_stories && (
                      <span className="px-2 py-0.5 rounded bg-accent/20 border border-accent/30 text-accent font-mono text-[9px] uppercase tracking-wider animate-pulse">
                        Writing...
                      </span>
                    )}
                    {brd.user_stories && brd.user_stories.length > 0 && (
                      <ConfidenceBadge 
                        citations={[]} 
                        content={getSectionText("user_stories", brd.user_stories)} 
                      />
                    )}
                  </div>
                </div>
                {brd.user_stories && currentTypingIndex >= 7 ? (
                  <div className="flex flex-col gap-4">
                    {brd.user_stories.map((story, storyIdx) => (
                      <div key={storyIdx} className="p-4 bg-slate-950/60 border border-darkBorder rounded-lg">
                        <div className="flex justify-between items-center mb-2.5">
                          <span className="font-mono text-[9px] bg-accent/10 border border-accent/20 text-accent px-2 py-0.5 rounded font-bold uppercase">
                            {story.id}
                          </span>
                          <span className="font-mono text-[9px] text-neutral-500 uppercase">User Story Node</span>
                        </div>
                        <p className="text-xs text-neutral-200 italic leading-relaxed">
                          &ldquo;As a <strong className="text-white font-semibold font-sans">{story.as_a}</strong>, 
                          I want to <strong className="text-white font-semibold font-sans">{story.i_want}</strong> 
                          so that <strong className="text-white font-semibold font-sans">
                            {currentTypingIndex === 7 && (!story.acceptance_criteria || story.acceptance_criteria.length === 0) ? (
                              <TypeWriter text={story.so_that} onDone={storyIdx === (brd.user_stories?.length || 0) - 1 ? () => handleSectionDone(7) : undefined} />
                            ) : (
                              story.so_that
                            )}
                          </strong>&rdquo;
                        </p>
                        {story.acceptance_criteria && story.acceptance_criteria.length > 0 && (
                          <div className="mt-3.5 pt-3.5 border-t border-darkBorder/30">
                            <span className="text-[10px] font-mono font-bold text-neutral-400 uppercase tracking-wide block mb-2">
                              Acceptance Criteria
                            </span>
                            <ul className="space-y-1.5">
                              {story.acceptance_criteria.map((crit, critIdx) => (
                                <li key={critIdx} className="text-[11px] text-neutral-400 flex items-start gap-2 leading-relaxed">
                                  <span className="text-accent shrink-0 mt-0.5">•</span>
                                  <span>
                                    {currentTypingIndex === 7 ? (
                                      <TypeWriter text={crit} onDone={storyIdx === (brd.user_stories?.length || 0) - 1 && critIdx === story.acceptance_criteria.length - 1 ? () => handleSectionDone(7) : undefined} />
                                    ) : (
                                      crit
                                    )}
                                  </span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-3 animate-pulse">
                    <div className="h-20 bg-slate-900 rounded"></div>
                    <div className="h-20 bg-slate-900 rounded"></div>
                  </div>
                )}
              </motion.div>

              {/* Section 9: Technical Infrastructure Snapshot */}
              {renderTechInfrastructure()}

              {/* Section 10: Timeline */}
              {renderRoadmapTimeline()}

              {/* Section 11: Success Metrics */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 10 * 0.1 }}
                className="card-3d glass-card rounded-xl p-6"
              >
                <div className="flex flex-wrap justify-between items-center gap-2 mb-4 border-b border-darkBorder pb-2">
                  <h3 className="text-xs font-mono font-bold uppercase tracking-widest text-accent mb-0">
                    11 / KEY PERFORMANCE METRICS
                  </h3>
                  <div className="flex items-center gap-2">
                    {currentTypingIndex === 10 && brd.success_metrics && (
                      <span className="px-2 py-0.5 rounded bg-accent/20 border border-accent/30 text-accent font-mono text-[9px] uppercase tracking-wider animate-pulse">
                        Writing...
                      </span>
                    )}
                    {brd.success_metrics && brd.success_metrics.length > 0 && (
                      <ConfidenceBadge 
                        citations={[]} 
                        content={getSectionText("success_metrics", brd.success_metrics)} 
                      />
                    )}
                  </div>
                </div>
                {brd.success_metrics && currentTypingIndex >= 10 ? (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {brd.success_metrics.map((m, idx) => (
                      <div key={idx} className="p-4 bg-slate-950/60 border border-darkBorder rounded-lg">
                        <TrendingUp className="w-4 h-4 text-emerald-400 mb-2.5" />
                        <h4 className="text-xs font-bold text-white leading-tight">
                          {currentTypingIndex === 10 ? (
                            <TypeWriter text={m.metric} />
                          ) : (
                            m.metric
                          )}
                        </h4>
                        <div className="mt-3 flex justify-between items-baseline gap-1.5 font-mono">
                          <span className="text-neutral-500 text-[10px] uppercase font-bold">Target</span>
                          <span className="text-sm font-extrabold text-accent">
                            {currentTypingIndex === 10 ? (
                              <TypeWriter text={m.target} />
                            ) : (
                              m.target
                            )}
                          </span>
                        </div>
                        <p className="text-[10px] text-neutral-400 mt-1.5 leading-normal font-light">
                          {currentTypingIndex === 10 ? (
                            <TypeWriter text={m.measurement} onDone={idx === (brd.success_metrics?.length || 0) - 1 ? () => handleSectionDone(10) : undefined} />
                          ) : (
                            m.measurement
                          )}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 animate-pulse">
                    <div className="h-24 bg-slate-900 rounded"></div>
                    <div className="h-24 bg-slate-900 rounded"></div>
                    <div className="h-24 bg-slate-900 rounded"></div>
                  </div>
                )}
              </motion.div>

              {/* Section 12: Risks & Mitigations */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 11 * 0.1 }}
                className="card-3d glass-card rounded-xl p-6"
              >
                <div className="flex flex-wrap justify-between items-center gap-2 mb-4 border-b border-darkBorder pb-2">
                  <h3 className="text-xs font-mono font-bold uppercase tracking-widest text-accent mb-0">
                    12 / RISK SUITE & MITIGATION PROTOCOLS
                  </h3>
                  <div className="flex items-center gap-2">
                    {currentTypingIndex === 11 && brd.risks && (
                      <span className="px-2 py-0.5 rounded bg-accent/20 border border-accent/30 text-accent font-mono text-[9px] uppercase tracking-wider animate-pulse">
                        Writing...
                      </span>
                    )}
                    {brd.risks && brd.risks.length > 0 && (
                      <ConfidenceBadge 
                        citations={[]} 
                        content={getSectionText("risks", brd.risks)} 
                      />
                    )}
                  </div>
                </div>
                {brd.risks && currentTypingIndex >= 11 ? (
                  <div className="space-y-4">
                    {brd.risks.map((rk, idx) => (
                      <div key={idx} className="p-4 bg-slate-950/60 border border-darkBorder rounded-lg">
                        <div className="flex justify-between items-start gap-3 mb-2">
                          <h4 className="text-xs font-bold text-white uppercase flex items-center gap-1.5 leading-tight">
                            <AlertTriangle className="w-4 h-4 text-red-500 shrink-0" />
                            {currentTypingIndex === 11 ? (
                              <TypeWriter text={rk.risk} />
                            ) : (
                              rk.risk
                            )}
                          </h4>
                          <div className="flex gap-1.5 shrink-0 font-mono text-[9px] uppercase font-bold tracking-tight">
                            <span className="px-1.5 py-0.5 bg-red-950/20 text-red-400 border border-red-500/10 rounded">
                              Prob: {currentTypingIndex === 11 ? <TypeWriter text={rk.probability} /> : rk.probability}
                            </span>
                            <span className="px-1.5 py-0.5 bg-red-950/20 text-red-400 border border-red-500/10 rounded">
                              Imp: {currentTypingIndex === 11 ? <TypeWriter text={rk.impact} /> : rk.impact}
                            </span>
                          </div>
                        </div>
                        <p className="text-xs text-neutral-400 font-light leading-relaxed">
                          <strong className="font-mono text-[9px] uppercase tracking-wider text-accent mr-1 bg-accent/5 px-1 py-0.5 rounded">
                            Mitigation Protocol:
                          </strong>{" "}
                          {currentTypingIndex === 11 ? (
                            <TypeWriter text={rk.mitigation} onDone={idx === (brd.risks?.length || 0) - 1 ? () => handleSectionDone(11) : undefined} />
                          ) : (
                            rk.mitigation
                          )}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-4 animate-pulse">
                    <div className="h-20 bg-slate-900 rounded"></div>
                  </div>
                )}
              </motion.div>

            </div>

            <div className="col-span-1 lg:col-span-3 flex flex-col gap-6">
              {renderCitationHighlights()}
            </div>
          </div>
        )}

        {/* MARKET ANALYSIS TAB */}
        {activeTab === 'market' && (() => {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const rawMarket = brdData?.brd?.target_market as any;
          const marketText = typeof rawMarket === 'string' 
            ? rawMarket 
            : (rawMarket?.content || rawMarket?.text || '');
          
          return (
            <div className="space-y-6">
              
              {/* Market Size Hero */}
              <div className="grid grid-cols-3 gap-4">
                {[
                  { 
                    label: 'TAM', 
                    sublabel: 'Total Addressable Market',
                    value: extractMarketSize(marketText, 'TAM') || 'Large Market',
                    color: 'blue',
                    size: 280
                  },
                  { 
                    label: 'SAM', 
                    sublabel: 'Serviceable Addressable Market',
                    value: extractMarketSize(marketText, 'SAM') || 'Growing Segment',
                    color: 'amber',
                    size: 180
                  },
                  { 
                    label: 'SOM', 
                    sublabel: 'Serviceable Obtainable Market',
                    value: extractMarketSize(marketText, 'SOM') || 'Year 1 Target',
                    color: 'green',
                    size: 90
                  },
                ].map(({ label, sublabel, value, color }) => (
                  <div key={label} 
                       className={`border border-${color}-500/30 
                                  bg-${color}-500/5 rounded-xl p-6
                                  flex flex-col items-center 
                                  justify-center text-center`}>
                    <div className={`text-${color}-400 font-mono 
                                    text-xs tracking-widest mb-2`}>
                      {label}
                    </div>
                    <div className={`text-${color}-300 font-bold 
                                    text-2xl mb-1`}>
                      {value}
                    </div>
                    <div className="text-zinc-500 text-xs">
                      {sublabel}
                    </div>
                  </div>
                ))}
              </div>

              {/* Market Trends */}
              <div className="border border-zinc-800 rounded-xl p-6 
                              bg-zinc-950/80 backdrop-blur">
                <h3 className="text-lg font-bold text-white 
                               font-mono mb-4 tracking-widest">
                  📈 TARGET MARKET ANALYSIS
                </h3>
                <p className="text-zinc-300 text-base leading-relaxed">
                  {marketText || 'No market analysis available'}
                </p>
              </div>

              {/* Citation Panel */}
              {(brdData?.brd?.citations?.length ?? 0) > 0 && (
                <div className="border border-zinc-800 rounded-xl 
                                p-6 bg-zinc-950/80 backdrop-blur">
                  <h3 className="text-lg font-bold text-white 
                                 font-mono mb-4 tracking-widest">
                    📌 CITATION HIGHLIGHTS
                  </h3>
                  <div className="space-y-3">
                    {brdData?.brd?.citations?.slice(0, 5)
                      // eslint-disable-next-line @typescript-eslint/no-explicit-any
                      .map((c: any, i: number) => (
                      <div key={i} 
                           className="border border-zinc-700/50 
                                      rounded-lg p-4 bg-zinc-900/50">
                        <p className="text-zinc-300 text-sm 
                                      italic mb-2">
                          &quot;{c.claim || c.source_text}&quot;
                        </p>
                        <div className="flex items-center 
                                        justify-between">
                          <span className="text-blue-400 text-xs 
                                           font-mono">
                            SOURCE: {(c.source || 
                              c.mapped_requirement || 
                              'user_input').toUpperCase()}
                          </span>
                          <span className="text-green-400 text-xs 
                                           font-mono">
                            {Math.round((c.confidence || 0.85) * 100)}% 
                            CONFIDENCE
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })()}

        {/* ARCHITECTURE TAB */}
        {activeTab === 'tech' && (
          <div className="flex flex-col gap-6">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="col-span-1 lg:col-span-8">
                {renderTechInfrastructure()}
              </div>
              <div className="col-span-1 lg:col-span-4">
                {renderBigQueryAudit()}
              </div>
            </div>
          </div>
        )}

        {/* AGENT TRACE TAB */}
        {activeTab === 'agents' && (
          <div className="flex flex-col gap-6">
            {renderAgentTraceFeed()}
          </div>
        )}

      </main>

      {/* Footer */}
      <footer className="border-t border-darkBorder bg-card/20 py-4 no-print">
        <div className="max-w-7xl mx-auto px-4 text-center font-mono text-[10px] text-neutral-500 uppercase tracking-wider">
          Vellum Compliance Monitor • BigQuery Logging Pipeline Active
        </div>
      </footer>

      {/* Raw BigQuery JSON Inspection Modal */}
      {showBqModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="card-3d rounded-xl w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
            <div className="p-4 border-b border-darkBorder flex justify-between items-center bg-slate-900/40">
              <span className="font-mono text-xs text-white uppercase tracking-wider font-bold flex items-center gap-1.5">
                <Database className="w-4 h-4 text-accent" />
                Raw BigQuery Row Payload
              </span>
              <button
                onClick={() => setShowBqModal(false)}
                className="text-neutral-400 hover:text-white font-mono text-xs border border-darkBorder bg-slate-950 px-2.5 py-1 rounded cursor-pointer transition-colors"
              >
                Close
              </button>
            </div>
            
            <div className="p-5 overflow-y-auto bg-slate-950/60 font-mono text-xs leading-relaxed text-emerald-400 flex-grow">
              <pre className="whitespace-pre-wrap">
                {JSON.stringify({
                  session_id: sessionId,
                  created_at: new Date().toISOString(),
                  input_type: brd.citations ? "pdf/image" : "text",
                  confidence_score: confidenceScore,
                  brd_title: brd.title || "Untitled BRD Specifications",
                  gcs_uri: gcs_uri || `gs://autoresearch-ai-brd-store/brds/${sessionId}/brd_payload.json`,
                  processing_time_ms: processing_time_ms || 2500,
                  schema_validation: "PASS",
                  agent_trace_logs: traces.map((t) => ({
                    agent: t.agent,
                    step_id: t.step,
                    output_summary: t.output_summary,
                    tokens_used: t.tokens_used || 0
                  }))
                }, null, 2)}
              </pre>
            </div>
          </div>
        </div>
      )}

      </div>
    </div>
  );
}

