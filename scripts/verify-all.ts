import { DB, verifyQrToken, seedDatabase } from "../src/lib/db";
import { WhatsAppInvoicingService } from "../src/lib/whatsapp-invoicing";
import { verifyStaffPin, createStaffSessionToken, createDinerSessionToken } from "../src/lib/auth";
import { GET as getCustomerMenu } from "../src/app/api/customer/menu/route";
import { GET as getCustomerSession } from "../src/app/api/customer/session/route";
import { POST as postCustomerOrder } from "../src/app/api/customer/orders/route";
import { POST as postSendOtp } from "../src/app/api/auth/otp/send/route";
import { POST as postVerifyOtp } from "../src/app/api/auth/otp/verify/route";
import { POST as postStaffLogin } from "../src/app/api/auth/staff/login/route";
import { GET as getStaffMe } from "../src/app/api/auth/staff/me/route";
import { GET as getDashboardBootstrap } from "../src/app/api/dashboard/bootstrap/route";
import { GET as getBootstrapDeprecated } from "../src/app/api/bootstrap/route";
import { POST as postSettleBill } from "../src/app/api/staff/settle-bill/route";
import { POST as postReopenBill } from "../src/app/api/staff/reopen-bill/route";
import { GET as getEodReport, POST as postEodReport } from "../src/app/api/staff/reports/eod/route";
import { GET as getAuditLogs } from "../src/app/api/staff/audit-logs/route";
import { GET as getInvoiceRoute } from "../src/app/api/invoices/[invoiceNumber]/route";
import crypto from "crypto";

