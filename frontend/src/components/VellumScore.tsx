"use client";

import { motion } from "framer-motion";

interface VellumScoreProps {
  score: number;
  validationScore?: number;
  criticScore?: number;
}

export default function VellumScore({ score, validationScore, criticScore }: VellumScoreProps) {
  const getColor = (s: number) =>
    s >= 7.5 ? "#00e5a0" : s >= 5.5 ? "#ffb347" : "#ff4757";
  const getLabel = (s: number) =>
    s >= 8 ? "Excellent" : s >= 6.5 ? "Good" : s >= 5 ? "Fair" : "Weak";

  const color = getColor(score);
  const radius = 58;
  const circumference = 2 * Math.PI * radius;
  const progress = score / 10;
  const dashOffset = circumference * (1 - progress);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="card-3d glass-card rounded-xl p-6 flex flex-col items-center"
    >
      <h3 className="text-xs font-mono text-zinc-500 uppercase tracking-widest mb-1">
        Vellum Score
      </h3>
      <p className="text-zinc-600 text-[10px] mb-4">
        40% validation + 60% BRD quality
      </p>

      <div className="relative w-40 h-40">
        <svg className="w-full h-full" viewBox="0 0 130 130" style={{ transform: "rotate(-90deg)" }}>
          <circle cx="65" cy="65" r={radius} fill="none" stroke="#27272a" strokeWidth="8" />
          <circle
            cx="65" cy="65" r={radius}
            fill="none" stroke={color} strokeWidth="8" strokeLinecap="round"
            strokeDasharray={circumference} strokeDashoffset={dashOffset}
            style={{ transition: "stroke-dashoffset 1.2s ease-out, stroke 0.4s ease" }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span
            className="text-4xl font-black leading-none"
            style={{ color, textShadow: `0 0 25px ${color}55` }}
          >
            {score.toFixed(1)}
          </span>
          <span className="text-zinc-500 text-[10px] font-mono mt-1">
            {getLabel(score)}
          </span>
        </div>
      </div>

      {/* Score breakdown */}
      <div className="flex gap-6 mt-4 text-xs">
        {validationScore !== undefined && (
          <div className="text-center">
            <p className="text-zinc-500">Validation</p>
            <p className="text-zinc-300 font-bold">{validationScore.toFixed(1)}</p>
          </div>
        )}
        {criticScore !== undefined && (
          <div className="text-center">
            <p className="text-zinc-500">BRD Quality</p>
            <p className="text-zinc-300 font-bold">{criticScore.toFixed(1)}</p>
          </div>
        )}
      </div>
    </motion.div>
  );
}