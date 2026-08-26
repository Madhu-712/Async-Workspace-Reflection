/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { Award, Briefcase, TrendingUp, CheckCircle, Sparkles, Activity, Calendar, ShieldCheck, Clock, Smile } from "lucide-react";
import { motion } from "motion/react";
import { TeamSignal } from "../types";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip
} from "recharts";

interface PerformanceDashboardProps {
  token: string;
  tasksCount: number;
  standupsCount: number;
  signals?: TeamSignal[];
}

interface MemberPerformance {
  uid: string;
  name: string;
  role: string;
  avatarUrl: string;
  exp: string;
  currentProject: string;
  dob: string;
  doj: string;
  performanceScore: number; // 0-100
  qualityScore: number; // 0-100
  deliverySpeed: number; // 0-100
  projects: { name: string; progress: number; roleInProject: string }[];
  contributions: { type: string; count: number; label: string }[];
  highlights: string[];
}

const PERFORMANCE_DATA: MemberPerformance[] = [
  {
    uid: "lead-dev",
    name: "Alex Rivera",
    role: "Team Lead & Lead Architect",
    avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
    exp: "8.5 Years",
    currentProject: "Phoenix-Core Integration & Secure Row-Isolation",
    dob: "June 14, 1991",
    doj: "April 12, 2018",
    performanceScore: 94,
    qualityScore: 96,
    deliverySpeed: 91,
    projects: [
      { name: "Phoenix-Core Integration", progress: 85, roleInProject: "Lead Architect" },
      { name: "Firestore Row-Isolation Sync", progress: 100, roleInProject: "Security Engineer" }
    ],
    contributions: [
      { type: "Commits", count: 48, label: "Core changes committed" },
      { type: "Tasks Done", count: 18, label: "Sprint backlogs closed" },
      { type: "Blockers Resolved", count: 5, label: "Systemic blocks cleared" }
    ],
    highlights: [
      "Secured Firestore path schemas for multi-tenant data isolations.",
      "Successfully integrated Socket.io broadcast systems with zero connection memory leaks.",
      "Maintains outstanding code quality score of 96%."
    ]
  },
  {
    uid: "ai-lead",
    name: "Samantha Lee",
    role: "Senior AI Developer",
    avatarUrl: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80",
    exp: "5.2 Years",
    currentProject: "Gemini Standup Parsing Engine & Sentiment Heatmaps",
    dob: "November 23, 1995",
    doj: "September 08, 2021",
    performanceScore: 91,
    qualityScore: 89,
    deliverySpeed: 94,
    projects: [
      { name: "Gemini Standup Parsing Engine", progress: 95, roleInProject: "AI Specialist" },
      { name: "Automated Sentiment Heatmaps", progress: 70, roleInProject: "Data Modeler" }
    ],
    contributions: [
      { type: "API Requests", count: 120, label: "Gemini requests routed" },
      { type: "Tasks Done", count: 14, label: "AI schema backlogs closed" },
      { type: "Standups Logged", count: 8, label: "Daily updates summarized" }
    ],
    highlights: [
      "Configured robust primary-to-fallback model ladders for Gemini resilience.",
      "Tuned the responseSchema models to retrieve reliable JSON structures.",
      "Pioneered psychological team fatigue analysis metrics."
    ]
  },
  {
    uid: "pm-guy",
    name: "Marcus Chen",
    role: "Senior Product Manager",
    avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
    exp: "7.0 Years",
    currentProject: "Async Team Workspace Portal & Sleek Redesign",
    dob: "March 11, 1993",
    doj: "January 15, 2020",
    performanceScore: 88,
    qualityScore: 92,
    deliverySpeed: 85,
    projects: [
      { name: "Async Team Workspace Portal", progress: 90, roleInProject: "Product Owner" },
      { name: "Sleek Interface Redesign", progress: 100, roleInProject: "Design Coordinator" }
    ],
    contributions: [
      { type: "Stories Defined", count: 22, label: "User scenarios mapped" },
      { type: "Stakeholder Reviews", count: 6, label: "Live workspace feedback logs" },
      { type: "Tasks Done", count: 11, label: "Product stories verified" }
    ],
    highlights: [
      "Spearheaded structural definitions for multi-tenant collaborative state syncs.",
      "Managed the elegant visual transition to the Sleek Interface theme.",
      "Kept backlog blockers clearly prioritized for prompt developer resolutions."
    ]
  },
  {
    uid: "qa-guru",
    name: "Jessica Taylor",
    role: "Lead QA Engineer",
    avatarUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80",
    exp: "6.1 Years",
    currentProject: "Phoenix-Core Stress Tests & Socket Sync Monitors",
    dob: "August 04, 1994",
    doj: "October 10, 2020",
    performanceScore: 95,
    qualityScore: 98,
    deliverySpeed: 92,
    projects: [
      { name: "Phoenix-Core Stress Tests", progress: 100, roleInProject: "QA Specialist" },
      { name: "WebSocket Connection Monitors", progress: 80, roleInProject: "Security Tester" }
    ],
    contributions: [
      { type: "Bugs Found", count: 32, label: "Vulnerabilities logged" },
      { type: "Test Suites Ran", count: 15, label: "Automation runs initiated" },
      { type: "Tasks Done", count: 19, label: "Test configurations passed" }
    ],
    highlights: [
      "Uncovered critical websocket connection leak anomalies on hot module reloads.",
      "Maintains flawless 98% quality rating across testing cycles.",
      "Verified dual-mode local and cloud-hosted data fallback integrity."
    ]
  }
];

