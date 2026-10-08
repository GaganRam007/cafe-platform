"use client";

import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  ShieldAlert,
  ShieldCheck,
  Search,
  Filter,
  Clock,
  User,
  Activity,
  Loader2,
  FileText,
} from "lucide-react";

export function AuditLogsView() {
  const [filterAction, setFilterAction] = useState<string>("all");
  const [searchActor, setSearchActor] = useState<string>("");

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["staff_audit_logs"],
    queryFn: async () => {
      const token = typeof window !== "undefined" ? localStorage.getItem("aura_staff_token") : null;
      const headers: Record<string, string> = {};
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const res = await fetch("/api/staff/audit-logs?limit=100", { headers });
      if (!res.ok) throw new Error("Failed to load audit logs");
      return res.json();
    },
  });

  const logs: any[] = data?.logs || [];

  const filteredLogs = logs.filter((log) => {
    const matchesAction = filterAction === "all" || log.action === filterAction;
    const matchesActor =
      searchActor === "" ||
      log.actor_name?.toLowerCase().includes(searchActor.toLowerCase()) ||
      log.actor_role?.toLowerCase().includes(searchActor.toLowerCase());
    return matchesAction && matchesActor;
  });

  if (isLoading) {
    return (
      <div className="py-20 text-center text-neutral-400">
        <Loader2 className="w-8 h-8 mx-auto animate-spin mb-3 text-amber-600" />
        <p className="text-xs font-semibold">Loading cryptographic audit trail...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Top Banner & Filters */}
      <div className="bg-white dark:bg-neutral-900 p-4 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-500/20 text-blue-600 flex items-center justify-center font-bold">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-neutral-900 dark:text-white">
              Immutable Staff Audit Trail & Accountability
            </h3>
            <p className="text-[11px] text-neutral-500">
              Audit log of settlements, bill reopenings, discounts, price edits, and administrative actions
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            value={filterAction}
            onChange={(e) => setFilterAction(e.target.value)}
            className="text-xs p-2 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 outline-none"
          >
            <option value="all">All Actions</option>
            <option value="SETTLE_BILL">Bill Settlements</option>
            <option value="REOPEN_BILL">Bill Reopenings</option>
            <option value="MENU_ITEM_UPDATED">Menu Updates</option>
            <option value="CUSTOMER_DATA_PURGED">Privacy / GDPR Deletion</option>
          </select>

          <input
            type="text"
            placeholder="Search staff..."
            value={searchActor}
            onChange={(e) => setSearchActor(e.target.value)}
            className="text-xs p-2 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 outline-none"
          />
        </div>
      </div>

      {/* Audit Logs Table */}
      <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-neutral-50 dark:bg-neutral-800/80 border-b border-neutral-200 dark:border-neutral-700 text-neutral-500 uppercase tracking-wider font-semibold text-[11px]">
              <tr>
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">Action</th>
                <th className="py-3 px-4">Actor</th>
                <th className="py-3 px-4">Entity</th>
                <th className="py-3 px-4">Details & Reason</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-neutral-400">
                    No matching audit log entries found.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => {
                  let parsedDetails: any = null;
                  try {
                    parsedDetails = typeof log.details === "string" ? JSON.parse(log.details) : log.details;
                  } catch {
                    parsedDetails = log.details;
                  }

                  return (
                    <tr key={log.id} className="hover:bg-neutral-50/60 dark:hover:bg-neutral-800/40">
                      <td className="py-3 px-4 font-mono text-[11px] text-neutral-400 whitespace-nowrap">
                        {log.created_at}
                      </td>

                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            log.action === "SETTLE_BILL"
                              ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
                              : log.action === "REOPEN_BILL"
                              ? "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300"
                              : "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300"
                          }`}
                        >
                          {log.action}
                        </span>
                      </td>

                      <td className="py-3 px-4">
                        <div className="font-semibold text-neutral-900 dark:text-white">
                          {log.actor_name || "Staff"}
                        </div>
                        <div className="text-[10px] text-neutral-400 uppercase font-mono">
                          {log.actor_role}
                        </div>
                      </td>

                      <td className="py-3 px-4 font-mono text-[11px] text-neutral-600 dark:text-neutral-400">
                        {log.entity_type}:{log.entity_id?.slice(0, 10)}
                      </td>

                      <td className="py-3 px-4 text-neutral-700 dark:text-neutral-300 text-[11px]">
                        {parsedDetails?.reason && (
                          <div className="font-medium text-amber-700 dark:text-amber-400">
                            Reason: &quot;{parsedDetails.reason}&quot;
                          </div>
                        )}
                        {parsedDetails?.payment_method && (
                          <div className="text-neutral-500">
                            Tender: {parsedDetails.payment_method.toUpperCase()} • Total: ₹{parsedDetails.total_amount}
                          </div>
                        )}
                        {parsedDetails?.invoice_number && (
                          <div className="font-mono text-neutral-500">
                            Invoice: #{parsedDetails.invoice_number}
                          </div>
                        )}
                        {parsedDetails?.updates && (
                          <div className="text-neutral-500">
                            Updates: {JSON.stringify(parsedDetails.updates)}
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
