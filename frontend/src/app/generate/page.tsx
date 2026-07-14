"use client";

import React, { useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import AnimatedBackground from "@/components/AnimatedBackground";
import { motion, AnimatePresence } from "framer-motion";
import {
  Send,
  Sparkles,
  Loader2,
  CheckCircle2,
  Circle,
  FileText,
  Search,
  Brain,
  MessageSquare,
  Cpu,
  History,
  Upload,
  X,
} from "lucide-react";

// ─── Types ───────────────────────────────────────────────────────

interface SSEEvent {
  type: "status" | "complete" | "error";
  step: number;
  agent: string;
  message: string;
  data?: Record<string, unknown>;
}

interface AgentStep {
  step: number;
  agent: string;
  icon: React.ReactNode;
  label: string;
  status: "pending" | "active" | "done";
  message: string;
}

// ─── Constants ───────────────────────────────────────────────────

const BACKEND_URL = "https://vellum-omex.onrender.com";

const PIPELINE_STEPS: Omit<AgentStep, "status" | "message">[] = [
  { step: 0, agent: "system",   icon: <Cpu size={18} />,           label: "Initializing Pipeline" },
  { step: 1, agent: "InputAgent",      icon: <FileText size={18} />,     label: "Validating Input" },
  { step: 2, agent: "ExtractionAgent", icon: <Search size={18} />,       label: "Extracting Business Data" },
  { step: 3, agent: "EnrichmentAgent", icon: <Brain size={18} />,        label: "Enriching Context" },
  { step: 4, agent: "BRDAgent",        icon: <Sparkles size={18} />,     label: "Generating BRD" },
  { step: 5, agent: "QualityAgent",    icon: <MessageSquare size={18} />, label: "Quality Review" },
];

// ─── SSE Helper ──────────────────────────────────────────────────

function parseSSELines(text: string): SSEEvent[] {
  const events: SSEEvent[] = [];
  const lines = text.split("\n");
  for (const line of lines) {
    if (line.startsWith("data: ")) {
      try {
        events.push(JSON.parse(line.slice(6)));
      } catch {
        // skip malformed lines
      }
    }
  }
  return events;
}

// ─── Progress Steps Component ────────────────────────────────────

function PipelineProgress({ steps }: { steps: AgentStep[] }) {
  return (
    <div className="space-y-3">
      {steps.map((s) => (
        <motion.div
          key={s.step}
          initial={{ opacity: 0, x: -12 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
          className="flex items-start gap-3"
        >
          {/* Icon circle */}
          <div
            className={`
              flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center border transition-all duration-500
              ${s.status === "done"
                ? "bg-emerald-500/15 border-emerald-500/40 text-emerald-400"
                : s.status === "active"
                  ? "bg-blue-500/15 border-blue-500/40 text-blue-400 animate-pulse"
                  : "bg-zinc-900 border-zinc-800 text-zinc-600"
              }
            `}
          >
            {s.status === "done" ? (
              <CheckCircle2 size={18} />
            ) : s.status === "active" ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <Circle size={18} />
            )}
          </div>

          {/* Text */}
          <div className="flex-1 min-w-0 pt-0.5">
            <div className="flex items-center justify-between">
              <span
                className={`text-sm font-medium transition-colors duration-300 ${
                  s.status === "done"
                    ? "text-emerald-400"
                    : s.status === "active"
                      ? "text-white"
                      : "text-zinc-600"
                }`}
              >
                {s.label}
              </span>
              <span className="text-[10px] font-mono text-zinc-600 uppercase">
                {s.agent}
              </span>
            </div>
            {s.status === "active" && s.message && (
              <p className="text-xs text-zinc-400 mt-0.5 truncate">{s.message}</p>
            )}
            {s.status === "done" && (
              <p className="text-xs text-emerald-500/70 mt-0.5">Complete</p>
            )}
          </div>
        </motion.div>
      ))}
    </div>
  );
}

// ─── Main Page Component ─────────────────────────────────────────

export default function GeneratePage() {
  const router = useRouter();

  // Form state
  const [startupName, setStartupName] = useState("");
  const [textInput, setTextInput] = useState("");
  const [inputType, setInputType] = useState<"text" | "image" | "pdf">("text");
  const [fileContent, setFileContent] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);

  // Generation state
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState("");
  const [agentSteps, setAgentSteps] = useState<AgentStep[]>(
    PIPELINE_STEPS.map((s) => ({ ...s, status: "pending" as const, message: "" }))
  );
  const [currentMessage, setCurrentMessage] = useState("");

  // Ref to abort the SSE stream
  const abortRef = useRef<AbortController | null>(null);

  // ── File upload handler ──────────────────────────────────────
  const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type.startsWith("image/")) setInputType("image");
    else if (file.type === "application/pdf") setInputType("pdf");
    else {
      setError("Unsupported file type. Upload an image or PDF.");
      return;
    }

    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = () => {
      // Convert to base64
      const result = reader.result as string;
      setFileContent(result.split(",")[1] || result);
    };
    reader.readAsDataURL(file);
  }, []);

  const clearFile = useCallback(() => {
    setFileContent(null);
    setFileName(null);
    setInputType("text");
  }, []);

  // ── SSE Streaming Generate ────────────────────────────────────
  const handleGenerate = useCallback(async () => {
    if (!textInput.trim() && !fileContent) return;

    setIsGenerating(true);
    setError("");
    setCurrentMessage("");
    setAgentSteps(
      PIPELINE_STEPS.map((s) => ({ ...s, status: "pending" as const, message: "" }))
    );

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const response = await fetch(`${BACKEND_URL}/api/stream`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          startup_name: startupName.trim(),
          text_input: textInput.trim(),
          input_type: inputType,
          filename: fileName,
          file_content: fileContent,
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        const errBody = await response.text();
        throw new Error(errBody || `Server error: ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error("No response stream");

      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const events = parseSSELines(buffer);

        for (const event of events) {
          if (event.type === "status") {
            // Mark this step as done, the next as active
            setAgentSteps((prev) =>
              prev.map((s) => {
                if (s.step < event.step) return { ...s, status: "done" as const };
                if (s.step === event.step)
                  return { ...s, status: "active" as const, message: event.message };
                return s;
              })
            );
            setCurrentMessage(event.message);
          } else if (event.type === "complete") {
            // Mark all steps as done
            setAgentSteps((prev) =>
              prev.map((s) => ({ ...s, status: "done" as const, message: "" }))
            );
            setCurrentMessage("BRD generation complete! Redirecting...");

            const sessionData = event.data as Record<string, unknown> | undefined;
            const sessionId = (sessionData?.session_id as string) || "";

            // Short delay so user sees the "complete" state, then redirect
            setTimeout(() => {
              if (sessionId) {
                router.push(`/results/${sessionId}`);
              } else {
                setError("Session ID missing from response.");
                setIsGenerating(false);
              }
            }, 800);
          } else if (event.type === "error") {
            throw new Error(event.message || "Pipeline error");
          }
        }

        // Keep only the last (potentially incomplete) line in buffer
        const lastNewline = buffer.lastIndexOf("\n\n");
        if (lastNewline !== -1) {
          buffer = buffer.slice(lastNewline + 2);
        }
      }
    } catch (err: unknown) {
      if (err instanceof DOMException && err.name === "AbortError") {
        // User cancelled — do nothing special
      } else {
        setError(err instanceof Error ? err.message : "Something went wrong");
      }
      setIsGenerating(false);
    }
  }, [startupName, textInput, inputType, fileName, fileContent, router]);

  // ── Cancel generation ────────────────────────────────────────
  const handleCancel = useCallback(() => {
    abortRef.current?.abort();
    setIsGenerating(false);
    setAgentSteps(
      PIPELINE_STEPS.map((s) => ({ ...s, status: "pending" as const, message: "" }))
    );
    setCurrentMessage("");
  }, []);

  // ─── Render ─────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-[#09090b] text-white relative overflow-hidden">
      <AnimatedBackground />

      <div className="relative z-10 max-w-5xl mx-auto px-6 py-12">
        {/* Vellum Branding Header */}
        <div className="flex items-center justify-between mb-12">
          <Link href="/" className="text-xl font-bold font-mono tracking-widest flex items-center gap-2 hover:opacity-80 transition-opacity">
            <span className="text-white">Vellum</span>
            <span className="text-amber-500">/</span>
            <span className="text-white">POWERED BY GROQ</span>
          </Link>
          <div className="flex items-center gap-6">
            <Link href="/generate" className="text-sm font-mono text-white border-b-2 border-accent pb-0.5 transition-colors">
              GENERATE
            </Link>
            <Link href="/validate" className="text-sm font-mono text-zinc-400 hover:text-white transition-colors">
              VALIDATE
            </Link>
          </div>
        </div>

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-10"
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <Sparkles className="text-blue-400" size={28} />
              <h1 className="text-3xl font-bold font-mono tracking-tight">
                BRD GENERATOR
              </h1>
            </div>
            <Link
              href="/history"
              className="inline-flex items-center gap-2 text-zinc-400 hover:text-white transition-colors text-sm font-mono border border-zinc-800 rounded-lg px-3 py-1.5 hover:border-zinc-600"
            >
              <History size={14} />
              HISTORY
            </Link>
          </div>
          <p className="text-zinc-400 text-sm max-w-xl">
            Describe your startup idea and let AI agents build a comprehensive
            Business Requirements Document in real-time.
          </p>
        </motion.div>

        {/* Two-column layout: Form + Progress */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* ── LEFT: Input Form ──────────────────────────────── */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="border border-zinc-800 rounded-xl p-6 bg-zinc-950/80 backdrop-blur-sm self-start"
          >
            {/* Startup Name */}
            <div className="mb-4">
              <label className="block text-xs font-mono text-zinc-400 uppercase tracking-widest mb-2">
                STARTUP NAME <span className="text-zinc-600">(optional)</span>
              </label>
              <input
                type="text"
                value={startupName}
                onChange={(e) => setStartupName(e.target.value)}
                placeholder="e.g. PetMatch AI"
                disabled={isGenerating}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-3 text-white text-sm placeholder-zinc-600 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20 disabled:opacity-50 transition-colors"
              />
            </div>

            {/* Idea Input */}
            <div className="mb-4">
              <label className="block text-xs font-mono text-zinc-400 uppercase tracking-widest mb-2">
                YOUR STARTUP IDEA <span className="text-red-400">*</span>
              </label>
              <textarea
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                placeholder="Describe your startup idea in detail... The more context you provide, the better the BRD will be."
                rows={6}
                disabled={isGenerating}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-3 text-white text-sm placeholder-zinc-600 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20 resize-none disabled:opacity-50 transition-colors"
              />
            </div>

            {/* File Upload */}
            <div className="mb-5">
              <label className="block text-xs font-mono text-zinc-400 uppercase tracking-widest mb-2">
                ATTACHMENT <span className="text-zinc-600">(optional)</span>
              </label>
              {fileContent ? (
                <div className="flex items-center gap-2 bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2">
                  <FileText size={14} className="text-blue-400 flex-shrink-0" />
                  <span className="text-sm text-zinc-300 truncate flex-1">
                    {fileName}
                  </span>
                  <button
                    onClick={clearFile}
                    disabled={isGenerating}
                    className="text-zinc-500 hover:text-red-400 transition-colors disabled:opacity-50"
                  >
                    <X size={14} />
                  </button>
                </div>
              ) : (
                <label className="flex items-center justify-center gap-2 bg-zinc-900 border border-dashed border-zinc-700 rounded-lg py-3 px-4 cursor-pointer hover:border-zinc-500 transition-colors">
                  <Upload size={14} className="text-zinc-500" />
                  <span className="text-sm text-zinc-400">
                    Upload image or PDF
                  </span>
                  <input
                    type="file"
                    accept="image/*,.pdf"
                    onChange={handleFileUpload}
                    disabled={isGenerating}
                    className="hidden"
                  />
                </label>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                onClick={handleGenerate}
                disabled={isGenerating || (!textInput.trim() && !fileContent)}
                className="flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 disabled:bg-zinc-800 disabled:text-zinc-500 text-white font-semibold py-3 px-6 rounded-lg transition-all text-sm"
              >
                {isGenerating ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    GENERATING...
                  </>
                ) : (
                  <>
                    <Send size={16} />
                    GENERATE BRD
                  </>
                )}
              </button>

              {isGenerating && (
                <motion.button
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  onClick={handleCancel}
                  className="px-4 py-3 border border-red-500/30 text-red-400 rounded-lg hover:bg-red-500/10 transition-colors text-sm font-mono"
                >
                  CANCEL
                </motion.button>
              )}

              {!isGenerating && (
                <Link
                  href="/validate"
                  className="px-4 py-3 border border-zinc-700 text-zinc-400 rounded-lg hover:border-zinc-500 hover:text-white transition-colors text-sm font-mono whitespace-nowrap"
                >
                  VALIDATE IDEA
                </Link>
              )}
            </div>
          </motion.div>

          {/* ── RIGHT: Live Pipeline Progress ────────────────── */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="border border-zinc-800 rounded-xl p-6 bg-zinc-950/80 backdrop-blur-sm self-start"
          >
            <h3 className="text-xs font-mono text-zinc-400 uppercase tracking-widest mb-5">
              PIPELINE PROGRESS
            </h3>

            {!isGenerating && !error && agentSteps.every((s) => s.status === "pending") && (
              <div className="text-center py-10">
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-zinc-900 border border-zinc-800 mb-3">
                  <Cpu size={22} className="text-zinc-700" />
                </div>
                <p className="text-zinc-600 text-sm">
                  Agent pipeline will appear here
                </p>
                <p className="text-zinc-700 text-xs mt-1">
                  5 agents process your idea sequentially
                </p>
              </div>
            )}

            {isGenerating && (
              <PipelineProgress steps={agentSteps} />
            )}

            {/* Current message banner */}
            <AnimatePresence>
              {isGenerating && currentMessage && (
                <motion.div
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="mt-4 pt-4 border-t border-zinc-800/50"
                >
                  <p className="text-xs text-zinc-500 font-mono leading-relaxed">
                    {currentMessage}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Error */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="mt-4 border border-red-500/30 bg-red-500/5 rounded-lg p-3"
                >
                  <p className="text-red-400 text-sm">{error}</p>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>
      </div>
    </div>
  );
}