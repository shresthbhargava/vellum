"use client";

import React from "react";
import { Search, TrendingUp, FileText, Server } from "lucide-react";

const agents = [
  {
    number: "01",
    name: "RESEARCH AGENT",
    role: "Validation & Syntax",
    tagline: "Crawls raw notes and multi-modal PDFs to index parameters.",
    details: [
      "Performs OCR on wireframes and layouts",
      "Resolves token inconsistencies in specifications",
      "Semantic mining of unstructured documentation",
    ],
    icon: Search,
  },
  {
    number: "02",
    name: "MARKET AGENT",
    role: "SWOT & Benchmarks",
    tagline: "Maps business propositions against industry competitor landscapes.",
    details: [
      "Generates structured competitive benchmarks",
      "Synthesizes actionable SWOT matrix grids",
      "Calculates target market alignment indicators",
    ],
    icon: TrendingUp,
  },
  {
    number: "03",
    name: "BRD AGENT",
    role: "Drafting & Schemas",
    tagline: "Drafts detailed user stories, requirements, and RACI metrics.",
    details: [
      "Compiles functional and non-functional requirements",
      "Structures user stories with acceptance criteria",
      "Defines technology stack components mapping",
    ],
    icon: FileText,
  },
  {
    number: "04",
    name: "ARCHITECT AGENT",
    role: "Security & Diagnostic",
    tagline: "Verifies technical logic flow, data compliance, and sanity checks.",
    details: [
      "Performs diagnostic integrity audits",
      "Verifies schema constraints and security boundaries",
      "Ensures explainable AI audit trails logging",
    ],
    icon: Server,
  },
];

export default function Agents() {
  return (
    <section
      id="agents"
      className="bg-white text-black py-28 md:py-40 border-b border-black flex flex-col justify-center font-sans"
    >
      <div className="max-w-7xl mx-auto w-full px-6 flex flex-col gap-20">
        
        {/* Section Header */}
        <div>
          <span className="text-[11px] font-bold tracking-widest text-[#f5a623] uppercase">
            03 / CONCENTRIC SYSTEM
          </span>
          <h2 className="font-serif text-4xl sm:text-5xl font-bold tracking-tight mt-2">
            SPECIALIZED AGENT MATRIX
          </h2>
        </div>

        {/* 2x2 Grid of CSS 3D Flip Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {agents.map((agent, idx) => {
            const IconComponent = agent.icon;
            return (
              <div key={idx} className="flip-card h-80 w-full relative select-none">
                <div className="flip-card-inner">
                  
                  {/* Card Front: White Background, Black Text */}
                  <div className="flip-card-front bg-white border border-black p-8 flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-start">
                        <span className="font-mono text-lg font-bold tracking-wider text-[#f5a623]">
                          {agent.number}
                        </span>
                        <div className="w-10 h-10 border border-black flex items-center justify-center">
                          <IconComponent className="w-5 h-5 text-black" />
                        </div>
                      </div>
                      
                      <div className="mt-8 space-y-1">
                        <span className="text-[10px] font-bold tracking-widest text-[#f5a623] uppercase block">
                          {agent.role}
                        </span>
                        <h3 className="font-serif text-2xl sm:text-3xl font-bold tracking-tight uppercase">
                          {agent.name}
                        </h3>
                      </div>
                    </div>

                    <p className="text-[13px] text-black leading-relaxed font-medium">
                      {agent.tagline}
                    </p>
                  </div>

                  {/* Card Back: Black Background, White Text */}
                  <div className="flip-card-back bg-black border border-[#f5a623] p-8 flex flex-col justify-between text-white">
                    <div>
                      <div className="flex justify-between items-center border-b border-[#f5a623] pb-3">
                        <span className="font-mono text-xs font-bold text-[#f5a623]">
                          SPECIFICATION MATRIX / {agent.number}
                        </span>
                        <span className="text-[9px] font-bold uppercase tracking-widest text-[#f5a623]">
                          ACTIVE
                        </span>
                      </div>

                      <ul className="mt-6 space-y-3">
                        {agent.details.map((detail, dIdx) => (
                          <li key={dIdx} className="text-[12px] flex items-start gap-2.5 leading-relaxed">
                            <span className="text-[#f5a623] font-mono shrink-0 font-bold">•</span>
                            <span className="text-white font-medium">{detail}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="text-[9px] text-[#f5a623] tracking-widest font-mono text-right font-bold uppercase">
                      VERTEX AI + GEMINI LAYER
                    </div>
                  </div>

                </div>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
}
