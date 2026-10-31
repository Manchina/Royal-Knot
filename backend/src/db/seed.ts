import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { pool } from '../db';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function initDatabaseSchema() {
  const schemaPath = path.join(__dirname, 'schema.sql');
  const schemaSql = fs.readFileSync(schemaPath, 'utf-8');
  await pool.query(schemaSql);
  console.log('✅ Database schema verified / created successfully.');
}

export async function seedDatabase() {
  console.log('🌱 Starting comprehensive database seeding...');

  // 1. Seed Master Options
  const masterOptions = [
    // Package Types
    { cat: 'PACKAGE_TYPE', key: 'FULL_SERVICE', label: 'Full-Service Royal Wedding', desc: 'End-to-end design, vendor contracting, guest management & day-of coordination' },
    { cat: 'PACKAGE_TYPE', key: 'DAY_OF', label: 'Partial / Day-of Execution', desc: 'Vendor check-in, live minute-by-minute run sheet & incident firefighting' },
    
    // Ceremony Types
    { cat: 'CEREMONY_TYPE', key: 'MEHENDI', label: 'Mehendi & Henna Soiree', desc: 'Afternoon folk music and mehendi artists' },
    { cat: 'CEREMONY_TYPE', key: 'SANGEET', label: 'Royal Sangeet Gala', desc: 'Choreography, DJ, lighting and stage performances' },
    { cat: 'CEREMONY_TYPE', key: 'HALDI', label: 'Haldi & Phoolon Ki Holi', desc: 'Morning intimate ritual' },
    { cat: 'CEREMONY_TYPE', key: 'VARMALA_PHERAS', label: 'Varmala & Vedic Pheras', desc: 'Grand royal mandap ceremony' },
    { cat: 'CEREMONY_TYPE', key: 'RECEPTION', label: 'Grand Banquet Reception', desc: 'Formal seated royal dinner and speeches' },

    // Vendor Categories
    { cat: 'VENDOR_CATEGORY', key: 'CATERER', label: 'Royal Banquet Caterer', desc: 'Multi-cuisine authentic regional Rajasthani & Continental catering' },
    { cat: 'VENDOR_CATEGORY', key: 'DECORATOR', label: 'Palace Floral & Decor', desc: 'Mandap structures, mood lighting, palace draping' },
    { cat: 'VENDOR_CATEGORY', key: 'DJ', label: 'Sound & DJ Production', desc: 'Sound consoles, LED walls, audio systems' },
    { cat: 'VENDOR_CATEGORY', key: 'DRUMMERS', label: 'Dhol & Tasha Folk Troupe', desc: 'Traditional royal welcome drummers for Baraat' },
    { cat: 'VENDOR_CATEGORY', key: 'MAKEUP', label: 'Bridal HMUA', desc: 'High-definition bridal hair and makeup artists' },
    { cat: 'VENDOR_CATEGORY', key: 'PHOTOGRAPHY', label: 'Cinematography & Stills', desc: 'Drone coverage, candid wedding cinema, same-day teaser' },

    // Payment Stages
    { cat: 'PAYMENT_STAGE', key: 'BOOKING_DEPOSIT', label: 'Booking Deposit (20%)', desc: 'Initial contract signing lock' },
    { cat: 'PAYMENT_STAGE', key: 'PRE_WEDDING_ADVANCE', label: '30-Day Advance (50%)', desc: 'Pre-wedding vendor disbursement lock' },
    { cat: 'PAYMENT_STAGE', key: 'FINAL_SETTLEMENT', label: 'Post-Event Settlement (30% + Extras)', desc: 'Final reconciliation + banquet extra plates' },

    // Task Phases
    { cat: 'TASK_PHASE', key: 'VENUE', label: 'Venue & Permits', desc: 'Palace booking, drone permissions, sound clearance' },
    { cat: 'TASK_PHASE', key: 'DESIGN', label: 'Design & Theming', desc: 'Mood boards, color palettes, 3D floor plans' },
    { cat: 'TASK_PHASE', key: 'VENDORS', label: 'Vendor Contracting', desc: 'RFQs, tasting sessions, contract signoff' },
    { cat: 'TASK_PHASE', key: 'CEREMONIES', label: 'Ceremonies Execution', desc: 'Rehearsals, priest coordination, run sheet' },
  ];

  for (const opt of masterOptions) {
    await pool.query(
      `INSERT INTO master_options (category, option_key, label, description)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (category, option_key) DO UPDATE
       SET label = EXCLUDED.label, description = EXCLUDED.description`,
      [opt.cat, opt.key, opt.label, opt.desc]
    );
  }
  console.log(`✨ Seeded ${masterOptions.length} Master Options`);

  // 2. Seed Users
  const users = [
    {
      id: 'a0000001-0000-0000-0000-000000000001',
      full_name: 'Vikramaditya Rathore',
      email: 'founder@royalknot.com',
      password: 'password123',
      phone: '+91 98290 00001',
      role: 'FOUNDER',
      title: 'Founder & CEO',
    },
    {
      id: 'a0000001-0000-0000-0000-000000000002',
      full_name: 'Aditya Singhal',
      email: 'admin@royalknot.com',
      password: 'password123',
      phone: '+91 98290 00002',
      role: 'SUPER_ADMIN',
      title: 'Super Administrator',
    },
    {
      id: 'a0000001-0000-0000-0000-000000000003',
      full_name: 'Devika Sharma',
      email: 'planner@royalknot.com',
      password: 'password123',
      phone: '+91 98290 00003',
      role: 'LEAD_PLANNER',
      title: 'Lead Wedding Planner',
    },
    {
      id: 'a0000001-0000-0000-0000-000000000004',
      full_name: 'Karan Verma',
      email: 'coordinator@royalknot.com',
      password: 'password123',
      phone: '+91 98290 00004',
      role: 'COORDINATOR',
      title: 'Day-of Field Coordinator',
    },
    {
      id: 'a0000001-0000-0000-0000-000000000005',
      full_name: 'Anil Agarwal',
      email: 'finance@royalknot.com',
      password: 'password123',
      phone: '+91 98290 00005',
      role: 'FINANCE_MANAGER',
      title: 'Finance & Billing Head',
    },
    {
      id: 'a0000001-0000-0000-0000-000000000006',
      full_name: 'Aanya Singhania & Raghav Mehra',
      email: 'client@royalknot.com',
      password: 'password123',
      phone: '+91 98290 00006',
      role: 'CLIENT',
      title: 'Bride & Groom Portal',
    },
  ];

  for (const u of users) {
    await pool.query(
      `INSERT INTO users (id, full_name, email, password, phone, role, title)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       ON CONFLICT (email) DO UPDATE
       SET full_name = EXCLUDED.full_name, role = EXCLUDED.role, title = EXCLUDED.title, password = EXCLUDED.password`,
      [u.id, u.full_name, u.email, u.password, u.phone, u.role, u.title]
    );
  }
  console.log(`✨ Seeded ${users.length} Users`);

  // 3. Seed Clients
  const client1Id = 'b0000001-0000-0000-0000-000000000001';
  const client2Id = 'b0000001-0000-0000-0000-000000000002';
  const client3Id = 'b0000001-0000-0000-0000-000000000003';

  await pool.query(
    `INSERT INTO clients (id, bride_name, groom_name, primary_contact_name, email, phone, city_of_residence, notes)
     VALUES 
      ($1, 'Aanya Singhania', 'Raghav Mehra', 'Raghav Mehra', 'client@royalknot.com', '+91 98290 11223', 'Mumbai', 'VIP Royal Udaipur 3-Day Wedding'),
      ($2, 'Kriti Maheshwari', 'Siddharth Jain', 'Siddharth Jain', 'siddharth@client.in', '+91 98110 44556', 'New Delhi', 'Jaipur Heritage Fort Wedding'),
      ($3, 'Simran Bajaj', 'Armaan Gill', 'Armaan Gill', 'armaan@client.in', '+91 99887 66554', 'Bangalore', 'Palace Chic with 500 Guests')
     ON CONFLICT (id) DO NOTHING`,
    [client1Id, client2Id, client3Id]
  );
  console.log(`✨ Seeded 3 Clients`);

  // 4. Seed Weddings
  const wedding1Id = 'c0000001-0000-0000-0000-000000000001';
  const wedding2Id = 'c0000001-0000-0000-0000-000000000002';
  const wedding3Id = 'c0000001-0000-0000-0000-000000000003';

  await pool.query(
    `INSERT INTO weddings (id, code, client_id, lead_planner_id, package_type, theme, destination_city, primary_venue, start_date, end_date, season_year, estimated_guest_count, actual_banquet_headcount, total_budget, agency_fee, status, notes)
     VALUES 
      ($1, 'RW-2026-001', $4, 'a0000001-0000-0000-0000-000000000003', 'FULL_SERVICE', 'Royal Lakefront Heritage', 'Udaipur', 'The Oberoi Udaivilas', '2026-12-10', '2026-12-13', 2026, 400, 460, 35000000.00, 3500000.00, 'LIVE_BIG_DAY', '400 confirmed guests, multi-stage crore budget'),
      ($2, 'RW-2026-002', $5, 'a0000001-0000-0000-0000-000000000003', 'FULL_SERVICE', 'Regal Palace Romance', 'Jaipur', 'Rambagh Palace', '2026-11-20', '2026-11-23', 2026, 420, 420, 27500000.00, 2800000.00, 'IN_PLANNING', '3 caterers quote comparison active'),
      ($3, 'RW-2026-003', $6, 'a0000001-0000-0000-0000-000000000003', 'DAY_OF', 'Regal Fortress Chic', 'Jaipur', 'Alila Fort Bishangarh', '2027-01-14', '2027-01-17', 2027, 500, NULL, 30000000.00, 1800000.00, 'BOOKED', 'Contract signed, deposit received')
     ON CONFLICT (id) DO NOTHING`,
    [wedding1Id, wedding2Id, wedding3Id, client1Id, client2Id, client3Id]
  );
  console.log(`✨ Seeded 3 Weddings`);

  // 5. Seed Inbound Enquiries (Scene 1)
  await pool.query(
    `INSERT INTO enquiries (code, couple_name, primary_contact_name, phone, email, channel, city_preference, dates_rough, guest_count, theme, budget_max, package_preference, agreement_status, status)
     VALUES
      ('ENQ-2026-101', 'Aanya Singhania & Raghav Mehra', 'Raghav Mehra', '+91 98290 11223', 'client@royalknot.com', 'Website Consultation', 'Udaipur', 'Dec 2026', 400, 'Royal Lakefront Heritage', 35000000.00, 'FULL_SERVICE', 'Signed on Mobile', 'Converted to Wedding'),
      ('ENQ-2026-102', 'Kriti Maheshwari & Siddharth Jain', 'Siddharth Jain', '+91 98110 44556', 'siddharth@client.in', 'WhatsApp', 'Jaipur', 'Nov 2026', 420, 'Regal Palace Romance', 27500000.00, 'FULL_SERVICE', 'Signed on Mobile', 'Consultation Booked'),
      ('ENQ-2026-103', 'Simran Bajaj & Armaan Gill', 'Armaan Gill', '+91 99887 66554', 'armaan@client.in', 'Instagram DM', 'Jaipur', 'Jan 2027', 500, 'Regal Fortress Chic', 30000000.00, 'DAY_OF', 'Sent - Pending Signature', 'Agreement Awaited'),
      ('ENQ-2026-104', 'Niharika Verma & Kabir Saxena', 'Kabir Saxena', '+91 99112 33445', 'kabir@saxena.in', 'Phone Call', 'Udaipur', 'Feb 2027', 380, 'Lakeside Candlelight', 20000000.00, 'FULL_SERVICE', 'Drafting Agreement', 'Initial Discovery')
     ON CONFLICT (code) DO NOTHING`
  );
  console.log(`✨ Seeded Inbound Enquiries`);

  // 6. Seed Wedding Events (Sub-Ceremonies for Wedding 1)
  const event1Id = 'd0000001-0000-0000-0000-000000000001';
  const event2Id = 'd0000001-0000-0000-0000-000000000002';
  const event3Id = 'd0000001-0000-0000-0000-000000000003';
  const event4Id = 'd0000001-0000-0000-0000-000000000004';

  await pool.query(
    `INSERT INTO wedding_events (id, wedding_id, ceremony_type, event_name, venue_hall, event_date, start_time, end_time, lead_coordinator_id, sort_order)
     VALUES
      ($1, $5, 'HALDI', 'Intimate Phoolon Ki Haldi', 'Zenana Courtyard Lawn', '2026-12-10', '10:00:00', '13:00:00', 'a0000001-0000-0000-0000-000000000004', 1),
      ($2, $5, 'SANGEET', 'Royal Sangeet & Folk Fusion Night', 'Promenade Lakeside Ballroom', '2026-12-11', '19:00:00', '23:30:00', 'a0000001-0000-0000-0000-000000000004', 2),
      ($3, $5, 'VARMALA_PHERAS', 'Sunset Varmala & Vedic Pheras', 'Mewar Royal Mandap Pavillion', '2026-12-12', '17:30:00', '20:30:00', 'a0000001-0000-0000-0000-000000000004', 3),
      ($4, $5, 'RECEPTION', 'Grand Banquet Dinner & Celebration', 'Main Palace Ballroom', '2026-12-12', '20:30:00', '01:00:00', 'a0000001-0000-0000-0000-000000000004', 4)
     ON CONFLICT (id) DO NOTHING`,
    [event1Id, event2Id, event3Id, event4Id, wedding1Id]
  );
  console.log(`✨ Seeded 4 Wedding Events`);

  // 7. Seed Vendors
  const vendorCaterer1 = 'e0000001-0000-0000-0000-000000000001';
  const vendorCaterer2 = 'e0000001-0000-0000-0000-000000000002';
  const vendorCaterer3 = 'e0000001-0000-0000-0000-000000000003';
  const vendorDecor = 'e0000001-0000-0000-0000-000000000004';
  const vendorDJ = 'e0000001-0000-0000-0000-000000000005';
  const vendorDhol = 'e0000001-0000-0000-0000-000000000006';
  const vendorPhoto = 'e0000001-0000-0000-0000-000000000007';

  await pool.query(
    `INSERT INTO vendors (id, business_name, category, contact_person, phone, email, city, rating_score)
     VALUES
      ($1, 'Royal Rasoi Caterers', 'CATERER', 'Chef Mahendra Singh', '+91 98290 88771', 'quotes@royalrasoi.com', 'Jaipur', 4.90),
      ($2, 'Marwar Heritage Kitchens', 'CATERER', 'Vikram Choudhary', '+91 98290 88772', 'contact@marwarkitchens.com', 'Udaipur', 4.85),
      ($3, 'Rajputana Feasts & Banquets', 'CATERER', 'Harshvardhan Rathore', '+91 98290 88773', 'info@rajputanafeasts.com', 'Jodhpur', 4.70),
      ($4, 'Mewar Royal Florals & Decor', 'DECORATOR', 'Sunil Gehlot', '+91 98290 88774', 'events@mewarflorals.com', 'Udaipur', 4.95),
      ($5, 'Jodhpur Beats & Sound Production', 'DJ', 'DJ Rohit Sen', '+91 98290 88775', 'beats@jodhpurdj.com', 'Jodhpur', 4.80),
      ($6, 'Jaipur Dhol Tasha Troupe', 'DRUMMERS', 'Master Ratan Lal', '+91 98290 88776', 'dhol@jaipurtroupe.in', 'Jaipur', 4.90),
      ($7, 'Udaipur Royal Cinematography', 'PHOTOGRAPHY', 'Aman Khurana', '+91 98290 88777', 'hello@udaipurcinema.in', 'Udaipur', 5.00)
     ON CONFLICT (id) DO NOTHING`,
    [vendorCaterer1, vendorCaterer2, vendorCaterer3, vendorDecor, vendorDJ, vendorDhol, vendorPhoto]
  );
  console.log(`✨ Seeded 7 Vendors`);

  // 8. Seed RFQ Requests & Vendor Quotes (Scene 2: 3 Caterers Side-by-Side)
  const rfq1Id = 'f0000001-0000-0000-0000-000000000001';

  await pool.query(
    `INSERT INTO rfq_requests (id, wedding_id, service_category, event_id, description, required_guest_count, status)
     VALUES
      ($1, $2, 'CATERER', $3, 'Regional Rajasthani Royal Banquet Dinner with Live Counters, Dal Baati Churma, Gatte, Ker Sangri, and Continental Dessert Island for 400 guests.', 400, 'AWARDED')
     ON CONFLICT (id) DO NOTHING`,
    [rfq1Id, wedding1Id, event4Id]
  );

  await pool.query(
    `INSERT INTO vendor_quotes (rfq_id, vendor_id, quote_reference, base_cost, price_per_plate, overtime_hourly_rate, line_items, inclusions, exclusions, status, decision_reason)
     VALUES
      ($1, $2, 'RR-2026-CAT-09', 740000.00, 1850.00, 15000.00, 
       '[{"item":"Welcome Mocktails (4 types)","cost":40000},{"item":"Live Rajasthani Chaat Counters","cost":120000},{"item":"Royal Thali Main Course","cost":480000},{"item":"Artisanal Kulfi & Mithai Station","cost":100000}]'::jsonb,
       'Cutlery, bone china, buffet warmer units, 30 uniform banquet stewards included',
       'Alcohol license, ice bar carving',
       'PENDING', 'Under evaluation by client'),
      
      ($1, $3, 'MK-2026-ROYAL-88', 840000.00, 2100.00, 12000.00, 
       '[{"item":"Royal Saffron Kahwa Welcome","cost":60000},{"item":"Signature Jodhpur & Mewar Thali (Gold rim chinaware)","cost":580000},{"item":"Live Continental Woodfire Pizza & Pasta","cost":110000},{"item":"Shahi Halwa & Nitrogen Rabdi Bar","cost":90000}]'::jsonb,
       'All imported chinaware, silver cutlery, chef-supervised live counters, 45 trained stewards',
       'Liquor permits',
       'ACCEPTED', 'Selected as winner: Superior heritage menu & lower overtime rate'),
      
      ($1, $4, 'RF-2026-EXP-12', 780000.00, 1950.00, 20000.00, 
       '[{"item":"Heritage Appetizers on Wheels","cost":90000},{"item":"Traditional Rajputana Banquet","cost":520000},{"item":"Dessert Pavilion","cost":170000}]'::jsonb,
       'Standard buffet warmers, 25 servers',
       'Live tandoor setups, overtime staff charges',
       'AUTO_REJECTED', 'Auto-closed after client awarded Marwar Heritage Kitchens')
     ON CONFLICT DO NOTHING`,
    [rfq1Id, vendorCaterer1, vendorCaterer2, vendorCaterer3]
  );
  console.log(`✨ Seeded Scene 2 RFQ & 3 Caterer Quotes Matrix`);

  // 9. Seed 25+ Wedding Tasks (Scene 3: The Instant Wedding Plan)
  const tasks = [
    { title: 'Confirm Oberoi Udaivilas palace event lawn booking & sign contract', cat: 'VENUE', stage: 'DONE', days: 90 },
    { title: 'Procure Udaipur local administration drone and fireworks sound permit', cat: 'VENUE', stage: 'DONE', days: 60 },
    { title: 'Float catering RFQ to 3 shortlisted regional luxury caterers', cat: 'VENDORS', stage: 'DONE', days: 50 },
    { title: 'Schedule wedding menu tasting session with couple at Marwar Kitchens', cat: 'VENDORS', stage: 'DONE', days: 45 },
    { title: 'Client final selection & award catering contract in Decision Room', cat: 'VENDORS', stage: 'DONE', days: 40 },
    { title: 'Finalize Mewar floral decor blueprint for lakeside mandap and aisle', cat: 'DESIGN', stage: 'DONE', days: 35 },
    { title: 'Audit 3D sound & acoustic blueprint with Jodhpur Beats & Sound', cat: 'DESIGN', stage: 'IN_PROGRESS', days: 25 },
    { title: 'Confirm 12-member Jaipur Dhol Tasha troupe arrival schedule for Baraat', cat: 'VENDORS', stage: 'IN_PROGRESS', days: 20 },
    { title: 'Book bridal makeup artist and schedule hair trial session', cat: 'VENDORS', stage: 'IN_PROGRESS', days: 18 },
    { title: 'Review 400 guest room allotment matrix with Udaivilas front desk', cat: 'VENUE', stage: 'IN_PROGRESS', days: 14 },
    { title: 'Generate & send 30-Day Advance Client Invoice (50% stage payment)', cat: 'FINANCE', stage: 'DONE', days: 30 },
    { title: 'Disburse advance payments to awarded caterer and decorator', cat: 'FINANCE', stage: 'DONE', days: 28 },
    { title: 'Publish digital ceremony itinerary to couple portal', cat: 'CEREMONIES', stage: 'IN_PROGRESS', days: 10 },
    { title: 'Conduct priest (Pandit Ji) ritual timing alignment meeting', cat: 'CEREMONIES', stage: 'TO_PLAN', days: 7 },
    { title: 'Deploy on-ground backup diesel generator for main lawn illumination', cat: 'VENUE', stage: 'TO_PLAN', days: 5 },
    { title: 'Inspect vintage groom entry carriage (Baggi) & flower adornments', cat: 'CEREMONIES', stage: 'TO_PLAN', days: 4 },
    { title: 'Distribute minute-by-minute run sheet to all 18 vendor leads', cat: 'CEREMONIES', stage: 'TO_PLAN', days: 3 },
    { title: 'Pre-event safety & fire extinguisher placement inspection', cat: 'VENUE', stage: 'TO_PLAN', days: 2 },
    { title: 'Rehearsal: Sangeet sound levels check and sound limiter testing', cat: 'CEREMONIES', stage: 'TO_PLAN', days: 2 },
    { title: 'Day-Of: Live check-in desk setup at hotel service gate', cat: 'CEREMONIES', stage: 'TO_PLAN', days: 1 },
    { title: 'Day-Of: Headcount counter audit at banquet entry', cat: 'VENUE', stage: 'TO_PLAN', days: 0 },
    { title: 'Post-Event: Reconcile extra banquet plates with banquet manager', cat: 'FINANCE', stage: 'TO_PLAN', days: -1 },
    { title: 'Post-Event: Match vendor bills against original RFQ purchase orders', cat: 'FINANCE', stage: 'TO_PLAN', days: -2 },
    { title: 'Post-Event: Issue final settlement invoice to client', cat: 'FINANCE', stage: 'TO_PLAN', days: -3 },
    { title: 'Archive wedding photo proofs & trigger founder margin audit', cat: 'FINANCE', stage: 'TO_PLAN', days: -5 },
  ];

  for (const t of tasks) {
    await pool.query(
      `INSERT INTO wedding_tasks (wedding_id, title, category, stage, due_date, assigned_to)
       VALUES ($1, $2, $3, $4, NOW() + ($5 || ' days')::interval, 'a0000001-0000-0000-0000-000000000003')`,
      [wedding1Id, t.title, t.cat, t.stage, t.days]
    );
  }
  console.log(`✨ Seeded ${tasks.length} Wedding Tasks (Scene 3)`);

  // 10. Seed Day-of Operations (Scene 4: Live Run Sheet, Check-ins & Incidents)
  const runSheetSlots = [
    { time: '09:00:00', title: 'Florist team arrives; begins Mandap fresh flower draping', loc: 'Mandap Pavillion' },
    { time: '11:00:00', title: 'Haldi ceremony starts; live folk musicians seated', loc: 'Zenana Lawn' },
    { time: '15:00:00', title: 'Jaipur Dhol Tasha troupe check-in at main gate', loc: 'Palace North Gate' },
    { time: '16:00:00', title: 'Sound engineer tests DJ audio console & monitors', loc: 'Promenade Ballroom' },
    { time: '16:45:00', title: 'Groom Baraat assembly with royal vintage car & drummers', loc: 'Main Palace Driveway' },
    { time: '17:30:00', title: 'Bride grand entry under Phoolon Ki Chaadar & Varmala', loc: 'Lakefront Deck' },
    { time: '19:00:00', title: 'Vedic Pheras ceremony with Royal Pandit Ji', loc: 'Mewar Mandap' },
    { time: '20:30:00', title: 'Royal Banquet opens; 400+ guests seated for dinner', loc: 'Main Palace Ballroom' },
    { time: '22:00:00', title: 'DJ music starts; cake cutting & celebration', loc: 'Promenade Ballroom' },
  ];

  for (let i = 0; i < runSheetSlots.length; i++) {
    const s = runSheetSlots[i];
    await pool.query(
      `INSERT INTO day_of_run_sheet (wedding_id, event_id, time_slot, activity_title, location, responsible_user_id, sort_order)
       VALUES ($1, $2, $3, $4, $5, 'a0000001-0000-0000-0000-000000000004', $6)`,
      [wedding1Id, event3Id, s.time, s.title, s.loc, i + 1]
    );
  }

  // Day-of Vendor Check-ins
  await pool.query(
    `INSERT INTO day_of_vendor_checkins (wedding_id, event_id, vendor_id, scheduled_arrival_time, actual_arrival_time, status, delay_minutes, remarks)
     VALUES
      ($1, $2, $3, NOW() - interval '4 hours', NOW() - interval '4 hours', 'ARRIVED', 0, 'Mandap structure team on schedule'),
      ($1, $2, $4, NOW() - interval '2 hours', NOW() - interval '100 minutes', 'ARRIVED', 20, 'Delayed by 20 min due to highway traffic at Udaipur toll'),
      ($1, $2, $5, NOW() - interval '1 hour', NULL, 'RUNNING_LATE', 25, 'DJ sound technician en route; coordinator notified')`,
    [wedding1Id, event3Id, vendorDecor, vendorCaterer2, vendorDJ]
  );

  // Day-of Incidents
  await pool.query(
    `INSERT INTO day_of_incidents (wedding_id, event_id, title, severity, status, assigned_to, resolution_notes)
     VALUES
      ($1, $2, 'Florist requires auxiliary 20kVA generator for outdoor floodlights', 'HIGH', 'RESOLVED', 'a0000001-0000-0000-0000-000000000004', 'Backup hotel generator patched by hotel maintenance in 15 mins.'),
      ($1, $2, 'Bride vintage entry car stuck in Old City traffic checkpoint', 'MEDIUM', 'INVESTIGATING', 'a0000001-0000-0000-0000-000000000004', 'Field coordinator routed driver via Ring Road bypass; ETA +10 mins.')`,
    [wedding1Id, event3Id]
  );
  console.log(`✨ Seeded Scene 4 Day-Of Run Sheet, Check-ins & Incidents`);

  // 11. Seed Billing & Extra Costs (Scene 5: 60 Extra Guests & Vendor Matching)
  const inv1Id = '10000001-0000-0000-0000-000000000001';
  const inv2Id = '10000001-0000-0000-0000-000000000002';
  const inv3Id = '10000001-0000-0000-0000-000000000003';

  await pool.query(
    `INSERT INTO client_invoices (id, wedding_id, invoice_number, stage_key, amount_due, due_date, status, paid_amount, paid_at, payment_reference)
     VALUES
      ($1, $4, 'INV-2026-001-A', 'BOOKING_DEPOSIT', 7000000.00, '2026-08-15', 'PAID', 7000000.00, '2026-08-14 15:30:00', 'HDFC-NEFT-998811'),
      ($2, $4, 'INV-2026-001-B', 'PRE_WEDDING_ADVANCE', 17500000.00, '2026-11-10', 'PAID', 17500000.00, '2026-11-09 11:20:00', 'ICICI-RTGS-776655'),
      ($3, $4, 'INV-2026-001-C', 'FINAL_SETTLEMENT', 10656000.00, '2026-12-20', 'UNPAID', 0.00, NULL, NULL)
     ON CONFLICT (id) DO NOTHING`,
    [inv1Id, inv2Id, inv3Id, wedding1Id]
  );

  // Extra Charges (60 unexpected guests & 2 hrs DJ overtime)
  await pool.query(
    `INSERT INTO wedding_extra_charges (wedding_id, category, description, quantity, unit_rate, total_amount, vendor_id, is_billed_to_client, client_invoice_id)
     VALUES
      ($1, 'EXTRA_PLATES', '60 unexpected guests arrived at banquet (Contracted: 400, Actual: 460)', 60.00, 2100.00, 126000.00, $2, TRUE, $3),
      ($1, 'DJ_OVERTIME', '2 hours DJ sound console overtime past midnight clearance', 2.00, 15000.00, 30000.00, $4, TRUE, $3)`,
    [wedding1Id, vendorCaterer2, inv3Id, vendorDJ]
  );

  // Vendor Bills (Reconciled against agreed quotes)
  await pool.query(
    `INSERT INTO vendor_bills (wedding_id, vendor_id, agreed_base_amount, extra_charges_amount, total_payable, advance_paid, balance_due, status)
     VALUES
      ($1, $2, 840000.00, 126000.00, 966000.00, 500000.00, 466000.00, 'RECONCILED'),
      ($1, $3, 1200000.00, 0.00, 1200000.00, 800000.00, 400000.00, 'ADVANCE_PAID'),
      ($1, $4, 250000.00, 30000.00, 280000.00, 150000.00, 130000.00, 'FINAL_BILL_SUBMITTED')`,
    [wedding1Id, vendorCaterer2, vendorDecor, vendorDJ]
  );
  console.log(`✨ Seeded Scene 5 Client Invoices, Extra Charges & Vendor Bills`);

  console.log('🎉 Comprehensive database seeding finished successfully!');
}

export async function runAutoSeedIfEmpty() {
  try {
    await initDatabaseSchema();
    const result = await pool.query('SELECT COUNT(*) as count FROM users');
    const userCount = parseInt(result.rows[0]?.count || '0', 10);

    if (userCount === 0) {
      console.log('ℹ️ Empty database detected on startup. Auto-seeding mock data...');
      await seedDatabase();
    } else {
      console.log(`ℹ️ Database already populated with ${userCount} users. Ready!`);
    }
  } catch (err: any) {
    console.error('❌ Error during database auto-seed check:', err.message);
  }
}

// Allow running directly via tsx src/db/seed.ts
if (process.argv[1] && process.argv[1].endsWith('seed.ts')) {
  (async () => {
    try {
      await initDatabaseSchema();
      await seedDatabase();
      console.log('Done!');
      process.exit(0);
    } catch (e) {
      console.error(e);
      process.exit(1);
    }
  })();
}
