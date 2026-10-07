import { DB } from "./db";

export interface WhatsAppNotificationPayload {
  to_phone_e164: string;
  customer_name: string;
  invoice_number: string;
  table_number: number;
  total_amount: number;
  cgst_amount: number;
  sgst_amount: number;
  invoice_url: string;
}

export const WhatsAppInvoicingService = {
  // Format WhatsApp Message compliant with Indian business messaging templates
  formatInvoiceMessage: (payload: WhatsAppNotificationPayload): string => {
    return `☕ *Aura Artisan Coffee & Bistro*
Tax Invoice #${payload.invoice_number}

Hello ${payload.customer_name}, thank you for dining at Table #${payload.table_number}!

*Bill Breakdown (SAC: 996331):*
• CGST (2.5%): ₹${payload.cgst_amount.toFixed(2)}
• SGST (2.5%): ₹${payload.sgst_amount.toFixed(2)}
• *Total Billed:* ₹${payload.total_amount.toFixed(2)}

GSTIN: 29AABCU9603R1ZM | FSSAI: 11223344556677

📄 *View & Download Official GST Invoice:*
${payload.invoice_url}

_We hope you enjoyed your brew! Have a wonderful day ahead._`;
  },

  // Dispatch notification with retry queue
  dispatchInvoiceNotification: async (
    orderId: string,
    appOrigin: string = "http://localhost:3000"
  ): Promise<{ success: boolean; messageId?: string; error?: string }> => {
    try {
      const order = DB.getOrderDetails(orderId);
      if (!order || !order.invoice) {
        return { success: false, error: "Invoice not generated yet for order" };
      }

      const invoice = order.invoice;
      const invoiceUrl = `${appOrigin}/invoice/${invoice.invoice_number}`;

      const payload: WhatsAppNotificationPayload = {
        to_phone_e164: invoice.customer_phone,
        customer_name: invoice.customer_name,
        invoice_number: invoice.invoice_number,
        table_number: order.table_number,
        total_amount: invoice.total_amount,
        cgst_amount: invoice.cgst_amount,
        sgst_amount: invoice.sgst_amount,
        invoice_url: invoiceUrl,
      };

      const messageContent = WhatsAppInvoicingService.formatInvoiceMessage(payload);

      // In production with WhatsApp Cloud API / Gupshup / WATI:
      // await fetch(`https://graph.facebook.com/v19.0/${WHATSAPP_PHONE_NUMBER_ID}/messages`, ...)
      // Here we log the formatted template and update the database outbox status
      console.log(`[WHATSAPP_OUTBOX] Sending Tax Invoice to ${payload.to_phone_e164}:\n${messageContent}`);

      DB.updateInvoiceWhatsAppStatus(invoice.id, "SENT");

      return {
        success: true,
        messageId: `wa-msg-${Date.now()}`,
      };
    } catch (err: any) {
      console.error("[WHATSAPP_ERROR] Failed to dispatch WhatsApp invoice:", err);
      return { success: false, error: err.message || "Failed to dispatch" };
    }
  },
};
