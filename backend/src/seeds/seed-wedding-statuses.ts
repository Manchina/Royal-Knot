import { pool } from '../db';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

export async function seedWeddingStatuses() {
  console.log('🌱 Seeding Wedding Status Master Data into royalknot database...');

  const weddingStatusOptions = [
    {
      cat: 'WEDDING_STATUS',
      key: 'LIVE_BIG_DAY',
      label: 'Live Big Day',
      desc: 'Day-of live execution with active minute-by-minute run sheet, vendor arrivals, and real-time incident resolution',
      sortOrder: 1,
    },
    {
      cat: 'WEDDING_STATUS',
      key: 'IN_PLANNING',
      label: 'In Planning',
      desc: 'Active palace design, vendor contracting RFQs, tasting sessions, and checklist milestone execution',
      sortOrder: 2,
    },
    {
      cat: 'WEDDING_STATUS',
      key: 'BOOKED',
      label: 'Booked',
      desc: 'Agreement digitally signed, deposit locked, kickoff scheduled with lead coordinator',
      sortOrder: 3,
    },
    {
      cat: 'WEDDING_STATUS',
      key: 'FINALISED',
      label: 'Finalised',
      desc: 'Wedding completed, day-of extras invoiced and verified',
      sortOrder: 4,
    },
    {
      cat: 'WEDDING_STATUS',
      key: 'FINALISED_SETTLED',
      label: 'Finalised & Settled',
      desc: 'Wedding audited and all vendor disbursements 100% settled and cleared',
      sortOrder: 5,
    },
    {
      cat: 'WEDDING_STATUS',
      key: 'ENQUIRY',
      label: 'Initial Discovery',
      desc: 'Consultation request and digital luxury proposal phase',
      sortOrder: 6,
    },
  ];

  for (const opt of weddingStatusOptions) {
    const res = await pool.query(
      `INSERT INTO master_options (category, option_key, label, description, sort_order, is_active)
       VALUES ($1, $2, $3, $4, $5, true)
       ON CONFLICT (category, option_key) DO UPDATE
       SET label = EXCLUDED.label,
           description = EXCLUDED.description,
           sort_order = EXCLUDED.sort_order,
           is_active = true,
           updated_at = NOW()
       RETURNING id, category, option_key, label, sort_order`,
      [opt.cat, opt.key, opt.label, opt.desc, opt.sortOrder]
    );
    console.log(`  ✓ Inserted/Updated: [${res.rows[0].category}] ${res.rows[0].option_key} -> "${res.rows[0].label}" (ID: ${res.rows[0].id})`);
  }

  // Verify by querying all WEDDING_STATUS master options from database
  const verifyRes = await pool.query(
    `SELECT id, category, option_key, label, sort_order, is_active, created_at 
     FROM master_options 
     WHERE category = 'WEDDING_STATUS' 
     ORDER BY sort_order ASC`
  );

  console.log('\n📊 Current WEDDING_STATUS Master Data in PostgreSQL:');
  console.table(verifyRes.rows);

  return verifyRes.rows;
}

// Auto-execute if run directly
seedWeddingStatuses()
  .then(() => {
    console.log('✅ Wedding status master data successfully seeded!');
    process.exit(0);
  })
  .catch((err) => {
    console.error('❌ Error seeding wedding statuses:', err);
    process.exit(1);
  });
