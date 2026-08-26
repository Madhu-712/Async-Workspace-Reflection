/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { Send, FileText, CheckCircle, AlertOctagon, HelpCircle } from "lucide-react";
import { motion } from "motion/react";

interface StandupWidgetProps {
  token: string;
  onSubmitted?: () => void;
}

const STANDUP_TEMPLATES = [
  {
    label: "💻 Frontend Dev",
    done: "Refactored user dashboard components, integrated Lucide-react icons, and optimized responsive layouts.",
    planned: "Integrate websocket listeners for the live stream and test mobile viewports.",
    blocker: "Awaiting Figma updates for the performance dashboard design."
  },
  {
    label: "⚙️ Backend API",
    done: "Created PostgreSQL schema adapters, implemented express routes, and configured route authentication.",
    planned: "Write integration tests for workspace task assignment and implement a background cron cleanup loop.",
    blocker: ""
  },
  {
    label: "🧪 QA Automation",
    done: "Wrote regression test suites for standup submission parsing and tested permission validation flows.",
    planned: "Automate cross-browser layout verification and write synthetic latency load tests.",
    blocker: "Temporary rate limit issues on the test cluster API endpoints."
  }
];

export default function StandupWidget({ token, onSubmitted }: StandupWidgetProps) {
  const [doneToday, setDoneToday] = useState("");
  const [plannedToday, setPlannedToday] = useState("");
  const [blockers, setBlockers] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState<{ success?: boolean; message?: string } | null>(null);

  const applyTemplate = (tpl: typeof STANDUP_TEMPLATES[number]) => {
    setDoneToday(tpl.done);
    setPlannedToday(tpl.planned);
    setBlockers(tpl.blocker);
    setStatus(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!doneToday.trim() || !plannedToday.trim()) {
      setStatus({ success: false, message: "Please complete both Done Today and Planned Today." });
      return;
    }

    setIsSubmitting(true);
    setStatus(null);

    try {
      const res = await fetch("/api/standup/submit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          doneToday,
          plannedToday,
          blockers: blockers || "None"
        })
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Failed to submit standup");
      }

      const result = await res.json();
      setStatus({
        success: true,
        message: `Standup parsed! Gemini identified ${result.generatedTasks?.length || 0} actionable items.`
      });

      // Clear input fields
      setDoneToday("");
      setPlannedToday("");
      setBlockers("");

      if (onSubmitted) {
        onSubmitted();
      }
    } catch (err: any) {
      setStatus({ success: false, message: err.message || "An unexpected error occurred." });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div id="standup-widget" className="bg-white border border-neutral-200/80 rounded-xl p-5 shadow-sm">
      <div className="flex items-center space-x-2.5 mb-4 pb-3 border-b border-neutral-100">
        <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
          <FileText className="w-5 h-5" />
        </div>
        <div>
          <h3 className="font-semibold text-neutral-800 text-sm">Submit Async Standup</h3>
          <p className="text-xs text-neutral-400">Gemini automatically parses tasks and extracts blockers</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Quick Fill Standup Badges */}
        <div className="space-y-1.5 p-3 bg-neutral-50/50 rounded-xl border border-neutral-150">
          <span className="block text-[10px] font-bold text-neutral-400 uppercase tracking-wider">
            💡 Quick-Fill Standup Examples:
          </span>
          <div className="flex flex-wrap gap-1.5">
            {STANDUP_TEMPLATES.map((tpl, idx) => (
              <button
                key={idx}
                type="button"
                id={`btn-standup-tpl-${idx}`}
                onClick={() => applyTemplate(tpl)}
                className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-[10px] font-bold rounded-full border border-emerald-100/60 transition-all cursor-pointer"
              >
                {tpl.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-1 flex items-center">
            <CheckCircle className="w-3.5 h-3.5 mr-1 text-emerald-500" />
            What did you accomplish today?
          </label>
          <textarea
            id="input-done-today"
            value={doneToday}
            onChange={(e) => setDoneToday(e.target.value)}
            required
            rows={2}
            className="w-full px-3 py-2 text-sm border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-neutral-50/30 placeholder-neutral-400 resize-none"
            placeholder="e.g. Wrote user profiles endpoints, tested authentication filters"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-1 flex items-center">
            <Send className="w-3.5 h-3.5 mr-1 text-blue-500" />
            What is your plan for tomorrow / today?
          </label>
          <textarea
            id="input-planned-today"
            value={plannedToday}
            onChange={(e) => setPlannedToday(e.target.value)}
            required
            rows={2}
            className="w-full px-3 py-2 text-sm border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-neutral-50/30 placeholder-neutral-400 resize-none"
            placeholder="e.g. Deploy rules configuration, start Socket.io listeners"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-1 flex items-center">
            <AlertOctagon className="w-3.5 h-3.5 mr-1 text-red-500" />
            Are there any blockers? (Optional)
          </label>
          <input
            type="text"
            id="input-blockers"
            value={blockers}
            onChange={(e) => setBlockers(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-neutral-50/30 placeholder-neutral-400"
            placeholder="e.g. Awaiting client Firestore authorization keys, rate limits on API"
          />
        </div>

        {status && (
          <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            className={`p-3 rounded-lg text-xs font-medium flex items-start space-x-2 ${
              status.success ? "bg-emerald-50 text-emerald-700 border border-emerald-100" : "bg-red-50 text-red-700 border border-red-100"
            }`}
          >
            <div className="mt-0.5">
              {status.success ? <CheckCircle className="w-4 h-4" /> : <AlertOctagon className="w-4 h-4" />}
            </div>
            <span className="flex-1">{status.message}</span>
          </motion.div>
        )}

        <button
          type="submit"
          id="btn-submit-standup"
          disabled={isSubmitting || !doneToday.trim() || !plannedToday.trim()}
          className="w-full py-2.5 bg-neutral-950 hover:bg-neutral-800 disabled:bg-neutral-300 text-white font-medium text-xs rounded-lg transition-colors flex items-center justify-center space-x-1.5 shadow-sm"
        >
          {isSubmitting ? (
            <>
              <RefreshCwSpinner />
              <span>Analyzing update with Gemini...</span>
            </>
          ) : (
            <>
              <Send className="w-3.5 h-3.5" />
              <span>Submit & Parse Update</span>
            </>
          )}
        </button>
      </form>
    </div>
  );
}

function RefreshCwSpinner() {
  return (
    <svg className="animate-spin h-3.5 w-3.5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
  );
}
