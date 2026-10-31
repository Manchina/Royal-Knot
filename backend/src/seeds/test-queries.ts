import { pool } from '../db';

async function testBillingQueries() {
  const weddingsRes = await pool.query(`
    SELECT 
      w.id,
      w.code,
      c.bride_name || ' & ' || c.groom_name as couple,
      w.destination_city as city,
      w.primary_venue as venue,
      TO_CHAR(w.start_date, 'Mon DD') || ' - ' || TO_CHAR(w.end_date, 'DD, YYYY') as "startDate",
      w.estimated_guest_count as "guestCount",
      w.actual_banquet_headcount as "actualHeadcount",
      w.package_type as "packageType",
      w.status,
      w.total_budget as "budgetNum"
    FROM weddings w
    JOIN clients c ON w.client_id = c.id
    ORDER BY w.code ASC
  `);
  console.log(`Fetched ${weddingsRes.rows.length} weddings from DB:`);
  console.log(weddingsRes.rows.map(r => ({ code: r.code, couple: r.couple, status: r.status, budget: r.budgetNum })));

  const extrasRes = await pool.query(`
    SELECT ec.id, ec.wedding_id, ec.category, ec.description, ec.total_amount, COALESCE(v.business_name, 'Vendor') as vendor
    FROM wedding_extra_charges ec
    LEFT JOIN vendors v ON ec.vendor_id = v.id
  `);
  console.log(`Fetched ${extrasRes.rows.length} extra charges from DB`);

  const billsRes = await pool.query(`
    SELECT vb.id, vb.wedding_id, v.business_name, vb.agreed_base_amount, vb.extra_charges_amount, vb.total_payable, vb.balance_due, vb.status
    FROM vendor_bills vb
    JOIN vendors v ON vb.vendor_id = v.id
  `);
  console.log(`Fetched ${billsRes.rows.length} vendor bills from DB`);

  const invoicesRes = await pool.query(`
    SELECT ci.id, ci.wedding_id, ci.invoice_number, ci.stage_key, ci.amount_due, ci.status
    FROM client_invoices ci
  `);
  console.log(`Fetched ${invoicesRes.rows.length} invoices from DB`);

  process.exit(0);
}

testBillingQueries();
