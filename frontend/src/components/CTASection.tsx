"use client";

import React from "react";
import { ArrowUpRight } from "lucide-react";

export default function CTASection() {
  return (
    <section
      id="cta"
      className="bg-black text-white py-36 md:py-48 flex flex-col items-center justify-center font-sans text-center relative overflow-hidden border-b border-white"
    >
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#00e69902_1px,transparent_1px),linear-gradient(to_bottom,#00e69902_1px,transparent_1px)] bg-[size:30px_30px] pointer-events-none opacity-20"></div>

      <div className="max-w-4xl mx-auto w-full px-6 flex flex-col items-center gap-10 relative z-10 select-none">
        
        {/* Subtitle tag */}
        <span className="text-[11px] font-bold tracking-widest text-[#f5a623] uppercase">
          06 / INITIATE GENESIS
        </span>

        {/* Giant Headline */}
        <h2 className="font-serif text-6xl sm:text-8xl md:text-9xl font-bold tracking-tighter leading-none">
          START BUILDING.
        </h2>

        {/* Action Button & Disclaimer info */}
        <div className="flex flex-col items-center gap-4 mt-6">
          <button
            onClick={() => (window.location.href = "/generate")}
            className="group bg-[#f5a623] text-black hover:bg-white hover:text-black transition-colors duration-200 px-10 py-5 font-bold tracking-widest text-xs flex items-center gap-2 border border-[#f5a623] hover:border-white rounded-none"
          >
            GENERATE YOUR BRD
            <ArrowUpRight className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
          </button>
          
          <p className="font-mono text-[10px] text-neutral-500 uppercase tracking-wider">
            No signup. No credit card. Just your idea.
          </p>
        </div>

      </div>
    </section>
  );
}
