"use client";

import React, { useState } from "react";
import { Wifi, Copy, Check, Users, Coffee } from "lucide-react";
import { Cafe, Table } from "@/types/cafe";

interface CustomerHeaderProps {
  cafe: Cafe;
  table: Table;
  guestName: string;
  onUpdateGuestName: (name: string) => void;
}

export function CustomerHeader({ cafe, table, guestName, onUpdateGuestName }: CustomerHeaderProps) {
  const [copiedWifi, setCopiedWifi] = useState(false);
  const [showWifiDetails, setShowWifiDetails] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [tempName, setTempName] = useState(guestName);

  const copyWifi = () => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(cafe.settings.wifi_pass);
      setCopiedWifi(true);
      setTimeout(() => setCopiedWifi(false), 2500);
    }
  };

  const handleSaveName = (e: React.FormEvent) => {
    e.preventDefault();
    if (tempName.trim()) {
      onUpdateGuestName(tempName.trim());
      setIsEditingName(false);
    }
  };

  return (
    <header className="relative bg-[#2E1C14] text-[#FAF7F2] pt-4 pb-5 px-4 shadow-lg rounded-b-3xl">
      {/* Top Bar with Table Badge & Guest Identity */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30">
            Seated at Table #{table.table_number} • {table.zone}
          </span>
        </div>

        {/* Guest Session Identifier */}
        <div className="relative">
          {isEditingName ? (
            <form onSubmit={handleSaveName} className="flex items-center gap-1">
              <input
                type="text"
                value={tempName}
                onChange={(e) => setTempName(e.target.value)}
                autoFocus
                className="bg-neutral-800 text-xs px-2 py-1 rounded border border-neutral-700 text-white w-24 outline-none focus:border-amber-400"
              />
              <button
                type="submit"
                className="text-xs bg-amber-600 px-2 py-1 rounded text-white font-medium hover:bg-amber-500"
              >
                Save
              </button>
            </form>
          ) : (
            <button
              onClick={() => setIsEditingName(true)}
              className="flex items-center gap-1.5 text-xs bg-white/10 hover:bg-white/15 px-2.5 py-1 rounded-full transition text-neutral-200"
              title="Click to edit diner name"
            >
              <Users className="w-3.5 h-3.5 text-amber-400" />
              <span className="font-medium truncate max-w-[90px]">{guestName}</span>
              <span className="text-[10px] text-neutral-400">✏️</span>
            </button>
          )}
        </div>
      </div>

      {/* Cafe Branding Info */}
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-2xl bg-amber-600/30 border border-amber-500/40 flex items-center justify-center text-2xl shadow-inner shrink-0">
          <Coffee className="w-6 h-6 text-amber-400" />
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-bold tracking-tight text-white truncate flex items-center gap-2">
            {cafe.name}
          </h1>
          <p className="text-xs text-neutral-300 line-clamp-1">{cafe.tagline}</p>
        </div>
      </div>

      {/* WiFi Details & Info Bar */}
      <div className="mt-3.5 pt-3 border-t border-white/10 flex items-center justify-between text-xs">
        <button
          onClick={() => setShowWifiDetails(!showWifiDetails)}
          className="flex items-center gap-1.5 text-amber-300/90 hover:text-amber-200 transition font-medium"
        >
          <Wifi className="w-3.5 h-3.5" />
          <span>Guest WiFi: <strong>{cafe.settings.wifi_ssid}</strong></span>
        </button>

        <button
          onClick={copyWifi}
          className="flex items-center gap-1 text-[11px] bg-white/10 hover:bg-white/20 px-2.5 py-1 rounded-lg transition text-white font-medium"
        >
          {copiedWifi ? (
            <>
              <Check className="w-3 h-3 text-emerald-400" />
              <span className="text-emerald-300">Password Copied!</span>
            </>
          ) : (
            <>
              <Copy className="w-3 h-3 text-neutral-300" />
              <span>Copy Pass ({cafe.settings.wifi_pass})</span>
            </>
          )}
        </button>
      </div>

      {showWifiDetails && (
        <div className="mt-2 p-2.5 bg-black/40 rounded-xl text-xs text-neutral-300 border border-white/10 flex items-center justify-between">
          <div>
            <p className="text-[11px] text-neutral-400">Network Name (SSID):</p>
            <p className="font-semibold text-white">{cafe.settings.wifi_ssid}</p>
          </div>
          <div className="text-right">
            <p className="text-[11px] text-neutral-400">Password:</p>
            <p className="font-mono text-amber-400 font-bold">{cafe.settings.wifi_pass}</p>
          </div>
        </div>
      )}
    </header>
  );
}
