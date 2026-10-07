"use client";

import React, { useEffect, useState, useRef } from "react";
import QRCode from "qrcode";
import { X, Printer, Download, ExternalLink, Wifi, Coffee } from "lucide-react";
import { Table, Cafe } from "@/types/cafe";

interface QRModalProps {
  cafe: Cafe;
  table: Table | null;
  onClose: () => void;
}

export function QRModal({ cafe, table, onClose }: QRModalProps) {
  const [qrDataUrl, setQrDataUrl] = useState<string>("");
  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!table) return;
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const orderUrl = `${origin}/order/${encodeURIComponent(table.qr_token)}`;

    QRCode.toDataURL(orderUrl, {
      width: 400,
      margin: 2,
      color: {
        dark: "#2E1C14",
        light: "#FAF7F2",
      },
    })
      .then((url) => setQrDataUrl(url))
      .catch((err) => console.error("QR generation failed", err));
  }, [table]);

  if (!table) return null;

  const orderUrl = typeof window !== "undefined" ? `${window.location.origin}/order/${encodeURIComponent(table.qr_token)}` : `/order/${encodeURIComponent(table.qr_token)}`;

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    if (!qrDataUrl) return;
    const link = document.createElement("a");
    link.href = qrDataUrl;
    link.download = `AuraCafe-Table-${table.table_number}-QR.png`;
    link.click();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="absolute inset-0" onClick={onClose} />

      <div className="relative w-full max-w-md bg-white dark:bg-neutral-900 rounded-3xl shadow-2xl border border-neutral-200 dark:border-neutral-800 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Top Header */}
        <div className="p-4 bg-[#2E1C14] text-white flex items-center justify-between no-print">
          <div className="flex items-center gap-2">
            <Coffee className="w-5 h-5 text-amber-400" />
            <div>
              <h3 className="font-bold text-sm">Table #{table.table_number} QR Placard</h3>
              <p className="text-[11px] text-neutral-300">Scan to order & pay instantly</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Printable Placard Container */}
        <div ref={printRef} className="p-6 bg-[#FAF7F2] dark:bg-neutral-950 flex flex-col items-center text-center space-y-4">
          <div className="border-2 border-dashed border-[#2E1C14]/30 dark:border-amber-500/30 rounded-3xl p-6 bg-white dark:bg-neutral-900 shadow-sm w-full max-w-xs">
            <div className="w-12 h-12 rounded-2xl bg-[#2E1C14] text-amber-400 flex items-center justify-center mx-auto mb-2 shadow-md">
              <Coffee className="w-6 h-6" />
            </div>

            <h2 className="text-xl font-extrabold text-[#2E1C14] dark:text-neutral-100 uppercase tracking-wider">
              {cafe.name}
            </h2>
            <div className="my-2 inline-block px-4 py-1 rounded-full bg-amber-600 text-white font-extrabold text-sm tracking-wide shadow-sm">
              TABLE #{table.table_number}
            </div>

            <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-3">
              Zone: {table.zone} • Capacity: {table.capacity} Guests
            </p>

            {/* QR Code Canvas */}
            <div className="bg-[#FAF7F2] p-3 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-inner inline-block my-1">
              {qrDataUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={qrDataUrl}
                  alt={`QR Code Table ${table.table_number}`}
                  className="w-48 h-48 rounded-xl mx-auto"
                />
              ) : (
                <div className="w-48 h-48 bg-neutral-100 flex items-center justify-center text-xs text-neutral-400">
                  Generating QR...
                </div>
              )}
            </div>

            <p className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 mt-3">
              Scan with camera to browse menu & order
            </p>

            {/* WiFi Credentials on Placard */}
            <div className="mt-4 pt-3 border-t border-neutral-200 dark:border-neutral-800 text-[11px] text-neutral-500 flex items-center justify-center gap-1.5">
              <Wifi className="w-3.5 h-3.5 text-amber-600" />
              <span>WiFi: <strong>{cafe.settings.wifi_ssid}</strong> | Pass: <span className="font-mono">{cafe.settings.wifi_pass}</span></span>
            </div>
          </div>

          <div className="text-xs text-neutral-500 dark:text-neutral-400 no-print flex items-center gap-1.5">
            <span className="truncate max-w-[240px] font-mono text-[10px]">{orderUrl}</span>
            <a
              href={orderUrl}
              target="_blank"
              rel="noreferrer"
              className="text-amber-600 hover:underline flex items-center gap-0.5 shrink-0"
            >
              Open <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>

        {/* Bottom Actions Bar */}
        <div className="p-4 bg-white dark:bg-neutral-900 border-t border-neutral-200 dark:border-neutral-800 flex gap-2 no-print">
          <button
            onClick={handleDownload}
            className="flex-1 py-2.5 px-3 rounded-xl bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 text-neutral-800 dark:text-neutral-200 text-xs font-semibold flex items-center justify-center gap-2 transition"
          >
            <Download className="w-4 h-4" />
            <span>Download PNG</span>
          </button>
          <button
            onClick={handlePrint}
            className="flex-1 py-2.5 px-3 rounded-xl bg-[#2E1C14] hover:bg-black text-white text-xs font-semibold flex items-center justify-center gap-2 shadow-md transition"
          >
            <Printer className="w-4 h-4 text-amber-400" />
            <span>Print Placard</span>
          </button>
        </div>
      </div>
    </div>
  );
}
