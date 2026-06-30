"use client";

import { motion } from "framer-motion";

interface VellumScoreProps {
  score: number;
}

export default function VellumScore({ score }: VellumScoreProps) {
  const color = score >= 7.5 ? "#00e5a0" : score >= 5.5 ? "#ffb347" : "#ff4757";

  return (
    <motion.div
      initial={{ opacity: 0, x: 10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.4 }}
      className="flex items-center gap-2 px-3 py-1.5 rounded-full border"
      style={{ borderColor: color + "40", backgroundColor: color + "10" }}
    >
      <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider">Vellum</span>
      <span className="text-sm font-black" style={{ color }}>
        {score.toFixed(1)}
      </span>
    </motion.div>
  );
}
