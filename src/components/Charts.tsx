import React from "react";
import type { RiskLevel } from "../types";

export function SummaryCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="summary-card">
      <p className="eyebrow">{title}</p>
      {children}
    </section>
  );
}

export function Sparkline({
  data,
  tone = "positive",
}: {
  data: number[];
  tone?: "positive" | "negative" | "purple";
}) {
  const points = data
    .map((value, index) => {
      const x = (index / (data.length - 1)) * 120;
      const y = 46 - (value / 60) * 38;
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <svg className={`sparkline sparkline-${tone}`} viewBox="0 0 120 50" preserveAspectRatio="none">
      <polyline
        points={points}
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function Donut({ segments }: { segments: { value: number; level: RiskLevel }[] }) {
  let offset = 25;
  const radius = 17;
  const circumference = 2 * Math.PI * radius;

  return (
    <svg className="donut" viewBox="0 0 44 44">
      <circle cx="22" cy="22" r={radius} className="donut-bg" />
      {segments.map((segment) => {
        const dash = (segment.value / 100) * circumference;
        const item = (
          <circle
            key={`${segment.level}-${offset}`}
            cx="22"
            cy="22"
            r={radius}
            className={`donut-segment ${segment.level}`}
            strokeDasharray={`${dash} ${circumference - dash}`}
            strokeDashoffset={offset}
          />
        );

        offset -= dash;
        return item;
      })}
    </svg>
  );
}

export function RiskRing({ score, level }: { score: number; level: RiskLevel }) {
  const radius = 28;
  const circumference = 2 * Math.PI * radius;
  const dash = (score / 100) * circumference;

  return (
    <div className={`risk-ring risk-${level}`}>
      <svg viewBox="0 0 72 72">
        <circle cx="36" cy="36" r={radius} className="ring-bg" />
        <circle
          cx="36"
          cy="36"
          r={radius}
          className="ring-progress"
          strokeDasharray={`${dash} ${circumference - dash}`}
        />
      </svg>
      <strong>{score}</strong>
    </div>
  );
}
