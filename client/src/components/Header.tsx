import React from "react";
import type { User } from "../types/task";

interface HeaderProps {
  isConnected: boolean;
  user: User | null;
  onLogout: () => void;
  onOpenCreateModal: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  isConnected,
  user,
  onLogout,
  onOpenCreateModal,
}) => {
  return (
    <header className="bg-slate-900 border-b border-slate-800 px-6 py-4 flex items-center justify-between">
      <div className="flex items-center space-x-4">
        <h1 className="text-xl font-bold tracking-tight text-white">SynTask</h1>
        <div className="flex items-center space-x-2 bg-slate-950 px-3 py-1 rounded-full border border-slate-800 text-xs">
          <span
            className={`w-2 h-2 rounded-full ${
              isConnected ? "bg-emerald-500 animate-pulse" : "bg-red-500"
            }`}
          />
          <span className="text-slate-400 font-medium">
            {isConnected ? "Live Sync" : "Disconnected"}
          </span>
        </div>
      </div>

      <div className="flex items-center space-x-4">
        {user && (
          <div className="flex items-center space-x-3 bg-slate-950/60 px-3 py-1.5 rounded-lg border border-slate-800">
            <div
              className="w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs text-white uppercase shadow-sm"
              style={{ backgroundColor: user.avatarColor }}
            >
              {user.username.charAt(0)}
            </div>
            <span className="text-sm font-medium text-slate-200">{user.username}</span>
            <button
              onClick={onLogout}
              className="text-xs text-slate-400 hover:text-red-400 transition-colors ml-2 font-medium"
            >
              Log Out
            </button>
          </div>
        )}

        <button
          onClick={onOpenCreateModal}
          className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg font-medium text-sm transition-colors shadow-sm"
        >
          + New Task
        </button>
      </div>
    </header>
  );
};