import { NextResponse } from "next/server";
import { DB } from "@/lib/db";

export async function GET(
  request: Request,
  props: { params: Promise<{ invoiceNumber: string }> }
) {
  try {
    const { invoiceNumber } = await props.params;
    const decodedNumber = decodeURIComponent(invoiceNumber);

    // Try finding by exact number, with or without leading hash, or by id
    let invoice =
      DB.getInvoiceByNumber(decodedNumber) ||
      DB.getInvoiceByNumber(decodedNumber.startsWith("#") ? decodedNumber.substring(1) : `#${decodedNumber}`) ||
      DB.getInvoiceById(decodedNumber);

    if (!invoice) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }

    const cafe = DB.getCafe();

    return NextResponse.json({
      invoice,
      cafe: {
        name: cafe.name,
        tagline: cafe.tagline,
        address: cafe.address,
        phone: cafe.phone,
        gstin: cafe.gstin,
        fssai_number: cafe.fssai_number,
        currency: cafe.currency,
        currency_symbol: cafe.currency_symbol,
      },
    });
  } catch (err) {
    console.error("Fetch invoice error:", err);
    return NextResponse.json({ error: "Failed to fetch invoice" }, { status: 500 });
  }
}
