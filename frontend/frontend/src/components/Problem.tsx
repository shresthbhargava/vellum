"use client";

import React, { useEffect, useState, useRef } from "react";
import { useInView } from "framer-motion";
import { FileWarning, Search, Hourglass } from "lucide-react";

function CountUp({
  target,
  duration = 1.2,
  format = (val: number) => String(val),
}: {
  target: number;
  duration?: number;
  format?: (val: number) => string;
}) {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  useEffect(() => {
    if (!isInView) return;
    const end = target;
    const totalSteps = 45;
    const stepTime = (duration * 1000) / totalSteps;
    let step = 0;

    const timer = setInterval(() => {
      step++;
      const current = Math.floor((end * step) / totalSteps);
      setCount(current);
      if (step >= totalSteps) {
        setCount(end);
        clearInterval(timer);
      }
    }, stepTime);

    return () => clearInterval(timer);
  }, [isInView, target, duration]);

  return <span ref={ref}>{format(count)}</span>;
}

export default function Problem() {
  return (
    <section
      id="problem"
      className="bg-white text-black py-28 md:py-40 border-b border-black flex flex-col justify-center font-sans relative"
    >
      <div className="max-w-7xl mx-auto w-full px-6 flex flex-col gap-20">
        
        {/* Metric Counters Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 border-b border-black pb-20">
          <div className="flex flex-col gap-2">
            <span className="text-[12px] font-bold tracking-widest text-[#f5a623] uppercase">
              TIME CONSUMPTION
            </span>
            <h3 className="font-serif text-5xl sm:text-7xl font-bold tracking-tight">
              <CountUp target={40} format={(v) => `${v}+ Hours`} />
            </h3>
            <p className="text-[13px] text-black font-medium tracking-wide leading-relaxed mt-2 uppercase">
              Spent drafting a single compliant BRD outline manually.
            </p>
          </div>

          <div className="flex flex-col gap-2 border-t md:border-t-0 md:border-l border-black pt-12 md:pt-0 md:pl-12">
            <span className="text-[12px] font-bold tracking-widest text-[#f5a623] uppercase">
              RESOURCING OVERHEAD
            </span>
            <h3 className="font-serif text-5xl sm:text-7xl font-bold tracking-tight">
              <CountUp target={1} format={(v) => `${v} Consultant`} />
            </h3>
            <p className="text-[13px] text-black font-medium tracking-wide leading-relaxed mt-2 uppercase">
              Tied down doing repetitive domain research interviews.
            </p>
          </div>

          <div className="flex flex-col gap-2 border-t md:border-t-0 md:border-l border-black pt-12 md:pt-0 md:pl-12">
            <span className="text-[12px] font-bold tracking-widest text-[#f5a623] uppercase">
              MINIMUM COST
            </span>
            <h3 className="font-serif text-5xl sm:text-7xl font-bold tracking-tight">
              <CountUp
                target={100000}
                format={(v) => `₹${v.toLocaleString("en-IN")}`}
              />
            </h3>
            <p className="text-[13px] text-black font-medium tracking-wide leading-relaxed mt-2 uppercase">
              Lost in operational delays per document iteration loop.
            </p>
          </div>
        </div>

        {/* 3 Problem Cards */}
        <div className="flex flex-col gap-8">
          <div>
            <span className="text-[11px] font-bold tracking-widest text-[#f5a623] uppercase">
              01 / THE BOTTLENECK
            </span>
            <h2 className="font-serif text-4xl sm:text-5xl font-bold tracking-tight mt-2">
              WHY THE LEGACY PROCESS FAILS
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Problem Card 1 */}
            <div className="border border-black p-8 flex flex-col gap-6 rounded-none">
              <div className="w-10 h-10 border border-black flex items-center justify-center text-black">
                <FileWarning className="w-5 h-5" />
              </div>
              <div className="space-y-2">
                <h4 className="text-lg font-bold tracking-wide uppercase">
                  Fragmented Inputs
                </h4>
                <p className="text-[13px] text-black leading-relaxed">
                  Ideas are scattered across voice notes, design screenshots, PDF reports, and messy Slack threads. Collating these formats manually results in information loss and architectural gaps.
                </p>
              </div>
            </div>

            {/* Problem Card 2 */}
            <div className="border border-black p-8 flex flex-col gap-6 rounded-none">
              <div className="w-10 h-10 border border-black flex items-center justify-center text-black">
                <Search className="w-5 h-5" />
              </div>
              <div className="space-y-2">
                <h4 className="text-lg font-bold tracking-wide uppercase">
                  Manual Research
                </h4>
                <p className="text-[13px] text-black leading-relaxed">
                  Mapping industry-standard compliance parameters, RACI metrics, and regulatory checks requires hours of manual cross-referencing against outdated spreadsheets and web guides.
                </p>
              </div>
            </div>

            {/* Problem Card 3 */}
            <div className="border border-black p-8 flex flex-col gap-6 rounded-none">
              <div className="w-10 h-10 border border-black flex items-center justify-center text-black">
                <Hourglass className="w-5 h-5" />
              </div>
              <div className="space-y-2">
                <h4 className="text-lg font-bold tracking-wide uppercase">
                  Slow Documentation
                </h4>
                <p className="text-[13px] text-black leading-relaxed">
                  Drafting, formatting, and refining the actual Business Requirements Document is a grueling process that takes weeks, creating massive engineering delays before code is even written.
                </p>
              </div>
            </div>

          </div>
        </div>

      </div>
    </section>
  );
}
