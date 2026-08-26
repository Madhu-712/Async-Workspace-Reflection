/**
 * @license
 * SPDX-License-Identifier: Apache-2.5
 */

import React, { useState } from "react";
import { CheckSquare, Plus, AlertCircle, Sparkles, Filter, Briefcase, CheckCircle, Clock } from "lucide-react";
import { WorkspaceTask } from "../types";
import { motion, AnimatePresence } from "motion/react";

interface WorkspaceStreamProps {
  token: string;
  role: string;
  displayName: string;
  tasks: WorkspaceTask[];
  onAddTask: (task: Omit<WorkspaceTask, "id" | "createdAt">) => Promise<void>;
  onUpdateTaskStatus: (taskId: string, status: WorkspaceTask["status"]) => Promise<void>;
}

export default function WorkspaceStream({
  token,
  role,
  displayName,
  tasks,
  onAddTask,
  onUpdateTaskStatus
}: WorkspaceStreamProps) {
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskIsBlocker, setNewTaskIsBlocker] = useState(false);
  const [activeFilter, setActiveFilter] = useState<"relevant" | "blockers" | "all">("relevant");
  const [isSubmittingTask, setIsSubmittingTask] = useState(false);

  // Helper to check work relevance
  const isTaskRelevant = (task: WorkspaceTask) => {
    // 1. If assigned directly to user or their role
    const nameMatch = task.assignee.toLowerCase().includes(displayName.toLowerCase());
    const roleMatch = task.assignee.toLowerCase().includes(role.toLowerCase());
    if (nameMatch || roleMatch) return true;

    // 2. Keyword association matching professional roles
    const title = task.title.toLowerCase();
    const userRole = role.toLowerCase();

    if (userRole.includes("lead")) {
      return (
        title.includes("architect") ||
        title.includes("lead") ||
        title.includes("coordinate") ||
        title.includes("sprint") ||
        title.includes("deploy") ||
        title.includes("permission") ||
        title.includes("security") ||
        title.includes("review") ||
        title.includes("gcp") ||
        task.isBlocker
      );
    }
    if (userRole.includes("dev") || userRole.includes("engineer")) {
      return (
        title.includes("code") ||
        title.includes("dev") ||
        title.includes("api") ||
        title.includes("git") ||
        title.includes("database") ||
        title.includes("refactor") ||
        title.includes("ui") ||
        title.includes("bug") ||
        title.includes("latency") ||
        title.includes("service")
      );
    }
    if (userRole.includes("product") || userRole.includes("pm")) {
      return (
        title.includes("pm") ||
        title.includes("spec") ||
        title.includes("roadmap") ||
        title.includes("backlog") ||
        title.includes("user story") ||
        title.includes("timeline") ||
        title.includes("analytics") ||
        title.includes("requirements")
      );
    }
    if (userRole.includes("qa") || userRole.includes("test")) {
      return (
        title.includes("test") ||
        title.includes("qa") ||
        title.includes("bug") ||
        title.includes("fail") ||
        title.includes("regression") ||
        title.includes("validate") ||
        title.includes("automation") ||
        title.includes("verify")
      );
    }
    if (userRole.includes("design")) {
      return (
        title.includes("design") ||
        title.includes("ui") ||
        title.includes("ux") ||
        title.includes("figma") ||
        title.includes("css") ||
        title.includes("typography") ||
        title.includes("colors")
      );
    }

    return false;
  };

  // Filter tasks list
  const filteredTasks = tasks.filter(task => {
    if (activeFilter === "blockers") return task.isBlocker;
    if (activeFilter === "relevant") return isTaskRelevant(task);
    return true; // "all"
  });

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;

    setIsSubmittingTask(true);
    try {
      await onAddTask({
        title: newTaskTitle.trim(),
        assignee: displayName, // Auto-assign to current logged in member
        status: "todo",
        isBlocker: newTaskIsBlocker
      });
      setNewTaskTitle("");
      setNewTaskIsBlocker(false);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmittingTask(false);
    }
  };

  return (
    <div id="workspace-stream" className="bg-white border border-neutral-200/80 rounded-xl p-5 shadow-sm flex flex-col h-[520px]">
      
      {/* Dynamic Workspace Stream Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-neutral-100">
        <div className="flex items-center space-x-2.5">
          <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
            <Briefcase className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-neutral-800 text-sm">Actionable Workspace Tasks</h3>
            <p className="text-xs text-neutral-400">Intelligently filtered by role &bull; <span className="font-semibold text-indigo-600">{role}</span></p>
          </div>
        </div>

        {/* Tab Filters */}
        <div className="flex bg-neutral-100 p-0.5 rounded-lg self-start sm:self-center">
          <button
            onClick={() => setActiveFilter("relevant")}
            id="filter-relevant"
            className={`px-2.5 py-1 text-[11px] font-bold rounded-md transition-all flex items-center space-x-1 ${
              activeFilter === "relevant" ? "bg-white text-indigo-600 shadow-2xs" : "text-neutral-500 hover:text-neutral-800"
            }`}
          >
            <Sparkles className="w-3 h-3" />
            <span>My Role ({tasks.filter(isTaskRelevant).length})</span>
          </button>
          <button
            onClick={() => setActiveFilter("blockers")}
            id="filter-blockers"
            className={`px-2.5 py-1 text-[11px] font-bold rounded-md transition-all flex items-center space-x-1 ${
              activeFilter === "blockers" ? "bg-white text-rose-600 shadow-2xs" : "text-neutral-500 hover:text-neutral-800"
            }`}
          >
            <AlertCircle className="w-3 h-3 text-rose-500" />
            <span>Blockers ({tasks.filter(t => t.isBlocker).length})</span>
          </button>
          <button
            onClick={() => setActiveFilter("all")}
            id="filter-all"
            className={`px-2.5 py-1 text-[11px] font-bold rounded-md transition-all ${
              activeFilter === "all" ? "bg-white text-neutral-800 shadow-2xs" : "text-neutral-500 hover:text-neutral-800"
            }`}
          >
            <span>Team Backlog ({tasks.length})</span>
          </button>
        </div>
      </div>

      {/* Form & List */}
      <div className="flex-1 overflow-y-auto mb-2 pr-1 min-h-0 space-y-4">
        
        {/* Personalized Task Addition Form */}
        <form onSubmit={handleCreateTask} className="p-3.5 bg-slate-50/50 rounded-xl border border-neutral-200/60 flex flex-col gap-2">
          <span className="text-[10px] font-extrabold text-neutral-400 uppercase tracking-wider">Quick Add Personal Task</span>
          <div className="flex gap-2">
            <input
              type="text"
              id="input-task-title"
              placeholder={`Create a task (e.g., "Review ${role} requirements")...`}
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
              className="flex-1 px-3 py-1.5 text-xs border border-neutral-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white shadow-2xs"
            />
            <button
              type="submit"
              id="btn-add-task"
              disabled={isSubmittingTask || !newTaskTitle.trim()}
              className="px-3 py-1.5 bg-neutral-900 hover:bg-neutral-800 disabled:bg-neutral-200 text-white disabled:text-neutral-400 text-xs font-semibold rounded-lg flex items-center space-x-1 transition-colors shrink-0"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>
          <label className="flex items-center space-x-1.5 cursor-pointer text-[11px] text-neutral-500 font-bold self-start mt-1">
            <input
              type="checkbox"
              id="checkbox-is-blocker"
              checked={newTaskIsBlocker}
              onChange={(e) => setNewTaskIsBlocker(e.target.checked)}
              className="rounded border-neutral-300 text-rose-600 focus:ring-rose-500 w-3.5 h-3.5"
            />
            <span className="text-rose-600">Flag as urgent team blocker</span>
          </label>
        </form>

        {/* Task Streams List */}
        <div className="space-y-2">
          {filteredTasks.length === 0 ? (
            <div className="text-center py-16 border border-dashed border-neutral-200 rounded-xl bg-white space-y-2">
              <CheckCircle className="w-8 h-8 text-neutral-300 mx-auto" />
              <p className="text-neutral-400 text-xs font-medium">No tasks match this filter. Clear to work smoothly!</p>
            </div>
          ) : (
            <AnimatePresence mode="popLayout">
              {filteredTasks.map(task => (
                <motion.div
                  key={task.id}
                  layout
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  className={`p-3 rounded-xl border text-xs flex items-center justify-between transition-all shadow-2xs ${
                    task.status === "done"
                      ? "bg-neutral-50/70 border-neutral-200 text-neutral-400 line-through"
                      : task.isBlocker
                      ? "bg-rose-50/50 border-rose-200 text-rose-950"
                      : "bg-white border-neutral-200/80 text-neutral-700"
                  }`}
                >
                  <div className="flex items-center space-x-3 flex-1 min-w-0 pr-3">
                    <input
                      type="checkbox"
                      id={`task-check-${task.id}`}
                      checked={task.status === "done"}
                      onChange={(e) => onUpdateTaskStatus(task.id, e.target.checked ? "done" : "todo")}
                      className="rounded border-neutral-300 text-indigo-600 focus:ring-indigo-500 w-4 h-4 shrink-0 cursor-pointer"
                    />
                    <div className="truncate">
                      <div className="font-bold flex items-center gap-1.5 flex-wrap">
                        {task.isBlocker && (
                          <span className="px-1.5 py-0.2 bg-rose-100 text-rose-800 font-extrabold text-[8px] rounded uppercase tracking-wider">
                            Blocker
                          </span>
                        )}
                        <span>{task.title}</span>
                      </div>
                      <span className="block text-[10px] text-neutral-400 font-semibold mt-0.5">
                        Assigned: {task.assignee}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 shrink-0">
                    <select
                      value={task.status}
                      id={`select-task-status-${task.id}`}
                      onChange={(e) => onUpdateTaskStatus(task.id, e.target.value as WorkspaceTask["status"])}
                      className="text-[10px] bg-neutral-50 hover:bg-neutral-100 border border-neutral-200 rounded px-1.5 py-1 font-bold text-neutral-600 outline-none transition-all"
                    >
                      <option value="todo">Todo</option>
                      <option value="in_progress">In Dev</option>
                      <option value="done">Done</option>
                    </select>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          )}
        </div>

      </div>

    </div>
  );
}
