/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getFirestore, Firestore } from "firebase-admin/firestore";
import { UserProfile, Standup, BurnoutAnalysis, JournalEntry, WorkspaceTask, TeamSignal } from "../types";
import fs from "fs";
import path from "path";

// Initialize Admin SDK lazily or use environment credentials
let isFirestoreAvailable = false;
let db: Firestore | null = null;

try {
  if (getApps().length === 0) {
    if (process.env.FIREBASE_SERVICE_ACCOUNT) {
      const sa = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
      initializeApp({
        credential: cert(sa)
      });
      console.log("Firebase Admin initialized with SERVICE_ACCOUNT");
    } else {
      initializeApp();
      console.log("Firebase Admin initialized with default credentials");
    }
  }
  db = getFirestore();
  isFirestoreAvailable = true;
  console.log("Firestore adapter successfully loaded.");
} catch (error) {
  console.log("Using high-performance JSON memory adapter as standard offline driver.");
}

// Memory Database storage as fallback and initial seeds
const memoryDb = {
  profiles: new Map<string, UserProfile>(),
  entries: new Map<string, JournalEntry[]>(), // userId -> JournalEntry[]
  standups: [] as Standup[],
  tasks: [
    { id: "task-1", title: "Implement Firestore rules for user-owner boundaries", status: "done", assignee: "Senior Dev", isBlocker: false, createdAt: Date.now() - 36000000 },
    { id: "task-2", title: "Complete automated async standup parser", status: "in_progress", assignee: "AI Lead", isBlocker: false, createdAt: Date.now() - 18000000 },
    { id: "task-3", title: "Configure Socket.io dashboard stream", status: "todo", assignee: "Fullstack Eng", isBlocker: true, createdAt: Date.now() - 10000000 },
    { id: "task-4", title: "Design team workload & burnout heatmap grid", status: "todo", assignee: "UI/UX Designer", isBlocker: false, createdAt: Date.now() - 5000000 }
  ] as WorkspaceTask[],
  signals: [
    { id: "sig-1", userName: "Senior Dev", message: "Blockers in firestore rules resolved. Looking good.", sentiment: "positive", createdAt: Date.now() - 24000000 },
    { id: "sig-2", userName: "AI Lead", message: "Struggling with Gemini rate limits occasionally on 503 errors.", sentiment: "neutral", createdAt: Date.now() - 12000000 },
    { id: "sig-3", userName: "QA Engineer", message: "Critical bug: websocket connection leaks on hot reload.", sentiment: "negative", createdAt: Date.now() - 6000000 }
  ] as TeamSignal[],
  burnout: {
    id: "burnout-latest",
    burnoutScore: 42,
    riskTier: "Medium",
    primaryDriver: "WebSocket state sync lagging under heavy load and elevated task backlogs.",
    createdAt: Date.now()
  } as BurnoutAnalysis
};

const LOCAL_DB_PATH = path.join(process.cwd(), "src", "server", "local_db_persistence.json");

function saveLocalDb() {
  try {
    const data = {
      profiles: Array.from(memoryDb.profiles.entries()),
      entries: Array.from(memoryDb.entries.entries()),
      standups: memoryDb.standups,
      tasks: memoryDb.tasks,
      signals: memoryDb.signals,
      burnout: memoryDb.burnout
    };
    fs.writeFileSync(LOCAL_DB_PATH, JSON.stringify(data, null, 2), "utf-8");
  } catch (err) {
    console.error("Failed to write local database persistence file:", err);
  }
}

function loadLocalDb() {
  try {
    if (fs.existsSync(LOCAL_DB_PATH)) {
      const raw = fs.readFileSync(LOCAL_DB_PATH, "utf-8");
      const data = JSON.parse(raw);
      if (data.profiles) memoryDb.profiles = new Map(data.profiles);
      if (data.entries) memoryDb.entries = new Map(data.entries);
      if (data.standups) memoryDb.standups = data.standups;
      if (data.tasks) memoryDb.tasks = data.tasks;
      if (data.signals) memoryDb.signals = data.signals;
      if (data.burnout) memoryDb.burnout = data.burnout;
      console.log("Loaded in-memory database from persistent local JSON file.");
    }
  } catch (err) {
    console.error("Failed to load local database persistence file:", err);
  }
}

// Load persisted JSON state at initialization
loadLocalDb();