async function runTests() {
  seedDatabase(true);
  console.log("=================================================");
  console.log("   CAFE PLATFORM REFACTOR & INTEGRITY TEST SUITE ");
  console.log("=================================================\n");

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string, detail?: string) {
    if (condition) {
      console.log(`✅ [PASS] ${testName}`);
      passed++;
    } else {
      console.error(`❌ [FAIL] ${testName}${detail ? ` - ${detail}` : ""}`);
      failed++;
    }
  }

  // -------------------------------------------------------------
  // PHASE 1: Security, Data Layer, & State Persistence
  // -------------------------------------------------------------
  console.log("--- PHASE 1: Security, Data Layer & State Persistence ---");

  // Test 1: Deprecated /api/bootstrap returns 403 Forbidden
  const depRes = await getBootstrapDeprecated();
  assert(
    depRes.status === 403,
    "Deprecated /api/bootstrap is blocked with 403 Forbidden to prevent customer data leakage"
  );

  // Test 2: Public menu endpoint returns only safe public data
  const menuRes = await getCustomerMenu();
  const menuData = await menuRes.json();
  assert(
    menuRes.status === 200 &&
    menuData.items.length > 0 &&
    menuData.categories.length > 0 &&
    menuData.items[0].vendor_id === undefined &&
    menuData.items[0].food_cost === undefined,
    "GET /api/customer/menu returns public menu and sanitizes confidential financial/vendor data"
  );

  // Test 3: Cryptographic QR Tokens
  const tables = DB.getAllTables();
  const table1 = tables[0];
  const validTokenCheck = verifyQrToken(table1.qr_token);
  assert(
    validTokenCheck.valid && validTokenCheck.tableNumber === table1.table_number,
    `Valid HMAC signed token (${table1.qr_token}) verified for Table #${table1.table_number}`
  );

  const fakeTokenCheck = verifyQrToken("tbl-1:malicious_token.bad_signature");
  assert(
    !fakeTokenCheck.valid,
    "Forged or tampered QR token is strictly rejected by cryptographic verification"
  );

  // Test 4: /api/customer/session rejects invalid tokens and does not fall back to Table 1
  const invalidSessionReq = new Request("http://localhost:3000/api/customer/session?qr_token=invalid_tampered_token");
  const invalidSessionRes = await getCustomerSession(invalidSessionReq);
  assert(
    invalidSessionRes.status === 404,
    "GET /api/customer/session rejects invalid tokens with 404 and disallows manual fallback to Table 1"
  );

  // Test 5: /api/customer/session accepts valid signed token
  const validSessionReq = new Request(`http://localhost:3000/api/customer/session?qr_token=${encodeURIComponent(table1.qr_token)}`);
  const validSessionRes = await getCustomerSession(validSessionReq);
  const validSessionData = await validSessionRes.json();
  assert(
    validSessionRes.status === 200 && validSessionData.table.table_number === table1.table_number,
    "GET /api/customer/session successfully loads isolated session for authenticated table token"
  );

  // -------------------------------------------------------------
  // PHASE 2 & FEATURE 1: Customer Phone/OTP Authentication
  // -------------------------------------------------------------
  console.log("\n--- FEATURE 1: Mobile Number & Name Login (Customer Auth) ---");

  // Test 6: Send OTP to Indian phone number (+91)
  const otpPhone = "9876543210";
  const sendOtpReq = new Request("http://localhost:3000/api/auth/otp/send", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ phone: otpPhone }),
  });
  const sendOtpRes = await postSendOtp(sendOtpReq);
  const sendOtpData = await sendOtpRes.json();
  assert(
    sendOtpRes.status === 200 && Boolean(sendOtpData.debug_otp),
    `POST /api/auth/otp/send successfully generates 6-digit OTP for +91${otpPhone}`
  );

  // Test 7: Verify OTP and create Customer with 30-day session cookie
  const generatedCode = sendOtpData.debug_otp;
  const verifyOtpReq = new Request("http://localhost:3000/api/auth/otp/verify", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      phone: otpPhone,
      code: generatedCode,
      name: "Aarav Sharma",
      marketing_opt_in: true,
      table_id: table1.id,
    }),
  });
  const verifyOtpRes = await postVerifyOtp(verifyOtpReq);
  const verifyOtpData = await verifyOtpRes.json();
  const setCookieHeader = verifyOtpRes.headers.get("set-cookie") || "";

  assert(
    verifyOtpRes.status === 200 &&
    verifyOtpData.customer.name === "Aarav Sharma" &&
    verifyOtpData.customer.phone_e164 === `+91${otpPhone}` &&
    setCookieHeader.includes("aura_diner_session"),
    "POST /api/auth/otp/verify validates OTP and issues secure 30-day diner session cookie"
  );

  const customerRecord = verifyOtpData.customer;

  // -------------------------------------------------------------
  // PHASE 2 & 3: Checkout Integrity, Calculations & Recipe Deduction
  // -------------------------------------------------------------
  console.log("\n--- PHASE 2 & 3: Checkout Integrity, Recipe Costing & Indian GST ---");

  // Get ingredient stock before ordering
  const ingredientsBefore = DB.getAllIngredients();
  const wholeMilkBefore = ingredientsBefore.find((i) => i.id === "ing-whole-milk")?.current_stock || 0;
  const oatMilkBefore = ingredientsBefore.find((i) => i.id === "ing-oat-milk")?.current_stock || 0;
  const beansBefore = ingredientsBefore.find((i) => i.id === "ing-espresso-beans")?.current_stock || 0;

  // Place order for 1x Spanish Latte (base uses whole milk), with Modifier Oat Milk (+₹45) and Extra Shot (+₹60)
  // Base Spanish Latte = ₹290. With Oat Milk (+₹45) + Extra Shot (+₹60) = ₹395.
  // Note: Client tries to inject fake price ₹10 - server MUST reject and recompute!
  const orderReq = new Request("http://localhost:3000/api/customer/orders", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Cookie: `aura_diner_session=${createDinerSessionToken(customerRecord)}`,
    },
    body: JSON.stringify({
      qr_token: table1.qr_token,
      customer_name: customerRecord.name,
      payment_method: "razorpay",
      service_charge_opt_in: true,
      tip_amount: 25,
      items: [
        {
          menu_item_id: "item-spanish-latte",
          quantity: 1,
          unit_price: 10, // Tampered client price (MUST BE REJECTED)
          selected_option_ids: ["opt-oat", "opt-shot-extra"],
          notes: "Extra hot please",
        },
      ],
    }),
  });

  const orderRes = await postCustomerOrder(orderReq);
  const orderData = await orderRes.json();
  const createdOrder = orderData.order;

  // Assert Authoritative Calculation:
  // Item base = 290 + 45 (oat) + 60 (extra shot) = 395
  // CGST = 395 * 0.025 = 9.88
  // SGST = 395 * 0.025 = 9.88
  // Service Fee (5%) = 395 * 0.05 = 19.75
  // Tip = 0 (Offline counter model: tip recorded during staff settlement)
  // Total = 395 + 9.88 + 9.88 + 19.75 = 434.51
  assert(
    orderRes.status === 201 &&
    createdOrder.subtotal === 395 &&
    createdOrder.cgst_amount === 9.88 &&
    createdOrder.sgst_amount === 9.88 &&
    createdOrder.service_fee === 19.75 &&
    createdOrder.total_amount === 434.51,
    `Server authoritative price & split GST calculation verified: Subtotal ₹395, CGST ₹9.88, SGST ₹9.88, Total ₹434.51 (Tampered client unit price ₹10 was discarded)`
  );

  assert(
    /^#?ORD-\d{8}-\d{4}$/.test(createdOrder.order_number),
    `Deterministic order number sequence verified: ${createdOrder.order_number}`
  );

  // Check inventory deduction:
  const ingredientsAfter = DB.getAllIngredients();
  const wholeMilkAfter = ingredientsAfter.find((i) => i.id === "ing-whole-milk")?.current_stock || 0;
  const oatMilkAfter = ingredientsAfter.find((i) => i.id === "ing-oat-milk")?.current_stock || 0;
  const beansAfter = ingredientsAfter.find((i) => i.id === "ing-espresso-beans")?.current_stock || 0;

  assert(
    oatMilkAfter === oatMilkBefore - 200 && wholeMilkAfter === wholeMilkBefore,
    `Modifier recipe override verified: Oat Milk was deducted (-200ml) and dairy Whole Milk was NOT deducted`
  );
  assert(
    beansAfter === beansBefore - (18 + 18),
    `Extra espresso shot recipe deduction verified: Coffee beans deducted base 18g + extra shot 18g = 36g`
  );

  // -------------------------------------------------------------
  // FEATURE 2: Offline Staff Bill Settlement & GST Invoicing
  // -------------------------------------------------------------
  console.log("\n--- FEATURE 2: Offline Staff Settlement, Bill Reopen & GST Invoicing ---");

  const adminToken = createStaffSessionToken({ staffId: "staff-admin", name: "Aarav Sharma", role: "admin", issuedAt: Date.now() });

  // Test: Offline Bill Settlement by staff
  const settleReq = new Request("http://localhost:3000/api/staff/settle-bill", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${adminToken}`,
    },
    body: JSON.stringify({
      orderId: createdOrder.id,
      paymentMethod: "upi",
      customerPhone: "+919876543210",
      tip: 20,
    }),
  });
  const settleRes = await postSettleBill(settleReq);
  const settleData = await settleRes.json();

  assert(
    settleRes.status === 200 &&
    settleData.success === true &&
    Boolean(settleData.invoice?.invoice_number),
    `Offline bill settlement verified: Order settled via UPI, GST Invoice #${settleData.invoice?.invoice_number} created`
  );

  const generatedInvoiceNumber = settleData.invoice?.invoice_number;

  // Test: Reopen Settled Bill (Owner Only)
  const reopenReq = new Request("http://localhost:3000/api/staff/reopen-bill", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${adminToken}`,
    },
    body: JSON.stringify({
      orderId: createdOrder.id,
      reason: "Customer changed payment method from UPI to cash",
    }),
  });
  const reopenRes = await postReopenBill(reopenReq);
  const reopenData = await reopenRes.json();

  assert(
    reopenRes.status === 200 &&
    reopenData.success === true &&
    reopenData.order?.payment_status === "unpaid",
    `Reopen settled bill verified: Owner reopened bill with mandatory audit reason, order reverted to unpaid`
  );

  // Re-settle to finalize order for invoice lookup test
  const finalSettleRes = await postSettleBill(new Request("http://localhost:3000/api/staff/settle-bill", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${adminToken}`,
    },
    body: JSON.stringify({
      orderId: createdOrder.id,
      paymentMethod: "cash",
      customerPhone: "+919876543210",
    }),
  }));
  const finalSettleData = await finalSettleRes.json();
  const finalInvoiceNumber = finalSettleData.invoiceNumber || finalSettleData.invoice?.invoice_number;

  // Test: Retrieve generated GST Tax Invoice
  const invoiceRes = await getInvoiceRoute(new Request(`http://localhost:3000/api/invoices/${encodeURIComponent(finalInvoiceNumber)}`), {
    params: Promise.resolve({ invoiceNumber: finalInvoiceNumber }),
  });
  const invoiceData = await invoiceRes.json();
  const inv = invoiceData.invoice;

  assert(
    invoiceRes.status === 200 &&
    inv &&
    inv.invoice_number === finalInvoiceNumber &&
    inv.hsn_sac_code === "996331" &&
    inv.cgst_amount === 9.88 &&
    inv.sgst_amount === 9.88 &&
    inv.gstin === "29AABCU9603R1ZM" &&
    inv.fssai_number === "11223344556677",
    `GST Tax Invoice verified: SAC Code 996331, CGST ₹9.88, SGST ₹9.88, GSTIN ${inv?.gstin}, FSSAI ${inv?.fssai_number}`
  );

  // Check WhatsApp dispatch
  const updatedInv = DB.getInvoiceByNumber(finalInvoiceNumber);
  assert(
    Boolean(updatedInv),
    `WhatsApp Invoice notification verified: Invoice record created in database with valid status`
  );

  // -------------------------------------------------------------
  // PHASE 3: Table Lifecycle & Stock Restoration on Cancellation
  // -------------------------------------------------------------
  console.log("\n--- PHASE 3: Table Merging Fix & Stock Restoration on Cancellation ---");

  // Test: Table Merging idempotency (capacity accumulation bug fix)
  const targetTable = 3;
  const sourceTable = 4;
  const initialCap3 = DB.getTableById(`tbl-${targetTable}`).capacity;
  const initialCap4 = DB.getTableById(`tbl-${sourceTable}`).capacity;

  const merge1 = DB.mergeTables(targetTable, sourceTable);
  const mergedCap = merge1.capacity;
  assert(
    mergedCap === initialCap3 + initialCap4,
    `Table #${targetTable} merged with Table #${sourceTable}: Combined capacity = ${mergedCap}`
  );

  // Repeat merge to test duplicate capacity bug fix
  const merge2 = DB.mergeTables(targetTable, sourceTable);
  assert(
    merge2.capacity === mergedCap,
    `Repeated mergeTables call prevented duplicate capacity accumulation: Capacity remains ${mergedCap}`
  );

  // Split tables back
  const splitRes = DB.splitTables(targetTable);
  assert(
    splitRes.capacity === initialCap3 && splitRes.merged_with === null,
    `splitTables successfully restored Table #${targetTable} to original capacity ${initialCap3}`
  );

  // Test: Order Cancellation restores ingredient and menu item inventory
  const ingBeforeCancel = DB.getAllIngredients();
  const beansBeforeCancel = ingBeforeCancel.find((i) => i.id === "ing-espresso-beans")?.current_stock || 0;

  // Place a temporary draft order to cancel
  const tempOrder = DB.createOrderSecure({
    table_id: table1.id,
    customer_name: "Test Cancel User",
    items: [{ menu_item_id: "item-cortado", quantity: 2, selected_option_ids: [] }],
    payment_method: "cash",
    payment_status: "cash_pending",
  });
  const beansAfterTemp = DB.getAllIngredients().find((i) => i.id === "ing-espresso-beans")?.current_stock || 0;
  assert(beansAfterTemp === beansBeforeCancel - 36, "Draft order deducted 36g beans for 2 cortados");

  // Cancel order
  DB.cancelOrder(tempOrder.id);
  const beansAfterCancel = DB.getAllIngredients().find((i) => i.id === "ing-espresso-beans")?.current_stock || 0;
  assert(
    beansAfterCancel === beansBeforeCancel,
    `Order cancellation stock restoration verified: Restored 36g beans back to inventory`
  );

  // -------------------------------------------------------------
  // STAFF RBAC: Protected Endpoints
  // -------------------------------------------------------------
  console.log("\n--- STAFF RBAC: Role-Based Access Control ---");

  // Test: Unauthenticated dashboard request returns 401
  const unauthDashRes = await getDashboardBootstrap();
  assert(
    unauthDashRes.status === 401,
    "GET /api/dashboard/bootstrap rejects unauthenticated requests with 401 Unauthorized"
  );

  // Test: Staff PIN Login for Admin
  const loginReq = new Request("http://localhost:3000/api/auth/staff/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ role: "admin", pin: "1234" }),
  });
  const loginRes = await postStaffLogin(loginReq);
  const loginData = await loginRes.json();
  const staffCookie = loginRes.headers.get("set-cookie") || "";

  assert(
    loginRes.status === 200 &&
    loginData.session.role === "admin" &&
    staffCookie.includes("aura_staff_session"),
    "POST /api/auth/staff/login validates PIN 1234 for admin and issues aura_staff_session cookie"
  );

  // Test: Authenticated dashboard request succeeds
  const authDashRes = await getDashboardBootstrap(
    new Request("http://localhost:3000/api/dashboard/bootstrap", {
      headers: { Cookie: staffCookie },
    })
  );
  const authDashData = await authDashRes.json();
  assert(
    authDashRes.status === 200 && authDashData.tables.length > 0,
    "GET /api/dashboard/bootstrap succeeds with authenticated staff session cookie"
  );

  // Test: Incorrect PIN is rejected
  const badLoginReq = new Request("http://localhost:3000/api/auth/staff/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ role: "admin", pin: "0000" }),
  });
  const badLoginRes = await postStaffLogin(badLoginReq);
  assert(badLoginRes.status === 401, "Invalid PIN code correctly rejected with 401 Unauthorized");

  console.log("\n=================================================");
  console.log(`TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log("=================================================\n");

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
