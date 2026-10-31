import { pool } from '../db';

async function checkData() {
  try {
    const weddings = await pool.query(`
      SELECT w.id, w.code, w.package_type, w.primary_venue, w.total_budget, w.status, c.bride_name, c.groom_name
      FROM weddings w
      JOIN clients c ON w.client_id = c.id
    `);
    console.log('--- WEDDINGS IN DB ---');
    console.table(weddings.rows);

    const invoices = await pool.query(`
      SELECT id, wedding_id, invoice_number, stage_key, amount_due, status, paid_amount
      FROM client_invoices
    `);
    console.log('--- CLIENT INVOICES IN DB ---');
    console.table(invoices.rows);

    const extras = await pool.query(`
      SELECT id, wedding_id, category, description, quantity, unit_rate, total_amount
      FROM wedding_extra_charges
    `);
    console.log('--- EXTRA CHARGES IN DB ---');
    console.table(extras.rows);

    const bills = await pool.query(`
      SELECT vb.id, vb.wedding_id, v.business_name, vb.agreed_base_amount, vb.extra_charges_amount, vb.total_payable, vb.balance_due, vb.status
      FROM vendor_bills vb
      JOIN vendors v ON vb.vendor_id = v.id
    `);
    console.log('--- VENDOR BILLS IN DB ---');
    console.table(bills.rows);

    const checkins = await pool.query(`
      SELECT vc.id, v.business_name, vc.status, vc.delay_minutes, v.rating_score
      FROM day_of_vendor_checkins vc
      JOIN vendors v ON vc.vendor_id = v.id
    `);
    console.log('--- VENDOR CHECKINS IN DB ---');
    console.table(checkins.rows);

  } catch (err) {
    console.error('Error checking DB:', err);
  } finally {
    await pool.end();
  }
}

checkData();
