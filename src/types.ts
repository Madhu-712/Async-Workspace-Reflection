/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface UserProfile {
  uid: string;
  displayName: string;
  photoURL?: string;
  role: 'Developer' | 'Product Manager' | 'Team Lead' | 'Designer' | 'QA';
  email: string;
  updatedAt: number;
}

export interface Standup {
  id: string;
  userId: string;
  userName: string;
  userRole: string;
  doneToday: string;
  plannedToday: string;
  blockers: string;
  parsedSummary: string;
  actionableItems: string[];
  systemicBlockers: string[];
  createdAt: number;
}

export interface BurnoutAnalysis {
  id: string;
  burnoutScore: number; // 0-100
  riskTier: 'Low' | 'Medium' | 'High';
  primaryDriver: string;
  createdAt: number;
}

export interface JournalEntry {
  id: string;
  userId: string;
  text: string;
  response: string;
  templateId?: 'cognitive_bias' | 'gratitude' | 'future_challenge' | 'boundary_check' | 'imposter_syndrome' | 'work_life' | 'general';
  createdAt: number;
}

export interface WorkspaceTask {
  id: string;
  title: string;
  status: 'todo' | 'in_progress' | 'done';
  assignee: string;
  isBlocker: boolean;
  createdAt: number;
}

export interface TeamSignal {
  id: string;
  userName: string;
  message: string;
  sentiment: 'positive' | 'neutral' | 'negative';
  createdAt: number;
}

export interface WorkspaceState {
  standups: Standup[];
  tasks: WorkspaceTask[];
  signals: TeamSignal[];
  burnout: BurnoutAnalysis | null;
}