export default function PerformanceDashboard({ token, tasksCount, standupsCount, signals = [] }: PerformanceDashboardProps) {
  
  // Past 7 Days Sentiment Calculation
  const getSentimentTrendData = () => {
    const days = [];
    const now = new Date();
    
    // Create last 7 days buckets (e.g. "Aug 20")
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(now.getDate() - i);
      const label = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
      const dateStr = d.toDateString(); // To compare with signals
      days.push({ label, dateStr, positive: 0, neutral: 0, negative: 0, count: 0 });
    }

    // Populate counts based on signal dates
    signals.forEach(sig => {
      const sigDate = new Date(sig.createdAt).toDateString();
      const bucket = days.find(day => day.dateStr === sigDate);
      if (bucket) {
        bucket.count++;
        if (sig.sentiment === "positive") bucket.positive++;
        else if (sig.sentiment === "negative") bucket.negative++;
        else bucket.neutral++;
      }
    });

    // Calculate aggregated score (0-100) per day
    return days.map(day => {
      let score = 50; // Neutral baseline default
      if (day.count > 0) {
        const weightedSum = (day.positive * 100) + (day.neutral * 50) + (day.negative * 0);
        score = Math.round(weightedSum / day.count);
      }
      return {
        name: day.name || day.label,
        "Sentiment Score": score,
        "Signals Count": day.count
      };
    });
  };

  const trendData = getSentimentTrendData();

  // Resolve current logged-in employee from token
  const getActiveUid = () => {
    if (!token) return "lead-dev";
    if (token.startsWith("mock-")) {
      const parts = token.replace("mock-", "").split(":");
      return parts[0];
    }
    return "lead-dev";
  };

  const activeUid = getActiveUid();
  const activeMember = PERFORMANCE_DATA.find(m => m.uid === activeUid) || PERFORMANCE_DATA[0];

  // Adjust contributions dynamically based on user interaction levels
  const getDynamicContributions = (member: MemberPerformance) => {
    if (member.uid === "lead-dev" && tasksCount > 0) {
      return member.contributions.map(c => {
        if (c.type === "Tasks Done") {
          return { ...c, count: c.count + tasksCount };
        }
        return c;
      });
    }
    if (member.uid === "ai-lead" && standupsCount > 0) {
      return member.contributions.map(c => {
        if (c.type === "Standups Logged") {
          return { ...c, count: c.count + standupsCount };
        }
        return c;
      });
    }
    return member.contributions;
  };

  const dynamicContribs = getDynamicContributions(activeMember);

  // Score tier styles
  const getScoreColor = (score: number) => {
    if (score >= 93) return { text: "text-emerald-600", bg: "bg-emerald-50 border-emerald-100/80", bar: "bg-emerald-500" };
    if (score >= 90) return { text: "text-indigo-600", bg: "bg-indigo-50 border-indigo-100/80", bar: "bg-indigo-500" };
    return { text: "text-amber-600", bg: "bg-amber-50 border-amber-100/80", bar: "bg-amber-500" };
  };

  const scoreMeta = getScoreColor(activeMember.performanceScore);

  return (
    <div id="performance-dashboard" className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col gap-5">
      
      {/* Title Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-100 shrink-0">
        <div className="flex items-center space-x-2.5">
          <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
            <Award className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-800 text-sm">Your Performance & Contribution Profile</h3>
            <p className="text-xs text-slate-500">Live individual scoring, professional stats & system logging</p>
          </div>
        </div>
        <span className="text-[10px] px-2 py-1 bg-indigo-50 text-indigo-600 font-bold rounded-md uppercase tracking-wider flex items-center space-x-1">
          <Sparkles className="w-3 h-3" />
          <span>Active Session</span>
        </span>
      </div>

      {/* NEW: Professional Summary Card */}
      <div className="p-4 bg-slate-50 border border-slate-150 rounded-xl flex flex-col sm:flex-row gap-4 items-center sm:items-start">
        
        {/* Profile photo using standard image with referrerPolicy */}
        <div className="relative shrink-0">
          <img
            src={activeMember.avatarUrl}
            alt={activeMember.name}
            referrerPolicy="no-referrer"
            className="w-20 h-20 rounded-xl object-cover border-2 border-white shadow-md"
          />
          <div className="absolute -bottom-1.5 -right-1.5 bg-indigo-600 text-white p-1 rounded-lg shadow-sm">
            <ShieldCheck className="w-4 h-4" />
          </div>
        </div>

        {/* Detailed stats */}
        <div className="flex-1 text-center sm:text-left space-y-1.5 min-w-0">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
            <h4 className="text-base font-bold text-slate-800 leading-none">{activeMember.name}</h4>
            <span className="px-2 py-0.5 bg-indigo-50 text-indigo-600 rounded-full text-[10px] font-bold self-center sm:self-auto shrink-0 border border-indigo-100/50">
              {activeMember.role}
            </span>
          </div>

          <p className="text-xs text-slate-600 font-medium leading-relaxed">
            <span className="text-slate-400 font-bold uppercase text-[9px] tracking-wider block">Current Project:</span>
            {activeMember.currentProject}
          </p>

          {/* Metadata Grid */}
          <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-200 text-[10px] text-slate-500 font-semibold uppercase tracking-wider">
            <div>
              <span className="text-slate-400 font-bold block text-[8px]">Experience</span>
              <span className="text-slate-700 flex items-center gap-1 mt-0.5"><Clock className="w-3 h-3 text-indigo-500 shrink-0" /> {activeMember.exp}</span>
            </div>
            <div>
              <span className="text-slate-400 font-bold block text-[8px]">Date of Birth</span>
              <span className="text-slate-700 flex items-center gap-1 mt-0.5"><Calendar className="w-3 h-3 text-indigo-500 shrink-0" /> {activeMember.dob}</span>
            </div>
            <div>
              <span className="text-slate-400 font-bold block text-[8px]">Date of Joining</span>
              <span className="text-slate-700 flex items-center gap-1 mt-0.5"><Calendar className="w-3 h-3 text-indigo-500 shrink-0" /> {activeMember.doj}</span>
            </div>
          </div>
        </div>

      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-start">
        
        {/* Metric Cards (5 Columns) */}
        <div className="md:col-span-5 flex flex-col gap-4">
          
          {/* Main Performance score */}
          <div className={`p-4 rounded-xl border flex flex-col items-center justify-center text-center ${scoreMeta.bg}`}>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Performance Index</span>
            <div className="text-3xl font-black text-slate-800 my-1 flex items-baseline">
              <span>{activeMember.performanceScore}</span>
              <span className="text-sm font-normal text-slate-400">/100</span>
            </div>
            <p className="text-[10px] text-slate-500 font-medium">Sprint velocity and validation scoring metrics</p>
          </div>

          {/* Speed & Quality Sub metrics */}
          <div className="space-y-3 bg-slate-50/60 border border-slate-100 rounded-xl p-4">
            
            {/* Delivery quality */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-[11px] font-bold text-slate-600">
                <span className="flex items-center gap-1">
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-500" /> Quality Assurance
                </span>
                <span>{activeMember.qualityScore}%</span>
              </div>
              <div className="w-full bg-slate-200/80 rounded-full h-1.5 overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${activeMember.qualityScore}%` }}
                  className="h-full bg-emerald-500"
                />
              </div>
            </div>

            {/* Speed */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-[11px] font-bold text-slate-600">
                <span className="flex items-center gap-1">
                  <TrendingUp className="w-3.5 h-3.5 text-indigo-500" /> Delivery Velocity
                </span>
                <span>{activeMember.deliverySpeed}%</span>
              </div>
              <div className="w-full bg-slate-200/80 rounded-full h-1.5 overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${activeMember.deliverySpeed}%` }}
                  className="h-full bg-indigo-500"
                />
              </div>
            </div>

          </div>

        </div>

        {/* Detailed Projects & Contributions Panel (7 Columns) */}
        <div className="md:col-span-7 flex flex-col gap-4">
          
          {/* Active Projects Worked */}
          <div className="bg-slate-50/40 border border-slate-150 rounded-xl p-4">
            <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center">
              <Briefcase className="w-3.5 h-3.5 mr-1.5 text-slate-500" />
              Active Projects Worked ({activeMember.projects.length})
            </h4>
            <div className="space-y-3">
              {activeMember.projects.map((proj, idx) => (
                <div key={idx} className="bg-white border border-slate-200/80 rounded-lg p-3 text-xs">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-bold text-slate-800">{proj.name}</span>
                    <span className="px-1.5 py-0.5 bg-slate-100 text-slate-500 rounded text-[9px] font-bold">
                      {proj.roleInProject}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2.5">
                    <div className="flex-1 bg-slate-100 rounded-full h-1.5 overflow-hidden">
                      <div className="bg-indigo-600 h-full rounded-full" style={{ width: `${proj.progress}%` }} />
                    </div>
                    <span className="text-[10px] font-bold text-slate-500">{proj.progress}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Highlighted Contributions */}
          <div className="bg-slate-50/40 border border-slate-150 rounded-xl p-4">
            <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center">
              <TrendingUp className="w-3.5 h-3.5 mr-1.5 text-slate-500" />
              Aggregate Contributions Breakdown
            </h4>
            <div className="grid grid-cols-3 gap-2.5">
              {dynamicContribs.map((c, idx) => (
                <div key={idx} className="bg-white border border-slate-200 rounded-lg p-2.5 text-center flex flex-col justify-between">
                  <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">{c.type}</span>
                  <span className="block text-xl font-black text-slate-800 my-1">{c.count}</span>
                  <span className="block text-[9px] text-slate-500 leading-normal line-clamp-1">{c.label}</span>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>

      {/* 7-Day Sentiment Trend Chart Block */}
      <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-4">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
            <Smile className="w-4 h-4 text-indigo-500" />
            7-Day Aggregate Team Sentiment Trend
          </h4>
          <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">
            Index: 0 (Stressed) to 100 (Positive)
          </span>
        </div>
        <div className="h-[180px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={trendData} margin={{ top: 5, right: 10, left: -25, bottom: 0 }}>
              <defs>
                <linearGradient id="colorSentiment" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2}/>
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0.01}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
              <XAxis 
                dataKey="name" 
                tick={{ fontSize: 10, fill: '#64748b', fontWeight: 'bold' }} 
                axisLine={false} 
                tickLine={false} 
              />
              <YAxis 
                domain={[0, 100]} 
                ticks={[0, 25, 50, 75, 100]} 
                tick={{ fontSize: 10, fill: '#64748b', fontWeight: 'bold' }} 
                axisLine={false} 
                tickLine={false} 
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#ffffff', 
                  border: '1px solid #e2e8f0', 
                  borderRadius: '8px', 
                  fontSize: '11px',
                  boxShadow: '0 1px 2px 0 rgba(0,0,0,0.05)'
                }}
              />
              <Area 
                type="monotone" 
                dataKey="Sentiment Score" 
                stroke="#6366f1" 
                strokeWidth={2} 
                fillOpacity={1} 
                fill="url(#colorSentiment)" 
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Key workspace Highlights */}
      <div className="p-4 bg-indigo-50/40 border border-indigo-100/80 rounded-xl">
        <h4 className="text-[11px] font-bold text-indigo-800 uppercase tracking-wider mb-2 flex items-center">
          <Activity className="w-3.5 h-3.5 mr-1.5" />
          Active sprint accomplishments & contributions log
        </h4>
        <ul className="space-y-1.5">
          {activeMember.highlights.map((h, idx) => (
            <li key={idx} className="text-xs text-slate-600 font-medium flex items-start">
              <span className="text-indigo-500 mr-2 shrink-0">✦</span>
              <span>{h}</span>
            </li>
          ))}
        </ul>
      </div>

    </div>
  );
}
