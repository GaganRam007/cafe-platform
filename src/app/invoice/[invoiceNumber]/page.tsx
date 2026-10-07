"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Printer,
  ArrowLeft,
  CheckCircle2,
  FileText,
  Clock,
  Coffee,
  ShieldCheck,
  Send,
  Download,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";

export default function DigitalInvoicePage() {
  const params = useParams();
  const router = useRouter();
  const invoiceNumber = (params?.invoiceNumber as string) || "";
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    if (!invoiceNumber) return;

    fetch(`/api/invoices/${encodeURIComponent(invoiceNumber)}`)
      .then(async (res) => {
        if (!res.ok) {
          throw new Error("Invoice not found or invalid invoice reference");
        }
        return res.json();
      })
      .then((json) => {
        setData(json);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message || "Failed to load invoice");
        setLoading(false);
      });
  }, [invoiceNumber]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAF7F2] dark:bg-neutral-950 flex flex-col items-center justify-center p-6 text-neutral-600 dark:text-neutral-400">
        <div className="w-12 h-12 border-4 border-amber-600 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-sm font-medium">Generating official GST Tax Invoice...</p>
      </div>
    );
  }

  if (error || !data?.invoice) {
    return (
      <div className="min-h-screen bg-[#FAF7F2] dark:bg-neutral-950 flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-950/50 text-red-600 flex items-center justify-center mb-4">
          <FileText className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-neutral-900 dark:text-neutral-100 mb-2">Invoice Not Found</h2>
        <p className="text-sm text-neutral-600 dark:text-neutral-400 max-w-sm mb-6">
          {error || "We could not find an invoice matching this number. Please check the link or contact staff."}
        </p>
        <button
          onClick={() => router.back()}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-700 hover:bg-amber-800 text-white font-medium text-sm transition"
        >
          <ArrowLeft className="w-4 h-4" /> Go Back
        </button>
      </div>
    );
  }

  const { invoice, cafe } = data;
  const order = invoice.order || {};
  const items = order.items || [];

  return (
    <div className="min-h-screen bg-neutral-100 dark:bg-neutral-950 py-6 px-3 sm:px-6 font-sans">
      {/* Top action bar (hidden on print) */}
      <div className="max-w-2xl mx-auto mb-4 flex items-center justify-between print:hidden">
        <button
          onClick={() => router.back()}
          className="inline-flex items-center gap-2 text-sm text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white transition"
        >
          <ArrowLeft className="w-4 h-4" /> Return to Menu / Order
        </button>
        <button
          onClick={() => window.print()}
          className="inline-flex items-center gap-2 px-4 py-2 bg-[#2E1C14] hover:bg-[#42281D] text-white text-xs font-semibold rounded-xl shadow-sm transition"
        >
          <Printer className="w-4 h-4" /> Print / Save PDF
        </button>
      </div>

      {/* Main GST Invoice Card */}
      <div className="max-w-2xl mx-auto bg-white dark:bg-neutral-900 rounded-2xl shadow-xl border border-neutral-200 dark:border-neutral-800 p-6 sm:p-8 text-neutral-800 dark:text-neutral-200 print:shadow-none print:border-none print:m-0 print:p-0">
        
        {/* Header Badge */}
        <div className="border-b border-dashed border-neutral-300 dark:border-neutral-700 pb-5 mb-5">
          <div className="flex items-start justify-between">
            <div>
              <span className="inline-block text-[10px] font-bold tracking-wider uppercase px-2.5 py-0.5 rounded bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 mb-2">
                ORIGINAL FOR RECIPIENT
              </span>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-neutral-900 dark:text-white">
                {cafe.name}
              </h1>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">{cafe.tagline}</p>
              <p className="text-xs text-neutral-600 dark:text-neutral-400 mt-1 max-w-sm">
                {cafe.address} • Ph: {cafe.phone}
              </p>
            </div>
            <div className="text-right">
              <span className="text-xs uppercase font-extrabold tracking-wider text-neutral-400 dark:text-neutral-500 block">
                TAX INVOICE
              </span>
              <span className="text-base font-bold font-mono text-amber-700 dark:text-amber-400 block mt-0.5">
                {invoice.invoice_number}
              </span>
              <span className="text-[11px] text-neutral-500 dark:text-neutral-400 block mt-1">
                {new Date(invoice.created_at).toLocaleString("en-IN", {
                  dateStyle: "medium",
                  timeStyle: "short",
                })}
              </span>
            </div>
          </div>

          {/* Statutory Registration Numbers */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-4 pt-3 border-t border-neutral-100 dark:border-neutral-800 text-[11px]">
            <div>
              <span className="text-neutral-400 block text-[10px] uppercase font-semibold">GSTIN</span>
              <span className="font-mono font-medium text-neutral-800 dark:text-neutral-200">{invoice.gstin}</span>
            </div>
            <div>
              <span className="text-neutral-400 block text-[10px] uppercase font-semibold">FSSAI Lic. No.</span>
              <span className="font-mono font-medium text-neutral-800 dark:text-neutral-200">{invoice.fssai_number}</span>
            </div>
            <div>
              <span className="text-neutral-400 block text-[10px] uppercase font-semibold">SAC Code</span>
              <span className="font-mono font-medium text-neutral-800 dark:text-neutral-200">{invoice.hsn_sac_code} (Restaurant Svcs)</span>
            </div>
          </div>
        </div>

        {/* Customer & Order Metadata */}
        <div className="bg-neutral-50 dark:bg-neutral-800/40 rounded-xl p-3.5 mb-5 text-xs grid grid-cols-2 sm:grid-cols-4 gap-3 border border-neutral-200/60 dark:border-neutral-700/60">
          <div>
            <span className="text-neutral-400 text-[10px] uppercase font-semibold block">Billed To</span>
            <span className="font-semibold text-neutral-900 dark:text-white block truncate">
              {invoice.customer_name || "Guest Diner"}
            </span>
            <span className="text-neutral-500 text-[11px] block">{invoice.customer_phone}</span>
          </div>
          <div>
            <span className="text-neutral-400 text-[10px] uppercase font-semibold block">Order Ref</span>
            <span className="font-mono font-semibold text-neutral-900 dark:text-white block">
              {order.order_number || "N/A"}
            </span>
          </div>
          <div>
            <span className="text-neutral-400 text-[10px] uppercase font-semibold block">Table</span>
            <span className="font-semibold text-neutral-900 dark:text-white block">
              Table #{order.table_number || "Counter"}
            </span>
          </div>
          <div>
            <span className="text-neutral-400 text-[10px] uppercase font-semibold block">WhatsApp Invoice</span>
            <span className="inline-flex items-center gap-1 font-medium text-emerald-600 dark:text-emerald-400 mt-0.5">
              <CheckCircle2 className="w-3.5 h-3.5" /> {invoice.whatsapp_status || "DISPATCHED"}
            </span>
          </div>
        </div>

        {/* Line Items Table */}
        <div className="mb-6 overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-neutral-200 dark:border-neutral-700 text-neutral-400 font-semibold uppercase text-[10px]">
                <th className="py-2 pr-2">Item Description</th>
                <th className="py-2 px-2 text-center">Qty</th>
                <th className="py-2 px-2 text-right">Unit Price</th>
                <th className="py-2 pl-2 text-right">Amount (₹)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
              {items.map((item: any) => {
                const modifierText = item.modifiers
                  ?.map((m: any) => `${m.option_name} (+₹${m.price_delta})`)
                  .join(", ");
                return (
                  <tr key={item.id} className="text-neutral-800 dark:text-neutral-200">
                    <td className="py-2.5 pr-2">
                      <div className="font-medium text-neutral-900 dark:text-white">{item.item_name}</div>
                      {modifierText && (
                        <div className="text-[11px] text-neutral-400 italic mt-0.5">{modifierText}</div>
                      )}
                      {item.notes && (
                        <div className="text-[10px] text-amber-600 dark:text-amber-400 mt-0.5">Note: {item.notes}</div>
                      )}
                    </td>
                    <td className="py-2.5 px-2 text-center font-medium">{item.quantity}</td>
                    <td className="py-2.5 px-2 text-right text-neutral-600 dark:text-neutral-400 font-mono">
                      {formatCurrency(item.unit_price)}
                    </td>
                    <td className="py-2.5 pl-2 text-right font-semibold font-mono text-neutral-900 dark:text-white">
                      {formatCurrency(item.total_price)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Financial Breakdown & Tax Split */}
        <div className="border-t border-neutral-200 dark:border-neutral-700 pt-4 flex flex-col sm:flex-row justify-between gap-6">
          <div className="text-xs text-neutral-500 dark:text-neutral-400 space-y-1.5 max-w-xs">
            <div className="font-semibold text-neutral-700 dark:text-neutral-300">GST Compliance Note:</div>
            <p className="text-[11px] leading-relaxed">
              Restaurant services without input tax credit charged at 5% GST (2.5% CGST + 2.5% SGST) under SAC Code 996331.
            </p>
            <div className="flex items-center gap-1.5 pt-1 text-emerald-600 dark:text-emerald-400 font-medium">
              <ShieldCheck className="w-4 h-4" /> 100% Tax Compliant Invoice
            </div>
          </div>

          <div className="w-full sm:w-64 space-y-1.5 text-xs">
            <div className="flex justify-between text-neutral-600 dark:text-neutral-400">
              <span>Item Subtotal:</span>
              <span className="font-mono font-medium">{formatCurrency(invoice.subtotal)}</span>
            </div>
            
            <div className="flex justify-between text-neutral-600 dark:text-neutral-400">
              <span>CGST (2.5%):</span>
              <span className="font-mono font-medium">{formatCurrency(invoice.cgst_amount)}</span>
            </div>

            <div className="flex justify-between text-neutral-600 dark:text-neutral-400">
              <span>SGST (2.5%):</span>
              <span className="font-mono font-medium">{formatCurrency(invoice.sgst_amount)}</span>
            </div>

            {invoice.service_fee > 0 && (
              <div className="flex justify-between text-neutral-600 dark:text-neutral-400">
                <span>Staff Service Charge:</span>
                <span className="font-mono font-medium">{formatCurrency(invoice.service_fee)}</span>
              </div>
            )}

            {invoice.tip_amount > 0 && (
              <div className="flex justify-between text-neutral-600 dark:text-neutral-400">
                <span>Gratuity / Tip:</span>
                <span className="font-mono font-medium">{formatCurrency(invoice.tip_amount)}</span>
              </div>
            )}

            <div className="border-t-2 border-dashed border-neutral-300 dark:border-neutral-700 pt-2 mt-2 flex justify-between text-sm sm:text-base font-bold text-neutral-900 dark:text-white">
              <span>Total Invoice Amount:</span>
              <span className="font-mono text-amber-700 dark:text-amber-400">
                {formatCurrency(invoice.total_amount)}
              </span>
            </div>

            <div className="pt-2 text-right">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300">
                <CheckCircle2 className="w-3.5 h-3.5" /> Payment Status: PAID
              </span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 pt-4 border-t border-neutral-100 dark:border-neutral-800 text-center text-[11px] text-neutral-400 space-y-1">
          <p>Thank you for choosing {cafe.name}! We hope you enjoyed your brew & meal.</p>
          <p className="text-[10px]">This is a computer-generated tax invoice and requires no physical signature.</p>
        </div>
      </div>
    </div>
  );
}
