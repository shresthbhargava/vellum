"use client";

import React, { useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Sparkles, Upload, FileText, Clock, Loader2, CheckCircle2, AlertCircle, XCircle } from "lucide-react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "https://vellum-ai-service.onrender.com";

// ── Step definitions for the progress UI ───────────────────────────
const PIPELINE_STEPS = [
  { key: "input",       label: "Processing Input",    icon: FileText,   color: "#60a5fa" },
  { key: "extraction",  label: "Extracting Data",     icon: Sparkles,   color: "#a78bfa" },
  { key: "validation",  label: "Validating Idea",     icon: CheckCircle2,color: "#34d399" },
  { key: "brd",         label: "Generating BRD",      icon: FileText,   color: "#fbbf24" },
  { key: "critic",      label: "Quality Review",      icon: AlertCircle, color: "#f472b6" },
  { key: "saving",      label: "Saving to Database",   icon: CheckCircle2,color: "#60a5fa" },
] as const;

type StepStatus = "pending" | "running" | "complete" | "skipped" | "error";

interface StepState {
  status: StepStatus;
  detail?: string;
  data?: Record<string, unknown>;
}

export default function GeneratePage() {
  const router = useRouter();
  const [text, setText] = useState("");
  const [startupName, setStartupName] = useState("");
  const [inputType, setInputType] = useState<"text" | "image" | "pdf">("text");
  const [fileContent, setFileContent] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);

  const [isGenerating, setIsGenerating] = useState(false);
  const [steps, setSteps] = useState<Record<string, StepState>>({});
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const abortRef = useRef<AbortController | null>(null);

  // ── File handler ────────────────────────────────────────────────
  const handleFile = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setErrorMsg("File too large. Max 5 MB.");
      return;
    }

    setFileName(file.name);
    setInputType(file.type === "application/pdf" ? "pdf" : "image");

    // Convert to base64
    const reader = new FileReader();
    reader.onload = () => {
      const b64 = (reader.result as string).split(",")[1];
      setFileContent(b64);
    };
    reader.readAsDataURL(file);
  }, []);

  // ── SSE Stream consumer ──────────────────────────────────────────
  const handleGenerate = useCallback(async () => {
    if (!text.trim()) return;
    setIsGenerating(true);
    setErrorMsg(null);
    setSteps({});
    setSessionId(null);

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const res = await fetch(`${API_BASE}/api/pipeline/stream`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          startup_name: startupName,
          text_input: text,
          input_type: inputType,
          filename: fileName,
          file_content: fileContent,
        }),
        signal: controller.signal,
      });

      if (!res.ok) {
        throw new Error(`Server error: ${res.status}`);
      }

      const reader = res.body?.getReader();
      if (!reader) throw new Error("No response stream");

      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        // Parse SSE lines: "data: {...}\n\n"
        const lines = buffer.split("\n");
        buffer = lines.pop() || ""; // keep incomplete line in buffer

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const jsonStr = line.slice(6).trim();
          if (!jsonStr) continue;

          try {
            const event = JSON.parse(jsonStr);

            switch (event.type) {
              case "session":
                setSessionId(event.session_id);
                break;

              case "step":
                setSteps((prev) => ({
                  ...prev,
                  [event.step]: {
                    status: event.status,
                    detail: event.detail,
                    data: event.data,
                  },
                }));
                break;

              case "done":
                // Pipeline complete — redirect to results
                router.push(`/results/${event.session_id}`);
                return;

              case "error":
                setErrorMsg(event.message);
                setSteps((prev) => {
                  const next = { ...prev };
                  // Mark the currently running step as error
                  for (const [k, v] of Object.entries(next)) {
                    if ((v as StepState).status === "running") {
                      next[k] = { ...v, status: "error" } as StepState;
                    }
                  }
                  return next;
                });
                break;
            }
          } catch {
            // Ignore malformed JSON lines
          }
        }
      }

      // If we exit the loop without a "done" event, check for error
      setErrorMsg("Stream ended unexpectedly. Check your connection.");
    } catch (err: unknown) {
      if (err instanceof DOMException && err.name === "AbortError") {
        // User cancelled — do nothing
      } else {
        setErrorMsg(err instanceof Error ? err.message : "Something went wrong");
      }
    } finally {
      setIsGenerating(false);
      abortRef.current = null;
    }
  }, [text, startupName, inputType, fileName, fileContent, router]);

  const handleCancel = () => {
    abortRef.current?.abort();
    setIsGenerating(false);
  };

  // ── Render step indicator ────────────────────────────────────────
  const renderStep = (step: (typeof PIPELINE_STEPS)[number]) => {
    const state = steps[step.key];
    const status: StepStatus = state?.status || "pending";
    const Icon = step.icon;

    const styles: Record<StepStatus, string> = {
      pending:  "border-white/10 bg-white/5 text-white/30",
      running:  "border-blue-500/50 bg-blue-500/10 text-blue-400",
      complete: "border-green-500/50 bg-green-500/10 text-green-400",
      skipped:  "border-yellow-500/30 bg-yellow-500/5 text-yellow-500/50",
      error:    "border-red-500/50 bg-red-500/10 text-red-400",
    };

    const statusLabel: Record<StepStatus, string> = {
      pending:  "Waiting...",
      running:  "In Progress",
      complete: "Complete",
      skipped:  "Skipped",
      error:    "Failed",
    };

    return (
      <div
        key={step.key}
        className={`flex items-center gap-3 rounded-xl border p-3 transition-all duration-500 ${styles[status]}`}
      >
        <div className="relative flex-shrink-0">
          {status === "running" ? (
            <Loader2 className="h-5 w-5 animate-spin" style={{ color: step.color }} />
          ) : status === "complete" ? (
            <CheckCircle2 className="h-5 w-5" style={{ color: "#34d399" }} />
          ) : status === "error" ? (
            <XCircle className="h-5 w-5" style={{ color: "#f87171" }} />
          ) : (
            <Icon className="h-5 w-5" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">{step.label}</span>
            <span className="text-xs opacity-60">{statusLabel[status]}</span>
          </div>
          {state?.detail && (
            <p className="mt-0.5 text-xs opacity-70 truncate">{state.detail}</p>
          )}
          {state?.data && (
            <div className="mt-1 flex gap-2 text-xs opacity-60">
              {Object.entries(state.data).map(([k, v]) => (
                <span key={k}>
                  {k}: {String(v)}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white">
      {/* Header */}
      <div className="border-b border-white/10 px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
              Generate BRD
            </h1>
            <p className="text-sm text-white/50 mt-0.5">
              Llama 3.3 (Groq) Powered Multi-Agent Intelligence
            </p>
          </div>
          <a
            href="/history"
            className="flex items-center gap-1.5 text-sm text-white/50 hover:text-white/80 transition-colors"
          >
            <Clock className="h-4 w-4" />
            History
          </a>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-8 space-y-6">
        {/* Input Section */}
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-white/70 mb-1.5">
              Startup Name (optional)
            </label>
            <input
              type="text"
              value={startupName}
              onChange={(e) => setStartupName(e.target.value)}
              placeholder="e.g. PawWalk"
              className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder-white/30 focus:outline-none focus:border-blue-500/50 transition-colors"
              disabled={isGenerating}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-white/70 mb-1.5">
              Describe Your Startup Idea
            </label>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="A platform that connects pet owners with local dog walkers..."
              rows={5}
              className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder-white/30 focus:outline-none focus:border-blue-500/50 transition-colors resize-none"
              disabled={isGenerating}
            />
          </div>

          {/* File Upload */}
          <div>
            <label className="block text-sm font-medium text-white/70 mb-1.5">
              Upload Image or PDF (optional)
            </label>
            <label className="flex items-center gap-2 rounded-lg border border-dashed border-white/20 bg-white/5 px-4 py-3 text-sm text-white/40 cursor-pointer hover:border-white/40 transition-colors">
              <Upload className="h-4 w-4" />
              {fileName || "Choose a file..."}
              <input
                type="file"
                accept="image/*,.pdf"
                onChange={handleFile}
                className="hidden"
                disabled={isGenerating}
              />
            </label>
            {fileName && (
              <button
                onClick={() => { setFileName(null); setFileContent(null); setInputType("text"); }}
                className="mt-1 text-xs text-red-400 hover:text-red-300"
                disabled={isGenerating}
              >
                Remove file
              </button>
            )}
          </div>

          {/* Generate Button */}
          <div className="flex gap-3">
            {!isGenerating ? (
              <button
                onClick={handleGenerate}
                disabled={!text.trim()}
                className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-2.5 text-sm font-semibold text-white hover:opacity-90 transition-opacity disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <Sparkles className="h-4 w-4" />
                Generate BRD
              </button>
            ) : (
              <button
                onClick={handleCancel}
                className="flex items-center gap-2 rounded-xl border border-red-500/50 bg-red-500/10 px-6 py-2.5 text-sm font-semibold text-red-400 hover:bg-red-500/20 transition-colors"
              >
                Cancel
              </button>
            )}
          </div>
        </div>

        {/* Error Message */}
        {errorMsg && (
          <div className="flex items-start gap-2 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-400">
            <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-medium">Generation Failed</p>
              <p className="mt-1 text-xs opacity-80">{errorMsg}</p>
            </div>
          </div>
        )}

        {/* Pipeline Progress */}
        {isGenerating && (
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6 space-y-3">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-sm font-semibold text-white/70">
                Pipeline Progress
              </h2>
              {sessionId && (
                <span className="text-xs text-white/30 font-mono">
                  {sessionId.slice(0, 8)}...
                </span>
              )}
            </div>
            {PIPELINE_STEPS.map(renderStep)}
          </div>
        )}

        {/* Validate Idea Link */}
        <div className="text-center">
          <a
            href="/validate"
            className="text-sm text-white/40 hover:text-white/60 transition-colors"
          >
            Just want to validate an idea? → Idea Validator
          </a>
        </div>
      </div>
    </div>
  );
}