import { DB, seedDatabase } from "../src/lib/db";

console.log("🌱 Seeding Aura Cafe Operating System Database...");

try {
  seedDatabase(true); // force seed or initialize
  const cafe = DB.getCafe();
  const tables = DB.getAllTables();
  const menu = DB.getPublicMenu();
  const ingredients = DB.getAllIngredients();
  const vendors = DB.getAllVendors();

  console.log(`✅ Successfully seeded database for: ${cafe.name}`);
  console.log(`   • Tables: ${tables.length}`);
  console.log(`   • Menu Items: ${menu.items.length} across ${menu.categories.length} categories`);
  console.log(`   • Ingredients: ${ingredients.length}`);
  console.log(`   • Vendors: ${vendors.length}`);
  console.log(`   • Staff accounts initialized (admin: 1234, manager: 1111, barista: 2345, waitstaff: 3456, cashier: 4567)`);
  console.log("✨ Seeding completed successfully!");
} catch (err) {
  console.error("❌ Seeding failed:", err);
  process.exit(1);
}
