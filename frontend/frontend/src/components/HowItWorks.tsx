"use client";

import React, { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { UploadCloud, Cpu, BarChart3, FileSpreadsheet } from "lucide-react";

const steps = [
  {
    number: "01",
    title: "UPLOAD",
    description: "Drop your scattered project notes, PDF reference materials, or dashboard screenshots.",
    icon: UploadCloud,
  },
  {
    number: "02",
    title: "PROCESS",
    description: "Google Gemini multi-modal layer parses text and visual components inside the documents.",
    icon: Cpu,
  },
  {
    number: "03",
    title: "ANALYZE",
    description: "Structured compliance and technical validation models examine architecture blueprints.",
    icon: BarChart3,
  },
  {
    number: "04",
    title: "Generate BRD",
    description: "Receive a professional, standards-compliant BRD outline ready for export in 60 seconds.",
    icon: FileSpreadsheet,
  },
];

export default function HowItWorks() {
  const containerRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(containerRef, { once: true, margin: "-150px" });

  return (
    <section
      id="how-it-works"
      className="bg-black text-white py-28 md:py-40 border-b border-white flex flex-col justify-center font-sans relative"
      ref={containerRef}
    >
      <div className="max-w-7xl mx-auto w-full px-6 flex flex-col gap-20">
        
        {/* Section Title */}
        <div>
          <span className="text-[11px] font-bold tracking-widest text-[#f5a623] uppercase">
            02 / PIPELINE FLOW
          </span>
          <h2 className="font-serif text-4xl sm:text-5xl font-bold tracking-tight mt-2">
            HOW IT WORKS
          </h2>
        </div>

        {/* Steps Timeline Grid */}
        <div className="relative">
          {/* Horizontal Line (Desktop only) */}
          <div className="hidden md:block absolute top-[40px] left-[50px] right-[50px] h-[1px] bg-neutral-800 z-0">
            <motion.div
              initial={{ width: 0 }}
              animate={isInView ? { width: "100%" } : { width: 0 }}
              transition={{ duration: 1.5, ease: "easeInOut" }}
              className="h-full bg-[#f5a623]"
            />
          </div>

          {/* Vertical Line (Mobile only) */}
          <div className="md:hidden absolute top-[40px] bottom-[40px] left-[36px] w-[1px] bg-neutral-800 z-0">
            <motion.div
              initial={{ height: 0 }}
              animate={isInView ? { height: "100%" } : { height: 0 }}
              transition={{ duration: 1.5, ease: "easeInOut" }}
              className="w-full bg-[#f5a623]"
            />
          </div>

          {/* Steps */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 md:gap-8 relative z-10">
            {steps.map((step, idx) => {
              const IconComponent = step.icon;
              return (
                <div key={idx} className="flex md:flex-col gap-6 md:gap-8 items-start">
                  
                  {/* Step Indicator Node */}
                  <div className="flex-shrink-0">
                    <motion.div
                      initial={{ scale: 0.8, rotate: 45 }}
                      animate={isInView ? { scale: 1, rotate: 0 } : { scale: 0.8, rotate: 45 }}
                      transition={{ duration: 0.5, delay: idx * 0.2 }}
                      className="w-16 h-16 border border-white bg-black flex items-center justify-center text-white relative hover:border-[#f5a623] transition-colors duration-200 rounded-none shadow-[4px_4px_0px_#f5a623]"
                    >
                      <IconComponent className="w-6 h-6 text-[#f5a623]" />
                      <span className="absolute -bottom-2 -right-2 bg-black border border-white text-[8px] font-bold px-1 py-0.5 text-white font-mono rounded-none">
                        {step.number}
                      </span>
                    </motion.div>
                  </div>

                  {/* Step Description */}
                  <div className="space-y-2">
                    <h4 className="text-md font-bold tracking-wider uppercase">
                      {step.title}
                    </h4>
                    <p className="text-[13px] text-neutral-400 leading-relaxed font-medium">
                      {step.description}
                    </p>
                  </div>

                </div>
              );
            })}
          </div>

        </div>
      </div>
    </section>
  );
}
