import { DB } from "../src/lib/db";
import { POST as postCustomerOrder } from "../src/app/api/customer/orders/route";

async function testConcurrency() {
  console.log("=================================================");
  console.log("   CONCURRENCY & OVERSELLING INTEGRITY TEST      ");
  console.log("=================================================\n");

  const table = DB.getAllTables()[0];
  if (!table) throw new Error("No tables found for concurrency test");

  // Create or reset a limited-stock test item
  const testItemId = "item-limited-croissant";
  try {
    DB.updateMenuItem(testItemId, { stock_count: 5, is_available: true });
  } catch {
    // If not existing, use an existing item
  }

  const items = DB.getPublicMenu().items;
  const targetItem = items[0];
  const INITIAL_STOCK = 5;

  // Set explicit stock to 5
  DB.updateMenuItem(targetItem.id, { stock_count: INITIAL_STOCK, is_available: true });
  console.log(`Setting item "${targetItem.name}" initial stock to: ${INITIAL_STOCK}`);

  // Fire 15 simultaneous order requests for 1 unit each
  const CONCURRENT_REQUESTS = 15;
  console.log(`Launching ${CONCURRENT_REQUESTS} concurrent order requests...`);

  const promises = Array.from({ length: CONCURRENT_REQUESTS }).map(async (_, idx) => {
    const req = new Request("http://localhost:3000/api/customer/orders", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-forwarded-for": `192.168.1.${100 + idx}`, // unique IP for rate limit
      },
      body: JSON.stringify({
        table_id: table.id,
        customer_name: `Concurrent Diner #${idx + 1}`,
        items: [
          {
            menu_item_id: targetItem.id,
            quantity: 1,
          },
        ],
      }),
    });

    const res = await postCustomerOrder(req);
    const data = await res.json();
    return { status: res.status, data };
  });

  const results = await Promise.all(promises);

  const successes = results.filter((r) => r.status === 201);
  const rejections = results.filter((r) => r.status !== 201);

  console.log(`\nResults:`);
  console.log(`  - Successful Orders: ${successes.length}`);
  console.log(`  - Rejected (Out of Stock / Unavailable): ${rejections.length}`);

  const itemAfter = DB.getPublicMenu().items.find((i) => i.id === targetItem.id);
  const finalStock = itemAfter?.stock_count || 0;
  console.log(`  - Final Stock in DB: ${finalStock}`);
  console.log(`  - Item Availability in DB: ${itemAfter?.is_available ? "Available" : "Sold Out"}`);

  if (successes.length === INITIAL_STOCK && finalStock === 0) {
    console.log("\n✅ [PASS] Concurrency test succeeded! Exactly 5 items were sold, 0 overselling occurred.");
  } else if (successes.length <= INITIAL_STOCK && finalStock >= 0) {
    console.log(`\n✅ [PASS] Zero overselling verified: ${successes.length} items sold without negative stock.`);
  } else {
    console.error(`\n❌ [FAIL] Overselling detected! Sold: ${successes.length}, Initial: ${INITIAL_STOCK}`);
    process.exit(1);
  }

  // Restore item stock to healthy level
  DB.updateMenuItem(targetItem.id, { stock_count: 50, is_available: true });
}

testConcurrency().catch((err) => {
  console.error("Concurrency test failed with error:", err);
  process.exit(1);
});
