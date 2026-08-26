/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from "react";
import { MessageSquare, Smile, Send, Radio } from "lucide-react";
import { TeamSignal } from "../types";
import { motion, AnimatePresence } from "motion/react";

interface TeamFeedProps {
  signals: TeamSignal[];
  socketEvents: any[];
  token: string | null;
  onSendSignal?: (message: string, sentiment: TeamSignal["sentiment"]) => Promise<void>;
}

export default function TeamFeed({
  signals,
  socketEvents,
  token,
  onSendSignal
}: TeamFeedProps) {
  const [signalMessage, setSignalMessage] = useState("");
  const [signalSentiment, setSignalSentiment] = useState<TeamSignal["sentiment"]>("neutral");
  const [isSubmittingSignal, setIsSubmittingSignal] = useState(false);

  const listEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll feed on new events
  useEffect(() => {
    listEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [socketEvents, signals]);

  const handleSendSignal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signalMessage.trim() || !onSendSignal) return;

    setIsSubmittingSignal(true);
    try {
      await onSendSignal(signalMessage.trim(), signalSentiment);
      setSignalMessage("");
      setSignalSentiment("neutral");
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmittingSignal(false);
    }
  };

  // Aggregate socket and signal events together sorted by time
  const fullFeed = [
    ...signals.map(s => ({
      id: s.id,
      type: "signal",
      user: s.userName,
      text: s.message,
      sentiment: s.sentiment,
      time: s.createdAt
    })),
    ...socketEvents.map((evt, idx) => ({
      id: `evt-${idx}-${evt.time || Date.now()}`,
      type: evt.type,
      user: evt.userName || "System",
      text: evt.message || JSON.stringify(evt.data),
      sentiment: evt.sentiment || "neutral",
      time: evt.time || Date.now()
    }))
  ].sort((a, b) => a.time - b.time); // bottom is newest

  return (
    <div id="team-feed-public" className="bg-white border border-neutral-200/80 rounded-xl p-5 shadow-sm flex flex-col h-[400px]">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-neutral-100">
        <div className="flex items-center space-x-2">
          <div className="relative">
            <div className="p-2 bg-rose-50 text-rose-600 rounded-lg">
              <Radio className="w-5 h-5 animate-pulse" />
            </div>
            <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
          </div>
          <div>
            <h3 className="font-semibold text-neutral-800 text-sm">Live Team Feed</h3>
            <p className="text-xs text-neutral-400">Collaborative activity and status notes stream</p>
          </div>
        </div>
        <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded-md font-bold uppercase tracking-wider">
          Real-time
        </span>
      </div>

      {/* Scroller */}
      <div className="flex-1 overflow-y-auto mb-4 pr-1 min-h-0 border border-neutral-100 rounded-xl bg-neutral-50/50 p-3 space-y-2.5">
        {fullFeed.length === 0 ? (
          <div className="text-center py-12 text-neutral-400 text-xs font-medium">
            No activity logged yet. Join and share!
          </div>
        ) : (
          fullFeed.map((f, idx) => {
            let badgeColor = "bg-neutral-200 text-neutral-800";
            let prefix = "📢";

            if (f.type === "standup_submitted") {
              badgeColor = "bg-emerald-100 text-emerald-800";
              prefix = "📝 Standup";
            } else if (f.type === "task_created") {
              badgeColor = "bg-indigo-100 text-indigo-800";
              prefix = "🆕 Task";
            } else if (f.type === "blocker_flagged") {
              badgeColor = "bg-rose-100 text-rose-800 animate-pulse";
              prefix = "🔥 Blocker Alert";
            } else if (f.sentiment === "positive") {
              badgeColor = "bg-emerald-50 text-emerald-700";
              prefix = "😊 Feeling Good";
            } else if (f.sentiment === "negative") {
              badgeColor = "bg-rose-50 text-rose-700";
              prefix = "😫 Stressed";
            } else if (f.type === "signal") {
              badgeColor = "bg-neutral-100 text-neutral-700";
              prefix = "💭 Status Note";
            }

            return (
              <motion.div
                key={f.id}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white border border-neutral-200/60 rounded-lg p-2.5 shadow-2xs text-xs flex flex-col space-y-1"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-neutral-800">{f.user}</span>
                  <span className={`px-1.5 py-0.3 rounded text-[9px] font-bold uppercase tracking-wider ${badgeColor}`}>
                    {prefix}
                  </span>
                </div>
                <p className="text-neutral-600 font-medium leading-relaxed">{f.text}</p>
                <span className="text-[9px] text-neutral-400 self-end">
                  {new Date(f.time).toLocaleTimeString()}
                </span>
              </motion.div>
            );
          })
        )}
        <div ref={listEndRef} />
      </div>

      {/* Send Message Form if Logged In */}
      {token && onSendSignal && (
        <form onSubmit={handleSendSignal} className="flex flex-col gap-2 p-3 bg-neutral-50 rounded-xl border border-neutral-100">
          <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Broadcast Team Note</span>
          <div className="flex gap-2">
            <input
              type="text"
              value={signalMessage}
              onChange={(e) => setSignalMessage(e.target.value)}
              placeholder="Share updates or feedback with the team..."
              className="flex-1 px-3 py-1.5 text-xs border border-neutral-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white"
            />
            <button
              type="submit"
              disabled={isSubmittingSignal || !signalMessage.trim()}
              className="px-3 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg flex items-center justify-center transition-colors shrink-0"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="text-[10px] text-neutral-400 font-medium">My Sentiment:</span>
            {(["positive", "neutral", "negative"] as const).map(s => (
              <button
                key={s}
                type="button"
                onClick={() => setSignalSentiment(s)}
                className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase transition-all ${
                  signalSentiment === s
                    ? s === "positive"
                      ? "bg-emerald-100 text-emerald-800"
                      : s === "negative"
                      ? "bg-rose-100 text-rose-800"
                      : "bg-neutral-200 text-neutral-800"
                    : "bg-white border border-neutral-200 text-neutral-400 hover:text-neutral-600"
                }`}
              >
                {s === "positive" ? "😊 Good" : s === "negative" ? "😫 Stressed" : "😐 Okay"}
              </button>
            ))}
          </div>
        </form>
      )}
    </div>
  );
}
