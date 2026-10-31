import {
  pgTable,
  uuid,
  varchar,
  text,
  integer,
  numeric,
  timestamp,
  boolean,
  jsonb,
  date,
  time,
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

// Master Options
export const masterOptions = pgTable('master_options', {
  id: uuid('id').defaultRandom().primaryKey(),
  category: varchar('category', { length: 60 }).notNull(),
  optionKey: varchar('option_key', { length: 60 }).notNull(),
  label: varchar('label', { length: 120 }).notNull(),
  description: text('description'),
  metadata: jsonb('metadata').default(sql`'{}'::jsonb`),
  sortOrder: integer('sort_order').default(0),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

// Users
export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  fullName: varchar('full_name', { length: 120 }).notNull(),
  email: varchar('email', { length: 120 }).unique().notNull(),
  password: varchar('password', { length: 255 }).default('password123').notNull(),
  phone: varchar('phone', { length: 20 }).notNull(),
  role: varchar('role', { length: 40 }).notNull(),
  title: varchar('title', { length: 120 }),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

// Clients
export const clients = pgTable('clients', {
  id: uuid('id').defaultRandom().primaryKey(),
  brideName: varchar('bride_name', { length: 100 }).notNull(),
  groomName: varchar('groom_name', { length: 100 }).notNull(),
  primaryContactName: varchar('primary_contact_name', { length: 120 }).notNull(),
  email: varchar('email', { length: 120 }).notNull(),
  phone: varchar('phone', { length: 20 }).notNull(),
  cityOfResidence: varchar('city_of_residence', { length: 100 }),
  notes: text('notes'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

// Weddings
export const weddings = pgTable('weddings', {
  id: uuid('id').defaultRandom().primaryKey(),
  code: varchar('code', { length: 20 }).unique().notNull(),
  clientId: uuid('client_id').references(() => clients.id).notNull(),
  leadPlannerId: uuid('lead_planner_id').references(() => users.id),
  packageType: varchar('package_type', { length: 60 }).notNull(),
  theme: varchar('theme', { length: 100 }),
  destinationCity: varchar('destination_city', { length: 60 }).notNull(),
  primaryVenue: varchar('primary_venue', { length: 200 }),
  startDate: date('start_date').notNull(),
  endDate: date('end_date').notNull(),
  seasonYear: integer('season_year').default(2026).notNull(),
  estimatedGuestCount: integer('estimated_guest_count').default(400).notNull(),
  actualBanquetHeadcount: integer('actual_banquet_headcount'),
  totalBudget: numeric('total_budget', { precision: 14, scale: 2 }).notNull(),
  agencyFee: numeric('agency_fee', { precision: 14, scale: 2 }).notNull(),
  status: varchar('status', { length: 40 }).default('ENQUIRY').notNull(),
  notes: text('notes'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

// Enquiries (Scene 1: Lead Capture & Digital Agreement)
export const enquiries = pgTable('enquiries', {
  id: uuid('id').defaultRandom().primaryKey(),
  code: varchar('code', { length: 30 }).unique().notNull(),
  coupleName: varchar('couple_name', { length: 150 }).notNull(),
  primaryContactName: varchar('primary_contact_name', { length: 120 }),
  phone: varchar('phone', { length: 20 }).notNull(),
  email: varchar('email', { length: 120 }),
  channel: varchar('channel', { length: 40 }).default('Website Consultation').notNull(),
  cityPreference: varchar('city_preference', { length: 60 }).notNull(),
  datesRough: varchar('dates_rough', { length: 100 }).notNull(),
  guestCount: integer('guest_count').default(400).notNull(),
  theme: varchar('theme', { length: 100 }),
  budgetMax: numeric('budget_max', { precision: 14, scale: 2 }),
  packagePreference: varchar('package_preference', { length: 60 }).default('FULL_SERVICE'),
  agreementStatus: varchar('agreement_status', { length: 40 }).default('Drafting Agreement'),
  agreementSignedAt: timestamp('agreement_signed_at', { withTimezone: true }),
  status: varchar('status', { length: 40 }).default('Initial Discovery'),
  weddingId: uuid('wedding_id').references(() => weddings.id),
  notes: text('notes'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

// Enquiry Change Logs (Audit Trail & Activity History)
export const enquiryChangeLogs = pgTable('enquiry_change_logs', {
  id: uuid('id').defaultRandom().primaryKey(),
  enquiryId: uuid('enquiry_id').references(() => enquiries.id, { onDelete: 'cascade' }).notNull(),
  action: varchar('action', { length: 60 }).notNull(),
  fromStatus: varchar('from_status', { length: 40 }),
  toStatus: varchar('to_status', { length: 40 }),
  performedBy: varchar('performed_by', { length: 120 }).default('System'),
  notes: text('notes'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

// Wedding Events (Sub-Ceremonies)
export const weddingEvents = pgTable('wedding_events', {
  id: uuid('id').defaultRandom().primaryKey(),
  weddingId: uuid('wedding_id').references(() => weddings.id).notNull(),
  ceremonyType: varchar('ceremony_type', { length: 60 }).notNull(),
  eventName: varchar('event_name', { length: 120 }).notNull(),
  venueHall: varchar('venue_hall', { length: 150 }),
  eventDate: date('event_date').notNull(),
  startTime: time('start_time').notNull(),
  endTime: time('end_time').notNull(),
  leadCoordinatorId: uuid('lead_coordinator_id').references(() => users.id),
  sortOrder: integer('sort_order').default(0),
});

// Vendors
export const vendors = pgTable('vendors', {
  id: uuid('id').defaultRandom().primaryKey(),
  businessName: varchar('business_name', { length: 150 }).notNull(),
  category: varchar('category', { length: 60 }).notNull(),
  contactPerson: varchar('contact_person', { length: 100 }),
  phone: varchar('phone', { length: 20 }).notNull(),
  email: varchar('email', { length: 120 }),
  city: varchar('city', { length: 60 }),
  ratingScore: numeric('rating_score', { precision: 3, scale: 2 }).default('5.00'),
  bankAccountInfo: jsonb('bank_account_info'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

// RFQ Requests
export const rfqRequests = pgTable('rfq_requests', {
  id: uuid('id').defaultRandom().primaryKey(),
  weddingId: uuid('wedding_id').references(() => weddings.id).notNull(),
  serviceCategory: varchar('service_category', { length: 60 }).notNull(),
  eventId: uuid('event_id').references(() => weddingEvents.id),
  description: text('description').notNull(),
  requiredGuestCount: integer('required_guest_count').default(400),
  status: varchar('status', { length: 30 }).default('OPEN'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

// Vendor Quotes (Scene 2: 3 Caterers Decision)
export const vendorQuotes = pgTable('vendor_quotes', {
  id: uuid('id').defaultRandom().primaryKey(),
  rfqId: uuid('rfq_id').references(() => rfqRequests.id).notNull(),
  vendorId: uuid('vendor_id').references(() => vendors.id).notNull(),
  quoteReference: varchar('quote_reference', { length: 50 }),
  baseCost: numeric('base_cost', { precision: 12, scale: 2 }).notNull(),
  pricePerPlate: numeric('price_per_plate', { precision: 8, scale: 2 }),
  overtimeHourlyRate: numeric('overtime_hourly_rate', { precision: 8, scale: 2 }),
  lineItems: jsonb('line_items').default(sql`'[]'::jsonb`).notNull(),
  inclusions: text('inclusions'),
  exclusions: text('exclusions'),
  status: varchar('status', { length: 30 }).default('PENDING'),
  decisionReason: text('decision_reason'),
  decidedAt: timestamp('decided_at', { withTimezone: true }),
});

// Wedding Tasks (Scene 3: The Instant Wedding Plan & Operational Checklist)
export const weddingTasks = pgTable('wedding_tasks', {
  id: uuid('id').defaultRandom().primaryKey(),
  weddingId: uuid('wedding_id').references(() => weddings.id).notNull(),
  title: varchar('title', { length: 200 }).notNull(),
  category: varchar('category', { length: 60 }).notNull(),
  assignedTo: uuid('assigned_to').references(() => users.id),
  dueDate: date('due_date'),
  stage: varchar('stage', { length: 30 }).default('TO_PLAN').notNull(),
  isMilestone: boolean('is_milestone').default(false),
  completedAt: timestamp('completed_at', { withTimezone: true }),
  notes: text('notes'),
});


// Day-of Run Sheet (Minute-by-Minute Run Sheet)
export const dayOfRunSheet = pgTable('day_of_run_sheet', {
  id: uuid('id').defaultRandom().primaryKey(),
  weddingId: uuid('wedding_id').references(() => weddings.id).notNull(),
  eventId: uuid('event_id').references(() => weddingEvents.id),
  timeSlot: time('time_slot').notNull(),
  activityTitle: varchar('activity_title', { length: 150 }).notNull(),
  location: varchar('location', { length: 120 }),
  responsibleUserId: uuid('responsible_user_id').references(() => users.id),
  notes: text('notes'),
  sortOrder: integer('sort_order').default(0),
});

// Day-of Vendor Check-ins (Vendor Arrival Telemetry)
export const dayOfVendorCheckins = pgTable('day_of_vendor_checkins', {
  id: uuid('id').defaultRandom().primaryKey(),
  weddingId: uuid('wedding_id').references(() => weddings.id).notNull(),
  eventId: uuid('event_id').references(() => weddingEvents.id),
  vendorId: uuid('vendor_id').references(() => vendors.id).notNull(),
  scheduledArrivalTime: timestamp('scheduled_arrival_time', { withTimezone: true }).notNull(),
  actualArrivalTime: timestamp('actual_arrival_time', { withTimezone: true }),
  status: varchar('status', { length: 30 }).default('SCHEDULED'),
  delayMinutes: integer('delay_minutes').default(0),
  staffVerifierId: uuid('staff_verifier_id').references(() => users.id),
  remarks: text('remarks'),
});

// Day-of Incidents
export const dayOfIncidents = pgTable('day_of_incidents', {
  id: uuid('id').defaultRandom().primaryKey(),
  weddingId: uuid('wedding_id').references(() => weddings.id).notNull(),
  eventId: uuid('event_id').references(() => weddingEvents.id),
  title: varchar('title', { length: 200 }).notNull(),
  severity: varchar('severity', { length: 20 }).default('MEDIUM'),
  status: varchar('status', { length: 30 }).default('REPORTED'),
  assignedTo: uuid('assigned_to').references(() => users.id),
  resolutionNotes: text('resolution_notes'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  resolvedAt: timestamp('resolved_at', { withTimezone: true }),
});
