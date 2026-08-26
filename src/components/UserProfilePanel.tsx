/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { User, Shield, Briefcase, RefreshCw, LogOut } from "lucide-react";
import { UserProfile } from "../types";

interface UserProfilePanelProps {
  token: string;
  onProfileUpdated?: (profile: UserProfile) => void;
  onLogout: () => void;
}

export default function UserProfilePanel({ token, onProfileUpdated, onLogout }: UserProfilePanelProps) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [displayName, setDisplayName] = useState("");
  const [role, setRole] = useState<UserProfile["role"]>("Developer");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchProfile();
  }, [token]);

  const fetchProfile = async () => {
    try {
      const res = await fetch("/api/profile", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error("Failed to load profile");
      const data: UserProfile = await res.json();
      setProfile(data);
      setDisplayName(data.displayName);
      setRole(data.role);
    } catch (err: any) {
      setError(err.message || "Could not retrieve user profile.");
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/profile", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ displayName, role })
      });
      if (!res.ok) throw new Error("Failed to save profile changes");
      const data: UserProfile = await res.json();
      setProfile(data);
      if (onProfileUpdated) {
        onProfileUpdated(data);
      }
    } catch (err: any) {
      setError(err.message || "Failed to update profile.");
    } finally {
      setIsSaving(false);
    }
  };

  if (error && !profile) {
    return (
      <div id="profile-error" className="p-4 bg-red-50 text-red-600 rounded-lg text-sm">
        {error}
      </div>
    );
  }

  if (!profile) {
    return (
      <div id="profile-loader" className="flex items-center justify-center p-8 text-neutral-500">
        <RefreshCw className="w-5 h-5 animate-spin mr-2" />
        <span>Loading User Profile...</span>
      </div>
    );
  }

  return (
    <div id="user-profile-panel" className="bg-white border border-neutral-200/80 rounded-xl p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-neutral-100">
        <div className="flex items-center space-x-2.5">
          <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
            <User className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-semibold text-neutral-800 text-sm">My Active Profile</h3>
            <p className="text-xs text-neutral-400">{profile.email}</p>
          </div>
        </div>
        <button
          onClick={onLogout}
          id="btn-logout"
          className="p-1.5 text-neutral-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
          title="Sign Out"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>

      <form onSubmit={handleSave} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-1">
            Display Name
          </label>
          <div className="relative">
            <input
              type="text"
              id="input-display-name"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              required
              className="w-full px-3 py-2 text-sm border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-neutral-50/30"
              placeholder="e.g. Madhu"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-1">
            Workspace Role
          </label>
          <div className="grid grid-cols-2 gap-1.5">
            {(["Developer", "Product Manager", "Team Lead", "Designer", "QA"] as const).map((r) => (
              <button
                key={r}
                type="button"
                id={`role-btn-${r.toLowerCase().replace(" ", "-")}`}
                onClick={() => setRole(r)}
                className={`px-2.5 py-1.5 text-xs font-medium rounded-lg border text-left flex items-center justify-between transition-all ${
                  role === r
                    ? "bg-indigo-50/70 border-indigo-200 text-indigo-700"
                    : "bg-white border-neutral-200 text-neutral-600 hover:bg-neutral-50"
                }`}
              >
                <span>{r}</span>
                {role === r && <Shield className="w-3.5 h-3.5 text-indigo-500" />}
              </button>
            ))}
          </div>
        </div>

        {error && (
          <div className="text-xs text-red-600 font-medium">
            {error}
          </div>
        )}

        <button
          type="submit"
          id="btn-save-profile"
          disabled={isSaving || !displayName.trim()}
          className="w-full py-2 bg-neutral-900 hover:bg-neutral-800 disabled:bg-neutral-300 text-white font-medium text-xs rounded-lg transition-colors flex items-center justify-center space-x-1"
        >
          {isSaving ? (
            <>
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              <span>Saving Changes...</span>
            </>
          ) : (
            <span>Save Profile</span>
          )}
        </button>
      </form>
    </div>
  );
}
