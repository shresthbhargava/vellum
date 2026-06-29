"use client";

import React, { useEffect, useState } from "react";

const sections = [
  { id: "hero", label: "HERO" },
  { id: "problem", label: "PROBLEM" },
  { id: "how-it-works", label: "HOW IT WORKS" },
  { id: "agents", label: "AGENTS" },
  { id: "live-demo", label: "DEMO" },
  { id: "social-proof", label: "PROOF" },
  { id: "cta", label: "BUILD" },
];

export default function Navbar() {
  const [activeSection, setActiveSection] = useState("hero");

  useEffect(() => {
    const observerOptions = {
      root: null,
      rootMargin: "-40% 0px -40% 0px", // Trigger when center of section is in viewport
      threshold: 0,
    };

    const handleIntersect = (entries: IntersectionObserverEntry[]) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          setActiveSection(entry.target.id);
        }
      });
    };

    const observer = new IntersectionObserver(handleIntersect, observerOptions);

    sections.forEach((sec) => {
      const el = document.getElementById(sec.id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  const handleScroll = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <nav className="fixed top-0 left-0 w-full bg-black border-b border-white z-50 font-sans tracking-widest text-[11px] font-bold">
      <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => handleScroll("hero")}>
          <span className="text-white">AutoResearch AI</span>
          <span className="text-[#f5a623] font-mono">/</span>
          <span className="text-white">POWERED BY GEMINI AI</span>
        </div>

        <div className="hidden md:flex items-center gap-8">
          {sections.map((sec) => (
            <button
              key={sec.id}
              onClick={() => handleScroll(sec.id)}
              className={`transition-colors duration-200 hover:text-[#f5a623] text-left uppercase ${
                activeSection === sec.id ? "text-[#f5a623]" : "text-white"
              }`}
            >
              {sec.label}
            </button>
          ))}
        </div>

        <button
          onClick={() => (window.location.href = "/generate")}
          className="bg-[#f5a623] text-black px-4 py-1.5 hover:bg-white hover:text-black transition-colors duration-200 font-bold border border-[#f5a623]"
        >
          LAUNCH APP
        </button>
      </div>
    </nav>
  );
}
