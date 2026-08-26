/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { Activity, Flame, ShieldCheck, HelpCircle, RefreshCw, AlertTriangle } from "lucide-react";
import { BurnoutAnalysis } from "../types";
import { motion } from "motion/react";

interface BurnoutHeatmapProps {
  token?: string | null;
  burnout: BurnoutAnalysis | null;
  onRecalculated?: (burnout: BurnoutAnalysis) => void;
  tasksCount: number;
  blockersCount: number;
}

export default function BurnoutHeatmap({ token, burnout, onRecalculated, tasksCount, blockersCount }: BurnoutHeatmapProps) {
  const [isRecalculating, setIsRecalculating] = useState(false);

  const handleRecalculate = async () => {
    if (!token) return;
    setIsRecalculating(true);
    try {
      const res = await fetch("/api/burnout/recalculate", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error("Recalculation failed");
      const data = await res.json();
      if (onRecalculated && data.burnout) {
        onRecalculated(data.burnout);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsRecalculating(false);
    }
  };

  // Safe defaults
  const score = burnout?.burnoutScore ?? 35;
  const riskTier = burnout?.riskTier ?? "Low";
  const driver = burnout?.primaryDriver ?? "Balanced tasks and constructive feedback loops.";

  // Visual mapping
  const riskColors = {
    Low: {
      bg: "bg-emerald-50 text-emerald-700 border-emerald-100",
      pill: "bg-emerald-100 text-emerald-800",
      bar: "bg-emerald-500",
      glow: "shadow-emerald-100",
      accent: "border-emerald-500"
    },
    Medium: {
      bg: "bg-amber-50 text-amber-700 border-amber-100",
      pill: "bg-amber-100 text-amber-800",
      bar: "bg-amber-500",
      glow: "shadow-amber-100",
      accent: "border-amber-500"
    },
    High: {
      bg: "bg-rose-50 text-rose-700 border-rose-100",
      pill: "bg-rose-100 text-rose-800",
      bar: "bg-rose-500",
      glow: "shadow-rose-100",
      accent: "border-rose-500"
    }
  }[riskTier];

  // Grid simulation based on the score to populate specific roles
  const rolesState = [
    { name: "Team Lead", status: score > 70 ? "Overloaded" : score > 40 ? "Elevated" : "Healthy", score: Math.round(score * 1.1) },
    { name: "Developer", status: score > 60 ? "Overloaded" : score > 35 ? "Elevated" : "Healthy", score: Math.round(score * 0.95) },
    { name: "Product Manager", status: score > 50 ? "Overloaded" : score > 30 ? "Elevated" : "Healthy", score: Math.round(score * 0.8) },
    { name: "QA Engineer", status: score > 75 ? "Overloaded" : score > 45 ? "Elevated" : "Healthy", score: Math.round(score * 1.15) },
    { name: "UI/UX Designer", status: score > 65 ? "Overloaded" : score > 35 ? "Elevated" : "Healthy", score: Math.round(score * 0.7) },
    { name: "DevOps Engineer", status: score > 80 ? "Overloaded" : score > 50 ? "Elevated" : "Healthy", score: Math.round(score * 1.2) },
  ];

  return (
    <div id="burnout-heatmap" className="bg-white border border-neutral-200/80 rounded-xl p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-neutral-100">
        <div className="flex items-center space-x-2.5">
          <div className="p-2 bg-rose-50 text-rose-600 rounded-lg">
            <Flame className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-semibold text-neutral-800 text-sm">Burnout & Workload Heatmap</h3>
            <p className="text-xs text-neutral-400">Gemini psychological sentiment & fatigue analysis</p>
          </div>
        </div>
        {token && (
          <button
            onClick={handleRecalculate}
            disabled={isRecalculating}
            id="btn-recalculate-burnout"
            className="px-2.5 py-1.5 bg-neutral-100 hover:bg-neutral-200 disabled:bg-neutral-50 text-neutral-600 disabled:text-neutral-300 font-medium text-xs rounded-lg transition-all flex items-center space-x-1"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRecalculating ? "animate-spin" : ""}`} />
            <span>{isRecalculating ? "Analyzing..." : "Recalculate"}</span>
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
        {/* Metric panel */}
        <div className="md:col-span-5 flex flex-col justify-between space-y-4">
          <div className="bg-neutral-50/60 border border-neutral-100 rounded-xl p-4 flex flex-col items-center justify-center text-center">
            <span className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-1">Burnout Index</span>
            <div className="relative flex items-center justify-center my-2">
              {/* Outer circular indicator glow */}
              <div className={`absolute w-24 h-24 rounded-full border-4 border-dashed border-neutral-100 animate-spin-slow`} />
              <div className="text-3xl font-bold text-neutral-800 z-10 flex items-baseline">
                <span>{score}</span>
                <span className="text-sm font-normal text-neutral-400">/100</span>
              </div>
            </div>
            <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wider border ${riskColors.pill}`}>
              {riskTier} Risk
            </span>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-xs font-medium text-neutral-500">
              <span>Overall Team Health Load</span>
              <span>{score}%</span>
            </div>
            <div className="w-full bg-neutral-100 rounded-full h-2 overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${score}%` }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className={`h-full ${riskColors.bar}`}
              />
            </div>
            <div className="flex justify-between text-[10px] text-neutral-400 font-medium uppercase">
              <span>Low (0-30)</span>
              <span>Medium (31-65)</span>
              <span>High (66-100)</span>
            </div>
          </div>
        </div>

        {/* Primary driver details */}
        <div className="md:col-span-7 flex flex-col justify-between space-y-4">
          <div className={`p-4 rounded-xl border flex flex-col justify-between h-full ${riskColors.bg}`}>
            <div className="flex items-start space-x-2.5">
              <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
              <div>
                <h4 className="font-semibold text-xs uppercase tracking-wider mb-1">Primary Fatigue Driver</h4>
                <p className="text-xs leading-relaxed font-medium">
                  "{driver}"
                </p>
              </div>
            </div>
            <div className="mt-3 pt-3 border-t border-black/5 flex items-center justify-between text-[11px] font-medium opacity-80">
              <span>Active Tasks: <strong>{tasksCount}</strong></span>
              <span>Flagged Blockers: <strong>{blockersCount}</strong></span>
            </div>
          </div>
        </div>
      </div>

      {/* Role heatmap grid */}
      <div className="mt-5">
        <h4 className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider mb-2.5">Team Fatigue Grid (by Role)</h4>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {rolesState.map((role, i) => {
            const roleColor = role.score > 65
              ? { bg: "bg-rose-50 text-rose-700 border-rose-100", label: "Overloaded" }
              : role.score > 35
              ? { bg: "bg-amber-50 text-amber-700 border-amber-100", label: "Elevated" }
              : { bg: "bg-emerald-50 text-emerald-700 border-emerald-100", label: "Healthy" };

            return (
              <motion.div
                key={role.name}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.04 }}
                className={`p-3 rounded-lg border text-left flex flex-col justify-between space-y-1 ${roleColor.bg}`}
              >
                <span className="text-[11px] font-semibold text-neutral-800 line-clamp-1">{role.name}</span>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wide opacity-80">{roleColor.label}</span>
                  <span className="text-xs font-bold">{role.score}%</span>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
