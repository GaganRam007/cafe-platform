import { NextResponse } from "next/server";
import { DB } from "@/lib/db";

export async function GET() {
  const cafe = DB.getCafe();
  const { categories, items } = DB.getPublicMenu();

  return NextResponse.json({
    cafe: {
      name: cafe.name,
      tagline: cafe.tagline,
      address: cafe.address,
      phone: cafe.phone,
      wifi_ssid: cafe.wifi_ssid,
      wifi_pass: cafe.wifi_pass,
      currency: cafe.currency,
      currency_symbol: cafe.currency_symbol,
      cgst_rate: cafe.cgst_rate,
      sgst_rate: cafe.sgst_rate,
      service_fee_rate: cafe.service_fee_rate,
    },
    categories,
    items,
    tables: DB.getAllTables().map((t) => ({
      table_number: t.table_number,
      label: t.label,
      qr_token: t.qr_token,
      zone: t.zone,
    })),
  });
}
