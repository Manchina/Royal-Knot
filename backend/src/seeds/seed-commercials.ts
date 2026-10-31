import { pool } from '../db';

export async function seedCommercialsRealtimeData() {
  console.log('🚀 Seeding Umesh Commercials Realtime PostgreSQL Database Tables...');

  // 1. Ensure Clients
  const client1 = await pool.query(`
    INSERT INTO clients (id, bride_name, groom_name, primary_contact_name, email, phone, city_of_residence, notes)
    VALUES 
      ('b0000001-0000-0000-0000-000000000001', 'Aanya Singhania', 'Raghav Mehra', 'Raghav Mehra', 'client@royalknot.com', '+91 98290 11223', 'Mumbai', 'VIP Royal Udaipur 3-Day Wedding'),
      ('b0000001-0000-0000-0000-000000000002', 'Kriti Maheshwari', 'Siddharth Jain', 'Siddharth Jain', 'siddharth@client.in', '+91 98110 44556', 'New Delhi', 'Jaipur Heritage Fort Wedding'),
      ('b0000001-0000-0000-0000-000000000003', 'Simran Bajaj', 'Armaan Gill', 'Armaan Gill', 'armaan@client.in', '+91 99887 66554', 'Bangalore', 'Palace Chic with 500 Guests'),
      ('b0000001-0000-0000-0000-000000000004', 'Pooja Agarwal', 'Rohan Kapoor', 'Rohan Kapoor', 'rohan@kapoor.in', '+91 98290 55443', 'Jodhpur', 'Umaid Bhawan Palace Extravaganza'),
      ('b0000001-0000-0000-0000-000000000005', 'Meera Singhal', 'Arjun Chawla', 'Arjun Chawla', 'arjun@chawla.in', '+91 98290 66554', 'Udaipur', 'Taj Lake Palace Island Wedding')
    ON CONFLICT (id) DO UPDATE SET
      bride_name = EXCLUDED.bride_name,
      groom_name = EXCLUDED.groom_name,
      primary_contact_name = EXCLUDED.primary_contact_name
    RETURNING id
  `);
  console.log(`✓ Clients verified`);

  // 2. Ensure Vendors
  await pool.query(`
    INSERT INTO vendors (id, business_name, category, contact_person, phone, email, city, rating_score)
    VALUES
      ('e0000001-0000-0000-0000-000000000001', 'Royal Rasoi Caterers', 'CATERER', 'Chef Mahendra Singh', '+91 98290 88771', 'quotes@royalrasoi.com', 'Jaipur', 4.90),
      ('e0000001-0000-0000-0000-000000000002', 'Marwar Heritage Kitchens', 'CATERER', 'Vikram Choudhary', '+91 98290 88772', 'contact@marwarkitchens.com', 'Udaipur', 4.85),
      ('e0000001-0000-0000-0000-000000000003', 'Rajputana Feasts & Banquets', 'CATERER', 'Harshvardhan Rathore', '+91 98290 88773', 'info@rajputanafeasts.com', 'Jodhpur', 4.70),
      ('e0000001-0000-0000-0000-000000000004', 'Mewar Royal Florals & Decor', 'DECORATOR', 'Sunil Gehlot', '+91 98290 88774', 'events@mewarflorals.com', 'Udaipur', 4.95),
      ('e0000001-0000-0000-0000-000000000005', 'Jodhpur Beats & Sound Production', 'DJ', 'DJ Rohit Sen', '+91 98290 88775', 'beats@jodhpurdj.com', 'Jodhpur', 4.80),
      ('e0000001-0000-0000-0000-000000000006', 'Jaipur Dhol Tasha Troupe', 'DRUMMERS', 'Master Ratan Lal', '+91 98290 88776', 'dhol@jaipurtroupe.in', 'Jaipur', 4.90),
      ('e0000001-0000-0000-0000-000000000007', 'Udaipur Royal Cinematography', 'PHOTOGRAPHY', 'Aman Khurana', '+91 98290 88777', 'hello@udaipurcinema.in', 'Udaipur', 5.00),
      ('e0000001-0000-0000-0000-000000000008', 'Royal Rajputana Fleet', 'TRANSPORT', 'Gajendra Singh', '+91 98290 99881', 'fleet@rajputana.com', 'Jaipur', 4.85),
      ('e0000001-0000-0000-0000-000000000009', 'Jaipur Power Grid Rentals', 'INFRASTRUCTURE', 'Mohit Sharma', '+91 98290 99882', 'power@jaipurpower.in', 'Jaipur', 4.75),
      ('e0000001-0000-0000-0000-000000000010', 'Lake Pichola Royal Charters', 'TRANSPORT', 'Bhairon Singh', '+91 98290 99883', 'boats@pichola.com', 'Udaipur', 4.90)
    ON CONFLICT (id) DO UPDATE SET
      business_name = EXCLUDED.business_name,
      rating_score = EXCLUDED.rating_score
  `);
  console.log(`✓ Vendors verified`);

  // 3. Upsert Weddings (The 5 Key Commercial Projects)
  const wedding1Id = 'c0000001-0000-0000-0000-000000000001';
  const wedding2Id = 'c0000001-0000-0000-0000-000000000002';
  const wedding3Id = 'c0000001-0000-0000-0000-000000000003';
  const wedding4Id = 'c0000001-0000-0000-0000-000000000004';
  const wedding5Id = 'c0000001-0000-0000-0000-000000000005';

  await pool.query(`
    INSERT INTO weddings (id, code, client_id, package_type, theme, destination_city, primary_venue, start_date, end_date, season_year, estimated_guest_count, actual_banquet_headcount, total_budget, agency_fee, status, notes)
    VALUES 
      ($1, 'RW-2026-001', 'b0000001-0000-0000-0000-000000000001', 'Full-Service Royal Wedding', 'Royal Lakefront Heritage', 'Udaipur', 'The Oberoi Udaivilas', '2026-12-10', '2026-12-13', 2026, 400, 460, 35000000.00, 3500000.00, 'LIVE_BIG_DAY', 'Flagship 400 guests, live banquet overrun'),
      ($2, 'RW-2026-002', 'b0000001-0000-0000-0000-000000000002', 'Full-Service Royal Wedding', 'Regal Palace Romance', 'Jaipur', 'Rambagh Palace', '2026-11-20', '2026-11-23', 2026, 420, 420, 27500000.00, 2800000.00, 'IN_PLANNING', 'In planning, RFQ comparisons active'),
      ($3, 'RW-2026-003', 'b0000001-0000-0000-0000-000000000003', 'Day-of Execution', 'Regal Fortress Chic', 'Jaipur', 'Alila Fort Bishangarh', '2027-01-14', '2027-01-17', 2027, 500, NULL, 30000000.00, 1800000.00, 'BOOKED', 'Contract signed, deposit received'),
      ($4, 'RW-2025-010', 'b0000001-0000-0000-0000-000000000004', 'Heritage Royal Extravaganza', 'Desert Regal Splendor', 'Jodhpur', 'Umaid Bhawan Palace', '2026-02-12', '2026-02-15', 2026, 450, 450, 42000000.00, 4200000.00, 'FINALISED_SETTLED', 'Audited, settled and accounts cleared'),
      ($5, 'RW-2025-011', 'b0000001-0000-0000-0000-000000000005', 'Bespoke Island Wedding', 'Island Heritage Romance', 'Udaipur', 'Taj Lake Palace', '2026-01-22', '2026-01-25', 2026, 350, 350, 38000000.00, 3800000.00, 'FINALISED', 'Finalised, audit review complete')
    ON CONFLICT (code) DO UPDATE SET
      package_type = EXCLUDED.package_type,
      theme = EXCLUDED.theme,
      destination_city = EXCLUDED.destination_city,
      primary_venue = EXCLUDED.primary_venue,
      total_budget = EXCLUDED.total_budget,
      status = EXCLUDED.status,
      actual_banquet_headcount = EXCLUDED.actual_banquet_headcount
  `, [wedding1Id, wedding2Id, wedding3Id, wedding4Id, wedding5Id]);

  // Fetch actual wedding IDs mapped by code
  const wedMapRes = await pool.query(`SELECT id, code FROM weddings`);
  const codeToId = new Map(wedMapRes.rows.map((r: any) => [r.code, r.id]));

  const w1 = codeToId.get('RW-2026-001')!;
  const w2 = codeToId.get('RW-2026-002')!;
  const w3 = codeToId.get('RW-2026-003')!;
  const w4 = codeToId.get('RW-2025-010')!;
  const w5 = codeToId.get('RW-2025-011')!;

  console.log(`✓ 5 Commercial Weddings synchronized in PostgreSQL`);

  // 4. Staged Client Invoices (Scene 5 Milestone Billing)
  // Clean prior invoices for these projects to ensure fresh exact numbers
  await pool.query(`DELETE FROM client_invoices WHERE wedding_id = ANY($1)`, [[w1, w2, w3, w4, w5]]);

  await pool.query(`
    INSERT INTO client_invoices (wedding_id, invoice_number, stage_key, amount_due, due_date, status, paid_amount, paid_at, payment_reference)
    VALUES
      -- RW-2026-001 (Live Big Day)
      ($1, 'INV-2026-001-A', 'BOOKING_DEPOSIT', 7000000.00, '2026-08-15', 'PAID', 7000000.00, '2026-08-14 15:30:00', 'HDFC-NEFT-998811'),
      ($1, 'INV-2026-001-B', 'PRE_WEDDING_ADVANCE', 17500000.00, '2026-11-10', 'PAID', 17500000.00, '2026-11-09 11:20:00', 'ICICI-RTGS-776655'),
      ($1, 'INV-2026-001-C', 'FINAL_SETTLEMENT', 10656000.00, '2026-12-20', 'UNPAID', 0.00, NULL, NULL),

      -- RW-2026-002 (In Planning)
      ($2, 'INV-2026-002-A', 'BOOKING_DEPOSIT', 5500000.00, '2026-09-01', 'PAID', 5500000.00, '2026-09-01 10:15:00', 'SBI-RTGS-443322'),
      ($2, 'INV-2026-002-B', 'PRE_WEDDING_ADVANCE', 13750000.00, '2026-11-05', 'UNPAID', 0.00, NULL, NULL),
      ($2, 'INV-2026-002-C', 'FINAL_SETTLEMENT', 8335000.00, '2026-11-30', 'UNPAID', 0.00, NULL, NULL),

      -- RW-2026-003 (Booked)
      ($3, 'INV-2026-003-A', 'BOOKING_DEPOSIT', 6000000.00, '2026-10-15', 'PAID', 6000000.00, '2026-10-15 14:00:00', 'KOTAK-IMPS-112233'),
      ($3, 'INV-2026-003-B', 'PRE_WEDDING_ADVANCE', 15000000.00, '2026-12-15', 'UNPAID', 0.00, NULL, NULL),
      ($3, 'INV-2026-003-C', 'FINAL_SETTLEMENT', 9000000.00, '2027-01-25', 'UNPAID', 0.00, NULL, NULL),

      -- RW-2025-010 (Finalised & Settled)
      ($4, 'INV-2025-010-A', 'BOOKING_DEPOSIT', 8400000.00, '2025-10-01', 'PAID', 8400000.00, '2025-10-01 12:00:00', 'HDFC-RTGS-110022'),
      ($4, 'INV-2025-010-B', 'PRE_WEDDING_ADVANCE', 21000000.00, '2026-01-15', 'PAID', 21000000.00, '2026-01-14 16:30:00', 'HDFC-RTGS-110055'),
      ($4, 'INV-2025-010-C', 'FINAL_SETTLEMENT', 12940000.00, '2026-02-20', 'PAID', 12940000.00, '2026-02-20 18:00:00', 'HDFC-RTGS-110099'),

      -- RW-2025-011 (Finalised)
      ($5, 'INV-2025-011-A', 'BOOKING_DEPOSIT', 7600000.00, '2025-09-15', 'PAID', 7600000.00, '2025-09-15 11:00:00', 'AXIS-RTGS-223344'),
      ($5, 'INV-2025-011-B', 'PRE_WEDDING_ADVANCE', 19000000.00, '2025-12-20', 'PAID', 19000000.00, '2025-12-19 14:00:00', 'AXIS-RTGS-223388'),
      ($5, 'INV-2025-011-C', 'FINAL_SETTLEMENT', 11610000.00, '2026-02-05', 'PAID', 11610000.00, '2026-02-05 17:30:00', 'AXIS-RTGS-223399')
  `, [w1, w2, w3, w4, w5]);
  console.log(`✓ 15 Staged Client Milestone Invoices seeded`);

  // 5. Wedding Extra Charges (Scene 5 Banquet Extra Plates & Overruns)
  await pool.query(`DELETE FROM wedding_extra_charges WHERE wedding_id = ANY($1::uuid[])`, [[w1, w2, w3, w4, w5]]);

  await pool.query(`
    INSERT INTO wedding_extra_charges (wedding_id, category, description, quantity, unit_rate, total_amount, vendor_id, is_billed_to_client)
    VALUES
      -- RW-2026-001 (60 Extra Plates + DJ Overtime)
      ($1, 'EXTRA_PLATES', '60 Unexpected Guests turned up at the Grand Durbar Banquet', 60.00, 2100.00, 126000.00, 'e0000001-0000-0000-0000-000000000002', TRUE),
      ($1, 'DJ_OVERTIME', 'Sangeet party extended by 2.5 hours past 01:00 AM curfew', 2.50, 12000.00, 30000.00, 'e0000001-0000-0000-0000-000000000005', TRUE),

      -- RW-2026-002 (Vintage Car + Genset)
      ($2, 'VINTAGE_CAR', 'Vintage Rolls Royce Phantom for Groom Baraat entry procession', 1.00, 55000.00, 55000.00, 'e0000001-0000-0000-0000-000000000008', TRUE),
      ($2, 'ADDITIONAL_POWER', 'Silent Diesel Generator backup (125 kVA) for palace lawn', 2.00, 15000.00, 30000.00, 'e0000001-0000-0000-0000-000000000009', TRUE),

      -- RW-2025-010 (Palace Pyro + Horses)
      ($3, 'SPECIAL_FIREWORKS', 'Green Eco-Friendly Pyro Show over palace dome during Varmala', 1.00, 190000.00, 190000.00, 'e0000001-0000-0000-0000-000000000005', TRUE),
      ($3, 'ROYAL_PROCESSION', '4 Dappled Marwari Horses with silver ceremonial saddlery', 4.00, 37500.00, 150000.00, 'e0000001-0000-0000-0000-000000000008', TRUE),

      -- RW-2025-011 (Boat Shuttle)
      ($4, 'BOAT_SHUTTLE_OVERRUN', 'Extra lake speedboats running till 03:00 AM for guests', 6.00, 35000.00, 210000.00, 'e0000001-0000-0000-0000-000000000010', TRUE)
  `, [w1, w2, w4, w5]);
  console.log(`✓ Wedding Extra Charges seeded`);

  // 6. Vendor Bills (Scene 5 Two-Way Matching: Agreed vs Actuals)
  await pool.query(`DELETE FROM vendor_bills WHERE wedding_id = ANY($1::uuid[])`, [[w1, w2, w3, w4, w5]]);

  await pool.query(`
    INSERT INTO vendor_bills (wedding_id, vendor_id, agreed_base_amount, extra_charges_amount, total_payable, advance_paid, balance_due, status)
    VALUES
      -- RW-2026-001 (Live Big Day)
      ($1, 'e0000001-0000-0000-0000-000000000002', 840000.00, 126000.00, 966000.00, 420000.00, 546000.00, 'RECONCILED_MATCHED'),
      ($1, 'e0000001-0000-0000-0000-000000000004', 1400000.00, 0.00, 1400000.00, 700000.00, 700000.00, 'RECONCILED_MATCHED'),
      ($1, 'e0000001-0000-0000-0000-000000000005', 350000.00, 30000.00, 380000.00, 175000.00, 205000.00, 'RECONCILED_MATCHED'),

      -- RW-2026-002 (In Planning)
      ($2, 'e0000001-0000-0000-0000-000000000008', 220000.00, 55000.00, 275000.00, 150000.00, 125000.00, 'RECONCILED_MATCHED'),
      ($2, 'e0000001-0000-0000-0000-000000000009', 180000.00, 30000.00, 210000.00, 100000.00, 110000.00, 'RECONCILED_MATCHED'),

      -- RW-2026-003 (Booked)
      ($3, 'e0000001-0000-0000-0000-000000000001', 2200000.00, 0.00, 2200000.00, 1100000.00, 1100000.00, 'RECONCILED_MATCHED'),

      -- RW-2025-010 (Finalised & Settled)
      ($4, 'e0000001-0000-0000-0000-000000000005', 300000.00, 190000.00, 490000.00, 490000.00, 0.00, 'SETTLEMENT_CLEARED'),
      ($4, 'e0000001-0000-0000-0000-000000000008', 250000.00, 150000.00, 400000.00, 400000.00, 0.00, 'SETTLEMENT_CLEARED'),

      -- RW-2025-011 (Finalised)
      ($5, 'e0000001-0000-0000-0000-000000000010', 650000.00, 210000.00, 860000.00, 860000.00, 0.00, 'SETTLEMENT_CLEARED')
  `, [w1, w2, w3, w4, w5]);
  console.log(`✓ Vendor Bills for Two-Way Matching seeded`);

  // 7. Day-of Vendor Checkins (Scene 6 Vendor Scorecard & Reliability)
  await pool.query(`DELETE FROM day_of_vendor_checkins WHERE wedding_id = ANY($1::uuid[])`, [[w1, w2, w3, w4, w5]]);

  await pool.query(`
    INSERT INTO day_of_vendor_checkins (wedding_id, vendor_id, scheduled_arrival_time, actual_arrival_time, status, delay_minutes, remarks)
    VALUES
      ($1, 'e0000001-0000-0000-0000-000000000004', NOW() - interval '6 hours', NOW() - interval '6 hours', 'ARRIVED', 0, 'Mandap structure team arrived on schedule'),
      ($1, 'e0000001-0000-0000-0000-000000000002', NOW() - interval '4 hours', NOW() - interval '3 hours 50 minutes', 'ARRIVED', 10, 'Slight highway traffic delay at toll plaza'),
      ($1, 'e0000001-0000-0000-0000-000000000005', NOW() - interval '2 hours', NOW() - interval '1 hour 40 minutes', 'ARRIVED', 20, 'Sound technician delayed; patched in time'),
      ($1, 'e0000001-0000-0000-0000-000000000007', NOW() - interval '5 hours', NOW() - interval '5 hours', 'ARRIVED', 0, 'Cinematography team arrived 15 mins early'),
      ($2, 'e0000001-0000-0000-0000-000000000005', NOW() - interval '30 days', NOW() - interval '30 days', 'ARRIVED', 0, 'Perfect arrival for Umaid Bhawan pyro show'),
      ($2, 'e0000001-0000-0000-0000-000000000008', NOW() - interval '30 days', NOW() - interval '30 days', 'ARRIVED', 0, 'Marwari horse carriage on time for Baraat')
  `, [w1, w4]);
  console.log(`✓ Day-of Vendor Check-ins for Vendor Scorecard seeded`);

  console.log('🎉 Umesh Realtime Commercials Data successfully seeded in PostgreSQL!');
}

seedCommercialsRealtimeData()
  .then(() => {
    process.exit(0);
  })
  .catch((err) => {
    console.error('❌ Error seeding commercials data:', err);
    process.exit(1);
  });
