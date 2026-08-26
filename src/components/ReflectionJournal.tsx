/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from "react";
import { BookOpen, Sparkles, Send, RefreshCw, Calendar, Eye, HelpCircle, Flame, Trophy } from "lucide-react";
import { JournalEntry } from "../types";
import { motion, AnimatePresence } from "motion/react";

interface ReflectionJournalProps {
  token: string;
}

const TEMPLATES = [
  {
    id: "cognitive_bias",
    title: "Cognitive Bias Explorer",
    icon: "🧠",
    desc: "Examine thoughts for common distortions (catastrophizing, personalization) to find balance.",
    placeholder: "e.g. I failed the API compilation today, so I think I'm a terrible developer and the whole release is going to crash..."
  },
  {
    id: "gratitude",
    title: "Deep Gratitude Practice",
    icon: "🌸",
    desc: "Dig beneath surface-level statements. Focus on sensory details, small comforts, and why they matter.",
    placeholder: "e.g. This morning I sat in complete quiet for 10 minutes with a warm coffee before any Slack pings started..."
  },
  {
    id: "future_challenge",
    title: "Future Challenge Prep",
    icon: "🗺️",
    desc: "Plan for an upcoming stressor: map obstacle triggers, select custom coping tactics, and set micro-goals.",
    placeholder: "e.g. I have a major live demo of our socket stream component with stakeholders tomorrow at 10 AM..."
  },
  {
    id: "boundary_check",
    title: "Boundary & Capacity",
    icon: "🛡️",
    desc: "Reflect on boundaries. Are you over-committing out of guilt or fear of letting down the team?",
    placeholder: "e.g. I said yes to taking on the DevOps deployment pipeline task even though my sprint queue is fully loaded..."
  },
  {
    id: "imposter_syndrome",
    title: "Imposter Syndrome Check",
    icon: "🎭",
    desc: "Acknowledge your progress, separate facts from feelings, and credit your skills for your successes.",
    placeholder: "e.g. I feel like my colleagues are way more advanced with websockets, and they'll eventually find out I struggle with them..."
  },
  {
    id: "work_life",
    title: "Work-Life Boundary",
    icon: "🏡",
    desc: "Reflect on how easily you transition from work to rest. How to create a clear division.",
    placeholder: "e.g. I keep checking Slack on my phone during dinner and thinking about the unresolved Firestore API error..."
  },
  {
    id: "general",
    title: "Freeform Reflection",
    icon: "📝",
    desc: "Open space to capture stream of consciousness, work strain, or celebrating minor release successes.",
    placeholder: "What is on your mind? Take a breath and write honestly..."
  }
] as const;

const QUICK_EXAMPLES = [
  {
    label: "Failed compile stress",
    text: "The server build kept crashing during a demo preview, and I felt immediate panic that my team thinks I'm incompetent.",
    templateId: "cognitive_bias"
  },
  {
    label: "Anxious about presentation",
    text: "I have a major live demo with product coordinators tomorrow at 10 AM. I'm worried about getting put on the spot for missing deadlines.",
    templateId: "future_challenge"
  },
  {
    label: "Guilt saying 'No'",
    text: "I volunteered to fix 4 minor layout bugs in the standby stream even though I'm already primary on the core server refactoring.",
    templateId: "boundary_check"
  },
  {
    label: "Feeling underqualified",
    text: "I feel like my colleagues are way more advanced with database queries, and they'll eventually find out I struggle with optimization.",
    templateId: "imposter_syndrome"
  }
];

