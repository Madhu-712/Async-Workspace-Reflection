/**
 * @license
 * SPDX-License-Identifier: Apache-2.5
 */

import React, { useState, useEffect } from "react";
import { Sparkles, Terminal, Shield, RefreshCw, Users, HelpCircle, AlertTriangle, Play, BookOpen, Layers } from "lucide-react";
import { io, Socket } from "socket.io-client";
import { WorkspaceTask, TeamSignal, Standup, BurnoutAnalysis, UserProfile } from "./types";
import UserProfilePanel from "./components/UserProfilePanel";
import StandupWidget from "./components/StandupWidget";
import BurnoutHeatmap from "./components/BurnoutHeatmap";
import WorkspaceStream from "./components/WorkspaceStream";
import TeamFeed from "./components/TeamFeed";
import ReflectionJournal from "./components/ReflectionJournal";
import PerformanceDashboard from "./components/PerformanceDashboard";
import { motion, AnimatePresence } from "motion/react";

const DEMO_PERSONAS = [
  { uid: "lead-dev", email: "lead-dev@workspace.io", displayName: "Alex Rivera", role: "Team Lead", icon: "🧠" },
  { uid: "ai-lead", email: "ai-lead@workspace.io", displayName: "Samantha Lee", role: "Developer", icon: "🤖" },
  { uid: "pm-guy", email: "pm@workspace.io", displayName: "Marcus Chen", role: "Product Manager", icon: "🗺️" },
  { uid: "qa-guru", email: "qa@workspace.io", displayName: "Jessica Taylor", role: "QA", icon: "🔍" }
] as const;