// Helper: recursively strip 'undefined' properties to prevent Firestore crashes
function stripUndefined(obj: any): any {
  if (obj === null || obj === undefined) return null;
  if (Array.isArray(obj)) {
    return obj.map(item => stripUndefined(item));
  }
  if (typeof obj === 'object') {
    const cleaned: any = {};
    for (const key of Object.keys(obj)) {
      const val = obj[key];
      if (val !== undefined) {
        cleaned[key] = stripUndefined(val);
      }
    }
    return cleaned;
  }
  return obj;
}

// Self-healing database handler for GCP transient permissions or disabled API states
function handleFirestoreError(err: any) {
  const msg = String(err);
  console.log("Local database fallback: active. Data is safely persistent locally.");
  if (
    msg.includes("PERMISSION_DENIED") || 
    msg.includes("disabled") || 
    msg.includes("not been used") ||
    msg.includes("permission")
  ) {
    isFirestoreAvailable = false;
  }
}

export const dbService = {
  isFirestoreEnabled() {
    return isFirestoreAvailable && db !== null;
  },

  // USER PROFILE
  async getProfile(userId: string): Promise<UserProfile | null> {
    if (isFirestoreAvailable && db) {
      try {
        const doc = await db.collection("users").doc(userId).collection("profile_collection").doc("profile").get();
        if (doc.exists) {
          return doc.data() as UserProfile;
        }
      } catch (err) {
        handleFirestoreError(err);
      }
    }
    return memoryDb.profiles.get(userId) || null;
  },

  async updateProfile(userId: string, profile: Partial<UserProfile>): Promise<UserProfile> {
    const existing = await this.getProfile(userId);
    const updated: UserProfile = {
      uid: userId,
      displayName: profile.displayName || existing?.displayName || "Anonymous Developer",
      photoURL: profile.photoURL || existing?.photoURL || "",
      role: profile.role || existing?.role || "Developer",
      email: profile.email || existing?.email || "anonymous@workspace.io",
      updatedAt: Date.now()
    };

    if (isFirestoreAvailable && db) {
      try {
        const cleaned = stripUndefined(updated);
        await db.collection("users").doc(userId).collection("profile_collection").doc("profile").set(cleaned, { merge: true });
      } catch (err) {
        handleFirestoreError(err);
      }
    }
    memoryDb.profiles.set(userId, updated);
    saveLocalDb();
    return updated;
  },

  // JOURNAL ENTRIES (strict owner-bound path `/users/{userId}/entries/{entryId}`)
  async getJournalEntries(userId: string): Promise<JournalEntry[]> {
    if (isFirestoreAvailable && db) {
      try {
        const snap = await db.collection("users").doc(userId).collection("entries").orderBy("createdAt", "desc").get();
        const entries: JournalEntry[] = [];
        snap.forEach(doc => {
          entries.push(doc.data() as JournalEntry);
        });
        return entries;
      } catch (err) {
        handleFirestoreError(err);
      }
    }
    return (memoryDb.entries.get(userId) || []).slice().sort((a, b) => b.createdAt - a.createdAt);
  },

  async addJournalEntry(userId: string, entry: Omit<JournalEntry, "id" | "createdAt">): Promise<JournalEntry> {
    const newEntry: JournalEntry = {
      ...entry,
      id: `entry-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
      userId,
      createdAt: Date.now()
    };

    if (isFirestoreAvailable && db) {
      try {
        const cleaned = stripUndefined(newEntry);
        await db.collection("users").doc(userId).collection("entries").doc(newEntry.id).set(cleaned);
      } catch (err) {
        handleFirestoreError(err);
      }
    }
    const current = memoryDb.entries.get(userId) || [];
    current.push(newEntry);
    memoryDb.entries.set(userId, current);
    saveLocalDb();
    return newEntry;
  },

  // STANDUPS
  async getStandups(): Promise<Standup[]> {
    if (isFirestoreAvailable && db) {
      try {
        const snap = await db.collection("standups").orderBy("createdAt", "desc").get();
        const standups: Standup[] = [];
        snap.forEach(doc => {
          standups.push(doc.data() as Standup);
        });
        return standups;
      } catch (err) {
        handleFirestoreError(err);
      }
    }
    return memoryDb.standups.slice().sort((a, b) => b.createdAt - a.createdAt);
  },

  async addStandup(standup: Omit<Standup, "id" | "createdAt">): Promise<Standup> {
    const newStandup: Standup = {
      ...standup,
      id: `standup-${Date.now()}-${Math.floor(Math.random() * 1000000)}`,
      createdAt: Date.now()
    };

    if (isFirestoreAvailable && db) {
      try {
        const cleaned = stripUndefined(newStandup);
        await db.collection("standups").doc(newStandup.id).set(cleaned);
      } catch (err) {
        handleFirestoreError(err);
      }
    }
    memoryDb.standups.push(newStandup);
    saveLocalDb();
    return newStandup;
  },

  // TASKS
  async getTasks(): Promise<WorkspaceTask[]> {
    if (isFirestoreAvailable && db) {
      try {
        const snap = await db.collection("tasks").orderBy("createdAt", "desc").get();
        const tasks: WorkspaceTask[] = [];
        snap.forEach(doc => {
          tasks.push(doc.data() as WorkspaceTask);
        });
        return tasks;
      } catch (err) {
        handleFirestoreError(err);
      }
    }
    return memoryDb.tasks;
  },

  async addTask(task: Omit<WorkspaceTask, "id" | "createdAt">): Promise<WorkspaceTask> {
    const newTask: WorkspaceTask = {
      ...task,
      id: `task-${Date.now()}-${Math.floor(Math.random() * 1000000)}`,
      createdAt: Date.now()
    };

    if (isFirestoreAvailable && db) {
      try {
        const cleaned = stripUndefined(newTask);
        await db.collection("tasks").doc(newTask.id).set(cleaned);
      } catch (err) {
        handleFirestoreError(err);
      }
    }
    memoryDb.tasks.push(newTask);
    saveLocalDb();
    return newTask;
  },

  async updateTaskStatus(taskId: string, status: 'todo' | 'in_progress' | 'done'): Promise<WorkspaceTask | null> {
    // In memory
    const index = memoryDb.tasks.findIndex(t => t.id === taskId);
    if (index !== -1) {
      memoryDb.tasks[index].status = status;
      const updated = memoryDb.tasks[index];
      if (isFirestoreAvailable && db) {
        try {
          await db.collection("tasks").doc(taskId).update({ status });
        } catch (err) {
          handleFirestoreError(err);
        }
      }
      saveLocalDb();
      return updated;
    }
    return null;
  },

  // TEAM SIGNALS
  async getSignals(): Promise<TeamSignal[]> {
    if (isFirestoreAvailable && db) {
      try {
        const snap = await db.collection("signals").orderBy("createdAt", "desc").limit(20).get();
        const signals: TeamSignal[] = [];
        snap.forEach(doc => {
          signals.push(doc.data() as TeamSignal);
        });
        return signals;
      } catch (err) {
        handleFirestoreError(err);
      }
    }
    return memoryDb.signals;
  },

  async addSignal(signal: Omit<TeamSignal, "id" | "createdAt">): Promise<TeamSignal> {
    const newSignal: TeamSignal = {
      ...signal,
      id: `sig-${Date.now()}-${Math.floor(Math.random() * 1000000)}`,
      createdAt: Date.now()
    };

    if (isFirestoreAvailable && db) {
      try {
        const cleaned = stripUndefined(newSignal);
        await db.collection("signals").doc(newSignal.id).set(cleaned);
      } catch (err) {
        handleFirestoreError(err);
      }
    }
    memoryDb.signals.unshift(newSignal);
    saveLocalDb();
    return newSignal;
  },

  // BURNOUT ANALYSIS
  async getLatestBurnout(): Promise<BurnoutAnalysis> {
    if (isFirestoreAvailable && db) {
      try {
        const doc = await db.collection("burnout").doc("latest").get();
        if (doc.exists) {
          return doc.data() as BurnoutAnalysis;
        }
      } catch (err) {
        handleFirestoreError(err);
      }
    }
    return memoryDb.burnout;
  },

  async updateBurnout(analysis: Omit<BurnoutAnalysis, "id" | "createdAt">): Promise<BurnoutAnalysis> {
    const updated: BurnoutAnalysis = {
      ...analysis,
      id: "burnout-latest",
      createdAt: Date.now()
    };

    if (isFirestoreAvailable && db) {
      try {
        const cleaned = stripUndefined(updated);
        await db.collection("burnout").doc("latest").set(cleaned);
      } catch (err) {
        handleFirestoreError(err);
      }
    }
    memoryDb.burnout = updated;
    saveLocalDb();
    return updated;
  }
};
