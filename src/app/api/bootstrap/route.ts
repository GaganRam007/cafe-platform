import { NextResponse } from "next/server";
import { getStore } from "@/lib/data-store";

export async function GET() {
  const store = getStore();
  return NextResponse.json({
    cafe: store.getCafe(),
    tables: store.getTables(),
    categories: store.getCategories(),
    menuItems: store.getMenuItems(),
    ingredients: store.getIngredients(),
    recipeItems: store.getRecipeItems(),
    orders: store.getOrders(),
    serviceRequests: store.getServiceRequests(),
    wastageLogs: store.getWastageLogs(),
    vendors: store.getVendors(),
    purchaseOrders: store.getPurchaseOrders(),
    analytics: store.getAnalytics(),
  });
}
