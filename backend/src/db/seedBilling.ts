import { pool } from './index';

export async function seedAllBillingData() {
  console.log('🌱 Seeding billing data for all weddings...');

  // Get weddings
  const weddingsRes = await pool.query('SELECT id, code, total_budget FROM weddings');
  const weddingMap: Record<string, { id: string; budget: number }> = {};
  for (const w of weddingsRes.rows) {
    weddingMap[w.code] = { id: w.id, budget: Number(w.total_budget) || 25000000 };
  }

  // Get vendors
  const vendorsRes = await pool.query('SELECT id, business_name, category FROM vendors');
  const vendorMap: Record<string, string> = {};
  for (const v of vendorsRes.rows) {
    vendorMap[v.category] = v.id;
    vendorMap[v.business_name] = v.id;
  }

  const catererId = vendorMap['CATERER'] || vendorsRes.rows[0]?.id;
  const decorId = vendorMap['DECORATOR'] || vendorsRes.rows[1]?.id;
  const djId = vendorMap['DJ'] || vendorsRes.rows[2]?.id;
  const photoId = vendorMap['PHOTOGRAPHY'] || vendorsRes.rows[3]?.id;

  // 1. Seed for RW-2026-002
  const w2 = weddingMap['RW-2026-002'];
  if (w2) {
    const inv1 = '20000001-0000-0000-0000-000000000001';
    const inv2 = '20000001-0000-0000-0000-000000000002';
    const inv3 = '20000001-0000-0000-0000-000000000003';

    await pool.query(
      `INSERT INTO client_invoices (id, wedding_id, invoice_number, stage_key, amount_due, due_date, status, paid_amount, paid_at, payment_reference)
       VALUES
        ($1, $4, 'INV-2026-002-A', 'BOOKING_DEPOSIT', 5500000.00, '2026-07-15', 'PAID', 5500000.00, '2026-07-14 10:00:00', 'HDFC-RTGS-554433'),
        ($2, $4, 'INV-2026-002-B', 'PRE_WEDDING_ADVANCE', 13750000.00, '2026-10-15', 'PAID', 13750000.00, '2026-10-12 14:20:00', 'ICICI-IMPS-887766'),
        ($3, $4, 'INV-2026-002-C', 'FINAL_SETTLEMENT', 8340000.00, '2026-11-30', 'UNPAID', 0.00, NULL, NULL)
       ON CONFLICT (id) DO NOTHING`,
      [inv1, inv2, inv3, w2.id]
    );

    await pool.query(
      `INSERT INTO wedding_extra_charges (wedding_id, category, description, quantity, unit_rate, total_amount, vendor_id, is_billed_to_client, client_invoice_id)
       VALUES
        ($1, 'VINTAGE_CAR', 'Vintage Rolls Royce Phantom for Groom Baraat procession', 1.00, 55000.00, 55000.00, $2, TRUE, $3),
        ($1, 'ADDITIONAL_POWER', 'Silent Diesel Generator backup (125 kVA) for palace lawn', 1.00, 35000.00, 35000.00, $4, TRUE, $3)
       ON CONFLICT DO NOTHING`,
      [w2.id, catererId, inv3, djId]
    );

    await pool.query(
      `INSERT INTO vendor_bills (wedding_id, vendor_id, agreed_base_amount, extra_charges_amount, total_payable, advance_paid, balance_due, status)
       VALUES
        ($1, $2, 6500000.00, 55000.00, 6555000.00, 3500000.00, 3055000.00, 'RECONCILED_MATCHED'),
        ($1, $3, 4500000.00, 0.00, 4500000.00, 2500000.00, 2000000.00, 'PENDING'),
        ($1, $4, 1800000.00, 35000.00, 1835000.00, 1000000.00, 835000.00, 'RECONCILED_MATCHED')
       ON CONFLICT DO NOTHING`,
      [w2.id, catererId, decorId, djId]
    );
  }

  // 2. Seed for RW-2026-003
  const w3 = weddingMap['RW-2026-003'];
  if (w3) {
    const inv1 = '30000001-0000-0000-0000-000000000001';
    const inv2 = '30000001-0000-0000-0000-000000000002';
    const inv3 = '30000001-0000-0000-0000-000000000003';

    await pool.query(
      `INSERT INTO client_invoices (id, wedding_id, invoice_number, stage_key, amount_due, due_date, status, paid_amount, paid_at, payment_reference)
       VALUES
        ($1, $4, 'INV-2026-003-A', 'BOOKING_DEPOSIT', 6000000.00, '2026-09-01', 'PAID', 6000000.00, '2026-08-30 11:00:00', 'AXIS-NEFT-112233'),
        ($2, $4, 'INV-2026-003-B', 'PRE_WEDDING_ADVANCE', 15000000.00, '2026-12-15', 'UNPAID', 0.00, NULL, NULL),
        ($3, $4, 'INV-2026-003-C', 'FINAL_SETTLEMENT', 9000000.00, '2027-01-25', 'UNPAID', 0.00, NULL, NULL)
       ON CONFLICT (id) DO NOTHING`,
      [inv1, inv2, inv3, w3.id]
    );

    await pool.query(
      `INSERT INTO vendor_bills (wedding_id, vendor_id, agreed_base_amount, extra_charges_amount, total_payable, advance_paid, balance_due, status)
       VALUES
        ($1, $2, 7000000.00, 0.00, 7000000.00, 2000000.00, 5000000.00, 'PENDING'),
        ($1, $3, 1200000.00, 0.00, 1200000.00, 600000.00, 600000.00, 'PENDING'),
        ($1, $4, 2200000.00, 0.00, 2200000.00, 1000000.00, 1200000.00, 'PENDING')
       ON CONFLICT DO NOTHING`,
      [w3.id, catererId, djId, photoId]
    );
  }

  // 3. Seed for RW-2026-004
  const w4 = weddingMap['RW-2026-004'];
  if (w4) {
    const inv1 = '40000001-0000-0000-0000-000000000001';
    const inv2 = '40000001-0000-0000-0000-000000000002';
    const inv3 = '40000001-0000-0000-0000-000000000003';

    await pool.query(
      `INSERT INTO client_invoices (id, wedding_id, invoice_number, stage_key, amount_due, due_date, status, paid_amount, paid_at, payment_reference)
       VALUES
        ($1, $4, 'INV-2026-004-A', 'BOOKING_DEPOSIT', 6000000.00, '2026-09-10', 'PAID', 6000000.00, '2026-09-08 16:45:00', 'SBI-RTGS-991122'),
        ($2, $4, 'INV-2026-004-B', 'PRE_WEDDING_ADVANCE', 15000000.00, '2026-11-20', 'PAID', 15000000.00, '2026-11-18 12:00:00', 'HDFC-NEFT-665544'),
        ($3, $4, 'INV-2026-004-C', 'FINAL_SETTLEMENT', 9000000.00, '2027-02-28', 'UNPAID', 0.00, NULL, NULL)
       ON CONFLICT (id) DO NOTHING`,
      [inv1, inv2, inv3, w4.id]
    );

    await pool.query(
      `INSERT INTO vendor_bills (wedding_id, vendor_id, agreed_base_amount, extra_charges_amount, total_payable, advance_paid, balance_due, status)
       VALUES
        ($1, $2, 5800000.00, 0.00, 5800000.00, 3000000.00, 2800000.00, 'RECONCILED_MATCHED'),
        ($1, $3, 3800000.00, 0.00, 3800000.00, 2000000.00, 1800000.00, 'PENDING')
       ON CONFLICT DO NOTHING`,
      [w4.id, catererId, decorId]
    );
  }

  // 4. Seed for RW-2026-005 (Finalised & Settled)
  const w5 = weddingMap['RW-2026-005'];
  if (w5) {
    const inv1 = '50000001-0000-0000-0000-000000000001';
    const inv2 = '50000001-0000-0000-0000-000000000002';
    const inv3 = '50000001-0000-0000-0000-000000000003';

    await pool.query(
      `INSERT INTO client_invoices (id, wedding_id, invoice_number, stage_key, amount_due, due_date, status, paid_amount, paid_at, payment_reference)
       VALUES
        ($1, $4, 'INV-2026-005-A', 'BOOKING_DEPOSIT', 6000000.00, '2026-08-01', 'PAID', 6000000.00, '2026-07-31 10:15:00', 'ICICI-NEFT-332211'),
        ($2, $4, 'INV-2026-005-B', 'PRE_WEDDING_ADVANCE', 15000000.00, '2026-09-20', 'PAID', 15000000.00, '2026-09-19 14:00:00', 'HDFC-RTGS-445566'),
        ($3, $4, 'INV-2026-005-C', 'FINAL_SETTLEMENT', 9000000.00, '2026-10-25', 'PAID', 9000000.00, '2026-10-24 16:30:00', 'AXIS-IMPS-778899')
       ON CONFLICT (id) DO NOTHING`,
      [inv1, inv2, inv3, w5.id]
    );

    await pool.query(
      `INSERT INTO vendor_bills (wedding_id, vendor_id, agreed_base_amount, extra_charges_amount, total_payable, advance_paid, balance_due, status)
       VALUES
        ($1, $2, 6000000.00, 0.00, 6000000.00, 6000000.00, 0.00, 'SETTLEMENT_CLEARED'),
        ($1, $3, 4000000.00, 0.00, 4000000.00, 4000000.00, 0.00, 'SETTLEMENT_CLEARED')
       ON CONFLICT DO NOTHING`,
      [w5.id, catererId, decorId]
    );
  }

  console.log('✅ Billing seeding completed successfully across all weddings!');
}

if (process.argv[1] && process.argv[1].endsWith('seedBilling.ts')) {
  seedAllBillingData()
    .then(() => process.exit(0))
    .catch((e) => {
      console.error(e);
      process.exit(1);
    });
}
