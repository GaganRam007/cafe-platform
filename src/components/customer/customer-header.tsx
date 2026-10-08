"use client";

import React, { useState } from "react";
import { Wifi, Copy, Check, Users, Coffee, Smartphone, ShieldCheck, Globe } from "lucide-react";
import { Cafe, Table } from "@/types/cafe";
import { Language, SUPPORTED_LANGUAGES, getTranslation } from "@/lib/i18n";

interface CustomerHeaderProps {
  cafe: Cafe;
  table: Table;
  guestName: string;
  onUpdateGuestName: (name: string) => void;
  customer?: { id: string; name: string; phone_e164: string } | null;
  onOpenAuth?: () => void;
  currentLang?: Language;
  onSelectLang?: (lang: Language) => void;
}

export function CustomerHeader({
  cafe,
  table,
  guestName,
  onUpdateGuestName,
  customer,
  onOpenAuth,
  currentLang = "en",
  onSelectLang,
}: CustomerHeaderProps) {
  const [copiedWifi, setCopiedWifi] = useState(false);
  const [showWifiDetails, setShowWifiDetails] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [tempName, setTempName] = useState(guestName);
  const [showLangMenu, setShowLangMenu] = useState(false);

  const t = (key: string) => getTranslation(key, currentLang);

  const copyWifi = () => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(cafe.settings?.wifi_pass || "VelvetLatte24");
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

  const activeLangObj = SUPPORTED_LANGUAGES.find((l) => l.code === currentLang) || SUPPORTED_LANGUAGES[0];

  return (
    <header className="relative bg-[#2E1C14] text-[#FAF7F2] pt-4 pb-5 px-4 shadow-lg rounded-b-3xl">
      {/* Top Bar with Table Badge, Language Switcher & Guest Identity */}
      <div className="flex items-center justify-between mb-3 gap-2">
        <div className="flex items-center gap-2">
          <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30">
            {t("seated_at")} #{table.table_number} • {table.zone}
          </span>
        </div>

        {/* Right side controls: Language switcher + Login */}
        <div className="flex items-center gap-2">
          {/* Language Toggle Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowLangMenu(!showLangMenu)}
              className="flex items-center gap-1 text-[11px] bg-white/10 hover:bg-white/20 px-2 py-1 rounded-full transition text-neutral-200 border border-white/10"
              title="Select menu language"
            >
              <Globe className="w-3 h-3 text-amber-300" />
              <span className="font-semibold uppercase">{activeLangObj.code}</span>
            </button>

            {showLangMenu && (
              <div className="absolute right-0 mt-1.5 w-36 bg-neutral-900 border border-neutral-700 rounded-xl shadow-xl py-1 z-50 text-xs">
                {SUPPORTED_LANGUAGES.map((lang) => (
                  <button
                    key={lang.code}
                    type="button"
                    onClick={() => {
                      onSelectLang?.(lang.code);
                      setShowLangMenu(false);
                    }}
                    className={`w-full text-left px-3 py-1.5 flex items-center justify-between hover:bg-neutral-800 transition ${
                      currentLang === lang.code ? "text-amber-400 font-bold bg-neutral-800/60" : "text-neutral-300"
                    }`}
                  >
                    <span>{lang.nativeLabel}</span>
                    <span className="text-xs">{lang.flag}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Customer Identity / Phone Login Badge */}
          {customer ? (
            <div className="flex items-center gap-1.5 text-xs bg-emerald-950/80 border border-emerald-500/40 px-2.5 py-1 rounded-full text-emerald-200">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span className="font-semibold truncate max-w-[90px]">{customer.name}</span>
            </div>
          ) : (
            <div className="relative">
              {isEditingName ? (
                <form onSubmit={handleSaveName} className="flex items-center gap-1">
                  <input
                    type="text"
                    value={tempName}
                    onChange={(e) => setTempName(e.target.value)}
                    autoFocus
                    className="bg-neutral-800 text-xs px-2 py-1 rounded border border-neutral-700 text-white w-20 outline-none focus:border-amber-400"
                  />
                  <button
                    type="submit"
                    className="text-xs bg-amber-600 px-2 py-1 rounded text-white font-medium hover:bg-amber-500"
                  >
                    ✓
                  </button>
                </form>
              ) : (
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setIsEditingName(true)}
                    className="flex items-center gap-1 text-xs bg-white/10 hover:bg-white/15 px-2 py-1 rounded-full transition text-neutral-200"
                    title="Click to edit diner name"
                  >
                    <Users className="w-3 h-3 text-amber-400" />
                    <span className="font-medium truncate max-w-[65px]">{guestName}</span>
                  </button>
                  {onOpenAuth && (
                    <button
                      onClick={onOpenAuth}
                      className="flex items-center gap-1 text-[11px] bg-amber-600/90 hover:bg-amber-500 text-white px-2 py-1 rounded-full font-semibold transition shadow-sm"
                    >
                      <Smartphone className="w-3 h-3" />
                      <span>OTP</span>
                    </button>
                  )}
                </div>
              )}
            </div>
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
          <span>{t("guest_wifi")}: <strong>{cafe.settings?.wifi_ssid || "Aura_Guest_5G"}</strong></span>
        </button>

        <button
          onClick={copyWifi}
          className="flex items-center gap-1 text-[11px] bg-white/10 hover:bg-white/20 px-2.5 py-1 rounded-lg transition text-white font-medium"
        >
          {copiedWifi ? (
            <>
              <Check className="w-3 h-3 text-emerald-400" />
              <span className="text-emerald-300">{t("copied")}</span>
            </>
          ) : (
            <>
              <Copy className="w-3 h-3 text-neutral-300" />
              <span>{t("copy_pass")} ({cafe.settings?.wifi_pass || "VelvetLatte24"})</span>
            </>
          )}
        </button>
      </div>

      {showWifiDetails && (
        <div className="mt-2 p-2.5 bg-black/40 rounded-xl text-xs text-neutral-300 border border-white/10 flex items-center justify-between">
          <div>
            <p className="text-[11px] text-neutral-400">Network Name (SSID):</p>
            <p className="font-semibold text-white">{cafe.settings?.wifi_ssid || "Aura_Guest_5G"}</p>
          </div>
          <div className="text-right">
            <p className="text-[11px] text-neutral-400">Password:</p>
            <p className="font-mono text-amber-400 font-bold">{cafe.settings?.wifi_pass || "VelvetLatte24"}</p>
          </div>
        </div>
      )}
    </header>
  );
}