export default function ReflectionJournal({ token }: ReflectionJournalProps) {
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [activeTemplate, setActiveTemplate] = useState<typeof TEMPLATES[number]>(TEMPLATES[6]);
  const [inputText, setInputText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedEntry, setSelectedEntry] = useState<JournalEntry | null>(null);

  const historyEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchJournalHistory();
  }, [token]);

  const fetchJournalHistory = async () => {
    try {
      const res = await fetch("/api/journal/history", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error("Failed to load journal entries");
      const data = await res.json();
      setEntries(data);
    } catch (err: any) {
      console.error(err);
    }
  };

  const calculateStreak = (): number => {
    if (!entries || entries.length === 0) return 0;
    
    // Extract unique dates in YYYY-MM-DD local format
    const uniqueDates: string[] = Array.from(new Set(
      entries.map(e => {
        const d = new Date(e.createdAt);
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      })
    )).map(val => String(val)).sort((a, b) => b.localeCompare(a)); // sort descending

    if (uniqueDates.length === 0) return 0;

    const todayStr = (() => {
      const d = new Date();
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    })();

    const yesterdayStr = (() => {
      const d = new Date();
      d.setDate(d.getDate() - 1);
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    })();

    const latestDate = uniqueDates[0];
    if (latestDate !== todayStr && latestDate !== yesterdayStr) {
      return 0;
    }

    let streak = 0;
    let currentDate = new Date(latestDate);
    
    for (let i = 0; i < uniqueDates.length; i++) {
      const dateStr = uniqueDates[i];
      const testStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(currentDate.getDate()).padStart(2, '0')}`;
      
      if (dateStr === testStr) {
        streak++;
        currentDate.setDate(currentDate.getDate() - 1);
      } else {
        break;
      }
    }
    return streak;
  };

  const handleSubmitJournal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || isLoading) return;

    setIsLoading(true);
    setError(null);
    const entryText = inputText;
    setInputText("");

    try {
      const res = await fetch("/api/journal/submit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          text: entryText,
          templateId: activeTemplate.id
        })
      });

      if (!res.ok) throw new Error("Could not process journal. Rate limits or missing config keys.");
      const data: JournalEntry = await res.json();
      setEntries(prev => [data, ...prev]);
      setSelectedEntry(data); // Open instantly to view
    } catch (err: any) {
      setError(err.message || "Failed to submit journal.");
      setInputText(entryText); // Restore
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectTemplate = (tpl: typeof TEMPLATES[number]) => {
    setActiveTemplate(tpl);
    setInputText("");
  };

  const handleApplyExample = (ex: typeof QUICK_EXAMPLES[number]) => {
    const tpl = TEMPLATES.find(t => t.id === ex.templateId) || TEMPLATES[6];
    setActiveTemplate(tpl);
    setInputText(ex.text);
  };

  return (
    <div id="reflection-journal" className="bg-white border border-neutral-200/80 rounded-xl p-5 shadow-sm grid grid-cols-1 lg:grid-cols-12 gap-5 min-h-[500px]">
      
      {/* Templates & Input Form */}
      <div className="lg:col-span-7 flex flex-col justify-between space-y-4">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-neutral-100 flex-wrap gap-2">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-purple-50 text-purple-600 rounded-lg">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-neutral-800 text-sm">Private Reflection Journal</h3>
              <p className="text-xs text-neutral-400">Owner-bound Firestore workspace. Strictly isolated logs.</p>
            </div>
          </div>

          {/* Daily Streak Counter Widget */}
          <div className="flex items-center space-x-1.5 bg-amber-50 border border-amber-200/80 rounded-lg px-2.5 py-1 text-amber-800 font-bold text-xs shadow-2xs">
            <Flame className="w-4 h-4 text-orange-500 fill-orange-500 animate-bounce" />
            <span className="text-[11px] font-black uppercase tracking-wider">
              {calculateStreak()} Day Streak
            </span>
          </div>
        </div>

        {/* Template selectors */}
        <div>
          <span className="block text-[11px] font-bold text-neutral-400 uppercase tracking-wider mb-2">
            Select Guided Reflection Prompt Mode:
          </span>
          <div className="grid grid-cols-2 gap-2">
            {TEMPLATES.map(tpl => {
              const isSelected = activeTemplate.id === tpl.id;
              return (
                <button
                  key={tpl.id}
                  type="button"
                  id={`tpl-btn-${tpl.id}`}
                  onClick={() => handleSelectTemplate(tpl)}
                  className={`p-2.5 rounded-lg border text-left flex flex-col justify-between transition-all ${
                    isSelected
                      ? "bg-purple-50/70 border-purple-200 text-purple-900 ring-2 ring-purple-500/10"
                      : "bg-white border-neutral-200 text-neutral-600 hover:bg-neutral-50"
                  }`}
                >
                  <div className="flex items-center space-x-1.5 mb-1">
                    <span className="text-sm">{tpl.icon}</span>
                    <span className="text-[11px] font-bold">{tpl.title}</span>
                  </div>
                  <p className="text-[10px] text-neutral-400 font-medium leading-normal line-clamp-2">
                    {tpl.desc}
                  </p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Guided prompt instruction */}
        <div className="p-3 bg-neutral-50 rounded-lg border border-neutral-150 text-[11px] text-neutral-500 leading-relaxed flex items-start space-x-2">
          <HelpCircle className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
          <div>
            <strong>How to use this guided template:</strong> Choose the prompt style above, type your thoughts, and click submit. Gemini acts as an empathetic therapist, mapping coping strategies, and logging reflections securely in your Firestore entries collection.
          </div>
        </div>

        {/* Quick Fill Examples */}
        <div className="space-y-1.5">
          <span className="block text-[10px] font-bold text-neutral-400 uppercase tracking-wider">
            💡 Quick-Fill Example Prompts (Click to try):
          </span>
          <div className="flex flex-wrap gap-1.5">
            {QUICK_EXAMPLES.map((ex, idx) => (
              <button
                key={idx}
                type="button"
                id={`btn-quick-ex-${idx}`}
                onClick={() => handleApplyExample(ex)}
                className="px-2.5 py-1 bg-purple-50 hover:bg-purple-150 text-purple-700 hover:text-purple-800 text-[10px] font-semibold rounded-full border border-purple-100/60 transition-all cursor-pointer"
              >
                {ex.label}
              </button>
            ))}
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmitJournal} className="space-y-2.5">
          <div className="relative">
            <textarea
              id="input-journal-text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={activeTemplate.placeholder}
              rows={4}
              required
              className="w-full px-3 py-2.5 text-xs border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 bg-neutral-50/20 placeholder-neutral-400"
            />
            {isLoading && (
              <div className="absolute inset-0 bg-white/70 flex flex-col items-center justify-center rounded-lg text-xs font-semibold text-neutral-500">
                <RefreshCw className="w-6 h-6 animate-spin text-purple-600 mb-1" />
                <span>Gemini is generating guided reflections...</span>
              </div>
            )}
          </div>

          {error && (
            <div className="text-xs text-red-600 font-medium bg-red-50 p-2 rounded-lg border border-red-100">
              {error}
            </div>
          )}

          <div className="flex items-center justify-between">
            <span className="text-[10px] font-medium text-neutral-400">
              Selected prompt mode: <strong>{activeTemplate.title}</strong>
            </span>
            <button
              type="submit"
              id="btn-submit-journal"
              disabled={isLoading || !inputText.trim()}
              className="px-4 py-2 bg-neutral-900 hover:bg-neutral-800 disabled:bg-neutral-300 text-white font-medium text-xs rounded-lg transition-colors flex items-center space-x-1.5 shadow-sm"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Log & Generate Reflection</span>
            </button>
          </div>
        </form>
      </div>

      {/* Historical Entries & Chat feedback view */}
      <div className="lg:col-span-5 bg-neutral-50/50 border border-neutral-100 rounded-xl p-4 flex flex-col justify-between h-[450px] lg:h-auto min-h-0">
        
        {/* Dynamic Inner Tab */}
        <div className="flex-1 overflow-y-auto min-h-0 space-y-3.5 pr-1">
          {selectedEntry ? (
            <motion.div
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-3"
            >
              {/* Back to list button */}
              <button
                onClick={() => setSelectedEntry(null)}
                id="btn-back-to-entries"
                className="text-[10px] font-semibold text-purple-600 hover:text-purple-700 bg-purple-50 hover:bg-purple-100 px-2.5 py-1 rounded"
              >
                ← Back to Log History
              </button>

              <div className="bg-white border border-neutral-150 rounded-lg p-3">
                <span className="block text-[10px] text-neutral-400 font-medium uppercase mb-1">
                  My Entry
                </span>
                <p className="text-[11px] leading-relaxed text-neutral-700 font-medium whitespace-pre-wrap">
                  "{selectedEntry.text}"
                </p>
              </div>

              <div className="bg-purple-50/50 border border-purple-100 rounded-lg p-3">
                <div className="flex items-center space-x-1.5 mb-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                  <span className="text-[10px] text-purple-800 font-bold uppercase tracking-wider">
                    Gemini Empathetic Reflection
                  </span>
                </div>
                <p className="text-[11px] leading-relaxed text-neutral-700 font-medium whitespace-pre-wrap">
                  {selectedEntry.response}
                </p>
              </div>
            </motion.div>
          ) : (
            <div className="space-y-3">
              <span className="block text-[11px] font-bold text-neutral-400 uppercase tracking-wider mb-2">
                Reflection Log History
              </span>

              {entries.length === 0 ? (
                <div className="text-center py-16 text-neutral-400 text-xs font-medium">
                  Your journal entries will appear here. Everything you post is encrypted and restricted to your authenticated user account.
                </div>
              ) : (
                <div className="space-y-2 max-h-[360px] overflow-y-auto pr-1">
                  {entries.map(e => {
                    const icon = TEMPLATES.find(t => t.id === e.templateId)?.icon || "📝";
                    return (
                      <button
                        key={e.id}
                        id={`entry-item-${e.id}`}
                        onClick={() => setSelectedEntry(e)}
                        className="w-full p-2.5 bg-white border border-neutral-200/60 rounded-lg hover:border-purple-300 text-left flex items-center justify-between transition-colors group"
                      >
                        <div className="flex items-center space-x-2.5 min-w-0 flex-1 pr-1">
                          <span className="text-sm shrink-0">{icon}</span>
                          <div className="min-w-0 flex-1">
                            <span className="block text-[11px] font-bold text-neutral-700 truncate">
                              {e.text}
                            </span>
                            <span className="block text-[9px] text-neutral-400 font-normal mt-0.5 flex items-center">
                              <Calendar className="w-3 h-3 mr-0.5" />
                              {new Date(e.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                        <Eye className="w-3.5 h-3.5 text-neutral-300 group-hover:text-purple-500 transition-colors shrink-0" />
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="pt-2 border-t border-neutral-100 text-[9px] text-neutral-400 font-medium text-center">
          Locked under Owner-Bound Firestore Security Rule: <br />
          <code>allow read, write: if request.auth.uid == userId;</code>
        </div>
      </div>

    </div>
  );
}