export default function App() {
  // Authentication states
  const [token, setToken] = useState<string | null>(localStorage.getItem("async_auth_token"));
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

  // Workspace states
  const [standups, setStandups] = useState<Standup[]>([]);
  const [tasks, setTasks] = useState<WorkspaceTask[]>([]);
  const [signals, setSignals] = useState<TeamSignal[]>([]);
  const [burnout, setBurnout] = useState<BurnoutAnalysis | null>(null);

  // Live Socket.io events
  const [socketEvents, setSocketEvents] = useState<any[]>([]);
  const [socketConnected, setSocketConnected] = useState(false);

  // Init socket and fetch initial state
  useEffect(() => {
    fetchState();

    const socketInstance = io();

    socketInstance.on("connect", () => {
      setSocketConnected(true);
      console.log("[Socket] Connected to backend ws stream");
    });

    socketInstance.on("disconnect", () => {
      setSocketConnected(false);
    });

    socketInstance.on("standup_submitted", (data: Standup) => {
      setSocketEvents(prev => [
        ...prev,
        {
          type: "standup_submitted",
          userName: data.userName,
          message: `Submitted a daily update: "${data.parsedSummary}"`,
          time: Date.now()
        }
      ]);
      fetchState();
    });

    socketInstance.on("task_created", (data: WorkspaceTask) => {
      setSocketEvents(prev => [
        ...prev,
        {
          type: "task_created",
          userName: data.assignee,
          message: `Added actionable item: "${data.title}"`,
          time: Date.now()
        }
      ]);
      fetchState();
    });

    socketInstance.on("task_updated", (data: WorkspaceTask) => {
      fetchState();
    });

    socketInstance.on("blocker_flagged", (data: any) => {
      setSocketEvents(prev => [
        ...prev,
        {
          type: "blocker_flagged",
          userName: data.userName,
          message: `🚨 Blocker flagged: "${data.blocker}"`,
          time: Date.now()
        }
      ]);
      fetchState();
    });

    socketInstance.on("signal_created", (data: TeamSignal) => {
      fetchState();
    });

    socketInstance.on("burnout_updated", (data: BurnoutAnalysis) => {
      setBurnout(data);
    });

    return () => {
      socketInstance.disconnect();
    };
  }, []);

  const fetchState = async () => {
    try {
      const res = await fetch("/api/workspace/state");
      if (!res.ok) throw new Error("Failed to load workspace state");
      const data = await res.json();
      setStandups(data.standups || []);
      setTasks(data.tasks || []);
      setSignals(data.signals || []);
      setBurnout(data.burnout || null);
    } catch (err) {
      console.error("[API] Error fetching initial state:", err);
    }
  };

  const handleLoginDemo = (persona: typeof DEMO_PERSONAS[number]) => {
    // Generate simulated Bearer Token
    const generatedToken = `mock-${persona.uid}:${persona.email}:${persona.displayName}`;
    localStorage.setItem("async_auth_token", generatedToken);
    setToken(generatedToken);
  };

  const handleLogout = () => {
    localStorage.removeItem("async_auth_token");
    setToken(null);
    setUserProfile(null);
  };

  // Callback to insert manual task
  const handleAddTask = async (task: Omit<WorkspaceTask, "id" | "createdAt">) => {
    if (!token) return;
    const res = await fetch("/api/tasks", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(task)
    });
    if (!res.ok) throw new Error("Could not add task");
    await fetchState();
  };

  // Callback to update status
  const handleUpdateTaskStatus = async (taskId: string, status: WorkspaceTask["status"]) => {
    if (!token) return;
    const res = await fetch(`/api/tasks/${taskId}/status`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ status })
    });
    if (!res.ok) throw new Error("Could not update status");
    await fetchState();
  };

  // Callback to broadcast feeling signal
  const handleSendSignal = async (message: string, sentiment: TeamSignal["sentiment"]) => {
    if (!token) return;
    const res = await fetch("/api/signals", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ message, sentiment })
    });
    if (!res.ok) throw new Error("Could not send signal");
    await fetchState();
  };

  // Extract info from token if profile is not fetched yet
  const getSimulatedUser = () => {
    if (!token) return null;
    if (token.startsWith("mock-")) {
      const parts = token.replace("mock-", "").split(":");
      return {
        uid: parts[0],
        email: parts[1],
        displayName: parts[2]
      };
    }
    return null;
  };
  const activeUser = getSimulatedUser();

  // Keep App user profile in sync with active token session
  useEffect(() => {
    if (!token) {
      setUserProfile(null);
      return;
    }
    fetch("/api/profile", {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        if (data && data.uid) {
          setUserProfile(data);
        }
      })
      .catch(err => console.error("Error fetching profile in App:", err));
  }, [token]);

  // If unauthorized, render elegant identity portal
  if (!token) {
    return (
      <div id="auth-portal" className="min-h-screen bg-slate-100 flex flex-col justify-between p-6 sm:p-8 font-sans text-slate-900 overflow-y-auto">
        
        {/* Header */}
        <div className="max-w-7xl mx-auto w-full flex items-center justify-between border-b border-slate-200 pb-4 mb-6">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-indigo-600 text-white rounded-xl shadow-sm">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-lg font-extrabold text-slate-800 tracking-tight">Async Workspace</h1>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Collective Team Health Hub</p>
            </div>
          </div>
          <span className="text-[10px] px-2.5 py-1 bg-indigo-50 text-indigo-600 font-bold rounded-lg border border-indigo-100/40">
            Public Dashboard
          </span>
        </div>

        {/* Dynamic 12-Column Grid Layout */}
        <div className="max-w-7xl mx-auto w-full grid grid-cols-1 md:grid-cols-12 gap-8 items-start my-auto flex-1">
          
          {/* Left Column (7 Columns) - Common Workspace Heatmap & Explanations */}
          <div className="md:col-span-7 space-y-6">
            
            {/* Visual Explanation Banner */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
              <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
                <Users className="w-4 h-4 text-indigo-600" />
                Team Health Architecture
              </h2>
              <p className="text-xs text-slate-500 leading-relaxed">
                Async Workspace promotes psychological safety and workloads balance by presenting live team metrics publicly before individual sessions. By sharing these indicators, team members and coordinators maintain clear transparency without tracking individuals private reflective spaces.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                
                {/* Heatmap Explanation */}
                <div className="bg-slate-50/50 border border-slate-150 p-4 rounded-xl space-y-1.5">
                  <span className="block text-[10px] font-extrabold text-indigo-600 uppercase tracking-wider">
                    1. Workload Heatmap
                  </span>
                  <p className="text-[11px] text-slate-600 leading-relaxed font-medium">
                    Displays cumulative workload densities and capacity loads categorized strictly by professional role. This helps team members dynamically shift responsibilities and resolve blocked items before bottlenecking any single discipline.
                  </p>
                </div>

                {/* Burnout Explanation */}
                <div className="bg-slate-50/50 border border-slate-150 p-4 rounded-xl space-y-1.5">
                  <span className="block text-[10px] font-extrabold text-indigo-600 uppercase tracking-wider">
                    2. Burnout Index
                  </span>
                  <p className="text-[11px] text-slate-600 leading-relaxed font-medium">
                    A privacy-preserving psychological load indicator evaluated continuously from standup completion ratios, unresolved blocker quantities, and shared feeling signals. It flags potential exhaust risks before fatigue manifests physically.
                  </p>
                </div>

              </div>
            </div>

            {/* Public Live Heatmap View */}
            <BurnoutHeatmap
              token={null}
              burnout={burnout}
              tasksCount={tasks.length}
              blockersCount={tasks.filter(t => t.isBlocker && t.status !== "done").length}
            />

            {/* Public Live Team Activity Feed */}
            <TeamFeed
              signals={signals}
              socketEvents={socketEvents}
              token={null}
            />

          </div>

          {/* Right Column (5 Columns) - Identity selection portal */}
          <div className="md:col-span-5 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col gap-5">
            <div>
              <h2 className="text-base font-extrabold text-slate-800">Identity Sandbox Portal</h2>
              <p className="text-xs text-slate-400 mt-1">
                Select your employee role below to securely login to your private workspace, check contributions, submit standups, and write reflection logs.
              </p>
            </div>

            <div className="space-y-2">
              {DEMO_PERSONAS.map(p => (
                <button
                  key={p.uid}
                  id={`btn-auth-${p.uid}`}
                  onClick={() => handleLoginDemo(p)}
                  className="w-full p-3.5 border border-slate-150 rounded-xl hover:border-indigo-400 hover:bg-indigo-50/20 text-left flex items-center justify-between transition-all group cursor-pointer bg-slate-50/50"
                >
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl">{p.icon}</span>
                    <div className="min-w-0">
                      <span className="block text-xs font-bold text-slate-800 group-hover:text-indigo-600 transition-colors truncate">
                        {p.displayName}
                      </span>
                      <span className="block text-[10px] text-slate-400 font-medium truncate">
                        {p.role} &bull; {p.email}
                      </span>
                    </div>
                  </div>
                  <Play className="w-3.5 h-3.5 text-slate-300 group-hover:text-indigo-500 transition-colors shrink-0" />
                </button>
              ))}
            </div>

            <div className="pt-4 border-t border-slate-150 flex items-start space-x-3 bg-slate-50 p-4 rounded-xl border">
              <Shield className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
              <div className="text-[11px] text-slate-500 leading-normal font-medium">
                <strong>Owner-Isolations Enforced:</strong> Private reflection journals are completely isolated and stored matching your personal user identifiers to prevent cross-profile exposure.
              </div>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="max-w-7xl mx-auto w-full text-center text-[10px] text-slate-400 font-semibold uppercase tracking-wider pt-6 border-t border-slate-200/60 mt-6">
          Async Team &bull; Powered by Gemini & Firestore fallbacks
        </div>
      </div>
    );
  }

  const currentDisplayName = userProfile?.displayName || activeUser?.displayName || "Developer";

  return (
    <div className="flex h-screen w-full bg-slate-100 font-sans text-slate-900 overflow-hidden">
      
      {/* Sleek Sidebar Aside */}
      <aside className="w-20 bg-white border-r border-slate-200 flex flex-col items-center py-8 gap-10 shadow-sm shrink-0">
        <div className="w-12 h-12 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-md">
          A
        </div>
        <nav className="flex flex-col gap-6">
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-lg cursor-pointer" title="Dashboard">
            <Layers className="w-6 h-6" />
          </div>
          <div className="p-3 text-slate-400 hover:text-slate-600 cursor-pointer transition-colors" title="Team Stream">
            <Users className="w-6 h-6" />
          </div>
          <div className="p-3 text-slate-400 hover:text-slate-600 cursor-pointer transition-colors" title="Private Journal">
            <BookOpen className="w-6 h-6" />
          </div>
        </nav>
        <div className="mt-auto pb-4 flex flex-col items-center gap-4">
          <div className="relative">
            <div className="w-10 h-10 rounded-full bg-indigo-50 border-2 border-slate-200 flex items-center justify-center font-bold text-indigo-600 shadow-sm text-sm cursor-pointer" title={currentDisplayName}>
              {currentDisplayName.substring(0, 2).toUpperCase()}
            </div>
            <span className="absolute bottom-0 right-0 block h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-white" />
          </div>
        </div>
      </aside>

      {/* Main Content Pane */}
      <main className="flex-1 flex flex-col p-8 gap-6 overflow-y-auto">
        
        {/* Sleek Interface Header */}
        <header className="flex justify-between items-center shrink-0">
          <div>
            <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight">Async Workspace</h1>
            <p className="text-slate-500 text-sm">
              Welcome back, <span className="font-semibold text-indigo-600">{currentDisplayName}</span>. Team productivity is up 12% today.
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={fetchState}
              id="btn-manual-sync"
              className="bg-white border border-slate-200 px-4 py-2 rounded-lg text-sm font-medium shadow-sm flex items-center gap-2 text-slate-700 hover:bg-slate-50 transition-all cursor-pointer"
            >
              <span className={`w-2.5 h-2.5 rounded-full ${socketConnected ? "bg-emerald-500 animate-pulse" : "bg-slate-300"}`}></span>
              Live Stream {socketConnected ? "Connected" : "Disconnected"}
            </button>
            <button
              onClick={handleLogout}
              className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium shadow-sm hover:bg-indigo-700 cursor-pointer transition-colors"
            >
              Sign Out
            </button>
          </div>
        </header>

        {/* 12-Column Grid Layout matching Sleek Interface Design */}
        <div className="flex-1 grid grid-cols-12 gap-6 items-start min-h-0">
          
          {/* Left Grid Section: Performance Summary, Standups, Task Streams (8 Columns) */}
          <div className="col-span-12 lg:col-span-8 flex flex-col gap-6">
            
            <PerformanceDashboard
              token={token!}
              tasksCount={tasks.length}
              standupsCount={standups.length}
              signals={signals}
            />

            <StandupWidget
              token={token}
              onSubmitted={() => fetchState()}
            />

            <WorkspaceStream
              token={token!}
              role={userProfile?.role || "Developer"}
              displayName={currentDisplayName}
              tasks={tasks}
              onAddTask={handleAddTask}
              onUpdateTaskStatus={handleUpdateTaskStatus}
            />

          </div>

          {/* Right Grid Section: Encrypted Guided Journaling (4 Columns) */}
          <div className="col-span-12 lg:col-span-4 flex flex-col gap-6">
            
            <ReflectionJournal
              token={token}
            />

          </div>

        </div>

      </main>
    </div>
  );
}
