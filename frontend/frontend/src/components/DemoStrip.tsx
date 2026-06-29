"use client";

import React, { useEffect, useState, useRef } from "react";

const terminalText = [
  "# AUTORESEARCH AI - COMPLIANCE BRD CORE",
  "SESSION_ID: 56ab395b-bbeb-498a-ac20-bb2999e1e06f",
  "TIMESTAMP: 2026-06-06T16:22:54Z",
  "STATUS: ACTIVE",
  "--------------------------------------------------",
  "",
  "## 01 / EXECUTIVE SUMMARY",
  "EduStream AI is an enterprise-scale multimodal coding evaluation platform.",
  "It parses candidate speech, codebase entries, and canvas layout structures",
  "in real-time to assess core soft skills, design heuristics, and code quality.",
  "",
  "## 02 / SYSTEM STAKEHOLDERS (RACI)",
  "- Product Management [Accountable]: Scope definition and KPI parameters mapping.",
  "- Engineering Leads [Responsible]: Ingest pipeline integrations and cloud logging.",
  "- Security Auditors [Consulted]: Audit compliance trail database verification.",
  "",
  "## 03 / FUNCTIONAL REQUIREMENTS MATRIX",
  "- REQ-001 [High]: Dual-modality ingestion parsing raw PDFs and PNG wireframes.",
  "- REQ-002 [High]: Multi-agent parallel trace streams compiling standard layouts.",
  "- REQ-003 [Med]: Diagnostic latency tracker auditing processing overheads.",
  "- REQ-004 [Med]: Direct Word/PDF export pipeline compliant standard sheets.",
  "",
  "## 04 / EXPLAINABLE AI DIAGNOSTIC SCHEMA",
  "{\n  \"engine\": \"Gemini-2.5-Pro\",\n  \"confidence_score\": 0.96,\n  \"ingestion_latency_ms\": 1482,\n  \"agent_traces_loaded\": 5,\n  \"database_synced\": true\n}",
  "",
  "--------------------------------------------------",
  "PIPELINE WORKFLOW COMPLIANT: VALIDATION PASS (200 OK)",
];

export default function DemoStrip() {
  const [displayedText, setDisplayedText] = useState<string[]>([]);
  const [currentLineIndex, setCurrentLineIndex] = useState(0);
  const [currentCharIndex, setCurrentCharIndex] = useState(0);
  const terminalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let timer: NodeJS.Timeout;

    const typeChar = () => {
      if (currentLineIndex >= terminalText.length) {
        // Reset loop after printing everything
        timer = setTimeout(() => {
          setDisplayedText([]);
          setCurrentLineIndex(0);
          setCurrentCharIndex(0);
        }, 5000);
        return;
      }

      const currentLine = terminalText[currentLineIndex];

      if (currentCharIndex < currentLine.length) {
        setDisplayedText((prev) => {
          const next = [...prev];
          if (next[currentLineIndex] === undefined) {
            next[currentLineIndex] = "";
          }
          next[currentLineIndex] = currentLine.substring(0, currentCharIndex + 1);
          return next;
        });
        setCurrentCharIndex((prev) => prev + 1);
        // Type characters fast
        timer = setTimeout(typeChar, 10);
      } else {
        // Line finished, move to next
        setCurrentLineIndex((prev) => prev + 1);
        setCurrentCharIndex(0);
        timer = setTimeout(typeChar, 200); // Wait slightly between lines
      }
    };

    timer = setTimeout(typeChar, 10);

    return () => clearTimeout(timer);
  }, [currentLineIndex, currentCharIndex]);

  // Auto scroll terminal to bottom
  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [displayedText]);

  return (
    <section
      id="live-demo"
      className="bg-black border-b border-white py-28 md:py-40 flex flex-col justify-center font-mono relative overflow-hidden"
    >
      <div className="max-w-7xl mx-auto w-full px-6 flex flex-col gap-10">
        
        {/* Header Title */}
        <div className="flex justify-between items-center border-b border-neutral-800 pb-6">
          <div className="flex flex-col gap-2">
            <span className="text-[11px] font-bold tracking-widest text-[#f5a623] uppercase font-sans">
              04 / SIMULATED PIPELINE OUT
            </span>
            <h2 className="font-serif text-3xl sm:text-4xl text-white font-bold tracking-tight uppercase font-sans">
              LIVE ENGINE STREAM
            </h2>
          </div>
          <div className="flex items-center gap-1.5 font-mono text-[9px] text-[#f5a623] uppercase font-bold border border-[#f5a623] px-3 py-1">
            <span className="w-1.5 h-1.5 rounded-full bg-[#f5a623] animate-ping" />
            SYNTHESIS ACTIVE
          </div>
        </div>

        {/* Terminal Container */}
        <div className="border border-white bg-black w-full overflow-hidden flex flex-col shadow-[0_20px_50px_rgba(0,0,0,0.8)]">
          {/* Terminal Window Header */}
          <div className="bg-neutral-900 border-b border-white px-4 py-3 flex justify-between items-center select-none">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 bg-[#f5a623]" />
              <span className="text-[10px] font-bold text-white tracking-widest">
                AUTORESEARCH_ENGINE_SHELL
              </span>
            </div>
            <span className="text-[9px] text-neutral-500 font-bold">
              GEMINI_VERTEX_SYNC
            </span>
          </div>

          {/* Terminal Output Terminal Body */}
          <div
            ref={terminalRef}
            className="p-6 h-96 overflow-y-auto flex flex-col gap-2 text-[#f5a623] text-xs md:text-sm selection:bg-[#f5a623]/20 leading-relaxed scrollbar-thin scrollbar-thumb-neutral-800"
          >
            {displayedText.map((line, idx) => (
              <div key={idx} className="min-h-[1rem] whitespace-pre-wrap">
                {line}
              </div>
            ))}
            {currentLineIndex < terminalText.length && (
              <div className="inline-block w-2 h-4 bg-[#f5a623] animate-pulse" />
            )}
          </div>
        </div>

      </div>
    </section>
  );
}
