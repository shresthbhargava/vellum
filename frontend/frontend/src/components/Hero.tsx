"use client";

import React from "react";
import dynamic from "next/dynamic";
import { motion } from "framer-motion";
import { FileText, Image as ImageIcon } from "lucide-react";

// Load ThreeScene client-side only
const ThreeScene = dynamic(() => import("../lib/three-scene"), { ssr: false });

export default function Hero() {
  const handleScrollToDemo = () => {
    const el = document.getElementById("live-demo");
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <section
      id="hero"
      className="relative min-h-screen bg-black text-white flex flex-col justify-center overflow-hidden border-b border-white"
    >
      {/* 3D Canvas Background */}
      <div className="absolute inset-0 z-0 pointer-events-none opacity-60">
        <ThreeScene />
      </div>

      {/* Main Content Layout */}
      <div className="relative z-10 max-w-7xl mx-auto w-full px-6 py-20 flex flex-col justify-between min-h-screen">
        {/* Empty top slot to push header spacing */}
        <div className="h-14"></div>

        {/* Hero Typography */}
        <div className="flex flex-col gap-6 md:gap-10 max-w-4xl">
          <motion.h1
            initial={{ y: -40 }}
            animate={{ y: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="font-serif text-5xl sm:text-7xl md:text-8xl lg:text-9xl leading-[0.9] tracking-tighter"
          >
            <span className="block text-white">FRAGMENTED IDEAS.</span>
            <span className="block text-[#f5a623]">ONE DOCUMENT.</span>
          </motion.h1>

          <motion.p
            initial={{ y: -20 }}
            animate={{ y: 0 }}
            transition={{ duration: 0.5, ease: "easeOut", delay: 0.1 }}
            className="font-sans text-lg sm:text-xl md:text-2xl text-white max-w-2xl leading-relaxed"
          >
            AutoResearch AI turns scattered notes, PDFs and screenshots into a
            professional BRD in under 60 seconds.
          </motion.p>

          <motion.div
            initial={{ y: 20 }}
            animate={{ y: 0 }}
            transition={{ duration: 0.5, ease: "easeOut", delay: 0.2 }}
            className="flex flex-col sm:flex-row gap-4 mt-4 font-sans tracking-widest text-[11px] font-bold"
          >
            <button
              onClick={() => (window.location.href = "/generate")}
              className="bg-[#f5a623] text-black px-8 py-4 border border-[#f5a623] hover:bg-white hover:border-white transition-colors duration-200"
            >
              Generate BRD
            </button>
            <button
              onClick={handleScrollToDemo}
              className="bg-transparent text-white px-8 py-4 border border-white hover:bg-white hover:text-black transition-colors duration-200"
            >
              Load Demo
            </button>
          </motion.div>
        </div>

        {/* Floating 3D Document Cards (Hidden on mobile for clarity) */}
        <div className="hidden lg:block absolute inset-y-0 right-10 w-96 pointer-events-none select-none z-20">
          {/* PDF Doc Card */}
          <motion.div
            style={{ perspective: 1000, transformStyle: "preserve-3d" }}
            animate={{ y: [0, -15, 0] }}
            transition={{ repeat: Infinity, duration: 6, ease: "easeInOut" }}
            whileHover={{ scale: 1.05, rotateY: 15, rotateX: 10, z: 20 }}
            className="pointer-events-auto absolute top-[15%] right-[20%] w-60 border border-white bg-black p-4 font-mono text-[9px] text-white flex flex-col gap-3 shadow-[0_20px_50px_rgba(0,0,0,0.8)]"
          >
            <div className="flex justify-between items-center border-b border-white pb-2">
              <span className="flex items-center gap-1.5 font-bold">
                <FileText className="w-3.5 h-3.5 text-[#f5a623]" />
                INPUT_SPECS.PDF
              </span>
              <span className="text-[#f5a623]">4.2MB</span>
            </div>
            <div className="space-y-1">
              <div className="h-2 bg-[#f5a623] w-3/4"></div>
              <div className="h-1.5 bg-white w-full"></div>
              <div className="h-1.5 bg-white w-5/6"></div>
              <div className="h-1.5 bg-white w-2/3"></div>
            </div>
            <div className="border-t border-white pt-2 text-right text-[7px] text-[#f5a623]">
              UNSTRUCTURED RESEARCH RAWDATA
            </div>
          </motion.div>

          {/* Screenshot Doc Card */}
          <motion.div
            style={{ perspective: 1000, transformStyle: "preserve-3d" }}
            animate={{ y: [0, 15, 0] }}
            transition={{ repeat: Infinity, duration: 5, ease: "easeInOut" }}
            whileHover={{ scale: 1.05, rotateY: -15, rotateX: -10, z: 20 }}
            className="pointer-events-auto absolute bottom-[15%] right-[-5%] w-56 border border-[#f5a623] bg-black p-4 font-mono text-[9px] text-[#f5a623] flex flex-col gap-2.5 shadow-[0_20px_50px_rgba(0,0,0,0.8)]"
          >
            <div className="flex justify-between items-center border-b border-[#f5a623] pb-2 text-white">
              <span className="flex items-center gap-1.5 font-bold">
                <ImageIcon className="w-3.5 h-3.5 text-white" />
                WIREFRAME.PNG
              </span>
              <span>1024x768</span>
            </div>
            <div className="border border-dashed border-[#f5a623] h-20 flex items-center justify-center">
              <span className="text-[7px] tracking-widest uppercase text-white font-sans font-bold">
                MOCKUP CANVAS
              </span>
            </div>
            <div className="text-[7px] text-white">
              EXTRACTED VIEWPORT MAPPINGS
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
