"use client";

import React, { useEffect } from "react";
import Lenis from "lenis";
import { motion, Variants } from "framer-motion";

// Import Components
import Navbar from "../components/Navbar";
import Cursor from "../components/Cursor";
import Hero from "../components/Hero";
import Problem from "../components/Problem";
import HowItWorks from "../components/HowItWorks";
import Agents from "../components/Agents";
import DemoStrip from "../components/DemoStrip";
import SocialProof from "../components/SocialProof";
import CTASection from "../components/CTASection";

// Motion Variant for hard geometric scroll entry
const sectionVariants: Variants = {
  hidden: { y: -40 },
  visible: {
    y: 0,
    transition: {
      duration: 0.4,
      ease: "easeOut",
    },
  },
};

function AnimatedSection({
  children,
  id,
  className,
}: {
  children: React.ReactNode;
  id: string;
  className?: string;
}) {
  return (
    <motion.div
      id={id}
      className={className}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-150px" }}
      variants={sectionVariants}
    >
      {children}
    </motion.div>
  );
}

export default function Home() {
  // Initialize Lenis smooth scroll on mount
  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: "vertical",
      gestureOrientation: "vertical",
      smoothWheel: true,
    });

    function raf(time: number) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }

    requestAnimationFrame(raf);

    return () => {
      lenis.destroy();
    };
  }, []);

  return (
    <div className="relative min-h-screen bg-black text-white selection:bg-[#f5a623]/30 selection:text-[#f5a623] overflow-hidden">
      {/* Custom Cursor Crosshair */}
      <Cursor />

      {/* Navigation Header */}
      <Navbar />

      {/* Assembled Stark Marketing Sections */}
      <AnimatedSection id="hero">
        <Hero />
      </AnimatedSection>

      <AnimatedSection id="problem">
        <Problem />
      </AnimatedSection>

      <AnimatedSection id="how-it-works">
        <HowItWorks />
      </AnimatedSection>

      <AnimatedSection id="agents">
        <Agents />
      </AnimatedSection>

      <AnimatedSection id="live-demo">
        <DemoStrip />
      </AnimatedSection>

      <AnimatedSection id="social-proof">
        <SocialProof />
      </AnimatedSection>

      <AnimatedSection id="cta">
        <CTASection />
      </AnimatedSection>
    </div>
  );
}
